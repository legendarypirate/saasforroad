const db = require("../models");

const DEFAULT_PERMISSIONS = [
  { module: "admin", action: "dashboard", key: "admin:dashboard" },
  { module: "user", action: "read", key: "user:read" },
  { module: "user", action: "write", key: "user:write" },
  { module: "role", action: "read", key: "role:read" },
  { module: "role", action: "write", key: "role:write" },
  { module: "project", action: "read", key: "project:read" },
  { module: "project", action: "write", key: "project:write" },
  { module: "task", action: "read", key: "task:read" },
  { module: "task", action: "write", key: "task:write" },
  { module: "attendance", action: "read", key: "attendance:read" },
  { module: "attendance", action: "write", key: "attendance:write" },
  { module: "device", action: "read", key: "device:read" },
  { module: "device", action: "write", key: "device:write" },
  { module: "action", action: "read", key: "action:read" },
  { module: "action", action: "write", key: "action:write" },
  { module: "feedback", action: "read", key: "feedback:read" },
  { module: "accident", action: "read", key: "accident:read" },
  { module: "notification", action: "read", key: "notification:read" },
  { module: "document", action: "read", key: "document:read" },
  { module: "inventory", action: "read", key: "inventory:read" },
  { module: "inventory", action: "write", key: "inventory:write" },
  { module: "inventory", action: "approve", key: "inventory:approve" },
  { module: "inventory", action: "adjust", key: "inventory:adjust" },
  { module: "homepage", action: "read", key: "homepage:read" },
  { module: "homepage", action: "write", key: "homepage:write" },
  { module: "tender", action: "read", key: "tender:read" },
  { module: "tender", action: "write", key: "tender:write" },
  { module: "equipment", action: "read", key: "equipment:read" },
  { module: "equipment", action: "write", key: "equipment:write" },
  { module: "rental", action: "read", key: "rental:read" },
  { module: "rental", action: "write", key: "rental:write" },
  { module: "daily_report", action: "read", key: "daily_report:read" },
  { module: "daily_report", action: "write", key: "daily_report:write" },
  { module: "daily_report", action: "summary", key: "daily_report:summary" },
  { module: "hse", action: "read", key: "hse:read" },
  { module: "hse", action: "write", key: "hse:write" },
  { module: "hse", action: "approve", key: "hse:approve" },
  { module: "hse", action: "audit", key: "hse:audit" },
  { module: "hse", action: "mobile", key: "hse:mobile" },
  { module: "accident", action: "write", key: "accident:write" },
  { module: "finance", action: "read", key: "finance:read" },
  { module: "finance", action: "write", key: "finance:write" },
  { module: "finance", action: "approve", key: "finance:approve" },
  { module: "uniform", action: "read", key: "uniform:read" },
  { module: "uniform", action: "write", key: "uniform:write" },
  { module: "uniform", action: "approve", key: "uniform:approve" },
];

const DEFAULT_ROLES = [
  {
    name: "Админ",
    description: "Бүх эрхтэй админ",
    mobile_access: false,
    // null = attach every permission in DB
    permissionKeys: null,
  },
  {
    name: "Ажилчин",
    description: "Замын ажилчин — өдөр бүр ирц бүртгэнэ",
    mobile_access: true,
    permissionKeys: ["hse:mobile", "attendance:read"],
  },
  {
    name: "Төслийн менежер",
    description: "Төслийн удирдлага",
    mobile_access: false,
    permissionKeys: [
      "admin:dashboard",
      "project:read",
      "project:write",
      "task:read",
      "task:write",
      "attendance:read",
      "device:read",
      "device:write",
      "action:read",
      "feedback:read",
      "accident:read",
      "notification:read",
      "equipment:read",
      "equipment:write",
      "rental:read",
      "rental:write",
      "daily_report:read",
      "daily_report:write",
      "hse:read",
      "hse:write",
      "hse:approve",
      "accident:write",
      "finance:read",
      "finance:write",
      "uniform:read",
      "uniform:write",
    ],
  },
  {
    name: "Ерөнхий захирал",
    description: "Өдрийн товч тайлан — зөвхөн summary",
    mobile_access: false,
    permissionKeys: [
      "admin:dashboard",
      "daily_report:read",
      "daily_report:summary",
      "project:read",
      "accident:read",
      "attendance:read",
      "hse:read",
      "finance:read",
      "uniform:read",
    ],
  },
  {
    name: "ХАБЭА менежер",
    description: "Хөдөлмөрийн аюулгүй байдлын удирдлага",
    mobile_access: false,
    permissionKeys: [
      "admin:dashboard",
      "hse:read",
      "hse:write",
      "hse:approve",
      "hse:audit",
      "accident:read",
      "accident:write",
      "project:read",
      "user:read",
      "equipment:read",
      "daily_report:read",
    ],
  },
  {
    name: "Хяналт",
    description: "ХАБЭА хяналт, аудит",
    mobile_access: false,
    permissionKeys: [
      "admin:dashboard",
      "hse:read",
      "hse:audit",
      "accident:read",
      "project:read",
    ],
  },
];

function isAdminRoleName(name) {
  if (!name) return false;
  const n = String(name).trim().toLowerCase();
  return (
    n === "админ" ||
    n === "admin" ||
    n === "administrator" ||
    n === "супер админ" ||
    n === "superadmin" ||
    n === "super admin"
  );
}

/** Link legacy users (role string only, or English "admin") to Админ role_id. */
async function linkAdminUsers(adminRole) {
  if (!adminRole) return 0;

  const users = await db.users.findAll({
    attributes: ["id", "username", "role", "role_id"],
  });

  let updated = 0;
  for (const user of users) {
    const byString = isAdminRoleName(user.role);
    const needsLink = byString && user.role_id !== adminRole.id;
    if (!needsLink) continue;

    await user.update({
      role_id: adminRole.id,
      role: adminRole.name,
    });
    updated += 1;
  }

  if (updated > 0) {
    console.log(`Linked ${updated} user(s) to role "${adminRole.name}" (id=${adminRole.id}).`);
  }
  return updated;
}

async function seedPermissionsAndRoles() {
  for (const perm of DEFAULT_PERMISSIONS) {
    await db.permissions.findOrCreate({
      where: { key: perm.key },
      defaults: perm,
    });
  }

  const allPermissions = await db.permissions.findAll();
  const allPermissionIds = allPermissions.map((p) => p.id);

  let adminRole = null;

  for (const roleDef of DEFAULT_ROLES) {
    const [role] = await db.roles.findOrCreate({
      where: { name: roleDef.name },
      defaults: {
        name: roleDef.name,
        description: roleDef.description,
        mobile_access: roleDef.mobile_access,
      },
    });

    await role.update({
      description: roleDef.description,
      mobile_access: roleDef.mobile_access,
    });

    const permissionIds =
      roleDef.permissionKeys == null
        ? allPermissionIds
        : allPermissions
            .filter((p) => roleDef.permissionKeys.includes(p.key))
            .map((p) => p.id);

    await role.setPermissions(permissionIds);

    if (isAdminRoleName(roleDef.name)) {
      adminRole = role;
      console.log(
        `Admin role "${role.name}" (id=${role.id}) now has ${permissionIds.length} permissions.`
      );
    }
  }

  // Also grant full permissions to any other role named like admin (e.g. "Admin")
  const extraAdminRoles = await db.roles.findAll();
  for (const role of extraAdminRoles) {
    if (!isAdminRoleName(role.name)) continue;
    if (adminRole && role.id === adminRole.id) continue;
    await role.setPermissions(allPermissionIds);
    console.log(
      `Extra admin-like role "${role.name}" (id=${role.id}) synced to ${allPermissionIds.length} permissions.`
    );
    if (!adminRole) adminRole = role;
  }

  await linkAdminUsers(adminRole);

  console.log(
    `Roles and permissions seeded. (${allPermissions.length} permissions, ${DEFAULT_ROLES.length} default roles)`
  );
}

module.exports = {
  seedPermissionsAndRoles,
  isAdminRoleName,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLES,
};
