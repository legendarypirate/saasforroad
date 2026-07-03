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

async function uploadImage(buffer, mimeType, options = {}) {
  ensureConfigured();
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, {
    resource_type: "image",
    ...options,
  });
}

module.exports = { uploadImage };
