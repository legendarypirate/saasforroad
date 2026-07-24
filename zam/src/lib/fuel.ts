import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';

async function fuelFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(`${API}/api/fuel${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...tenantHeaders(), ...init?.headers },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа');
  return json.data ?? null;
}

export const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизель' },
  { value: 'gasoline', label: 'Бензин' },
  { value: 'petrol', label: 'АИ-92/95' },
  { value: 'other', label: 'Бусад' },
];

export const TANK_STATUSES = [
  { value: 'active', label: 'Идэвхтэй' },
  { value: 'inactive', label: 'Идэвхгүй' },
  { value: 'maintenance', label: 'Засвар' },
];

export const SUPPLIER_STATUSES = [
  { value: 'active', label: 'Идэвхтэй' },
  { value: 'inactive', label: 'Идэвхгүй' },
];

export const DEFAULT_CONSUMPTION_STANDARD = 30;

export type FuelDashboard = {
  purchased_today: number;
  issued_today: number;
  current_stock: number;
  monthly_cost: number;
  average_consumption: number;
  high_consumption_count: number;
  high_consumption: Array<{ id: number; equipment: string; rate: number; standard: number }>;
  tanks: Array<Record<string, unknown>>;
  charts: {
    monthly_purchase: Array<{ month: string; quantity: number; cost: number }>;
    monthly_consumption: Array<{ month: string; quantity: number }>;
    cost_trend: Array<{ month: string; cost: number }>;
  };
  recent_purchases: Array<Record<string, unknown>>;
  recent_issues: Array<Record<string, unknown>>;
};

export type FuelReports = {
  type: string;
  daily: Record<string, unknown>;
  monthly: Record<string, unknown>;
  vehicle_consumption: Array<Record<string, unknown>>;
  driver_consumption: Array<Record<string, unknown>>;
  purchase_summary: Array<Record<string, unknown>>;
  tank_balance: Array<Record<string, unknown>>;
  cost_by_vehicle: Array<Record<string, unknown>>;
  cost_by_project: Array<Record<string, unknown>>;
  consumptions: Array<Record<string, unknown>>;
};

type FuelQuery = Record<string, string | undefined | null>;

function toQs(query?: FuelQuery) {
  if (!query) return '';
  const parts = Object.entries(query)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export async function fetchFuelDashboard(): Promise<FuelDashboard | null> {
  return fuelFetch<FuelDashboard>('/dashboard');
}

export async function fetchFuelReports(query?: FuelQuery): Promise<FuelReports | null> {
  return fuelFetch<FuelReports>(`/reports${toQs(query)}`);
}

export async function fetchFuelList<T>(resource: string, query?: FuelQuery): Promise<T[]> {
  return (await fuelFetch<T[]>(`/${resource}${toQs(query)}`)) || [];
}

export async function createFuelRecord<T>(resource: string, body: Record<string, unknown>): Promise<T | null> {
  return fuelFetch<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function updateFuelRecord<T>(
  resource: string,
  id: number,
  body: Record<string, unknown>,
): Promise<T | null> {
  return fuelFetch<T>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteFuelRecord(resource: string, id: number) {
  await fuelFetch(`/${resource}/${id}`, { method: 'DELETE' });
  return true;
}

export async function recalcFuelConsumptions(standard_rate?: number) {
  return fuelFetch<{ created: number; standard_rate: number }>('/consumptions/recalc', {
    method: 'POST',
    body: JSON.stringify({ standard_rate }),
  });
}

export function fuelTypeLabel(v?: string | null) {
  return FUEL_TYPES.find((t) => t.value === v)?.label || v || '—';
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
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadExcel(filename: string, rows: Record<string, unknown>[], sheetName = 'Sheet1') {
  if (!rows.length) return;
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName.slice(0, 31));
  const columns = Object.keys(rows[0]);
  worksheet.columns = columns.map((key) => ({ header: key, key }));
  worksheet.addRows(rows);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printTable(title: string) {
  const prev = document.title;
  document.title = title;
  window.print();
  document.title = prev;
}
