const db = require("../models");
const Material = db.materials;
const Angilal = db.angilals;
const Warehouse = db.warehouses;
const Supplier = db.suppliers;
const Op = db.Sequelize.Op;
const { nextMaterialCode } = require("../services/inventoryService");

const includeAll = [
  { model: Angilal, as: "category", attributes: ["id", "name"], required: false },
  { model: Warehouse, as: "defaultWarehouse", attributes: ["id", "name"], required: false },
  { model: Supplier, as: "defaultSupplier", attributes: ["id", "name"], required: false },
];

exports.create = async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Барааны нэр шаардлагатай" });
  }
  try {
    const code = req.body.code?.trim() || (await nextMaterialCode());
    const data = await Material.create({
      code,
      name: name.trim(),
      category_id: req.body.category_id || null,
      brand: req.body.brand || null,
      specification: req.body.specification || null,
      unit: req.body.unit || "ширхэг",
      barcode: req.body.barcode || null,
      description: req.body.description || null,
      image_url: req.body.image_url || null,
      status: req.body.status || "active",
      min_stock: req.body.min_stock ?? 0,
      max_stock: req.body.max_stock ?? 0,
      reorder_level: req.body.reorder_level ?? 0,
      default_warehouse_id: req.body.default_warehouse_id || null,
      default_supplier_id: req.body.default_supplier_id || null,
      standard_cost: req.body.standard_cost ?? 0,
      average_cost: req.body.average_cost ?? req.body.standard_cost ?? 0,
      last_purchase_price: req.body.last_purchase_price ?? 0,
      is_consumable: req.body.is_consumable !== false,
      is_asset: !!req.body.is_asset,
      is_active: req.body.is_active !== false,
    });
    const full = await Material.findByPk(data.id, { include: includeAll });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { q, category_id, barcode, is_active } = req.query;
  const where = { deleted_at: null };
  if (q) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { code: { [Op.iLike]: `%${q}%` } },
      { barcode: { [Op.iLike]: `%${q}%` } },
      { brand: { [Op.iLike]: `%${q}%` } },
    ];
  }
  if (category_id) where.category_id = category_id;
  if (barcode) where.barcode = barcode;
  if (is_active === "true") where.is_active = true;
  if (is_active === "false") where.is_active = false;

  try {
    const data = await Material.findAll({
      where,
      include: includeAll,
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await Material.findByPk(req.params.id, { include: includeAll });
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
    const row = await Material.findByPk(req.params.id);
    if (!row || row.deleted_at) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    const fields = [
      "name", "code", "category_id", "brand", "specification", "unit", "barcode",
      "description", "image_url", "status", "min_stock", "max_stock", "reorder_level",
      "default_warehouse_id", "default_supplier_id", "standard_cost", "average_cost",
      "last_purchase_price", "is_consumable", "is_asset", "is_active",
    ];
    const updates = {};
    for (const f of fields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (updates.name) updates.name = String(updates.name).trim();
    await row.update(updates);
    const full = await Material.findByPk(row.id, { include: includeAll });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const row = await Material.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({ deleted_at: new Date(), is_active: false, status: "inactive" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
