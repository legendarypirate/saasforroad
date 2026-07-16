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

export type PlatformLandingItem = {
  id: string;
  label: string;
  blurb: string;
  enabled: boolean;
};

export type PlatformLandingStat = {
  value: string;
  label: string;
};

export type PlatformLandingStep = {
  title: string;
  text: string;
};

export type PlatformLandingContent = {
  brand_name: string;
  tagline: string;
  meta_title: string;
  meta_description: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image: string;
  hero_images: string[];
  cta_primary_label: string;
  cta_primary_url: string;
  cta_secondary_label: string;
  cta_secondary_url: string;
  stats: PlatformLandingStat[];
  modules_title: string;
  modules_subtitle: string;
  modules: PlatformLandingItem[];
  data_title: string;
  data_subtitle: string;
  data_items: PlatformLandingItem[];
  steps_title: string;
  steps: PlatformLandingStep[];
  footer_text: string;
  contact_email: string;
  admin_url: string;
};

export type Permission = {
  id: number;
  key: string;
  module?: string;
  action?: string;
  level?: string;
};

export type PlatformDataKind = {
  id: string;
  label: string;
  labelEn: string;
};

export type PlatformDataEntry = {
  id: number;
  kind: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  province?: string | null;
  location?: string | null;
  description?: string | null;
  meta?: Record<string, unknown>;
  image?: string | null;
  status: string;
  is_active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PlatformBrigade = {
  id: number;
  name: string;
  username?: string | null;
  leader_name?: string | null;
  phone?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  province?: string | null;
  location?: string | null;
  description?: string | null;
  skills?: string[];
  availability?: string;
  status: string;
  is_active: boolean;
  logo?: string | null;
  average_rating?: number;
  reputation_score?: number;
  completed_tasks?: number;
  active_tasks?: number;
  createdAt?: string;
  updatedAt?: string;
};

export const PLATFORM_DATA_KINDS: PlatformDataKind[] = [
  { id: "brigada", label: "Бригад", labelEn: "Brigade" },
  { id: "job-seeker", label: "Ажил горилогч", labelEn: "Job seeker" },
  { id: "factory", label: "Үйлдвэр", labelEn: "Factory" },
  { id: "student", label: "Оюутан", labelEn: "Student" },
  { id: "laboratory", label: "Лаборатори", labelEn: "Laboratory" },
  { id: "technique", label: "Техник", labelEn: "Technique" },
  { id: "road-sign", label: "Замын тэмдэг", labelEn: "Road sign" },
];

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

function handleAuthFailure(message?: string, status?: number) {
  const text = String(message || "").toLowerCase();
  const expired =
    status === 401 ||
    status === 403 ||
    text.includes("invalid or expired token") ||
    text.includes("no token provided") ||
    text.includes("platform admin token required");

  if (!expired || typeof window === "undefined") return;
  clearSession();
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
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
    handleAuthFailure(data.message, res.status);
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

  getLanding: () =>
    request<{ success: boolean; data: PlatformLandingContent }>(
      "/api/platform/landing/admin"
    ),

  updateLanding: (content: PlatformLandingContent) =>
    request<{ success: boolean; data: PlatformLandingContent }>(
      "/api/platform/landing",
      { method: "PUT", body: JSON.stringify(content) }
    ),

  uploadLandingImage: async (file: File) => {
    const token = getToken();
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`${API}/api/platform/landing/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      handleAuthFailure(data.message, res.status);
      throw new Error(data.message || `Upload failed (${res.status})`);
    }
    return data as {
      success: boolean;
      data: { url: string; path: string };
    };
  },

  listData: (kind?: string) => {
    const q = kind ? `?kind=${encodeURIComponent(kind)}` : "";
    return request<{
      success: boolean;
      kinds: PlatformDataKind[];
      entries: PlatformDataEntry[];
    }>(`/api/platform/data${q}`);
  },

  createData: (body: Partial<PlatformDataEntry> & { kind: string; name: string }) =>
    request<{ success: boolean; entry: PlatformDataEntry }>("/api/platform/data", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateData: (id: number, body: Partial<PlatformDataEntry>) =>
    request<{ success: boolean; entry: PlatformDataEntry }>(
      `/api/platform/data/${id}`,
      { method: "PUT", body: JSON.stringify(body) }
    ),

  deleteData: (id: number) =>
    request<{ success: boolean }>(`/api/platform/data/${id}`, {
      method: "DELETE",
    }),

  listBrigades: (params?: { q?: string; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.status) sp.set("status", params.status);
    const q = sp.toString() ? `?${sp}` : "";
    return request<{
      success: boolean;
      brigades: PlatformBrigade[];
      total: number;
    }>(`/api/platform/brigades${q}`);
  },

  setBrigadeStatus: (
    id: number,
    body: { status?: "active" | "inactive" | "suspended"; is_active?: boolean }
  ) =>
    request<{ success: boolean; brigade: PlatformBrigade }>(
      `/api/platform/brigades/${id}/status`,
      { method: "PATCH", body: JSON.stringify(body) }
    ),
};
