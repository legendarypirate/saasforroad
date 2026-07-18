const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");

const Company = db.platform_plant_companies;
const Plant = db.platform_factories;
const secretKey = process.env.JWT_SECRET || "your_secret_key";

const COMPANY_PUBLIC = [
  "id",
  "username",
  "name",
  "contact_name",
  "phone",
  "email",
  "province",
  "description",
  "status",
  "is_active",
  "createdAt",
  "updatedAt",
];

const PLANT_PUBLIC = [
  "id",
  "company_id",
  "name",
  "owner_name",
  "phone",
  "email",
  "plant_type",
  "province",
  "location",
  "description",
  "image",
  "latitude",
  "longitude",
  "status",
  "is_active",
  "rejection_note",
  "createdAt",
  "updatedAt",
];

const PLANT_TYPES = new Set([
  "asphalt",
  "cement",
  "crushing",
  "emulsion",
  "ctb",
  "other",
]);

function publicCompany(row) {
  if (!row) return null;
  const json = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
  delete json.password;
  return json;
}

function publicPlant(row) {
  if (!row) return null;
  const json = typeof row.toJSON === "function" ? row.toJSON() : { ...row };
  if (json.latitude != null) json.latitude = Number(json.latitude);
  if (json.longitude != null) json.longitude = Number(json.longitude);
  return json;
}

function signCompanyToken(company) {
  return jwt.sign(
    {
      type: "plant_company",
      company_id: company.id,
      username: company.username,
    },
    secretKey,
    { expiresIn: "30d" }
  );
}

function authUser(company) {
  return {
    id: company.id,
    username: company.username,
    role: "plant_company",
    company_id: company.id,
    name: company.name,
  };
}

function parseCoord(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return { error: `${label} буруу байна` };
  }
  return { value: n };
}

/** Express middleware — company JWT → req.company */
function verifyCompanyToken(req, res, next) {
  const raw = req.headers.authorization || req.headers.Authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
  if (!token) {
    return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
  }
  try {
    const decoded = jwt.verify(token, secretKey);
    // Accept legacy factory tokens only if we can map — prefer plant_company
    if (decoded.type === "plant_company" && decoded.company_id) {
      req.company = decoded;
      return next();
    }
    // Legacy single-factory tokens no longer valid for multi-plant
    return res.status(403).json({
      success: false,
      message: "Дахин нэвтэрнэ үү",
    });
  } catch {
    return res.status(401).json({
      success: false,
      message: "Токен буруу эсвэл хугацаа дууссан",
    });
  }
}

exports.verifyFactoryToken = verifyCompanyToken;
exports.verifyCompanyToken = verifyCompanyToken;

exports.register = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const name = String(
      req.body.name || req.body.company_name || ""
    ).trim();
    const phone = String(req.body.phone || "").trim() || null;
    const contact_name =
      String(req.body.contact_name || req.body.owner_name || "").trim() ||
      username ||
      null;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Хэрэглэгчийн нэр болон нууц үг заавал",
      });
    }
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Компанийн нэр заавал",
      });
    }
    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Нууц үг хамгийн багадаа 4 тэмдэгт",
      });
    }

    const existing = await Company.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Хэрэглэгчийн нэр бүртгэлтэй байна",
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const row = await Company.create({
      username,
      password: hashed,
      name,
      contact_name,
      phone,
      email: req.body.email || null,
      province: req.body.province || null,
      description: req.body.description || null,
      status: "active",
      is_active: true,
    });

    const token = signCompanyToken(row);
    const fresh = await Company.findByPk(row.id, { attributes: COMPANY_PUBLIC });

    res.status(201).json({
      success: true,
      message: "Бүртгэл амжилттай. Одоо үйлдвэрүүдээ нэмнэ үү.",
      token,
      company: publicCompany(fresh),
      user: authUser(row),
      plants: [],
    });
  } catch (err) {
    console.error("plant company register:", err);
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

    const company = await Company.findOne({ where: { username } });
    if (!company || !company.password) {
      return res.status(401).json({
        success: false,
        message: "Нэвтрэх нэр эсвэл нууц үг буруу",
      });
    }

    const ok = await bcrypt.compare(password, company.password);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "Нэвтрэх нэр эсвэл нууц үг буруу",
      });
    }

    if (!company.is_active || company.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Бүртгэл идэвхгүй байна",
        company: publicCompany(company),
      });
    }

    const plants = await Plant.findAll({
      where: { company_id: company.id },
      order: [["createdAt", "DESC"]],
      attributes: PLANT_PUBLIC,
    });

    const token = signCompanyToken(company);
    res.json({
      success: true,
      token,
      company: publicCompany(company),
      user: authUser(company),
      plants: plants.map(publicPlant),
    });
  } catch (err) {
    console.error("plant company login:", err);
    res.status(500).json({ success: false, message: err.message || "Алдаа" });
  }
};

exports.me = async (req, res) => {
  try {
    const company = await Company.findByPk(req.company.company_id, {
      attributes: COMPANY_PUBLIC,
    });
    if (!company) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    const plants = await Plant.findAll({
      where: { company_id: company.id },
      order: [["createdAt", "DESC"]],
      attributes: PLANT_PUBLIC,
    });
    res.json({
      success: true,
      company: publicCompany(company),
      user: authUser(company),
      plants: plants.map(publicPlant),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Алдаа" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const company = await Company.findByPk(req.company.company_id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }

    const patch = {};
    if (req.body.name !== undefined || req.body.company_name !== undefined) {
      const name = String(req.body.name || req.body.company_name || "").trim();
      if (!name) {
        return res.status(400).json({ success: false, message: "Нэр заавал" });
      }
      patch.name = name;
    }
    if (req.body.contact_name !== undefined) {
      patch.contact_name = String(req.body.contact_name || "").trim() || null;
    }
    if (req.body.phone !== undefined) {
      patch.phone = String(req.body.phone || "").trim() || null;
    }
    if (req.body.email !== undefined) {
      patch.email = String(req.body.email || "").trim() || null;
    }
    if (req.body.province !== undefined) {
      patch.province = String(req.body.province || "").trim() || null;
    }
    if (req.body.description !== undefined) {
      patch.description = String(req.body.description || "").trim() || null;
    }

    await company.update(patch);
    const fresh = await Company.findByPk(company.id, {
      attributes: COMPANY_PUBLIC,
    });
    res.json({ success: true, company: publicCompany(fresh) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Алдаа" });
  }
};

exports.listPlants = async (req, res) => {
  try {
    const plants = await Plant.findAll({
      where: { company_id: req.company.company_id },
      order: [["createdAt", "DESC"]],
      attributes: PLANT_PUBLIC,
    });
    res.json({ success: true, plants: plants.map(publicPlant) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Алдаа" });
  }
};

exports.createPlant = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const plant_type = String(req.body.plant_type || "other").trim();
    const lat = parseCoord(req.body.latitude, "Өргөрөг");
    const lng = parseCoord(req.body.longitude, "Уртраг");

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Үйлдвэрийн нэр заавал",
      });
    }
    if (lat.error) {
      return res.status(400).json({ success: false, message: lat.error });
    }
    if (lng.error) {
      return res.status(400).json({ success: false, message: lng.error });
    }
    if (!PLANT_TYPES.has(plant_type)) {
      return res.status(400).json({
        success: false,
        message: "Үйлдвэрийн төрөл буруу",
      });
    }

    const row = await Plant.create({
      company_id: req.company.company_id,
      name,
      owner_name: req.body.owner_name || null,
      phone: req.body.phone || null,
      email: req.body.email || null,
      plant_type,
      province: req.body.province || null,
      location: req.body.location || null,
      description: req.body.description || null,
      image: req.body.image || null,
      latitude: lat.value,
      longitude: lng.value,
      status: "pending",
      is_active: false,
      rejection_note: null,
    });

    const fresh = await Plant.findByPk(row.id, { attributes: PLANT_PUBLIC });
    res.status(201).json({
      success: true,
      message: "Үйлдвэр нэмэгдлээ. Админ баталгаажуулах хүртэл хүлээнэ үү.",
      plant: publicPlant(fresh),
    });
  } catch (err) {
    console.error("create plant:", err);
    res.status(500).json({ success: false, message: err.message || "Алдаа" });
  }
};

exports.getPlant = async (req, res) => {
  try {
    const row = await Plant.findOne({
      where: {
        id: req.params.id,
        company_id: req.company.company_id,
      },
      attributes: PLANT_PUBLIC,
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    res.json({ success: true, plant: publicPlant(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Алдаа" });
  }
};

exports.updatePlant = async (req, res) => {
  try {
    const row = await Plant.findOne({
      where: {
        id: req.params.id,
        company_id: req.company.company_id,
      },
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    if (row.status === "rejected" || row.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Засах боломжгүй төлөв",
      });
    }

    const patch = {};
    if (req.body.name !== undefined) {
      const name = String(req.body.name || "").trim();
      if (!name) {
        return res.status(400).json({ success: false, message: "Нэр заавал" });
      }
      patch.name = name;
    }
    if (req.body.owner_name !== undefined) {
      patch.owner_name = String(req.body.owner_name || "").trim() || null;
    }
    if (req.body.phone !== undefined) {
      patch.phone = String(req.body.phone || "").trim() || null;
    }
    if (req.body.email !== undefined) {
      patch.email = String(req.body.email || "").trim() || null;
    }
    if (req.body.plant_type !== undefined) {
      const plant_type = String(req.body.plant_type || "other").trim();
      if (!PLANT_TYPES.has(plant_type)) {
        return res.status(400).json({
          success: false,
          message: "Үйлдвэрийн төрөл буруу",
        });
      }
      patch.plant_type = plant_type;
    }
    if (req.body.province !== undefined) {
      patch.province = String(req.body.province || "").trim() || null;
    }
    if (req.body.location !== undefined) {
      patch.location = String(req.body.location || "").trim() || null;
    }
    if (req.body.description !== undefined) {
      patch.description = String(req.body.description || "").trim() || null;
    }
    if (req.body.image !== undefined) {
      patch.image = req.body.image || null;
    }
    if (req.body.latitude !== undefined) {
      const lat = parseCoord(req.body.latitude, "Өргөрөг");
      if (lat.error) {
        return res.status(400).json({ success: false, message: lat.error });
      }
      patch.latitude = lat.value;
    }
    if (req.body.longitude !== undefined) {
      const lng = parseCoord(req.body.longitude, "Уртраг");
      if (lng.error) {
        return res.status(400).json({ success: false, message: lng.error });
      }
      patch.longitude = lng.value;
    }

    // Edits while pending stay pending; active plants stay active
    await row.update(patch);
    const fresh = await Plant.findByPk(row.id, { attributes: PLANT_PUBLIC });
    res.json({ success: true, plant: publicPlant(fresh) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Алдаа" });
  }
};

exports.deletePlant = async (req, res) => {
  try {
    const row = await Plant.findOne({
      where: {
        id: req.params.id,
        company_id: req.company.company_id,
      },
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Олдсонгүй" });
    }
    if (row.status === "active") {
      return res.status(403).json({
        success: false,
        message: "Баталгаажсан үйлдвэрийг устгах боломжгүй. Админд хандана уу.",
      });
    }
    await row.destroy();
    res.json({ success: true, message: "Устгалаа" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Алдаа" });
  }
};
