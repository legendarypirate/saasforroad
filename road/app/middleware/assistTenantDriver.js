const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");
const { resolveUserRole } = require("../utils/roleHelper");
const { secretKey } = require("../middleware/tenant");

const Driver = db.road_drivers;

/** Permission required for tenant mobile users to request roadside assist. */
const ASSIST_CALL_PERMISSION = "assist.call:create";

function hasAssistCallPermission(permissions = []) {
  if (!Array.isArray(permissions)) return false;
  if (permissions.includes("*")) return true;
  if (permissions.includes(ASSIST_CALL_PERMISSION)) return true;
  if (permissions.includes("assist:*") || permissions.includes("assist:module")) {
    return true;
  }
  return false;
}

function signLinkedDriverToken(driver) {
  return jwt.sign(
    {
      type: "road_driver",
      driver_id: driver.id,
      username: driver.username,
      tenant_user_id: driver.tenant_user_id || null,
      source: "tenant_link",
    },
    secretKey,
    { expiresIn: "30d" }
  );
}

/**
 * Find or create a road_drivers row linked to a tenant mobile user.
 * Reuses existing assist dispatcher / WS which key off driver_id.
 */
async function ensureLinkedRoadDriver(user) {
  const userId = Number(user.id);
  const tenantId = Number(user.tenant_id);
  if (!userId || !tenantId) {
    throw new Error("invalid_tenant_user");
  }

  let row = await Driver.findOne({
    where: { tenant_user_id: userId, tenant_id: tenantId },
  });
  if (row) return row;

  const dbUser = await db.users.findByPk(userId, {
    attributes: ["id", "username", "phone", "tenant_id"],
  });
  if (!dbUser || Number(dbUser.tenant_id) !== tenantId) {
    throw new Error("user_not_found");
  }

  const username = `tenant_${tenantId}_u${userId}`;
  const existingByUsername = await Driver.findOne({ where: { username } });
  if (existingByUsername) {
    existingByUsername.tenant_user_id = userId;
    existingByUsername.tenant_id = tenantId;
    if (!existingByUsername.phone && dbUser.phone) {
      existingByUsername.phone = dbUser.phone;
    }
    await existingByUsername.save();
    return existingByUsername;
  }

  const fullName =
    String(dbUser.username || `User ${userId}`).trim() || `User ${userId}`;
  const randomPass = await bcrypt.hash(
    `tenant-link-${tenantId}-${userId}-${Date.now()}`,
    10
  );

  return Driver.create({
    username,
    password: randomPass,
    full_name: fullName,
    phone: dbUser.phone || null,
    tenant_user_id: userId,
    tenant_id: tenantId,
    is_active: true,
    status: "active",
  });
}

/**
 * Mobile JWT + assist.call:create → req.driverAuth (same shape as freelancer).
 */
async function requireTenantAssistDriver(req, res, next) {
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ success: false, message: "Нэвтрэх шаардлагатай" });
    }

    const dbUser = await db.users.findByPk(req.user.id);
    if (!dbUser) {
      return res.status(401).json({ success: false, message: "Хэрэглэгч олдсонгүй" });
    }

    const roleInfo = await resolveUserRole(dbUser);
    if (!hasAssistCallPermission(roleInfo.permissions)) {
      return res.status(403).json({
        success: false,
        message: "Тусламж дуудах эрхгүй (жолоочийн эрх шаардлагатай)",
        code: "ASSIST_PERMISSION_REQUIRED",
      });
    }

    const driver = await ensureLinkedRoadDriver({
      id: dbUser.id,
      tenant_id: dbUser.tenant_id || req.user.tenant_id,
    });

    req.driverAuth = {
      type: "road_driver",
      driver_id: driver.id,
      username: driver.username,
      tenant_user_id: dbUser.id,
      tenant_id: dbUser.tenant_id,
    };
    req.assistDriver = driver;
    req.assistPermissions = roleInfo.permissions;
    next();
  } catch (e) {
    console.error("requireTenantAssistDriver:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Тусламжийн эрх шалгахад алдаа",
    });
  }
}

exports.ASSIST_CALL_PERMISSION = ASSIST_CALL_PERMISSION;
exports.hasAssistCallPermission = hasAssistCallPermission;
exports.ensureLinkedRoadDriver = ensureLinkedRoadDriver;
exports.signLinkedDriverToken = signLinkedDriverToken;
exports.requireTenantAssistDriver = requireTenantAssistDriver;
