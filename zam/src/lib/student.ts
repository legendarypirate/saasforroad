const API = process.env.NEXT_PUBLIC_API_URL || '';

export const STUDENT_API = `${API}/api/student`;

export type StudentStatus = 'applied' | 'active' | 'completed' | 'cancelled';
export type InternshipType = 'internship' | 'thesis' | 'volunteer' | 'other';

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  applied: 'Хүсэлт',
  active: 'Дадлага хийж буй',
  completed: 'Дууссан',
  cancelled: 'Цуцлагдсан',
};

export const STUDENT_STATUS_COLORS: Record<StudentStatus, string> = {
  applied: 'blue',
  active: 'green',
  completed: 'default',
  cancelled: 'red',
};

export const INTERNSHIP_TYPE_LABELS: Record<InternshipType, string> = {
  internship: 'Дадлага',
  thesis: 'Дипломын ажил',
  volunteer: 'Сайн дурын',
  other: 'Бусад',
};

export type StudentRecord = {
  id: number;
  last_name: string;
  first_name: string;
  register_number?: string | null;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  school?: string | null;
  major?: string | null;
  course_year?: number | null;
  student_card_no?: string | null;
  internship_type: InternshipType | string;
  status: StudentStatus | string;
  start_date?: string | null;
  end_date?: string | null;
  project_id?: number | null;
  mentor_user_id?: number | null;
  department?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  notes?: string | null;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  project?: { id: number; name: string; road_name?: string } | null;
  mentor?: { id: number; username: string; phone?: string; position?: string } | null;
};

export type StudentStats = {
  total: number;
  active: number;
  applied: number;
  completed: number;
  cancelled: number;
};

export function studentFullName(s: Pick<StudentRecord, 'last_name' | 'first_name'>) {
  return `${s.last_name || ''} ${s.first_name || ''}`.trim();
}

async function studentFetch<T>(path = '', init?: RequestInit) {
  const res = await fetch(`${STUDENT_API}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  return res.json() as Promise<{ success: boolean; data?: T; message?: string }>;
}

export const studentApi = {
  stats: () => studentFetch<StudentStats>('/stats').then((j) => j.data ?? null),
  list: (params?: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
      });
    }
    const q = sp.toString();
    return studentFetch<StudentRecord[]>(q ? `?${q}` : '').then((j) => j.data ?? []);
  },
  get: (id: number) => studentFetch<StudentRecord>(`/${id}`).then((j) => (j.success ? j.data! : null)),
  create: (body: Record<string, unknown>) =>
    studentFetch<StudentRecord>('/', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Record<string, unknown>) =>
    studentFetch<StudentRecord>(`/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: number) => studentFetch(`/${id}`, { method: 'DELETE' }),
};
