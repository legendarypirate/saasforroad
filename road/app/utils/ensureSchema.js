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
    `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "ui_preferences" JSONB DEFAULT '{}'::jsonb;`,
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
  const documentCols = [
    `ALTER TABLE "inv_documents" ADD COLUMN IF NOT EXISTS "to_project_id" INTEGER;`,
    `ALTER TABLE "inv_documents" ADD COLUMN IF NOT EXISTS "to_warehouse_id" INTEGER;`,
    `ALTER TABLE "inv_documents" ADD COLUMN IF NOT EXISTS "project_id" INTEGER;`,
  ];
  const equipmentCols = [
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "category" VARCHAR(32) DEFAULT 'machine';`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "unit" VARCHAR(64) DEFAULT 'ширхэг';`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "default_daily_rate" DECIMAL(14,2) DEFAULT 0;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "is_rentable" BOOLEAN DEFAULT true;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "status" VARCHAR(32) DEFAULT 'in_service';`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "asset_no" VARCHAR(64);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "serial_number" VARCHAR(128);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "capacity" VARCHAR(128);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "country_of_origin" VARCHAR(128);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "year_manufactured" VARCHAR(32);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "import_date" DATE;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "site" VARCHAR(255);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "color" VARCHAR(64);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "responsible_person" VARCHAR(255);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "operator_name" VARCHAR(255);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(64);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "responsible_user_id" INTEGER;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "operator_user_id" INTEGER;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_company" VARCHAR(255);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_status" VARCHAR(64);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_expiry" DATE;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_amount" DECIMAL(14,2);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_contract_no" VARCHAR(128);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "insurance_notes" TEXT;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "road_tax_amount" DECIMAL(14,2);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "atboyahat_amount" DECIMAL(14,2);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "air_pollution_fee" DECIMAL(14,2);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "transaction_fee" DECIMAL(14,2);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "tax_period" VARCHAR(64);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "tax_paid" BOOLEAN;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "inspection_result" VARCHAR(64);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "inspection_date" DATE;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "next_inspection_date" DATE;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "inspection_extra_fee" DECIMAL(14,2);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "inspection_notes" TEXT;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "last_oil_change_date" DATE;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "last_oil_motor_hours" DECIMAL(12,2);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "next_oil_motor_hours" DECIMAL(12,2);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "oil_type_name" VARCHAR(255);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "oil_quantity_liters" DECIMAL(10,2);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "oil_notes" TEXT;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "tech_certificate" VARCHAR(255);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "certificate_number" VARCHAR(128);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "certificate_expiry" DATE;`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "owner_name" VARCHAR(255);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "purchase_document" VARCHAR(255);`,
    `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "certificate_notes" TEXT;`,
  ];
  const rentalCols = [
    `ALTER TABLE "equipment_rentals" ADD COLUMN IF NOT EXISTS "daily_rate" DECIMAL(14,2) DEFAULT 0;`,
  ];

  for (const group of [materialCols, warehouseCols, stockCols, documentCols, equipmentCols, rentalCols]) {
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

async function ensureLeaveRequestColumns(sequelize) {
  const [rows] = await sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leave_requests'
  `);
  if (rows.length === 0) return;

  const columns = [
    `ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "start_at" TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE "leave_requests" ADD COLUMN IF NOT EXISTS "end_at" TIMESTAMP WITH TIME ZONE;`,
  ];

  for (const sql of columns) {
    await sequelize.query(sql);
  }
}

async function ensurePermissionColumns(sequelize) {
  const [rows] = await sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'permissions'
  `);
  if (rows.length === 0) return;

  const columns = [
    `ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "index" VARCHAR(255);`,
    `ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "level" VARCHAR(32) DEFAULT 'action';`,
    `ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "module_key" VARCHAR(255);`,
    `ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "menu_key" VARCHAR(255);`,
    `ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "label" VARCHAR(255);`,
    `ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER DEFAULT 0;`,
  ];

  for (const sql of columns) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      console.warn("ensurePermissionColumns:", err.message);
    }
  }

  // Backfill from legacy module/action/key when new columns are empty
  try {
    await sequelize.query(`
      UPDATE "permissions"
      SET
        "index" = COALESCE(NULLIF("index", ''), "module"),
        "module_key" = COALESCE(
          NULLIF("module_key", ''),
          CONCAT(COALESCE(NULLIF("index", ''), "module"), ':module')
        ),
        "level" = COALESCE(
          NULLIF("level", ''),
          CASE
            WHEN "action" = 'module' OR "key" LIKE '%:module' THEN 'module'
            WHEN "action" IN ('read', 'view', 'dashboard', 'summary') THEN 'menu'
            ELSE 'action'
          END
        ),
        "menu_key" = CASE
          WHEN COALESCE(NULLIF("level", ''), '') = 'module'
            OR "action" = 'module'
            OR "key" LIKE '%:module'
            THEN NULL
          WHEN "menu_key" IS NOT NULL AND "menu_key" <> '' THEN "menu_key"
          WHEN "action" IN ('read', 'view', 'dashboard', 'summary') THEN "key"
          ELSE CONCAT(COALESCE(NULLIF("index", ''), "module"), ':read')
        END,
        "sort_order" = COALESCE("sort_order", 0)
      WHERE "module_key" IS NULL
         OR "index" IS NULL
         OR "level" IS NULL
         OR "level" = '';
    `);
  } catch (err) {
    console.warn("ensurePermissionColumns backfill:", err.message);
  }
}

async function ensurePersonalNoteColumns(sequelize) {
  const [rows] = await sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'personal_notes'
  `);
  if (rows.length === 0) return;

  try {
    await sequelize.query(
      `ALTER TABLE "personal_notes" ADD COLUMN IF NOT EXISTS "deadline_date" DATE;`
    );
  } catch (err) {
    console.warn("ensurePersonalNoteColumns deadline_date:", err.message);
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
  await ensureLeaveRequestColumns(sequelize);
  await ensureProjectColumns(sequelize);
  await ensureDmsColumns(sequelize);
  await ensureNotificationColumns(sequelize);
  await ensurePersonalNoteColumns(sequelize);
  await ensurePlantSiteColumns(sequelize);
  await ensureEquipmentCategoryColumns(sequelize);
  await ensureStudentColumns(sequelize);
  await ensurePermissionColumns(sequelize);
}

async function ensureEquipmentCategoryColumns(sequelize) {
  try {
    await sequelize.query(
      `ALTER TABLE "equipments" ADD COLUMN IF NOT EXISTS "equipment_category_id" INTEGER;`
    );
  } catch (err) {
    console.warn("ensureEquipmentCategoryColumns:", err.message);
  }
}

async function ensureStudentColumns(sequelize) {
  const [rows] = await sequelize.query(`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'students'
  `);
  if (rows.length === 0) return;

  const columns = [
    `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "photo" VARCHAR(512);`,
    `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "gpa" DECIMAL(4,2);`,
    `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "skills" JSONB DEFAULT '[]'::jsonb;`,
  ];
  for (const sql of columns) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      console.warn("ensureStudentColumns:", err.message);
    }
  }

  try {
    await sequelize.query(
      `UPDATE "students" SET "skills" = '[]'::jsonb WHERE "skills" IS NULL;`
    );
  } catch (err) {
    console.warn("ensureStudentColumns skills backfill:", err.message);
  }
}

async function ensurePlantSiteColumns(sequelize) {
  const columns = [
    `ALTER TABLE "plant_sites" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,7);`,
    `ALTER TABLE "plant_sites" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10,7);`,
    `ALTER TABLE "plant_sites" ADD COLUMN IF NOT EXISTS "rcos_status" VARCHAR(20);`,
    `ALTER TABLE "plant_sites" ADD COLUMN IF NOT EXISTS "rcos_factory_id" INTEGER;`,
    `ALTER TABLE "plant_sites" ADD COLUMN IF NOT EXISTS "rcos_request_id" INTEGER;`,
  ];
  for (const sql of columns) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      console.warn("ensurePlantSiteColumns:", err.message);
    }
  }
}

async function ensureProjectColumns(sequelize) {
  const columns = [
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "road_name" VARCHAR(255);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "km_from" DECIMAL(10,3);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "km_to" DECIMAL(10,3);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "client_name" VARCHAR(255);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "contract_number" VARCHAR(80);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "planned_start" DATE;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "planned_end" DATE;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "actual_start" DATE;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "actual_end" DATE;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "progress_percent" INTEGER DEFAULT 0;`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "progress_unit" VARCHAR(20) DEFAULT '%';`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "progress_planned" DECIMAL(12,3);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "progress_actual" DECIMAL(12,3);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "season_note" VARCHAR(255);`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "notes" TEXT;`,
  ];
  for (const sql of columns) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      console.warn("ensureProjectColumns:", err.message);
    }
  }
}

async function ensureDmsColumns(sequelize) {
  const columns = [
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "description" TEXT;`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "doc_type" VARCHAR(40) DEFAULT 'other';`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "doc_number" VARCHAR(120);`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1;`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'active';`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "project_id" INTEGER;`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "tags" VARCHAR(500);`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "mime_type" VARCHAR(120);`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "file_size" INTEGER;`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "original_name" VARCHAR(255);`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "issue_date" DATE;`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "expiry_date" DATE;`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "issuer" VARCHAR(255);`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "notes" TEXT;`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "created_by" INTEGER;`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "updated_by" INTEGER;`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "owner_user_id" INTEGER;`,
    `ALTER TABLE "document_folders" ADD COLUMN IF NOT EXISTS "owner_user_id" INTEGER;`,
  ];
  for (const sql of columns) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      console.warn("ensureDmsColumns:", err.message);
    }
  }
}

async function ensureNotificationColumns(sequelize) {
  const columns = [
    `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'draft';`,
    `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "audience" VARCHAR(20) DEFAULT 'all';`,
    `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "priority" VARCHAR(20) DEFAULT 'normal';`,
    `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "project_id" INTEGER;`,
    `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP WITH TIME ZONE;`,
    `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP WITH TIME ZONE;`,
  ];
  for (const sql of columns) {
    try {
      await sequelize.query(sql);
    } catch (err) {
      console.warn("ensureNotificationColumns:", err.message);
    }
  }
  // Widen description if still VARCHAR
  try {
    await sequelize.query(
      `ALTER TABLE "notifications" ALTER COLUMN "description" TYPE TEXT;`
    );
  } catch (err) {
    console.warn("ensureNotificationColumns description:", err.message);
  }
}

module.exports = {
  ensureSchema,
  ensureUserProfileColumns,
  ensurePostGIS,
  ensureAttendanceGeofenceColumns,
  ensureOrgNodeColumns,
  ensureSalaryAdjustmentColumns,
  ensureInventoryColumns,
  ensureLeaveRequestColumns,
  ensureProjectColumns,
  ensureDmsColumns,
  ensureNotificationColumns,
  ensurePersonalNoteColumns,
  ensurePlantSiteColumns,
  ensureEquipmentCategoryColumns,
  ensureStudentColumns,
  ensurePermissionColumns,
  resolveTableName,
  resolveExistingUserTable,
};
