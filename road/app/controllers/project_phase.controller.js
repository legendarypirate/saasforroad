const db = require("../models");
const ProjectPhase = db.project_phases;
const Op = db.Sequelize.Op;

const DEFAULT_COLORS = [
  "#1890ff",
  "#52c41a",
  "#fa8c16",
  "#722ed1",
  "#eb2f96",
  "#13c2c2",
  "#2f54eb",
  "#a0d911",
];

function pickColor(index) {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

exports.create = async (req, res) => {
  const { project_id, name, start_date, end_date, completion_percent, color } = req.body;

  if (!project_id || !name || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: "project_id, name, start_date, end_date are required",
    });
  }

  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({
      success: false,
      message: "end_date must be on or after start_date",
    });
  }

  try {
    const count = await ProjectPhase.count({ where: { project_id } });
    const phase = await ProjectPhase.create({
      project_id,
      name,
      start_date,
      end_date,
      completion_percent: completion_percent ?? 0,
      color: color || pickColor(count),
      sort_order: count,
    });

    res.json({ success: true, data: phase });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Error creating project phase",
    });
  }
};

exports.findAll = async (req, res) => {
  const project_id = req.query.project_id;
  const where = project_id ? { project_id } : {};

  try {
    const data = await ProjectPhase.findAll({
      where,
      order: [
        ["sort_order", "ASC"],
        ["start_date", "ASC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Error retrieving project phases",
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const phase = await ProjectPhase.findByPk(req.params.id);
    if (!phase) {
      return res.status(404).json({ success: false, message: "Phase not found" });
    }
    res.json({ success: true, data: phase });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Error retrieving phase",
    });
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  const { name, start_date, end_date, completion_percent, color, sort_order } = req.body;

  if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({
      success: false,
      message: "end_date must be on or after start_date",
    });
  }

  try {
    const phase = await ProjectPhase.findByPk(id);
    if (!phase) {
      return res.status(404).json({ success: false, message: "Phase not found" });
    }

    await phase.update({
      name: name ?? phase.name,
      start_date: start_date ?? phase.start_date,
      end_date: end_date ?? phase.end_date,
      completion_percent:
        completion_percent !== undefined ? completion_percent : phase.completion_percent,
      color: color ?? phase.color,
      sort_order: sort_order !== undefined ? sort_order : phase.sort_order,
    });

    res.json({ success: true, data: phase });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Error updating phase",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const num = await ProjectPhase.destroy({ where: { id: req.params.id } });
    if (num === 1) {
      return res.json({ success: true, message: "Phase deleted" });
    }
    return res.status(404).json({ success: false, message: "Phase not found" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Error deleting phase",
    });
  }
};
