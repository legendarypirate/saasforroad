const db = require("../models");
const ProjectRisk = db.project_risks;

const FIELDS = [
  "project_id",
  "title",
  "category",
  "likelihood",
  "impact",
  "score",
  "residual_score",
  "status",
  "owner",
  "mitigation",
];

function pick(body) {
  const data = {};
  FIELDS.forEach((k) => {
    if (body[k] !== undefined) data[k] = body[k];
  });
  if (data.likelihood != null) data.likelihood = Number(data.likelihood);
  if (data.impact != null) data.impact = Number(data.impact);
  if (data.residual_score != null && data.residual_score !== "") {
    data.residual_score = Number(data.residual_score);
  }
  if (data.likelihood != null && data.impact != null) {
    data.score = data.likelihood * data.impact;
  } else if (data.score != null) {
    data.score = Number(data.score);
  }
  return data;
}

exports.create = async (req, res) => {
  try {
    const data = pick(req.body);
    if (!data.project_id || !data.title) {
      return res.status(400).json({ success: false, message: "project_id and title required" });
    }
    if (data.score == null && data.likelihood != null && data.impact != null) {
      data.score = data.likelihood * data.impact;
    }
    const row = await ProjectRisk.create(data);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const where = {};
    if (req.query.project_id) where.project_id = req.query.project_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.category) where.category = req.query.category;
    const data = await ProjectRisk.findAll({
      where,
      order: [
        ["score", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const row = await ProjectRisk.findByPk(req.params.id);
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
    const [n] = await ProjectRisk.update(data, { where: { id: req.params.id } });
    if (n !== 1) return res.status(404).json({ success: false, message: "Not found" });
    const row = await ProjectRisk.findByPk(req.params.id);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const n = await ProjectRisk.destroy({ where: { id: req.params.id } });
    if (n !== 1) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
