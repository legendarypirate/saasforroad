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

/**
 * Cloudinary types:
 * - PDF → image (Cloudinary native; transformations work)
 * - office/zip/etc → raw (extension must stay on public_id)
 * - images/videos as usual
 */
function getResourceType(mimeType, filename = "") {
  const mime = String(mimeType || "").toLowerCase();
  const name = String(filename || "").toLowerCase();

  if (mime === "application/pdf" || /\.pdf$/i.test(name)) return "image";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "video";
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name)) return "image";
  if (/\.(mp4|mov|avi|mkv|webm|mp3|wav|ogg|m4a)$/i.test(name)) return "video";
  return "raw";
}

function sanitizePublicId(filename, resourceType = "raw") {
  const raw = String(filename || "file");
  const extMatch = raw.match(/(\.[a-z0-9]{1,12})$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "";
  const base = raw
    .replace(/\.[^/.]+$/, "")
    .replace(/[^\w\u0400-\u04FF-]+/g, "_")
    .slice(0, 80);
  const stem = `${base || "file"}_${Date.now()}`;
  // Raw assets need the extension in public_id; image/video must not include it.
  if (resourceType === "raw") return `${stem}${ext || ""}`;
  return stem;
}

async function uploadBuffer(buffer, mimeType, options = {}) {
  ensureConfigured();
  const originalName = options.original_filename;
  const resourceType =
    options.resource_type || getResourceType(mimeType, originalName);

  const uploadOptions = {
    resource_type: resourceType,
    folder: options.folder || "rd_zam",
  };

  if (options.public_id) {
    uploadOptions.public_id = options.public_id;
  } else if (originalName) {
    uploadOptions.public_id = sanitizePublicId(originalName, resourceType);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary URL буцаасангүй"));
        }
        resolve(result);
      }
    );
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
