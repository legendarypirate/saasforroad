const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3201";

const TOKEN_KEY = "platform_token";
const ADMIN_KEY = "platform_admin";

export type PlatformAdmin = {
  id: number;
  username: string;
  name?: string | null;
  email?: string | null;
};

export type Tenant = {
  id: number;
  name: string;
  slug: string;
  domain: string;
  domains: string[];
  saas_domain?: string | null;
  saas_url?: string | null;
  is_active: boolean;
  modules: string[];
  company_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  user_count?: number;
  role_count?: number;
  superadmin?: {
    id: number;
    username: string;
    email?: string | null;
    phone?: string | null;
    name?: string | null;
  } | null;
};

export type ModuleInfo = {
  id: string;
  key: string;
  label: string;
};

export type TenantRole = {
  id: number;
  name: string;
  description?: string | null;
  mobile_access?: boolean;
  permission_keys: string[];
  permission_ids: number[];
};

export type Permission = {
  id: number;
  key: string;
  module?: string;
  action?: string;
  level?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, admin: PlatformAdmin) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export function getStoredAdmin(): PlatformAdmin | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? (JSON.parse(raw) as PlatformAdmin) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ success: boolean; token: string; admin: PlatformAdmin }>(
      "/api/platform/auth/login",
      { method: "POST", body: JSON.stringify({ username, password }) }
    ),

  me: () =>
    request<{ success: boolean; admin: PlatformAdmin }>("/api/platform/auth/me"),

  listModules: () =>
    request<{ success: boolean; modules: ModuleInfo[]; allIds: string[] }>(
      "/api/platform/modules"
    ),

  listPermissions: () =>
    request<{ success: boolean; permissions: Permission[] }>(
      "/api/platform/permissions"
    ),

  listTenants: () =>
    request<{ success: boolean; tenants: Tenant[] }>("/api/platform/tenants"),

  getTenant: (id: number) =>
    request<{ success: boolean; tenant: Tenant }>(`/api/platform/tenants/${id}`),

  createTenant: (body: Record<string, unknown>) =>
    request<{ success: boolean; tenant: Tenant; superadmin?: unknown }>(
      "/api/platform/tenants",
      { method: "POST", body: JSON.stringify(body) }
    ),

  updateTenant: (id: number, body: Record<string, unknown>) =>
    request<{ success: boolean; tenant: Tenant }>(`/api/platform/tenants/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  updateModules: (id: number, modules: string[]) =>
    request<{ success: boolean; tenant: Tenant }>(
      `/api/platform/tenants/${id}/modules`,
      { method: "PUT", body: JSON.stringify({ modules }) }
    ),

  setSuperadmin: (
    id: number,
    body: { username: string; password: string; email?: string; phone?: string; name?: string }
  ) =>
    request<{ success: boolean; superadmin: Tenant["superadmin"] }>(
      `/api/platform/tenants/${id}/superadmin`,
      { method: "POST", body: JSON.stringify(body) }
    ),

  listRoles: (id: number) =>
    request<{ success: boolean; roles: TenantRole[] }>(
      `/api/platform/tenants/${id}/roles`
    ),

  updateRolePermissions: (
    tenantId: number,
    roleId: number,
    permission_keys: string[]
  ) =>
    request<{ success: boolean; role: TenantRole }>(
      `/api/platform/tenants/${tenantId}/roles/${roleId}/permissions`,
      { method: "PUT", body: JSON.stringify({ permission_keys }) }
    ),

  listUsers: (id: number) =>
    request<{ success: boolean; users: Array<Record<string, unknown>> }>(
      `/api/platform/tenants/${id}/users`
    ),
};
