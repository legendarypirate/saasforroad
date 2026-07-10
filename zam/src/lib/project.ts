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

export type ProjectRecord = {
  id?: number;
  name: string;
  location?: string;
  road_name?: string;
  km_from?: number | string | null;
  km_to?: number | string | null;
  purpose?: string;
  client_name?: string;
  contract_number?: string;
  engineer?: string;
  budget?: number | string;
  equipment?: string;
  status: number;
  staff?: string;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  progress_percent?: number;
  progress_unit?: string;
  progress_planned?: number | string | null;
  progress_actual?: number | string | null;
  season_note?: string;
  notes?: string;
  createdAt?: string;
  phase_progress?: number | null;
  effective_progress?: number;
  users?: Array<{
    id: number;
    username?: string;
    email?: string;
    position?: string;
    invite?: { inviteStatus?: string; role?: string };
  }>;
  phases?: Array<{ id: number; completion_percent?: number; name?: string }>;
};
