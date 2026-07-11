const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");
const { calculateReputationScore } = require("../utils/brigadeReputation");

const Brigade = db.brigades;
const BrigadeMember = db.brigade_members;
const Timeline = db.brigade_timeline_events;
const secretKey = "your_secret_key";

const PUBLIC_ATTRS = [
  "id",
  "name",
  "username",
  "leader_name",
  "phone",
  "contact_phone",
  "contact_email",
  "province",
  "location",
  "description",
  "skills",
  "availability",
  "status",
  "logo",
  "average_rating",
  "reputation_score",
  "is_active",
  "createdAt",
  "updatedAt",
];

function publicBrigade(row) {
  if (!row) return null;
  const json = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
  delete json.password;
  delete json.leader_user_id;
  return json;
}

function signBrigadeToken(brigade) {
  return jwt.sign(
    {
      type: "brigada",
      brigade_id: brigade.id,
      username: brigade.username,
    },
    secretKey,
    { expiresIn: "30d" }
  );
}

async function findByUsername(username) {
  const name = String(username || "").trim();
  if (!name) return null;
  return Brigade.findOne({ where: { username: name } });
}

exports.register = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const name = String(req.body.name || req.body.brigade_name || "").trim();
    const phone = String(req.body.phone || req.body.contact_phone || "").trim() || null;
    const leader_name =
      String(req.body.leader_name || "").trim() || username || null;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Хэрэглэгчийн нэр болон нууц үг заавал",
      });
    }
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Бригадын нэр заавал",
      });
    }
    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Нууц үг хамгийн багадаа 4 тэмдэгт",
      });
    }

    const existing = await findByUsername(username);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Хэрэглэгчийн нэр бүртгэлтэй байна",
      });
    }

    // Never create a company user for brigade registration.
    const hashed = await bcrypt.hash(password, 10);
    const payload = {
      name,
      username,
      password: hashed,
      leader_name,
      phone,
      contact_phone: phone,
      contact_email: req.body.contact_email || null,
      province: req.body.province || null,
      location: req.body.location || null,
      description: req.body.description || null,
      skills: Array.isArray(req.body.skills) ? req.body.skills : [],
      availability: "available",
      status: "active",
      is_active: true,
      leader_user_id: null,
    };
    payload.reputation_score = calculateReputationScore(payload);

    const row = await Brigade.create(payload);

    await BrigadeMember.create({
      brigade_id: row.id,
      full_name: leader_name || username,
      phone,
      user_id: null,
      position: "leader",
      status: "active",
      skills: [],
    });

    await Timeline.create({
      brigade_id: row.id,
      event_type: "created",
      title: "Бригад үүсгэгдлээ",
      description: `${row.name} бүртгэгдлээ (гадаад бүртгэл)`,
      actor_user_id: null,
      meta: { source: "brigada_register" },
    });

    const token = signBrigadeToken(row);
    const fresh = await Brigade.findByPk(row.id, { attributes: PUBLIC_ATTRS });

    res.status(201).json({
      success: true,
      message: "Бригад амжилттай бүртгэгдлээ",
      token,
      brigade: publicBrigade(fresh),
      // Alias for Flutter AuthUser shape
      user: {
        id: row.id,
        username: row.username,
        role: "brigada",
        brigade_id: row.id,
        name: row.name,
      },
    });
  } catch (err) {
    console.error("brigada register:", err);
    res.status(500).json({ success: false, message: err.message || "Алдаа" });
  }
};

exports.login = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Хэрэглэгчийн нэр болон нууц үг заавал",
      });
    }

    const brigade = await findByUsername(username);
    if (!brigade || !brigade.password) {
      return res.status(401).json({
        success: false,
        message: "Нэвтрэх нэр эсвэл нууц үг буруу",
      });
    }

    const ok = await bcrypt.compare(password, brigade.password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "Нэвтрэх нэр эсвэл нууц үг буруу",
      });
    }

    if (brigade.status === "suspended" || brigade.is_active === false) {
      return res.status(403).json({
        success: false,
        message: "Бригад түр түдгэлзүүлсэн байна",
      });
    }

    const token = signBrigadeToken(brigade);
    res.json({
      success: true,
      token,
      brigade: publicBrigade(brigade),
      user: {
        id: brigade.id,
        username: brigade.username,
        role: "brigada",
        brigade_id: brigade.id,
        name: brigade.name,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const brigadeId =
      Number(req.query.brigade_id) ||
      Number(req.headers["x-brigada-id"]) ||
      null;
    // Prefer JWT if middleware attached; else query
    let id = brigadeId;
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) {
      try {
        const payload = jwt.verify(auth.slice(7), secretKey);
        if (payload.type === "brigada" && payload.brigade_id) {
          id = payload.brigade_id;
        }
      } catch {
        /* ignore */
      }
    }
    if (!id) {
      return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
    }
    const brigade = await Brigade.findByPk(id, { attributes: PUBLIC_ATTRS });
    if (!brigade) {
      return res.status(404).json({ success: false, message: "Бригад олдсонгүй" });
    }
    res.json({
      success: true,
      data: publicBrigade(brigade),
      brigade: publicBrigade(brigade),
      user: {
        id: brigade.id,
        username: brigade.username,
        role: "brigada",
        brigade_id: brigade.id,
        name: brigade.name,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const password = String(req.body.password || "").trim();
    if (!id || !password || password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Нууц үг хамгийн багадаа 4 тэмдэгт",
      });
    }
    const brigade = await Brigade.findByPk(id);
    if (!brigade) {
      return res.status(404).json({ success: false, message: "Бригад олдсонгүй" });
    }
    if (!brigade.username) {
      return res.status(400).json({
        success: false,
        message: "Энэ бригадэд нэвтрэх нэр тохируулаагүй",
      });
    }
    const hashed = await bcrypt.hash(password, 10);
    await brigade.update({ password: hashed });
    res.json({ success: true, message: "Нууц үг солигдлоо" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.publicBrigade = publicBrigade;
exports.PUBLIC_ATTRS = PUBLIC_ATTRS;
