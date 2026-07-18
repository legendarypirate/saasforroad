const db = require("../models");
const Factory = db.platform_factories;
const Company = db.platform_plant_companies;

/**
 * GET /api/factories — active plants for tenant Үйлдвэр browse.
 */
exports.listPublic = async (_req, res) => {
  try {
    const rows = await Factory.findAll({
      where: { status: "active", is_active: true },
      order: [["name", "ASC"]],
      include: [
        {
          model: Company,
          as: "company",
          attributes: ["id", "name", "phone", "email", "contact_name"],
          required: false,
        },
      ],
    });

    const data = rows.map((row) => {
      const j = typeof row.toJSON === "function" ? row.toJSON() : row;
      const company = j.company || null;
      return {
        id: j.id,
        name: j.name,
        company_id: j.company_id,
        company_name: company?.name || null,
        owner_name: j.owner_name || company?.contact_name || null,
        phone: j.phone || company?.phone || null,
        email: j.email || company?.email || null,
        plant_type: j.plant_type,
        province: j.province,
        location: j.location,
        description: j.description,
        image: j.image,
        latitude: j.latitude != null ? Number(j.latitude) : null,
        longitude: j.longitude != null ? Number(j.longitude) : null,
        status: j.status,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      };
    });

    res.json({ success: true, data, factories: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || "Алдаа" });
  }
};
