const db = require("../models");
const Op = db.Sequelize.Op;
const multer = require("multer");
const { uploadImage } = require("../utils/cloudinary");
const { calculateReputationScore } = require("../utils/brigadeReputation");

const Brigade = db.brigades;
const BrigadeMember = db.brigade_members;
const BrigadeEquipment = db.brigade_equipment;
const HireRequest = db.hire_requests;
const HireHistory = db.hire_request_history;
const BrigadeReview = db.brigade_reviews;
const BrigadeDocument = db.brigade_documents;
const Timeline = db.brigade_timeline_events;
const ProgressReport = db.brigade_progress_reports;
const BrigadeNotification = db.brigade_notifications;

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith("image/");
    cb(ok ? null : new Error("Зөвхөн зураг файл хүлээн авна"), ok);
  },
}).single("image");

const LEADER_ATTRS = ["id", "username", "phone", "position", "profile_image"];
const USER_ATTRS = ["id", "username", "phone", "position", "profile_image", "email"];

const LIST_INCLUDE = [];

const DETAIL_INCLUDE = [
  {
    model: BrigadeMember,
    as: "members",
  },
  {
    model: BrigadeEquipment,
    as: "equipmentLinks",
    include: [{ model: db.equipments, as: "equipment", required: false }],
  },
  {
    model: BrigadeReview,
    as: "reviews",
    include: [
      { model: db.users, as: "reviewer", attributes: LEADER_ATTRS, required: false },
      { model: db.projects, as: "project", attributes: ["id", "name", "road_name"], required: false },
    ],
  },
  { model: BrigadeDocument, as: "documents" },
  {
    model: Timeline,
    as: "timeline",
    include: [{ model: db.users, as: "actor", attributes: LEADER_ATTRS, required: false }],
  },
  {
    model: HireRequest,
    as: "hireRequests",
    include: [
      { model: db.projects, as: "project", attributes: ["id", "name", "road_name", "status", "progress_percent"], required: false },
      { model: db.users, as: "requester", attributes: LEADER_ATTRS, required: false },
    ],
  },
];

function sanitizeBrigade(row) {
  if (!row) return row;
  const json = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
  delete json.password;
  // Synthetic leader object for admin UI (from brigade credentials, not users)
  json.leader = json.username
    ? {
        id: json.id,
        username: json.username,
        phone: json.phone || json.contact_phone || null,
        position: "leader",
      }
    : null;
  return json;
}

function parseOptionalInt(value) {
  if (value === undefined || value === null || value === "" || value === "null") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

function parseJsonArray(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function buildBrigadePayload(body = {}) {
  const payload = {
    name: body.name != null ? String(body.name).trim() : undefined,
    username: body.username !== undefined ? String(body.username || "").trim() || null : undefined,
    leader_name: body.leader_name !== undefined ? body.leader_name || null : undefined,
    phone: body.phone !== undefined ? body.phone || null : undefined,
    // Never accept leader_user_id from clients — brigades are not company users.
    leader_user_id: undefined,
    province: body.province !== undefined ? body.province || null : undefined,
    location: body.location !== undefined ? body.location || null : undefined,
    contact_phone: body.contact_phone !== undefined ? body.contact_phone || null : undefined,
    contact_email: body.contact_email !== undefined ? body.contact_email || null : undefined,
    description: body.description !== undefined ? body.description || null : undefined,
    availability: body.availability || undefined,
    status: body.status || undefined,
    is_active:
      body.is_active === undefined
        ? undefined
        : body.is_active !== false && body.is_active !== "false" && body.is_active !== "0",
  };
  if (body.logo !== undefined) payload.logo = body.logo || null;
  if (body.skills !== undefined) payload.skills = parseSkills(body.skills);
  // Strip undefined keys so Sequelize update/create stay clean
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });
  return payload;
}

async function addTimeline(brigadeId, event_type, title, description, actor_user_id, meta = {}) {
  return Timeline.create({
    brigade_id: brigadeId,
    event_type,
    title,
    description: description || null,
    actor_user_id: actor_user_id || null,
    meta,
  });
}

async function notifyBrigade({ brigade_id, type, title, body, related_id, related_type }) {
  if (!brigade_id) return null;
  return BrigadeNotification.create({
    brigade_id,
    user_id: null,
    type,
    title,
    body: body || null,
    related_id: related_id || null,
    related_type: related_type || null,
  });
}

/** Notify a company staff user (hire requester, etc.) — not brigade leaders. */
async function notifyUser({ user_id, brigade_id, type, title, body, related_id, related_type }) {
  if (!user_id) return null;
  return BrigadeNotification.create({
    user_id,
    brigade_id: brigade_id || null,
    type,
    title,
    body: body || null,
    related_id: related_id || null,
    related_type: related_type || null,
  });
}

async function refreshBrigadeStats(brigadeId) {
  const brigade = await Brigade.findByPk(brigadeId);
  if (!brigade) return null;

  const [reviews, hireCounts, members] = await Promise.all([
    BrigadeReview.findAll({ where: { brigade_id: brigadeId } }),
    HireRequest.findAll({
      where: { brigade_id: brigadeId },
      attributes: ["id", "status"],
    }),
    BrigadeMember.findAll({ where: { brigade_id: brigadeId, status: "active" } }),
  ]);

  const completed = hireCounts.filter((h) => ["completed", "reviewed"].includes(h.status)).length;
  const active = hireCounts.filter((h) => ["accepted", "active"].includes(h.status)).length;
  const cancelled = hireCounts.filter((h) => h.status === "rejected").length;
  const totalFinished = completed + cancelled;
  const completion_rate =
    totalFinished === 0 ? 100 : Math.round((completed / totalFinished) * 10000) / 100;

  let average_rating = 0;
  let safety_from_reviews = toAvg(reviews.map((r) => r.safety));
  if (reviews.length > 0) {
    average_rating =
      Math.round(
        (reviews.reduce((s, r) => s + Number(r.overall_rating || 0), 0) / reviews.length) * 100
      ) / 100;
  }

  const attendance_score =
    members.length === 0
      ? Number(brigade.attendance_score) || 100
      : Math.round(
          (members.reduce((s, m) => s + Number(m.attendance_rate || 100), 0) / members.length) * 100
        ) / 100;

  const safety_score =
    reviews.length > 0
      ? Math.round((safety_from_reviews / 5) * 10000) / 100
      : Number(brigade.safety_score) || 100;

  const patch = {
    completed_tasks: completed,
    active_tasks: active,
    cancelled_tasks: cancelled,
    completion_rate,
    average_rating,
    safety_score,
    attendance_score,
  };

  patch.reputation_score = calculateReputationScore({
    ...brigade.toJSON(),
    ...patch,
  });

  await brigade.update(patch);
  return brigade;
}

function toAvg(arr) {
  const nums = arr.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function serializeListRow(row) {
  const j = sanitizeBrigade(row);
  const members = j.members || [];
  const hireRequests = j.hireRequests || [];
  return {
    ...j,
    member_count: members.length || j.member_count || 0,
    active_projects: (hireRequests.filter
      ? hireRequests.filter((h) => ["accepted", "active"].includes(h.status)).length
      : j.active_tasks) || Number(j.active_tasks) || 0,
  };
}

// ─── Stats ───────────────────────────────────────────────
exports.stats = async (_req, res) => {
  try {
    const [
      total,
      available,
      busy,
      activeHires,
      completedTasksAgg,
      ratingAgg,
    ] = await Promise.all([
      Brigade.count(),
      Brigade.count({ where: { availability: "available", status: "active" } }),
      Brigade.count({ where: { availability: "busy" } }),
      HireRequest.count({ where: { status: { [Op.in]: ["sent", "accepted", "active"] } } }),
      Brigade.sum("completed_tasks"),
      Brigade.findAll({
        attributes: [
          [db.Sequelize.fn("AVG", db.Sequelize.col("average_rating")), "avg_rating"],
        ],
        raw: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        available,
        busy,
        active_hire_requests: activeHires,
        completed_tasks: Number(completedTasksAgg) || 0,
        average_rating: Math.round((Number(ratingAgg?.[0]?.avg_rating) || 0) * 100) / 100,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── List ────────────────────────────────────────────────
exports.findAll = async (req, res) => {
  try {
    const {
      q,
      province,
      availability,
      status,
      skill,
      equipment,
      min_rating,
      max_rating,
      min_reputation,
      max_reputation,
      min_completed,
      sort = "createdAt",
      order = "DESC",
      page,
      pageSize,
      leader_user_id,
    } = req.query;

    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { province: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
        { contact_phone: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (province) where.province = { [Op.iLike]: `%${province}%` };
    if (availability) where.availability = availability;
    if (status) where.status = status;
    if (leader_user_id) where.leader_user_id = parseOptionalInt(leader_user_id);
    if (min_rating) where.average_rating = { ...(where.average_rating || {}), [Op.gte]: Number(min_rating) };
    if (max_rating) where.average_rating = { ...(where.average_rating || {}), [Op.lte]: Number(max_rating) };
    if (min_reputation) {
      where.reputation_score = { ...(where.reputation_score || {}), [Op.gte]: Number(min_reputation) };
    }
    if (max_reputation) {
      where.reputation_score = { ...(where.reputation_score || {}), [Op.lte]: Number(max_reputation) };
    }
    if (min_completed) where.completed_tasks = { [Op.gte]: Number(min_completed) };
    if (skill) {
      where.skills = { [Op.contains]: [String(skill)] };
    }

    const include = [
      ...LIST_INCLUDE,
      {
        model: BrigadeMember,
        as: "members",
        attributes: ["id"],
        required: false,
      },
      {
        model: HireRequest,
        as: "hireRequests",
        attributes: ["id", "status"],
        required: false,
      },
    ];

    if (equipment) {
      include.push({
        model: BrigadeEquipment,
        as: "equipmentLinks",
        required: true,
        include: [
          {
            model: db.equipments,
            as: "equipment",
            required: true,
            where: {
              name: { [Op.iLike]: `%${equipment}%` },
            },
          },
        ],
      });
    }

    const allowedSort = [
      "createdAt",
      "name",
      "average_rating",
      "reputation_score",
      "completed_tasks",
      "province",
      "status",
      "availability",
    ];
    const sortCol = allowedSort.includes(sort) ? sort : "createdAt";
    const sortDir = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";

    const limit = pageSize ? Math.min(200, Math.max(1, Number(pageSize) || 20)) : undefined;
    const offset =
      page && limit ? Math.max(0, (Math.max(1, Number(page) || 1) - 1) * limit) : undefined;

    const { rows, count } = await Brigade.findAndCountAll({
      where,
      include,
      order: [[sortCol, sortDir]],
      distinct: true,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows.map(serializeListRow),
      meta: {
        total: count,
        page: page ? Number(page) : 1,
        pageSize: limit || count,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Detail ──────────────────────────────────────────────
exports.findOne = async (req, res) => {
  try {
    const data = await Brigade.findByPk(req.params.id, {
      include: DETAIL_INCLUDE,
      order: [
        [{ model: Timeline, as: "timeline" }, "createdAt", "DESC"],
        [{ model: BrigadeReview, as: "reviews" }, "createdAt", "DESC"],
      ],
    });
    if (!data) {
      return res.status(404).json({ success: false, message: "Бригад олдсонгүй" });
    }
    res.json({ success: true, data: sanitizeBrigade(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const { rejectPlatformOwned } = require("../utils/platformDataReadonly");

exports.create = async (req, res) => {
  return rejectPlatformOwned(res);
};

exports.update = async (req, res) => {
  try {
    const row = await Brigade.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Бригад олдсонгүй" });
    }
    // Protect computed fields from manual edit
    const body = { ...req.body };
    delete body.average_rating;
    delete body.reputation_score;
    delete body.completed_tasks;
    delete body.active_tasks;
    delete body.cancelled_tasks;

    const payload = buildBrigadePayload(body);
    await row.update(payload);
    await refreshBrigadeStats(row.id);
    const full = await Brigade.findByPk(row.id, { include: DETAIL_INCLUDE });
    res.json({ success: true, data: sanitizeBrigade(full) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const row = await Brigade.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Бригад олдсонгүй" });
    }
    const status = req.body.status;
    if (!["active", "suspended", "inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Буруу статус" });
    }
    const prev = row.status;
    await row.update({
      status,
      is_active: status === "active",
      availability: status === "suspended" ? "unavailable" : row.availability,
    });
    await addTimeline(
      row.id,
      "status_changed",
      status === "suspended" ? "Бригад түдгэлзүүлэгдлээ" : "Бригад идэвхжүүлэгдлээ",
      `${prev} → ${status}`,
      parseOptionalInt(req.body.actor_user_id)
    );
    const full = await Brigade.findByPk(row.id, { include: DETAIL_INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadLogo = (req, res) => {
  const id = req.params.id;
  photoUpload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.code === "LIMIT_FILE_SIZE" ? "Файл 5MB-аас их байна" : "Файл upload алдаа",
      });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Файл upload алдаа" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "image файл шаардлагатай" });
    }
    try {
      const existing = await Brigade.findByPk(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Бригад олдсонгүй" });
      }
      const result = await uploadImage(req.file.buffer, req.file.mimetype, {
        folder: "rd_zam/brigades",
        public_id: `brigade_${id}`,
        overwrite: true,
        invalidate: true,
      });
      await existing.update({ logo: result.secure_url });
      const full = await Brigade.findByPk(id, { include: DETAIL_INCLUDE });
      res.json({ success: true, data: full, logo: result.secure_url });
    } catch (uploadErr) {
      res.status(500).json({
        success: false,
        message: uploadErr.message || "Зураг хадгалахад алдаа",
      });
    }
  });
};

exports.delete = async (req, res) => {
  return rejectPlatformOwned(res);
};

// ─── Members ─────────────────────────────────────────────
exports.listMembers = async (req, res) => {
  try {
    const data = await BrigadeMember.findAll({
      where: { brigade_id: req.params.id },
      order: [["createdAt", "ASC"]],
    });
    res.json({
      success: true,
      data: data.map((m) => {
        const j = m.toJSON ? m.toJSON() : m;
        return {
          ...j,
          user: null,
          username: j.full_name || null,
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const brigade_id = Number(req.params.id);
    const full_name = String(req.body.full_name || req.body.name || "").trim();
    if (!full_name) {
      return res.status(400).json({ success: false, message: "Гишүүний нэр заавал" });
    }
    const brigade = await Brigade.findByPk(brigade_id);
    if (!brigade) {
      return res.status(404).json({ success: false, message: "Бригад олдсонгүй" });
    }
    const member = await BrigadeMember.create({
      brigade_id,
      full_name,
      phone: req.body.phone || null,
      user_id: null,
      position: req.body.position || "member",
      skills: parseSkills(req.body.skills) || [],
      experience_years: req.body.experience_years != null ? Number(req.body.experience_years) : null,
      status: req.body.status || "active",
      current_assignment: req.body.current_assignment || null,
    });
    await addTimeline(
      brigade_id,
      "member_added",
      "Гишүүн нэмэгдлээ",
      full_name,
      parseOptionalInt(req.body.actor_user_id),
      { member_id: member.id }
    );
    const j = member.toJSON();
    res.json({
      success: true,
      data: { ...j, user: null, username: j.full_name },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const member = await BrigadeMember.findOne({
      where: { id: req.params.memberId, brigade_id: req.params.id },
    });
    if (!member) {
      return res.status(404).json({ success: false, message: "Гишүүн олдсонгүй" });
    }
    await member.update({
      position: req.body.position ?? member.position,
      skills: req.body.skills !== undefined ? parseSkills(req.body.skills) : member.skills,
      experience_years:
        req.body.experience_years !== undefined
          ? Number(req.body.experience_years)
          : member.experience_years,
      attendance_rate:
        req.body.attendance_rate !== undefined
          ? Number(req.body.attendance_rate)
          : member.attendance_rate,
      status: req.body.status ?? member.status,
      current_assignment:
        req.body.current_assignment !== undefined
          ? req.body.current_assignment
          : member.current_assignment,
    });
    await refreshBrigadeStats(member.brigade_id);
    if (req.body.full_name !== undefined) {
      await member.update({ full_name: String(req.body.full_name || "").trim() || member.full_name });
    }
    if (req.body.phone !== undefined) {
      await member.update({ phone: req.body.phone || null });
    }
    const full = await BrigadeMember.findByPk(member.id);
    const j = full.toJSON();
    res.json({
      success: true,
      data: { ...j, user: null, username: j.full_name },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const num = await BrigadeMember.destroy({
      where: { id: req.params.memberId, brigade_id: req.params.id },
    });
    if (num === 1) return res.json({ success: true, message: "Хасагдлаа" });
    return res.status(404).json({ success: false, message: "Гишүүн олдсонгүй" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Equipment ───────────────────────────────────────────
exports.addEquipment = async (req, res) => {
  try {
    const brigade_id = Number(req.params.id);
    const equipment_id = parseOptionalInt(req.body.equipment_id);
    if (!equipment_id) {
      return res.status(400).json({ success: false, message: "equipment_id заавал" });
    }
    const [link, created] = await BrigadeEquipment.findOrCreate({
      where: { brigade_id, equipment_id },
      defaults: { brigade_id, equipment_id, notes: req.body.notes || null },
    });
    if (!created && req.body.notes !== undefined) {
      await link.update({ notes: req.body.notes });
    }
    const full = await BrigadeEquipment.findByPk(link.id, {
      include: [{ model: db.equipments, as: "equipment" }],
    });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeEquipment = async (req, res) => {
  try {
    const num = await BrigadeEquipment.destroy({
      where: { id: req.params.linkId, brigade_id: req.params.id },
    });
    if (num === 1) return res.json({ success: true, message: "Хасагдлаа" });
    return res.status(404).json({ success: false, message: "Олдсонгүй" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Hire requests ───────────────────────────────────────
const HIRE_INCLUDE = [
  { model: db.brigades, as: "brigade", attributes: ["id", "name", "logo", "username", "leader_name"] },
  { model: db.projects, as: "project", attributes: ["id", "name", "road_name", "status", "progress_percent"] },
  { model: db.users, as: "requester", attributes: LEADER_ATTRS },
  {
    model: HireHistory,
    as: "history",
    include: [{ model: db.users, as: "changer", attributes: LEADER_ATTRS }],
  },
];

async function transitionHire(hire, to_status, { note, changed_by } = {}) {
  const from = hire.status;
  await hire.update({
    status: to_status,
    response_note: note !== undefined ? note : hire.response_note,
    change_request_note:
      to_status === "changes_requested" ? note || hire.change_request_note : hire.change_request_note,
    responded_at: ["accepted", "rejected", "changes_requested"].includes(to_status)
      ? new Date()
      : hire.responded_at,
  });
  await HireHistory.create({
    hire_request_id: hire.id,
    from_status: from,
    to_status,
    note: note || null,
    changed_by: changed_by || null,
  });
  return hire;
}

exports.listHireRequests = async (req, res) => {
  try {
    const where = {};
    if (req.query.brigade_id) where.brigade_id = parseOptionalInt(req.query.brigade_id);
    if (req.query.project_id) where.project_id = parseOptionalInt(req.query.project_id);
    if (req.query.status) where.status = req.query.status;
    if (req.params.id) where.brigade_id = Number(req.params.id);

    const data = await HireRequest.findAll({
      where,
      include: HIRE_INCLUDE,
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getHireRequest = async (req, res) => {
  try {
    const data = await HireRequest.findByPk(req.params.hireId, { include: HIRE_INCLUDE });
    if (!data) {
      return res.status(404).json({ success: false, message: "Хүсэлт олдсонгүй" });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createHireRequest = async (req, res) => {
  try {
    const brigade_id = parseOptionalInt(req.body.brigade_id) || Number(req.params.id);
    const project_id = parseOptionalInt(req.body.project_id);
    if (!brigade_id || !project_id) {
      return res.status(400).json({ success: false, message: "brigade_id, project_id заавал" });
    }
    const brigade = await Brigade.findByPk(brigade_id);
    if (!brigade) {
      return res.status(404).json({ success: false, message: "Бригад олдсонгүй" });
    }

    const status = req.body.status === "draft" ? "draft" : "sent";
    const hire = await HireRequest.create({
      brigade_id,
      project_id,
      requested_by: parseOptionalInt(req.body.requested_by),
      start_date: req.body.start_date || null,
      end_date: req.body.end_date || null,
      priority: req.body.priority || "normal",
      description: req.body.description || null,
      required_skills: parseSkills(req.body.required_skills) || [],
      required_equipment: parseJsonArray(req.body.required_equipment) || [],
      status,
    });

    await HireHistory.create({
      hire_request_id: hire.id,
      from_status: null,
      to_status: status,
      note: "Үүсгэсэн",
      changed_by: parseOptionalInt(req.body.requested_by),
    });

    if (status === "sent") {
      await notifyBrigade({
        brigade_id,
        type: "hire_request",
        title: "Шинэ ажилд авах хүсэлт",
        body: req.body.description || "Танд шинэ hire request ирлээ",
        related_id: hire.id,
        related_type: "hire_request",
      });
    }

    const full = await HireRequest.findByPk(hire.id, { include: HIRE_INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateHireStatus = async (req, res) => {
  try {
    const hire = await HireRequest.findByPk(req.params.hireId, {
      include: [{ model: db.brigades, as: "brigade" }],
    });
    if (!hire) {
      return res.status(404).json({ success: false, message: "Хүсэлт олдсонгүй" });
    }
    const to = req.body.status;
    const allowed = [
      "draft",
      "sent",
      "accepted",
      "rejected",
      "changes_requested",
      "active",
      "completed",
      "reviewed",
    ];
    if (!allowed.includes(to)) {
      return res.status(400).json({ success: false, message: "Буруу статус" });
    }

    await transitionHire(hire, to, {
      note: req.body.note || req.body.response_note,
      changed_by: parseOptionalInt(req.body.changed_by),
    });

    const brigade = hire.brigade || (await Brigade.findByPk(hire.brigade_id));

    if (to === "accepted") {
      await addTimeline(
        hire.brigade_id,
        "hire_accepted",
        "Hire хүсэлт зөвшөөрөгдлөө",
        null,
        parseOptionalInt(req.body.changed_by),
        { hire_request_id: hire.id }
      );
      if (brigade) await brigade.update({ availability: "busy" });
      if (hire.requested_by) {
        await notifyUser({
          user_id: hire.requested_by,
          brigade_id: hire.brigade_id,
          type: "hire_accepted",
          title: "Hire хүсэлт зөвшөөрөгдлөө",
          related_id: hire.id,
          related_type: "hire_request",
        });
      }
    }
    if (to === "rejected" && hire.requested_by) {
      await notifyUser({
        user_id: hire.requested_by,
        brigade_id: hire.brigade_id,
        type: "hire_rejected",
        title: "Hire хүсэлт татгалзагдлаа",
        body: req.body.note || null,
        related_id: hire.id,
        related_type: "hire_request",
      });
    }
    if (to === "active") {
      await addTimeline(
        hire.brigade_id,
        "project_started",
        "Төсөл эхэллээ",
        null,
        parseOptionalInt(req.body.changed_by),
        { hire_request_id: hire.id, project_id: hire.project_id }
      );
      if (brigade) {
        await notifyBrigade({
          brigade_id: hire.brigade_id,
          type: "project_assigned",
          title: "Төсөл оноогдлоо",
          related_id: hire.id,
          related_type: "hire_request",
        });
      }
    }
    if (to === "completed") {
      await addTimeline(
        hire.brigade_id,
        "project_completed",
        "Төсөл дууслаа",
        null,
        parseOptionalInt(req.body.changed_by),
        { hire_request_id: hire.id, project_id: hire.project_id }
      );
      if (brigade) {
        await notifyBrigade({
          brigade_id: hire.brigade_id,
          type: "project_completed",
          title: "Төсөл дууссан",
          related_id: hire.id,
          related_type: "hire_request",
        });
      }
      if (brigade) await brigade.update({ availability: "available" });
    }

    await refreshBrigadeStats(hire.brigade_id);
    const full = await HireRequest.findByPk(hire.id, { include: HIRE_INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Reviews ─────────────────────────────────────────────
exports.listReviews = async (req, res) => {
  try {
    const where = {};
    if (req.params.id) where.brigade_id = Number(req.params.id);
    if (req.query.brigade_id) where.brigade_id = parseOptionalInt(req.query.brigade_id);
    const data = await BrigadeReview.findAll({
      where,
      include: [
        { model: db.users, as: "reviewer", attributes: LEADER_ATTRS },
        { model: db.projects, as: "project", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const brigade_id = parseOptionalInt(req.body.brigade_id) || Number(req.params.id);
    const overall = Number(req.body.overall_rating);
    if (!brigade_id || !Number.isFinite(overall)) {
      return res.status(400).json({
        success: false,
        message: "brigade_id, overall_rating заавал",
      });
    }

    const review = await BrigadeReview.create({
      brigade_id,
      hire_request_id: parseOptionalInt(req.body.hire_request_id),
      project_id: parseOptionalInt(req.body.project_id),
      reviewer_user_id: parseOptionalInt(req.body.reviewer_user_id),
      overall_rating: overall,
      quality: Number(req.body.quality) || overall,
      safety: Number(req.body.safety) || overall,
      speed: Number(req.body.speed) || overall,
      communication: Number(req.body.communication) || overall,
      comment: req.body.comment || null,
    });

    if (req.body.hire_request_id) {
      const hire = await HireRequest.findByPk(req.body.hire_request_id);
      if (hire && hire.status === "completed") {
        await transitionHire(hire, "reviewed", {
          note: "Үнэлгээ өгсөн",
          changed_by: parseOptionalInt(req.body.reviewer_user_id),
        });
      }
    }

    await addTimeline(
      brigade_id,
      "review_added",
      "Шинэ үнэлгээ",
      req.body.comment || `Үнэлгээ: ${overall}`,
      parseOptionalInt(req.body.reviewer_user_id),
      { review_id: review.id }
    );

    const brigade = await Brigade.findByPk(brigade_id);
    if (brigade) {
      await notifyBrigade({
        brigade_id,
        type: "review_added",
        title: "Шинэ үнэлгээ ирлээ",
        body: `Үнэлгээ: ${overall}/5`,
        related_id: review.id,
        related_type: "brigade_review",
      });
    }

    await refreshBrigadeStats(brigade_id);
    const full = await BrigadeReview.findByPk(review.id, {
      include: [
        { model: db.users, as: "reviewer", attributes: LEADER_ATTRS },
        { model: db.projects, as: "project", attributes: ["id", "name"] },
      ],
    });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Documents ───────────────────────────────────────────
exports.listDocuments = async (req, res) => {
  try {
    const data = await BrigadeDocument.findAll({
      where: { brigade_id: req.params.id },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addDocument = async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ success: false, message: "title заавал" });
    }
    const doc = await BrigadeDocument.create({
      brigade_id: Number(req.params.id),
      title: req.body.title,
      doc_type: req.body.doc_type || "other",
      file_url: req.body.file_url || null,
      expires_at: req.body.expires_at || null,
      uploaded_by: parseOptionalInt(req.body.uploaded_by),
      notes: req.body.notes || null,
    });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeDocument = async (req, res) => {
  try {
    const num = await BrigadeDocument.destroy({
      where: { id: req.params.docId, brigade_id: req.params.id },
    });
    if (num === 1) return res.json({ success: true, message: "Устгагдлаа" });
    return res.status(404).json({ success: false, message: "Олдсонгүй" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Progress reports ────────────────────────────────────
exports.listProgress = async (req, res) => {
  try {
    const where = { brigade_id: Number(req.params.id) };
    if (req.query.project_id) where.project_id = parseOptionalInt(req.query.project_id);
    const data = await ProgressReport.findAll({
      where,
      include: [
        { model: db.projects, as: "project", attributes: ["id", "name"] },
        { model: db.users, as: "author", attributes: LEADER_ATTRS },
      ],
      order: [["report_date", "DESC"]],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProgress = async (req, res) => {
  try {
    const brigade_id = Number(req.params.id);
    if (!req.body.report_date) {
      return res.status(400).json({ success: false, message: "report_date заавал" });
    }
    const row = await ProgressReport.create({
      brigade_id,
      project_id: parseOptionalInt(req.body.project_id),
      hire_request_id: parseOptionalInt(req.body.hire_request_id),
      report_date: req.body.report_date,
      work_completed: req.body.work_completed || null,
      worker_count: Number(req.body.worker_count) || 0,
      equipment_used: parseJsonArray(req.body.equipment_used) || [],
      materials_used: parseJsonArray(req.body.materials_used) || [],
      photos: parseJsonArray(req.body.photos) || [],
      comments: req.body.comments || null,
      created_by: parseOptionalInt(req.body.created_by),
    });

    if (req.body.hire_request_id && req.body.progress != null) {
      const hire = await HireRequest.findByPk(req.body.hire_request_id);
      if (hire) await hire.update({ progress: Number(req.body.progress) });
    }

    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Notifications ───────────────────────────────────────
exports.listNotifications = async (req, res) => {
  try {
    const where = {};
    const brigade_id = parseOptionalInt(req.query.brigade_id);
    const user_id = parseOptionalInt(req.query.user_id);
    if (brigade_id) where.brigade_id = brigade_id;
    else if (user_id) where.user_id = user_id;
    else {
      return res.status(400).json({
        success: false,
        message: "brigade_id эсвэл user_id заавал",
      });
    }
    if (req.query.is_read === "0" || req.query.is_read === "false") where.is_read = false;
    if (req.query.is_read === "1" || req.query.is_read === "true") where.is_read = true;

    const data = await BrigadeNotification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Math.min(200, Number(req.query.limit) || 50),
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const row = await BrigadeNotification.findByPk(req.params.notifId);
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    await row.update({ is_read: true });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const brigade_id = parseOptionalInt(req.body.brigade_id || req.query.brigade_id);
    const user_id = parseOptionalInt(req.body.user_id || req.query.user_id);
    if (!brigade_id && !user_id) {
      return res.status(400).json({
        success: false,
        message: "brigade_id эсвэл user_id заавал",
      });
    }
    const where = { is_read: false };
    if (brigade_id) where.brigade_id = brigade_id;
    else where.user_id = user_id;
    await BrigadeNotification.update({ is_read: true }, { where });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

async function buildDashboardPayload(brigade) {
  const [pendingHires, unread] = await Promise.all([
    HireRequest.count({ where: { brigade_id: brigade.id, status: "sent" } }),
    BrigadeNotification.count({
      where: { brigade_id: brigade.id, is_read: false },
    }),
  ]);
  const hires = brigade.hireRequests || [];
  return {
    brigade: sanitizeBrigade(brigade),
    cards: {
      active_projects: hires.filter((h) => ["accepted", "active"].includes(h.status)).length,
      pending_hire_requests: pendingHires,
      completed_projects: hires.filter((h) =>
        ["completed", "reviewed"].includes(h.status)
      ).length,
      total_members: (brigade.members || []).length,
      equipment: (brigade.equipmentLinks || []).length,
      average_rating: Number(brigade.average_rating) || 0,
      reputation_score: Number(brigade.reputation_score) || 0,
      unread_notifications: unread,
    },
  };
}

// ─── Brigade mobile dashboard (by brigade id) ────────────
exports.brigadeDashboard = async (req, res) => {
  try {
    const id = parseOptionalInt(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: "brigade id заавал" });
    }
    const brigade = await Brigade.findByPk(id, { include: DETAIL_INCLUDE });
    if (!brigade) {
      return res.status(404).json({ success: false, message: "Бригад олдсонгүй" });
    }
    res.json({ success: true, data: await buildDashboardPayload(brigade) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** @deprecated legacy path — resolves by username match if old user id passed as brigade id */
exports.leaderDashboard = async (req, res) => {
  try {
    const id = parseOptionalInt(req.query.leader_user_id || req.params.userId);
    if (!id) {
      return res.status(400).json({ success: false, message: "brigade id заавал" });
    }
    // Prefer treating param as brigade id (new Flutter auth uses brigade.id)
    let brigade = await Brigade.findByPk(id, { include: DETAIL_INCLUDE });
    if (!brigade) {
      brigade = await Brigade.findOne({
        where: { id },
        include: DETAIL_INCLUDE,
      });
    }
    if (!brigade) {
      return res.status(404).json({ success: false, message: "Бригад олдсонгүй" });
    }
    res.json({ success: true, data: await buildDashboardPayload(brigade) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.refreshStats = async (req, res) => {
  try {
    await refreshBrigadeStats(req.params.id);
    const full = await Brigade.findByPk(req.params.id, { include: DETAIL_INCLUDE });
    res.json({ success: true, data: full });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
