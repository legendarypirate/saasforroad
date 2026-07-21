/**
 * One-time migration: legacy project_equipments rows -> equipments + project_equipment_links
 */
async function migrateLegacyEquipment(sequelize, db) {
  try {
    const [tables] = await sequelize.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'project_equipments'
    `);
    if (!tables.length) return;

    const [cols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'project_equipments' AND column_name = 'name'
    `);
    if (!cols.length) return;

    const [countRows] = await sequelize.query(`SELECT COUNT(*)::int AS c FROM equipments`);
    if (countRows[0]?.c > 0) return;

    const [legacy] = await sequelize.query(`SELECT * FROM project_equipments ORDER BY id`);
    if (!legacy.length) return;

    console.log(`Migrating ${legacy.length} legacy project_equipment rows...`);

    for (const row of legacy) {
      const equipment = await db.equipments.create({
        name: row.name,
        model: row.model,
        registration_number: row.registration_number,
        motor_hours: row.motor_hours ?? 0,
        photo_front: row.photo_front,
        photo_back: row.photo_back,
        photo_left: row.photo_left,
        photo_right: row.photo_right,
        certificate_image: row.certificate_image,
        notes: row.notes,
      });

      if (row.project_id) {
        await db.project_equipment_links.findOrCreate({
          where: { project_id: row.project_id, equipment_id: equipment.id },
          defaults: { project_id: row.project_id, equipment_id: equipment.id },
        });
      }

      await sequelize.query(
        `UPDATE equipment_oil_changes SET equipment_id = :newId WHERE equipment_id = :oldId`,
        { replacements: { newId: equipment.id, oldId: row.id } }
      );
    }

    console.log("Legacy equipment migration completed.");
  } catch (err) {
    console.warn("Legacy equipment migration skipped:", err.message);
  }
}

/**
 * Correct equipment that was created through the web admin without a tenant
 * context (X-Tenant-Domain header missing) and therefore ended up either
 * NULL-tenant or swept into the default catch-all tenant by ensureDefaultTenant.
 *
 * Equipment must always belong to the tenant that created it. For a
 * single-operating-tenant deployment we can safely reattach these orphan rows
 * to that tenant. When 0 or 2+ real tenants exist the owner is ambiguous, so we
 * skip and leave it to be resolved manually.
 *
 * Runs AFTER ensureDefaultTenant so it also reclaims rows already moved to the
 * default tenant. Idempotent — once tenant_id is correct nothing matches.
 */
async function backfillEquipmentTenant(sequelize, db) {
  try {
    const { Op } = require("sequelize");
    const defaultSlug = process.env.DEFAULT_TENANT_SLUG || "default";

    const realTenants = await db.tenants.findAll({
      where: { is_active: true, slug: { [Op.ne]: defaultSlug } },
      order: [["id", "ASC"]],
      skipTenantScope: true,
    });
    if (realTenants.length !== 1) {
      if (realTenants.length > 1) {
        console.warn(
          "backfillEquipmentTenant skipped: multiple active tenants — resolve orphan equipment ownership manually."
        );
      }
      return;
    }

    const target = realTenants[0];
    const defaultTenant = await db.tenants.findOne({
      where: { slug: defaultSlug },
      skipTenantScope: true,
    });
    const orphanIds = defaultTenant ? [defaultTenant.id] : [];

    const tables = [
      "equipments",
      "equipment_categories",
      "equipment_images",
      "equipment_insurances",
      "equipment_oil_changes",
      "equipment_service_logs",
      "equipment_documents",
      "equipment_monthly_finances",
      "project_equipment_links",
    ];

    let moved = 0;
    for (const table of tables) {
      const [exists] = await sequelize.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = :table
           AND column_name = 'tenant_id'`,
        { replacements: { table } }
      );
      if (!exists.length) continue;

      try {
        const [, meta] = await sequelize.query(
          `UPDATE "${table}" SET "tenant_id" = :tid
           WHERE "tenant_id" IS DISTINCT FROM :tid
             AND ("tenant_id" IS NULL OR "tenant_id" = ANY(:orphans))`,
          { replacements: { tid: target.id, orphans: orphanIds } }
        );
        const count = typeof meta?.rowCount === "number" ? meta.rowCount : 0;
        if (count > 0) {
          moved += count;
          console.log(`  ${table}: ${count} row(s) → tenant #${target.id}`);
        }
      } catch (err) {
        console.warn(`backfillEquipmentTenant ${table}:`, err.message);
      }
    }

    if (moved > 0) {
      console.log(
        `Reassigned ${moved} orphan equipment row(s) → tenant #${target.id} (${target.slug}).`
      );
    }
  } catch (err) {
    console.warn("backfillEquipmentTenant skipped:", err.message);
  }
}

module.exports = { migrateLegacyEquipment, backfillEquipmentTenant };
