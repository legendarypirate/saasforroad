const bcrypt = require("bcryptjs");
const db = require("../models");
const { Op } = require("sequelize");
const { signPlatformToken } = require("../middleware/tenant");
const { serializeTenant, normalizeModules } = require("../utils/tenantHelper");
const { MODULE_CATALOG, allModuleIds } = require("../utils/moduleCatalog");
const {
  bootstrapTenant,
  upsertTenantSuperadmin,
  seedRolesForTenant,
} = require("../utils/tenantBootstrap");

function publicAdmin(admin) {
  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    email: admin.email,
  };
}

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  try {
    const admin = await db.platform_admins.findOne({ where: { username } });
    if (!admin || !admin.is_active) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signPlatformToken(admin);
    res.json({
      success: true,
      token,
      admin: publicAdmin(admin),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.me = async (req, res) => {
  try {
    const admin = await db.platform_admins.findByPk(req.platformAdmin.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json({ success: true, admin: publicAdmin(admin) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.listModules = async (_req, res) => {
  res.json({
    success: true,
    modules: MODULE_CATALOG,
    allIds: allModuleIds(),
  });
};

exports.listTenants = async (_req, res) => {
  try {
    const tenants = await db.tenants.findAll({ order: [["id", "ASC"]] });
    const withMeta = await Promise.all(
      tenants.map(async (t) => {
        const userCount = await db.users.count({ where: { tenant_id: t.id } });
        const superadmin = await db.users.findOne({
          where: { tenant_id: t.id, is_tenant_superadmin: true },
          attributes: ["id", "username", "email", "phone", "position"],
        });
        return {
          ...serializeTenant(t),
          user_count: userCount,
          superadmin: superadmin
            ? {
                id: superadmin.id,
                username: superadmin.username,
                email: superadmin.email,
                phone: superadmin.phone,
                name: superadmin.position,
              }
            : null,
        };
      })
    );
    res.json({ success: true, tenants: withMeta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTenant = async (req, res) => {
  try {
    const tenant = await db.tenants.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const superadmin = await db.users.findOne({
      where: { tenant_id: tenant.id, is_tenant_superadmin: true },
      attributes: ["id", "username", "email", "phone", "position", "is_active"],
    });
    const userCount = await db.users.count({ where: { tenant_id: tenant.id } });
    const roleCount = await db.roles.count({ where: { tenant_id: tenant.id } });

    res.json({
      success: true,
      tenant: {
        ...serializeTenant(tenant),
        user_count: userCount,
        role_count: roleCount,
        superadmin: superadmin
          ? {
              id: superadmin.id,
              username: superadmin.username,
              email: superadmin.email,
              phone: superadmin.phone,
              name: superadmin.position,
              is_active: superadmin.is_active,
            }
          : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createTenant = async (req, res) => {
  try {
    const { superadmin, ...tenantData } = req.body;
    if (tenantData.modules) {
      tenantData.modules = normalizeModules(tenantData.modules);
    }

    const { tenant, adminUser } = await bootstrapTenant(tenantData, {
      superadmin,
    });

    res.status(201).json({
      success: true,
      tenant: serializeTenant(tenant),
      superadmin: adminUser
        ? {
            id: adminUser.id,
            username: adminUser.username,
            email: adminUser.email,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    const msg = err.message || "Failed to create tenant";
    const status =
      msg.includes("unique") || msg.includes("already") || msg.includes("required")
        ? 400
        : 500;
    res.status(status).json({ message: msg });
  }
};

exports.updateTenant = async (req, res) => {
  try {
    const tenant = await db.tenants.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const allowed = [
      "name",
      "domain",
      "domains",
      "company_name",
      "contact_email",
      "contact_phone",
      "notes",
      "is_active",
      "modules",
      "settings",
    ];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (patch.domain) {
      patch.domain = String(patch.domain).trim().toLowerCase().replace(/^www\./, "");
    }
    if (patch.modules) {
      patch.modules = normalizeModules(patch.modules);
    }

    await tenant.update(patch);
    res.json({ success: true, tenant: serializeTenant(tenant) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

exports.updateTenantModules = async (req, res) => {
  try {
    const tenant = await db.tenants.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    const modules = normalizeModules(req.body.modules || []);
    await tenant.update({ modules });
    res.json({ success: true, tenant: serializeTenant(tenant) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.setSuperadmin = async (req, res) => {
  try {
    const tenant = await db.tenants.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    await seedRolesForTenant(tenant.id);
    const user = await upsertTenantSuperadmin(tenant.id, req.body);

    res.json({
      success: true,
      superadmin: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        name: user.position,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || "Failed to set superadmin" });
  }
};

exports.listTenantRoles = async (req, res) => {
  try {
    const tenantId = Number(req.params.id);
    const roles = await db.roles.findAll({
      where: { tenant_id: tenantId },
      include: [
        {
          model: db.permissions,
          as: "permissions",
          through: { attributes: [] },
        },
      ],
      order: [["id", "ASC"]],
    });

    res.json({
      success: true,
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        mobile_access: r.mobile_access,
        permission_keys: (r.permissions || []).map((p) => p.key),
        permission_ids: (r.permissions || []).map((p) => p.id),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateTenantRolePermissions = async (req, res) => {
  try {
    const tenantId = Number(req.params.id);
    const roleId = Number(req.params.roleId);
    const role = await db.roles.findOne({
      where: { id: roleId, tenant_id: tenantId },
    });
    if (!role) return res.status(404).json({ message: "Role not found" });

    const { permission_ids, permission_keys } = req.body;
    let permissionIds = permission_ids;

    if (!permissionIds && Array.isArray(permission_keys)) {
      const perms = await db.permissions.findAll({
        where: { key: { [Op.in]: permission_keys } },
      });
      permissionIds = perms.map((p) => p.id);
    }

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ message: "permission_ids or permission_keys required" });
    }

    await role.setPermissions(permissionIds);
    const refreshed = await db.roles.findByPk(role.id, {
      include: [
        { model: db.permissions, as: "permissions", through: { attributes: [] } },
      ],
    });

    res.json({
      success: true,
      role: {
        id: refreshed.id,
        name: refreshed.name,
        permission_keys: (refreshed.permissions || []).map((p) => p.key),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.listPermissions = async (_req, res) => {
  try {
    const permissions = await db.permissions.findAll({
      order: [["module", "ASC"], ["key", "ASC"]],
    });
    res.json({
      success: true,
      permissions: permissions.map((p) => ({
        id: p.id,
        key: p.key,
        module: p.module,
        action: p.action,
        level: p.level,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.listTenantUsers = async (req, res) => {
  try {
    const users = await db.users.findAll({
      where: { tenant_id: Number(req.params.id) },
      attributes: {
        exclude: ["password", "otp"],
      },
      order: [["id", "ASC"]],
    });
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCurrentTenantPublic = async (req, res) => {
  try {
    if (!req.tenant) {
      return res.status(404).json({ message: "Tenant not found for domain" });
    }
    res.json({ success: true, tenant: serializeTenant(req.tenant) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
