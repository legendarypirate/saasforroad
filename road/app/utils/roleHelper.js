const db = require("../models");

async function getRoleWithPermissions(roleId) {
  if (!roleId) return { role: null, permissions: [] };

  const role = await db.roles.findByPk(roleId, {
    include: [{ model: db.permissions, as: "permissions", through: { attributes: [] } }],
  });

  if (!role) return { role: null, permissions: [] };

  const permissions = (role.permissions || []).map((p) => p.key);
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
  return {
    role_id: user.role_id || null,
    role: user.role || "user",
    role_name: user.role || "user",
    permissions: [],
    mobile_access: user.role === "user" || user.role === "ajilchin",
  };
}

module.exports = { getRoleWithPermissions, resolveUserRole };
