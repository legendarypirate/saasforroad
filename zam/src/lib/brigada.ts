const API = process.env.NEXT_PUBLIC_API_URL || '';

export const BRIGADA_API = `${API}/api/brigada`;

export type BrigadeAvailability = 'available' | 'busy' | 'unavailable';
export type BrigadeStatus = 'active' | 'suspended' | 'inactive';
export type HireStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'changes_requested'
  | 'active'
  | 'completed'
  | 'reviewed';

export const AVAILABILITY_LABELS: Record<BrigadeAvailability, string> = {
  available: 'Боломжтой',
  busy: 'Завгүй',
  unavailable: 'Боломжгүй',
};

export const AVAILABILITY_COLORS: Record<BrigadeAvailability, string> = {
  available: 'green',
  busy: 'orange',
  unavailable: 'default',
};

export const BRIGADE_STATUS_LABELS: Record<BrigadeStatus, string> = {
  active: 'Идэвхтэй',
  suspended: 'Түдгэлзүүлсэн',
  inactive: 'Идэвхгүй',
};

export const BRIGADE_STATUS_COLORS: Record<BrigadeStatus, string> = {
  active: 'green',
  suspended: 'red',
  inactive: 'default',
};

export const HIRE_STATUS_LABELS: Record<HireStatus, string> = {
  draft: 'Ноорог',
  sent: 'Илгээсэн',
  accepted: 'Зөвшөөрсөн',
  rejected: 'Татгалзсан',
  changes_requested: 'Өөрчлөлт хүссэн',
  active: 'Идэвхтэй',
  completed: 'Дууссан',
  reviewed: 'Үнэлсэн',
};

export const HIRE_STATUS_COLORS: Record<HireStatus, string> = {
  draft: 'default',
  sent: 'blue',
  accepted: 'cyan',
  rejected: 'red',
  changes_requested: 'orange',
  active: 'green',
  completed: 'purple',
  reviewed: 'gold',
};

export type BrigadeLeader = {
  id: number;
  username: string;
  phone?: string;
  position?: string;
  profile_image?: string;
  image?: string; // legacy alias
};

export type BrigadeMember = {
  id: number;
  brigade_id: number;
  full_name?: string | null;
  phone?: string | null;
  user_id?: number | null;
  position: string;
  skills?: string[];
  experience_years?: number | string | null;
  attendance_rate?: number | string;
  status: string;
  current_assignment?: string | null;
  photo?: string | null;
  username?: string | null;
  user?: BrigadeLeader & { email?: string } | null;
};

export type BrigadeReview = {
  id: number;
  brigade_id: number;
  hire_request_id?: number | null;
  project_id?: number | null;
  reviewer_user_id?: number | null;
  overall_rating: number | string;
  quality: number | string;
  safety: number | string;
  speed: number | string;
  communication: number | string;
  comment?: string | null;
  createdAt?: string;
  reviewer?: BrigadeLeader | null;
  project?: { id: number; name: string } | null;
};

export type BrigadeDocument = {
  id: number;
  brigade_id: number;
  title: string;
  doc_type: string;
  file_url?: string | null;
  expires_at?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export type TimelineEvent = {
  id: number;
  event_type: string;
  title: string;
  description?: string | null;
  createdAt?: string;
  actor?: BrigadeLeader | null;
};

export type HireRequest = {
  id: number;
  brigade_id: number;
  project_id: number;
  requested_by?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  priority: string;
  description?: string | null;
  required_skills?: string[];
  required_equipment?: string[];
  status: HireStatus | string;
  change_request_note?: string | null;
  response_note?: string | null;
  progress?: number | string;
  createdAt?: string;
  project?: { id: number; name: string; road_name?: string; status?: string; progress?: number | string } | null;
  brigade?: { id: number; name: string; logo?: string; leader_user_id?: number } | null;
  requester?: BrigadeLeader | null;
  history?: Array<{
    id: number;
    from_status?: string | null;
    to_status: string;
    note?: string | null;
    createdAt?: string;
  }>;
};

export type BrigadeRecord = {
  id: number;
  name: string;
  logo?: string | null;
  username?: string | null;
  leader_name?: string | null;
  phone?: string | null;
  leader_user_id?: number | null;
  province?: string | null;
  location?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  description?: string | null;
  skills?: string[] | null;
  availability: BrigadeAvailability | string;
  status: BrigadeStatus | string;
  average_rating?: number | string;
  reputation_score?: number | string;
  safety_score?: number | string;
  completed_tasks?: number;
  active_tasks?: number;
  cancelled_tasks?: number;
  completion_rate?: number | string;
  average_delay?: number | string;
  attendance_score?: number | string;
  response_time_hours?: number | string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  leader?: BrigadeLeader | null;
  members?: BrigadeMember[];
  equipmentLinks?: Array<{
    id: number;
    equipment_id: number;
    notes?: string | null;
    equipment?: { id: number; name: string; model?: string; registration_number?: string };
  }>;
  reviews?: BrigadeReview[];
  documents?: BrigadeDocument[];
  timeline?: TimelineEvent[];
  hireRequests?: HireRequest[];
  member_count?: number;
  active_projects?: number;
};

export type BrigadeStats = {
  total: number;
  available: number;
  busy: number;
  active_hire_requests: number;
  completed_tasks: number;
  average_rating: number;
};

export function normalizeSkills(skills?: string[] | null): string[] {
  if (!Array.isArray(skills)) return [];
  return skills.map((s) => String(s || '').trim()).filter(Boolean);
}

export function formatScore(value?: number | string | null, digits = 1) {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

async function brigadaFetch<T>(path = '', init?: RequestInit) {
  const res = await fetch(`${BRIGADA_API}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init?.headers,
    },
  });
  return res.json() as Promise<{
    success: boolean;
    data?: T;
    message?: string;
    meta?: { total: number; page: number; pageSize: number };
  }>;
}

export const brigadaApi = {
  stats: () => brigadaFetch<BrigadeStats>('/stats').then((j) => j.data ?? null),
  list: async (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
      });
    }
    const q = sp.toString();
    const j = await brigadaFetch<BrigadeRecord[]>(q ? `?${q}` : '');
    return { rows: j.data ?? [], meta: j.meta };
  },
  get: (id: number) =>
    brigadaFetch<BrigadeRecord>(`/${id}`).then((j) => (j.success ? j.data! : null)),
  create: (body: Record<string, unknown>) =>
    brigadaFetch<BrigadeRecord>('/', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Record<string, unknown>) =>
    brigadaFetch<BrigadeRecord>(`/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  setStatus: (id: number, status: BrigadeStatus, actor_user_id?: number) =>
    brigadaFetch<BrigadeRecord>(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actor_user_id }),
    }),
  remove: (id: number) => brigadaFetch(`/${id}`, { method: 'DELETE' }),
  uploadLogo: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return brigadaFetch<BrigadeRecord>(`/${id}/logo`, { method: 'POST', body: fd });
  },
  addMember: (id: number, body: Record<string, unknown>) =>
    brigadaFetch(`/${id}/members`, { method: 'POST', body: JSON.stringify(body) }),
  updateMember: (id: number, memberId: number, body: Record<string, unknown>) =>
    brigadaFetch(`/${id}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  removeMember: (id: number, memberId: number) =>
    brigadaFetch(`/${id}/members/${memberId}`, { method: 'DELETE' }),
  addEquipment: (id: number, body: Record<string, unknown>) =>
    brigadaFetch(`/${id}/equipment`, { method: 'POST', body: JSON.stringify(body) }),
  removeEquipment: (id: number, linkId: number) =>
    brigadaFetch(`/${id}/equipment/${linkId}`, { method: 'DELETE' }),
  createHire: (body: Record<string, unknown>) =>
    brigadaFetch<HireRequest>('/hire-requests', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateHireStatus: (hireId: number, body: Record<string, unknown>) =>
    brigadaFetch<HireRequest>(`/hire-requests/${hireId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  listHires: (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
      });
    }
    const q = sp.toString();
    return brigadaFetch<HireRequest[]>(`/hire-requests${q ? `?${q}` : ''}`).then(
      (j) => j.data ?? []
    );
  },
  createReview: (body: Record<string, unknown>) =>
    brigadaFetch<BrigadeReview>('/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  addDocument: (id: number, body: Record<string, unknown>) =>
    brigadaFetch(`/${id}/documents`, { method: 'POST', body: JSON.stringify(body) }),
  removeDocument: (id: number, docId: number) =>
    brigadaFetch(`/${id}/documents/${docId}`, { method: 'DELETE' }),
};
