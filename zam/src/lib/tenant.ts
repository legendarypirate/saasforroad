const API = process.env.NEXT_PUBLIC_API_URL || '';
const TENANT_KEY = 'tenant';

export type TenantInfo = {
  id: number;
  name: string;
  slug: string;
  domain: string;
  modules: string[];
  company_name?: string | null;
  is_active?: boolean;
};

/** Current browser host used as tenant domain (prod: tenant1.mn). */
export function getTenantDomain(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'localhost';
  }
  return (
    process.env.NEXT_PUBLIC_TENANT_DOMAIN ||
    window.location.hostname.replace(/^www\./, '')
  );
}

export function tenantHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    'X-Tenant-Domain': getTenantDomain(),
  };
  if (extra) {
    const e = new Headers(extra);
    e.forEach((v, k) => {
      headers[k] = v;
    });
  }
  return headers;
}

export function getStoredTenant(): TenantInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TENANT_KEY);
    return raw ? (JSON.parse(raw) as TenantInfo) : null;
  } catch {
    return null;
  }
}

export function setStoredTenant(tenant: TenantInfo | null) {
  if (typeof window === 'undefined') return;
  if (!tenant) {
    localStorage.removeItem(TENANT_KEY);
    return;
  }
  localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
}

export async function fetchCurrentTenant(): Promise<TenantInfo | null> {
  try {
    const res = await fetch(`${API}/api/tenant/current`, {
      headers: tenantHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !data.tenant) return null;
    setStoredTenant(data.tenant);
    return data.tenant as TenantInfo;
  } catch {
    return getStoredTenant();
  }
}

/** Module ids enabled for this tenant (empty => treat as all allowed by RBAC only). */
export function getEnabledModuleIds(): string[] | null {
  const tenant = getStoredTenant();
  if (!tenant?.modules?.length) return null;
  return tenant.modules;
}
