const db = require("../models");

const JobSeeker = db.job_seekers;
const School = db.job_seeker_schools;
const Family = db.job_seeker_families;
const Application = db.job_applications;
const Offer = db.job_offers;
const Tenant = db.tenants;

const { PUBLIC_ATTRS } = require("./jobseeker_auth.controller");

/** Mobile requests must never be tenant-scoped — pass this to every query. */
const UNSCOPED = { skipTenantScope: true };

const EDITABLE_PROFILE = [
  "full_name",
  "phone",
  "email",
  "photo",
  "gender",
  "birth_date",
  "register_number",
  "province",
  "location",
  "desired_role",
  "experience_years",
  "education_level",
  "about",
  "salary_expect",
  "is_available",
];

function seekerId(req) {
  return req.jobSeeker?.job_seeker_id;
}

async function attachCompanyNames(rows) {
  const list = rows.map((r) => (typeof r.toJSON === "function" ? r.toJSON() : r));
  const ids = [...new Set(list.map((r) => r.tenant_id).filter(Boolean))];
  if (ids.length === 0) return list;
  const tenants = await Tenant.findAll({
    where: { id: ids },
    attributes: ["id", "name", "company_name"],
  });
  const byId = new Map(tenants.map((t) => [t.id, t]));
  return list.map((r) => ({
    ...r,
    company_name:
      r.company_name ||
      byId.get(r.tenant_id)?.company_name ||
      byId.get(r.tenant_id)?.name ||
      null,
  }));
}

/* ---------------------------------------------------------------- Profile */

exports.updateProfile = async (req, res) => {
  try {
    const seeker = await JobSeeker.findByPk(seekerId(req));
    if (!seeker) return res.status(404).json({ success: false, message: "Олдсонгүй" });

    const patch = {};
    for (const key of EDITABLE_PROFILE) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (Array.isArray(req.body.skills)) patch.skills = req.body.skills;
    await seeker.update(patch);

    const fresh = await JobSeeker.findByPk(seeker.id, {
      attributes: PUBLIC_ATTRS,
      include: [
        { model: School, as: "schools" },
        { model: Family, as: "family" },
      ],
    });
    res.json({ success: true, data: fresh });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ----------------------------------------------------------------- Schools */

exports.addSchool = async (req, res) => {
  try {
    const name = String(req.body.school_name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Сургуулийн нэр заавал" });
    const row = await School.create({
      job_seeker_id: seekerId(req),
      school_name: name,
      major: req.body.major || null,
      degree: req.body.degree || null,
      start_year: req.body.start_year || null,
      graduation_year: req.body.graduation_year || null,
      description: req.body.description || null,
    });
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSchool = async (req, res) => {
  try {
    const row = await School.findByPk(req.params.id);
    if (!row || row.job_seeker_id !== seekerId(req)) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    await row.update({
      school_name: req.body.school_name ?? row.school_name,
      major: req.body.major ?? row.major,
      degree: req.body.degree ?? row.degree,
      start_year: req.body.start_year ?? row.start_year,
      graduation_year: req.body.graduation_year ?? row.graduation_year,
      description: req.body.description ?? row.description,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSchool = async (req, res) => {
  try {
    const row = await School.findByPk(req.params.id);
    if (!row || row.job_seeker_id !== seekerId(req)) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    await row.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------------ Family */

exports.addFamily = async (req, res) => {
  try {
    const name = String(req.body.full_name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Нэр заавал" });
    const row = await Family.create({
      job_seeker_id: seekerId(req),
      full_name: name,
      relation: req.body.relation || null,
      phone: req.body.phone || null,
      job: req.body.job || null,
      workplace: req.body.workplace || null,
    });
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFamily = async (req, res) => {
  try {
    const row = await Family.findByPk(req.params.id);
    if (!row || row.job_seeker_id !== seekerId(req)) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    await row.update({
      full_name: req.body.full_name ?? row.full_name,
      relation: req.body.relation ?? row.relation,
      phone: req.body.phone ?? row.phone,
      job: req.body.job ?? row.job,
      workplace: req.body.workplace ?? row.workplace,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFamily = async (req, res) => {
  try {
    const row = await Family.findByPk(req.params.id);
    if (!row || row.job_seeker_id !== seekerId(req)) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    await row.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------ Companies to apply */

exports.listCompanies = async (_req, res) => {
  try {
    const tenants = await Tenant.findAll({
      where: { is_active: true },
      attributes: ["id", "name", "company_name"],
      order: [["name", "ASC"]],
    });
    res.json({
      success: true,
      data: tenants.map((t) => ({
        id: t.id,
        name: t.company_name || t.name,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------ Applications */

exports.listMyApplications = async (req, res) => {
  try {
    const rows = await Application.findAll({
      where: { job_seeker_id: seekerId(req) },
      order: [["createdAt", "DESC"]],
      ...UNSCOPED,
    });
    res.json({ success: true, data: await attachCompanyNames(rows) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.apply = async (req, res) => {
  try {
    const tenant_id = Number(req.body.tenant_id);
    if (!tenant_id) {
      return res.status(400).json({ success: false, message: "Компани сонгоно уу" });
    }
    const tenant = await Tenant.findByPk(tenant_id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "Компани олдсонгүй" });
    }
    const dup = await Application.findOne({
      where: { job_seeker_id: seekerId(req), tenant_id, status: "pending" },
      ...UNSCOPED,
    });
    if (dup) {
      return res
        .status(409)
        .json({ success: false, message: "Энэ компанид хүсэлт илгээсэн байна" });
    }
    const row = await Application.create({
      job_seeker_id: seekerId(req),
      tenant_id,
      position: req.body.position || null,
      message: req.body.message || null,
      status: "pending",
    });
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.withdrawApplication = async (req, res) => {
  try {
    const row = await Application.findByPk(req.params.id, UNSCOPED);
    if (!row || row.job_seeker_id !== seekerId(req)) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    await row.update({ status: "withdrawn" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------------ Offers */

exports.listMyOffers = async (req, res) => {
  try {
    const rows = await Offer.findAll({
      where: { job_seeker_id: seekerId(req) },
      order: [["createdAt", "DESC"]],
      ...UNSCOPED,
    });
    res.json({ success: true, data: await attachCompanyNames(rows) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.respondToOffer = async (req, res) => {
  try {
    const status = String(req.body.status || "").trim();
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Буруу үйлдэл" });
    }
    const row = await Offer.findByPk(req.params.id, UNSCOPED);
    if (!row || row.job_seeker_id !== seekerId(req)) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    if (row.status !== "sent") {
      return res
        .status(400)
        .json({ success: false, message: "Энэ саналд аль хэдийн хариулсан байна" });
    }
    await row.update({
      status,
      response_note: req.body.response_note || null,
      responded_at: new Date(),
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
