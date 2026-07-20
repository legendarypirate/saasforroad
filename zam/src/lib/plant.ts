import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';

async function plantFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(`${API}/api/plant${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...tenantHeaders(), ...init?.headers },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа');
  return json.data ?? null;
}

export function formatMoney(n: number | string | null | undefined) {
  return `${Math.round(Number(n || 0)).toLocaleString('mn-MN')} ₮`;
}

export function formatQty(n: number | string | null | undefined, unit = 'тн') {
  return `${Number(n || 0).toLocaleString('mn-MN', { maximumFractionDigits: 2 })} ${unit}`;
}

export const PLANT_TYPES = [
  { value: 'asphalt', label: 'Асфальтбетон' },
  { value: 'cement', label: 'Цемент' },
  { value: 'ctb', label: 'СТВ / цементээр бэхжүүлсэн' },
  { value: 'crushing', label: 'Чулуу бутлах' },
  { value: 'emulsion', label: 'Эмульс' },
  { value: 'other', label: 'Бусад' },
];

export const PLANT_STATUSES = [
  { value: 'active', label: 'Идэвхтэй' },
  { value: 'seasonal', label: 'Улирлын' },
  { value: 'mothballed', label: 'Зогссон' },
];

export const PRODUCT_TYPES = [
  { value: 'asphalt_mix', label: 'Асфальт хольц' },
  { value: 'aggregate', label: 'Дүүргэгч / фракц' },
  { value: 'cement', label: 'Цемент' },
  { value: 'ctb', label: 'СТВ' },
  { value: 'emulsion', label: 'Эмульс' },
  { value: 'other', label: 'Бусад' },
];

export const MATERIAL_TYPES = [
  { value: 'bitumen', label: 'Битум' },
  { value: 'cement', label: 'Цемент' },
  { value: 'aggregate', label: 'Дүүргэгч' },
  { value: 'filler', label: 'Минерал нунтаг' },
  { value: 'emulsion_base', label: 'Эмульс түүхий эд' },
  { value: 'fuel', label: 'Шатахуун' },
  { value: 'additive', label: 'Нэмэлт' },
  { value: 'other', label: 'Бусад' },
];

export const MOVEMENT_TYPES = [
  { value: 'in', label: 'Орлого' },
  { value: 'out', label: 'Зарлага' },
  { value: 'consume', label: 'Үйлдвэрлэлд зарцуулсан' },
  { value: 'adjust', label: 'Тохируулга' },
];

export const BATCH_STATUSES = [
  { value: 'draft', label: 'Ноорог' },
  { value: 'running', label: 'Явагдаж буй' },
  { value: 'done', label: 'Дууссан' },
  { value: 'rejected', label: 'Татгалзсан' },
];

export const BUYER_TYPES = [
  { value: 'project', label: 'Төсөл' },
  { value: 'external', label: 'Гадны захиалагч' },
  { value: 'internal', label: 'Дотоод' },
];

export const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Төлөөгүй' },
  { value: 'partial', label: 'Хэсэгчилсэн' },
  { value: 'paid', label: 'Төлсөн' },
];

export const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: 'Шатахуун' },
  { value: 'power', label: 'Цахилгаан' },
  { value: 'labor', label: 'Хөдөлмөр' },
  { value: 'repair', label: 'Засвар' },
  { value: 'transport', label: 'Тээвэр' },
  { value: 'lab', label: 'Лаборатори' },
  { value: 'bitumen', label: 'Битум' },
  { value: 'material', label: 'Түүхий эд' },
  { value: 'other', label: 'Бусад' },
];

export const REPORT_STATUSES = [
  { value: 'draft', label: 'Ноорог' },
  { value: 'submitted', label: 'Илгээсэн' },
  { value: 'approved', label: 'Батлагдсан' },
];

export type PlantDashboard = {
  period: { start: string; end: string };
  plant_count: number;
  active_plants: number;
  month_income: number;
  month_expense: number;
  month_net: number;
  month_produced: number;
  unpaid_sales: number;
  by_plant: Array<{
    id: number;
    name: string;
    code?: string;
    plant_type: string;
    status: string;
    income: number;
    expense: number;
    net: number;
    produced: number;
  }>;
  recent_reports: Array<Record<string, unknown>>;
  low_stock: Array<Record<string, unknown>>;
};

export function plantTypeLabel(v?: string) {
  return PLANT_TYPES.find((t) => t.value === v)?.label || v || '—';
}

export async function fetchPlantDashboard(plantId?: number): Promise<PlantDashboard | null> {
  const q = plantId ? `?plant_id=${plantId}` : '';
  return plantFetch<PlantDashboard>(`/dashboard${q}`);
}

export async function seedPlantDefaults() {
  return plantFetch('/seed-defaults', { method: 'POST' });
}

export async function fetchPlantList<T>(resource: string, query?: Record<string, string>) {
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  const data = await plantFetch<T[]>(`/${resource}${qs}`);
  return data || [];
}

export async function createPlantRecord(resource: string, body: Record<string, unknown>) {
  return plantFetch(`/${resource}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function updatePlantRecord(resource: string, id: number, body: Record<string, unknown>) {
  return plantFetch(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deletePlantRecord(resource: string, id: number) {
  return plantFetch(`/${resource}/${id}`, { method: 'DELETE' });
}

/** Published factories from plant.rcos.mn (map markers). */
export async function fetchRcosMapFactories<T = Record<string, unknown>>() {
  const data = await plantFetch<T[]>('/rcos/map-factories');
  return data || [];
}

/** Sync local rcos_status from plant.rcos.mn approvals. */
export async function syncRcosPlantStatuses() {
  return plantFetch<{ synced: number; ids: number[] }>('/rcos/sync-statuses', {
    method: 'POST',
  });
}

/** Submit local site for admin approval on plant.rcos.mn. */
export async function placePlantToRcos(
  siteId: number,
  meta?: { requested_by_name?: string; requested_by_email?: string },
) {
  return plantFetch(`/sites/${siteId}/place-to-rcos`, {
    method: 'POST',
    body: JSON.stringify(meta || {}),
  });
}

export function rcosStatusLabel(v?: string | null) {
  if (!v) return 'Зөвхөн локал';
  if (v === 'pending') return 'RCOS хүлээгдэж буй';
  if (v === 'approved') return 'RCOS-д батлагдсан';
  if (v === 'rejected') return 'RCOS татгалзсан';
  return v;
}
