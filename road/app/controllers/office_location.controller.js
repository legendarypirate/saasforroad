const db = require("../models");
const Op = db.Sequelize.Op;
const OfficeLocation = db.office_locations;

function tenantId(req) {
  return req.tenant?.id || req.user?.tenant_id || null;
}

/** Active offices for this tenant, including legacy null-tenant rows (then heal). */
async function listTenantOffices(tid, { activeOnly = false } = {}) {
  const where = {};
  if (activeOnly) where.is_active = true;

  if (!tid) {
    return OfficeLocation.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["name", "ASC"]],
      skipTenantScope: true,
    });
  }

  const rows = await OfficeLocation.findAll({
    where: {
      ...where,
      [Op.or]: [{ tenant_id: tid }, { tenant_id: null }],
    },
    order: [["name", "ASC"]],
    skipTenantScope: true,
  });

  for (const row of rows) {
    if (row.tenant_id == null) {
      await row.update({ tenant_id: tid }, { skipTenantScope: true });
    }
  }
  return rows;
}

exports.findAll = async (req, res) => {
  const activeOnly = req.query.active === "true" || req.query.active === "1";
  try {
    const data = await listTenantOffices(tenantId(req), { activeOnly });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const tid = tenantId(req);
    const data = await OfficeLocation.findByPk(req.params.id, {
      skipTenantScope: true,
    });
    if (!data) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    if (
      tid &&
      data.tenant_id != null &&
      Number(data.tenant_id) !== Number(tid)
    ) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    if (tid && data.tenant_id == null) {
      await data.update({ tenant_id: tid }, { skipTenantScope: true });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, latitude, longitude, radius_meters, address, is_active } = req.body;
  if (!name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      message: "Нэр, latitude, longitude заавал.",
    });
  }

  const tid = tenantId(req);
  if (!tid) {
    return res.status(400).json({
      success: false,
      message: "Tenant required — X-Tenant-Domain илгээнэ үү",
    });
  }

  try {
    const data = await OfficeLocation.create(
      {
        name,
        latitude,
        longitude,
        radius_meters: radius_meters ?? 100,
        address,
        is_active: is_active !== false,
        tenant_id: tid,
      },
      { skipTenantScope: true }
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await OfficeLocation.findByPk(req.params.id, {
      skipTenantScope: true,
    });
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    if (tid && row.tenant_id != null && Number(row.tenant_id) !== Number(tid)) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    const patch = { ...req.body };
    if (tid && row.tenant_id == null) patch.tenant_id = tid;
    await row.update(patch);
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await OfficeLocation.findByPk(req.params.id, {
      skipTenantScope: true,
    });
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    if (tid && row.tenant_id != null && Number(row.tenant_id) !== Number(tid)) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    await row.destroy();
    res.json({ success: true, message: "Устгагдлаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listTenantOffices = listTenantOffices;
