const db = require("../models");
const { allModuleIds, normalizeModules } = require("./moduleCatalog");

function tenantBaseDomain() {
  return String(process.env.TENANT_BASE_DOMAIN || "rcos.mn")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

function saasSubdomainForSlug(slug) {
  const s = String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (!s) return null;
  return `${s}.${tenantBaseDomain()}`;
}

function normalizeHost(host) {
  if (!host) return "";
  return String(host)
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
}

function isPlatformHost(host) {
  const h = normalizeHost(host);
  const configured = String(process.env.PLATFORM_ADMIN_DOMAIN || "admin.rcos.mn")
    .toLowerCase()
    .replace(/^www\./, "");
  const apiHost = String(process.env.PLATFORM_API_DOMAIN || "api.rcos.mn")
    .toLowerCase()
    .replace(/^www\./, "");
  if (!h) return false;
  if (h === configured || h === apiHost) return true;
  if (h === "localhost" || h === "127.0.0.1") {
    return false;
  }
  return false;
}

async function findTenantByDomain(domain) {
  const host = normalizeHost(domain);
  if (!host) return null;

  let tenant = await db.tenants.findOne({
    where: { is_active: true, domain: host },
  });
  if (tenant) return tenant;

  const candidates = await db.tenants.findAll({ where: { is_active: true } });
  tenant = candidates.find((t) => {
    const aliases = Array.isArray(t.domains) ? t.domains : [];
    const all = [t.domain, ...aliases].map((d) => normalizeHost(d));
    return all.includes(host);
  });
  if (tenant) return tenant;

  if (host === "localhost" || host === "127.0.0.1") {
    const slug = process.env.DEFAULT_TENANT_SLUG || "default";
    return db.tenants.findOne({ where: { slug, is_active: true } });
  }

  return null;
}

/**
 * Ensure {slug}.rcos.mn always remains reachable when primary is a custom domain.
 */
function withSaasAlias(slug, primaryDomain, domains) {
  const saas = saasSubdomainForSlug(slug);
  const primary = normalizeHost(primaryDomain);
  const aliases = Array.isArray(domains)
    ? domains.map((d) => normalizeHost(d)).filter(Boolean)
    : [];
  if (saas && primary !== saas && !aliases.includes(saas)) {
    aliases.push(saas);
  }
  return {
    domain: primary || saas,
    domains: [...new Set(aliases.filter((d) => d && d !== (primary || saas)))],
    saas_url: saas ? `https://${saas}` : null,
  };
}

async function resolveTenantFromRequest(req) {
  const headerDomain =
    req.headers["x-tenant-domain"] ||
    req.headers["x-forwarded-host"] ||
    req.headers.host;
  const queryDomain = req.query?.tenant_domain || req.query?.domain;
  return findTenantByDomain(queryDomain || headerDomain);
}

function serializeTenant(tenant) {
  if (!tenant) return null;
  const json = typeof tenant.toJSON === "function" ? tenant.toJSON() : tenant;
  const modules = normalizeModules(json.modules);
  const saas = saasSubdomainForSlug(json.slug);
  return {
    id: json.id,
    name: json.name,
    slug: json.slug,
    domain: json.domain,
    domains: Array.isArray(json.domains) ? json.domains : [],
    saas_domain: saas,
    saas_url: saas ? `https://${saas}` : null,
    is_active: json.is_active,
    modules,
    company_name: json.company_name,
    contact_email: json.contact_email,
    contact_phone: json.contact_phone,
    notes: json.notes,
    settings: json.settings || {},
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
}

module.exports = {
  normalizeHost,
  isPlatformHost,
  findTenantByDomain,
  resolveTenantFromRequest,
  serializeTenant,
  allModuleIds,
  normalizeModules,
  tenantBaseDomain,
  saasSubdomainForSlug,
  withSaasAlias,
};
