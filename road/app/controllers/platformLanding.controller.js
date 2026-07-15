const multer = require("multer");
const db = require("../models");
const {
  mergePlatformLandingContent,
} = require("../utils/platformLandingDefaults");
const { uploadImage } = require("../utils/cloudinary");

const Landing = db.platform_landing_settings;

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

async function getOrCreateRow() {
  let row = await Landing.findOne({ order: [["id", "ASC"]] });
  if (row) return row;
  return Landing.create({ content: {} });
}

function parseContent(row) {
  const raw =
    typeof row?.content === "string"
      ? JSON.parse(row.content || "{}")
      : row?.content;
  return mergePlatformLandingContent(raw);
}

exports.getPublic = async (_req, res) => {
  try {
    const row = await getOrCreateRow();
    const content = parseContent(row);
    res.json({ success: true, data: content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdmin = async (_req, res) => {
  try {
    const row = await getOrCreateRow();
    const content = parseContent(row);
    res.json({ success: true, data: content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await getOrCreateRow();
    const incoming = req.body.content ? req.body.content : req.body;
    const parsed =
      typeof incoming === "string" ? JSON.parse(incoming || "{}") : incoming || {};
    const previous =
      typeof row.content === "string"
        ? JSON.parse(row.content || "{}")
        : { ...(row.content || {}) };

    const merged = mergePlatformLandingContent({ ...previous, ...parsed });
    // Honour explicit arrays from admin (including empties / reorders)
    if (Array.isArray(parsed.stats)) merged.stats = parsed.stats;
    if (Array.isArray(parsed.modules)) merged.modules = parsed.modules;
    if (Array.isArray(parsed.data_items)) merged.data_items = parsed.data_items;
    if (Array.isArray(parsed.steps)) merged.steps = parsed.steps;
    if (Array.isArray(parsed.hero_images)) {
      merged.hero_images = parsed.hero_images
        .map((u) => String(u || "").trim())
        .filter(Boolean)
        .slice(0, 3);
      merged.hero_image = merged.hero_images[0] || "";
    }

    const finalContent = mergePlatformLandingContent(merged);
    row.set("content", JSON.parse(JSON.stringify(finalContent)));
    row.changed("content", true);
    await row.save();

    res.json({ success: true, data: finalContent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadImage = (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Зураг 8MB-аас их байна"
            : "Файл upload алдаа",
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
        folder: "rd_zam/platform-landing",
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
