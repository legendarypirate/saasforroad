const db = require("../models");
const Transaction = db.transactions;
const Stock = db.stocks;
const Material = db.materials;
const Warehouse = db.warehouses;
const Project = db.projects;
const Supplier = db.suppliers;
const Op = db.Sequelize.Op;

const includeAll = [
  { model: Material, as: "material", attributes: ["id", "name", "code", "unit"] },
  { model: Warehouse, as: "warehouse", attributes: ["id", "name", "location"] },
  { model: Project, as: "project", attributes: ["id", "name"], required: false },
];

async function applyStockDelta(itemId, warehouseId, delta, transaction) {
  let stock = await Stock.findOne({
    where: { item_id: itemId, warehouse_id: warehouseId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!stock) {
    if (delta < 0) {
      const err = new Error("Агуулахад үлдэгдэл байхгүй");
      err.statusCode = 400;
      throw err;
    }
    stock = await Stock.create(
      { item_id: itemId, warehouse_id: warehouseId, quantity: delta },
      { transaction }
    );
    return stock;
  }

  const nextQty = Number(stock.quantity) + delta;
  if (nextQty < 0) {
    const err = new Error(
      `Үлдэгдэл хүрэлцэхгүй (одоо: ${stock.quantity}, шаардлагатай: ${Math.abs(delta)})`
    );
    err.statusCode = 400;
    throw err;
  }

  await stock.update({ quantity: nextQty }, { transaction });
  return stock;
}

function movementDelta(type, quantity) {
  const qty = Number(quantity) || 0;
  return type === "in" ? qty : -qty;
}

exports.create = async (req, res) => {
  const {
    item_id,
    warehouse_id,
    type,
    quantity,
    unit_price,
    description,
    project_id,
    date,
    supplier_id,
  } = req.body;

  if (!item_id || !warehouse_id || !type || !quantity) {
    return res.status(400).json({
      success: false,
      message: "Бараа, агуулах, төрөл, тоо хэмжээ шаардлагатай",
    });
  }
  if (!["in", "out"].includes(type)) {
    return res.status(400).json({ success: false, message: "Төрөл in эсвэл out байна" });
  }
  if (Number(quantity) <= 0) {
    return res.status(400).json({ success: false, message: "Тоо хэмжээ 0-ээс их байх ёстой" });
  }

  const t = await db.sequelize.transaction();
  try {
    const material = await Material.findByPk(item_id);
    const warehouse = await Warehouse.findByPk(warehouse_id);
    if (!material || !warehouse) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Бараа эсвэл агуулах олдсонгүй" });
    }

    const qty = Number(quantity);
    const price = unit_price != null ? Number(unit_price) : null;
    const total = price != null ? price * qty : null;

    const row = await Transaction.create(
      {
        item_id,
        warehouse_id,
        type,
        quantity: qty,
        unit_price: price,
        total_price: total,
        description: description || null,
        project_id: project_id || null,
        date: date || new Date().toISOString().slice(0, 10),
        supplier_id: supplier_id || null,
      },
      { transaction: t }
    );

    await applyStockDelta(item_id, warehouse_id, movementDelta(type, qty), t);
    await t.commit();

    const full = await Transaction.findByPk(row.id, { include: includeAll });
    res.json({ success: true, data: full });
  } catch (err) {
    await t.rollback();
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { type, warehouse_id, item_id, project_id, from, to } = req.query;
  const where = {};
  if (type) where.type = type;
  if (warehouse_id) where.warehouse_id = warehouse_id;
  if (item_id) where.item_id = item_id;
  if (project_id) where.project_id = project_id;
  if (from && to) where.date = { [Op.between]: [from, to] };
  else if (from) where.date = { [Op.gte]: from };
  else if (to) where.date = { [Op.lte]: to };

  try {
    const data = await Transaction.findAll({
      where,
      include: includeAll,
      order: [
        ["date", "DESC"],
        ["id", "DESC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await Transaction.findByPk(req.params.id, { include: includeAll });
    if (!data) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: "Хөдөлгөөн засах боломжгүй. Устгаад дахин бүртгэнэ үү.",
  });
};

exports.delete = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const row = await Transaction.findByPk(req.params.id, { transaction: t });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }

    // Reverse stock effect
    const reverseDelta = -movementDelta(row.type, row.quantity);
    await applyStockDelta(row.item_id, row.warehouse_id, reverseDelta, t);
    await row.destroy({ transaction: t });
    await t.commit();

    res.json({ success: true, message: "Устгагдлаа, үлдэгдэл буцаагдлаа" });
  } catch (err) {
    await t.rollback();
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
