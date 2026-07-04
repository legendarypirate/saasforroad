const db = require("../models");
const Stock = db.stocks;
const Material = db.materials;
const Warehouse = db.warehouses;

const includeAll = [
  {
    model: Material,
    as: "material",
    attributes: [
      "id", "name", "code", "unit", "reorder_level", "min_stock", "max_stock",
      "standard_cost", "average_cost",
    ],
  },
  { model: Warehouse, as: "warehouse", attributes: ["id", "name", "location"] },
];

exports.findAll = async (req, res) => {
  const { warehouse_id, material_id, low_stock } = req.query;
  const where = {};
  if (warehouse_id) where.warehouse_id = warehouse_id;
  if (material_id) where.item_id = material_id;

  try {
    let data = await Stock.findAll({
      where,
      include: includeAll,
      order: [["id", "ASC"]],
    });

    const rows = data.map((row) => {
      const plain = row.toJSON();
      const qty = Number(plain.quantity) || 0;
      const reserved = Number(plain.reserved_quantity) || 0;
      const reorder = Number(plain.material?.reorder_level) || 0;
      const avgCost = Number(plain.average_cost) || Number(plain.material?.average_cost) || 0;
      return {
        ...plain,
        available_quantity: qty - reserved,
        is_low: qty > 0 && qty <= reorder,
        is_out: qty <= 0,
        stock_value: Math.round(qty * avgCost),
      };
    });

    const filtered =
      low_stock === "true" || low_stock === "1"
        ? rows.filter((r) => r.is_low || r.is_out)
        : rows;

    res.json({
      success: true,
      data: filtered,
      totals: {
        skuCount: filtered.length,
        lowStockCount: filtered.filter((r) => r.is_low).length,
        outOfStockCount: filtered.filter((r) => r.is_out).length,
        totalValue: filtered.reduce((s, r) => s + (r.stock_value || 0), 0),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await Stock.findByPk(req.params.id, { include: includeAll });
    if (!data) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** Direct stock create/update is disabled — use inventory documents. */
exports.create = async (_req, res) => {
  res.status(400).json({
    success: false,
    message: "Үлдэгдлийг шууд өөрчлөх боломжгүй. Орлого/зарлага/тохируулга баримт ашиглана уу.",
  });
};

exports.update = async (_req, res) => {
  res.status(400).json({
    success: false,
    message: "Үлдэгдлийг шууд өөрчлөх боломжгүй. Тохируулга (ADJUSTMENT) баримт ашиглана уу.",
  });
};

exports.delete = async (_req, res) => {
  res.status(400).json({
    success: false,
    message: "Үлдэгдэл устгах боломжгүй.",
  });
};
