import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export const JOB_SEEKER_API = `${API}/api/job-seekers`;

export type JobSeekerSchool = {
  id: number;
  school_name: string;
  major?: string | null;
  degree?: string | null;
  start_year?: string | null;
  graduation_year?: string | null;
  description?: string | null;
};

export type JobSeekerFamily = {
  id: number;
  full_name: string;
  relation?: string | null;
  phone?: string | null;
  job?: string | null;
  workplace?: string | null;
};

export type OfferStatus = 'sent' | 'accepted' | 'rejected' | 'withdrawn';
export type ApplicationStatus =
  | 'pending'
  | 'reviewed'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type JobOffer = {
  id: number;
  job_seeker_id: number;
  employer_name?: string | null;
  job_title?: string | null;
  message?: string | null;
  salary_offer?: number | string | null;
  start_date?: string | null;
  status: OfferStatus;
  response_note?: string | null;
  responded_at?: string | null;
  requested_by?: number | null;
  createdAt?: string;
  job_seeker?: Partial<JobSeeker> | null;
};

export type JobApplication = {
  id: number;
  job_seeker_id: number;
  position?: string | null;
  message?: string | null;
  status: ApplicationStatus;
  response_note?: string | null;
  responded_at?: string | null;
  createdAt?: string;
  job_seeker?: Partial<JobSeeker> | null;
};

export type JobSeeker = {
  id: number;
  username?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  photo?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  register_number?: string | null;
  province?: string | null;
  location?: string | null;
  desired_role?: string | null;
  experience_years?: number | string;
  education_level?: string | null;
  skills?: string[] | null;
  about?: string | null;
  salary_expect?: number | string | null;
  is_available?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  schools?: JobSeekerSchool[];
  family?: JobSeekerFamily[];
  offers?: JobOffer[];
  applications?: JobApplication[];
};

export const OFFER_STATUS_LABELS: Record<string, string> = {
  sent: 'Илгээсэн',
  accepted: 'Зөвшөөрсөн',
  rejected: 'Татгалзсан',
  withdrawn: 'Цуцалсан',
};

export const OFFER_STATUS_COLORS: Record<string, string> = {
  sent: 'blue',
  accepted: 'green',
  rejected: 'red',
  withdrawn: 'default',
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Хүлээгдэж буй',
  reviewed: 'Хянасан',
  accepted: 'Зөвшөөрсөн',
  rejected: 'Татгалзсан',
  withdrawn: 'Цуцалсан',
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  pending: 'gold',
  reviewed: 'blue',
  accepted: 'green',
  rejected: 'red',
  withdrawn: 'default',
};

export const EDUCATION_LABELS: Record<string, string> = {
  secondary: 'Бүрэн дунд',
  vocational: 'Мэргэжлийн',
  bachelor: 'Бакалавр',
  master: 'Магистр',
  doctorate: 'Доктор',
};

export const RELATION_LABELS: Record<string, string> = {
  father: 'Аав',
  mother: 'Ээж',
  spouse: 'Гэр бүл',
  sibling: 'Ах/эгч/дүү',
  child: 'Хүүхэд',
  other: 'Бусад',
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
  const res = await fetch(`${JOB_SEEKER_API}${path}`, {
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

export const jobSeekerApi = {
  list(params?: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
    }
    const q = qs.toString();
    return req<{ data: JobSeeker[] }>(q ? `?${q}` : '').then((j) => j.data);
  },
  get(id: number) {
    return req<{ data: JobSeeker }>(`/${id}`).then((j) => j.data);
  },
  createOffer(
    id: number,
    body: {
      job_title?: string;
      message?: string;
      salary_offer?: number | null;
      start_date?: string | null;
    },
  ) {
    return req<{ data: JobOffer }>(`/${id}/offers`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
  updateOffer(offerId: number, body: Record<string, unknown>) {
    return req<{ data: JobOffer }>(`/offers/${offerId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
  offers() {
    return req<{ data: JobOffer[] }>(`/offers`).then((j) => j.data);
  },
  applications() {
    return req<{ data: JobApplication[] }>(`/applications`).then((j) => j.data);
  },
  respondToApplication(
    appId: number,
    body: { status: ApplicationStatus; response_note?: string },
  ) {
    return req<{ data: JobApplication }>(`/applications/${appId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
};
