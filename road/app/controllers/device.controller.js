const db = require("../models");
const UserDevice = db.user_devices;
const User = db.users;
const {
  registerOrUpdateDevice,
  approveDevice,
  rejectDevice,
  revokeDevice,
  serializeDevice,
  getActiveApprovedDevice,
} = require("../utils/deviceHelper");

exports.register = async (req, res) => {
  try {
    const userId = req.user.id;
    const device = await registerOrUpdateDevice(userId, req.body);
    res.json({ success: true, data: serializeDevice(device) });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.myDevice = async (req, res) => {
  try {
    const deviceId = req.headers["x-device-id"] || req.headers["X-Device-Id"];
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "device_id шаардлагатай" });
    }

    const device = await UserDevice.findOne({
      where: { user_id: req.user.id, device_id: String(deviceId) },
    });

    const active = await getActiveApprovedDevice(req.user.id);

    res.json({
      success: true,
      data: serializeDevice(device),
      active_device: active
        ? {
            id: active.id,
            device_id: active.device_id,
            device_name: active.device_name,
            approved_at: active.approved_at,
          }
        : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { status, user_id, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (user_id) where.user_id = user_id;

    const data = await UserDevice.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "phone", "email", "position"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "username"],
          required: false,
        },
      ],
      order: [
        ["status", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    let rows = data;
    if (search) {
      const q = String(search).toLowerCase();
      rows = data.filter((row) => {
        const user = row.user || {};
        return (
          String(row.device_name || "").toLowerCase().includes(q) ||
          String(row.device_id || "").toLowerCase().includes(q) ||
          String(user.username || "").toLowerCase().includes(q) ||
          String(user.phone || "").toLowerCase().includes(q)
        );
      });
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const adminId = req.user?.id || null;
    const device = await approveDevice(req.params.id, adminId, req.body.review_note);
    const full = await UserDevice.findByPk(device.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "username", "phone"] },
        { model: User, as: "approver", attributes: ["id", "username"], required: false },
      ],
    });
    res.json({ success: true, message: "Төхөөрөмж зөвшөөрөгдлөө", data: full });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.reject = async (req, res) => {
  try {
    const adminId = req.user?.id || null;
    const device = await rejectDevice(req.params.id, adminId, req.body.review_note);
    const full = await UserDevice.findByPk(device.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "username", "phone"] },
        { model: User, as: "approver", attributes: ["id", "username"], required: false },
      ],
    });
    res.json({ success: true, message: "Төхөөрөмж татгалзлаа", data: full });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.revoke = async (req, res) => {
  try {
    const adminId = req.user?.id || null;
    const device = await revokeDevice(req.params.id, adminId, req.body.review_note);
    const full = await UserDevice.findByPk(device.id, {
      include: [
        { model: User, as: "user", attributes: ["id", "username", "phone"] },
        { model: User, as: "approver", attributes: ["id", "username"], required: false },
      ],
    });
    res.json({ success: true, message: "Төхөөрөмжийн эрх цуцлагдлаа", data: full });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
