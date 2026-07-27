const db = require("../models");
const Op = db.Sequelize.Op;

const Opening = db.driver_job_openings;
const Application = db.driver_job_applications;
const Driver = db.road_drivers;
const Project = db.projects;
const Tenant = db.tenants;

const OPENING_STATUSES = new Set([
  "draft",
  "pending",
  "approved",
  "rejected",
  "closed",
]);

function tenantId(req) {
  return req.tenant?.id || req.user?.tenant_id || null;
}

function userId(req) {
  return req.user?.id || null;
}

function serializeOpening(row, extras = {}) {
  const j = row?.toJSON ? row.toJSON() : row;
  return { ...j, ...extras };
}

async function companyNameForTenant(tid) {
  const t = await Tenant.findByPk(tid, { skipTenantScope: true });
  if (!t) return null;
  return t.company_name || t.name;
}

async function loadOwnerProject(projectId, tid) {
  if (!projectId) return null;
  const project = await Project.findOne({
    where: { id: projectId },
    skipTenantScope: true,
  });
  if (!project) return null;
  const ownerTid = project.tenant_id;
  if (ownerTid != null && Number(ownerTid) !== Number(tid)) return null;
  return project;
}

function publicDriver(row) {
  if (!row) return null;
  const json = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
  delete json.password;
  return json;
}

// ─── Tenant (zam) ───────────────────────────────────────────────────────────

exports.tenantList = async (req, res) => {
  try {
    const tid = tenantId(req);
    if (!tid) {
      return res.status(400).json({ success: false, message: "Tenant required" });
    }
    const where = { tenant_id: tid };
    if (req.query.status) where.status = String(req.query.status);

    const rows = await Opening.findAll({
      where,
      order: [["updatedAt", "DESC"]],
    });
    res.json({ success: true, data: rows.map((r) => serializeOpening(r)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.tenantCreate = async (req, res) => {
  try {
    const tid = tenantId(req);
    if (!tid) {
      return res.status(400).json({ success: false, message: "Tenant required" });
    }

    const title = String(req.body.title || "").trim();
    if (!title) {
      return res.status(400).json({ success: false, message: "Гарчиг шаардлагатай" });
    }

    let project = null;
    const projectId = req.body.project_id ? Number(req.body.project_id) : null;
    if (projectId) {
      project = await loadOwnerProject(projectId, tid);
      if (!project) {
        return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });
      }
    }

    const company = await companyNameForTenant(tid);
    const submit = req.body.submit === true || req.body.submit === "1";

    const row = await Opening.create({
      tenant_id: tid,
      project_id: project?.id || null,
      title,
      description: req.body.description || null,
      position_type: String(req.body.position_type || "driver").trim() || "driver",
      province: req.body.province || null,
      location: req.body.location || null,
      salary_note: req.body.salary_note || null,
      requirements: req.body.requirements || null,
      headcount: Math.max(1, Number(req.body.headcount) || 1),
      closes_at: req.body.closes_at || null,
      company_name: company,
      project_name: project ? project.name || project.road_name : null,
      status: submit ? "pending" : "draft",
      created_by: userId(req),
    });

    res.status(201).json({ success: true, data: serializeOpening(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.tenantGet = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await Opening.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    }
    res.json({ success: true, data: serializeOpening(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.tenantUpdate = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await Opening.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    }
    if (!["draft", "rejected"].includes(row.status)) {
      return res.status(400).json({
        success: false,
        message: "Зөвхөн ноорог эсвэл татгалзсан зарыг засах боломжтой",
      });
    }

    const patch = {};
    for (const key of [
      "title",
      "description",
      "position_type",
      "province",
      "location",
      "salary_note",
      "requirements",
      "closes_at",
    ]) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (req.body.headcount !== undefined) {
      patch.headcount = Math.max(1, Number(req.body.headcount) || 1);
    }
    if (req.body.project_id !== undefined) {
      const pid = req.body.project_id ? Number(req.body.project_id) : null;
      if (pid) {
        const project = await loadOwnerProject(pid, tid);
        if (!project) {
          return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });
        }
        patch.project_id = project.id;
        patch.project_name = project.name || project.road_name || null;
      } else {
        patch.project_id = null;
        patch.project_name = null;
      }
    }

    await row.update(patch);
    res.json({ success: true, data: serializeOpening(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.tenantSubmit = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await Opening.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    }
    if (!["draft", "rejected"].includes(row.status)) {
      return res.status(400).json({
        success: false,
        message: "Энэ зарыг илгээх боломжгүй",
      });
    }
    await row.update({ status: "pending", admin_note: null });
    res.json({ success: true, data: serializeOpening(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.tenantClose = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await Opening.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    }
    await row.update({ status: "closed" });
    res.json({ success: true, data: serializeOpening(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.tenantDelete = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await Opening.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    }
    if (!["draft", "rejected"].includes(row.status)) {
      return res.status(400).json({
        success: false,
        message: "Зөвхөн ноорог эсвэл татгалзсан зарыг устгах боломжтой",
      });
    }
    await row.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.tenantListApplications = async (req, res) => {
  try {
    const tid = tenantId(req);
    const openingId = req.query.opening_id ? Number(req.query.opening_id) : null;

    const openingWhere = { tenant_id: tid };
    if (openingId) openingWhere.id = openingId;

    const openings = await Opening.findAll({ where: openingWhere, attributes: ["id"] });
    const openingIds = openings.map((o) => o.id);
    if (!openingIds.length) {
      return res.json({ success: true, data: [] });
    }

    const rows = await Application.findAll({
      where: { opening_id: openingIds },
      order: [["createdAt", "DESC"]],
    });

    const driverIds = [...new Set(rows.map((r) => r.driver_id))];
    const drivers = await Driver.findAll({
      where: { id: driverIds.length ? driverIds : [0] },
      attributes: { exclude: ["password"] },
    });
    const driverById = new Map(drivers.map((d) => [d.id, publicDriver(d)]));

    const openingRows = await Opening.findAll({
      where: { id: openingIds },
      attributes: ["id", "title", "status"],
    });
    const openingById = new Map(openingRows.map((o) => [o.id, o.toJSON()]));

    res.json({
      success: true,
      data: rows.map((r) => ({
        ...r.toJSON(),
        driver: driverById.get(r.driver_id) || null,
        opening: openingById.get(r.opening_id) || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.tenantRespondApplication = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await Application.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Хүсэлт олдсонгүй" });
    }

    const action = String(req.body.status || "").trim();
    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Төлөв буруу" });
    }

    await row.update({
      status: action,
      response_note: req.body.response_note || null,
      responded_at: new Date(),
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Platform admin ─────────────────────────────────────────────────────────

exports.platformList = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    const where = {};
    if (status && OPENING_STATUSES.has(status)) where.status = status;
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { company_name: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const rows = await Opening.findAll({
      where,
      order: [["updatedAt", "DESC"]],
      skipTenantScope: true,
    });

    res.json({
      success: true,
      openings: rows.map((r) => serializeOpening(r)),
      total: rows.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.platformGet = async (req, res) => {
  try {
    const row = await Opening.findByPk(req.params.id, { skipTenantScope: true });
    if (!row) {
      return res.status(404).json({ message: "Opening not found" });
    }
    res.json({ success: true, opening: serializeOpening(row) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.platformSetStatus = async (req, res) => {
  try {
    const row = await Opening.findByPk(req.params.id, { skipTenantScope: true });
    if (!row) {
      return res.status(404).json({ message: "Opening not found" });
    }

    const status = String(req.body.status || "").trim();
    if (!["approved", "rejected", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const patch = {
      status,
      admin_note: req.body.admin_note || null,
      reviewed_at: new Date(),
      reviewed_by: req.platformAdmin?.id || null,
    };
    if (status === "approved") {
      patch.published_at = new Date();
    }

    await row.update(patch);
    res.json({ success: true, opening: serializeOpening(row) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// ─── Driver mobile app ──────────────────────────────────────────────────────

exports.driverListOpenings = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await Opening.findAll({
      where: {
        status: "approved",
        [Op.or]: [{ closes_at: null }, { closes_at: { [Op.gte]: today } }],
      },
      order: [["published_at", "DESC"], ["updatedAt", "DESC"]],
      skipTenantScope: true,
    });

    const driverId = req.driverAuth?.driver_id;
    let appliedIds = new Set();
    if (driverId) {
      const apps = await Application.findAll({
        where: { driver_id: driverId, opening_id: rows.map((r) => r.id) },
        attributes: ["opening_id"],
        skipTenantScope: true,
      });
      appliedIds = new Set(apps.map((a) => a.opening_id));
    }

    res.json({
      success: true,
      data: rows.map((r) =>
        serializeOpening(r, { already_applied: appliedIds.has(r.id) })
      ),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.driverGetOpening = async (req, res) => {
  try {
    const row = await Opening.findOne({
      where: { id: req.params.id, status: "approved" },
      skipTenantScope: true,
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    }

    const driverId = req.driverAuth?.driver_id;
    let already_applied = false;
    if (driverId) {
      const app = await Application.findOne({
        where: { opening_id: row.id, driver_id: driverId },
        skipTenantScope: true,
      });
      already_applied = Boolean(app);
    }

    res.json({
      success: true,
      data: serializeOpening(row, { already_applied }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.driverApply = async (req, res) => {
  try {
    const driverId = req.driverAuth?.driver_id;
    if (!driverId) {
      return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
    }

    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: "Жолооч олдсонгүй" });
    }
    const { computeAnket, ANKET_APPLY_THRESHOLD } = require("../utils/driverAnket");
    const anket = computeAnket(driver);
    if (!anket.can_apply) {
      return res.status(403).json({
        success: false,
        message: `Анкет ${ANKET_APPLY_THRESHOLD}%-аас дээш бөглөсөн байх шаардлагатай (одоо ${anket.anket_percent}%)`,
        anket,
      });
    }

    const opening = await Opening.findOne({
      where: { id: req.params.id, status: "approved" },
      skipTenantScope: true,
    });
    if (!opening) {
      return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    }

    const existing = await Application.findOne({
      where: { opening_id: opening.id, driver_id: driverId },
      skipTenantScope: true,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Та аль хэдийн хүсэлт илгээсэн",
      });
    }

    const row = await Application.create({
      opening_id: opening.id,
      driver_id: driverId,
      message: req.body.message || null,
      tenant_id: opening.tenant_id,
      status: "pending",
    });

    res.status(201).json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.driverMyApplications = async (req, res) => {
  try {
    const driverId = req.driverAuth?.driver_id;
    const rows = await Application.findAll({
      where: { driver_id: driverId },
      order: [["createdAt", "DESC"]],
      skipTenantScope: true,
    });

    const openingIds = [...new Set(rows.map((r) => r.opening_id))];
    const openings = await Opening.findAll({
      where: { id: openingIds.length ? openingIds : [0] },
      skipTenantScope: true,
    });
    const openingById = new Map(openings.map((o) => [o.id, serializeOpening(o)]));

    res.json({
      success: true,
      data: rows.map((r) => ({
        ...r.toJSON(),
        opening: openingById.get(r.opening_id) || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.driverWithdrawApplication = async (req, res) => {
  try {
    const driverId = req.driverAuth?.driver_id;
    const row = await Application.findOne({
      where: { id: req.params.id, driver_id: driverId, status: "pending" },
      skipTenantScope: true,
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Хүсэлт олдсонгүй" });
    }
    await row.update({ status: "withdrawn" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
