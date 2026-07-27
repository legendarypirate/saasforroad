async function ensureAssistSchema(sequelize) {
  const stmts = [
    `ALTER TABLE assist_service_categories ADD COLUMN IF NOT EXISTS image VARCHAR(512);`,
    `ALTER TABLE assist_services ADD COLUMN IF NOT EXISTS image VARCHAR(512);`,
    // Driver anket / job-application profile fields
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS birth_date DATE;`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS register_number VARCHAR(40);`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS province VARCHAR(120);`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS location VARCHAR(255);`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS desired_role VARCHAR(160);`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS experience_years DECIMAL(5,1);`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS education_level VARCHAR(40);`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS license_category VARCHAR(40);`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS about TEXT;`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS salary_expect DECIMAL(14,2);`,
    `ALTER TABLE assist_calls ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMPTZ;`,
    `ALTER TABLE assist_calls ADD COLUMN IF NOT EXISTS driver_rating INTEGER;`,
    `ALTER TABLE assist_calls ADD COLUMN IF NOT EXISTS driver_review TEXT;`,
    `ALTER TABLE assist_calls ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;`,
    `ALTER TABLE assist_calls ADD COLUMN IF NOT EXISTS equipment_id INTEGER;`,
    `ALTER TABLE assist_calls ADD COLUMN IF NOT EXISTS tenant_id INTEGER;`,
    `ALTER TABLE assist_calls ADD COLUMN IF NOT EXISTS plate_number VARCHAR(40);`,
    `ALTER TABLE assist_services ADD COLUMN IF NOT EXISTS base_price DECIMAL(14,2);`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS tenant_user_id INTEGER;`,
    `ALTER TABLE road_drivers ADD COLUMN IF NOT EXISTS tenant_id INTEGER;`,
    `CREATE UNIQUE INDEX IF NOT EXISTS road_drivers_tenant_user_uidx
       ON road_drivers (tenant_id, tenant_user_id)
       WHERE tenant_user_id IS NOT NULL;`,
  ];
  for (const sql of stmts) {
    try {
      await sequelize.query(sql);
    } catch (e) {
      console.warn("ensureAssistSchema:", e.message);
    }
  }
}

module.exports = { ensureAssistSchema };
