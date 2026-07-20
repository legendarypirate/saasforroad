import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';

async function roadFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(`${API}/api/road-engineering${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...tenantHeaders(), ...init?.headers },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа гарлаа');
  return json.data as T;
}

export type RoadProject = {
  id: number;
  code: string;
  name: string;
  road_class?: string;
  description?: string;
  province?: string;
  district?: string;
  start_station?: number;
  end_station?: number;
  length?: number;
  status: string;
  progress?: number;
  designer?: string;
  contractor?: string;
  consultant?: string;
  start_date?: string;
  end_date?: string;
};

export type Alignment = {
  id: number;
  project_id: number;
  name: string;
  type: string;
  length?: number;
  start_station?: number;
  end_station?: number;
  project?: { id: number; code: string; name: string };
};

export type VerticalAlignment = {
  id: number;
  alignment_id: number;
  name: string;
  design_speed?: number;
  min_grade?: number;
  max_grade?: number;
  alignment?: { id: number; name: string; project_id: number };
};

export type VerticalPi = {
  id: number;
  vertical_alignment_id: number;
  station: number;
  elevation: number;
  curve_type?: string;
  curve_length?: number;
  curve_radius?: number;
  grade_in?: number;
  grade_out?: number;
};

export type ProfileSeriesPoint = {
  station: number;
  ground_elevation: number | null;
  design_elevation: number;
  cut: number;
  fill: number;
  grade?: number | null;
};

export type RoadDashboard = {
  cards: {
    projects: number;
    road_length: number;
    earthwork_cut: number;
    earthwork_fill: number;
    structures: number;
    cross_sections: number;
    survey_points: number;
  };
  recent_projects: RoadProject[];
  charts: {
    progress: Array<{ name: string; progress: number }>;
    earthwork_balance: Array<{ name: string; value: number }>;
    length_by_status: Array<{ status: string; count: number; length: number }>;
  };
};

export const ROAD_STATUSES = [
  { value: 'draft', label: 'Ноорог' },
  { value: 'survey', label: 'Хэмжилт' },
  { value: 'design', label: 'Зураг төсөл' },
  { value: 'review', label: 'Хяналт' },
  { value: 'approved', label: 'Батлагдсан' },
  { value: 'construction', label: 'Барилга' },
  { value: 'archived', label: 'Архив' },
];

export const ROAD_CLASSES = [
  { value: 'I', label: 'I анги' },
  { value: 'II', label: 'II анги' },
  { value: 'III', label: 'III анги' },
  { value: 'IV', label: 'IV анги' },
  { value: 'expressway', label: 'Хурдны зам' },
];

export const DRAINAGE_TYPES = [
  { value: 'culvert', label: 'Culvert' },
  { value: 'pipe', label: 'Хоолой' },
  { value: 'ditch', label: 'Шуудуу' },
  { value: 'bridge_drain', label: 'Гүүрийн ус зайлуулалт' },
];

export const STRUCTURE_TYPES = [
  { value: 'bridge', label: 'Гүүр' },
  { value: 'box_culvert', label: 'Box culvert' },
  { value: 'retaining_wall', label: 'Түлхэлтийн хана' },
  { value: 'underpass', label: 'Дэд гарц' },
];

export function formatStation(station: number | string | null | undefined) {
  const s = Number(station) || 0;
  const km = Math.floor(s / 1000);
  const m = (s % 1000).toFixed(0).padStart(3, '0');
  return `${km}+${m}`;
}

export async function fetchRoadList<T>(resource: string, params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
  }
  const q = qs.toString();
  const data = await roadFetch<T[]>(`/${resource}${q ? `?${q}` : ''}`);
  return data ?? [];
}

export async function createRoadRecord<T>(resource: string, body: Record<string, unknown>) {
  return roadFetch<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function updateRoadRecord<T>(resource: string, id: number, body: Record<string, unknown>) {
  return roadFetch<T>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteRoadRecord(resource: string, id: number) {
  await roadFetch(`/${resource}/${id}`, { method: 'DELETE' });
  return true;
}

export async function fetchRoadDashboard() {
  return roadFetch<RoadDashboard>('/dashboard');
}

export async function fetchProjects(params?: Record<string, string | number | undefined>) {
  return fetchRoadList<RoadProject>('projects', params);
}

export async function duplicateProject(id: number) {
  return roadFetch<RoadProject>(`/projects/${id}/duplicate`, { method: 'POST', body: '{}' });
}

export async function archiveProject(id: number) {
  return roadFetch<RoadProject>(`/projects/${id}/archive`, { method: 'PATCH', body: '{}' });
}

export async function importSurveyPoints(alignmentId: number, points: Record<string, unknown>[]) {
  return roadFetch<{ inserted: number; duplicates: number; invalid: number }>(
    '/survey-points/import',
    { method: 'POST', body: JSON.stringify({ alignment_id: alignmentId, points }) },
  );
}

export async function fetchProfileChart(vaId: number) {
  return roadFetch<{
    verticalAlignment: VerticalAlignment;
    pis: VerticalPi[];
    series: ProfileSeriesPoint[];
    ground: Array<{ station: number; ground_elevation: number }>;
  }>(`/vertical-alignments/${vaId}/profile-chart`);
}

export async function recalculateVertical(vaId: number, step = 25) {
  return roadFetch<{ pis: VerticalPi[]; designPoints: unknown[] }>(
    `/vertical-alignments/${vaId}/recalculate`,
    { method: 'POST', body: JSON.stringify({ step }) },
  );
}

export async function calculateEarthwork(body: {
  alignment_id: number;
  interval?: number;
  road_width?: number;
}) {
  return roadFetch<{
    rows: unknown[];
    summary: {
      total_cut: number;
      total_fill: number;
      net_volume: number;
      borrow: number;
      waste: number;
    };
  }>('/earthworks/calculate', { method: 'POST', body: JSON.stringify(body) });
}

export async function generateCrossSections(body: {
  alignment_id: number;
  interval?: number;
  road_width?: number;
  lane_count?: number;
  shoulder_width?: number;
}) {
  return roadFetch('/cross-sections/generate', { method: 'POST', body: JSON.stringify(body) });
}

export async function fetchReport(type: string, params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
  }
  const q = qs.toString();
  return roadFetch<unknown>(`/reports/${type}${q ? `?${q}` : ''}`);
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const lines = [
    keys.join(','),
    ...rows.map((r) =>
      keys
        .map((k) => {
          const v = r[k];
          const s = v == null ? '' : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const BUDGET_CATEGORIES = [
  { value: 'mobilization', label: 'Зөөвөр / бэлтгэл' },
  { value: 'earthwork', label: 'Шорооны ажил' },
  { value: 'subgrade', label: 'Доод суурь' },
  { value: 'pavement', label: 'Хучилт' },
  { value: 'drainage', label: 'Ус зайлуулалт' },
  { value: 'structure', label: 'Байгууламж' },
  { value: 'roadside', label: 'Хажуу / аюулгүй байдал' },
  { value: 'temporary', label: 'Түр ажил' },
  { value: 'survey', label: 'Хэмжилт / зураг төсөл' },
  { value: 'other', label: 'Бусад' },
];

export const BUDGET_STATUSES = [
  { value: 'draft', label: 'Ноорог' },
  { value: 'review', label: 'Хяналт' },
  { value: 'approved', label: 'Батлагдсан' },
  { value: 'revised', label: 'Засварласан' },
];

export type RoadBudget = {
  id: number;
  project_id: number;
  code: string;
  name: string;
  version: number;
  status: string;
  currency: string;
  base_amount: number;
  contingency_pct: number;
  contingency_amount: number;
  overhead_pct: number;
  overhead_amount: number;
  profit_pct: number;
  profit_amount: number;
  vat_pct: number;
  vat_amount: number;
  total_amount: number;
  cost_per_km?: number;
  road_length_m?: number;
  estimate_method?: string;
  notes?: string;
  prepared_by?: string;
  approved_by?: string;
  project?: { id: number; code: string; name: string; length?: number };
  items?: RoadBudgetItem[];
  assumptions?: Array<{ key: string; label: string; value?: string; unit?: string }>;
  category_summary?: Array<{ category: string; label: string; amount: number; count: number }>;
};

export type RoadBudgetItem = {
  id: number;
  budget_id: number;
  category: string;
  code?: string;
  description: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  source?: string;
  remarks?: string;
};

export type RoadBudgetRate = {
  id: number;
  code: string;
  category: string;
  name: string;
  unit: string;
  unit_price: number;
  is_active?: boolean;
  remarks?: string;
};

export function formatMnt(n: number | string | null | undefined) {
  const v = Number(n) || 0;
  return `${v.toLocaleString('mn-MN', { maximumFractionDigits: 0 })} ₮`;
}

export async function fetchBudgetDashboard() {
  return roadFetch<{
    cards: {
      budgets: number;
      projects: number;
      active_rates: number;
      approved: number;
      total_estimate: number;
      avg_cost_per_km: number;
    };
    by_status: Record<string, number>;
    recent: RoadBudget[];
    categories: Record<string, string>;
  }>('/budget/dashboard');
}

export async function fetchBudgets(params?: Record<string, string | number | undefined>) {
  return fetchRoadList<RoadBudget>('budgets', params);
}

export async function fetchBudget(id: number) {
  return roadFetch<RoadBudget>(`/budgets/${id}`);
}

export async function createBudget(body: Record<string, unknown>) {
  return roadFetch<RoadBudget>('/budgets', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateBudget(id: number, body: Record<string, unknown>) {
  return roadFetch<RoadBudget>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteBudget(id: number) {
  return deleteRoadRecord('budgets', id);
}

export async function estimateBudget(id: number) {
  return roadFetch<{
    generated_lines: number;
    summary: { cut: number; fill: number; haul: number; length_m: number; total: number; cost_per_km: number };
  }>(`/budgets/${id}/estimate`, { method: 'POST', body: '{}' });
}

export async function approveBudget(id: number, approved_by?: string) {
  return roadFetch<RoadBudget>(`/budgets/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ approved_by }),
  });
}

export async function duplicateBudget(id: number) {
  return roadFetch<RoadBudget>(`/budgets/${id}/duplicate`, { method: 'POST', body: '{}' });
}

export async function fetchBudgetRates(params?: Record<string, string | number | undefined>) {
  return fetchRoadList<RoadBudgetRate>('budget/rates', params);
}

export async function createBudgetItem(body: Record<string, unknown>) {
  return roadFetch<RoadBudgetItem>('/budget-items', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateBudgetItem(id: number, body: Record<string, unknown>) {
  return roadFetch<RoadBudgetItem>(`/budget-items/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteBudgetItem(id: number) {
  return deleteRoadRecord('budget-items', id);
}

