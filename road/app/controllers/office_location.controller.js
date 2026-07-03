const db = require("../models");
const OfficeLocation = db.office_locations;

exports.findAll = async (req, res) => {
  const activeOnly = req.query.active === "true" || req.query.active === "1";
  try {
    const data = await OfficeLocation.findAll({
      where: activeOnly ? { is_active: true } : undefined,
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await OfficeLocation.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, latitude, longitude, radius_meters, address, is_active } = req.body;
  if (!name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      message: "Нэр, latitude, longitude заавал.",
    });
  }

  try {
    const data = await OfficeLocation.create({
      name,
      latitude,
      longitude,
      radius_meters: radius_meters ?? 100,
      address,
      is_active: is_active !== false,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await OfficeLocation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update(req.body);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const num = await OfficeLocation.destroy({ where: { id: req.params.id } });
    if (!num) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
