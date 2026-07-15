const {
  PLATFORM_DATA_KINDS,
  isValidKind,
  serializeEntry,
} = require("../utils/platformDataKinds");

const db = require("../models");
const Entry = db.platform_data_entries;

function parseBody(req) {
  const b = req.body || {};
  return {
    kind: String(b.kind || "").trim(),
    name: String(b.name || "").trim(),
    contact_name: b.contact_name ? String(b.contact_name).trim() : null,
    phone: b.phone ? String(b.phone).trim() : null,
    email: b.email ? String(b.email).trim() : null,
    province: b.province ? String(b.province).trim() : null,
    location: b.location ? String(b.location).trim() : null,
    description: b.description ? String(b.description).trim() : null,
    meta: b.meta && typeof b.meta === "object" ? b.meta : {},
    image: b.image ? String(b.image).trim() : null,
    status: b.status ? String(b.status).trim() : "active",
    is_active: b.is_active !== false && b.is_active !== "false",
  };
}

/** GET /api/platform/data — optional ?kind= */
exports.list = async (req, res) => {
  try {
    const where = {};
    if (req.query.kind) {
      if (!isValidKind(req.query.kind)) {
        return res.status(400).json({ message: "Invalid kind" });
      }
      where.kind = req.query.kind;
    }
    const rows = await Entry.findAll({
      where,
      order: [
        ["kind", "ASC"],
        ["name", "ASC"],
      ],
    });
    res.json({
      success: true,
      kinds: PLATFORM_DATA_KINDS,
      entries: rows.map(serializeEntry),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const row = await Entry.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, entry: serializeEntry(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const data = parseBody(req);
    if (!isValidKind(data.kind)) {
      return res.status(400).json({ message: "Invalid kind" });
    }
    if (!data.name) {
      return res.status(400).json({ message: "Name is required" });
    }
    const row = await Entry.create(data);
    res.status(201).json({ success: true, entry: serializeEntry(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await Entry.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Not found" });
    const data = parseBody({ body: { ...row.toJSON(), ...req.body } });
    if (req.body.kind !== undefined && !isValidKind(data.kind)) {
      return res.status(400).json({ message: "Invalid kind" });
    }
    if (!data.name) {
      return res.status(400).json({ message: "Name is required" });
    }
    // Keep kind immutable unless explicitly allowed
    data.kind = row.kind;
    await row.update(data);
    res.json({ success: true, entry: serializeEntry(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.remove = async (req, res) => {
  try {
    const row = await Entry.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Not found" });
    await row.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/** Tenant-facing read-only list: GET /api/data-catalog?kind= */
exports.listPublic = async (req, res) => {
  try {
    const kind = String(req.query.kind || "").trim();
    if (!isValidKind(kind)) {
      return res.status(400).json({
        message: "kind required",
        kinds: PLATFORM_DATA_KINDS.map((k) => k.id),
      });
    }
    const rows = await Entry.findAll({
      where: { kind, is_active: true },
      order: [["name", "ASC"]],
    });
    res.json({
      success: true,
      kind,
      entries: rows.map(serializeEntry),
      read_only: true,
      message: "Platform-owned catalog — view and contact only",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};
