export type DailyReportRow = {
  id: number;
  report_date: string;
  project_id: number;
  created_by?: number | null;
  status: string;
  weather_note?: string | null;
  progress_planned?: number | string;
  progress_actual?: number | string;
  progress_unit?: string | null;
  progress_note?: string | null;
  safety_incidents: number;
  safety_near_misses: number;
  safety_note?: string | null;
  labor_planned: number;
  labor_present: number;
  labor_absent: number;
  labor_overtime: number;
  labor_note?: string | null;
  equipment_working: number;
  equipment_idle: number;
  equipment_broken: number;
  equipment_note?: string | null;
  materials_shortages: number;
  materials_note?: string | null;
  attention_needed?: string | null;
  notes?: string | null;
  project?: { id: number; name: string } | null;
  author?: { id: number; username: string } | null;
};

export type DailySummary = {
  date: string;
  totals: {
    projects_reported: number;
    safety_incidents: number;
    safety_near_misses: number;
    labor_planned: number;
    labor_present: number;
    labor_absent: number;
    labor_overtime: number;
    equipment_working: number;
    equipment_idle: number;
    equipment_broken: number;
    materials_shortages: number;
    progress_planned: number;
    progress_actual: number;
    progress_pct: number | null;
    system_accidents: number;
  };
  attendance_pulse: { checked_in: number; total_records: number } | null;
  attention: Array<{ level: string; project: string; text: string }>;
  projects: Array<{
    id: number;
    project_id: number;
    project_name: string;
    progress_pct: number;
    progress_unit?: string | null;
    safety_incidents: number;
    labor_present: number;
    labor_planned: number;
    equipment_broken: number;
    materials_shortages: number;
    weather_note?: string | null;
  }>;
};

const API = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchDailySummary(date: string): Promise<DailySummary | null> {
  const res = await fetch(`${API}/api/daily-report/summary?date=${encodeURIComponent(date)}`);
  const json = await res.json();
  return json.success ? json.data : null;
}

export async function fetchDailyReports(params?: {
  date?: string;
  project_id?: number | string;
}): Promise<DailyReportRow[]> {
  const q = new URLSearchParams();
  if (params?.date) q.set('date', params.date);
  if (params?.project_id) q.set('project_id', String(params.project_id));
  const res = await fetch(`${API}/api/daily-report?${q.toString()}`);
  const json = await res.json();
  return json.success ? json.data || [] : [];
}

export async function saveDailyReport(
  body: Record<string, unknown>,
): Promise<{ ok: boolean; data?: DailyReportRow; message?: string }> {
  const res = await fetch(`${API}/api/daily-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { ok: !!json.success, data: json.data, message: json.message };
}

export async function deleteDailyReport(id: number): Promise<boolean> {
  const res = await fetch(`${API}/api/daily-report/${id}`, { method: 'DELETE' });
  const json = await res.json();
  return !!json.success;
}

export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
