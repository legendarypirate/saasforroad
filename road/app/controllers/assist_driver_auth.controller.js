const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");
const { computeAnket } = require("../utils/driverAnket");

const Driver = db.road_drivers;
const secretKey = process.env.JWT_SECRET || "your_secret_key";

function publicDriver(row) {
  if (!row) return null;
  const json = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
  delete json.password;
  return { ...json, ...computeAnket(json) };
}

function signDriverToken(driver) {
  return jwt.sign(
    { type: "road_driver", driver_id: driver.id, username: driver.username },
    secretKey,
    { expiresIn: "30d" }
  );
}

function verifyDriverToken(req, res, next) {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  if (!token) {
    return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
  }
  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.type !== "road_driver" || !decoded.driver_id) {
      return res.status(403).json({ success: false, message: "Хандах эрхгүй" });
    }
    req.driverAuth = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Токен буруу" });
  }
}

exports.verifyDriverToken = verifyDriverToken;
exports.publicDriver = publicDriver;

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
    if (await Driver.findOne({ where: { username } })) {
      return res.status(400).json({
        success: false,
        message: "Хэрэглэгчийн нэр бүртгэлтэй",
      });
    }
    const row = await Driver.create({
      username,
      password: await bcrypt.hash(password, 10),
      full_name,
      phone: req.body.phone || null,
      email: req.body.email || null,
      vehicle_label: req.body.vehicle_label || null,
      plate_number: req.body.plate_number || null,
    });
    const token = signDriverToken(row);
    return res.status(201).json({
      success: true,
      token,
      user: publicDriver(row),
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const row = await Driver.findOne({ where: { username } });
    if (!row || !(await bcrypt.compare(password, row.password))) {
      return res.status(401).json({
        success: false,
        message: "Нэвтрэх нэр эсвэл нууц үг буруу",
      });
    }
    return res.json({
      success: true,
      token: signDriverToken(row),
      user: publicDriver(row),
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.me = async (req, res) => {
  try {
    const row = await Driver.findByPk(req.driverAuth.driver_id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    return res.json({ success: true, user: publicDriver(row) });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const row = await Driver.findByPk(req.driverAuth.driver_id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    const fields = [
      "full_name",
      "phone",
      "email",
      "photo",
      "vehicle_label",
      "plate_number",
      "gender",
      "birth_date",
      "register_number",
      "province",
      "location",
      "desired_role",
      "experience_years",
      "education_level",
      "license_category",
      "about",
      "salary_expect",
      "last_lat",
      "last_lng",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        const v = req.body[f];
        row[f] = v === "" ? null : v;
      }
    }
    await row.save();
    return res.json({ success: true, user: publicDriver(row) });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};
