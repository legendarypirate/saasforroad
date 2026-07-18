const cloudinary = require("cloudinary").v2;

function ensureConfigured() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary тохиргоо дутуу байна. road/.env файлд CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET нэмнэ үү."
    );
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

function getResourceType(mimeType, filename = "") {
  const mime = String(mimeType || "").toLowerCase();
  const name = String(filename || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "video";
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name)) return "image";
  return "raw";
}

function sanitizePublicId(filename) {
  const raw = String(filename || "file");
  const extMatch = raw.match(/(\.[a-z0-9]{1,12})$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "";
  const base = raw
    .replace(/\.[^/.]+$/, "")
    .replace(/[^\w\u0400-\u04FF-]+/g, "_")
    .slice(0, 80);
  // Keep extension on public_id so raw downloads (xlsx/docx/…) deliver correctly.
  return `${base || "file"}_${Date.now()}${ext}`;
}

async function uploadBuffer(buffer, mimeType, options = {}) {
  ensureConfigured();
  const resourceType = options.resource_type || getResourceType(mimeType, options.original_filename);

  const uploadOptions = {
    resource_type: resourceType,
    folder: options.folder || "rd_zam",
    ...options,
  };
  delete uploadOptions.original_filename;

  if (!uploadOptions.public_id && options.original_filename) {
    uploadOptions.public_id = sanitizePublicId(options.original_filename);
  }

  // Stream upload avoids data-URI size limits that often break Office/raw files.
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

/** @deprecated use uploadBuffer */
async function uploadImage(buffer, mimeType, options = {}) {
  return uploadBuffer(buffer, mimeType, { ...options, resource_type: "image" });
}

async function uploadMulterFile(file, folder) {
  if (!file?.buffer) {
    throw new Error("Файл олдсонгүй");
  }
  return uploadBuffer(file.buffer, file.mimetype, {
    folder: `rd_zam/${folder}`,
    original_filename: file.originalname,
  });
}

module.exports = {
  uploadImage,
  uploadBuffer,
  uploadMulterFile,
  getResourceType,
};
