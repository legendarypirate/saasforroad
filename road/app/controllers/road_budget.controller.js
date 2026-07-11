const { Op } = require("sequelize");
const db = require("../models");
const { makeCrud } = require("../utils/hseCrud");

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const CATEGORY_LABELS = {
  mobilization: "Зөөвөр / бэлтгэл",
  earthwork: "Шорооны ажил",
  subgrade: "Доод суурь / бэлтгэл",
  pavement: "Хучилт",
  drainage: "Ус зайлуулалт",
  structure: "Байгууламж",
  roadside: "Замын хажуу / аюулгүй байдал",
  temporary: "Түр ажил",
  survey: "Хэмжилт / зураг төсөл",
  other: "Бусад",
};

function calcTotals(base, contingencyPct, overheadPct, profitPct, vatPct) {
  const contingency = base * (contingencyPct / 100);
  const overhead = (base + contingency) * (overheadPct / 100);
  const profit = (base + contingency + overhead) * (profitPct / 100);
  const subtotal = base + contingency + overhead + profit;
  const vat = subtotal * (vatPct / 100);
  const total = subtotal + vat;
  return {
    base_amount: Number(base.toFixed(2)),
    contingency_amount: Number(contingency.toFixed(2)),
    overhead_amount: Number(overhead.toFixed(2)),
    profit_amount: Number(profit.toFixed(2)),
    vat_amount: Number(vat.toFixed(2)),
    total_amount: Number(total.toFixed(2)),
  };
}

async function refreshBudgetTotals(budgetId) {
  const budget = await db.road_budgets.findByPk(budgetId);
  if (!budget) return null;
  const items = await db.road_budget_items.findAll({ where: { budget_id: budgetId } });
  const base = items.reduce((s, i) => s + num(i.amount), 0);
  const totals = calcTotals(
    base,
    num(budget.contingency_pct, 10),
    num(budget.overhead_pct, 8),
    num(budget.profit_pct, 5),
    num(budget.vat_pct, 10),
  );
  const length = num(budget.road_length_m);
  const cost_per_km = length > 0 ? Number(((totals.total_amount / length) * 1000).toFixed(2)) : null;
  await budget.update({ ...totals, cost_per_km });
  return budget;
}

const rateCrud = makeCrud(db.road_budget_rates, {
  order: [["category", "ASC"], ["code", "ASC"]],
  filterWhere: (q) => {
    const where = {};
    if (q.category) where.category = q.category;
    if (q.is_active != null) where.is_active = q.is_active === "true" || q.is_active === true;
    if (q.q) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${q.q}%` } },
        { name: { [Op.iLike]: `%${q.q}%` } },
      ];
    }
    return where;
  },
  buildPayload: (body) => ({
    code: body.code,
    category: body.category,
    name: body.name,
    unit: body.unit,
    unit_price: num(body.unit_price),
    labor_share: num(body.labor_share),
    material_share: num(body.material_share),
    equipment_share: num(body.equipment_share),
    productivity: body.productivity != null ? num(body.productivity) : null,
    remarks: body.remarks,
    is_active: body.is_active !== false,
  }),
});

exports.listRates = rateCrud.findAll;
exports.createRate = rateCrud.create;
exports.updateRate = rateCrud.update;
exports.deleteRate = rateCrud.delete;

exports.listBudgets = async (req, res) => {
  try {
    const where = {};
    if (req.query.project_id) where.project_id = req.query.project_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${req.query.q}%` } },
        { name: { [Op.iLike]: `%${req.query.q}%` } },
      ];
    }
    const data = await db.road_budgets.findAll({
      where,
      include: [
        { model: db.road_projects, as: "project", attributes: ["id", "code", "name", "length", "road_class"] },
      ],
      order: [["updatedAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBudget = async (req, res) => {
  try {
    const row = await db.road_budgets.findByPk(req.params.id, {
      include: [
        { model: db.road_projects, as: "project" },
        {
          model: db.road_budget_items,
          as: "items",
          separate: true,
          order: [["sort_order", "ASC"], ["id", "ASC"]],
        },
        { model: db.road_budget_assumptions, as: "assumptions", separate: true },
      ],
    });
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });

    const byCategory = {};
    for (const item of row.items || []) {
      const cat = item.category || "other";
      if (!byCategory[cat]) byCategory[cat] = { category: cat, label: CATEGORY_LABELS[cat] || cat, amount: 0, count: 0 };
      byCategory[cat].amount += num(item.amount);
      byCategory[cat].count += 1;
    }

    res.json({
      success: true,
      data: {
        ...row.toJSON(),
        category_summary: Object.values(byCategory).map((c) => ({
          ...c,
          amount: Number(c.amount.toFixed(2)),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createBudget = async (req, res) => {
  try {
    const body = req.body || {};
    const project = await db.road_projects.findByPk(body.project_id);
    if (!project) return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });

    const count = await db.road_budgets.count({ where: { project_id: project.id } });
    const row = await db.road_budgets.create({
      project_id: project.id,
      code: body.code || `${project.code}-BUD-${count + 1}`,
      name: body.name || `${project.name} — Төсөв`,
      version: body.version || count + 1,
      status: body.status || "draft",
      currency: body.currency || "MNT",
      contingency_pct: num(body.contingency_pct, 10),
      overhead_pct: num(body.overhead_pct, 8),
      profit_pct: num(body.profit_pct, 5),
      vat_pct: num(body.vat_pct, 10),
      road_length_m: num(body.road_length_m, num(project.length)),
      estimate_method: body.estimate_method || "hybrid",
      notes: body.notes,
      prepared_by: body.prepared_by,
      created_by: body.created_by ?? null,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const row = await db.road_budgets.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const body = req.body || {};
    await row.update({
      name: body.name ?? row.name,
      status: body.status ?? row.status,
      contingency_pct: body.contingency_pct != null ? num(body.contingency_pct) : row.contingency_pct,
      overhead_pct: body.overhead_pct != null ? num(body.overhead_pct) : row.overhead_pct,
      profit_pct: body.profit_pct != null ? num(body.profit_pct) : row.profit_pct,
      vat_pct: body.vat_pct != null ? num(body.vat_pct) : row.vat_pct,
      road_length_m: body.road_length_m != null ? num(body.road_length_m) : row.road_length_m,
      notes: body.notes ?? row.notes,
      prepared_by: body.prepared_by ?? row.prepared_by,
      approved_by: body.approved_by ?? row.approved_by,
      estimate_method: body.estimate_method ?? row.estimate_method,
    });
    const refreshed = await refreshBudgetTotals(row.id);
    res.json({ success: true, data: refreshed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const numDel = await db.road_budgets.destroy({ where: { id: req.params.id } });
    if (numDel !== 1) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveBudget = async (req, res) => {
  try {
    const row = await db.road_budgets.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    await row.update({
      status: "approved",
      approved_by: req.body?.approved_by || "Админ",
      approved_at: new Date(),
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.duplicateBudget = async (req, res) => {
  try {
    const src = await db.road_budgets.findByPk(req.params.id, {
      include: [
        { model: db.road_budget_items, as: "items" },
        { model: db.road_budget_assumptions, as: "assumptions" },
      ],
    });
    if (!src) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const count = await db.road_budgets.count({ where: { project_id: src.project_id } });
    const copy = await db.road_budgets.create({
      ...src.toJSON(),
      id: undefined,
      code: `${src.code}-V${count + 1}`,
      name: `${src.name} (хуулбар)`,
      version: count + 1,
      status: "draft",
      approved_by: null,
      approved_at: null,
      createdAt: undefined,
      updatedAt: undefined,
    });
    if (src.items?.length) {
      await db.road_budget_items.bulkCreate(
        src.items.map((i) => ({
          ...i.toJSON(),
          id: undefined,
          budget_id: copy.id,
          createdAt: undefined,
          updatedAt: undefined,
        })),
      );
    }
    if (src.assumptions?.length) {
      await db.road_budget_assumptions.bulkCreate(
        src.assumptions.map((a) => ({
          ...a.toJSON(),
          id: undefined,
          budget_id: copy.id,
          createdAt: undefined,
          updatedAt: undefined,
        })),
      );
    }
    await refreshBudgetTotals(copy.id);
    res.json({ success: true, data: copy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createBudgetItem = async (req, res) => {
  try {
    const body = req.body || {};
    const qty = num(body.quantity);
    const price = num(body.unit_price);
    const row = await db.road_budget_items.create({
      budget_id: body.budget_id,
      rate_id: body.rate_id || null,
      category: body.category || "other",
      code: body.code,
      description: body.description,
      unit: body.unit,
      quantity: qty,
      unit_price: price,
      amount: Number((qty * price).toFixed(2)),
      source: body.source || "manual",
      station_from: body.station_from != null ? num(body.station_from) : null,
      station_to: body.station_to != null ? num(body.station_to) : null,
      sort_order: num(body.sort_order),
      remarks: body.remarks,
    });
    await refreshBudgetTotals(body.budget_id);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBudgetItem = async (req, res) => {
  try {
    const row = await db.road_budget_items.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const body = req.body || {};
    const qty = body.quantity != null ? num(body.quantity) : num(row.quantity);
    const price = body.unit_price != null ? num(body.unit_price) : num(row.unit_price);
    await row.update({
      category: body.category ?? row.category,
      code: body.code ?? row.code,
      description: body.description ?? row.description,
      unit: body.unit ?? row.unit,
      quantity: qty,
      unit_price: price,
      amount: Number((qty * price).toFixed(2)),
      remarks: body.remarks ?? row.remarks,
      sort_order: body.sort_order != null ? num(body.sort_order) : row.sort_order,
    });
    await refreshBudgetTotals(row.budget_id);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteBudgetItem = async (req, res) => {
  try {
    const row = await db.road_budget_items.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const budgetId = row.budget_id;
    await row.destroy();
    await refreshBudgetTotals(budgetId);
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function rateMap(rates) {
  const map = {};
  for (const r of rates) map[r.code] = r;
  return map;
}

function lineFromRate(rate, qty, extra = {}) {
  const quantity = Number(qty.toFixed(3));
  const unit_price = num(rate.unit_price);
  return {
    rate_id: rate.id,
    category: rate.category,
    code: rate.code,
    description: rate.name,
    unit: rate.unit,
    quantity,
    unit_price,
    amount: Number((quantity * unit_price).toFixed(2)),
    source: extra.source || "estimator",
    station_from: extra.station_from ?? null,
    station_to: extra.station_to ?? null,
    sort_order: extra.sort_order ?? 0,
    remarks: extra.remarks || null,
  };
}

/**
 * Road expert hybrid estimator:
 * - pulls quantities from earthwork / pavement / drainage / structures / BOQ
 * - applies active unit rates
 * - adds mobilization, temporary traffic, survey allowances
 */
exports.estimateBudget = async (req, res) => {
  try {
    const budgetId = Number(req.params.id);
    const budget = await db.road_budgets.findByPk(budgetId);
    if (!budget) return res.status(404).json({ success: false, message: "Төсөв олдсонгүй" });

    const project = await db.road_projects.findByPk(budget.project_id);
    const alignments = await db.alignments.findAll({
      where: { project_id: budget.project_id, type: "CENTERLINE" },
    });
    const alignmentIds = alignments.map((a) => a.id);
    const lengthM = num(budget.road_length_m, num(project?.length));

    const rates = await db.road_budget_rates.findAll({ where: { is_active: true } });
    const R = rateMap(rates);
    const need = (code) => {
      if (!R[code]) throw new Error(`Нэгж үнэ олдсонгүй: ${code}. Эхлээд rate library шалгана уу.`);
      return R[code];
    };

    const [earthRows, pavements, drainages, structures, qtyItems] = await Promise.all([
      alignmentIds.length
        ? db.earthworks.findAll({ where: { alignment_id: alignmentIds } })
        : [],
      db.pavements.findAll({ where: { project_id: budget.project_id } }),
      db.drainages.findAll({ where: { project_id: budget.project_id } }),
      db.road_structures.findAll({ where: { project_id: budget.project_id } }),
      db.quantity_items.findAll({ where: { project_id: budget.project_id } }),
    ]);

    const totalCut = earthRows.reduce((s, r) => s + num(r.cut_volume), 0);
    const totalFill = earthRows.reduce((s, r) => s + num(r.fill_volume), 0);
    const haul = Math.max(0, totalCut - totalFill) * 0.35 + Math.max(0, totalFill - totalCut) * 0.25;

    const lines = [];
    let sort = 10;

    // Mobilization (~2.5% of civil works later adjusted; use length-based starter)
    lines.push(lineFromRate(need("MOB-01"), Math.max(1, lengthM / 1000), { sort_order: sort++, remarks: "Төслийн бэлтгэл / зөөвөр" }));
    lines.push(lineFromRate(need("TMP-01"), Math.max(1, lengthM / 1000), { sort_order: sort++, remarks: "Түр замын хөдөлгөөн зохион байгуулалт" }));
    lines.push(lineFromRate(need("SRV-01"), Math.max(1, lengthM / 1000), { sort_order: sort++, remarks: "Хэмжилт, зураг төслийн дэмжлэг" }));

    if (totalCut > 0) lines.push(lineFromRate(need("EW-CUT"), totalCut, { sort_order: sort++, source: "earthwork" }));
    if (totalFill > 0) lines.push(lineFromRate(need("EW-FILL"), totalFill, { sort_order: sort++, source: "earthwork" }));
    if (haul > 0) lines.push(lineFromRate(need("EW-HAUL"), haul, { sort_order: sort++, source: "earthwork", remarks: "Илүүдэл/дутуу шорооны зөөвөр" }));

    // Subgrade preparation over full length × road width ~8.5m
    const prepArea = lengthM * 8.5;
    if (prepArea > 0) {
      lines.push(lineFromRate(need("SG-PREP"), prepArea, { sort_order: sort++, remarks: "Суурь бэлтгэл" }));
      lines.push(lineFromRate(need("SG-COMP"), prepArea, { sort_order: sort++, remarks: "Нягтруулалт" }));
    }

    for (const p of pavements) {
      const from = num(p.station_from);
      const to = num(p.station_to, from);
      const width = num(p.width, 7.5);
      const area = Math.max(0, to - from) * width;
      const layer = String(p.layer_name || "").toLowerCase();
      let code = "PV-BASE";
      if (layer.includes("wear") || layer.includes("асфальт") || layer.includes("asphalt")) code = "PV-AC";
      else if (layer.includes("binder")) code = "PV-BIND";
      else if (layer.includes("subbase") || layer.includes("элс")) code = "PV-SUB";
      if (area > 0 && R[code]) {
        lines.push(
          lineFromRate(need(code), area, {
            sort_order: sort++,
            source: "pavement",
            station_from: from,
            station_to: to,
            remarks: `${p.layer_name || ""} ${p.thickness_mm || ""}мм`,
          }),
        );
      }
    }

    for (const d of drainages) {
      const type = d.type;
      const len = num(d.length, 1);
      let code = "DR-DITCH";
      if (type === "culvert" || type === "box_culvert") code = "DR-CULV";
      else if (type === "pipe") code = "DR-PIPE";
      else if (type === "bridge_drain") code = "DR-PIPE";
      if (R[code]) {
        lines.push(
          lineFromRate(need(code), Math.max(len, 1), {
            sort_order: sort++,
            source: "drainage",
            station_from: d.station != null ? num(d.station) : null,
            remarks: d.material || type,
          }),
        );
      }
    }

    for (const s of structures) {
      const type = s.type;
      let code = "ST-WALL";
      let qty = num(s.length, 1);
      if (type === "bridge") {
        code = "ST-BRIDGE";
        qty = Math.max(num(s.length) * num(s.width, 1), 1);
      } else if (type === "box_culvert") {
        code = "ST-BOX";
        qty = Math.max(num(s.length), 1);
      } else if (type === "underpass") {
        code = "ST-UNDER";
        qty = Math.max(num(s.length) * num(s.width, 1), 1);
      } else if (type === "retaining_wall") {
        code = "ST-WALL";
        qty = Math.max(num(s.length) * Math.max(num(s.width, 0.4), 0.4), 1);
      }
      if (R[code]) {
        lines.push(
          lineFromRate(need(code), qty, {
            sort_order: sort++,
            source: "structure",
            station_from: s.station != null ? num(s.station) : null,
            remarks: s.remarks || type,
          }),
        );
      }
    }

    // Roadside safety allowance per km
    if (lengthM > 0) {
      lines.push(lineFromRate(need("RS-MARK"), lengthM / 1000, { sort_order: sort++, remarks: "Тэмдэглэгээ / хашлага" }));
      lines.push(lineFromRate(need("RS-SIGN"), Math.max(4, Math.round(lengthM / 500)), { sort_order: sort++, remarks: "Замын тэмдэг" }));
    }

    // Merge quantity takeoff items that have matching rate codes
    for (const q of qtyItems) {
      const code = q.code;
      if (code && R[code]) {
        lines.push(
          lineFromRate(need(code), num(q.quantity), {
            sort_order: sort++,
            source: "boq",
            remarks: q.description,
          }),
        );
      } else if (num(q.quantity) > 0 && num(q.unit_price) > 0) {
        lines.push({
          rate_id: null,
          category: q.category || "other",
          code: q.code,
          description: q.description,
          unit: q.unit,
          quantity: num(q.quantity),
          unit_price: num(q.unit_price),
          amount: Number((num(q.quantity) * num(q.unit_price)).toFixed(2)),
          source: "boq",
          sort_order: sort++,
          remarks: "BOQ-аас",
        });
      }
    }

    // Replace previous estimator-generated lines, keep manual
    await db.road_budget_items.destroy({
      where: {
        budget_id: budgetId,
        source: { [Op.in]: ["estimator", "earthwork", "pavement", "drainage", "structure", "boq"] },
      },
    });
    await db.road_budget_items.bulkCreate(lines.map((l) => ({ ...l, budget_id: budgetId })));

    await db.road_budget_assumptions.destroy({ where: { budget_id: budgetId } });
    await db.road_budget_assumptions.bulkCreate([
      { budget_id: budgetId, key: "road_length_m", label: "Замын урт", value: String(lengthM), unit: "м" },
      { budget_id: budgetId, key: "road_class", label: "Замын анги", value: project?.road_class || "—", unit: "" },
      { budget_id: budgetId, key: "total_cut_m3", label: "Нийт ухалт", value: totalCut.toFixed(1), unit: "м³" },
      { budget_id: budgetId, key: "total_fill_m3", label: "Нийт дүүргэлт", value: totalFill.toFixed(1), unit: "м³" },
      { budget_id: budgetId, key: "haul_m3", label: "Зөөврийн шороо", value: haul.toFixed(1), unit: "м³" },
      { budget_id: budgetId, key: "method", label: "Тооцооллын арга", value: "Hybrid (инженер + нэгж үнэ)", unit: "" },
      {
        budget_id: budgetId,
        key: "contingency_note",
        label: "Нөөц",
        value: `${num(budget.contingency_pct)}% — шороо/газар зүйн эрсдэл`,
        unit: "",
      },
    ]);

    await budget.update({
      estimate_method: "hybrid",
      road_length_m: lengthM,
      status: budget.status === "approved" ? "revised" : budget.status,
    });
    const refreshed = await refreshBudgetTotals(budgetId);
    const full = await db.road_budgets.findByPk(budgetId, {
      include: [
        { model: db.road_budget_items, as: "items" },
        { model: db.road_budget_assumptions, as: "assumptions" },
        { model: db.road_projects, as: "project" },
      ],
    });

    res.json({
      success: true,
      data: {
        budget: refreshed,
        full,
        generated_lines: lines.length,
        summary: {
          cut: Number(totalCut.toFixed(2)),
          fill: Number(totalFill.toFixed(2)),
          haul: Number(haul.toFixed(2)),
          length_m: lengthM,
          total: num(refreshed?.total_amount),
          cost_per_km: num(refreshed?.cost_per_km),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.budgetDashboard = async (_req, res) => {
  try {
    const [budgets, rates, projects] = await Promise.all([
      db.road_budgets.findAll({
        include: [{ model: db.road_projects, as: "project", attributes: ["id", "code", "name"] }],
        order: [["updatedAt", "DESC"]],
        limit: 20,
      }),
      db.road_budget_rates.count({ where: { is_active: true } }),
      db.road_projects.count(),
    ]);
    const total = budgets.reduce((s, b) => s + num(b.total_amount), 0);
    const approved = budgets.filter((b) => b.status === "approved").length;
    const byStatus = {};
    for (const b of budgets) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    }
    res.json({
      success: true,
      data: {
        cards: {
          budgets: budgets.length,
          projects,
          active_rates: rates,
          approved,
          total_estimate: Number(total.toFixed(2)),
          avg_cost_per_km: budgets.length
            ? Number(
                (
                  budgets.reduce((s, b) => s + num(b.cost_per_km), 0) /
                  Math.max(1, budgets.filter((b) => num(b.cost_per_km) > 0).length)
                ).toFixed(2),
              )
            : 0,
        },
        by_status: byStatus,
        recent: budgets,
        categories: CATEGORY_LABELS,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.CATEGORY_LABELS = CATEGORY_LABELS;
