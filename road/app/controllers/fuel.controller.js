const { Op } = require("sequelize");
const db = require("../models");
const { makeCrud, todayISO } = require("../utils/uniformCrud");

const Supplier = db.fuel_suppliers;
const Tank = db.fuel_tanks;
const Purchase = db.fuel_purchases;
const Issue = db.fuel_issues;
const Consumption = db.fuel_consumptions;
const Equipment = db.equipments;
const User = db.users;
const Project = db.projects;

const DEFAULT_STANDARD = 30;

const supplierInc = { model: Supplier, as: "supplier", attributes: ["id", "name", "phone", "status"], required: false };
const tankInc = {
  model: Tank,
  as: "tank",
  attributes: ["id", "name", "fuel_type", "current_stock", "capacity", "status", "location"],
  required: false,
};
const equipmentInc = {
  model: Equipment,
  as: "equipment",
  attributes: ["id", "name", "registration_number", "asset_no", "operator_user_id"],
  required: false,
};
const userInc = (as) => ({ model: User, as, attributes: ["id", "username", "position"], required: false });
const projectInc = { model: Project, as: "project", attributes: ["id", "name"], required: false };

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function nextNumber(Model, prefix) {
  const year = new Date().getFullYear();
  const like = `${prefix}-${year}-%`;
  const last = await Model.findOne({
    where: { number: { [Op.iLike]: like } },
    order: [["number", "DESC"]],
  });
  let seq = 1;
  if (last?.number) {
    const parts = String(last.number).split("-");
    const n = parseInt(parts[parts.length - 1], 10);
    if (Number.isFinite(n)) seq = n + 1;
  }
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

async function adjustTankStock(tankId, delta, transaction) {
  const tank = await Tank.findByPk(tankId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!tank) throw new Error("Сав олдсонгүй");
  const next = num(tank.current_stock) + delta;
  if (next < -0.0001) {
    throw new Error(`${tank.name}: үлдэгдэл хүрэлцэхгүй (${num(tank.current_stock).toFixed(1)} л)`);
  }
  if (next > num(tank.capacity) + 0.0001) {
    throw new Error(`${tank.name}: багтаамж хэтэрсэн (${num(tank.capacity)} л)`);
  }
  await tank.update({ current_stock: Math.max(0, next) }, { transaction });
  return tank;
}

function tankStockStatus(tank) {
  const stock = num(tank.current_stock);
  const min = num(tank.min_stock);
  if (stock <= 0) return "out_of_stock";
  if (stock <= min) return "low_stock";
  return "ok";
}

function enrichTank(row) {
  const j = row.toJSON ? row.toJSON() : { ...row };
  const capacity = num(j.capacity);
  const stock = num(j.current_stock);
  j.available_capacity = Math.max(0, capacity - stock);
  j.utilization_pct = capacity > 0 ? Math.round((stock / capacity) * 1000) / 10 : 0;
  j.stock_status = tankStockStatus(j);
  return j;
}

// ── Suppliers ─────────────────────────────────────────────
const supplierCrud = makeCrud(Supplier, {
  order: [["name", "ASC"]],
  filterWhere: (q) => {
    const where = {};
    if (q.status) where.status = q.status;
    if (q.q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q.q}%` } },
        { phone: { [Op.iLike]: `%${q.q}%` } },
        { email: { [Op.iLike]: `%${q.q}%` } },
        { tax_number: { [Op.iLike]: `%${q.q}%` } },
      ];
    }
    return where;
  },
  buildPayload: (body) => ({
    name: body.name?.trim(),
    phone: body.phone || null,
    email: body.email || null,
    address: body.address || null,
    tax_number: body.tax_number || null,
    status: body.status || "active",
    notes: body.notes || null,
  }),
  beforeCreate: async (payload) => {
    if (!payload.name) throw new Error("Нийлүүлэгчийн нэр шаардлагатай");
  },
});

exports.listSuppliers = supplierCrud.findAll;
exports.getSupplier = supplierCrud.findOne;
exports.createSupplier = supplierCrud.create;
exports.updateSupplier = supplierCrud.update;
exports.deleteSupplier = supplierCrud.delete;

// ── Tanks ─────────────────────────────────────────────────
exports.listTanks = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.fuel_type) where.fuel_type = req.query.fuel_type;
    if (req.query.q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${req.query.q}%` } },
        { location: { [Op.iLike]: `%${req.query.q}%` } },
      ];
    }
    const rows = await Tank.findAll({ where, order: [["name", "ASC"]] });
    res.json({ success: true, data: rows.map(enrichTank) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTank = async (req, res) => {
  try {
    const row = await Tank.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data: enrichTank(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTank = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name?.trim()) return res.status(400).json({ success: false, message: "Савны нэр шаардлагатай" });
    const capacity = num(body.capacity);
    if (capacity <= 0) return res.status(400).json({ success: false, message: "Багтаамж > 0 байх ёстой" });
    const stock = body.current_stock !== undefined ? num(body.current_stock) : 0;
    if (stock < 0) return res.status(400).json({ success: false, message: "Үлдэгдэл сөрөг байж болохгүй" });
    if (stock > capacity) return res.status(400).json({ success: false, message: "Үлдэгдэл багтаамжаас их байна" });

    const row = await Tank.create({
      name: body.name.trim(),
      capacity,
      current_stock: stock,
      location: body.location || null,
      fuel_type: body.fuel_type || "diesel",
      status: body.status || "active",
      min_stock: num(body.min_stock),
      notes: body.notes || null,
    });
    res.json({ success: true, data: enrichTank(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTank = async (req, res) => {
  try {
    const row = await Tank.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const body = req.body || {};
    const capacity = body.capacity !== undefined ? num(body.capacity) : num(row.capacity);
    if (capacity <= 0) return res.status(400).json({ success: false, message: "Багтаамж > 0 байх ёстой" });
    // current_stock is owned by purchase/issue transactions — ignore direct overwrite
    if (num(row.current_stock) > capacity) {
      return res.status(400).json({ success: false, message: "Багтаамж одоогийн үлдэгдлээс бага байна" });
    }
    await row.update({
      name: body.name?.trim() || row.name,
      capacity,
      location: body.location !== undefined ? body.location : row.location,
      fuel_type: body.fuel_type || row.fuel_type,
      status: body.status || row.status,
      min_stock: body.min_stock !== undefined ? num(body.min_stock) : row.min_stock,
      notes: body.notes !== undefined ? body.notes : row.notes,
    });
    res.json({ success: true, data: enrichTank(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTank = async (req, res) => {
  try {
    const row = await Tank.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    if (num(row.current_stock) > 0) {
      return res.status(400).json({ success: false, message: "Үлдэгдэлтэй савыг устгах боломжгүй" });
    }
    await row.destroy();
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Purchases ─────────────────────────────────────────────
const purchaseInclude = [supplierInc, tankInc, userInc("creator")];

function purchaseWhere(q) {
  const where = {};
  if (q.supplier_id) where.supplier_id = q.supplier_id;
  if (q.tank_id) where.tank_id = q.tank_id;
  if (q.fuel_type) where.fuel_type = q.fuel_type;
  if (q.from || q.to) {
    where.purchase_date = {};
    if (q.from) where.purchase_date[Op.gte] = q.from;
    if (q.to) where.purchase_date[Op.lte] = q.to;
  }
  if (q.q) {
    where[Op.or] = [
      { invoice_number: { [Op.iLike]: `%${q.q}%` } },
      { notes: { [Op.iLike]: `%${q.q}%` } },
    ];
  }
  return where;
}

exports.listPurchases = async (req, res) => {
  try {
    const data = await Purchase.findAll({
      where: purchaseWhere(req.query),
      include: purchaseInclude,
      order: [["purchase_date", "DESC"], ["id", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPurchase = async (req, res) => {
  try {
    const row = await Purchase.findByPk(req.params.id, { include: purchaseInclude });
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPurchase = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const body = req.body || {};
    if (!body.supplier_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Нийлүүлэгч сонгоно уу" });
    }
    if (!body.tank_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Сав сонгоно уу" });
    }
    const quantity = num(body.quantity);
    const unit_price = num(body.unit_price);
    if (quantity <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Тоо хэмжээ > 0 байх ёстой" });
    }
    if (unit_price <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Нэгж үнэ > 0 байх ёстой" });
    }
    const total_amount = body.total_amount !== undefined ? num(body.total_amount) : quantity * unit_price;

    await adjustTankStock(body.tank_id, quantity, t);

    const row = await Purchase.create(
      {
        purchase_date: body.purchase_date || todayISO(),
        supplier_id: body.supplier_id,
        invoice_number: body.invoice_number || null,
        fuel_type: body.fuel_type || "diesel",
        quantity,
        unit_price,
        total_amount,
        tank_id: body.tank_id,
        notes: body.notes || null,
        created_by: body.created_by || null,
      },
      { transaction: t }
    );

    await t.commit();
    const full = await Purchase.findByPk(row.id, { include: purchaseInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePurchase = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const row = await Purchase.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    const body = req.body || {};
    const oldQty = num(row.quantity);
    const oldTank = row.tank_id;
    const quantity = body.quantity !== undefined ? num(body.quantity) : oldQty;
    const unit_price = body.unit_price !== undefined ? num(body.unit_price) : num(row.unit_price);
    if (quantity <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Тоо хэмжээ > 0 байх ёстой" });
    }
    if (unit_price <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Нэгж үнэ > 0 байх ёстой" });
    }
    const tank_id = body.tank_id || oldTank;

    if (tank_id === oldTank) {
      await adjustTankStock(tank_id, quantity - oldQty, t);
    } else {
      await adjustTankStock(oldTank, -oldQty, t);
      await adjustTankStock(tank_id, quantity, t);
    }

    const total_amount =
      body.total_amount !== undefined ? num(body.total_amount) : quantity * unit_price;

    await row.update(
      {
        purchase_date: body.purchase_date || row.purchase_date,
        supplier_id: body.supplier_id || row.supplier_id,
        invoice_number: body.invoice_number !== undefined ? body.invoice_number : row.invoice_number,
        fuel_type: body.fuel_type || row.fuel_type,
        quantity,
        unit_price,
        total_amount,
        tank_id,
        notes: body.notes !== undefined ? body.notes : row.notes,
      },
      { transaction: t }
    );

    await t.commit();
    const full = await Purchase.findByPk(row.id, { include: purchaseInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePurchase = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const row = await Purchase.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    await adjustTankStock(row.tank_id, -num(row.quantity), t);
    await row.destroy({ transaction: t });
    await t.commit();
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Issues ────────────────────────────────────────────────
const issueInclude = [equipmentInc, userInc("driver"), userInc("issuer"), projectInc, tankInc];

function issueWhere(q) {
  const where = {};
  if (q.equipment_id) where.equipment_id = q.equipment_id;
  if (q.driver_user_id) where.driver_user_id = q.driver_user_id;
  if (q.tank_id) where.tank_id = q.tank_id;
  if (q.fuel_type) where.fuel_type = q.fuel_type;
  if (q.project_id) where.project_id = q.project_id;
  if (q.from || q.to) {
    where.issue_date = {};
    if (q.from) where.issue_date[Op.gte] = q.from;
    if (q.to) where.issue_date[Op.lte] = q.to;
  }
  if (q.q) {
    where[Op.or] = [
      { number: { [Op.iLike]: `%${q.q}%` } },
      { notes: { [Op.iLike]: `%${q.q}%` } },
    ];
  }
  return where;
}

async function maybeCreateConsumption(issue, transaction, standardRate = DEFAULT_STANDARD) {
  const odometer = num(issue.odometer);
  if (!odometer || !issue.equipment_id) return null;

  const prev = await Issue.findOne({
    where: {
      equipment_id: issue.equipment_id,
      id: { [Op.ne]: issue.id },
      odometer: { [Op.not]: null },
      [Op.or]: [{ issue_date: { [Op.lt]: issue.issue_date } }, { issue_date: issue.issue_date, id: { [Op.lt]: issue.id } }],
    },
    order: [["issue_date", "DESC"], ["id", "DESC"]],
    transaction,
  });
  if (!prev) return null;

  const prevOdo = num(prev.odometer);
  const distance = odometer - prevOdo;
  if (distance <= 0) return null;

  const fuel_used = num(prev.quantity);
  if (fuel_used <= 0) return null;

  const rate = (fuel_used / distance) * 100;
  const standard = num(standardRate, DEFAULT_STANDARD);
  return Consumption.create(
    {
      equipment_id: issue.equipment_id,
      driver_user_id: prev.driver_user_id || issue.driver_user_id || null,
      previous_issue_id: prev.id,
      closing_issue_id: issue.id,
      period_from: prev.issue_date,
      period_to: issue.issue_date,
      distance_km: Math.round(distance * 100) / 100,
      fuel_used,
      consumption_rate: Math.round(rate * 1000) / 1000,
      standard_rate: standard,
      is_high: rate > standard,
      fuel_type: prev.fuel_type || issue.fuel_type,
      notes: null,
    },
    { transaction }
  );
}

exports.listIssues = async (req, res) => {
  try {
    const data = await Issue.findAll({
      where: issueWhere(req.query),
      include: issueInclude,
      order: [["issue_date", "DESC"], ["id", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getIssue = async (req, res) => {
  try {
    const row = await Issue.findByPk(req.params.id, { include: issueInclude });
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createIssue = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const body = req.body || {};
    if (!body.equipment_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Техник / машин сонгоно уу" });
    }
    if (!body.tank_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Сав сонгоно уу" });
    }
    const quantity = num(body.quantity);
    if (quantity <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Тоо хэмжээ > 0 байх ёстой" });
    }

    const tank = await adjustTankStock(body.tank_id, -quantity, t);

    const issue = await Issue.create(
      {
        number: body.number || (await nextNumber(Issue, "FUEL")),
        issue_date: body.issue_date || todayISO(),
        equipment_id: body.equipment_id,
        driver_user_id: body.driver_user_id || null,
        project_id: body.project_id || null,
        tank_id: body.tank_id,
        fuel_type: body.fuel_type || tank.fuel_type || "diesel",
        quantity,
        odometer: body.odometer !== undefined && body.odometer !== null && body.odometer !== "" ? num(body.odometer) : null,
        engine_hours:
          body.engine_hours !== undefined && body.engine_hours !== null && body.engine_hours !== ""
            ? num(body.engine_hours)
            : null,
        issued_by: body.issued_by || body.created_by || null,
        notes: body.notes || null,
      },
      { transaction: t }
    );

    await maybeCreateConsumption(issue, t, body.standard_rate || DEFAULT_STANDARD);

    await t.commit();
    const full = await Issue.findByPk(issue.id, { include: issueInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateIssue = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const row = await Issue.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    const body = req.body || {};
    const oldQty = num(row.quantity);
    const oldTank = row.tank_id;
    const quantity = body.quantity !== undefined ? num(body.quantity) : oldQty;
    if (quantity <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Тоо хэмжээ > 0 байх ёстой" });
    }
    const tank_id = body.tank_id || oldTank;

    // reverse old deduction, apply new
    await adjustTankStock(oldTank, oldQty, t);
    await adjustTankStock(tank_id, -quantity, t);

    await Consumption.destroy({
      where: { closing_issue_id: row.id },
      transaction: t,
    });

    await row.update(
      {
        issue_date: body.issue_date || row.issue_date,
        equipment_id: body.equipment_id || row.equipment_id,
        driver_user_id: body.driver_user_id !== undefined ? body.driver_user_id : row.driver_user_id,
        project_id: body.project_id !== undefined ? body.project_id : row.project_id,
        tank_id,
        fuel_type: body.fuel_type || row.fuel_type,
        quantity,
        odometer:
          body.odometer !== undefined
            ? body.odometer === null || body.odometer === ""
              ? null
              : num(body.odometer)
            : row.odometer,
        engine_hours:
          body.engine_hours !== undefined
            ? body.engine_hours === null || body.engine_hours === ""
              ? null
              : num(body.engine_hours)
            : row.engine_hours,
        issued_by: body.issued_by !== undefined ? body.issued_by : row.issued_by,
        notes: body.notes !== undefined ? body.notes : row.notes,
      },
      { transaction: t }
    );

    await maybeCreateConsumption(row, t, body.standard_rate || DEFAULT_STANDARD);

    await t.commit();
    const full = await Issue.findByPk(row.id, { include: issueInclude });
    res.json({ success: true, data: full });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteIssue = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const row = await Issue.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    await Consumption.destroy({
      where: {
        [Op.or]: [{ closing_issue_id: row.id }, { previous_issue_id: row.id }],
      },
      transaction: t,
    });
    await adjustTankStock(row.tank_id, num(row.quantity), t);
    await row.destroy({ transaction: t });
    await t.commit();
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Consumption ───────────────────────────────────────────
const consumptionInclude = [
  equipmentInc,
  userInc("driver"),
  { model: Issue, as: "previousIssue", attributes: ["id", "number", "issue_date", "quantity", "odometer"] },
  { model: Issue, as: "closingIssue", attributes: ["id", "number", "issue_date", "quantity", "odometer"] },
];

exports.listConsumptions = async (req, res) => {
  try {
    const where = {};
    if (req.query.equipment_id) where.equipment_id = req.query.equipment_id;
    if (req.query.driver_user_id) where.driver_user_id = req.query.driver_user_id;
    if (req.query.fuel_type) where.fuel_type = req.query.fuel_type;
    if (req.query.high_only === "1" || req.query.high_only === "true") where.is_high = true;
    if (req.query.from || req.query.to) {
      where.period_to = {};
      if (req.query.from) where.period_to[Op.gte] = req.query.from;
      if (req.query.to) where.period_to[Op.lte] = req.query.to;
    }
    const data = await Consumption.findAll({
      where,
      include: consumptionInclude,
      order: [["period_to", "DESC"], ["id", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recalcConsumptions = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const standard = num(req.body?.standard_rate, DEFAULT_STANDARD);
    await Consumption.destroy({ where: {}, transaction: t });
    const issues = await Issue.findAll({
      where: { odometer: { [Op.not]: null } },
      order: [["equipment_id", "ASC"], ["issue_date", "ASC"], ["id", "ASC"]],
      transaction: t,
    });
    const byEq = {};
    for (const issue of issues) {
      const key = issue.equipment_id;
      if (!byEq[key]) byEq[key] = [];
      byEq[key].push(issue);
    }
    let created = 0;
    for (const list of Object.values(byEq)) {
      for (let i = 1; i < list.length; i++) {
        const prev = list[i - 1];
        const curr = list[i];
        const distance = num(curr.odometer) - num(prev.odometer);
        const fuel_used = num(prev.quantity);
        if (distance <= 0 || fuel_used <= 0) continue;
        const rate = (fuel_used / distance) * 100;
        await Consumption.create(
          {
            equipment_id: curr.equipment_id,
            driver_user_id: prev.driver_user_id || curr.driver_user_id || null,
            previous_issue_id: prev.id,
            closing_issue_id: curr.id,
            period_from: prev.issue_date,
            period_to: curr.issue_date,
            distance_km: Math.round(distance * 100) / 100,
            fuel_used,
            consumption_rate: Math.round(rate * 1000) / 1000,
            standard_rate: standard,
            is_high: rate > standard,
            fuel_type: prev.fuel_type || curr.fuel_type,
          },
          { transaction: t }
        );
        created += 1;
      }
    }
    await t.commit();
    res.json({ success: true, data: { created, standard_rate: standard } });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Dashboard ─────────────────────────────────────────────
exports.dashboard = async (req, res) => {
  try {
    const today = todayISO();
    const monthStart = `${today.slice(0, 7)}-01`;

    const [purchasesToday, issuesToday, tanks, monthPurchases, monthIssues, recentPurchases, recentIssues, highCons] =
      await Promise.all([
        Purchase.findAll({ where: { purchase_date: today } }),
        Issue.findAll({ where: { issue_date: today } }),
        Tank.findAll({ where: { status: "active" } }),
        Purchase.findAll({ where: { purchase_date: { [Op.gte]: monthStart } } }),
        Issue.findAll({ where: { issue_date: { [Op.gte]: monthStart } } }),
        Purchase.findAll({
          include: purchaseInclude,
          order: [["purchase_date", "DESC"], ["id", "DESC"]],
          limit: 8,
        }),
        Issue.findAll({
          include: issueInclude,
          order: [["issue_date", "DESC"], ["id", "DESC"]],
          limit: 8,
        }),
        Consumption.findAll({
          where: { is_high: true },
          include: [equipmentInc],
          order: [["consumption_rate", "DESC"]],
          limit: 10,
        }),
      ]);

    const purchasedToday = purchasesToday.reduce((s, p) => s + num(p.quantity), 0);
    const issuedToday = issuesToday.reduce((s, p) => s + num(p.quantity), 0);
    const currentStock = tanks.reduce((s, t) => s + num(t.current_stock), 0);
    const monthlyCost = monthPurchases.reduce((s, p) => s + num(p.total_amount), 0);

    const consAll = await Consumption.findAll({
      where: { period_to: { [Op.gte]: monthStart } },
    });
    const avgConsumption =
      consAll.length > 0
        ? consAll.reduce((s, c) => s + num(c.consumption_rate), 0) / consAll.length
        : 0;

    // Monthly charts — last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push(key);
    }
    const chartStart = `${months[0]}-01`;
    const [chartPurchases, chartIssues] = await Promise.all([
      Purchase.findAll({ where: { purchase_date: { [Op.gte]: chartStart } } }),
      Issue.findAll({ where: { issue_date: { [Op.gte]: chartStart } } }),
    ]);

    const monthly_purchase = months.map((m) => {
      const rows = chartPurchases.filter((p) => String(p.purchase_date).startsWith(m));
      return {
        month: m,
        quantity: Math.round(rows.reduce((s, p) => s + num(p.quantity), 0) * 10) / 10,
        cost: Math.round(rows.reduce((s, p) => s + num(p.total_amount), 0)),
      };
    });
    const monthly_consumption = months.map((m) => {
      const rows = chartIssues.filter((p) => String(p.issue_date).startsWith(m));
      return {
        month: m,
        quantity: Math.round(rows.reduce((s, p) => s + num(p.quantity), 0) * 10) / 10,
      };
    });
    const cost_trend = monthly_purchase.map((p) => ({ month: p.month, cost: p.cost }));

    res.json({
      success: true,
      data: {
        purchased_today: Math.round(purchasedToday * 10) / 10,
        issued_today: Math.round(issuedToday * 10) / 10,
        current_stock: Math.round(currentStock * 10) / 10,
        monthly_cost: Math.round(monthlyCost),
        average_consumption: Math.round(avgConsumption * 100) / 100,
        high_consumption_count: highCons.length,
        high_consumption: highCons.map((c) => ({
          id: c.id,
          equipment: c.equipment
            ? `${c.equipment.name}${c.equipment.registration_number ? ` (${c.equipment.registration_number})` : ""}`
            : `#${c.equipment_id}`,
          rate: num(c.consumption_rate),
          standard: num(c.standard_rate),
        })),
        tanks: tanks.map(enrichTank),
        charts: {
          monthly_purchase,
          monthly_consumption,
          cost_trend,
        },
        recent_purchases: recentPurchases,
        recent_issues: recentIssues,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Reports ───────────────────────────────────────────────
exports.reports = async (req, res) => {
  try {
    const q = req.query || {};
    const type = q.type || "daily";

    const purchaseWhereClause = purchaseWhere(q);
    const issueWhereClause = issueWhere(q);

    const [purchases, issues, tanks, consumptions] = await Promise.all([
      Purchase.findAll({ where: purchaseWhereClause, include: purchaseInclude, order: [["purchase_date", "DESC"]] }),
      Issue.findAll({ where: issueWhereClause, include: issueInclude, order: [["issue_date", "DESC"]] }),
      Tank.findAll({ order: [["name", "ASC"]] }),
      Consumption.findAll({
        where: {
          ...(q.equipment_id ? { equipment_id: q.equipment_id } : {}),
          ...(q.driver_user_id ? { driver_user_id: q.driver_user_id } : {}),
          ...(q.from || q.to
            ? {
                period_to: {
                  ...(q.from ? { [Op.gte]: q.from } : {}),
                  ...(q.to ? { [Op.lte]: q.to } : {}),
                },
              }
            : {}),
        },
        include: consumptionInclude,
        order: [["period_to", "DESC"]],
      }),
    ]);

    const vehicle_consumption = {};
    const driver_consumption = {};
    for (const c of consumptions) {
      const vKey = c.equipment_id;
      const vName = c.equipment
        ? `${c.equipment.name}${c.equipment.registration_number ? ` (${c.equipment.registration_number})` : ""}`
        : `#${vKey}`;
      if (!vehicle_consumption[vKey]) {
        vehicle_consumption[vKey] = {
          equipment_id: vKey,
          vehicle: vName,
          distance: 0,
          fuel_used: 0,
          records: 0,
          avg_rate: 0,
          high: 0,
        };
      }
      vehicle_consumption[vKey].distance += num(c.distance_km);
      vehicle_consumption[vKey].fuel_used += num(c.fuel_used);
      vehicle_consumption[vKey].records += 1;
      if (c.is_high) vehicle_consumption[vKey].high += 1;

      const dKey = c.driver_user_id || 0;
      const dName = c.driver?.username || (dKey ? `#${dKey}` : "—");
      if (!driver_consumption[dKey]) {
        driver_consumption[dKey] = {
          driver_user_id: dKey || null,
          driver: dName,
          distance: 0,
          fuel_used: 0,
          records: 0,
          avg_rate: 0,
        };
      }
      driver_consumption[dKey].distance += num(c.distance_km);
      driver_consumption[dKey].fuel_used += num(c.fuel_used);
      driver_consumption[dKey].records += 1;
    }
    Object.values(vehicle_consumption).forEach((v) => {
      v.avg_rate = v.distance > 0 ? Math.round((v.fuel_used / v.distance) * 100 * 1000) / 1000 : 0;
      v.distance = Math.round(v.distance * 10) / 10;
      v.fuel_used = Math.round(v.fuel_used * 10) / 10;
    });
    Object.values(driver_consumption).forEach((v) => {
      v.avg_rate = v.distance > 0 ? Math.round((v.fuel_used / v.distance) * 100 * 1000) / 1000 : 0;
      v.distance = Math.round(v.distance * 10) / 10;
      v.fuel_used = Math.round(v.fuel_used * 10) / 10;
    });

    const purchase_summary = {};
    for (const p of purchases) {
      const key = p.supplier_id || 0;
      const name = p.supplier?.name || "—";
      if (!purchase_summary[key]) {
        purchase_summary[key] = { supplier_id: key || null, supplier: name, quantity: 0, amount: 0, count: 0 };
      }
      purchase_summary[key].quantity += num(p.quantity);
      purchase_summary[key].amount += num(p.total_amount);
      purchase_summary[key].count += 1;
    }

    const cost_by_vehicle = {};
    const cost_by_project = {};
    // Estimate issue cost using average unit price from purchases of same fuel type in range
    const avgPriceByType = {};
    for (const p of purchases) {
      const ft = p.fuel_type || "diesel";
      if (!avgPriceByType[ft]) avgPriceByType[ft] = { sum: 0, qty: 0 };
      avgPriceByType[ft].sum += num(p.total_amount);
      avgPriceByType[ft].qty += num(p.quantity);
    }
    const unitPrice = (ft) => {
      const a = avgPriceByType[ft || "diesel"];
      if (a && a.qty > 0) return a.sum / a.qty;
      return 0;
    };

    for (const iss of issues) {
      const eqKey = iss.equipment_id;
      const eqName = iss.equipment
        ? `${iss.equipment.name}${iss.equipment.registration_number ? ` (${iss.equipment.registration_number})` : ""}`
        : `#${eqKey}`;
      const cost = num(iss.quantity) * unitPrice(iss.fuel_type);
      if (!cost_by_vehicle[eqKey]) {
        cost_by_vehicle[eqKey] = { equipment_id: eqKey, vehicle: eqName, quantity: 0, cost: 0 };
      }
      cost_by_vehicle[eqKey].quantity += num(iss.quantity);
      cost_by_vehicle[eqKey].cost += cost;

      const pKey = iss.project_id || 0;
      const pName = iss.project?.name || "Төсөлгүй";
      if (!cost_by_project[pKey]) {
        cost_by_project[pKey] = { project_id: pKey || null, project: pName, quantity: 0, cost: 0 };
      }
      cost_by_project[pKey].quantity += num(iss.quantity);
      cost_by_project[pKey].cost += cost;
    }
    Object.values(cost_by_vehicle).forEach((v) => {
      v.quantity = Math.round(v.quantity * 10) / 10;
      v.cost = Math.round(v.cost);
    });
    Object.values(cost_by_project).forEach((v) => {
      v.quantity = Math.round(v.quantity * 10) / 10;
      v.cost = Math.round(v.cost);
    });

    const daily = {
      date: q.to || q.from || todayISO(),
      purchased_qty: purchases.reduce((s, p) => s + num(p.quantity), 0),
      purchased_amount: purchases.reduce((s, p) => s + num(p.total_amount), 0),
      issued_qty: issues.reduce((s, p) => s + num(p.quantity), 0),
      purchases,
      issues,
    };

    const monthly = {
      purchased_qty: purchases.reduce((s, p) => s + num(p.quantity), 0),
      purchased_amount: purchases.reduce((s, p) => s + num(p.total_amount), 0),
      issued_qty: issues.reduce((s, p) => s + num(p.quantity), 0),
      purchase_count: purchases.length,
      issue_count: issues.length,
    };

    res.json({
      success: true,
      data: {
        type,
        daily,
        monthly,
        vehicle_consumption: Object.values(vehicle_consumption),
        driver_consumption: Object.values(driver_consumption),
        purchase_summary: Object.values(purchase_summary).map((p) => ({
          ...p,
          quantity: Math.round(p.quantity * 10) / 10,
          amount: Math.round(p.amount),
        })),
        tank_balance: tanks.map(enrichTank),
        cost_by_vehicle: Object.values(cost_by_vehicle),
        cost_by_project: Object.values(cost_by_project),
        consumptions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
