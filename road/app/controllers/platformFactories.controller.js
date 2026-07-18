const db = require("../models");
const { Op } = db.Sequelize;
const Factory = db.platform_factories;
const Company = db.platform_plant_companies;

function serialize(row) {
  const j = typeof row.toJSON === "function" ? row.toJSON() : row;
  const company = j.company || null;
  return {
    id: j.id,
    company_id: j.company_id,
    company_name: company?.name || null,
    company_username: company?.username || null,
    company_phone: company?.phone || null,
    name: j.name,
    owner_name: j.owner_name,
    phone: j.phone,
    email: j.email,
    plant_type: j.plant_type,
    province: j.province,
    location: j.location,
    description: j.description,
    image: j.image,
    latitude: j.latitude != null ? Number(j.latitude) : null,
    longitude: j.longitude != null ? Number(j.longitude) : null,
    status: j.status,
    is_active: j.is_active === true,
    rejection_note: j.rejection_note,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

const COMPANY_INCLUDE = {
  model: Company,
  as: "company",
  attributes: ["id", "name", "username", "phone", "email", "contact_name"],
  required: false,
};

/** GET /api/platform/factories */
exports.list = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { owner_name: { [Op.iLike]: `%${q}%` } },
        { province: { [Op.iLike]: `%${q}%` } },
        { phone: { [Op.iLike]: `%${q}%` } },
        { "$company.name$": { [Op.iLike]: `%${q}%` } },
        { "$company.username$": { [Op.iLike]: `%${q}%` } },
      ];
    }
    if (["pending", "active", "rejected", "inactive"].includes(status)) {
      where.status = status;
    }

    const rows = await Factory.findAll({
      where,
      include: [COMPANY_INCLUDE],
      order: [["createdAt", "DESC"]],
      subQuery: false,
    });

    res.json({
      success: true,
      factories: rows.map(serialize),
      total: rows.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/** GET /api/platform/factories/:id */
exports.getOne = async (req, res) => {
  try {
    const row = await Factory.findByPk(req.params.id, {
      include: [COMPANY_INCLUDE],
    });
    if (!row) return res.status(404).json({ message: "Factory not found" });
    res.json({ success: true, factory: serialize(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

/**
 * PATCH /api/platform/factories/:id/status
 */
exports.setStatus = async (req, res) => {
  try {
    const row = await Factory.findByPk(req.params.id, {
      include: [COMPANY_INCLUDE],
    });
    if (!row) return res.status(404).json({ message: "Factory not found" });

    const status = String(req.body.status || "").trim();
    if (!["pending", "active", "rejected", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "status must be pending, active, rejected, or inactive",
      });
    }

    const patch = {
      status,
      is_active: status === "active",
    };
    if (req.body.note !== undefined || req.body.rejection_note !== undefined) {
      patch.rejection_note =
        String(req.body.note || req.body.rejection_note || "").trim() || null;
    }
    if (status === "active") {
      patch.rejection_note = null;
    }

    await row.update(patch);
    await row.reload({ include: [COMPANY_INCLUDE] });
    res.json({ success: true, factory: serialize(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};
