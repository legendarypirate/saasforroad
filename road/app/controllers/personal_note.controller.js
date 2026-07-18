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

function parseParentId(value) {
  if (value === undefined || value === null || value === "" || value === "null") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function findOwned(id, userId) {
  return Note.findOne({ where: { id, user_id: userId } });
}

async function collectDescendantIds(rootId, userId) {
  const all = await Note.findAll({
    where: { user_id: userId },
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
    const q = String(req.query.q || "").trim();
    const where = { user_id: userId };
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
    const title = String(req.body.title || "").trim() || "Гарчиггүй";
    const parent_id = parseParentId(req.body.parent_id);
    if (parent_id != null) {
      const parent = await findOwned(parent_id, userId);
      if (!parent) {
        return res.status(400).json({ success: false, message: "Эх хуудас олдсонгүй" });
      }
    }
    const data = await Note.create({
      user_id: userId,
      title,
      content: req.body.content != null ? String(req.body.content) : "",
      parent_id,
      icon: req.body.icon || null,
      is_favorite: Boolean(req.body.is_favorite),
      sort_order: Number(req.body.sort_order) || 0,
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
    const data = await findOwned(req.params.id, userId);
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
    const note = await findOwned(req.params.id, userId);
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
    if (req.body.parent_id !== undefined) {
      const parent_id = parseParentId(req.body.parent_id);
      if (parent_id != null) {
        if (Number(parent_id) === Number(note.id)) {
          return res.status(400).json({ success: false, message: "Өөртөө холбох боломжгүй" });
        }
        const descendants = await collectDescendantIds(note.id, userId);
        if (descendants.includes(Number(parent_id))) {
          return res.status(400).json({
            success: false,
            message: "Дэд хуудсанд шилжүүлэх боломжгүй",
          });
        }
        const parent = await findOwned(parent_id, userId);
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
    const note = await findOwned(req.params.id, userId);
    if (!note) {
      return res.status(404).json({ success: false, message: "Тэмдэглэл олдсонгүй" });
    }
    const ids = await collectDescendantIds(note.id, userId);
    await Note.destroy({ where: { id: { [Op.in]: ids }, user_id: userId } });
    res.json({ success: true, message: "Устгагдлаа", deleted: ids.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
