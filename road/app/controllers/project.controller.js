const db = require("../models");
const Project = db.projects;
const Task = db.tasks;
const Op = db.Sequelize.Op;
const { seedProjectPhases } = require("../utils/projectPhaseTemplate");

const PROJECT_FIELDS = [
  "name",
  "code",
  "location",
  "province",
  "aimag_soum",
  "road_name",
  "road_class",
  "km_from",
  "km_to",
  "length_km",
  "purpose",
  "client_name",
  "employer_name",
  "contractor_name",
  "engineer_org",
  "employer_rep",
  "contractor_rep",
  "contract_number",
  "contract_type",
  "contract_date",
  "currency",
  "retention_pct",
  "liquidated_damages_per_day",
  "funding_source",
  "tender_ref",
  "engineer",
  "budget",
  "contingency_pct",
  "committed_amount",
  "equipment",
  "status",
  "stage",
  "staff",
  "planned_start",
  "planned_end",
  "actual_start",
  "actual_end",
  "baseline_start",
  "baseline_end",
  "progress_percent",
  "progress_unit",
  "progress_planned",
  "progress_actual",
  "season_note",
  "notes",
  "road_project_id",
];

const NUM_FIELDS = [
  "budget",
  "km_from",
  "km_to",
  "length_km",
  "progress_percent",
  "progress_planned",
  "progress_actual",
  "retention_pct",
  "liquidated_damages_per_day",
  "contingency_pct",
  "committed_amount",
  "road_project_id",
  "status",
];

function computeLengthKm(from, to) {
  if (from == null || to == null || from === "" || to === "") return null;
  const a = Number(from);
  const b = Number(to);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.abs(b - a);
}

function pickProjectBody(body) {
  const data = {};
  PROJECT_FIELDS.forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  NUM_FIELDS.forEach((key) => {
    if (data[key] != null && data[key] !== "") data[key] = Number(data[key]);
    else if (data[key] === "") data[key] = null;
  });

  // Sync employer alias with legacy client_name
  if (data.employer_name != null && data.client_name == null) {
    data.client_name = data.employer_name;
  }
  if (data.client_name != null && data.employer_name == null) {
    data.employer_name = data.client_name;
  }

  if (data.length_km == null && (data.km_from != null || data.km_to != null)) {
    const len = computeLengthKm(data.km_from, data.km_to);
    if (len != null) data.length_km = len;
  }

  return data;
}

function phaseProgress(phases) {
  if (!phases?.length) return null;
  const sum = phases.reduce((s, p) => s + Number(p.completion_percent || 0), 0);
  return Math.round(sum / phases.length);
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

/** Earned value lite from budget, dates, progress, and actual cost. */
function calcEarnedValue({ budget, planned_start, planned_end, progress, spent, today }) {
  const B = Number(budget) || 0;
  const prog = Math.min(100, Math.max(0, Number(progress) || 0));
  const AC = Number(spent) || 0;
  const EV = B * (prog / 100);

  const start = planned_start;
  const end = planned_end;
  const now = today || new Date().toISOString().slice(0, 10);
  const totalDays = daysBetween(start, end);
  let PV = 0;
  if (B > 0 && totalDays != null && totalDays > 0 && start) {
    const elapsed = daysBetween(start, now);
    const ratio = Math.min(1, Math.max(0, (elapsed ?? 0) / totalDays));
    PV = B * ratio;
  } else if (B > 0) {
    PV = B * (prog / 100);
  }

  const SPI = PV > 0 ? EV / PV : null;
  const CPI = AC > 0 ? EV / AC : null;

  return {
    PV: Math.round(PV * 100) / 100,
    EV: Math.round(EV * 100) / 100,
    AC: Math.round(AC * 100) / 100,
    SPI: SPI != null ? Math.round(SPI * 100) / 100 : null,
    CPI: CPI != null ? Math.round(CPI * 100) / 100 : null,
    progress: prog,
  };
}

async function nextProjectCode() {
  const year = new Date().getFullYear();
  const prefix = `PRJ-${year}-`;
  const count = await Project.count();
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

function isDelayed(json) {
  if (!json.planned_end) return false;
  if (json.status === 3 || json.status === 4) return false;
  const today = new Date().toISOString().slice(0, 10);
  return json.planned_end < today;
}

exports.create = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ success: false, message: "name is required!" });
  }

  try {
    const project = pickProjectBody(req.body);
    if (project.status == null) project.status = 1;
    if (!project.stage) project.stage = "mobilization";
    if (!project.currency) project.currency = "MNT";
    if (!project.contract_type) project.contract_type = "Domestic";
    if (!project.code) project.code = await nextProjectCode();
    if (!project.baseline_start && project.planned_start) {
      project.baseline_start = project.planned_start;
    }
    if (!project.baseline_end && project.planned_end) {
      project.baseline_end = project.planned_end;
    }
    if (req.tenant?.id) {
      project.tenant_id = req.tenant.id;
    }

    const data = await Project.create(project);
    const seedPhases = req.body.seed_phases !== false;
    let phasesCreated = 0;
    if (seedPhases) {
      phasesCreated = await seedProjectPhases(db, data);
    }

    res.json({ success: true, data, phases_created: phasesCreated });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while creating the project.",
    });
  }
};

exports.getProjectsWithUsers = async (req, res) => {
  try {
    const projects = await db.projects.findAll({
      include: [
        {
          model: db.users,
          attributes: ["id", "username", "email", "position"],
          through: { attributes: ["inviteStatus", "role"] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Error retrieving projects with users.",
    });
  }
};

exports.portfolio = async (_req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: db.project_phases,
          as: "phases",
          attributes: ["id", "completion_percent"],
          required: false,
        },
        {
          model: db.project_risks,
          as: "risks",
          attributes: ["id", "score", "status"],
          required: false,
        },
      ],
    });

    let totalBudget = 0;
    let totalSpent = 0;
    let progressSum = 0;
    let delayed = 0;
    let atRisk = 0;
    const byStatus = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const byStage = {};

    const expenseMap = {};
    if (db.fin_expenses) {
      const expenses = await db.fin_expenses.findAll({ attributes: ["project_id", "amount"] });
      expenses.forEach((e) => {
        const pid = e.project_id;
        if (!pid) return;
        expenseMap[pid] = (expenseMap[pid] || 0) + Number(e.amount || 0);
      });
    }

    projects.forEach((p) => {
      const json = p.toJSON();
      const fromPhases = phaseProgress(json.phases);
      const progress =
        json.progress_percent > 0 ? json.progress_percent : fromPhases ?? 0;
      totalBudget += Number(json.budget || 0);
      totalSpent += expenseMap[json.id] || 0;
      progressSum += progress;
      byStatus[json.status] = (byStatus[json.status] || 0) + 1;
      const stage = json.stage || "mobilization";
      byStage[stage] = (byStage[stage] || 0) + 1;
      if (isDelayed(json)) delayed += 1;
      const openHigh = (json.risks || []).filter(
        (r) => r.status !== "closed" && Number(r.score || 0) >= 15,
      );
      if (openHigh.length) atRisk += 1;
    });

    const n = projects.length || 1;
    res.json({
      success: true,
      data: {
        cards: {
          total: projects.length,
          active: byStatus[2] || 0,
          planned: byStatus[1] || 0,
          done: byStatus[3] || 0,
          archived: byStatus[4] || 0,
          delayed,
          at_risk: atRisk,
          total_budget: totalBudget,
          total_spent: totalSpent,
          avg_progress: Math.round(progressSum / n),
        },
        by_status: byStatus,
        by_stage: byStage,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  const { name, status, client, q, stage, province, contract_type } = req.query;
  const where = {};

  const search = q || name;
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { code: { [Op.iLike]: `%${search}%` } },
      { location: { [Op.iLike]: `%${search}%` } },
      { client_name: { [Op.iLike]: `%${search}%` } },
      { employer_name: { [Op.iLike]: `%${search}%` } },
      { contract_number: { [Op.iLike]: `%${search}%` } },
      { road_name: { [Op.iLike]: `%${search}%` } },
      { engineer: { [Op.iLike]: `%${search}%` } },
      { province: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (status !== undefined && status !== "" && status !== "all") {
    where.status = Number(status);
  }
  if (client) {
    where.client_name = { [Op.iLike]: `%${client}%` };
  }
  if (stage) where.stage = stage;
  if (province) where.province = { [Op.iLike]: `%${province}%` };
  if (contract_type) where.contract_type = contract_type;
  if (req.tenant?.id) where.tenant_id = req.tenant.id;

  try {
    const data = await Project.findAll({
      where,
      include: [
        {
          model: db.users,
          attributes: ["id", "username", "email", "position"],
          through: { attributes: ["inviteStatus", "role"] },
          required: false,
        },
        {
          model: db.project_phases,
          as: "phases",
          attributes: ["id", "completion_percent"],
          required: false,
        },
        {
          model: db.project_risks,
          as: "risks",
          attributes: ["id", "score", "status"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const expenseMap = {};
    if (db.fin_expenses) {
      const expenses = await db.fin_expenses.findAll({ attributes: ["project_id", "amount"] });
      expenses.forEach((e) => {
        const pid = e.project_id;
        if (!pid) return;
        expenseMap[pid] = (expenseMap[pid] || 0) + Number(e.amount || 0);
      });
    }

    const enriched = data.map((p) => {
      const json = p.toJSON();
      const fromPhases = phaseProgress(json.phases);
      const progress =
        json.progress_percent > 0 ? json.progress_percent : fromPhases ?? 0;
      const spent = expenseMap[json.id] || 0;
      const ev = calcEarnedValue({
        budget: json.budget,
        planned_start: json.planned_start || json.baseline_start,
        planned_end: json.planned_end || json.baseline_end,
        progress,
        spent,
      });
      const openHighRisks = (json.risks || []).filter(
        (r) => r.status !== "closed" && Number(r.score || 0) >= 15,
      ).length;
      return {
        ...json,
        phase_progress: fromPhases,
        effective_progress: progress,
        delayed: isDelayed(json),
        at_risk: openHighRisks > 0,
        high_risk_count: openHighRisks,
        finance: {
          budget: Number(json.budget || 0),
          spent,
          remaining: Number(json.budget || 0) - spent,
        },
        earned_value: ev,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while retrieving projects.",
    });
  }
};

exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const project = await Project.findByPk(id, {
      include: [
        {
          model: db.users,
          attributes: ["id", "username", "email", "position"],
          through: { attributes: ["inviteStatus", "role"] },
          required: false,
        },
        {
          model: db.project_phases,
          as: "phases",
          required: false,
          separate: true,
          order: [
            ["sort_order", "ASC"],
            ["start_date", "ASC"],
          ],
        },
        {
          model: db.project_milestones,
          as: "milestones",
          required: false,
          separate: true,
          order: [
            ["sort_order", "ASC"],
            ["due_date", "ASC"],
          ],
        },
        {
          model: db.project_risks,
          as: "risks",
          required: false,
          separate: true,
          order: [
            ["score", "DESC"],
            ["createdAt", "DESC"],
          ],
        },
        {
          model: db.road_projects,
          as: "roadProject",
          required: false,
          attributes: ["id", "code", "name", "status", "length", "road_class"],
        },
      ],
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Cannot find project with id=${id}.`,
      });
    }

    const tasks = await Task.findAll({
      where: { project_id: id },
      include: [
        {
          model: db.milestones,
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 3).length;
    const inProgress = tasks.filter((t) => t.status === 2).length;
    const todo = tasks.filter((t) => t.status === 0 || t.status === 1).length;
    const taskPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const json = project.toJSON();
    const fromPhases = phaseProgress(json.phases);
    const physicalPercent =
      json.progress_percent > 0 ? json.progress_percent : fromPhases ?? taskPercent;

    const related = {
      daily_reports: 0,
      expenses_total: 0,
      plant_sales_total: 0,
      plant_sales_count: 0,
      contracts: 0,
      hse_incidents: 0,
      equipment_count: 0,
    };

    try {
      if (db.daily_reports) {
        related.daily_reports = await db.daily_reports.count({ where: { project_id: id } });
      }
      if (db.fin_expenses) {
        const rows = await db.fin_expenses.findAll({
          where: { project_id: id },
          attributes: ["amount"],
        });
        related.expenses_total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
      }
      if (db.plant_sales) {
        const sales = await db.plant_sales.findAll({
          where: { project_id: id },
          attributes: ["total_amount"],
        });
        related.plant_sales_count = sales.length;
        related.plant_sales_total = sales.reduce((s, r) => s + Number(r.total_amount || 0), 0);
      }
      if (db.fin_contracts) {
        related.contracts = await db.fin_contracts.count({ where: { project_id: id } });
      }
      if (db.hse_incidents) {
        related.hse_incidents = await db.hse_incidents.count({ where: { project_id: id } });
      }
      if (db.project_equipment_links) {
        related.equipment_count = await db.project_equipment_links.count({
          where: { project_id: id },
        });
      }
    } catch (hubErr) {
      console.warn("Project related hub partial:", hubErr.message);
    }

    const budget = Number(json.budget || 0);
    const spent = related.expenses_total;
    const budgetRemaining = budget - spent;
    const earned_value = calcEarnedValue({
      budget,
      planned_start: json.planned_start || json.baseline_start,
      planned_end: json.planned_end || json.baseline_end,
      progress: physicalPercent,
      spent,
    });

    res.json({
      success: true,
      data: {
        ...json,
        phase_progress: fromPhases,
        effective_progress: physicalPercent,
        delayed: isDelayed(json),
        tasks: tasks.map((t) => ({
          ...t.toJSON(),
          milestone: t.milestone ? t.milestone.name : null,
        })),
        stats: {
          total,
          completed,
          inProgress,
          todo,
          completionPercent: taskPercent,
          physicalPercent,
          phasePercent: fromPhases,
        },
        related,
        finance: {
          budget,
          spent,
          remaining: budgetRemaining,
          utilization: budget > 0 ? Math.round((spent / budget) * 100) : 0,
          contingency_pct: Number(json.contingency_pct || 0),
          committed_amount: Number(json.committed_amount || 0),
        },
        earned_value,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Error retrieving project with id=" + id,
    });
  }
};

exports.total = async (_req, res) => {
  try {
    const projects = await Project.findAll({ attributes: ["id", "status"] });
    const total = projects.length;
    const planned = projects.filter((p) => p.status === 1).length;
    const ongoing = projects.filter((p) => p.status === 2).length;
    const done = projects.filter((p) => p.status === 3).length;
    const archived = projects.filter((p) => p.status === 4).length;
    const tasks = await Task.count();

    res.send({
      success: true,
      total,
      planned,
      ongoing,
      done,
      archived,
      tasks,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving summary.",
    });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const updateData = pickProjectBody(req.body);
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is empty. Provide at least one field to update.",
      });
    }

    const [num] = await Project.update(updateData, { where: { id } });
    if (num !== 1) {
      return res.status(404).json({
        success: false,
        message: `Cannot update project with id=${id}. Maybe project was not found.`,
      });
    }

    const updatedProject = await Project.findByPk(id);
    res.json({
      success: true,
      message: "Project updated successfully.",
      data: updatedProject,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating project with id=" + id,
      error: err.message,
    });
  }
};

exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await Project.destroy({ where: { id } });
    if (num === 1) {
      return res.json({ success: true, message: "Project was deleted successfully!" });
    }
    res.status(404).json({
      success: false,
      message: `Cannot delete project with id=${id}. Maybe project was not found.`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Could not delete project with id=" + id,
    });
  }
};

exports.deleteAll = async (_req, res) => {
  try {
    const nums = await Project.destroy({ where: {}, truncate: false });
    res.json({ success: true, message: `${nums} projects were deleted successfully!` });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while removing all projects.",
    });
  }
};

exports.findAllPublished = async (_req, res) => {
  try {
    const data = await Project.findAll({
      where: { status: { [Op.in]: [1, 2, 3] } },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while retrieving projects.",
    });
  }
};

/** Soft archive = status 4 */
exports.archive = async (req, res) => {
  const id = req.params.id;
  try {
    const [num] = await Project.update({ status: 4 }, { where: { id } });
    if (num !== 1) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    const data = await Project.findByPk(id);
    res.json({ success: true, message: "Архивлагдлаа", data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.duplicate = async (req, res) => {
  const id = req.params.id;
  try {
    const src = await Project.findByPk(id);
    if (!src) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const json = src.toJSON();
    delete json.id;
    delete json.createdAt;
    delete json.updatedAt;
    json.name = `${json.name} (хуулбар)`;
    json.code = await nextProjectCode();
    json.status = 1;
    json.actual_start = null;
    json.actual_end = null;
    json.progress_percent = 0;
    json.progress_actual = null;
    const data = await Project.create(json);
    const phasesCreated = await seedProjectPhases(db, data);
    res.json({ success: true, data, phases_created: phasesCreated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** Backfill stage-gate phases for an existing project */
exports.seedPhases = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Not found" });
    const n = await seedProjectPhases(db, project, { force: !!req.body?.force });
    res.json({ success: true, phases_created: n });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.calcEarnedValue = calcEarnedValue;
