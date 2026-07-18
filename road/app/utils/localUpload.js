const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_ROOT = path.join(__dirname, "../../uploads");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeExt(originalName) {
  const ext = path.extname(String(originalName || "")).toLowerCase();
  if (!ext || ext.length > 12) return "";
  if (!/^\.[a-z0-9.]+$/i.test(ext)) return "";
  return ext;
}

/**
 * Save multer memory file to disk. Returns a relative URL path under /assets/...
 * so existing resolveAssetUrl() works.
 */
function saveLocalUpload(file, folder = "documents") {
  if (!file?.buffer) {
    throw new Error("Файл олдсонгүй");
  }
  const dir = path.join(UPLOAD_ROOT, folder);
  ensureDir(dir);
  const filename = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}${safeExt(
    file.originalname
  )}`;
  const fullPath = path.join(dir, filename);
  fs.writeFileSync(fullPath, file.buffer);
  return {
    secure_url: `/assets/${folder}/${filename}`,
    public_id: `${folder}/${filename}`,
    bytes: file.size,
    resource_type: "local",
  };
}

function resolveLocalPath(relativeUrl) {
  // "/assets/documents/xyz.pdf" → uploads/documents/xyz.pdf
  const cleaned = String(relativeUrl || "")
    .replace(/^\/assets\//, "")
    .replace(/^assets\//, "");
  if (!cleaned || cleaned.includes("..")) return null;
  const full = path.join(UPLOAD_ROOT, cleaned);
  if (!full.startsWith(UPLOAD_ROOT)) return null;
  if (!fs.existsSync(full)) return null;
  return full;
}

module.exports = {
  UPLOAD_ROOT,
  saveLocalUpload,
  resolveLocalPath,
};
