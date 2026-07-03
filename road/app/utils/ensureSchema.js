const USER_PROFILE_COLUMNS = [
  "department_number",
  "personal_case_number",
  "project_number",
  "position",
  "register_number",
  "sap_number",
  "social_insurance_years",
  "driver_license_class",
  "driver_license_number",
  "driver_license_expiry",
  "affiliation",
  "residential_address",
  "id_card_home_address",
  "bank_account_number",
  "company_email",
  "responsible_equipment",
  "working_conditions",
  "job_description",
  "employment_start_date",
  "employment_order_number",
  "labor_contract_number",
  "labor_contract_date",
  "golden_order",
  "probation_period",
  "probation_end_date",
  "permanent_order_number",
  "permanent_date",
  "work_schedule_type",
  "cycle_start_date",
];

function resolveTableName(UserModel) {
  const ref = UserModel.getTableName();
  if (typeof ref === "string") return ref;
  return ref.tableName;
}

async function resolveExistingUserTable(sequelize, UserModel) {
  const modelTable = resolveTableName(UserModel);
  const [rows] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('users', 'user', '${modelTable}')
  `);

  const names = rows.map((r) => r.table_name);
  if (names.includes(modelTable)) return modelTable;
  if (names.includes("users")) return "users";
  if (names.includes("user")) return "user";
  return modelTable;
}

async function ensureUserProfileColumns(sequelize, UserModel) {
  const tableName = await resolveExistingUserTable(sequelize, UserModel);
  const [rows] = await sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '${tableName}'
  `);
  if (rows.length === 0) {
    console.log(`Skipping user profile columns — table "${tableName}" does not exist yet`);
    return;
  }
  console.log(`Ensuring user profile columns on table: ${tableName}`);

  for (const column of USER_PROFILE_COLUMNS) {
    await sequelize.query(
      `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${column}" VARCHAR(255);`
    );
  }

  const extraColumns = [
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "profile_image" VARCHAR(512);`,
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "extended_cycle" BOOLEAN DEFAULT false;`,
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "cycle_work_days" INTEGER DEFAULT 22;`,
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "cycle_rest_days" INTEGER DEFAULT 8;`,
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "daily_work_hours" DECIMAL(4,2) DEFAULT 8;`,
  ];

  for (const sql of extraColumns) {
    await sequelize.query(sql);
  }
}

async function ensurePostGIS(sequelize) {
  try {
    await sequelize.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    console.log("PostGIS extension ready (optional).");
  } catch (err) {
    console.warn("PostGIS not available — geo features use TEXT fallback:", err.message);
  }
}

async function ensureAttendanceGeofenceColumns(sequelize) {
  const [rows] = await sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'attendances'
  `);
  if (rows.length === 0) return;

  const columns = [
    `ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "office_location_id" INTEGER;`,
    `ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "distance_meters" INTEGER;`,
    `ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "check_out_latitude" VARCHAR(255);`,
    `ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "check_out_longitude" VARCHAR(255);`,
    `ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "check_out_office_location_id" INTEGER;`,
    `ALTER TABLE "attendances" ADD COLUMN IF NOT EXISTS "check_out_distance_meters" INTEGER;`,
  ];

  for (const sql of columns) {
    await sequelize.query(sql);
  }
}

async function ensureSchema(sequelize, UserModel) {
  if (!UserModel) {
    throw new Error("User model is required for ensureSchema");
  }
  await ensurePostGIS(sequelize);
  await ensureUserProfileColumns(sequelize, UserModel);
  await ensureAttendanceGeofenceColumns(sequelize);
}

module.exports = {
  ensureSchema,
  ensureUserProfileColumns,
  ensurePostGIS,
  ensureAttendanceGeofenceColumns,
  resolveTableName,
  resolveExistingUserTable,
};
