const db = require("../models");
const Project = db.projects;
const Task = db.tasks;
const Op = db.Sequelize.Op;

const PROJECT_FIELDS = [
  "name",
  "location",
  "road_name",
  "km_from",
  "km_to",
  "purpose",
  "client_name",
  "contract_number",
  "engineer",
  "budget",
  "equipment",
  "status",
  "staff",
  "planned_start",
  "planned_end",
  "actual_start",
  "actual_end",
  "progress_percent",
  "progress_unit",
  "progress_planned",
  "progress_actual",
  "season_note",
  "notes",
];

function pickProjectBody(body) {
  const data = {};
  PROJECT_FIELDS.forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  if (data.status != null) data.status = Number(data.status);
  if (data.budget != null) data.budget = Number(data.budget);
  if (data.km_from != null && data.km_from !== "") data.km_from = Number(data.km_from);
  if (data.km_to != null && data.km_to !== "") data.km_to = Number(data.km_to);
  if (data.progress_percent != null) data.progress_percent = Number(data.progress_percent);
  if (data.progress_planned != null && data.progress_planned !== "") {
    data.progress_planned = Number(data.progress_planned);
  }
  if (data.progress_actual != null && data.progress_actual !== "") {
    data.progress_actual = Number(data.progress_actual);
  }
  return data;
}

function phaseProgress(phases) {
  if (!phases?.length) return null;
  const sum = phases.reduce((s, p) => s + Number(p.completion_percent || 0), 0);
  return Math.round(sum / phases.length);
}

exports.create = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ success: false, message: "name is required!" });
  }

  try {
    const project = pickProjectBody(req.body);
    if (project.status == null) project.status = 1;
    const data = await Project.create(project);
    res.json({ success: true, data });
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

exports.findAll = async (req, res) => {
  const { name, status, client, q } = req.query;
  const where = {};

  const search = q || name;
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { location: { [Op.iLike]: `%${search}%` } },
      { client_name: { [Op.iLike]: `%${search}%` } },
      { contract_number: { [Op.iLike]: `%${search}%` } },
      { road_name: { [Op.iLike]: `%${search}%` } },
      { engineer: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (status !== undefined && status !== "" && status !== "all") {
    where.status = Number(status);
  }
  if (client) {
    where.client_name = { [Op.iLike]: `%${client}%` };
  }

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
      ],
      order: [["createdAt", "DESC"]],
    });

    const enriched = data.map((p) => {
      const json = p.toJSON();
      const fromPhases = phaseProgress(json.phases);
      return {
        ...json,
        phase_progress: fromPhases,
        effective_progress:
          json.progress_percent > 0 ? json.progress_percent : fromPhases ?? 0,
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

    // Related module hub (best-effort)
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

    res.json({
      success: true,
      data: {
        ...json,
        phase_progress: fromPhases,
        effective_progress: physicalPercent,
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
        },
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
    json.status = 1;
    json.actual_start = null;
    json.actual_end = null;
    json.progress_percent = 0;
    json.progress_actual = null;
    const data = await Project.create(json);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
