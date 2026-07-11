/**
 * Brigade accounts are fully separate from company users.
 * - Credentials live on `brigades` (username/password)
 * - Members use local full_name (not users.id)
 * - Notifications target brigade_id (company staff may still use user_id)
 * - Migrates legacy leader_user_id → brigade credentials, then deletes brigada users
 */
async function migrateBrigadeSeparation(db) {
  const sequelize = db.sequelize;
  const Op = db.Sequelize.Op;

  const [brigadeTable] = await sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brigades'
  `);
  if (!brigadeTable.length) return;

  const alters = [
    `ALTER TABLE "brigades" ADD COLUMN IF NOT EXISTS "username" VARCHAR(120);`,
    `ALTER TABLE "brigades" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);`,
    `ALTER TABLE "brigades" ADD COLUMN IF NOT EXISTS "leader_name" VARCHAR(255);`,
    `ALTER TABLE "brigades" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(40);`,
    `ALTER TABLE "brigade_members" ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(255);`,
    `ALTER TABLE "brigade_members" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(40);`,
    `ALTER TABLE "brigade_members" ALTER COLUMN "user_id" DROP NOT NULL;`,
    `ALTER TABLE "brigade_notifications" ALTER COLUMN "user_id" DROP NOT NULL;`,
  ];

  for (const sql of alters) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      console.warn("migrateBrigadeSeparation alter:", err.message);
    }
  }

  try {
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS brigades_username_unique
      ON "brigades" ("username")
      WHERE "username" IS NOT NULL;
    `);
  } catch (err) {
    console.warn("migrateBrigadeSeparation index:", err.message);
  }

  // Migrate credentials from leader users → brigades
  const brigades = await db.brigades.findAll({
    where: {
      [Op.or]: [{ username: null }, { username: "" }],
      leader_user_id: { [Op.ne]: null },
    },
  });

  for (const brigade of brigades) {
    const leader = await db.users.findByPk(brigade.leader_user_id);
    if (!leader) continue;

    let username = String(leader.username || "").trim();
    if (!username) continue;

    // Avoid unique collisions across brigades
    const clash = await db.brigades.findOne({
      where: {
        username,
        id: { [Op.ne]: brigade.id },
      },
    });
    if (clash) {
      username = `${username}_b${brigade.id}`;
    }

    await brigade.update({
      username,
      password: leader.password,
      leader_name: leader.username,
      phone: leader.phone || brigade.contact_phone || null,
      contact_phone: brigade.contact_phone || leader.phone || null,
      leader_user_id: null,
    });
  }

  // Clear remaining leader_user_id links
  await sequelize.query(`UPDATE "brigades" SET "leader_user_id" = NULL WHERE "leader_user_id" IS NOT NULL;`);

  // Convert member user links → local names
  const members = await db.brigade_members.findAll({
    where: { user_id: { [Op.ne]: null } },
  });
  for (const member of members) {
    if (member.full_name) {
      await member.update({ user_id: null });
      continue;
    }
    const user = await db.users.findByPk(member.user_id);
    await member.update({
      full_name: user?.username || `Гишүүн #${member.id}`,
      phone: user?.phone || member.phone || null,
      user_id: null,
    });
  }

  // Move legacy leader-targeted notifications onto brigade_id when possible
  await sequelize.query(`
    UPDATE "brigade_notifications" n
    SET "brigade_id" = b.id
    FROM "brigades" b
    WHERE n."brigade_id" IS NULL
      AND n."user_id" IS NOT NULL
      AND b."username" IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM "users" u
        WHERE u.id = n."user_id"
          AND (u.affiliation = 'brigada' OR u.role = 'brigada')
      )
  `);

  // Delete company-user pollution: brigada accounts + their attendance/devices if any
  const brigadaUsers = await db.users.findAll({
    attributes: ["id"],
    where: {
      [Op.or]: [{ affiliation: "brigada" }, { role: "brigada" }],
    },
    raw: true,
  });
  const ids = brigadaUsers.map((u) => u.id);
  if (ids.length) {
    const idList = ids.join(",");
    const cleanupTables = [
      `DELETE FROM "attendances" WHERE "user_id" IN (${idList})`,
      `DELETE FROM "devices" WHERE "user_id" IN (${idList})`,
      `DELETE FROM "salary_adjustments" WHERE "user_id" IN (${idList})`,
      `DELETE FROM "brigade_notifications" WHERE "user_id" IN (${idList})`,
      `DELETE FROM "users" WHERE "id" IN (${idList})`,
    ];
    for (const sql of cleanupTables) {
      try {
        await sequelize.query(sql);
      } catch (err) {
        console.warn("migrateBrigadeSeparation cleanup:", err.message);
      }
    }
    console.log(`Removed ${ids.length} brigada user(s) from company users table.`);
  }

  console.log("Brigade separation migration complete.");
}

module.exports = { migrateBrigadeSeparation };
