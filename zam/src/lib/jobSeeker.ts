const API = process.env.NEXT_PUBLIC_API_URL || '';

export const JOB_SEEKER_API = `${API}/api/job-seeker`;

export type JobSeeker = {
  id: number;
  user_id?: number | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  province?: string | null;
  desired_role?: string | null;
  experience_years?: number;
  education?: string | null;
  skills?: string[] | null;
  about?: string | null;
  salary_expect?: number | null;
  is_available?: boolean;
  category?: { id: number; name: string; slug: string } | null;
  hire_requests?: HireRequest[];
  updatedAt?: string;
};

export type HireRequest = {
  id: number;
  candidate_id: number;
  employer_name: string;
  job_title?: string | null;
  message?: string | null;
  status: string;
  requested_by?: string | null;
  responded_at?: string | null;
  createdAt?: string;
  candidate?: JobSeeker;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${JOB_SEEKER_API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа');
  return json as T;
}

export const jobSeekerApi = {
  list(params?: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
    }
    const q = qs.toString();
    return api<{ data: JobSeeker[] }>(q ? `?${q}` : '').then((j) => j.data);
  },
  get(id: number) {
    return api<{ data: JobSeeker }>(`/${id}`).then((j) => j.data);
  },
  sendHireRequest(
    id: number,
    body: {
      employer_name: string;
      job_title?: string;
      message?: string;
      requested_by?: string;
    },
  ) {
    return api<{ data: HireRequest; message?: string }>(`/${id}/hire-request`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  hireRequests(params?: { status?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return api<{ data: HireRequest[] }>(`/hire-requests${q ? `?${q}` : ''}`).then((j) => j.data);
  },
};
