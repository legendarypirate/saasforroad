const db = require('../models');
const FamilyMember = db.family_members;
const User = db.users;

exports.create = async (req, res) => {
  const { user_id, full_name, phone, job, relation } = req.body;

  if (!user_id || !full_name) {
    return res.status(400).send({ success: false, message: 'user_id, full_name шаардлагатай' });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).send({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    }

    const data = await FamilyMember.create({ user_id, full_name, phone, job, relation });
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
    const data = await FamilyMember.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.send({ success: true, data });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  try {
    const num = await FamilyMember.destroy({ where: { id } });
    if (num === 1) {
      return res.send({ success: true, message: 'Гэр бүлийн гишүүн устгагдлаа' });
    }
    return res.status(404).send({ success: false, message: 'Мэдээлэл олдсонгүй' });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};
