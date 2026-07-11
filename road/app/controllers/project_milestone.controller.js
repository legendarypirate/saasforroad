const db = require("../models");
const ProjectMilestone = db.project_milestones;

const FIELDS = [
  "project_id",
  "name",
  "type",
  "due_date",
  "actual_date",
  "status",
  "weight",
  "criteria",
  "sort_order",
];

function pick(body) {
  const data = {};
  FIELDS.forEach((k) => {
    if (body[k] !== undefined) data[k] = body[k];
  });
  if (data.weight != null && data.weight !== "") data.weight = Number(data.weight);
  if (data.sort_order != null) data.sort_order = Number(data.sort_order);
  return data;
}

exports.create = async (req, res) => {
  try {
    const data = pick(req.body);
    if (!data.project_id || !data.name) {
      return res.status(400).json({ success: false, message: "project_id and name required" });
    }
    if (data.sort_order == null) {
      data.sort_order = await ProjectMilestone.count({ where: { project_id: data.project_id } });
    }
    const row = await ProjectMilestone.create(data);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const where = req.query.project_id ? { project_id: req.query.project_id } : {};
    const data = await ProjectMilestone.findAll({
      where,
      order: [
        ["sort_order", "ASC"],
        ["due_date", "ASC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const row = await ProjectMilestone.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = pick(req.body);
    delete data.project_id;
    const [n] = await ProjectMilestone.update(data, { where: { id: req.params.id } });
    if (n !== 1) return res.status(404).json({ success: false, message: "Not found" });
    const row = await ProjectMilestone.findByPk(req.params.id);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const n = await ProjectMilestone.destroy({ where: { id: req.params.id } });
    if (n !== 1) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
