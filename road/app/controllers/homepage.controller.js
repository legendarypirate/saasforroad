const db = require("../models");
const multer = require("multer");
const path = require("path");
const { mergeHomepageContent } = require("../utils/homepageDefaults");

const Homepage = db.homepage_settings;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "app/assets"),
  filename: (_req, file, cb) => {
    cb(null, `homepage-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

async function getOrCreateRow() {
  let row = await Homepage.findOne();
  if (!row) {
    row = await Homepage.create({ content: {} });
  }
  return row;
}

exports.getPublic = async (_req, res) => {
  try {
    const row = await Homepage.findOne();
    const content = mergeHomepageContent(row?.content);
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAdmin = async (_req, res) => {
  try {
    const row = await getOrCreateRow();
    const content = mergeHomepageContent(row.content);
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await getOrCreateRow();
    const incoming = req.body.content ? JSON.parse(req.body.content) : req.body;
    const merged = mergeHomepageContent({ ...row.content, ...incoming });
    await row.update({ content: merged });
    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadImage = (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }
    res.json({
      success: true,
      data: {
        path: `/assets/${req.file.filename}`,
        filename: req.file.filename,
      },
    });
  });
};
