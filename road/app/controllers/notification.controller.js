const db = require("../models");
const Notification = db.notifications;
const Op = db.Sequelize.Op;

const INCLUDE = [
  {
    model: db.projects,
    as: "project",
    attributes: ["id", "name"],
    required: false,
  },
  {
    model: db.users,
    as: "author",
    attributes: ["id", "username"],
    required: false,
  },
];

function parseOptionalInt(value) {
  if (value === undefined || value === null || value === "" || value === "null") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildPayload(body = {}, { forCreate = false } = {}) {
  const status = body.status || (forCreate ? "draft" : undefined);
  const payload = {};

  if (body.title !== undefined) payload.title = String(body.title).trim();
  if (body.description !== undefined) payload.description = body.description || null;
  if (status !== undefined) payload.status = status;
  if (body.audience !== undefined) payload.audience = body.audience || "all";
  if (body.priority !== undefined) payload.priority = body.priority || "normal";
  if (body.project_id !== undefined) payload.project_id = parseOptionalInt(body.project_id);
  if (body.expires_at !== undefined) payload.expires_at = body.expires_at || null;
  if (body.user_id !== undefined) payload.user_id = parseOptionalInt(body.user_id);

  if (status === "published") {
    payload.published_at = body.published_at || new Date();
  } else if (status === "draft" || status === "archived") {
    if (body.published_at !== undefined) payload.published_at = body.published_at || null;
  } else if (body.published_at !== undefined) {
    payload.published_at = body.published_at || null;
  }

  return payload;
}

exports.create = async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ success: false, message: "Гарчиг заавал оруулна уу" });
    }
    const payload = buildPayload(req.body, { forCreate: true });
    if (!payload.user_id) payload.user_id = 1;

    const data = await Notification.create(payload);
    const full = await Notification.findByPk(data.id, { include: INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Мэдэгдэл үүсгэхэд алдаа гарлаа",
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { q, status, audience, priority, project_id } = req.query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (status) where.status = status;
    if (audience) where.audience = audience;
    if (priority) where.priority = priority;
    if (project_id) where.project_id = parseOptionalInt(project_id);

    const data = await Notification.findAll({
      where,
      include: INCLUDE,
      order: [
        ["priority", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Мэдэгдэл татахад алдаа гарлаа",
    });
  }
};

exports.stats = async (_req, res) => {
  try {
    const [total, draft, published, archived, urgent] = await Promise.all([
      Notification.count(),
      Notification.count({ where: { status: "draft" } }),
      Notification.count({ where: { status: "published" } }),
      Notification.count({ where: { status: "archived" } }),
      Notification.count({ where: { priority: "urgent", status: { [Op.ne]: "archived" } } }),
    ]);
    res.json({
      success: true,
      data: { total, draft, published, archived, urgent },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const data = await Notification.findByPk(req.params.id, { include: INCLUDE });
    if (!data) {
      return res.status(404).json({ success: false, message: "Мэдэгдэл олдсонгүй" });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Мэдэгдэл татахад алдаа гарлаа",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await Notification.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Мэдэгдэл олдсонгүй" });
    }
    const payload = buildPayload(req.body);
    if (payload.title !== undefined && !payload.title) {
      return res.status(400).json({ success: false, message: "Гарчиг хоосон байж болохгүй" });
    }
    // Keep published_at when already published and status stays published
    if (
      payload.status === "published" &&
      row.status === "published" &&
      !payload.published_at &&
      row.published_at
    ) {
      delete payload.published_at;
    }
    await row.update(payload);
    const full = await Notification.findByPk(row.id, { include: INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Мэдэгдэл шинэчлэхэд алдаа гарлаа",
    });
  }
};

exports.publish = async (req, res) => {
  try {
    const row = await Notification.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Мэдэгдэл олдсонгүй" });
    }
    await row.update({
      status: "published",
      published_at: row.published_at || new Date(),
    });
    const full = await Notification.findByPk(row.id, { include: INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.archive = async (req, res) => {
  try {
    const row = await Notification.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Мэдэгдэл олдсонгүй" });
    }
    await row.update({ status: "archived" });
    const full = await Notification.findByPk(row.id, { include: INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const num = await Notification.destroy({ where: { id: req.params.id } });
    if (num === 1) {
      return res.json({ success: true, message: "Мэдэгдэл устгагдлаа" });
    }
    res.status(404).json({ success: false, message: "Мэдэгдэл олдсонгүй" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Мэдэгдэл устгахад алдаа гарлаа",
    });
  }
};
