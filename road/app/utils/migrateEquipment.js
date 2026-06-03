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

module.exports = { migrateLegacyEquipment };
