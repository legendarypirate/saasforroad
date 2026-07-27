const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");

const ServiceMan = db.service_men;
const secretKey = process.env.JWT_SECRET || "your_secret_key";

async function withServices(row) {
  if (!row) return null;
  const full = await ServiceMan.findByPk(row.id, {
    attributes: { exclude: ["password"] },
    include: [{ model: db.assist_services, as: "services" }],
  });
  return full ? full.toJSON() : null;
}

function signServiceManToken(man) {
  return jwt.sign(
    {
      type: "service_man",
      service_man_id: man.id,
      username: man.username,
    },
    secretKey,
    { expiresIn: "30d" }
  );
}

function verifyServiceManToken(req, res, next) {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  if (!token) {
    return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
  }
  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.type !== "service_man" || !decoded.service_man_id) {
      return res.status(403).json({ success: false, message: "Хандах эрхгүй" });
    }
    req.serviceManAuth = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Токен буруу" });
  }
}

exports.verifyServiceManToken = verifyServiceManToken;

exports.register = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const full_name = String(req.body.full_name || req.body.name || "").trim();
    if (!username || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: "Нэр, нэвтрэх нэр, нууц үг заавал",
      });
    }
    if (await ServiceMan.findOne({ where: { username } })) {
      return res.status(400).json({
        success: false,
        message: "Хэрэглэгчийн нэр бүртгэлтэй",
      });
    }
    const row = await ServiceMan.create({
      username,
      password: await bcrypt.hash(password, 10),
      full_name,
      phone: req.body.phone || null,
      email: req.body.email || null,
      vehicle_label: req.body.vehicle_label || null,
      about: req.body.about || null,
      is_online: false,
    });

    const serviceIds = Array.isArray(req.body.service_ids)
      ? req.body.service_ids
      : [];
    if (serviceIds.length) {
      await row.setServices(serviceIds);
    }

    return res.status(201).json({
      success: true,
      token: signServiceManToken(row),
      user: await withServices(row),
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const row = await ServiceMan.findOne({ where: { username } });
    if (!row || !(await bcrypt.compare(password, row.password))) {
      return res.status(401).json({
        success: false,
        message: "Нэвтрэх нэр эсвэл нууц үг буруу",
      });
    }
    return res.json({
      success: true,
      token: signServiceManToken(row),
      user: await withServices(row),
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.me = async (req, res) => {
  const user = await withServices({ id: req.serviceManAuth.service_man_id });
  if (!user) {
    return res.status(404).json({ success: false, message: "Олдсонгүй" });
  }
  return res.json({ success: true, user });
};

exports.updateMe = async (req, res) => {
  try {
    const row = await ServiceMan.findByPk(req.serviceManAuth.service_man_id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    const fields = [
      "full_name",
      "phone",
      "email",
      "photo",
      "vehicle_label",
      "about",
      "is_online",
      "last_lat",
      "last_lng",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) row[f] = req.body[f];
    }
    await row.save();

    if (Array.isArray(req.body.service_ids)) {
      await row.setServices(req.body.service_ids);
    }

    return res.json({
      success: true,
      user: await withServices(row),
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.setServices = async (req, res) => {
  try {
    const row = await ServiceMan.findByPk(req.serviceManAuth.service_man_id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    const ids = Array.isArray(req.body.service_ids) ? req.body.service_ids : [];
    await row.setServices(ids);
    return res.json({ success: true, user: await withServices(row) });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
