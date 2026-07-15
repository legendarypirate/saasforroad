const db = require("../models");
const { Op } = db.Sequelize;
const Brigade = db.brigades;

function serialize(row) {
  const j = typeof row.toJSON === "function" ? row.toJSON() : row;
  return {
    id: j.id,
    name: j.name,
    username: j.username,
    leader_name: j.leader_name,
    phone: j.phone || j.contact_phone,
    contact_phone: j.contact_phone,
    contact_email: j.contact_email,
    province: j.province,
    location: j.location,
    description: j.description,
    skills: Array.isArray(j.skills) ? j.skills : [],
    availability: j.availability,
    status: j.status,
    is_active: j.is_active !== false,
    logo: j.logo,
    average_rating: j.average_rating != null ? Number(j.average_rating) : 0,
    reputation_score: j.reputation_score != null ? Number(j.reputation_score) : 0,
    completed_tasks: j.completed_tasks || 0,
    active_tasks: j.active_tasks || 0,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

/** GET /api/platform/brigades */
exports.list = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { username: { [Op.iLike]: `%${q}%` } },
        { leader_name: { [Op.iLike]: `%${q}%` } },
        { province: { [Op.iLike]: `%${q}%` } },
        { phone: { [Op.iLike]: `%${q}%` } },
        { contact_phone: { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (status === "active" || status === "inactive" || status === "suspended") {
      where.status = status;
    } else if (status === "on") {
      where.is_active = true;
    } else if (status === "off") {
      where.is_active = false;
    }

    const rows = await Brigade.findAll({
      where,
      order: [["createdAt", "DESC"]],
      attributes: {
        exclude: ["password"],
      },
    });

    res.json({
      success: true,
      brigades: rows.map(serialize),
      total: rows.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/** GET /api/platform/brigades/:id */
exports.getOne = async (req, res) => {
  try {
    const row = await Brigade.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });
    if (!row) return res.status(404).json({ message: "Brigade not found" });
    res.json({ success: true, brigade: serialize(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/**
 * PATCH /api/platform/brigades/:id/status
 * body: { status: "active" | "inactive" | "suspended" }
 * active ↔ inactive used for platform enable/disable.
 */
exports.setStatus = async (req, res) => {
  try {
    const row = await Brigade.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Brigade not found" });

    let status = String(req.body.status || "").trim();
    // Convenience: active boolean toggle
    if (req.body.is_active !== undefined && !status) {
      status = req.body.is_active === false || req.body.is_active === "false"
        ? "inactive"
        : "active";
    }
    if (!["active", "suspended", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "status must be active, inactive, or suspended",
      });
    }

    await row.update({
      status,
      is_active: status === "active",
      availability:
        status === "active"
          ? row.availability === "unavailable"
            ? "available"
            : row.availability
          : "unavailable",
    });

    res.json({ success: true, brigade: serialize(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};
