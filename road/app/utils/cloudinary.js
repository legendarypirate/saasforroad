const cloudinary = require("cloudinary").v2;
const { saveLocalUpload } = require("./localUpload");

function ensureConfigured() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();
  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return true;
}

function isDocumentLike(mimeType, filename = "") {
  const mime = String(mimeType || "").toLowerCase();
  const name = String(filename || "").toLowerCase();
  if (mime === "application/pdf" || /\.pdf$/i.test(name)) return true;
  if (
    mime.includes("spreadsheet") ||
    mime.includes("ms-excel") ||
    mime.includes("wordprocessing") ||
    mime.includes("msword") ||
    mime.includes("presentation") ||
    mime.includes("officedocument") ||
    mime === "application/zip" ||
    mime === "application/x-zip-compressed" ||
    mime === "text/csv" ||
    mime === "application/octet-stream"
  ) {
    return true;
  }
  return /\.(pdf|xlsx?|docx?|pptx?|csv|zip|rar|7z)$/i.test(name);
}

function getResourceType(mimeType, filename = "") {
  const mime = String(mimeType || "").toLowerCase();
  const name = String(filename || "").toLowerCase();

  if (mime.startsWith("image/") && mime !== "application/pdf") return "image";
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name)) return "image";
  if (mime.startsWith("video/") || mime.startsWith("audio/")) return "video";
  if (/\.(mp4|mov|avi|mkv|webm|mp3|wav|ogg|m4a)$/i.test(name)) return "video";
  // PDFs and Office files → raw (most reliable; PDF-as-image needs paid add-on on many plans)
  if (isDocumentLike(mime, name)) return "raw";
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
  if (resourceType === "raw") return `${stem}${ext || ""}`;
  return stem;
}

function uploadBufferToCloudinary(buffer, mimeType, options = {}) {
  if (!ensureConfigured()) {
    return Promise.reject(new Error("Cloudinary тохиргоо дутуу"));
  }
  const originalName = options.original_filename;
  const resourceType =
    options.resource_type || getResourceType(mimeType, originalName);

  const uploadOptions = {
    resource_type: resourceType,
    folder: options.folder || "rd_zam",
    public_id: options.public_id || sanitizePublicId(originalName || "file", resourceType),
  };

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

async function uploadBuffer(buffer, mimeType, options = {}) {
  try {
    return await uploadBufferToCloudinary(buffer, mimeType, options);
  } catch (err) {
    // Retry documents as raw if first attempt used something else
    const originalName = options.original_filename;
    if (
      isDocumentLike(mimeType, originalName) &&
      options.resource_type !== "raw"
    ) {
      try {
        return await uploadBufferToCloudinary(buffer, mimeType, {
          ...options,
          resource_type: "raw",
        });
      } catch {
        // fall through to local
      }
    }
    console.warn(
      "Cloudinary upload failed, using local storage:",
      err?.message || err
    );
    // Build a fake multer-like file for local save
    const fakeFile = {
      buffer,
      size: buffer.length,
      mimetype: mimeType,
      originalname: options.original_filename || "file",
    };
    const folder = String(options.folder || "rd_zam/documents")
      .replace(/^rd_zam\//, "")
      .replace(/^\/+/, "");
    return saveLocalUpload(fakeFile, folder || "documents");
  }
}

/** @deprecated use uploadBuffer */
async function uploadImage(buffer, mimeType, options = {}) {
  return uploadBuffer(buffer, mimeType, { ...options, resource_type: "image" });
}

async function uploadMulterFile(file, folder) {
  if (!file?.buffer) {
    throw new Error("Файл олдсонгүй");
  }

  // Prefer local storage for Office/PDF — avoids Cloudinary PDF add-on / raw quirks
  // that often cause "success" UX races when cloud fails mid-flight.
  // Still try Cloudinary first when configured; fall back to local automatically.
  try {
    return await uploadBuffer(file.buffer, file.mimetype, {
      folder: `rd_zam/${folder}`,
      original_filename: file.originalname,
      resource_type: getResourceType(file.mimetype, file.originalname),
    });
  } catch (err) {
    console.warn("uploadMulterFile cloud failed, local fallback:", err?.message || err);
    return saveLocalUpload(file, folder);
  }
}

module.exports = {
  uploadImage,
  uploadBuffer,
  uploadMulterFile,
  getResourceType,
};
