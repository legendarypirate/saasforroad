const db = require("../models");
const UserDevice = db.user_devices;

async function registerOrUpdateDevice(userId, payload) {
  const { device_id, device_name, platform, model } = payload;

  if (!device_id) {
    const err = new Error("device_id шаардлагатай");
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  let device = await UserDevice.findOne({
    where: { user_id: userId, device_id },
  });

  if (!device) {
    device = await UserDevice.create({
      user_id: userId,
      device_id,
      device_name: device_name || null,
      platform: platform || null,
      model: model || null,
      status: "pending",
      is_active: false,
      last_login_at: now,
      last_seen_at: now,
    });
    return device;
  }

  await device.update({
    device_name: device_name || device.device_name,
    platform: platform || device.platform,
    model: model || device.model,
    last_login_at: now,
    last_seen_at: now,
  });

  return device;
}

async function getActiveApprovedDevice(userId) {
  return UserDevice.findOne({
    where: { user_id: userId, status: "approved", is_active: true },
    order: [["approved_at", "DESC"]],
  });
}

async function approveDevice(deviceRecordId, adminUserId, reviewNote) {
  const device = await UserDevice.findByPk(deviceRecordId);
  if (!device) {
    const err = new Error("Төхөөрөмж олдсонгүй");
    err.statusCode = 404;
    throw err;
  }

  const now = new Date();

  await UserDevice.update(
    { is_active: false },
    { where: { user_id: device.user_id, is_active: true } }
  );

  await device.update({
    status: "approved",
    is_active: true,
    approved_by: adminUserId,
    approved_at: now,
    rejected_at: null,
    review_note: reviewNote || null,
    last_seen_at: now,
  });

  return device;
}

async function rejectDevice(deviceRecordId, adminUserId, reviewNote) {
  const device = await UserDevice.findByPk(deviceRecordId);
  if (!device) {
    const err = new Error("Төхөөрөмж олдсонгүй");
    err.statusCode = 404;
    throw err;
  }

  await device.update({
    status: "rejected",
    is_active: false,
    approved_by: adminUserId,
    rejected_at: new Date(),
    review_note: reviewNote || null,
  });

  return device;
}

async function revokeDevice(deviceRecordId, adminUserId, reviewNote) {
  const device = await UserDevice.findByPk(deviceRecordId);
  if (!device) {
    const err = new Error("Төхөөрөмж олдсонгүй");
    err.statusCode = 404;
    throw err;
  }

  await device.update({
    status: "revoked",
    is_active: false,
    approved_by: adminUserId,
    review_note: reviewNote || device.review_note,
    last_seen_at: new Date(),
  });

  return device;
}

function deviceStatusMessage(device) {
  if (!device) return "Төхөөрөмж бүртгэгдээгүй байна";
  if (device.status === "pending") {
    return "Төхөөрөмж админаас баталгаажуулах хүлээгдэж байна";
  }
  if (device.status === "rejected") {
    return "Энэ төхөөрөмжийг админ татгалзсан байна";
  }
  if (device.status === "revoked") {
    return "Энэ төхөөрөмжийн эрх цуцлагдсан байна";
  }
  if (device.status === "approved" && !device.is_active) {
    return "Өөр төхөөрөмж зөвшөөрөгдсөн тул энэ төхөөрөмж идэвхгүй байна";
  }
  if (device.status === "approved" && device.is_active) {
    return "Төхөөрөмж баталгаажсан";
  }
  return "Төхөөрөмжийн төлөв тодорхойгүй";
}

function canUseMobileFeatures(device) {
  return device && device.status === "approved" && device.is_active === true;
}

function serializeDevice(device) {
  if (!device) return null;
  return {
    id: device.id,
    device_id: device.device_id,
    device_name: device.device_name,
    platform: device.platform,
    model: device.model,
    status: device.status,
    is_active: device.is_active,
    can_access: canUseMobileFeatures(device),
    message: deviceStatusMessage(device),
    approved_at: device.approved_at,
    rejected_at: device.rejected_at,
    last_login_at: device.last_login_at,
  };
}

module.exports = {
  registerOrUpdateDevice,
  getActiveApprovedDevice,
  approveDevice,
  rejectDevice,
  revokeDevice,
  deviceStatusMessage,
  canUseMobileFeatures,
  serializeDevice,
};
