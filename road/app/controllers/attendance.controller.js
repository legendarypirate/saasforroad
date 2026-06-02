const db = require("../models");
const Attendance = db.attendances;
const User = db.users;
const Op = db.Sequelize.Op;

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
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

    if (record && record.check_in_at) {
      return res.status(400).send({
        success: false,
        message: "Өнөөдөр ирц аль хэдийн бүртгэгдсэн байна",
        data: record,
      });
    }

    const now = new Date();
    if (record) {
      await record.update({
        check_in_at: now,
        status: "present",
        notes: notes || record.notes,
        latitude: latitude || record.latitude,
        longitude: longitude || record.longitude,
      });
    } else {
      record = await Attendance.create({
        user_id,
        work_date: workDate,
        check_in_at: now,
        status: "present",
        notes,
        latitude,
        longitude,
      });
    }

    res.send({ success: true, message: "Ирц амжилттай бүртгэгдлээ", data: record });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.checkOut = async (req, res) => {
  const { user_id, notes } = req.body;
  if (!user_id) {
    return res.status(400).send({ success: false, message: "user_id шаардлагатай" });
  }

  const workDate = todayDateString();

  try {
    const record = await Attendance.findOne({
      where: { user_id, work_date: workDate },
    });

    if (!record || !record.check_in_at) {
      return res.status(400).send({
        success: false,
        message: "Эхлээд ирц бүртгэнэ үү",
      });
    }

    if (record.check_out_at) {
      return res.status(400).send({
        success: false,
        message: "Явц аль хэдийн бүртгэгдсэн",
        data: record,
      });
    }

    await record.update({
      check_out_at: new Date(),
      notes: notes || record.notes,
    });

    res.send({ success: true, message: "Явц амжилттай бүртгэгдлээ", data: record });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
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
