const multer = require("multer");

/**
 * Multer/busboy often decodes non-ASCII multipart filenames as latin1.
 * Re-interpret as UTF-8 when the round-trip matches (classic Cyrillic fix).
 */
function decodeUploadFilename(name) {
  if (!name || typeof name !== "string") return name;
  try {
    const decoded = Buffer.from(name, "latin1").toString("utf8");
    // Only accept if it looks like a successful UTF-8 recovery (contains non-ASCII
    // that isn't the replacement char) or round-trips cleanly.
    if (decoded && !decoded.includes("\uFFFD")) {
      const looksBrokenLatin1 = /[\u00C0-\u00FF]{2,}/.test(name);
      const hasCyrillicOrUnicode = /[^\u0000-\u007f]/.test(decoded);
      if (looksBrokenLatin1 || hasCyrillicOrUnicode) {
        return decoded;
      }
    }
  } catch {
    // keep original
  }
  return name;
}

function fixMulterFile(file) {
  if (!file) return file;
  if (file.originalname) {
    file.originalname = decodeUploadFilename(file.originalname);
  }
  return file;
}

function memoryUpload(options = {}) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: options.maxSize || 50 * 1024 * 1024 },
    fileFilter: options.fileFilter,
  });
}

module.exports = { memoryUpload, decodeUploadFilename, fixMulterFile };
