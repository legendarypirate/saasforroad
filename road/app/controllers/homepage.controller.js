const db = require("../models");
const multer = require("multer");
const { mergeHomepageContent, applyTenantBranding } = require("../utils/homepageDefaults");
const { uploadImage } = require("../utils/cloudinary");

const Homepage = db.homepage_settings;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Зөвхөн зураг файл оруулна уу"));
    }
    cb(null, true);
  },
});

function tenantIdFrom(req) {
  return req.tenant?.id || null;
}

async function getOrCreateRow(tenantId) {
  let row = await Homepage.findOne({
    where: { tenant_id: tenantId },
  });
  if (row) return row;

  // Never steal a global/legacy homepage row for another tenant
  return Homepage.create({
    content: {},
    tenant_id: tenantId,
  });
}

exports.getPublic = async (req, res) => {
  try {
    if (!req.tenant?.id) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found for this domain",
      });
    }

    const row = await Homepage.findOne({
      where: { tenant_id: req.tenant.id },
    });
    const raw =
      typeof row?.content === "string"
        ? JSON.parse(row.content || "{}")
        : row?.content || {};
    let content = mergeHomepageContent(raw);
    content = applyTenantBranding(content, req.tenant, raw);
    res.json({
      success: true,
      data: content,
      tenant: {
        id: req.tenant.id,
        name: req.tenant.name,
        slug: req.tenant.slug,
        domain: req.tenant.domain,
        company_name: req.tenant.company_name,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdmin = async (req, res) => {
  try {
    if (!req.tenant?.id) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found for this domain",
      });
    }
    const row = await getOrCreateRow(req.tenant.id);
    const raw =
      typeof row.content === "string"
        ? JSON.parse(row.content || "{}")
        : row.content;
    const content = mergeHomepageContent(raw);
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    if (!req.tenant?.id) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found for this domain",
      });
    }
    const row = await getOrCreateRow(req.tenant.id);
    const incoming = req.body.content ? JSON.parse(req.body.content) : req.body;
    const previous =
      typeof row.content === "string"
        ? JSON.parse(row.content || "{}")
        : { ...(row.content || {}) };

    // Prefer incoming wholesale for CMS fields so widgets/menus never get dropped
    const merged = mergeHomepageContent({ ...previous, ...incoming });
    if (Array.isArray(incoming.nav_menu)) merged.nav_menu = incoming.nav_menu;
    if (Array.isArray(incoming.custom_pages)) merged.custom_pages = incoming.custom_pages;

    // Sequelize JSON columns often need an explicit change flag
    row.set("content", JSON.parse(JSON.stringify(merged)));
    row.changed("content", true);
    await row.save();

    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadImage = (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.code === "LIMIT_FILE_SIZE" ? "Зураг 8MB-аас их байна" : "Файл upload алдаа",
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Файл upload алдаа",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Зураг файл шаардлагатай",
      });
    }

    try {
      const result = await uploadImage(req.file.buffer, req.file.mimetype, {
        folder: "rd_zam/homepage",
        resource_type: "image",
      });

      res.json({
        success: true,
        data: {
          path: result.secure_url,
          url: result.secure_url,
          public_id: result.public_id,
          filename: result.original_filename,
        },
      });
    } catch (uploadErr) {
      res.status(500).json({
        success: false,
        message:
          uploadErr.message || "Cloudinary руу зураг хадгалахад алдаа гарлаа",
      });
    }
  });
};
