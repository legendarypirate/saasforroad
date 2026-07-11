/**
 * Add FIDIC / international PM columns to existing `projects` table.
 * Sequelize sync() does not alter existing tables.
 */
async function migrateProjectFidic(db) {
  const sequelize = db.sequelize;

  const [table] = await sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'projects'
  `);
  if (!table.length) return;

  const alters = [
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "code" VARCHAR(40);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "province" VARCHAR(80);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "aimag_soum" VARCHAR(120);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "road_class" VARCHAR(10);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "length_km" DECIMAL(10,3);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "employer_name" VARCHAR(255);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "contractor_name" VARCHAR(255);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "engineer_org" VARCHAR(255);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "employer_rep" VARCHAR(255);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "contractor_rep" VARCHAR(255);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "contract_type" VARCHAR(40) DEFAULT 'Domestic';`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "contract_date" DATE;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(8) DEFAULT 'MNT';`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "retention_pct" DECIMAL(5,2) DEFAULT 5;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "liquidated_damages_per_day" DECIMAL(18,2);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "funding_source" VARCHAR(120);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "tender_ref" VARCHAR(80);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "contingency_pct" DECIMAL(5,2) DEFAULT 10;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "committed_amount" DECIMAL(18,2) DEFAULT 0;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "stage" VARCHAR(40) DEFAULT 'mobilization';`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "baseline_start" DATE;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "baseline_end" DATE;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "road_project_id" INTEGER;`,
  ];

  for (const sql of alters) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      console.warn("migrateProjectFidic alter:", err.message);
    }
  }

  // Backfill employer_name from legacy client_name
  try {
    await sequelize.query(`
      UPDATE "projects"
      SET "employer_name" = "client_name"
      WHERE ("employer_name" IS NULL OR "employer_name" = '')
        AND "client_name" IS NOT NULL AND "client_name" <> ''
    `);
  } catch (err) {
    console.warn("migrateProjectFidic backfill employer:", err.message);
  }

  // Assign codes where missing
  try {
    const year = new Date().getFullYear();
    const [rows] = await sequelize.query(`
      SELECT id FROM "projects" WHERE "code" IS NULL OR "code" = '' ORDER BY id ASC
    `);
    for (let i = 0; i < rows.length; i++) {
      const code = `PRJ-${year}-${String(i + 1).padStart(3, "0")}`;
      await sequelize.query(`UPDATE "projects" SET "code" = :code WHERE id = :id`, {
        replacements: { code, id: rows[i].id },
      });
    }
  } catch (err) {
    console.warn("migrateProjectFidic codes:", err.message);
  }
}

module.exports = { migrateProjectFidic };
