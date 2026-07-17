const { Op } = require("sequelize");
const db = require("../models");

const JobSeeker = db.job_seekers;
const School = db.job_seeker_schools;
const Family = db.job_seeker_families;
const Application = db.job_applications;
const Offer = db.job_offers;

const { PUBLIC_ATTRS } = require("./jobseeker_auth.controller");

function tenantName(req) {
  return req.tenant?.company_name || req.tenant?.name || null;
}

/* ------------------------------------------------ Browse seeker marketplace */

exports.listSeekers = async (req, res) => {
  try {
    const search = String(req.query.search || req.query.q || "").trim();
    const province = String(req.query.province || "").trim();
    const onlyAvailable = String(req.query.available || "") === "true";

    const where = { is_active: true, status: "active" };
    if (onlyAvailable) where.is_available = true;
    if (province) where.province = province;
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { desired_role: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { province: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const rows = await JobSeeker.findAll({
      where,
      attributes: PUBLIC_ATTRS,
      order: [["updatedAt", "DESC"]],
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSeeker = async (req, res) => {
  try {
    const seeker = await JobSeeker.findByPk(req.params.id, {
      attributes: PUBLIC_ATTRS,
      include: [
        { model: School, as: "schools" },
        { model: Family, as: "family" },
      ],
    });
    if (!seeker) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    // This tenant's own offers/applications with this seeker (auto tenant-scoped).
    const [offers, applications] = await Promise.all([
      Offer.findAll({
        where: { job_seeker_id: seeker.id },
        order: [["createdAt", "DESC"]],
      }),
      Application.findAll({
        where: { job_seeker_id: seeker.id },
        order: [["createdAt", "DESC"]],
      }),
    ]);
    res.json({
      success: true,
      data: { ...seeker.toJSON(), offers, applications },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------------- Offers (out) */

exports.listOffers = async (req, res) => {
  try {
    const rows = await Offer.findAll({ order: [["createdAt", "DESC"]] });
    const seekerIds = [...new Set(rows.map((r) => r.job_seeker_id))];
    const seekers = await JobSeeker.findAll({
      where: { id: seekerIds.length ? seekerIds : [0] },
      attributes: ["id", "full_name", "phone", "desired_role", "photo"],
    });
    const byId = new Map(seekers.map((s) => [s.id, s]));
    res.json({
      success: true,
      data: rows.map((r) => ({
        ...r.toJSON(),
        job_seeker: byId.get(r.job_seeker_id) || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createOffer = async (req, res) => {
  try {
    const job_seeker_id = Number(req.params.id || req.body.job_seeker_id);
    if (!job_seeker_id) {
      return res.status(400).json({ success: false, message: "Ажил горилогч заавал" });
    }
    const seeker = await JobSeeker.findByPk(job_seeker_id);
    if (!seeker) {
      return res.status(404).json({ success: false, message: "Ажил горилогч олдсонгүй" });
    }
    // tenant_id auto-injected by tenant hooks from req.tenant context.
    const row = await Offer.create({
      job_seeker_id,
      employer_name: tenantName(req),
      job_title: req.body.job_title || null,
      message: req.body.message || null,
      salary_offer: req.body.salary_offer ?? null,
      start_date: req.body.start_date || null,
      status: "sent",
      requested_by: req.user?.id || null,
    });
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    // findByPk is auto tenant-scoped, so a tenant can only touch its own offers.
    const row = await Offer.findByPk(req.params.offerId);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
    const status = String(req.body.status || "").trim();
    if (status && !["sent", "withdrawn"].includes(status)) {
      return res.status(400).json({ success: false, message: "Буруу төлөв" });
    }
    await row.update({
      job_title: req.body.job_title ?? row.job_title,
      message: req.body.message ?? row.message,
      salary_offer: req.body.salary_offer ?? row.salary_offer,
      start_date: req.body.start_date ?? row.start_date,
      status: status || row.status,
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------------------------------- Applications (in) */

exports.listApplications = async (req, res) => {
  try {
    const rows = await Application.findAll({ order: [["createdAt", "DESC"]] });
    const seekerIds = [...new Set(rows.map((r) => r.job_seeker_id))];
    const seekers = await JobSeeker.findAll({
      where: { id: seekerIds.length ? seekerIds : [0] },
      attributes: [
        "id",
        "full_name",
        "phone",
        "email",
        "desired_role",
        "experience_years",
        "photo",
      ],
    });
    const byId = new Map(seekers.map((s) => [s.id, s]));
    res.json({
      success: true,
      data: rows.map((r) => ({
        ...r.toJSON(),
        job_seeker: byId.get(r.job_seeker_id) || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.respondToApplication = async (req, res) => {
  try {
    const status = String(req.body.status || "").trim();
    if (!["reviewed", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Буруу төлөв" });
    }
    const row = await Application.findByPk(req.params.appId);
    if (!row) return res.status(404).json({ success: false, message: "Олдсонгүй" });
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
