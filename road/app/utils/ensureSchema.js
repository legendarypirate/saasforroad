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
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "salary" DECIMAL(12,2) DEFAULT 0;`,
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

async function ensureOrgNodeColumns(sequelize) {
  const [rows] = await sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_nodes'
  `);
  if (rows.length === 0) return;

  const columns = [
    `ALTER TABLE "org_nodes" ADD COLUMN IF NOT EXISTS "org_level" VARCHAR(32) DEFAULT 'junior';`,
    `ALTER TABLE "org_nodes" ADD COLUMN IF NOT EXISTS "reports_to_id" INTEGER;`,
  ];

  for (const sql of columns) {
    await sequelize.query(sql);
  }
}

async function ensureSalaryAdjustmentColumns(sequelize) {
  const [rows] = await sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'salary_adjustments'
  `);
  if (rows.length === 0) return;

  const columns = [
    `ALTER TABLE "salary_adjustments" ADD COLUMN IF NOT EXISTS "worked_hours" DECIMAL(8,2);`,
    `ALTER TABLE "salary_adjustments" ADD COLUMN IF NOT EXISTS "billable_hours" DECIMAL(8,2);`,
    `ALTER TABLE "salary_adjustments" ADD COLUMN IF NOT EXISTS "overtime_hours" DECIMAL(8,2);`,
    `ALTER TABLE "salary_adjustments" ADD COLUMN IF NOT EXISTS "absent_hours" DECIMAL(8,2);`,
    `ALTER TABLE "salary_adjustments" ADD COLUMN IF NOT EXISTS "ndsh" DECIMAL(12,2);`,
    `ALTER TABLE "salary_adjustments" ADD COLUMN IF NOT EXISTS "hhoat" DECIMAL(12,2);`,
    `ALTER TABLE "salary_adjustments" ADD COLUMN IF NOT EXISTS "deduction" DECIMAL(12,2) DEFAULT 0;`,
    `ALTER TABLE "salary_adjustments" ADD COLUMN IF NOT EXISTS "additional_deduction" DECIMAL(12,2) DEFAULT 0;`,
    `ALTER TABLE "salary_adjustments" ADD COLUMN IF NOT EXISTS "note" VARCHAR(500);`,
  ];

  for (const sql of columns) {
    await sequelize.query(sql);
  }
}

async function ensureInventoryColumns(sequelize) {
  const materialCols = [
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "brand" VARCHAR(255);`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "specification" VARCHAR(255);`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "barcode" VARCHAR(255);`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "image_url" VARCHAR(512);`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "status" VARCHAR(32) DEFAULT 'active';`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "min_stock" DECIMAL(14,3) DEFAULT 0;`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "max_stock" DECIMAL(14,3) DEFAULT 0;`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "default_warehouse_id" INTEGER;`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "default_supplier_id" INTEGER;`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "standard_cost" DECIMAL(14,2) DEFAULT 0;`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "average_cost" DECIMAL(14,2) DEFAULT 0;`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "last_purchase_price" DECIMAL(14,2) DEFAULT 0;`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "is_consumable" BOOLEAN DEFAULT true;`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "is_asset" BOOLEAN DEFAULT false;`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;`,
    `ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE;`,
  ];
  const warehouseCols = [
    `ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "code" VARCHAR(255);`,
    `ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "manager_id" INTEGER;`,
    `ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "capacity" DECIMAL(14,2);`,
    `ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "status" VARCHAR(32) DEFAULT 'active';`,
    `ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;`,
    `ALTER TABLE "warehouses" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE;`,
  ];
  const stockCols = [
    `ALTER TABLE "stocks" ADD COLUMN IF NOT EXISTS "reserved_quantity" DECIMAL(14,3) DEFAULT 0;`,
    `ALTER TABLE "stocks" ADD COLUMN IF NOT EXISTS "on_order_quantity" DECIMAL(14,3) DEFAULT 0;`,
    `ALTER TABLE "stocks" ADD COLUMN IF NOT EXISTS "average_cost" DECIMAL(14,2) DEFAULT 0;`,
    `ALTER TABLE "stocks" ADD COLUMN IF NOT EXISTS "last_updated" TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE "stocks" ALTER COLUMN "quantity" TYPE DECIMAL(14,3) USING quantity::decimal;`,
  ];

  for (const group of [materialCols, warehouseCols, stockCols]) {
    for (const sql of group) {
      try {
        await sequelize.query(sql);
      } catch (err) {
        console.warn("Inventory schema:", err.message);
      }
    }
  }

  try {
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS stocks_item_warehouse_uidx
      ON "stocks" ("item_id", "warehouse_id");
    `);
  } catch (err) {
    console.warn("Stock unique index:", err.message);
  }
}

async function ensureSchema(sequelize, UserModel) {
  if (!UserModel) {
    throw new Error("User model is required for ensureSchema");
  }
  await ensurePostGIS(sequelize);
  await ensureUserProfileColumns(sequelize, UserModel);
  await ensureAttendanceGeofenceColumns(sequelize);
  await ensureOrgNodeColumns(sequelize);
  await ensureSalaryAdjustmentColumns(sequelize);
  await ensureInventoryColumns(sequelize);
}

module.exports = {
  ensureSchema,
  ensureUserProfileColumns,
  ensurePostGIS,
  ensureAttendanceGeofenceColumns,
  ensureOrgNodeColumns,
  ensureSalaryAdjustmentColumns,
  ensureInventoryColumns,
  resolveTableName,
  resolveExistingUserTable,
};
