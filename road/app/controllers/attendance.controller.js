const db = require("../models");
const Attendance = db.attendances;
const User = db.users;
const ScheduleException = db.schedule_exceptions;
const Op = db.Sequelize.Op;
const {
  buildCalendarMonth,
  summarizePeriod,
  monthRange,
  getScheduleLabel,
} = require("../utils/attendanceCalculator");
const { validateGeofence } = require("../utils/geo");

const OfficeLocation = db.office_locations;

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function resolveGeofence(latitude, longitude) {
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    const err = new Error("Байршлын зөвшөөрөл шаардлагатай. GPS асаана уу.");
    err.statusCode = 400;
    throw err;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    const err = new Error("Байршлын координат буруу байна");
    err.statusCode = 400;
    throw err;
  }

  const offices = await OfficeLocation.findAll({ where: { is_active: true } });
  const result = validateGeofence(lat, lng, offices);
  if (!result.ok) {
    const err = new Error(result.message);
    err.statusCode = 403;
    err.distanceMeters = result.distanceMeters;
    err.office = result.office;
    throw err;
  }

  return {
    latitude: String(lat),
    longitude: String(lng),
    office_location_id: result.office.id,
    distance_meters: result.distanceMeters,
    office_name: result.office.name,
  };
}

async function fetchExceptions(userId, from, to) {
  return ScheduleException.findAll({
    where: {
      user_id: userId,
      start_date: { [Op.lte]: to },
      end_date: { [Op.gte]: from },
    },
    order: [["start_date", "ASC"]],
  });
}

async function fetchExceptionsForUsers(userIds, from, to) {
  if (!userIds.length) return {};
  const rows = await ScheduleException.findAll({
    where: {
      user_id: userIds,
      start_date: { [Op.lte]: to },
      end_date: { [Op.gte]: from },
    },
    order: [["start_date", "ASC"]],
  });
  const grouped = {};
  rows.forEach((row) => {
    if (!grouped[row.user_id]) grouped[row.user_id] = [];
    grouped[row.user_id].push(row);
  });
  return grouped;
}

exports.checkIn = async (req, res) => {
  const { user_id, notes, latitude, longitude } = req.body;
  if (!user_id) {
    return res.status(400).send({ success: false, message: "user_id шаардлагатай" });
  }

  const workDate = todayDateString();

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).send({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }

    let record = await Attendance.findOne({
      where: { user_id, work_date: workDate },
    });

    const now = new Date();
    const location = await resolveGeofence(latitude, longitude);

    if (record) {
      await record.update({
        check_in_at: now,
        status: "present",
        notes: notes || record.notes,
        latitude: location.latitude,
        longitude: location.longitude,
        office_location_id: location.office_location_id,
        distance_meters: location.distance_meters,
      });
    } else {
      record = await Attendance.create({
        user_id,
        work_date: workDate,
        check_in_at: now,
        status: "present",
        notes,
        latitude: location.latitude,
        longitude: location.longitude,
        office_location_id: location.office_location_id,
        distance_meters: location.distance_meters,
      });
    }

    res.send({
      success: true,
      message: `Ирц амжилттай бүртгэгдлээ (${location.office_name})`,
      data: record,
    });
  } catch (err) {
    res.status(err.statusCode || 500).send({
      success: false,
      message: err.message,
      distance_meters: err.distanceMeters,
      office: err.office,
    });
  }
};

exports.checkOut = async (req, res) => {
  const { user_id, notes, latitude, longitude } = req.body;
  if (!user_id) {
    return res.status(400).send({ success: false, message: "user_id шаардлагатай" });
  }

  const workDate = todayDateString();

  try {
    let record = await Attendance.findOne({
      where: { user_id, work_date: workDate },
    });

    const location = await resolveGeofence(latitude, longitude);
    const now = new Date();

    if (record) {
      await record.update({
        check_out_at: now,
        notes: notes || record.notes,
        check_out_latitude: location.latitude,
        check_out_longitude: location.longitude,
        check_out_office_location_id: location.office_location_id,
        check_out_distance_meters: location.distance_meters,
      });
    } else {
      record = await Attendance.create({
        user_id,
        work_date: workDate,
        check_out_at: now,
        status: "present",
        notes,
        check_out_latitude: location.latitude,
        check_out_longitude: location.longitude,
        check_out_office_location_id: location.office_location_id,
        check_out_distance_meters: location.distance_meters,
      });
    }

    res.send({
      success: true,
      message: `Явц амжилттай бүртгэгдлээ (${location.office_name})`,
      data: record,
    });
  } catch (err) {
    res.status(err.statusCode || 500).send({
      success: false,
      message: err.message,
      distance_meters: err.distanceMeters,
      office: err.office,
    });
  }
};

exports.getTodayForUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const record = await Attendance.findOne({
      where: { user_id: userId, work_date: todayDateString() },
    });
    res.send({ success: true, data: record });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { date, user_id, from, to } = req.query;
  const condition = {};

  if (date) condition.work_date = date;
  if (user_id) condition.user_id = user_id;
  if (from && to) {
    condition.work_date = { [Op.between]: [from, to] };
  }

  try {
    const data = await Attendance.findAll({
      where: condition,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "phone", "email", "role", "role_id"],
          include: [{ model: db.roles, as: "roleRecord", attributes: ["id", "name"] }],
        },
      ],
      order: [["work_date", "DESC"], ["check_in_at", "DESC"]],
    });

    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.summary = async (req, res) => {
  const workDate = req.query.date || todayDateString();
  try {
    const records = await Attendance.findAll({
      where: { work_date: workDate },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "phone"],
        },
      ],
    });

    const checkedIn = records.filter((r) => r.check_in_at).length;
    const checkedOut = records.filter((r) => r.check_out_at).length;

    res.send({
      success: true,
      data: {
        date: workDate,
        total: records.length,
        checked_in: checkedIn,
        checked_out: checkedOut,
        records,
      },
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.calendarReport = async (req, res) => {
  const { user_id, month } = req.query;
  if (!user_id || !month) {
    return res.status(400).send({
      success: false,
      message: "user_id болон month (YYYY-MM) шаардлагатай",
    });
  }

  const [year, mon] = String(month).split("-").map(Number);
  if (!year || !mon) {
    return res.status(400).send({ success: false, message: "month формат буруу" });
  }

  try {
    const user = await User.findByPk(user_id, {
      attributes: [
        "id",
        "username",
        "work_schedule_type",
        "cycle_start_date",
        "cycle_work_days",
        "cycle_rest_days",
        "daily_work_hours",
        "extended_cycle",
      ],
    });
    if (!user) {
      return res.status(404).send({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }

    const { from, to } = monthRange(year, mon);
    const [records, exceptions] = await Promise.all([
      Attendance.findAll({
        where: { user_id, work_date: { [Op.between]: [from, to] } },
      }),
      fetchExceptions(user_id, from, to),
    ]);

    const byDate = {};
    records.forEach((r) => {
      byDate[r.work_date] = r;
    });

    const days = buildCalendarMonth(user, year, mon, byDate, exceptions);
    const summary = summarizePeriod(user, from, to, records, exceptions);

    res.send({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          work_schedule_type: user.work_schedule_type || "office_8h",
          scheduleLabel: getScheduleLabel(user),
          cycle_start_date: user.cycle_start_date,
          cycle_work_days: user.cycle_work_days,
          cycle_rest_days: user.cycle_rest_days,
          daily_work_hours: user.daily_work_hours,
          extended_cycle: user.extended_cycle,
        },
        month,
        from,
        to,
        days,
        summary,
        exceptions,
      },
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.payrollSummary = async (req, res) => {
  const { month, user_id } = req.query;
  if (!month) {
    return res.status(400).send({
      success: false,
      message: "month (YYYY-MM) шаардлагатай",
    });
  }

  const [year, mon] = String(month).split("-").map(Number);
  if (!year || !mon) {
    return res.status(400).send({ success: false, message: "month формат буруу" });
  }

  const { from, to } = monthRange(year, mon);

  try {
    const userWhere = user_id ? { id: user_id } : {};
    const users = await User.findAll({
      where: userWhere,
      attributes: [
        "id",
        "username",
        "phone",
        "work_schedule_type",
        "cycle_start_date",
        "cycle_work_days",
        "cycle_rest_days",
        "daily_work_hours",
        "extended_cycle",
      ],
      order: [["username", "ASC"]],
    });

    const records = await Attendance.findAll({
      where: {
        work_date: { [Op.between]: [from, to] },
        ...(user_id ? { user_id } : {}),
      },
    });

    const userIds = users.map((u) => u.id);
    const exceptionsByUser = await fetchExceptionsForUsers(userIds, from, to);

    const byUser = {};
    records.forEach((r) => {
      if (!byUser[r.user_id]) byUser[r.user_id] = [];
      byUser[r.user_id].push(r);
    });

    const rows = users.map((user) =>
      summarizePeriod(
        user,
        from,
        to,
        byUser[user.id] || [],
        exceptionsByUser[user.id] || []
      )
    );

    res.send({
      success: true,
      data: {
        month,
        from,
        to,
        rows,
      },
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.updateSchedule = async (req, res) => {
  const userId = req.params.userId;
  const {
    work_schedule_type,
    cycle_start_date,
    cycle_work_days,
    cycle_rest_days,
    daily_work_hours,
    extended_cycle,
  } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }

    await user.update({
      work_schedule_type: work_schedule_type ?? user.work_schedule_type,
      cycle_start_date: cycle_start_date ?? user.cycle_start_date,
      cycle_work_days: cycle_work_days ?? user.cycle_work_days,
      cycle_rest_days: cycle_rest_days ?? user.cycle_rest_days,
      daily_work_hours: daily_work_hours ?? user.daily_work_hours,
      extended_cycle:
        extended_cycle !== undefined ? extended_cycle : user.extended_cycle,
    });

    res.send({ success: true, data: user });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};
