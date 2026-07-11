const db = require("../models");
const Student = db.students;
const Op = db.Sequelize.Op;

const INCLUDE = [
  {
    model: db.projects,
    as: "project",
    attributes: ["id", "name", "road_name"],
    required: false,
  },
  {
    model: db.users,
    as: "mentor",
    attributes: ["id", "username", "phone", "position"],
    required: false,
  },
];

function parseOptionalInt(value) {
  if (value === undefined || value === null || value === "" || value === "null") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildPayload(body = {}) {
  return {
    last_name: body.last_name != null ? String(body.last_name).trim() : undefined,
    first_name: body.first_name != null ? String(body.first_name).trim() : undefined,
    register_number: body.register_number || null,
    phone: body.phone || null,
    email: body.email || null,
    gender: body.gender || null,
    school: body.school || null,
    major: body.major || null,
    course_year: parseOptionalInt(body.course_year),
    student_card_no: body.student_card_no || null,
    internship_type: body.internship_type || "internship",
    status: body.status || "applied",
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    project_id: parseOptionalInt(body.project_id),
    mentor_user_id: parseOptionalInt(body.mentor_user_id),
    department: body.department || null,
    address: body.address || null,
    emergency_contact: body.emergency_contact || null,
    emergency_phone: body.emergency_phone || null,
    notes: body.notes || null,
    is_active:
      body.is_active === undefined
        ? undefined
        : body.is_active !== false && body.is_active !== "false" && body.is_active !== "0",
  };
}

exports.findAll = async (req, res) => {
  try {
    const { q, status, internship_type, school, project_id, is_active } = req.query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { last_name: { [Op.iLike]: `%${q}%` } },
        { first_name: { [Op.iLike]: `%${q}%` } },
        { register_number: { [Op.iLike]: `%${q}%` } },
        { phone: { [Op.iLike]: `%${q}%` } },
        { school: { [Op.iLike]: `%${q}%` } },
        { major: { [Op.iLike]: `%${q}%` } },
        { student_card_no: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (status) where.status = status;
    if (internship_type) where.internship_type = internship_type;
    if (school) where.school = { [Op.iLike]: `%${school}%` };
    if (project_id) where.project_id = parseOptionalInt(project_id);
    if (is_active === "1" || is_active === "true") where.is_active = true;
    if (is_active === "0" || is_active === "false") where.is_active = false;

    const data = await Student.findAll({
      where,
      include: INCLUDE,
      order: [
        ["status", "ASC"],
        ["createdAt", "DESC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.stats = async (_req, res) => {
  try {
    const [total, active, applied, completed, cancelled] = await Promise.all([
      Student.count(),
      Student.count({ where: { status: "active" } }),
      Student.count({ where: { status: "applied" } }),
      Student.count({ where: { status: "completed" } }),
      Student.count({ where: { status: "cancelled" } }),
    ]);
    res.json({
      success: true,
      data: { total, active, applied, completed, cancelled },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await Student.findByPk(req.params.id, { include: INCLUDE });
    if (!data) {
      return res.status(404).json({ success: false, message: "Оюутан олдсонгүй" });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    if (!payload.last_name || !payload.first_name) {
      return res.status(400).json({ success: false, message: "Овог, нэр заавал" });
    }
    if (payload.is_active === undefined) payload.is_active = true;
    const row = await Student.create(payload);
    const full = await Student.findByPk(row.id, { include: INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await Student.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Оюутан олдсонгүй" });
    }
    const payload = buildPayload({ ...row.toJSON(), ...req.body });
    if (!payload.last_name || !payload.first_name) {
      return res.status(400).json({ success: false, message: "Овог, нэр заавал" });
    }
    await row.update(payload);
    const full = await Student.findByPk(row.id, { include: INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const num = await Student.destroy({ where: { id: req.params.id } });
    if (num === 1) return res.json({ success: true, message: "Устгагдлаа" });
    return res.status(404).json({ success: false, message: "Оюутан олдсонгүй" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
