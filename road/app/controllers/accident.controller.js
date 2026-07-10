const db = require("../models");
const Accident = db.accidents;
const User = db.users;
const Project = db.projects;
const Op = db.Sequelize.Op;

const include = [
  { model: User, as: "reporter", attributes: ["id", "username", "phone"], required: false },
  { model: Project, as: "project", attributes: ["id", "name"], required: false },
];

exports.create = async (req, res) => {
  if (!req.body.description || !req.body.user_id) {
    return res.status(400).json({ success: false, message: "description, user_id шаардлагатай" });
  }

  try {
    const data = await Accident.create({
      description: req.body.description,
      location: req.body.location || "",
      user_id: req.body.user_id,
      project_id: req.body.project_id || null,
      staff_id: req.body.staff_id || null,
      status: req.body.status ?? 0,
    });
    const full = await Accident.findByPk(data.id, {
      include: [{ model: User, attributes: ["id", "username"] }],
    });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.location) where.location = { [Op.iLike]: `%${req.query.location}%` };
    if (req.query.status !== undefined) where.status = req.query.status;

    const data = await Accident.findAll({
      where,
      include: [{ model: User, attributes: ["id", "username", "phone"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await Accident.findByPk(req.params.id, {
      include: [{ model: User, attributes: ["id", "username"] }],
    });
    if (!data) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await Accident.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });

    await row.update({
      description: req.body.description ?? row.description,
      location: req.body.location ?? row.location,
      project_id: req.body.project_id !== undefined ? req.body.project_id : row.project_id,
      staff_id: req.body.staff_id !== undefined ? req.body.staff_id : row.staff_id,
      status: req.body.status !== undefined ? req.body.status : row.status,
    });

    const full = await Accident.findByPk(row.id, {
      include: [{ model: User, attributes: ["id", "username"] }],
    });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const num = await Accident.destroy({ where: { id: req.params.id } });
    if (num !== 1) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
