const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");

const JobSeeker = db.job_seekers;
const secretKey = process.env.JWT_SECRET || "your_secret_key";

const PUBLIC_ATTRS = [
  "id",
  "username",
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
  "skills",
  "about",
  "salary_expect",
  "is_available",
  "status",
  "is_active",
  "createdAt",
  "updatedAt",
];

function publicSeeker(row) {
  if (!row) return null;
  const json = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
  delete json.password;
  return json;
}

function signSeekerToken(seeker) {
  return jwt.sign(
    { type: "job_seeker", job_seeker_id: seeker.id, username: seeker.username },
    secretKey,
    { expiresIn: "30d" }
  );
}

function authUser(seeker) {
  return {
    id: seeker.id,
    username: seeker.username,
    role: "job_seeker",
    job_seeker_id: seeker.id,
    name: seeker.full_name,
  };
}

async function findByUsername(username) {
  const name = String(username || "").trim();
  if (!name) return null;
  return JobSeeker.findOne({ where: { username: name } });
}

/** Express middleware — verifies the mobile job-seeker JWT, sets req.jobSeeker. */
function verifyJobSeekerToken(req, res, next) {
  const raw = req.headers.authorization || req.headers.Authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  if (!token) {
    return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
  }
  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.type !== "job_seeker" || !decoded.job_seeker_id) {
      return res.status(403).json({ success: false, message: "Хандах эрхгүй" });
    }
    req.jobSeeker = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Токен буруу эсвэл хугацаа дууссан" });
  }
}

exports.register = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const full_name = String(req.body.full_name || req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim() || null;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Хэрэглэгчийн нэр болон нууц үг заавал",
      });
    }
    if (!full_name) {
      return res.status(400).json({ success: false, message: "Овог нэр заавал" });
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

    const hashed = await bcrypt.hash(password, 10);
    const row = await JobSeeker.create({
      username,
      password: hashed,
      full_name,
      phone,
      email: req.body.email || null,
      gender: req.body.gender || null,
      birth_date: req.body.birth_date || null,
      register_number: req.body.register_number || null,
      province: req.body.province || null,
      location: req.body.location || null,
      desired_role: req.body.desired_role || null,
      experience_years: Number(req.body.experience_years) || 0,
      education_level: req.body.education_level || null,
      skills: Array.isArray(req.body.skills) ? req.body.skills : [],
      about: req.body.about || null,
      salary_expect: req.body.salary_expect ?? null,
      is_available: req.body.is_available !== false,
      status: "active",
      is_active: true,
    });

    // Optional nested schools / family on registration.
    if (Array.isArray(req.body.schools)) {
      for (const s of req.body.schools) {
        if (!s || !String(s.school_name || "").trim()) continue;
        await db.job_seeker_schools.create({
          job_seeker_id: row.id,
          school_name: String(s.school_name).trim(),
          major: s.major || null,
          degree: s.degree || null,
          start_year: s.start_year || null,
          graduation_year: s.graduation_year || null,
          description: s.description || null,
        });
      }
    }
    if (Array.isArray(req.body.family)) {
      for (const f of req.body.family) {
        if (!f || !String(f.full_name || "").trim()) continue;
        await db.job_seeker_families.create({
          job_seeker_id: row.id,
          full_name: String(f.full_name).trim(),
          relation: f.relation || null,
          phone: f.phone || null,
          job: f.job || null,
          workplace: f.workplace || null,
        });
      }
    }

    const token = signSeekerToken(row);
    res.status(201).json({
      success: true,
      message: "Амжилттай бүртгэгдлээ",
      token,
      data: publicSeeker(row),
      user: authUser(row),
    });
  } catch (err) {
    console.error("job seeker register:", err);
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

    const seeker = await findByUsername(username);
    if (!seeker || !seeker.password) {
      return res
        .status(401)
        .json({ success: false, message: "Нэвтрэх нэр эсвэл нууц үг буруу" });
    }
    const ok = await bcrypt.compare(password, seeker.password);
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: "Нэвтрэх нэр эсвэл нууц үг буруу" });
    }
    if (seeker.status === "suspended" || seeker.is_active === false) {
      return res
        .status(403)
        .json({ success: false, message: "Бүртгэл түр түдгэлзүүлсэн байна" });
    }

    const token = signSeekerToken(seeker);
    res.json({
      success: true,
      token,
      data: publicSeeker(seeker),
      user: authUser(seeker),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const id = req.jobSeeker?.job_seeker_id;
    const seeker = await JobSeeker.findByPk(id, {
      attributes: PUBLIC_ATTRS,
      include: [
        { model: db.job_seeker_schools, as: "schools" },
        { model: db.job_seeker_families, as: "family" },
      ],
    });
    if (!seeker) {
      return res.status(404).json({ success: false, message: "Бүртгэл олдсонгүй" });
    }
    res.json({ success: true, data: seeker, user: authUser(seeker) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const id = req.jobSeeker?.job_seeker_id;
    const current = String(req.body.current_password || "");
    const password = String(req.body.password || "").trim();
    if (!password || password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Нууц үг хамгийн багадаа 4 тэмдэгт",
      });
    }
    const seeker = await JobSeeker.findByPk(id);
    if (!seeker) {
      return res.status(404).json({ success: false, message: "Бүртгэл олдсонгүй" });
    }
    if (seeker.password && current) {
      const ok = await bcrypt.compare(current, seeker.password);
      if (!ok) {
        return res
          .status(400)
          .json({ success: false, message: "Одоогийн нууц үг буруу" });
      }
    }
    const hashed = await bcrypt.hash(password, 10);
    await seeker.update({ password: hashed });
    res.json({ success: true, message: "Нууц үг солигдлоо" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyJobSeekerToken = verifyJobSeekerToken;
exports.publicSeeker = publicSeeker;
exports.signSeekerToken = signSeekerToken;
exports.PUBLIC_ATTRS = PUBLIC_ATTRS;
