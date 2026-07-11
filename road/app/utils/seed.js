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
  { module: "notification", action: "write", key: "notification:write" },
  { module: "document", action: "read", key: "document:read" },
  { module: "document", action: "write", key: "document:write" },
  { module: "student", action: "read", key: "student:read" },
  { module: "student", action: "write", key: "student:write" },
  { module: "brigada", action: "read", key: "brigada:read" },
  { module: "brigada", action: "write", key: "brigada:write" },
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
  { module: "plant", action: "read", key: "plant:read" },
  { module: "plant", action: "write", key: "plant:write" },
  { module: "plant", action: "approve", key: "plant:approve" },
  { module: "uniform", action: "read", key: "uniform:read" },
  { module: "uniform", action: "write", key: "uniform:write" },
  { module: "uniform", action: "approve", key: "uniform:approve" },
  { module: "road", action: "view", key: "road:view" },
  { module: "road", action: "create", key: "road:create" },
  { module: "road", action: "update", key: "road:update" },
  { module: "road", action: "delete", key: "road:delete" },
  { module: "road", action: "approve", key: "road:approve" },
  { module: "road", action: "export", key: "road:export" },
  { module: "budget", action: "view", key: "budget:view" },
  { module: "budget", action: "create", key: "budget:create" },
  { module: "budget", action: "update", key: "budget:update" },
  { module: "budget", action: "delete", key: "budget:delete" },
  { module: "budget", action: "approve", key: "budget:approve" },
  { module: "budget", action: "export", key: "budget:export" },
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
      "notification:write",
      "document:read",
      "document:write",
      "student:read",
      "student:write",
      "brigada:read",
      "brigada:write",
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
      "plant:read",
      "plant:write",
      "uniform:read",
      "uniform:write",
      "road:view",
      "road:create",
      "road:update",
      "road:delete",
      "road:approve",
      "road:export",
      "budget:view",
      "budget:create",
      "budget:update",
      "budget:delete",
      "budget:approve",
      "budget:export",
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
      "plant:read",
      "uniform:read",
      "road:view",
      "budget:view",
      "budget:export",
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

const DEFAULT_DMS_FOLDERS = [
  { name: "Гэрээ", description: "Гэрээ, хавсралт, нэмэлт гэрээ", sort_order: 1 },
  { name: "Зураг төсөл", description: "Ажлын зураг, төсөл, өөрчлөлт", sort_order: 2 },
  { name: "Зөвшөөрөл", description: "Барилга, замын зөвшөөрөл, лиценз", sort_order: 3 },
  { name: "Чанар", description: "Чанарын баталгаа, туршилт, акт", sort_order: 4 },
  { name: "Гүйцэтгэл", description: "Гүйцэтгэлийн зураг, акт, хүлээлгэн өгөх", sort_order: 5 },
  { name: "Албан бичиг", description: "Албан захидал, мэдэгдэл, протокол", sort_order: 6 },
  { name: "Техникийн баримт", description: "Техникийн нөхцөл, стандарт, заавар", sort_order: 7 },
  { name: "Санхүү", description: "Нэхэмжлэх, төлбөр, төсөв баримт", sort_order: 8 },
  { name: "ХАБЭА", description: "Аюулгүй ажиллагааны баримт, сургалт", sort_order: 9 },
  { name: "Геодези", description: "Хэмжилт, координат, судалгаа", sort_order: 10 },
];

async function seedDocumentFolders() {
  if (!db.document_folders) return;
  let created = 0;
  for (const folder of DEFAULT_DMS_FOLDERS) {
    const [row, wasCreated] = await db.document_folders.findOrCreate({
      where: { name: folder.name, parent_id: null },
      defaults: {
        ...folder,
        parent_id: null,
        is_system: true,
      },
    });
    if (wasCreated) created += 1;
    else if (!row.is_system) {
      await row.update({ is_system: true, description: folder.description, sort_order: folder.sort_order });
    }
  }
  if (created > 0) {
    console.log(`DMS: seeded ${created} default folder(s).`);
  }
}

const DEFAULT_EQUIPMENT_CATEGORIES = [
  { name: "Экскаватор", code: "excavator", sort_order: 1 },
  { name: "Дэвсэгч", code: "compactor", sort_order: 2 },
  { name: "Бульдозер", code: "bulldozer", sort_order: 3 },
  { name: "Грейдер", code: "grader", sort_order: 4 },
  { name: "Ачигч", code: "loader", sort_order: 5 },
  { name: "Автокран", code: "crane", sort_order: 6 },
  { name: "Самосвал", code: "dump_truck", sort_order: 7 },
  { name: "Чиргүүл", code: "trailer", sort_order: 8 },
  { name: "Бетонохутгагч", code: "concrete_mixer", sort_order: 9 },
  { name: "Бусад", code: "other", sort_order: 99 },
];

async function seedEquipmentCategories() {
  if (!db.equipment_categories) return;
  let created = 0;
  for (const cat of DEFAULT_EQUIPMENT_CATEGORIES) {
    const [row, wasCreated] = await db.equipment_categories.findOrCreate({
      where: { name: cat.name },
      defaults: {
        ...cat,
        is_active: true,
      },
    });
    if (wasCreated) created += 1;
    else {
      await row.update({
        code: row.code || cat.code,
        sort_order: row.sort_order || cat.sort_order,
      });
    }
  }
  if (created > 0) {
    console.log(`Equipment: seeded ${created} category(ies).`);
  }
}

module.exports = {
  seedPermissionsAndRoles,
  seedDocumentFolders,
  seedEquipmentCategories,
  isAdminRoleName,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLES,
};
