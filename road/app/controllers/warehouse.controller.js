const db = require("../models");
const Warehouse = db.warehouses;
const User = db.users;

const includeManager = [
  { model: User, as: "manager", attributes: ["id", "username", "phone"], required: false },
];

// Association may not exist yet — register lazily
if (!Warehouse.associations.manager) {
  Warehouse.belongsTo(User, { foreignKey: "manager_id", as: "manager" });
}

exports.create = async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Агуулахын нэр шаардлагатай" });
  }
  try {
    const data = await Warehouse.create({
      code: req.body.code || null,
      name: name.trim(),
      location: req.body.location || null,
      description: req.body.description || null,
      manager_id: req.body.manager_id || null,
      capacity: req.body.capacity || null,
      status: req.body.status || "active",
      is_active: req.body.is_active !== false,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const data = await Warehouse.findAll({
      where: { deleted_at: null },
      include: includeManager,
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    // fallback without manager include if association fails
    try {
      const data = await Warehouse.findAll({
        where: { deleted_at: null },
        order: [["name", "ASC"]],
      });
      res.json({ success: true, data });
    } catch (e2) {
      res.status(500).json({ success: false, message: e2.message });
    }
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await Warehouse.findByPk(req.params.id);
    if (!data || data.deleted_at) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await Warehouse.findByPk(req.params.id);
    if (!row || row.deleted_at) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    const fields = [
      "code", "name", "location", "description", "manager_id",
      "capacity", "status", "is_active",
    ];
    const updates = {};
    for (const f of fields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (updates.name) updates.name = String(updates.name).trim();
    await row.update(updates);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const row = await Warehouse.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({ deleted_at: new Date(), is_active: false, status: "inactive" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
