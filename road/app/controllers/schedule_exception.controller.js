const db = require("../models");
const ScheduleException = db.schedule_exceptions;
const User = db.users;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  const { user_id, start_date, end_date, override_type, reason } = req.body;

  if (!user_id || !start_date || !end_date || !override_type) {
    return res.status(400).send({
      success: false,
      message: "user_id, start_date, end_date, override_type шаардлагатай",
    });
  }

  if (start_date > end_date) {
    return res.status(400).send({
      success: false,
      message: "Эхлэх огноо дуусах огноonoos хойш байж болохгүй",
    });
  }

  const allowed = ["skip_rest", "force_rest"];
  if (!allowed.includes(override_type)) {
    return res.status(400).send({
      success: false,
      message: "override_type: skip_rest эсвэл force_rest",
    });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).send({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }

    const data = await ScheduleException.create({
      user_id,
      start_date,
      end_date,
      override_type,
      reason,
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { user_id, from, to } = req.query;
  const where = {};

  if (user_id) where.user_id = user_id;
  if (from && to) {
    where.start_date = { [Op.lte]: to };
    where.end_date = { [Op.gte]: from };
  }

  try {
    const data = await ScheduleException.findAll({
      where,
      order: [["start_date", "DESC"]],
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await ScheduleException.destroy({ where: { id } });
    if (num === 1) {
      return res.send({ success: true, message: "Exception устгагдлаа" });
    }
    return res.status(404).send({ success: false, message: "Олдсонгүй" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};
