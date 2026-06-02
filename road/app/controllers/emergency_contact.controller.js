const db = require('../models');
const EmergencyContact = db.emergency_contacts;
const User = db.users;

exports.create = async (req, res) => {
  const { user_id, name, relation, phone, address } = req.body;

  if (!user_id || !name || !phone) {
    return res.status(400).send({ success: false, message: 'user_id, name, phone шаардлагатай' });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).send({ success: false, message: 'Хэрэглэгч олдсонгүй' });
    }

    const data = await EmergencyContact.create({ user_id, name, relation, phone, address });
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
    const data = await EmergencyContact.findAll({
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
    const num = await EmergencyContact.destroy({ where: { id } });
    if (num === 1) {
      return res.send({ success: true, message: 'Холбоо барих хүн устгагдлаа' });
    }
    return res.status(404).send({ success: false, message: 'Мэдээлэл олдсонгүй' });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
};
