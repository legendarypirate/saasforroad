const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Using bcryptjs for hashing and comparing passwords
const db = require("../models");
const User = db.users;
const { resolveUserRole } = require("../utils/roleHelper");
const { registerOrUpdateDevice, serializeDevice } = require("../utils/deviceHelper");
const { signTenantToken, signMobileToken, isMobileAuthRequest } = require("../middleware/tenant");
const { serializeTenant, normalizeModules } = require("../utils/tenantHelper");
const { MODULE_CATALOG } = require("../utils/moduleCatalog");
const secretKey = process.env.JWT_SECRET || "your_secret_key";
const MOBILE_TOKEN_SECONDS = 30 * 24 * 60 * 60;

function normalizePhone(phone) {
  if (!phone) return "";
  let value = String(phone).trim().replace(/\s+/g, "");
  if (value.startsWith("+976")) value = value.slice(4);
  else if (value.startsWith("976") && value.length > 8) value = value.slice(3);
  return value;
}

function phoneLookupCandidates(phone) {
  const normalized = normalizePhone(phone);
  const raw = String(phone || "").trim();
  const candidates = [normalized, raw];

  if (normalized) {
    candidates.push(`+976${normalized}`, `976${normalized}`);
  }

  return [...new Set(candidates.filter(Boolean))];
}

function tenantWhere(tenantId) {
  if (!tenantId) return {};
  return { tenant_id: tenantId };
}

async function findUserByPhone(phone, tenantId) {
  for (const candidate of phoneLookupCandidates(phone)) {
    const user = await User.findOne({
      where: { phone: candidate, ...tenantWhere(tenantId) },
    });
    if (user) return user;
  }
  return null;
}

async function findUserByUsernameOrPhone(loginId, tenantId) {
  const identifier = String(loginId || "").trim();
  if (!identifier) return null;

  const byUsername = await User.findOne({
    where: { username: identifier, ...tenantWhere(tenantId) },
  });
  if (byUsername) return byUsername;

  return findUserByPhone(identifier, tenantId);
}

/** Drop permission keys for modules the platform admin disabled on this tenant. */
function filterPermissionsByTenantModules(permissions, tenant) {
  if (!tenant || !Array.isArray(permissions)) return permissions || [];
  const enabled = new Set(normalizeModules(tenant.modules));
  const enabledKeys = new Set(
    MODULE_CATALOG.filter((m) => enabled.has(m.id)).map((m) => m.key)
  );

  // If all modules enabled, keep everything
  if (enabled.size >= MODULE_CATALOG.length) return permissions;

  const prefixes = new Set();
  for (const m of MODULE_CATALOG) {
    if (!enabled.has(m.id)) continue;
    const base = m.key.replace(/:module$/, "");
    prefixes.add(base);
  }

  return permissions.filter((key) => {
    if (enabledKeys.has(key)) return true;
    const base = String(key).split(":")[0].split(".")[0];
    if (prefixes.has(base)) return true;
    // Always keep core auth / admin dashboard keys
    if (key.startsWith("admin:") || key.startsWith("user:") || key.startsWith("role:") || key.startsWith("system")) {
      return true;
    }
    // Keep if any enabled module key prefix matches
    for (const p of prefixes) {
      if (key === `${p}:module` || key.startsWith(`${p}:`) || key.startsWith(`${p}.`)) {
        return true;
      }
    }
    return false;
  });
}

function buildAuthUserPayload(user, roleInfo, tenant) {
  const permissions = filterPermissionsByTenantModules(
    roleInfo.permissions,
    tenant
  );
  return {
    id: user.id,
    username: user.username,
    role: roleInfo.role,
    role_id: roleInfo.role_id,
    permissions,
    ui_preferences: user.ui_preferences || {},
    tenant_id: user.tenant_id || tenant?.id || null,
    is_tenant_superadmin: !!user.is_tenant_superadmin,
    tenant: tenant ? serializeTenant(tenant) : null,
  };
}

// Register a new company user (brigade accounts use POST /api/brigada/auth/register)
exports.register = async (req, res) => {
  const { username, password, role, phone, affiliation } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required!" });
  }

  const isBrigada =
    affiliation === "brigada" ||
    role === "brigada" ||
    String(req.body.account_type || "").toLowerCase() === "brigada";

  if (isBrigada) {
    return res.status(400).json({
      success: false,
      message: "Бригад бүртгэл /api/brigada/auth/register энд хийнэ. Компаны хэрэглэгч биш.",
    });
  }

  try {
    const tenantId = req.tenant?.id || null;
    // Check if user already exists in this tenant
    const existingUser = await User.findOne({
      where: { username, ...tenantWhere(tenantId) },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash the password using bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: role || "user",
      phone: phone || null,
      affiliation: affiliation || null,
      tenant_id: tenantId,
    });

    const token = signTenantToken({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      role_id: newUser.role_id,
      tenant_id: newUser.tenant_id,
      is_tenant_superadmin: false,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        affiliation: newUser.affiliation,
        tenant_id: newUser.tenant_id,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login user
exports.login = async (req, res) => {
  const { username, phone, password } = req.body;
  const loginId = username || phone;

  if (!loginId || !password) {
    return res.status(400).json({ message: "Username/phone and password are required!" });
  }

  try {
    if (!req.tenant?.id) {
      return res.status(404).json({
        message: "Tenant not found for this domain. Contact platform admin.",
      });
    }

    const user = await findUserByUsernameOrPhone(loginId, req.tenant.id);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    if (user.is_active === '0' || user.is_active === 0 || user.is_active === false || user.is_active === 'false') {
      return res.status(403).json({ message: "Энэ хэрэглэгч идэвхгүй байна" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const roleInfo = await resolveUserRole(user);
    const token = signTenantToken({
      id: user.id,
      username: user.username,
      role: roleInfo.role,
      role_id: roleInfo.role_id,
      tenant_id: user.tenant_id,
      is_tenant_superadmin: user.is_tenant_superadmin,
    });

    res.json({
      success: true,
      token,
      expiresIn: 30 * 60,
      user: buildAuthUserPayload(user, roleInfo, req.tenant),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.mobile_login = async (req, res) => {
  const { phone, password, device_id, device_name, platform, model } = req.body;
  const resolvedDeviceId =
    device_id || req.headers["x-device-id"] || req.headers["X-Device-Id"];

  if (!phone || !password) {
    return res.status(400).json({ message: "phone and password are required!" });
  }

  // Shared API (api.rcos.mn) requires X-Tenant-Domain — same as web login.
  if (!req.tenant?.id) {
    return res.status(404).json({
      message: "Tenant not found",
      hint: "Send X-Tenant-Domain header with the tenant domain from admin.rcos.mn",
    });
  }

  try {
    const tenantId = req.tenant.id;
    const user = await findUserByPhone(phone, tenantId);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    if (user.is_active === '0' || user.is_active === 0 || user.is_active === false || user.is_active === 'false') {
      return res.status(403).json({ message: "Энэ хэрэглэгч идэвхгүй байна" });
    }

    const roleInfo = await resolveUserRole(user);
    if (!roleInfo.mobile_access) {
      return res.status(401).json({ message: "Энэ хэрэглэгч апп ашиглах эрхгүй" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    let device = null;
    if (resolvedDeviceId) {
      device = await registerOrUpdateDevice(user.id, {
        device_id: resolvedDeviceId,
        device_name,
        platform,
        model,
      });
    }

    const token = signMobileToken({
      id: user.id,
      username: user.username,
      role: roleInfo.role,
      role_id: roleInfo.role_id,
      tenant_id: user.tenant_id,
      is_tenant_superadmin: user.is_tenant_superadmin,
    });

    res.json({
      success: true,
      token,
      expiresIn: MOBILE_TOKEN_SECONDS,
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        role: roleInfo.role,
        role_id: roleInfo.role_id,
        tenant_id: user.tenant_id,
      },
      device: serializeDevice(device),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Verify the JWT token
exports.verifyToken = (req, res, next) => {
  const raw = req.headers["authorization"] || req.headers["Authorization"] || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

  if (!token) {
    return res.status(401).json({ message: "Token is missing!" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token is invalid!" });
    }
    req.user = decoded;
    next();
  });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (req.tenant?.id && user.tenant_id && user.tenant_id !== req.tenant.id) {
      return res.status(403).json({ success: false, message: "User does not belong to this tenant" });
    }
    const roleInfo = await resolveUserRole(user);
    const tenant =
      req.tenant ||
      (user.tenant_id ? await db.tenants.findByPk(user.tenant_id) : null);
    res.json({
      success: true,
      user: buildAuthUserPayload(user, roleInfo, tenant),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** Merge/update current user's UI preferences (folder order, etc.). */
exports.updatePreferences = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const current =
      user.ui_preferences && typeof user.ui_preferences === "object"
        ? { ...user.ui_preferences }
        : {};
    const incoming =
      req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};

    if (incoming.folderOrder && typeof incoming.folderOrder === "object") {
      const prev =
        current.folderOrder && typeof current.folderOrder === "object"
          ? current.folderOrder
          : {};
      current.folderOrder = {
        ...prev,
        ...incoming.folderOrder,
      };
    }

    // Allow other top-level preference keys later
    for (const [key, value] of Object.entries(incoming)) {
      if (key === "folderOrder") continue;
      current[key] = value;
    }

    await user.update({ ui_preferences: current });
    res.json({ success: true, ui_preferences: current });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** Issue a fresh JWT — 30 days for mobile (X-Device-Id), 30m for web admin. */
exports.refresh = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const roleInfo = await resolveUserRole(user);
    const payload = {
      id: user.id,
      username: user.username,
      role: roleInfo.role,
      role_id: roleInfo.role_id,
      tenant_id: user.tenant_id,
      is_tenant_superadmin: user.is_tenant_superadmin,
    };
    const mobile = isMobileAuthRequest(req) || req.user?.client === "mobile";
    const token = mobile ? signMobileToken(payload) : signTenantToken(payload);
    res.json({
      success: true,
      token,
      expiresIn: mobile ? MOBILE_TOKEN_SECONDS : 30 * 60,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** Mobile logout — acknowledge sign-out (JWT cleared client-side). */
exports.mobile_logout = async (req, res) => {
  try {
    const deviceId =
      req.headers["x-device-id"] ||
      req.headers["X-Device-Id"] ||
      req.body?.device_id;
    if (deviceId && req.user?.id) {
      const device = await db.user_devices.findOne({
        where: {
          user_id: req.user.id,
          device_id: String(deviceId).trim(),
        },
      });
      if (device) {
        await device.update({ last_seen_at: new Date() });
      }
    }
    res.json({ success: true, message: "Signed out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.mobile_register = async (req, res) => {
  const { username, email, phone } = req.body;
  console.log(req.body);

  if (!username || !email || !phone) {
    return res.status(400).json({ message: "Username, email, and phone are required!" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Generate a 4-digit OTP
    const randomOTP = Math.floor(1000 + Math.random() * 9000);

    // Create user with OTP
    const newUser = await User.create({
      username,
      email,
      phone,
      otp: randomOTP,
      role: "user" // Setting role as "user"

    });

    console.log("Inserted user:", newUser.toJSON());

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, phone: newUser.phone },
      secretKey,
      { expiresIn: "30m" }
    );

    // Send OTP via SMS
    const smsUrl = `https://api.messagepro.mn/send?from=72278880&to=${phone}&text=Tanii neg udaagiin nuuts code ${randomOTP}`;
    
    const headers = {
      "x-api-key": "d1856eb0c137cb4dc7e43dc2efdfd43a", // Your API key
      "Content-Type": "application/json",
    };

    try {
      const smsResponse = await axios.get(smsUrl, { headers });
      console.log("SMS API Response:", smsResponse.data);
    } catch (smsError) {
      console.error(
        "Error sending SMS:",
        smsError.response ? smsError.response.data : smsError.message
      );
    }

    // Respond to the client
    res.status(201).json({
      success: true,
      message: "User registered successfully! OTP sent via SMS.",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        phone: newUser.phone,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.forgot_pass = async (req, res) => {
  const { phone } = req.body;
  console.log(req.body);

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required!" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ message: "User not found with this phone number!" });
    }

    // Generate a 4-digit OTP
    const randomOTP = Math.floor(1000 + Math.random() * 9000);

    // Update the user's OTP
    user.otp = randomOTP;
    await user.save();

    console.log("Updated user OTP:", user.toJSON());

    // Send OTP via SMS
    const smsUrl = `https://api.messagepro.mn/send?from=72278880&to=${phone}&text=Tanii neg udaagiin nuuts code ${randomOTP}`;
    
    const headers = {
      "x-api-key": "d1856eb0c137cb4dc7e43dc2efdfd43a",
      "Content-Type": "application/json",
    };

    try {
      const smsResponse = await axios.get(smsUrl, { headers });
      console.log("SMS API Response:", smsResponse.data);
    } catch (smsError) {
      console.error(
        "Error sending SMS:",
        smsError.response ? smsError.response.data : smsError.message
      );
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully via SMS.",
      phone: user.phone
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.verifyOtp = async (req, res) => {
  const { id, otp } = req.body;

  if (!id || !otp) {
    return res.status(400).json({ message: "User ID and OTP are required!" });
  }

  try {
    // Find user by ID
    const user = await User.findOne({ where: { id: id } });
    
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP!" });
    }

    // Update user as verified
    await User.update({ otp: null, phone_verified: true }, { where: { id: id } });

    res.json({ success: true, message: "Phone verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyOtpForgot = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "User phone and OTP are required!" });
  }

  try {
    // Find user by phone
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Check if OTP matches
    if (user.otp != otp) {
      return res.status(400).json({ message: "Invalid OTP!" });
    }

    // Update user: clear OTP and mark phone as verified
    await User.update(
      { otp: null, phone_verified: true },
      { where: { phone } }
    );

    res.json({
      success: true,
      message: "Phone verified successfully!",
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};



exports.updateInfo = async (req, res) => {
  try {
    const { id, password, school, gender } = req.body;

    // Validate required fields
    if (!id || !gender) {
      return res.status(400).json({ message: "User ID and gender are required!" });
    }

    // Find user by ID
    const user = await User.findOne({ where: { id: id } });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Prepare data for update
    const updatedData = { school, gender };

    // If a new password is provided, hash it before saving
    if (password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updatedData.password = hashedPassword;
    }

    // Update user information
    await User.update(updatedData, { where: { id: id } });

    res.json({ success: true, message: "User info updated successfully!" });
  } catch (err) {
    console.error("Error updating user info:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateForgotPass = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate required fields
    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password are required!" });
    }

    // Find user by phone
    const user = await User.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the user's password
    await User.update(
      { password: hashedPassword },
      { where: { phone } }
    );

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
