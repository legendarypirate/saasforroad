const jwt = require("jsonwebtoken");
const db = require("../models");
const UserDevice = db.user_devices;
const { canUseMobileFeatures } = require("../utils/deviceHelper");

const secretKey = "your_secret_key";

function extractToken(req) {
  const raw = req.headers["authorization"] || req.headers["Authorization"] || "";
  return raw.startsWith("Bearer ") ? raw.slice(7) : raw;
}

exports.verifyMobileToken = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Нэвтрэх хугацаа дууссан эсвэл буруу байна" });
    }
    req.user = decoded;
    next();
  });
};

exports.requireApprovedDevice = async (req, res, next) => {
  try {
    const deviceId = req.headers["x-device-id"] || req.headers["X-Device-Id"];
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Төхөөрөмжийн мэдээлэл олдсонгүй",
        code: "DEVICE_ID_MISSING",
      });
    }

    const device = await UserDevice.findOne({
      where: { user_id: req.user.id, device_id: String(deviceId) },
    });

    if (!device) {
      return res.status(403).json({
        success: false,
        message: "Энэ төхөөрөмж бүртгэгдээгүй байна. Дахин нэвтэрнэ үү",
        code: "DEVICE_NOT_REGISTERED",
      });
    }

    if (!canUseMobileFeatures(device)) {
      return res.status(403).json({
        success: false,
        message:
          device.status === "pending"
            ? "Төхөөрөмж админаас баталгаажуулах хүлээгдэж байна"
            : device.status === "rejected"
              ? "Энэ төхөөрөмжийг админ татгалзсан байна"
              : "Зөвхөн хамгийн сүүлд зөвшөөрөгдсөн төхөөрөмжөөр ирц бүртгэнэ",
        code: "DEVICE_NOT_APPROVED",
        device: {
          status: device.status,
          is_active: device.is_active,
        },
      });
    }

    await device.update({ last_seen_at: new Date() });
    req.device = device;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Төхөөрөмж шалгахад алдаа гарлаа" });
  }
};

exports.requireSelfUserParam = (req, res, next) => {
  const paramUserId = Number(req.params.userId);
  if (!paramUserId || paramUserId !== Number(req.user.id)) {
    return res.status(403).json({ success: false, message: "Зөвшөөрөлгүй хандалт" });
  }
  next();
};
