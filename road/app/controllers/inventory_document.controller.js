const db = require("../models");
const InvDocument = db.inv_documents;
const InvStockMovement = db.inv_stock_movements;
const Material = db.materials;
const Op = db.Sequelize.Op;
const inventory = require("../services/inventoryService");

const docInclude = [
  {
    model: db.inv_document_lines,
    as: "lines",
    include: [{ model: Material, as: "material", attributes: ["id", "name", "code", "unit"] }],
  },
  { model: db.warehouses, as: "warehouse", attributes: ["id", "name"] },
  { model: db.warehouses, as: "toWarehouse", attributes: ["id", "name"] },
  { model: db.projects, as: "project", attributes: ["id", "name"] },
  { model: db.projects, as: "toProject", attributes: ["id", "name"] },
  { model: db.suppliers, as: "supplier", attributes: ["id", "name"] },
];

exports.create = async (req, res) => {
  try {
    const data = await inventory.createDocument({
      docType: req.body.doc_type,
      warehouseId: req.body.warehouse_id,
      toWarehouseId: req.body.to_warehouse_id,
      projectId: req.body.project_id,
      toProjectId: req.body.to_project_id,
      supplierId: req.body.supplier_id,
      receiverName: req.body.receiver_name,
      docDate: req.body.doc_date,
      remarks: req.body.remarks,
      reason: req.body.reason,
      lines: req.body.lines || [],
      createdBy: req.body.created_by,
      postImmediately: req.body.post_immediately !== false,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { doc_type, status, warehouse_id, project_id, from, to } = req.query;
  const where = {};
  if (doc_type) where.doc_type = doc_type;
  if (status) where.status = status;
  if (warehouse_id) where.warehouse_id = warehouse_id;
  if (project_id) where.project_id = project_id;
  if (from && to) where.doc_date = { [Op.between]: [from, to] };

  try {
    const data = await InvDocument.findAll({
      where,
      include: docInclude,
      order: [
        ["doc_date", "DESC"],
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
    const data = await InvDocument.findByPk(req.params.id, { include: docInclude });
    if (!data) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.post = async (req, res) => {
  try {
    const data = await inventory.postDocument(req.params.id, req.body.approved_by);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const data = await inventory.cancelDocument(
      req.params.id,
      req.body.reason,
      req.body.cancelled_by
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.movements = async (req, res) => {
  const { warehouse_id, material_id, project_id, movement_type, from, to } = req.query;
  const where = {};
  if (warehouse_id) where.warehouse_id = warehouse_id;
  if (material_id) where.material_id = material_id;
  if (project_id) where.project_id = project_id;
  if (movement_type) where.movement_type = movement_type;
  if (from && to) where.transaction_date = { [Op.between]: [from, to] };

  try {
    const data = await InvStockMovement.findAll({
      where,
      include: [
        { model: Material, as: "material", attributes: ["id", "name", "code", "unit"] },
        { model: db.warehouses, as: "warehouse", attributes: ["id", "name"] },
        { model: db.warehouses, as: "toWarehouse", attributes: ["id", "name"] },
        { model: db.projects, as: "project", attributes: ["id", "name"] },
        { model: InvDocument, as: "document", attributes: ["id", "doc_no", "doc_type"] },
      ],
      order: [
        ["transaction_date", "DESC"],
        ["id", "DESC"],
      ],
      limit: Number(req.query.limit) || 500,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const stocks = await db.stocks.findAll({
      include: [
        {
          model: Material,
          as: "material",
          attributes: ["id", "name", "code", "unit", "reorder_level", "standard_cost", "average_cost"],
        },
        { model: db.warehouses, as: "warehouse", attributes: ["id", "name"] },
      ],
    });

    let inventoryValue = 0;
    let lowStock = 0;
    let outOfStock = 0;
    stocks.forEach((s) => {
      const qty = Number(s.quantity) || 0;
      const cost = Number(s.average_cost) || Number(s.material?.average_cost) || 0;
      inventoryValue += qty * cost;
      const reorder = Number(s.material?.reorder_level) || 0;
      if (qty <= 0) outOfStock += 1;
      else if (qty <= reorder) lowStock += 1;
    });

    const today = new Date().toISOString().slice(0, 10);
    const todayDocs = await InvDocument.findAll({
      where: { doc_date: today, status: "POSTED" },
    });
    const todayReceipts = todayDocs.filter((d) => d.doc_type === "RECEIPT").length;
    const todayIssues = todayDocs.filter((d) => d.doc_type === "ISSUE").length;

    res.json({
      success: true,
      data: {
        inventoryValue: Math.round(inventoryValue),
        skuCount: stocks.length,
        lowStock,
        outOfStock,
        todayReceipts,
        todayIssues,
        warehouseCount: await db.warehouses.count({ where: { is_active: true } }),
        materialCount: await Material.count({ where: { is_active: true, deleted_at: null } }),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
