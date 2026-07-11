const DEFAULT_RATES = [
  { code: "MOB-01", category: "mobilization", name: "Зөөвөр, бааз байгуулалт", unit: "км", unit_price: 18500000, labor_share: 25, material_share: 35, equipment_share: 40 },
  { code: "TMP-01", category: "temporary", name: "Түр замын хөдөлгөөн зохион байгуулалт", unit: "км", unit_price: 4200000, labor_share: 40, material_share: 30, equipment_share: 30 },
  { code: "SRV-01", category: "survey", name: "Хэмжилт, зураг төслийн дэмжлэг", unit: "км", unit_price: 3500000, labor_share: 70, material_share: 20, equipment_share: 10 },
  { code: "EW-CUT", category: "earthwork", name: "Ухалт (common excavation)", unit: "м³", unit_price: 8500, labor_share: 20, material_share: 5, equipment_share: 75, productivity: 120 },
  { code: "EW-FILL", category: "earthwork", name: "Дүүргэлт / нягтруулсан далан", unit: "м³", unit_price: 7200, labor_share: 15, material_share: 10, equipment_share: 75, productivity: 100 },
  { code: "EW-HAUL", category: "earthwork", name: "Шороо зөөвөр (1км дундаж)", unit: "м³", unit_price: 4800, labor_share: 10, material_share: 5, equipment_share: 85 },
  { code: "EW-ROCK", category: "earthwork", name: "Чулуун ухалт", unit: "м³", unit_price: 28500, labor_share: 15, material_share: 5, equipment_share: 80 },
  { code: "SG-PREP", category: "subgrade", name: "Суурь бэлтгэл / тэгшлэлт", unit: "м²", unit_price: 1850, labor_share: 25, material_share: 15, equipment_share: 60 },
  { code: "SG-COMP", category: "subgrade", name: "Суурь нягтруулалт", unit: "м²", unit_price: 950, labor_share: 15, material_share: 5, equipment_share: 80 },
  { code: "PV-SUB", category: "pavement", name: "Subbase — элс хайрга", unit: "м²", unit_price: 6500, labor_share: 15, material_share: 55, equipment_share: 30 },
  { code: "PV-BASE", category: "pavement", name: "Base — буталсан чулуу", unit: "м²", unit_price: 9800, labor_share: 15, material_share: 55, equipment_share: 30 },
  { code: "PV-BIND", category: "pavement", name: "Binder курс (AC-20)", unit: "м²", unit_price: 28500, labor_share: 15, material_share: 65, equipment_share: 20 },
  { code: "PV-AC", category: "pavement", name: "Асфальт хучилт (wearing)", unit: "м²", unit_price: 45000, labor_share: 15, material_share: 65, equipment_share: 20 },
  { code: "DR-DITCH", category: "drainage", name: "Шороон шуудуу", unit: "м", unit_price: 12500, labor_share: 35, material_share: 15, equipment_share: 50 },
  { code: "DR-PIPE", category: "drainage", name: "HDPE / ган хоолой", unit: "м", unit_price: 185000, labor_share: 20, material_share: 60, equipment_share: 20 },
  { code: "DR-CULV", category: "drainage", name: "Төмөр бетон culvert", unit: "м", unit_price: 890000, labor_share: 20, material_share: 55, equipment_share: 25 },
  { code: "ST-BRIDGE", category: "structure", name: "Гүүр (м² тавцан)", unit: "м²", unit_price: 1850000, labor_share: 25, material_share: 50, equipment_share: 25 },
  { code: "ST-BOX", category: "structure", name: "Box culvert", unit: "м", unit_price: 12500000, labor_share: 20, material_share: 55, equipment_share: 25 },
  { code: "ST-WALL", category: "structure", name: "Түлхэлтийн хана", unit: "м³", unit_price: 685000, labor_share: 25, material_share: 50, equipment_share: 25 },
  { code: "ST-UNDER", category: "structure", name: "Дэд гарц / underpass", unit: "м²", unit_price: 980000, labor_share: 25, material_share: 50, equipment_share: 25 },
  { code: "RS-MARK", category: "roadside", name: "Замын тэмдэглэгээ, хашлага", unit: "км", unit_price: 12500000, labor_share: 30, material_share: 55, equipment_share: 15 },
  { code: "RS-SIGN", category: "roadside", name: "Замын тэмдэг суурилуулалт", unit: "ш", unit_price: 850000, labor_share: 35, material_share: 55, equipment_share: 10 },
];

async function seedRoadBudget(db) {
  let createdRates = 0;
  for (const rate of DEFAULT_RATES) {
    const [row, created] = await db.road_budget_rates.findOrCreate({
      where: { code: rate.code },
      defaults: rate,
    });
    if (created) createdRates += 1;
    else if (!row.unit_price) await row.update(rate);
  }

  const project = await db.road_projects.findOne({
    where: { code: "RE-2026-001" },
    order: [["id", "ASC"]],
  });
  if (!project) return { createdRates, budget: null };

  const existing = await db.road_budgets.findOne({ where: { project_id: project.id } });
  if (existing) return { createdRates, budget: existing, skipped: true };

  // Create budget then run estimator via controller logic inline
  const budget = await db.road_budgets.create({
    project_id: project.id,
    code: `${project.code}-BUD-1`,
    name: `${project.name} — Анхны төсөв`,
    version: 1,
    status: "draft",
    currency: "MNT",
    contingency_pct: 10,
    overhead_pct: 8,
    profit_pct: 5,
    vat_pct: 10,
    road_length_m: project.length,
    estimate_method: "hybrid",
    prepared_by: "Замын инженер",
    notes: "Шороо, хучилт, ус зайлуулалт, байгууламжийн hybrid тооцоо",
  });

  // Call estimator by requiring controller
  const ctrl = require("../controllers/road_budget.controller");
  const fakeReq = { params: { id: budget.id }, body: {} };
  let estimateOk = false;
  await new Promise((resolve) => {
    const fakeRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        estimateOk = Boolean(payload?.success);
        resolve(payload);
      },
    };
    ctrl.estimateBudget(fakeReq, fakeRes).catch((err) => {
      console.error("Budget estimate seed failed:", err.message);
      resolve(null);
    });
  });

  return { createdRates, budget, estimateOk };
}

module.exports = { seedRoadBudget, DEFAULT_RATES };
