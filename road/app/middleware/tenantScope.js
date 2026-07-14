const { AsyncLocalStorage } = require("async_hooks");
const {
  isSequelizeModel,
  shouldSkipModel,
} = require("../utils/tenantColumns");

const tenantStorage = new AsyncLocalStorage();

function getCurrentTenantId() {
  const store = tenantStorage.getStore();
  return store?.tenantId ?? null;
}

function runWithTenant(tenantId, fn) {
  return tenantStorage.run({ tenantId: tenantId || null }, fn);
}

/**
 * Express middleware: bind req.tenant.id into ALS for the rest of the request.
 */
function bindTenantContext(req, res, next) {
  const tenantId = req.tenant?.id || req.user?.tenant_id || null;
  tenantStorage.run({ tenantId }, () => next());
}

function applyTenantWhere(options, tenantId) {
  if (!tenantId) return options;
  options = options || {};
  options.where = options.where || {};

  if (Object.prototype.hasOwnProperty.call(options.where, "tenant_id")) {
    return options;
  }

  const { Op } = require("sequelize");
  const existing = options.where;
  const isEmpty = Object.keys(existing).length === 0;
  options.where = isEmpty
    ? { tenant_id: tenantId }
    : { [Op.and]: [existing, { tenant_id: tenantId }] };
  return options;
}

/**
 * Register beforeCreate / beforeFind / beforeUpdate / beforeDestroy hooks
 * on every tenant-scoped model.
 */
function registerTenantHooks(db) {
  for (const [key, model] of Object.entries(db)) {
    if (!isSequelizeModel(model)) continue;
    if (shouldSkipModel(key, model)) continue;
    if (!model.rawAttributes?.tenant_id) continue;

    model.addHook("beforeCreate", (instance) => {
      const tenantId = getCurrentTenantId();
      if (tenantId && (instance.tenant_id == null || instance.tenant_id === undefined)) {
        instance.tenant_id = tenantId;
      }
    });

    model.addHook("beforeBulkCreate", (instances) => {
      const tenantId = getCurrentTenantId();
      if (!tenantId || !Array.isArray(instances)) return;
      for (const instance of instances) {
        if (instance.tenant_id == null || instance.tenant_id === undefined) {
          instance.tenant_id = tenantId;
        }
      }
    });

    model.addHook("beforeFind", (options) => {
      if (options?.skipTenantScope) return;
      const tenantId = getCurrentTenantId();
      if (!tenantId) return;
      applyTenantWhere(options, tenantId);
    });

    model.addHook("beforeCount", (options) => {
      if (options?.skipTenantScope) return;
      const tenantId = getCurrentTenantId();
      if (!tenantId) return;
      applyTenantWhere(options, tenantId);
    });

    model.addHook("beforeDestroy", (instance, options) => {
      if (options?.skipTenantScope) return;
      // individual destroy — instance already loaded under scoped find
    });

    model.addHook("beforeBulkUpdate", (options) => {
      if (options?.skipTenantScope) return;
      const tenantId = getCurrentTenantId();
      if (!tenantId) return;
      applyTenantWhere(options, tenantId);
      if (options.attributes && options.attributes.tenant_id === undefined) {
        // prevent accidentally changing tenant_id wholesale
      }
    });

    model.addHook("beforeBulkDestroy", (options) => {
      if (options?.skipTenantScope) return;
      const tenantId = getCurrentTenantId();
      if (!tenantId) return;
      applyTenantWhere(options, tenantId);
    });
  }
}

module.exports = {
  tenantStorage,
  getCurrentTenantId,
  runWithTenant,
  bindTenantContext,
  registerTenantHooks,
};
