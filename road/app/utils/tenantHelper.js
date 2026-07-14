const db = require("../models");
const { allModuleIds, normalizeModules } = require("./moduleCatalog");

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
  if (!h) return false;
  if (h === configured) return true;
  if (h === "localhost" || h === "127.0.0.1") {
    // Local: treat as platform only when explicit header/query says so,
    // otherwise zam may also run on localhost with a different port.
    return false;
  }
  return false;
}

async function findTenantByDomain(domain) {
  const host = normalizeHost(domain);
  if (!host) return null;

  // Exact primary domain match
  let tenant = await db.tenants.findOne({
    where: { is_active: true, domain: host },
  });
  if (tenant) return tenant;

  // Match aliases stored in domains JSONB array
  const candidates = await db.tenants.findAll({ where: { is_active: true } });
  tenant = candidates.find((t) => {
    const aliases = Array.isArray(t.domains) ? t.domains : [];
    return aliases.map((d) => normalizeHost(d)).includes(host);
  });
  if (tenant) return tenant;

  // Dev fallback: localhost → default tenant
  if (host === "localhost" || host === "127.0.0.1") {
    const slug = process.env.DEFAULT_TENANT_SLUG || "default";
    return db.tenants.findOne({ where: { slug, is_active: true } });
  }

  return null;
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
  return {
    id: json.id,
    name: json.name,
    slug: json.slug,
    domain: json.domain,
    domains: Array.isArray(json.domains) ? json.domains : [],
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
};
