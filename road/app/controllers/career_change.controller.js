const db = require("../models");
const CareerChange = db.career_changes;
const User = db.users;

exports.create = async (req, res) => {
  const { user_id, order_number, position, effective_date, contract_end_date } = req.body;

  if (!user_id) {
    return res.status(400).send({ success: false, message: "user_id шаардлагатай" });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).send({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }

    const data = await CareerChange.create({
      user_id,
      order_number,
      position,
      effective_date,
      contract_end_date,
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { user_id } = req.query;
  const where = {};
  if (user_id) where.user_id = user_id;

  try {
    const data = await CareerChange.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await CareerChange.destroy({ where: { id } });
    if (num === 1) {
      return res.send({ success: true, message: "Мэдээлэл устгагдлаа" });
    }
    return res.status(404).send({ success: false, message: "Мэдээлэл олдсонгүй" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};
