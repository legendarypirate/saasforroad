const db = require("../models");
const LeaveRequest = db.leave_requests;
const User = db.users;
const Op = db.Sequelize.Op;
const { computeLeaveTotalHours } = require("../utils/leaveCalculator");

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

function validateDates(startDate, endDate) {
  if (!startDate || !endDate) {
    const err = new Error("Эхлэх болон дуусах огноо шаардлагатай");
    err.statusCode = 400;
    throw err;
  }
  if (endDate < startDate) {
    const err = new Error("Дуусах огноо эхлэх огнооноос өмнө байж болохгүй");
    err.statusCode = 400;
    throw err;
  }
}

async function assertNoOverlap(userId, startDate, endDate, excludeId = null) {
  const where = {
    user_id: userId,
    status: { [Op.in]: ["pending", "approved"] },
    start_date: { [Op.lte]: endDate },
    end_date: { [Op.gte]: startDate },
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const existing = await LeaveRequest.findOne({ where });
  if (existing) {
    const err = new Error("Энэ хугацаанд өөр чөлөөний хүсэлт байна");
    err.statusCode = 409;
    throw err;
  }
}

exports.create = async (req, res) => {
  const { user_id, leave_type, start_date, end_date, hours, reason } = req.body;

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
    validateDates(start_date, end_date);

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

    await assertNoOverlap(user_id, start_date, end_date);

    const draft = { start_date, end_date, hours };
    const totalHours = computeLeaveTotalHours(user, draft, []);

    if (totalHours <= 0) {
      return res.status(400).send({
        success: false,
        message: "Сонгосон хугацаанд ажлын өдөр байхгүй байна",
      });
    }

    const data = await LeaveRequest.create({
      user_id,
      leave_type,
      start_date,
      end_date,
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

exports.findAll = async (req, res) => {
  const { status, user_id, from, to } = req.query;
  const where = {};

  if (status) where.status = status;
  if (user_id) where.user_id = user_id;
  if (from && to) {
    where.start_date = { [Op.lte]: to };
    where.end_date = { [Op.gte]: from };
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
      await assertNoOverlap(row.user_id, row.start_date, row.end_date, row.id);
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
