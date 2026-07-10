const { memoryUpload } = require("./multerMemory");
const { uploadMulterFile } = require("./cloudinary");

function imageUpload(fieldName = "image") {
  return memoryUpload({
    fileFilter: (_req, file, cb) => {
      const ok = file.mimetype?.startsWith("image/");
      cb(ok ? null : new Error("Зөвхөн зураг файл хүлээн авна"), ok);
    },
  }).single(fieldName);
}

function fileUpload(fieldName = "file") {
  return memoryUpload().single(fieldName);
}

async function cloudinaryUrl(file, folder) {
  const result = await uploadMulterFile(file, folder);
  return result.secure_url;
}

module.exports = { imageUpload, fileUpload, cloudinaryUrl };
