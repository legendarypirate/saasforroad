const multer = require("multer");

function memoryUpload(options = {}) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: options.maxSize || 15 * 1024 * 1024 },
    fileFilter: options.fileFilter,
  });
}

module.exports = { memoryUpload };
