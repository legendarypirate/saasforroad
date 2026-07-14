const bcrypt = require("bcryptjs");
const db = require("../models");
const { DEFAULT_ROLES, isAdminRoleName } = require("./seed");
const { allModuleIds } = require("./moduleCatalog");
const { backfillTenantIds } = require("./tenantColumns");
const { runWithTenant } = require("../middleware/tenantScope");

/**
 * Create default RBAC roles for a tenant (copied from seed templates).
 * Permissions remain global; role_permissions are wired per tenant role.
 */
async function seedRolesForTenant(tenantId, transaction) {
  return runWithTenant(tenantId, async () => {
    const allPermissions = await db.permissions.findAll({
      transaction,
      skipTenantScope: true,
    });
    const permissionByKey = new Map(allPermissions.map((p) => [p.key, p]));
    const created = [];

    for (const roleDef of DEFAULT_ROLES) {
      let role = await db.roles.findOne({
        where: { name: roleDef.name, tenant_id: tenantId },
        transaction,
        skipTenantScope: true,
      });

      if (!role) {
        role = await db.roles.create(
          {
            name: roleDef.name,
            description: roleDef.description,
            mobile_access: !!roleDef.mobile_access,
            tenant_id: tenantId,
          },
          { transaction, skipTenantScope: true }
        );
      }

      let permissionIds;
      if (roleDef.permissionKeys === null) {
        permissionIds = allPermissions.map((p) => p.id);
      } else {
        permissionIds = roleDef.permissionKeys
          .map((key) => permissionByKey.get(key)?.id)
          .filter(Boolean);
      }

      if (permissionIds.length) {
        await role.setPermissions(permissionIds, { transaction });
      }

      created.push(role);
    }

    return created;
  });
}

async function findAdminRoleForTenant(tenantId, transaction) {
  const roles = await db.roles.findAll({
    where: { tenant_id: tenantId },
    transaction,
  });
  return roles.find((r) => isAdminRoleName(r.name)) || roles[0] || null;
}

/**
 * Ensure a tenant has exactly one superadmin user.
 * Passwords are always hashed.
 */
async function upsertTenantSuperadmin(tenantId, payload, transaction) {
  const { username, password, email, phone, name } = payload;
  if (!username || !password) {
    throw new Error("username and password are required");
  }

  const adminRole = await findAdminRoleForTenant(tenantId, transaction);
  if (!adminRole) {
    throw new Error("Tenant admin role missing — seed roles first");
  }

  const existing = await db.users.findAll({
    where: { tenant_id: tenantId, is_tenant_superadmin: true },
    transaction,
  });

  for (const u of existing) {
    if (u.username !== username) {
      await u.update({ is_tenant_superadmin: false }, { transaction });
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  let user = await db.users.findOne({
    where: { tenant_id: tenantId, username },
    transaction,
  });

  if (user) {
    await user.update(
      {
        password: hashed,
        email: email ?? user.email,
        phone: phone ?? user.phone,
        role: adminRole.name,
        role_id: adminRole.id,
        is_tenant_superadmin: true,
        is_active: "1",
        position: name || user.position || "Super Admin",
      },
      { transaction }
    );
  } else {
    // Username must be unique within tenant; also block global collisions loosely
    const clash = await db.users.findOne({
      where: { username },
      transaction,
    });
    if (clash && clash.tenant_id !== tenantId) {
      throw new Error("Username already used by another tenant");
    }

    user = await db.users.create(
      {
        username,
        password: hashed,
        email: email || null,
        phone: phone || null,
        role: adminRole.name,
        role_id: adminRole.id,
        tenant_id: tenantId,
        is_tenant_superadmin: true,
        is_active: "1",
        position: name || "Super Admin",
      },
      { transaction }
    );
  }

  return user;
}

async function bootstrapTenant(data, { superadmin } = {}) {
  const transaction = await db.sequelize.transaction();
  try {
    const slug = String(data.slug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!data.name || !slug) {
      throw new Error("name and slug are required");
    }

    // Default SaaS subdomain: tenant1 → tenant1.rcos.mn
    const { withSaasAlias, saasSubdomainForSlug } = require("./tenantHelper");
    const defaultDomain = saasSubdomainForSlug(slug);

    let domain = String(data.domain || "")
      .trim()
      .toLowerCase()
      .replace(/^www\./, "");

    // No custom domain → use {slug}.rcos.mn
    if (!domain) {
      domain = defaultDomain;
    }

    const aliases = Array.isArray(data.domains)
      ? data.domains.map((d) => String(d).trim().toLowerCase().replace(/^www\./, "")).filter(Boolean)
      : [];

    const merged = withSaasAlias(slug, domain, aliases);
    domain = merged.domain;

    const tenant = await db.tenants.create(
      {
        name: data.name,
        slug,
        domain,
        domains: merged.domains,
        company_name: data.company_name || data.name,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        notes: data.notes || null,
        is_active: data.is_active !== false,
        modules:
          Array.isArray(data.modules) && data.modules.length
            ? data.modules
            : allModuleIds(),
        settings: data.settings || {},
      },
      { transaction }
    );

    await seedRolesForTenant(tenant.id, transaction);

    let adminUser = null;
    if (superadmin?.username && superadmin?.password) {
      adminUser = await upsertTenantSuperadmin(
        tenant.id,
        superadmin,
        transaction
      );
    }

    await transaction.commit();
    return { tenant, adminUser };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * One-time: attach existing orphan rows to a default tenant.
 */
async function ensureDefaultTenant() {
  const slug = process.env.DEFAULT_TENANT_SLUG || "default";
  let tenant = await db.tenants.findOne({
    where: { slug },
    skipTenantScope: true,
  });

  if (!tenant) {
    const domain =
      process.env.DEFAULT_TENANT_DOMAIN ||
      "localhost";
    tenant = await db.tenants.create({
      name: process.env.DEFAULT_TENANT_NAME || "Default Tenant",
      slug,
      domain,
      domains: [],
      company_name: process.env.DEFAULT_TENANT_NAME || "Default Tenant",
      is_active: true,
      modules: allModuleIds(),
      settings: {},
    });
    console.log(`Created default tenant #${tenant.id} (${domain})`);
  }

  // Ensure default roles exist for default tenant
  await seedRolesForTenant(tenant.id);

  // Backfill ALL tenant-scoped tables (users, roles, projects, hse, finance, …)
  const touched = await backfillTenantIds(db.sequelize, db, tenant.id);
  if (touched > 0) {
    console.log(`Backfilled tenant_id on ${touched} table(s) → tenant #${tenant.id}`);
  }

  return tenant;
}

async function ensurePlatformAdmin() {
  const username = process.env.PLATFORM_ADMIN_USER || "platform";
  const password = process.env.PLATFORM_ADMIN_PASSWORD || "platform123";
  const email = process.env.PLATFORM_ADMIN_EMAIL || "admin@rcos.mn";

  let admin = await db.platform_admins.findOne({ where: { username } });
  if (!admin) {
    const hashed = await bcrypt.hash(password, 10);
    admin = await db.platform_admins.create({
      username,
      password: hashed,
      name: "Platform Admin",
      email,
      is_active: true,
    });
    console.log(`Seeded platform admin "${username}"`);
  }
  return admin;
}

module.exports = {
  seedRolesForTenant,
  upsertTenantSuperadmin,
  bootstrapTenant,
  ensureDefaultTenant,
  ensurePlatformAdmin,
  findAdminRoleForTenant,
};
