const API = process.env.NEXT_PUBLIC_API_URL || '';

async function projectFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа гарлаа');
  return (json.data ?? json) as T;
}

export const PROJECT_STATUS = {
  PLANNED: 1,
  ACTIVE: 2,
  DONE: 3,
  ARCHIVED: 4,
} as const;

export const PROJECT_STATUS_META: Record<
  number,
  { label: string; color: string; dot: string }
> = {
  1: { label: 'Төлөвлөсөн', color: 'blue', dot: 'bg-sky-500' },
  2: { label: 'Явагдаж буй', color: 'orange', dot: 'bg-amber-500' },
  3: { label: 'Дууссан', color: 'green', dot: 'bg-emerald-500' },
  4: { label: 'Архив', color: 'default', dot: 'bg-zinc-400' },
};

export const FIDIC_CONTRACT_TYPES = [
  { value: 'FIDIC_Red', label: 'FIDIC Red Book (Construction)' },
  { value: 'FIDIC_Yellow', label: 'FIDIC Yellow Book (Design-Build)' },
  { value: 'FIDIC_Silver', label: 'FIDIC Silver Book (EPC/Turnkey)' },
  { value: 'Domestic', label: 'Дотоодын гэрээ' },
  { value: 'Other', label: 'Бусад' },
] as const;

export const ROAD_CLASSES = [
  { value: 'I', label: 'Анги I' },
  { value: 'II', label: 'Анги II' },
  { value: 'III', label: 'Анги III' },
  { value: 'IV', label: 'Анги IV' },
] as const;

export const PROJECT_STAGES = [
  { value: 'mobilization', label: 'Бэлтгэл / Mobilization' },
  { value: 'earthworks', label: 'Шорооны ажил / Earthworks' },
  { value: 'structures', label: 'Байгууламж / Structures' },
  { value: 'drainage', label: 'Ус зайлуулалт / Drainage' },
  { value: 'pavement', label: 'Хучилт / Pavement' },
  { value: 'finishing', label: 'Тэмдэглэгээ / Finishing' },
  { value: 'handover', label: 'Хүлээлгэн өгөх / Handover' },
  { value: 'defects', label: 'Дутагдал засах / Defects' },
] as const;

export const MILESTONE_TYPES = [
  { value: 'contractual', label: 'Гэрээний' },
  { value: 'technical', label: 'Техникийн' },
  { value: 'payment', label: 'Төлбөрийн' },
] as const;

export const MILESTONE_STATUSES = [
  { value: 'pending', label: 'Хүлээгдэж буй' },
  { value: 'achieved', label: 'Биелсэн' },
  { value: 'delayed', label: 'Хоцорсон' },
  { value: 'waived', label: 'Цуцлагдсан' },
] as const;

export const RISK_CATEGORIES = [
  { value: 'hse', label: 'ХАБЭА' },
  { value: 'schedule', label: 'Хуваарь' },
  { value: 'cost', label: 'Зардал' },
  { value: 'quality', label: 'Чанар' },
  { value: 'weather', label: 'Цаг агаар' },
  { value: 'stakeholder', label: 'Оролцогч тал' },
] as const;

export const RISK_STATUSES = [
  { value: 'open', label: 'Нээлттэй' },
  { value: 'mitigating', label: 'Бууруулж буй' },
  { value: 'closed', label: 'Хаагдсан' },
  { value: 'accepted', label: 'Хүлээн авсан' },
] as const;

export const CURRENCIES = [
  { value: 'MNT', label: 'MNT' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'CNY', label: 'CNY' },
] as const;

export function normalizeProjectStatus(status: number) {
  return PROJECT_STATUS_META[status] ? status : 1;
}

export function formatBudget(value: number | string | null | undefined) {
  const n = Number(value) || 0;
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}тэрбум₮`;
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}сая₮`;
  }
  return `${n.toLocaleString()}₮`;
}

export function formatKmRange(from?: number | string | null, to?: number | string | null) {
  if (from == null && to == null) return null;
  const a = from != null && from !== '' ? `км ${Number(from)}` : '';
  const b = to != null && to !== '' ? `км ${Number(to)}` : '';
  if (a && b) return `${a} – ${b}`;
  return a || b;
}

export function stageLabel(stage?: string | null) {
  return PROJECT_STAGES.find((s) => s.value === stage)?.label || stage || '—';
}

export function contractTypeLabel(type?: string | null) {
  return FIDIC_CONTRACT_TYPES.find((c) => c.value === type)?.label || type || '—';
}

export type EarnedValue = {
  PV: number;
  EV: number;
  AC: number;
  SPI: number | null;
  CPI: number | null;
  progress: number;
};

export function calcEarnedValue(input: {
  budget: number;
  planned_start?: string | null;
  planned_end?: string | null;
  progress: number;
  spent: number;
  today?: string;
}): EarnedValue {
  const B = Number(input.budget) || 0;
  const prog = Math.min(100, Math.max(0, Number(input.progress) || 0));
  const AC = Number(input.spent) || 0;
  const EV = B * (prog / 100);
  const today = input.today || new Date().toISOString().slice(0, 10);

  const dayDiff = (a?: string | null, b?: string | null) => {
    if (!a || !b) return null;
    const d1 = new Date(`${a}T00:00:00`).getTime();
    const d2 = new Date(`${b}T00:00:00`).getTime();
    if (Number.isNaN(d1) || Number.isNaN(d2)) return null;
    return Math.max(0, Math.round((d2 - d1) / 86400000));
  };

  const totalDays = dayDiff(input.planned_start, input.planned_end);
  let PV = 0;
  if (B > 0 && totalDays != null && totalDays > 0 && input.planned_start) {
    const elapsed = dayDiff(input.planned_start, today) ?? 0;
    PV = B * Math.min(1, Math.max(0, elapsed / totalDays));
  } else if (B > 0) {
    PV = B * (prog / 100);
  }

  const SPI = PV > 0 ? EV / PV : null;
  const CPI = AC > 0 ? EV / AC : null;

  return {
    PV: Math.round(PV * 100) / 100,
    EV: Math.round(EV * 100) / 100,
    AC: Math.round(AC * 100) / 100,
    SPI: SPI != null ? Math.round(SPI * 100) / 100 : null,
    CPI: CPI != null ? Math.round(CPI * 100) / 100 : null,
    progress: prog,
  };
}

export function riskScoreColor(score: number) {
  if (score >= 15) return 'text-red-600';
  if (score >= 8) return 'text-amber-600';
  return 'text-emerald-600';
}

export type ProjectMilestone = {
  id: number;
  project_id: number;
  name: string;
  type?: string;
  due_date?: string | null;
  actual_date?: string | null;
  status?: string;
  weight?: number | string;
  criteria?: string;
  sort_order?: number;
};

export type ProjectRisk = {
  id: number;
  project_id: number;
  title: string;
  category?: string;
  likelihood?: number;
  impact?: number;
  score?: number;
  residual_score?: number | null;
  status?: string;
  owner?: string;
  mitigation?: string;
};

export type ProjectRecord = {
  id?: number;
  name: string;
  code?: string;
  location?: string;
  province?: string;
  aimag_soum?: string;
  road_name?: string;
  road_class?: string;
  km_from?: number | string | null;
  km_to?: number | string | null;
  length_km?: number | string | null;
  purpose?: string;
  client_name?: string;
  employer_name?: string;
  contractor_name?: string;
  engineer_org?: string;
  employer_rep?: string;
  contractor_rep?: string;
  contract_number?: string;
  contract_type?: string;
  contract_date?: string | null;
  currency?: string;
  retention_pct?: number | string | null;
  liquidated_damages_per_day?: number | string | null;
  funding_source?: string;
  tender_ref?: string;
  engineer?: string;
  budget?: number | string;
  contingency_pct?: number | string | null;
  committed_amount?: number | string | null;
  equipment?: string;
  status: number;
  stage?: string;
  staff?: string;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  baseline_start?: string | null;
  baseline_end?: string | null;
  progress_percent?: number;
  progress_unit?: string;
  progress_planned?: number | string | null;
  progress_actual?: number | string | null;
  season_note?: string;
  notes?: string;
  road_project_id?: number | null;
  createdAt?: string;
  phase_progress?: number | null;
  effective_progress?: number;
  delayed?: boolean;
  at_risk?: boolean;
  high_risk_count?: number;
  finance?: {
    budget: number;
    spent: number;
    remaining: number;
    utilization?: number;
    contingency_pct?: number;
    committed_amount?: number;
  };
  earned_value?: EarnedValue;
  milestones?: ProjectMilestone[];
  risks?: ProjectRisk[];
  users?: Array<{
    id: number;
    username?: string;
    email?: string;
    position?: string;
    invite?: { inviteStatus?: string; role?: string };
  }>;
  phases?: Array<{
    id: number;
    completion_percent?: number;
    name?: string;
    start_date?: string;
    end_date?: string;
    color?: string;
  }>;
  roadProject?: { id: number; code?: string; name?: string; status?: string } | null;
};

export type PortfolioStats = {
  cards: {
    total: number;
    active: number;
    planned: number;
    done: number;
    archived: number;
    delayed: number;
    at_risk: number;
    total_budget: number;
    total_spent: number;
    avg_progress: number;
  };
  by_status: Record<string, number>;
  by_stage: Record<string, number>;
};

export async function fetchPortfolio() {
  return projectFetch<PortfolioStats>('/project/portfolio');
}

export async function fetchProjects(params?: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'all') qs.set(k, String(v));
    });
  }
  const q = qs.toString();
  return projectFetch<ProjectRecord[]>(`/project${q ? `?${q}` : ''}`);
}

export async function fetchProject(id: number | string) {
  return projectFetch<ProjectRecord>(`/project/${id}`);
}

export async function createProject(body: Partial<ProjectRecord> & { seed_phases?: boolean }) {
  return projectFetch<ProjectRecord>('/project', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProject(id: number | string, body: Partial<ProjectRecord>) {
  return projectFetch<ProjectRecord>(`/project/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteProject(id: number | string) {
  return projectFetch<{ message?: string }>(`/project/${id}`, { method: 'DELETE' });
}

export async function archiveProject(id: number | string) {
  return projectFetch<ProjectRecord>(`/project/${id}/archive`, { method: 'POST', body: '{}' });
}

export async function duplicateProject(id: number | string) {
  return projectFetch<ProjectRecord>(`/project/${id}/duplicate`, { method: 'POST', body: '{}' });
}

export async function fetchMilestones(projectId: number | string) {
  return projectFetch<ProjectMilestone[]>(`/project_milestone?project_id=${projectId}`);
}

export async function createMilestone(body: Partial<ProjectMilestone>) {
  return projectFetch<ProjectMilestone>('/project_milestone', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateMilestone(id: number, body: Partial<ProjectMilestone>) {
  return projectFetch<ProjectMilestone>(`/project_milestone/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteMilestone(id: number) {
  return projectFetch(`/project_milestone/${id}`, { method: 'DELETE' });
}

export async function fetchRisks(projectId: number | string) {
  return projectFetch<ProjectRisk[]>(`/project_risk?project_id=${projectId}`);
}

export async function createRisk(body: Partial<ProjectRisk>) {
  return projectFetch<ProjectRisk>('/project_risk', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateRisk(id: number, body: Partial<ProjectRisk>) {
  return projectFetch<ProjectRisk>(`/project_risk/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteRisk(id: number) {
  return projectFetch(`/project_risk/${id}`, { method: 'DELETE' });
}
