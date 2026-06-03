const db = require("../models");
const UserAward = db.user_awards;
const User = db.users;

exports.create = async (req, res) => {
  const { user_id, award_type, award_name, award_date } = req.body;

  if (!user_id || !award_type) {
    return res.status(400).send({ success: false, message: "user_id, award_type шаардлагатай" });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).send({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }

    const data = await UserAward.create({
      user_id,
      award_type,
      award_name,
      award_date,
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { user_id, award_type } = req.query;
  const where = {};
  if (user_id) where.user_id = user_id;
  if (award_type) where.award_type = award_type;

  try {
    const data = await UserAward.findAll({
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
    const num = await UserAward.destroy({ where: { id } });
    if (num === 1) {
      return res.send({ success: true, message: "Мэдээлэл устгагдлаа" });
    }
    return res.status(404).send({ success: false, message: "Мэдээлэл олдсонгүй" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};
