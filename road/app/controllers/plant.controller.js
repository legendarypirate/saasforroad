const db = require("../models");
const { Op } = db.Sequelize;
const { todayISO, makeCrud } = require("../utils/plantCrud");

const Plant = db.plant_sites;
const Product = db.plant_products;
const Material = db.plant_materials;
const Stock = db.plant_material_stocks;
const Movement = db.plant_material_movements;
const Batch = db.plant_batches;
const Sale = db.plant_sales;
const Expense = db.plant_expenses;
const DailyReport = db.plant_daily_reports;
const Project = db.projects;

const plantInc = [{ model: Plant, as: "plant", attributes: ["id", "name", "plant_type", "code"] }];
const productInc = [{ model: Product, as: "product", attributes: ["id", "name", "grade", "unit"] }];
const materialInc = [{ model: Material, as: "material", attributes: ["id", "name", "unit", "material_type", "min_stock"] }];

function num(v) {
  return Number(v || 0);
}

function monthRange(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = new Date(y, m, 1).toISOString().slice(0, 10);
  const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

async function adjustStock(plantId, materialId, deltaQty) {
  const [stock] = await Stock.findOrCreate({
    where: { plant_id: plantId, material_id: materialId },
    defaults: { plant_id: plantId, material_id: materialId, quantity: 0 },
  });
  const next = num(stock.quantity) + num(deltaQty);
  await stock.update({ quantity: next });
  return stock;
}

/* ── Dashboard ─────────────────────────────────────────── */

exports.dashboard = async (req, res) => {
  try {
    const plantId = req.query.plant_id ? Number(req.query.plant_id) : null;
    const { start, end } = monthRange();
    const plantWhere = plantId ? { plant_id: plantId } : {};
    const saleWhere = {
      ...plantWhere,
      sale_date: { [Op.between]: [start, end] },
    };
    const expenseWhere = {
      ...plantWhere,
      expense_date: { [Op.between]: [start, end] },
    };

    const [plants, sales, expenses, batches, reports, stocks] = await Promise.all([
      Plant.findAll({ order: [["name", "ASC"]] }),
      Sale.findAll({ where: saleWhere }),
      Expense.findAll({ where: expenseWhere }),
      Batch.findAll({
        where: {
          ...plantWhere,
          production_date: { [Op.between]: [start, end] },
        },
      }),
      DailyReport.findAll({
        where: {
          ...plantWhere,
          report_date: { [Op.between]: [start, end] },
        },
        order: [["report_date", "DESC"]],
        limit: 14,
        include: plantInc,
      }),
      Stock.findAll({
        where: plantId ? { plant_id: plantId } : {},
        include: [...plantInc, ...materialInc],
      }),
    ]);

    const monthIncome = sales.reduce((s, r) => s + num(r.total_amount), 0);
    const monthExpense = expenses.reduce((s, r) => s + num(r.amount), 0);
    const monthProduced = batches.reduce((s, r) => s + num(r.quantity_produced), 0);
    const unpaidSales = sales
      .filter((r) => r.payment_status !== "paid")
      .reduce((s, r) => s + num(r.total_amount), 0);

    const byPlant = plants.map((p) => {
      const pSales = sales.filter((s) => s.plant_id === p.id);
      const pExp = expenses.filter((e) => e.plant_id === p.id);
      const pBatch = batches.filter((b) => b.plant_id === p.id);
      const income = pSales.reduce((s, r) => s + num(r.total_amount), 0);
      const expense = pExp.reduce((s, r) => s + num(r.amount), 0);
      return {
        id: p.id,
        name: p.name,
        code: p.code,
        plant_type: p.plant_type,
        status: p.status,
        income,
        expense,
        net: income - expense,
        produced: pBatch.reduce((s, r) => s + num(r.quantity_produced), 0),
      };
    });

    const lowStock = stocks.filter((s) => {
      const min = num(s.material?.min_stock);
      return min > 0 && num(s.quantity) <= min;
    });

    res.json({
      success: true,
      data: {
        period: { start, end },
        plant_count: plants.length,
        active_plants: plants.filter((p) => p.status === "active").length,
        month_income: monthIncome,
        month_expense: monthExpense,
        month_net: monthIncome - monthExpense,
        month_produced: monthProduced,
        unpaid_sales: unpaidSales,
        by_plant: byPlant,
        recent_reports: reports,
        low_stock: lowStock.slice(0, 10),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Sites ─────────────────────────────────────────────── */

const siteProductInc = [
  {
    model: Product,
    as: "products",
    required: false,
  },
];

function buildSitePayload(body) {
  return {
    code: body.code || null,
    name: body.name,
    plant_type: body.plant_type || "asphalt",
    location: body.location || null,
    aimag: body.aimag || null,
    latitude: body.latitude != null && body.latitude !== "" ? Number(body.latitude) : null,
    longitude: body.longitude != null && body.longitude !== "" ? Number(body.longitude) : null,
    capacity_per_hour: body.capacity_per_hour ?? null,
    capacity_unit: body.capacity_unit || "тн",
    status: body.status || "active",
    manager_name: body.manager_name || null,
    phone: body.phone || null,
    opened_date: body.opened_date || null,
    notes: body.notes || null,
  };
}

async function syncProducts(plantId, products, { replace = false } = {}) {
  if (!Array.isArray(products)) return;
  const keptIds = [];
  for (const p of products) {
    if (!p?.name) continue;
    if (p.id) {
      const row = await Product.findByPk(p.id);
      if (row && row.plant_id === plantId) {
        await row.update({
          name: p.name,
          product_type: p.product_type || row.product_type,
          grade: p.grade ?? row.grade,
          unit: p.unit || row.unit || "тн",
          unit_price_default: p.unit_price_default ?? row.unit_price_default ?? 0,
          is_active: p.is_active !== false && p.is_active !== "false",
          notes: p.notes ?? row.notes,
        });
        keptIds.push(row.id);
      }
    } else {
      const created = await Product.create({
        plant_id: plantId,
        name: p.name,
        product_type: p.product_type || "asphalt_mix",
        grade: p.grade || null,
        unit: p.unit || "тн",
        unit_price_default: p.unit_price_default ?? 0,
        is_active: p.is_active !== false && p.is_active !== "false",
        notes: p.notes || null,
      });
      keptIds.push(created.id);
    }
  }
  if (replace) {
    const where = { plant_id: plantId };
    if (keptIds.length > 0) {
      where.id = { [Op.notIn]: keptIds };
    }
    await Product.destroy({ where });
  }
}

const siteCrud = makeCrud(Plant, {
  include: siteProductInc,
  order: [["name", "ASC"]],
  buildPayload: buildSitePayload,
});

exports.listSites = siteCrud.findAll;
exports.getSite = siteCrud.findOne;
exports.deleteSite = siteCrud.delete;

exports.createSite = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ success: false, message: "Нэр заавал" });
    }
    const row = await Plant.create(buildSitePayload(req.body));
    await syncProducts(row.id, req.body.products);
    const full = await Plant.findByPk(row.id, { include: siteProductInc });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSite = async (req, res) => {
  try {
    const row = await Plant.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update(buildSitePayload({ ...row.toJSON(), ...req.body }));
    if (Array.isArray(req.body.products)) {
      await syncProducts(row.id, req.body.products, { replace: true });
    }
    const full = await Plant.findByPk(row.id, { include: siteProductInc });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Products ──────────────────────────────────────────── */

const productCrud = makeCrud(Product, {
  include: plantInc,
  order: [["name", "ASC"]],
  filterWhere: (q) => {
    const where = {};
    if (q.plant_id) where.plant_id = q.plant_id;
    if (q.product_type) where.product_type = q.product_type;
    return where;
  },
  buildPayload: (body) => ({
    plant_id: body.plant_id || null,
    name: body.name,
    product_type: body.product_type || "asphalt_mix",
    grade: body.grade,
    unit: body.unit || "тн",
    unit_price_default: body.unit_price_default ?? 0,
    is_active: body.is_active !== false && body.is_active !== "false",
    notes: body.notes,
  }),
});

exports.listProducts = productCrud.findAll;
exports.createProduct = productCrud.create;
exports.getProduct = productCrud.findOne;
exports.updateProduct = productCrud.update;
exports.deleteProduct = productCrud.delete;

/* ── Materials ─────────────────────────────────────────── */

const materialCrud = makeCrud(Material, {
  order: [["name", "ASC"]],
  buildPayload: (body) => ({
    name: body.name,
    material_type: body.material_type || "aggregate",
    unit: body.unit || "тн",
    min_stock: body.min_stock ?? 0,
    unit_cost_default: body.unit_cost_default ?? 0,
    notes: body.notes,
  }),
});

exports.listMaterials = materialCrud.findAll;
exports.createMaterial = materialCrud.create;
exports.getMaterial = materialCrud.findOne;
exports.updateMaterial = materialCrud.update;
exports.deleteMaterial = materialCrud.delete;

/* ── Stocks ────────────────────────────────────────────── */

exports.listStocks = async (req, res) => {
  try {
    const where = {};
    if (req.query.plant_id) where.plant_id = req.query.plant_id;
    const data = await Stock.findAll({
      where,
      include: [...plantInc, ...materialInc],
      order: [["updatedAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Material movements (орлого/зарлага түүхий эд) ─────── */

exports.listMovements = async (req, res) => {
  try {
    const where = {};
    if (req.query.plant_id) where.plant_id = req.query.plant_id;
    if (req.query.material_id) where.material_id = req.query.material_id;
    if (req.query.movement_type) where.movement_type = req.query.movement_type;
    const data = await Movement.findAll({
      where,
      include: [...plantInc, ...materialInc],
      order: [["movement_date", "DESC"], ["id", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMovement = async (req, res) => {
  try {
    const body = req.body;
    if (!body.plant_id || !body.material_id || !body.quantity) {
      return res.status(400).json({
        success: false,
        message: "plant_id, material_id, quantity заавал",
      });
    }
    const qty = Math.abs(num(body.quantity));
    const type = body.movement_type || "in";
    const signed =
      type === "in" || type === "adjust"
        ? type === "adjust"
          ? num(body.quantity)
          : qty
        : -qty;

    const row = await Movement.create({
      plant_id: body.plant_id,
      material_id: body.material_id,
      movement_type: type,
      quantity: qty,
      unit_cost: body.unit_cost ?? 0,
      movement_date: body.movement_date || todayISO(),
      ref_type: body.ref_type,
      ref_id: body.ref_id,
      notes: body.notes,
    });

    if (type === "adjust") {
      const [stock] = await Stock.findOrCreate({
        where: { plant_id: body.plant_id, material_id: body.material_id },
        defaults: { plant_id: body.plant_id, material_id: body.material_id, quantity: 0 },
      });
      await stock.update({ quantity: num(body.quantity) });
    } else {
      await adjustStock(body.plant_id, body.material_id, signed);
    }

    const full = await Movement.findByPk(row.id, { include: [...plantInc, ...materialInc] });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMovement = async (req, res) => {
  try {
    const row = await Movement.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });

    const qty = num(row.quantity);
    const reverse =
      row.movement_type === "in"
        ? -qty
        : row.movement_type === "out" || row.movement_type === "consume"
          ? qty
          : 0;
    if (reverse !== 0) await adjustStock(row.plant_id, row.material_id, reverse);
    await row.destroy();
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── Batches ───────────────────────────────────────────── */

const batchCrud = makeCrud(Batch, {
  include: [...plantInc, ...productInc],
  order: [["production_date", "DESC"], ["id", "DESC"]],
  filterWhere: (q) => {
    const where = {};
    if (q.plant_id) where.plant_id = q.plant_id;
    if (q.status) where.status = q.status;
    return where;
  },
  buildPayload: (body) => ({
    plant_id: body.plant_id,
    product_id: body.product_id || null,
    batch_no: body.batch_no,
    production_date: body.production_date || todayISO(),
    started_at: body.started_at || null,
    ended_at: body.ended_at || null,
    quantity_produced: body.quantity_produced ?? 0,
    unit: body.unit || "тн",
    mix_formula: body.mix_formula,
    lab_ok: body.lab_ok !== false && body.lab_ok !== "false",
    status: body.status || "done",
    operator_name: body.operator_name,
    fuel_used: body.fuel_used,
    notes: body.notes,
  }),
});

exports.listBatches = batchCrud.findAll;
exports.createBatch = batchCrud.create;
exports.getBatch = batchCrud.findOne;
exports.updateBatch = batchCrud.update;
exports.deleteBatch = batchCrud.delete;

/* ── Sales (орлого) ────────────────────────────────────── */

const saleCrud = makeCrud(Sale, {
  include: [
    ...plantInc,
    ...productInc,
    { model: Project, as: "project", attributes: ["id", "name"], required: false },
  ],
  order: [["sale_date", "DESC"], ["id", "DESC"]],
  filterWhere: (q) => {
    const where = {};
    if (q.plant_id) where.plant_id = q.plant_id;
    if (q.payment_status) where.payment_status = q.payment_status;
    return where;
  },
  buildPayload: (body) => {
    const qty = num(body.quantity);
    const price = num(body.unit_price);
    const total = body.total_amount != null ? num(body.total_amount) : qty * price;
    return {
      plant_id: body.plant_id,
      product_id: body.product_id || null,
      batch_id: body.batch_id || null,
      project_id: body.project_id || null,
      sale_date: body.sale_date || todayISO(),
      buyer_name: body.buyer_name,
      buyer_type: body.buyer_type || "project",
      quantity: qty,
      unit: body.unit || "тн",
      unit_price: price,
      total_amount: total,
      vat_amount: body.vat_amount ?? 0,
      payment_status: body.payment_status || "unpaid",
      invoice_no: body.invoice_no,
      delivery_note: body.delivery_note,
      notes: body.notes,
    };
  },
});

exports.listSales = saleCrud.findAll;
exports.createSale = saleCrud.create;
exports.getSale = saleCrud.findOne;
exports.updateSale = saleCrud.update;
exports.deleteSale = saleCrud.delete;

/* ── Expenses (зарлага) ────────────────────────────────── */

const expenseCrud = makeCrud(Expense, {
  include: plantInc,
  order: [["expense_date", "DESC"], ["id", "DESC"]],
  filterWhere: (q) => {
    const where = {};
    if (q.plant_id) where.plant_id = q.plant_id;
    if (q.category) where.category = q.category;
    return where;
  },
  buildPayload: (body) => ({
    plant_id: body.plant_id,
    expense_date: body.expense_date || todayISO(),
    category: body.category || "other",
    amount: body.amount ?? 0,
    vat_amount: body.vat_amount ?? 0,
    description: body.description,
    vendor_name: body.vendor_name,
    status: body.status || "posted",
    notes: body.notes,
  }),
});

exports.listExpenses = expenseCrud.findAll;
exports.createExpense = expenseCrud.create;
exports.getExpense = expenseCrud.findOne;
exports.updateExpense = expenseCrud.update;
exports.deleteExpense = expenseCrud.delete;

/* ── Daily reports ─────────────────────────────────────── */

const reportCrud = makeCrud(DailyReport, {
  include: plantInc,
  order: [["report_date", "DESC"], ["id", "DESC"]],
  filterWhere: (q) => {
    const where = {};
    if (q.plant_id) where.plant_id = q.plant_id;
    if (q.status) where.status = q.status;
    return where;
  },
  buildPayload: (body) => ({
    plant_id: body.plant_id,
    report_date: body.report_date || todayISO(),
    hours_run: body.hours_run ?? 0,
    downtime_hours: body.downtime_hours ?? 0,
    downtime_reason: body.downtime_reason,
    quantity_produced: body.quantity_produced ?? 0,
    quantity_shipped: body.quantity_shipped ?? 0,
    quantity_stock: body.quantity_stock ?? 0,
    unit: body.unit || "тн",
    fuel_used: body.fuel_used ?? 0,
    power_kwh: body.power_kwh ?? 0,
    weather: body.weather,
    shift_count: body.shift_count ?? 1,
    headcount: body.headcount ?? 0,
    summary: body.summary,
    status: body.status || "submitted",
    created_by_name: body.created_by_name,
  }),
});

exports.listReports = reportCrud.findAll;
exports.createReport = reportCrud.create;
exports.getReport = reportCrud.findOne;
exports.updateReport = reportCrud.update;
exports.deleteReport = reportCrud.delete;

/* ── Seed defaults (idempotent helpers for empty DB) ───── */

exports.seedDefaults = async (_req, res) => {
  try {
    const count = await Plant.count();
    if (count > 0) {
      return res.json({ success: true, message: "Already seeded", data: { plants: count } });
    }

    const asphalt = await Plant.create({
      code: "ASP-01",
      name: "Асфальтбетон үйлдвэр",
      plant_type: "asphalt",
      location: "Улаанбаатар орчим",
      capacity_per_hour: 160,
      capacity_unit: "тн",
      status: "active",
      manager_name: "",
      notes: "Hot mix asphalt plant",
    });
    const cement = await Plant.create({
      code: "CEM-01",
      name: "Цемент / СТВ үйлдвэр",
      plant_type: "ctb",
      location: "Төслийн талбай",
      capacity_per_hour: 200,
      capacity_unit: "тн",
      status: "active",
    });
    const crush = await Plant.create({
      code: "CRU-01",
      name: "Чулуу бутлах үйлдвэр",
      plant_type: "crushing",
      location: "Карьер",
      capacity_per_hour: 120,
      capacity_unit: "тн",
      status: "active",
    });
    const emulsion = await Plant.create({
      code: "EMU-01",
      name: "Эмульс үйлдвэр",
      plant_type: "emulsion",
      capacity_per_hour: 10,
      capacity_unit: "тн",
      status: "seasonal",
    });

    await Product.bulkCreate([
      { plant_id: asphalt.id, name: "АБ-16", product_type: "asphalt_mix", grade: "АБ-16", unit: "тн", unit_price_default: 450000 },
      { plant_id: asphalt.id, name: "АБ-12.5", product_type: "asphalt_mix", grade: "АБ-12.5", unit: "тн", unit_price_default: 480000 },
      { plant_id: cement.id, name: "СТВ", product_type: "ctb", grade: "СТВ", unit: "тн", unit_price_default: 85000 },
      { plant_id: crush.id, name: "0-5 фракц", product_type: "aggregate", grade: "0-5", unit: "тн", unit_price_default: 25000 },
      { plant_id: crush.id, name: "5-20 фракц", product_type: "aggregate", grade: "5-20", unit: "тн", unit_price_default: 28000 },
      { plant_id: emulsion.id, name: "Катион эмульс", product_type: "emulsion", unit: "тн", unit_price_default: 1200000 },
    ]);

    await Material.bulkCreate([
      { name: "Битум 60/90", material_type: "bitumen", unit: "тн", min_stock: 20, unit_cost_default: 2800000 },
      { name: "Цемент М400", material_type: "cement", unit: "тн", min_stock: 50, unit_cost_default: 350000 },
      { name: "Дүүргэгч 0-5", material_type: "aggregate", unit: "тн", min_stock: 100, unit_cost_default: 18000 },
      { name: "Дүүргэгч 5-20", material_type: "aggregate", unit: "тн", min_stock: 100, unit_cost_default: 20000 },
      { name: "Шатахуун (дизель)", material_type: "fuel", unit: "л", min_stock: 2000, unit_cost_default: 3500 },
    ]);

    res.json({
      success: true,
      message: "Үйлдвэрүүдийн үндсэн бүртгэл үүслээ",
      data: { plants: [asphalt, cement, crush, emulsion].map((p) => p.id) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
