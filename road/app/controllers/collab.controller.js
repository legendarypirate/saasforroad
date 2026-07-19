const db = require("../models");
const Op = db.Sequelize.Op;
const JobAd = db.job_ads;
const CollabRequest = db.collaboration_requests;
const ProjectCollaborator = db.project_collaborators;
const Project = db.projects;
const Tenant = db.tenants;

const ROLE_LABELS = {
  subcontractor: "Туслан гүйцэтгэгч",
  partner: "Түнш",
  specialist: "Мэргэжилтэн",
  owner_primary: "Үндсэн гүйцэтгэгч",
};

const VALID_ROLES = new Set(["subcontractor", "partner", "specialist"]);

function tenantId(req) {
  return req.tenant?.id || req.user?.tenant_id || null;
}

function userId(req) {
  return req.user?.id || null;
}

function serializeTenantCard(t, extra = {}) {
  if (!t) return null;
  const row = t.toJSON ? t.toJSON() : t;
  return {
    id: row.id,
    name: row.name,
    company_name: row.company_name || row.name,
    slug: row.slug,
    domain: row.domain,
    contact_email: row.contact_email || null,
    contact_phone: row.contact_phone || null,
    is_active: row.is_active !== false,
    ...extra,
  };
}

function serializeAd(ad, extras = {}) {
  const row = ad.toJSON ? ad.toJSON() : ad;
  return {
    ...row,
    role_label: ROLE_LABELS[row.role_sought] || row.role_sought,
    ...extras,
  };
}

async function loadOwnerProject(projectId, tid) {
  const project = await Project.findOne({
    where: { id: projectId },
    skipTenantScope: true,
  });
  if (!project) return null;

  const ownerTid = project.tenant_id;
  if (ownerTid == null) {
    // Legacy rows before tenant isolation — claim for current tenant
    await project.update({ tenant_id: tid }, { skipTenantScope: true });
    return project;
  }
  if (Number(ownerTid) !== Number(tid)) return null;
  return project;
}

async function companyNameForTenant(tid) {
  const t = await Tenant.findByPk(tid, { skipTenantScope: true });
  if (!t) return null;
  return t.company_name || t.name;
}

// ─── Own ads ───────────────────────────────────────────────────────────────

exports.listMyAds = async (req, res) => {
  try {
    const tid = tenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: "Tenant required" });

    const where = { tenant_id: tid };
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.project_id) where.project_id = Number(req.query.project_id);

    const rows = await JobAd.findAll({
      where,
      order: [["updatedAt", "DESC"]],
    });
    res.json({ success: true, data: rows.map((r) => serializeAd(r)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAd = async (req, res) => {
  try {
    const tid = tenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: "Tenant required" });

    const title = String(req.body.title || "").trim();
    const projectId = Number(req.body.project_id);
    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        message: "Гарчиг болон төсөл шаардлагатай",
      });
    }

    const project = await loadOwnerProject(projectId, tid);
    if (!project) {
      return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });
    }

    const role = VALID_ROLES.has(req.body.role_sought)
      ? req.body.role_sought
      : "subcontractor";

    const company = await companyNameForTenant(tid);
    const row = await JobAd.create({
      tenant_id: tid,
      project_id: project.id,
      title,
      description: req.body.description || null,
      role_sought: role,
      province: req.body.province || null,
      location: req.body.location || null,
      budget_note: req.body.budget_note || null,
      starts_at: req.body.starts_at || null,
      closes_at: req.body.closes_at || null,
      company_name: company,
      project_name: project.name || project.road_name || null,
      status: req.body.publish === true || req.body.publish === "1" ? "published" : "draft",
      published_at:
        req.body.publish === true || req.body.publish === "1" ? new Date() : null,
      created_by: userId(req),
    });

    res.status(201).json({ success: true, data: serializeAd(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyAd = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await JobAd.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    res.json({ success: true, data: serializeAd(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAd = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await JobAd.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) return res.status(404).json({ success: false, message: "Зар олдсонгүй" });

    const patch = {};
    for (const key of [
      "title",
      "description",
      "province",
      "location",
      "budget_note",
      "starts_at",
      "closes_at",
    ]) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (req.body.role_sought !== undefined && VALID_ROLES.has(req.body.role_sought)) {
      patch.role_sought = req.body.role_sought;
    }
    if (req.body.project_id !== undefined) {
      const project = await loadOwnerProject(Number(req.body.project_id), tid);
      if (!project) {
        return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });
      }
      patch.project_id = project.id;
      patch.project_name = project.name || project.road_name || null;
    }

    await row.update(patch);
    res.json({ success: true, data: serializeAd(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.publishAd = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await JobAd.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    await row.update({ status: "published", published_at: new Date() });
    res.json({ success: true, data: serializeAd(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.closeAd = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await JobAd.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    const status = req.body.filled === true || req.body.filled === "1" ? "filled" : "closed";
    await row.update({ status });
    res.json({ success: true, data: serializeAd(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAd = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await JobAd.findOne({
      where: { id: req.params.id, tenant_id: tid },
    });
    if (!row) return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    if (row.status === "published") {
      return res.status(400).json({
        success: false,
        message: "Нийтэлсэн зарыг эхлээд хаана уу",
      });
    }
    await row.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Marketplace ───────────────────────────────────────────────────────────

exports.listMarketplace = async (req, res) => {
  try {
    const tid = tenantId(req);
    const where = {
      status: "published",
      ...(tid ? { tenant_id: { [Op.ne]: tid } } : {}),
    };
    if (req.query.role_sought && VALID_ROLES.has(req.query.role_sought)) {
      where.role_sought = req.query.role_sought;
    }
    if (req.query.province) {
      where.province = { [Op.iLike]: `%${String(req.query.province).trim()}%` };
    }
    const q = String(req.query.q || req.query.search || "").trim();
    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { company_name: { [Op.iLike]: `%${q}%` } },
        { project_name: { [Op.iLike]: `%${q}%` } },
        { location: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const rows = await JobAd.findAll({
      where,
      order: [["published_at", "DESC"], ["id", "DESC"]],
      skipTenantScope: true,
    });
    res.json({ success: true, data: rows.map((r) => serializeAd(r)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMarketplaceAd = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await JobAd.findOne({
      where: { id: req.params.id, status: "published" },
      skipTenantScope: true,
    });
    if (!row) return res.status(404).json({ success: false, message: "Зар олдсонгүй" });

    const owner = await Tenant.findByPk(row.tenant_id, { skipTenantScope: true });
    const pendingMine =
      tid &&
      (await CollabRequest.findOne({
        where: {
          job_ad_id: row.id,
          from_tenant_id: tid,
          status: "pending",
        },
        skipTenantScope: true,
      }));

    res.json({
      success: true,
      data: serializeAd(row, {
        company: serializeTenantCard(owner),
        already_applied: Boolean(pendingMine),
        is_own: tid != null && Number(row.tenant_id) === Number(tid),
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.applyToAd = async (req, res) => {
  try {
    const tid = tenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: "Tenant required" });

    const ad = await JobAd.findOne({
      where: { id: req.params.id, status: "published" },
      skipTenantScope: true,
    });
    if (!ad) return res.status(404).json({ success: false, message: "Зар олдсонгүй" });
    if (Number(ad.tenant_id) === Number(tid)) {
      return res.status(400).json({
        success: false,
        message: "Өөрийн зар руу хүсэлт илгээх боломжгүй",
      });
    }

    const existing = await CollabRequest.findOne({
      where: {
        job_ad_id: ad.id,
        from_tenant_id: tid,
        status: "pending",
      },
      skipTenantScope: true,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Хүлээгдэж буй хүсэлт аль хэдийн байна",
      });
    }

    const role = VALID_ROLES.has(req.body.requested_role)
      ? req.body.requested_role
      : ad.role_sought;

    const row = await CollabRequest.create(
      {
        job_ad_id: ad.id,
        project_id: ad.project_id,
        from_tenant_id: tid,
        to_tenant_id: ad.tenant_id,
        requested_role: role,
        message: req.body.message || null,
        status: "pending",
        created_by: userId(req),
        tenant_id: ad.tenant_id,
      },
      { skipTenantScope: true }
    );

    res.status(201).json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Requests ──────────────────────────────────────────────────────────────

exports.listIncoming = async (req, res) => {
  try {
    const tid = tenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: "Tenant required" });

    const where = { to_tenant_id: tid };
    if (req.query.status) where.status = String(req.query.status);

    const rows = await CollabRequest.findAll({
      where,
      include: [
        {
          model: JobAd,
          as: "job_ad",
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      skipTenantScope: true,
    });

    const fromIds = [...new Set(rows.map((r) => r.from_tenant_id))];
    const tenants = await Tenant.findAll({
      where: { id: { [Op.in]: fromIds } },
      skipTenantScope: true,
    });
    const byId = new Map(tenants.map((t) => [t.id, t]));

    res.json({
      success: true,
      data: rows.map((r) => {
        const json = r.toJSON();
        return {
          ...json,
          role_label: ROLE_LABELS[json.requested_role] || json.requested_role,
          from_company: serializeTenantCard(byId.get(json.from_tenant_id)),
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listOutgoing = async (req, res) => {
  try {
    const tid = tenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: "Tenant required" });

    const where = { from_tenant_id: tid };
    if (req.query.status) where.status = String(req.query.status);

    const rows = await CollabRequest.findAll({
      where,
      include: [{ model: JobAd, as: "job_ad", required: false }],
      order: [["createdAt", "DESC"]],
      skipTenantScope: true,
    });

    const toIds = [...new Set(rows.map((r) => r.to_tenant_id))];
    const tenants = await Tenant.findAll({
      where: { id: { [Op.in]: toIds } },
      skipTenantScope: true,
    });
    const byId = new Map(tenants.map((t) => [t.id, t]));

    res.json({
      success: true,
      data: rows.map((r) => {
        const json = r.toJSON();
        return {
          ...json,
          role_label: ROLE_LABELS[json.requested_role] || json.requested_role,
          to_company: serializeTenantCard(byId.get(json.to_tenant_id)),
        };
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await CollabRequest.findOne({
      where: { id: req.params.id, to_tenant_id: tid, status: "pending" },
      skipTenantScope: true,
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Хүсэлт олдсонгүй" });
    }

    const existing = await ProjectCollaborator.findOne({
      where: {
        project_id: row.project_id,
        collaborator_tenant_id: row.from_tenant_id,
        status: "active",
      },
      skipTenantScope: true,
    });
    if (existing) {
      await row.update({
        status: "accepted",
        responded_at: new Date(),
        response_note: req.body.response_note || null,
      });
      return res.json({
        success: true,
        data: row,
        collaborator: existing,
        message: "Аль хэдийн хамтрагч",
      });
    }

    const removed = await ProjectCollaborator.findOne({
      where: {
        project_id: row.project_id,
        collaborator_tenant_id: row.from_tenant_id,
        status: "removed",
      },
      skipTenantScope: true,
    });

    let collaborator;
    if (removed) {
      await removed.update({
        status: "active",
        role: row.requested_role,
        collaboration_request_id: row.id,
      });
      collaborator = removed;
    } else {
      collaborator = await ProjectCollaborator.create(
        {
          project_id: row.project_id,
          owner_tenant_id: row.to_tenant_id,
          collaborator_tenant_id: row.from_tenant_id,
          role: row.requested_role,
          status: "active",
          collaboration_request_id: row.id,
          tenant_id: row.to_tenant_id,
        },
        { skipTenantScope: true }
      );
    }

    await row.update({
      status: "accepted",
      responded_at: new Date(),
      response_note: req.body.response_note || null,
    });

    res.json({ success: true, data: row, collaborator });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await CollabRequest.findOne({
      where: { id: req.params.id, to_tenant_id: tid, status: "pending" },
      skipTenantScope: true,
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Хүсэлт олдсонгүй" });
    }
    await row.update({
      status: "rejected",
      responded_at: new Date(),
      response_note: req.body.response_note || null,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.withdrawRequest = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await CollabRequest.findOne({
      where: { id: req.params.id, from_tenant_id: tid, status: "pending" },
      skipTenantScope: true,
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Хүсэлт олдсонгүй" });
    }
    await row.update({
      status: "withdrawn",
      responded_at: new Date(),
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Collaborators & profile ───────────────────────────────────────────────

exports.listProjectCollaborators = async (req, res) => {
  try {
    const tid = tenantId(req);
    const projectId = Number(req.params.projectId);
    const project = await Project.findOne({
      where: { id: projectId, tenant_id: tid },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: "Төсөл олдсонгүй" });
    }

    const owner = await Tenant.findByPk(tid, { skipTenantScope: true });
    const rows = await ProjectCollaborator.findAll({
      where: { project_id: projectId, status: "active" },
      order: [["id", "ASC"]],
      skipTenantScope: true,
    });

    const ids = [...new Set(rows.map((r) => r.collaborator_tenant_id))];
    const tenants = await Tenant.findAll({
      where: { id: { [Op.in]: ids } },
      skipTenantScope: true,
    });
    const byId = new Map(tenants.map((t) => [t.id, t]));

    const primary = {
      role: "owner_primary",
      role_label: ROLE_LABELS.owner_primary,
      status: "active",
      company: serializeTenantCard(owner),
      is_owner: true,
    };

    const others = rows.map((r) => {
      const json = r.toJSON();
      return {
        ...json,
        role_label: ROLE_LABELS[json.role] || json.role,
        company: serializeTenantCard(byId.get(json.collaborator_tenant_id)),
        is_owner: false,
      };
    });

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          road_name: project.road_name,
        },
        collaborators: [primary, ...others],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeCollaborator = async (req, res) => {
  try {
    const tid = tenantId(req);
    const row = await ProjectCollaborator.findOne({
      where: {
        id: req.params.id,
        owner_tenant_id: tid,
        status: "active",
      },
      skipTenantScope: true,
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Хамтрагч олдсонгүй" });
    }
    await row.update({ status: "removed" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTenantProfile = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const t = await Tenant.findByPk(id, { skipTenantScope: true });
    if (!t || t.is_active === false) {
      return res.status(404).json({ success: false, message: "Компани олдсонгүй" });
    }

    const activeAsCollab = await ProjectCollaborator.count({
      where: { collaborator_tenant_id: id, status: "active" },
      skipTenantScope: true,
    });
    const openAds = await JobAd.count({
      where: { tenant_id: id, status: "published" },
      skipTenantScope: true,
    });

    res.json({
      success: true,
      data: serializeTenantCard(t, {
        active_collaborations: activeAsCollab,
        open_job_ads: openAds,
      }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.ROLE_LABELS = ROLE_LABELS;
