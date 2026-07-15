/**
 * Models that must NOT get tenant_id:
 * - tenants / platform_admins (platform-level)
 * - permissions (global catalog)
 * - role_permissions (join via role.tenant_id)
 * - shared geo reference tables
 */
const TENANT_SKIP_KEYS = new Set([
  "Sequelize",
  "sequelize",
  "tenants",
  "platform_admins",
  "platform_landing_settings",
  "platform_data_entries",
  "permissions",
  "role_permissions",
  "district",
  "horooBoundary",
  // Platform-shared brigade marketplace (app register on api.rcos.mn;
  // any tenant can hire / review)
  "brigades",
  "brigade_members",
  "brigade_equipment",
  "brigade_reviews",
  "brigade_documents",
  "brigade_timeline_events",
  "brigade_progress_reports",
  "brigade_notifications",
]);

const TENANT_SKIP_TABLES = new Set([
  "tenants",
  "platform_admins",
  "platform_landing_settings",
  "platform_data_entries",
  "permissions",
  "role_permissions",
  "districts",
  "horoo_boundaries",
  "horooboundaries",
  "brigades",
  "brigade_members",
  "brigade_equipment",
  "brigade_reviews",
  "brigade_documents",
  "brigade_timeline_events",
  "brigade_progress_reports",
  "brigade_notifications",
]);

function isSequelizeModel(model) {
  return (
    model &&
    typeof model === "function" &&
    model.rawAttributes &&
    typeof model.findAll === "function" &&
    model.getTableName
  );
}

function shouldSkipModel(key, model) {
  if (TENANT_SKIP_KEYS.has(key)) return true;
  const table =
    typeof model.getTableName === "function"
      ? model.getTableName()
      : model.tableName;
  const tableName = String(
    typeof table === "object" ? table.tableName || table : table
  ).toLowerCase();
  return TENANT_SKIP_TABLES.has(tableName);
}

function tableNameOf(model) {
  const table =
    typeof model.getTableName === "function"
      ? model.getTableName()
      : model.tableName;
  return typeof table === "object" ? table.tableName : table;
}

/**
 * Dynamically add tenant_id attribute to every business model.
 * Mutates Sequelize attribute maps so INSERT/UPDATE include the column.
 */
function injectTenantIdAttributes(db, Sequelize) {
  const added = [];
  for (const [key, model] of Object.entries(db)) {
    if (!isSequelizeModel(model)) continue;
    if (shouldSkipModel(key, model)) continue;
    if (model.rawAttributes.tenant_id) {
      // already declared in model file (users/roles/projects)
      continue;
    }

    const attribute = {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: "tenant_id",
      fieldName: "tenant_id",
      _modelAttribute: true,
      Model: model,
    };

    model.rawAttributes.tenant_id = attribute;
    if (model.tableAttributes) model.tableAttributes.tenant_id = attribute;
    if (model.fieldRawAttributesMap) {
      model.fieldRawAttributesMap.tenant_id = attribute;
    }
    if (model.fieldAttributeMap) {
      model.fieldAttributeMap.tenant_id = "tenant_id";
    }
    // attributeNames used by some query builders
    if (Array.isArray(model._attributeNames)) {
      model._attributeNames.push("tenant_id");
    }

    added.push(key);
  }
  return added;
}

/**
 * Ensure DB columns + indexes exist.
 */
async function ensureTenantColumns(sequelize, db) {
  const qi = sequelize.getQueryInterface();
  const tables = await qi.showAllTables();
  const tableNames = new Set(
    tables.map((t) => (typeof t === "string" ? t : t.tableName || String(t)))
  );

  let created = 0;
  for (const [key, model] of Object.entries(db)) {
    if (!isSequelizeModel(model)) continue;
    if (shouldSkipModel(key, model)) continue;
    if (!model.rawAttributes.tenant_id) continue;

    const tableName = tableNameOf(model);
    if (!tableNames.has(tableName)) continue;

    let desc;
    try {
      desc = await qi.describeTable(tableName);
    } catch {
      continue;
    }
    if (desc.tenant_id) continue;

    await qi.addColumn(tableName, "tenant_id", {
      type: SequelizeTypes(sequelize).INTEGER,
      allowNull: true,
    });
    created += 1;
    try {
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_tenant_id ON "${tableName}" ("tenant_id")`
      );
    } catch (_) {
      // ignore index conflicts
    }
  }
  return created;
}

function SequelizeTypes(sequelize) {
  return sequelize.constructor.DataTypes || require("sequelize").DataTypes;
}

/**
 * Backfill NULL tenant_id rows to the given tenant.
 */
async function backfillTenantIds(sequelize, db, tenantId) {
  if (!tenantId) return 0;
  let touched = 0;
  for (const [key, model] of Object.entries(db)) {
    if (!isSequelizeModel(model)) continue;
    if (shouldSkipModel(key, model)) continue;
    if (!model.rawAttributes.tenant_id) continue;

    const tableName = tableNameOf(model);
    try {
      const [, meta] = await sequelize.query(
        `UPDATE "${tableName}" SET "tenant_id" = :tid WHERE "tenant_id" IS NULL`,
        { replacements: { tid: tenantId } }
      );
      const count = typeof meta?.rowCount === "number" ? meta.rowCount : 0;
      if (count > 0) touched += 1;
    } catch (err) {
      console.warn(`tenant backfill skipped for ${key}/${tableName}:`, err.message);
    }
  }
  return touched;
}

function listTenantScopedModels(db) {
  return Object.entries(db)
    .filter(([key, model]) => isSequelizeModel(model) && !shouldSkipModel(key, model) && model.rawAttributes?.tenant_id)
    .map(([key, model]) => ({ key, table: tableNameOf(model) }));
}

module.exports = {
  TENANT_SKIP_KEYS,
  TENANT_SKIP_TABLES,
  injectTenantIdAttributes,
  ensureTenantColumns,
  backfillTenantIds,
  isSequelizeModel,
  shouldSkipModel,
  listTenantScopedModels,
  tableNameOf,
};
