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
  { module: "action", action: "read", key: "action:read" },
  { module: "action", action: "write", key: "action:write" },
  { module: "feedback", action: "read", key: "feedback:read" },
  { module: "accident", action: "read", key: "accident:read" },
  { module: "notification", action: "read", key: "notification:read" },
  { module: "document", action: "read", key: "document:read" },
  { module: "inventory", action: "read", key: "inventory:read" },
  { module: "homepage", action: "read", key: "homepage:read" },
  { module: "homepage", action: "write", key: "homepage:write" },
  { module: "tender", action: "read", key: "tender:read" },
  { module: "tender", action: "write", key: "tender:write" },
];

const DEFAULT_ROLES = [
  {
    name: "Админ",
    description: "Бүх эрхтэй админ",
    mobile_access: false,
    permissionKeys: DEFAULT_PERMISSIONS.map((p) => p.key),
  },
  {
    name: "Ажилчин",
    description: "Замын ажилчин — өдөр бүр ирц бүртгэнэ",
    mobile_access: true,
    permissionKeys: [],
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
      "action:read",
      "feedback:read",
      "accident:read",
      "notification:read",
    ],
  },
];

async function seedPermissionsAndRoles() {
  for (const perm of DEFAULT_PERMISSIONS) {
    await db.permissions.findOrCreate({
      where: { key: perm.key },
      defaults: perm,
    });
  }

  const allPermissions = await db.permissions.findAll();

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

    const permissionIds = allPermissions
      .filter((p) => roleDef.permissionKeys.includes(p.key))
      .map((p) => p.id);

    if (permissionIds.length > 0) {
      await role.setPermissions(permissionIds);
    }
  }

  console.log("Roles and permissions seeded.");
}

module.exports = { seedPermissionsAndRoles };
