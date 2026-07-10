const db = require("../models");
const { isAdminRoleName } = require("./seed");

async function getRoleWithPermissions(roleId) {
  if (!roleId) return { role: null, permissions: [] };

  const role = await db.roles.findByPk(roleId, {
    include: [{ model: db.permissions, as: "permissions", through: { attributes: [] } }],
  });

  if (!role) return { role: null, permissions: [] };

  let permissions = (role.permissions || []).map((p) => p.key);

  // Admin always gets every permission key in DB (even if role_permissions is stale)
  if (isAdminRoleName(role.name)) {
    const all = await db.permissions.findAll({ attributes: ["key"] });
    permissions = all.map((p) => p.key);
  }

  return { role, permissions };
}

async function resolveUserRole(user) {
  if (user.role_id) {
    const { role, permissions } = await getRoleWithPermissions(user.role_id);
    if (role) {
      return {
        role_id: role.id,
        role: role.name,
        role_name: role.name,
        permissions,
        mobile_access: role.mobile_access,
      };
    }
  }

  // Legacy: only string role, no role_id
  if (isAdminRoleName(user.role)) {
    const all = await db.permissions.findAll({ attributes: ["key"] });
    const adminRole = await db.roles.findOne({ where: { name: "Админ" } });
    return {
      role_id: adminRole?.id || null,
      role: adminRole?.name || user.role,
      role_name: adminRole?.name || user.role,
      permissions: all.map((p) => p.key),
      mobile_access: false,
    };
  }

  return {
    role_id: user.role_id || null,
    role: user.role || "user",
    role_name: user.role || "user",
    permissions: [],
    mobile_access: user.role === "user" || user.role === "ajilchin",
  };
}

module.exports = { getRoleWithPermissions, resolveUserRole };
