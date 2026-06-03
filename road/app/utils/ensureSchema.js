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
  console.log(`Ensuring user profile columns on table: ${tableName}`);

  for (const column of USER_PROFILE_COLUMNS) {
    await sequelize.query(
      `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${column}" VARCHAR(255);`
    );
  }

  const extraColumns = [
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "extended_cycle" BOOLEAN DEFAULT false;`,
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "cycle_work_days" INTEGER DEFAULT 22;`,
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "cycle_rest_days" INTEGER DEFAULT 8;`,
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "daily_work_hours" DECIMAL(4,2) DEFAULT 8;`,
  ];

  for (const sql of extraColumns) {
    await sequelize.query(sql);
  }
}

async function ensureSchema(sequelize, UserModel) {
  if (!UserModel) {
    throw new Error("User model is required for ensureSchema");
  }
  await ensureUserProfileColumns(sequelize, UserModel);
}

module.exports = { ensureSchema, ensureUserProfileColumns, resolveTableName, resolveExistingUserTable };
