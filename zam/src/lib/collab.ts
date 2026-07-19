import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';
export const COLLAB_API = `${API}/api/collab`;

export type CollabRole = 'subcontractor' | 'partner' | 'specialist';
export type JobAdStatus = 'draft' | 'published' | 'closed' | 'filled';
export type CollabRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export const ROLE_LABELS: Record<string, string> = {
  subcontractor: 'Туслан гүйцэтгэгч',
  partner: 'Түнш',
  specialist: 'Мэргэжилтэн',
  owner_primary: 'Үндсэн гүйцэтгэгч',
};

export const AD_STATUS_LABELS: Record<JobAdStatus, string> = {
  draft: 'Ноорог',
  published: 'Нийтэлсэн',
  closed: 'Хаалттай',
  filled: 'Бүрэн',
};

export const AD_STATUS_COLORS: Record<JobAdStatus, string> = {
  draft: 'default',
  published: 'success',
  closed: 'warning',
  filled: 'processing',
};

export const REQUEST_STATUS_LABELS: Record<CollabRequestStatus, string> = {
  pending: 'Хүлээгдэж буй',
  accepted: 'Зөвшөөрсөн',
  rejected: 'Татгалзсан',
  withdrawn: 'Цуцласан',
};

export const REQUEST_STATUS_COLORS: Record<CollabRequestStatus, string> = {
  pending: 'processing',
  accepted: 'success',
  rejected: 'error',
  withdrawn: 'default',
};

export type TenantCard = {
  id: number;
  name: string;
  company_name?: string | null;
  slug?: string | null;
  domain?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  is_active?: boolean;
  active_collaborations?: number;
  open_job_ads?: number;
};

export type JobAd = {
  id: number;
  tenant_id: number;
  project_id: number;
  title: string;
  description?: string | null;
  role_sought: CollabRole | string;
  role_label?: string;
  province?: string | null;
  location?: string | null;
  budget_note?: string | null;
  starts_at?: string | null;
  closes_at?: string | null;
  company_name?: string | null;
  project_name?: string | null;
  status: JobAdStatus;
  published_at?: string | null;
  created_by?: number | null;
  company?: TenantCard | null;
  already_applied?: boolean;
  is_own?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CollabRequest = {
  id: number;
  job_ad_id: number;
  project_id: number;
  from_tenant_id: number;
  to_tenant_id: number;
  requested_role: CollabRole | string;
  role_label?: string;
  message?: string | null;
  status: CollabRequestStatus;
  responded_at?: string | null;
  response_note?: string | null;
  created_by?: number | null;
  job_ad?: Partial<JobAd> | null;
  from_company?: TenantCard | null;
  to_company?: TenantCard | null;
  createdAt?: string;
};

export type ProjectCollaboratorRow = {
  id?: number;
  role: string;
  role_label?: string;
  status?: string;
  company?: TenantCard | null;
  is_owner?: boolean;
  collaborator_tenant_id?: number;
};

function authHeaders(json = false): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const extra: Record<string, string> = {};
  if (json) extra['Content-Type'] = 'application/json';
  if (token) extra['Authorization'] = token;
  return tenantHeaders(extra);
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${COLLAB_API}${path}`, {
    ...init,
    headers: { ...authHeaders(Boolean(init?.body)), ...init?.headers },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Алдаа (${res.status})`);
  }
  return json as T;
}

function qs(params?: Record<string, string | undefined>) {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export const collabApi = {
  marketplace(params?: Record<string, string | undefined>) {
    return req<{ data: JobAd[] }>(`/marketplace${qs(params)}`).then(
      (j) => j.data,
    );
  },
  marketplaceAd(id: number) {
    return req<{ data: JobAd }>(`/marketplace/${id}`).then((j) => j.data);
  },
  myAds(params?: Record<string, string | undefined>) {
    return req<{ data: JobAd[] }>(`/ads${qs(params)}`).then((j) => j.data);
  },
  getAd(id: number) {
    return req<{ data: JobAd }>(`/ads/${id}`).then((j) => j.data);
  },
  createAd(body: Record<string, unknown>) {
    return req<{ data: JobAd }>('/ads', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
  updateAd(id: number, body: Record<string, unknown>) {
    return req<{ data: JobAd }>(`/ads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
  publishAd(id: number) {
    return req<{ data: JobAd }>(`/ads/${id}/publish`, { method: 'POST' }).then(
      (j) => j.data,
    );
  },
  closeAd(id: number, filled = false) {
    return req<{ data: JobAd }>(`/ads/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({ filled }),
    }).then((j) => j.data);
  },
  deleteAd(id: number) {
    return req<{ success: boolean }>(`/ads/${id}`, { method: 'DELETE' });
  },
  apply(id: number, body: { message?: string; requested_role?: string }) {
    return req<{ data: CollabRequest }>(`/ads/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
  incoming(params?: Record<string, string | undefined>) {
    return req<{ data: CollabRequest[] }>(
      `/requests/incoming${qs(params)}`,
    ).then((j) => j.data);
  },
  outgoing(params?: Record<string, string | undefined>) {
    return req<{ data: CollabRequest[] }>(
      `/requests/outgoing${qs(params)}`,
    ).then((j) => j.data);
  },
  accept(id: number, response_note?: string) {
    return req<{ data: CollabRequest }>(`/requests/${id}/accept`, {
      method: 'PATCH',
      body: JSON.stringify({ response_note }),
    }).then((j) => j.data);
  },
  reject(id: number, response_note?: string) {
    return req<{ data: CollabRequest }>(`/requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ response_note }),
    }).then((j) => j.data);
  },
  withdraw(id: number) {
    return req<{ data: CollabRequest }>(`/requests/${id}/withdraw`, {
      method: 'PATCH',
    }).then((j) => j.data);
  },
  projectCollaborators(projectId: number) {
    return req<{
      data: {
        project: { id: number; name?: string; road_name?: string };
        collaborators: ProjectCollaboratorRow[];
      };
    }>(`/projects/${projectId}/collaborators`).then((j) => j.data);
  },
  removeCollaborator(id: number) {
    return req<{ data: unknown }>(`/collaborators/${id}/remove`, {
      method: 'PATCH',
    });
  },
  tenantProfile(id: number) {
    return req<{ data: TenantCard }>(`/tenants/${id}/profile`).then(
      (j) => j.data,
    );
  },
};
