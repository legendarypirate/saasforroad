const db = require("../models");
const Note = db.personal_notes;
const Op = db.Sequelize.Op;

function requireUserId(req, res) {
  const id = req.user?.id;
  if (!id) {
    res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
    return null;
  }
  return id;
}

function tenantIdFromReq(req) {
  return req.tenant?.id || req.user?.tenant_id || null;
}

function scopedWhere(userId, tenantId, extra = {}) {
  const where = { user_id: userId, ...extra };
  if (tenantId) where.tenant_id = tenantId;
  return where;
}

function parseParentId(value) {
  if (value === undefined || value === null || value === "" || value === "null") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseDeadlineDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "" || value === "null") return null;
  const raw = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { error: "deadline_date формат YYYY-MM-DD байх ёстой" };
  }
  const d = new Date(`${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return { error: "deadline_date буруу байна" };
  }
  return raw;
}

async function findOwned(id, userId, tenantId) {
  return Note.findOne({ where: scopedWhere(userId, tenantId, { id }) });
}

async function collectDescendantIds(rootId, userId, tenantId) {
  const all = await Note.findAll({
    where: scopedWhere(userId, tenantId),
    attributes: ["id", "parent_id"],
    raw: true,
  });
  const byParent = new Map();
  for (const row of all) {
    const pid = row.parent_id == null ? null : Number(row.parent_id);
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid).push(Number(row.id));
  }
  const out = [];
  const stack = [Number(rootId)];
  while (stack.length) {
    const cur = stack.pop();
    out.push(cur);
    const kids = byParent.get(cur) || [];
    for (const k of kids) stack.push(k);
  }
  return out;
}

exports.list = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;
    const tenantId = tenantIdFromReq(req);
    const q = String(req.query.q || "").trim();
    const where = scopedWhere(userId, tenantId);
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { content: { [Op.iLike]: `%${q}%` } },
      ];
    }
    const data = await Note.findAll({
      where,
      order: [
        ["is_favorite", "DESC"],
        ["sort_order", "ASC"],
        ["updatedAt", "DESC"],
      ],
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;
    const tenantId = tenantIdFromReq(req);
    const title = String(req.body.title || "").trim() || "Гарчиггүй";
    const parent_id = parseParentId(req.body.parent_id);
    if (parent_id != null) {
      const parent = await findOwned(parent_id, userId, tenantId);
      if (!parent) {
        return res.status(400).json({ success: false, message: "Эх хуудас олдсонгүй" });
      }
    }

    let deadline_date = null;
    if (req.body.deadline_date !== undefined) {
      const parsed = parseDeadlineDate(req.body.deadline_date);
      if (parsed && typeof parsed === "object" && parsed.error) {
        return res.status(400).json({ success: false, message: parsed.error });
      }
      deadline_date = parsed;
    }

    const data = await Note.create({
      user_id: userId,
      tenant_id: tenantId,
      title,
      content: req.body.content != null ? String(req.body.content) : "",
      parent_id,
      icon: req.body.icon || null,
      is_favorite: Boolean(req.body.is_favorite),
      sort_order: Number(req.body.sort_order) || 0,
      deadline_date,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;
    const tenantId = tenantIdFromReq(req);
    const data = await findOwned(req.params.id, userId, tenantId);
    if (!data) {
      return res.status(404).json({ success: false, message: "Тэмдэглэл олдсонгүй" });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;
    const tenantId = tenantIdFromReq(req);
    const note = await findOwned(req.params.id, userId, tenantId);
    if (!note) {
      return res.status(404).json({ success: false, message: "Тэмдэглэл олдсонгүй" });
    }
    const patch = {};
    if (req.body.title !== undefined) {
      patch.title = String(req.body.title || "").trim() || "Гарчиггүй";
    }
    if (req.body.content !== undefined) patch.content = String(req.body.content ?? "");
    if (req.body.icon !== undefined) patch.icon = req.body.icon || null;
    if (req.body.is_favorite !== undefined) patch.is_favorite = Boolean(req.body.is_favorite);
    if (req.body.sort_order !== undefined) patch.sort_order = Number(req.body.sort_order) || 0;
    if (req.body.deadline_date !== undefined) {
      const parsed = parseDeadlineDate(req.body.deadline_date);
      if (parsed && typeof parsed === "object" && parsed.error) {
        return res.status(400).json({ success: false, message: parsed.error });
      }
      patch.deadline_date = parsed;
    }
    if (req.body.parent_id !== undefined) {
      const parent_id = parseParentId(req.body.parent_id);
      if (parent_id != null) {
        if (Number(parent_id) === Number(note.id)) {
          return res.status(400).json({ success: false, message: "Өөртөө холбох боломжгүй" });
        }
        const descendants = await collectDescendantIds(note.id, userId, tenantId);
        if (descendants.includes(Number(parent_id))) {
          return res.status(400).json({
            success: false,
            message: "Дэд хуудсанд шилжүүлэх боломжгүй",
          });
        }
        const parent = await findOwned(parent_id, userId, tenantId);
        if (!parent) {
          return res.status(400).json({ success: false, message: "Эх хуудас олдсонгүй" });
        }
      }
      patch.parent_id = parent_id;
    }
    await note.update(patch);
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = requireUserId(req, res);
    if (userId == null) return;
    const tenantId = tenantIdFromReq(req);
    const note = await findOwned(req.params.id, userId, tenantId);
    if (!note) {
      return res.status(404).json({ success: false, message: "Тэмдэглэл олдсонгүй" });
    }
    const ids = await collectDescendantIds(note.id, userId, tenantId);
    await Note.destroy({
      where: scopedWhere(userId, tenantId, { id: { [Op.in]: ids } }),
    });
    res.json({ success: true, message: "Устгагдлаа", deleted: ids.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
