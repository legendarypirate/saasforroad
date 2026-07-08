const db = require("../models");
const LeaveRequest = db.leave_requests;
const User = db.users;
const Op = db.Sequelize.Op;
const {
  computeLeaveTotalHours,
  computeHoursBetween,
  parseInstant,
} = require("../utils/leaveCalculator");

const userInclude = {
  model: User,
  as: "user",
  attributes: ["id", "username", "phone", "email"],
};

const reviewerInclude = {
  model: User,
  as: "reviewer",
  attributes: ["id", "username"],
  required: false,
};

function resolveLeaveWindow(body) {
  const {
    start_at,
    end_at,
    start_date,
    end_date,
    start_time,
    end_time,
  } = body;

  let startAt = parseInstant(start_at);
  let endAt = parseInstant(end_at);

  if ((!startAt || !endAt) && start_date && end_date) {
    const startPart = start_time ? String(start_time).slice(0, 5) : "00:00";
    const endPart = end_time ? String(end_time).slice(0, 5) : "23:59";
    startAt = parseInstant(`${start_date}T${startPart}:00`);
    endAt = parseInstant(`${end_date}T${endPart}:00`);
  }

  if (startAt && endAt) {
    if (endAt <= startAt) {
      const err = new Error("Дуусах цаг эхлэх цагаас хойш байх ёстой");
      err.statusCode = 400;
      throw err;
    }
    return {
      start_at: startAt,
      end_at: endAt,
      start_date: startAt.toISOString().slice(0, 10),
      end_date: endAt.toISOString().slice(0, 10),
    };
  }

  const err = new Error("Эхлэх, дуусах огноо болон цаг шаардлагатай");
  err.statusCode = 400;
  throw err;
}

async function assertNoOverlap(userId, window, excludeId = null) {
  const where = {
    user_id: userId,
    status: { [Op.in]: ["pending", "approved"] },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const existing = await LeaveRequest.findAll({ where });
  for (const row of existing) {
    if (row.start_at && row.end_at) {
      const rs = new Date(row.start_at);
      const re = new Date(row.end_at);
      if (rs < window.end_at && re > window.start_at) {
        const err = new Error("Энэ хугацаанд өөр чөлөөний хүсэлт байна");
        err.statusCode = 409;
        throw err;
      }
    } else if (
      row.start_date <= window.end_date &&
      row.end_date >= window.start_date
    ) {
      const err = new Error("Энэ хугацаанд өөр чөлөөний хүсэлт байна");
      err.statusCode = 409;
      throw err;
    }
  }
}

exports.create = async (req, res) => {
  const user_id = req.user?.id || req.body.user_id;
  const { leave_type, hours, reason } = req.body;

  if (!user_id) {
    return res.status(400).send({ success: false, message: "user_id шаардлагатай" });
  }
  if (!leave_type || !["paid", "unpaid"].includes(leave_type)) {
    return res.status(400).send({
      success: false,
      message: "leave_type: paid эсвэл unpaid байх ёстой",
    });
  }
  if (!reason || !String(reason).trim()) {
    return res.status(400).send({ success: false, message: "Шалтгаан бичнэ үү" });
  }

  try {
    const window = resolveLeaveWindow(req.body);

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

    await assertNoOverlap(user_id, window);

    const draft = {
      start_date: window.start_date,
      end_date: window.end_date,
      start_at: window.start_at,
      end_at: window.end_at,
      hours,
    };
    const totalHours = computeLeaveTotalHours(user, draft, []);

    if (totalHours <= 0) {
      return res.status(400).send({
        success: false,
        message: "Сонгосон хугацаанд тооцогдох цаг байхгүй байна",
      });
    }

    const data = await LeaveRequest.create({
      user_id,
      leave_type,
      start_date: window.start_date,
      end_date: window.end_date,
      start_at: window.start_at,
      end_at: window.end_at,
      hours: hours !== undefined && hours !== null && hours !== "" ? Number(hours) : null,
      total_hours: totalHours,
      reason: String(reason).trim(),
      status: "pending",
    });

    const row = await LeaveRequest.findByPk(data.id, {
      include: [userInclude],
    });

    res.send({
      success: true,
      message: "Чөлөөний хүсэлт амжилттай илгээгдлээ",
      data: row,
    });
  } catch (err) {
    res.status(err.statusCode || 500).send({ success: false, message: err.message });
  }
};

exports.previewHours = async (req, res) => {
  const { start_at, end_at } = req.body;
  try {
    const window = resolveLeaveWindow({ start_at, end_at });
    const totalHours = computeHoursBetween(window.start_at, window.end_at);
    res.send({
      success: true,
      data: {
        total_hours: totalHours,
        start_at: window.start_at,
        end_at: window.end_at,
      },
    });
  } catch (err) {
    res.status(err.statusCode || 500).send({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { status, user_id, from, to } = req.query;
  const where = {};

  if (status) where.status = status;
  if (user_id) where.user_id = user_id;
  if (from && to) {
    where[Op.and] = [
      { start_date: { [Op.lte]: to } },
      { end_date: { [Op.gte]: from } },
    ];
  }

  try {
    const data = await LeaveRequest.findAll({
      where,
      include: [userInclude, reviewerInclude],
      order: [["createdAt", "DESC"]],
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.findByUser = async (req, res) => {
  const userId = req.params.userId;
  try {
    const data = await LeaveRequest.findAll({
      where: { user_id: userId },
      include: [reviewerInclude],
      order: [["createdAt", "DESC"]],
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.review = async (req, res) => {
  const id = req.params.id;
  const { status, reviewed_by, review_note } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).send({
      success: false,
      message: "status: approved эсвэл rejected байх ёстой",
    });
  }

  try {
    const row = await LeaveRequest.findByPk(id, { include: [userInclude] });
    if (!row) {
      return res.status(404).send({ success: false, message: "Хүсэлт олдсонгүй" });
    }
    if (row.status !== "pending") {
      return res.status(400).send({
        success: false,
        message: "Энэ хүсэлт аль хэдийн шийдвэрлэгдсэн байна",
      });
    }

    if (status === "approved") {
      const window = {
        start_at: row.start_at || parseInstant(`${row.start_date}T00:00:00`),
        end_at: row.end_at || parseInstant(`${row.end_date}T23:59:59`),
        start_date: row.start_date,
        end_date: row.end_date,
      };
      await assertNoOverlap(row.user_id, window, row.id);
    }

    await row.update({
      status,
      reviewed_by: reviewed_by || null,
      reviewed_at: new Date(),
      review_note: review_note || null,
    });

    const refreshed = await LeaveRequest.findByPk(id, {
      include: [userInclude, reviewerInclude],
    });

    res.send({
      success: true,
      message: status === "approved" ? "Чөлөө зөвшөөрөгдлөө" : "Чөлөөний хүсэлт татгалзлаа",
      data: refreshed,
    });
  } catch (err) {
    res.status(err.statusCode || 500).send({ success: false, message: err.message });
  }
};
