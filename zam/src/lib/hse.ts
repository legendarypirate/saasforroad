const API = process.env.NEXT_PUBLIC_API_URL || '';

async function hseFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(`${API}/api/hse${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json = await res.json();
  return json.success ? json.data : null;
}

export type HseDashboard = {
  date: string;
  daily_instruction: {
    total_employees: number;
    completed_today: number;
    not_completed: number;
    completion_percentage: number;
  };
  widgets: {
    open_observations: number;
    near_miss_count: number;
    open_incidents: number;
    pending_corrective_actions: number;
    expired_certificates: number;
    expired_ppe: number;
    upcoming_inspections: number;
    active_permits: number;
  };
};

export type DailyInstruction = {
  id: number;
  title: string;
  content: string;
  version: number;
  project_id?: number | null;
  department?: string | null;
  publish_date: string;
  expiry_date?: string | null;
  status: string;
  project?: { id: number; name: string } | null;
  creator?: { id: number; username: string } | null;
};

export type InstructionCompletion = {
  date: string;
  total_employees: number;
  completed: number;
  not_completed: number;
  completion_percentage: number;
  completed_users: unknown[];
  pending_users: Array<{ id: number; username: string; phone?: string; position?: string }>;
  by_project: unknown[];
};

export const INCIDENT_TYPES = [
  { value: 'first_aid', label: 'Эхний тусламж' },
  { value: 'medical_treatment', label: 'Эмчилгээ' },
  { value: 'vehicle_accident', label: 'Тээврийн осол' },
  { value: 'property_damage', label: 'Эд хөрөнгийн хохирол' },
  { value: 'environmental', label: 'Байгаль орчны осол' },
  { value: 'lti', label: 'Ажлын хугацаа алдсан осол' },
];

export const PERMIT_TYPES = [
  { value: 'hot_work', label: 'Галын ажил' },
  { value: 'excavation', label: 'Ухалт' },
  { value: 'confined_space', label: 'Хязгаарлагдмал орчин' },
  { value: 'electrical', label: 'Цахилгаан' },
  { value: 'lifting', label: 'Өргөгч' },
  { value: 'working_at_height', label: 'Өндөрт ажиллах' },
];

export const OBSERVATION_TYPES = [
  { value: 'unsafe_condition', label: 'Аюултай нөхцөл' },
  { value: 'unsafe_act', label: 'Аюултай үйлдэл' },
  { value: 'good_practice', label: 'Сайн туршлага' },
];

export async function fetchHseDashboard(date?: string): Promise<HseDashboard | null> {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  return hseFetch<HseDashboard>(`/dashboard${q}`);
}

export async function fetchDailyInstructions(): Promise<DailyInstruction[]> {
  return (await hseFetch<DailyInstruction[]>('/daily-instructions')) || [];
}

export async function createDailyInstruction(body: Partial<DailyInstruction> & { created_by?: number }) {
  const res = await fetch(`${API}/api/hse/daily-instructions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json.success ? json.data : null;
}

export async function updateDailyInstruction(id: number, body: Partial<DailyInstruction> & { updated_by?: number }) {
  const res = await fetch(`${API}/api/hse/daily-instructions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json.success ? json.data : null;
}

export async function deleteDailyInstruction(id: number) {
  const res = await fetch(`${API}/api/hse/daily-instructions/${id}`, { method: 'DELETE' });
  const json = await res.json();
  return json.success === true;
}

export async function fetchInstructionCompletion(date?: string): Promise<InstructionCompletion | null> {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  return hseFetch<InstructionCompletion>(`/daily-instructions/completion${q}`);
}

export async function fetchHseList<T>(resource: string): Promise<T[]> {
  return (await hseFetch<T[]>(`/${resource}`)) || [];
}

export async function createHseRecord<T>(resource: string, body: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(`${API}/api/hse/${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json.success ? json.data : null;
}

export async function updateHseRecord<T>(resource: string, id: number, body: Record<string, unknown>): Promise<T | null> {
  const res = await fetch(`${API}/api/hse/${resource}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json.success ? json.data : null;
}

export async function deleteHseRecord(resource: string, id: number) {
  const res = await fetch(`${API}/api/hse/${resource}/${id}`, { method: 'DELETE' });
  const json = await res.json();
  return json.success === true;
}

export async function fetchHseReport(type: string, from?: string, to?: string) {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  return hseFetch<unknown>(`/reports/${type}?${q.toString()}`);
}

export async function fetchProjects(): Promise<Array<{ id: number; name: string }>> {
  const res = await fetch(`${API}/api/project`);
  const json = await res.json();
  return json.success ? json.data || [] : [];
}

export async function fetchUsers(): Promise<Array<{ id: number; username: string }>> {
  const res = await fetch(`${API}/api/user`);
  const json = await res.json();
  return json.success ? json.data || [] : [];
}

export async function fetchEquipment(): Promise<Array<{ id: number; name: string }>> {
  const res = await fetch(`${API}/api/equipment`);
  const json = await res.json();
  return json.success ? json.data || [] : [];
}
