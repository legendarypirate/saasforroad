const db = require("../models");
const Angilal = db.angilals;

exports.create = async (req, res) => {
  const { name, parent_id } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Ангиллын нэр шаардлагатай" });
  }
  try {
    const data = await Angilal.create({
      name: name.trim(),
      parent_id: parent_id || null,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const data = await Angilal.findAll({ order: [["name", "ASC"]] });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await Angilal.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await Angilal.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({
      name: req.body.name !== undefined ? req.body.name.trim() : row.name,
      parent_id: req.body.parent_id !== undefined ? req.body.parent_id || null : row.parent_id,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const num = await Angilal.destroy({ where: { id: req.params.id } });
    if (!num) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
