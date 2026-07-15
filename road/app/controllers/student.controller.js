const db = require("../models");
const Student = db.students;
const Op = db.Sequelize.Op;
const multer = require("multer");
const { uploadImage } = require("../utils/cloudinary");
const { rejectPlatformOwned } = require("../utils/platformDataReadonly");

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith("image/");
    cb(ok ? null : new Error("Зөвхөн зураг файл хүлээн авна"), ok);
  },
}).single("image");

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

function parseGpa(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function parseSkills(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return [];
  let list = value;
  if (typeof value === "string") {
    try {
      list = JSON.parse(value);
    } catch {
      list = value.split(/[,;\n]/);
    }
  }
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const s = String(item || "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function buildPayload(body = {}) {
  const payload = {
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

  if (body.photo !== undefined) payload.photo = body.photo || null;

  if (body.gpa !== undefined) payload.gpa = parseGpa(body.gpa);

  if (body.skills !== undefined) payload.skills = parseSkills(body.skills);

  return payload;
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
  return rejectPlatformOwned(res);
};

exports.update = async (req, res) => {
  return rejectPlatformOwned(res);
};

exports.uploadPhoto = (req, res) => rejectPlatformOwned(res);



exports.delete = async (req, res) => {
  return rejectPlatformOwned(res);
};
