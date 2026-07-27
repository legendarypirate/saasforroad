import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';
export const DRIVER_JOBS_API = `${API}/api/driver-jobs`;

export type DriverJobStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'closed';

export type DriverJobApplicationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export const OPENING_STATUS_LABELS: Record<DriverJobStatus, string> = {
  draft: 'Ноорог',
  pending: 'Хяналтад',
  approved: 'Батлагдсан',
  rejected: 'Татгалзсан',
  closed: 'Хаалттай',
};

export const OPENING_STATUS_COLORS: Record<DriverJobStatus, string> = {
  draft: 'default',
  pending: 'processing',
  approved: 'success',
  rejected: 'error',
  closed: 'warning',
};

export const APPLICATION_STATUS_LABELS: Record<
  DriverJobApplicationStatus,
  string
> = {
  pending: 'Хүлээгдэж буй',
  accepted: 'Зөвшөөрсөн',
  rejected: 'Татгалзсан',
  withdrawn: 'Цуцласан',
};

export type DriverJobOpening = {
  id: number;
  tenant_id: number;
  project_id?: number | null;
  title: string;
  description?: string | null;
  position_type: string;
  province?: string | null;
  location?: string | null;
  salary_note?: string | null;
  requirements?: string | null;
  headcount: number;
  closes_at?: string | null;
  company_name?: string | null;
  project_name?: string | null;
  status: DriverJobStatus;
  admin_note?: string | null;
  published_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DriverJobApplication = {
  id: number;
  opening_id: number;
  driver_id: number;
  message?: string | null;
  status: DriverJobApplicationStatus;
  response_note?: string | null;
  responded_at?: string | null;
  driver?: {
    id: number;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    vehicle_label?: string | null;
    plate_number?: string | null;
  } | null;
  opening?: { id: number; title: string; status: string } | null;
  createdAt?: string;
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
  const res = await fetch(`${DRIVER_JOBS_API}${path}`, {
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

export const driverJobsApi = {
  openings(params?: Record<string, string | undefined>) {
    return req<{ data: DriverJobOpening[] }>(`/openings${qs(params)}`).then(
      (j) => j.data,
    );
  },
  getOpening(id: number) {
    return req<{ data: DriverJobOpening }>(`/openings/${id}`).then(
      (j) => j.data,
    );
  },
  createOpening(body: Record<string, unknown>) {
    return req<{ data: DriverJobOpening }>('/openings', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
  updateOpening(id: number, body: Record<string, unknown>) {
    return req<{ data: DriverJobOpening }>(`/openings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
  submitOpening(id: number) {
    return req<{ data: DriverJobOpening }>(`/openings/${id}/submit`, {
      method: 'POST',
    }).then((j) => j.data);
  },
  closeOpening(id: number) {
    return req<{ data: DriverJobOpening }>(`/openings/${id}/close`, {
      method: 'POST',
    }).then((j) => j.data);
  },
  deleteOpening(id: number) {
    return req<{ success: boolean }>(`/openings/${id}`, { method: 'DELETE' });
  },
  applications(params?: Record<string, string | undefined>) {
    return req<{ data: DriverJobApplication[] }>(
      `/applications${qs(params)}`,
    ).then((j) => j.data);
  },
  respondApplication(
    id: number,
    body: { status: 'accepted' | 'rejected'; response_note?: string },
  ) {
    return req<{ data: DriverJobApplication }>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
};
