const jwt = require("jsonwebtoken");
const {
  resolveTenantFromRequest,
  isPlatformHost,
  normalizeHost,
  serializeTenant,
} = require("../utils/tenantHelper");

const secretKey = process.env.JWT_SECRET || "your_secret_key";

/**
 * Resolve current tenant from Host / X-Tenant-Domain.
 * Skips enforcement for platform admin API paths.
 */
async function resolveTenant(req, res, next) {
  try {
    const path = req.path || req.originalUrl || "";
    if (path.startsWith("/api/platform")) {
      req.isPlatformRequest = true;
      return next();
    }

    const host = normalizeHost(
      req.headers["x-tenant-domain"] ||
        req.headers["x-forwarded-host"] ||
        req.headers.host
    );

    if (isPlatformHost(host)) {
      req.isPlatformRequest = true;
      return next();
    }

    const tenant = await resolveTenantFromRequest(req);
    req.tenant = tenant;
    req.tenantId = tenant?.id || null;
    next();
  } catch (err) {
    console.error("resolveTenant error:", err);
    res.status(500).json({ message: "Tenant resolution failed" });
  }
}

/** Require a resolved tenant for tenant-facing APIs */
function requireTenant(req, res, next) {
  if (req.tenant?.id) return next();
  return res.status(404).json({
    message: "Tenant not found for this domain",
    hint: "Register the domain in platform admin (admin.rcos.mn)",
  });
}

function verifyPlatformToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader || req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.type !== "platform") {
      return res.status(403).json({ message: "Platform admin token required" });
    }
    req.platformAdmin = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function signPlatformToken(admin) {
  return jwt.sign(
    {
      type: "platform",
      id: admin.id,
      username: admin.username,
    },
    secretKey,
    { expiresIn: "8h" }
  );
}

function signTenantToken(payload) {
  return jwt.sign(
    {
      type: "tenant",
      id: payload.id,
      username: payload.username,
      role: payload.role,
      role_id: payload.role_id,
      tenant_id: payload.tenant_id,
      is_tenant_superadmin: !!payload.is_tenant_superadmin,
    },
    secretKey,
    { expiresIn: "30m" }
  );
}

/** Long-lived token for Road mobile app (30 days). */
function signMobileToken(payload) {
  return jwt.sign(
    {
      type: "tenant",
      client: "mobile",
      id: payload.id,
      username: payload.username,
      role: payload.role,
      role_id: payload.role_id,
      tenant_id: payload.tenant_id,
      is_tenant_superadmin: !!payload.is_tenant_superadmin,
    },
    secretKey,
    { expiresIn: "30d" }
  );
}

function isMobileAuthRequest(req) {
  const deviceId = req.headers["x-device-id"] || req.headers["X-Device-Id"];
  return Boolean(deviceId && String(deviceId).trim());
}

module.exports = {
  resolveTenant,
  requireTenant,
  verifyPlatformToken,
  signPlatformToken,
  signTenantToken,
  signMobileToken,
  isMobileAuthRequest,
  serializeTenant,
  secretKey,
};
