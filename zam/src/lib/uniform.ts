const API = process.env.NEXT_PUBLIC_API_URL || '';

async function uniformFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(`${API}/api/uniform${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа');
  return json.data ?? null;
}

export const ITEM_CATEGORIES = [
  { value: 'workwear', label: 'Ажлын хувцас' },
  { value: 'footwear', label: 'Гутал' },
  { value: 'gloves', label: 'Бээлий' },
  { value: 'head', label: 'Малгай / хамгаалалт' },
  { value: 'vest', label: 'Дохионы хантааз' },
  { value: 'other', label: 'Бусад' },
];

export const RETURN_CONDITIONS = [
  { value: 'good', label: 'Сайн' },
  { value: 'damaged', label: 'Гэмтсэн' },
  { value: 'lost', label: 'Алдагдсан' },
];

export type UniformDashboard = {
  item_count: number;
  low_stock_count: number;
  low_stock: Array<{ id: number; name: string; stock_qty: number; min_stock: number }>;
  issues_today: number;
  issues_month: number;
  open_issues: number;
  pending_requests: number;
};

export async function fetchUniformDashboard(): Promise<UniformDashboard | null> {
  return uniformFetch<UniformDashboard>('/dashboard');
}

export async function fetchUniformReports(query?: Record<string, string>) {
  const qs = query
    ? `?${Object.entries(query)
        .filter(([, v]) => v)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')}`
    : '';
  return uniformFetch<{
    by_person: Array<{ username: string; issues: number; qty: number }>;
    by_item: Array<{ name: string; qty: number; returned: number }>;
    stock: Array<{
      id: number;
      code: string;
      name: string;
      category: string;
      stock_qty: number;
      min_stock: number;
      low: boolean;
    }>;
    issues: unknown[];
  }>(`/reports${qs}`);
}

export async function fetchUniformList<T>(resource: string, query?: Record<string, string>): Promise<T[]> {
  const qs = query
    ? `?${Object.entries(query)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')}`
    : '';
  return (await uniformFetch<T[]>(`/${resource}${qs}`)) || [];
}

export async function createUniformRecord<T>(resource: string, body: Record<string, unknown>): Promise<T | null> {
  return uniformFetch<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function updateUniformRecord<T>(
  resource: string,
  id: number,
  body: Record<string, unknown>,
): Promise<T | null> {
  return uniformFetch<T>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteUniformRecord(resource: string, id: number) {
  await uniformFetch(`/${resource}/${id}`, { method: 'DELETE' });
  return true;
}

export async function approveUniformRequest(id: number, body: { status?: string; approved_by?: number }) {
  return uniformFetch(`/requests/${id}/approve`, { method: 'POST', body: JSON.stringify(body) });
}
