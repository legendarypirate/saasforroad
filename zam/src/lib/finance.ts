const API = process.env.NEXT_PUBLIC_API_URL || '';

async function financeFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(`${API}/api/finance${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа');
  return json.data ?? null;
}

export function formatMoney(n: number | string | null | undefined) {
  return `${Math.round(Number(n || 0)).toLocaleString('mn-MN')} ₮`;
}

export type FinanceDashboard = {
  cash_total: number;
  cash_by_account: Array<{ id: number; code: string; name: string; type: string; balance: number }>;
  ar_open: number;
  ap_open: number;
  overdue_ar: number;
  overdue_ap: number;
  month_in: number;
  month_out: number;
  month_net: number;
};

export type FinanceReports = {
  ar_aging: Record<string, number>;
  ap_aging: Record<string, number>;
  cash_by_account: Array<{ id: number; name: string; code: string; balance: number }>;
  project_cost: Array<{
    budget_id: number;
    project_id: number | null;
    project_name: string;
    category: string;
    year: number;
    planned: number;
    actual: number;
    variance: number;
  }>;
  vat_summary: { output: number; input: number; payable: number };
};

export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Касс' },
  { value: 'bank', label: 'Банк' },
];

export const CONTRACT_TYPES = [
  { value: 'client', label: 'Захиалагч' },
  { value: 'supplier', label: 'Нийлүүлэгч' },
];

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Ноорог' },
  { value: 'issued', label: 'Гаргасан' },
  { value: 'partial', label: 'Хэсэгчилсэн' },
  { value: 'paid', label: 'Төлсөн' },
  { value: 'cancelled', label: 'Цуцлагдсан' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Бэлэн' },
  { value: 'transfer', label: 'Шилжүүлэг' },
  { value: 'card', label: 'Карт' },
];

export const EXPENSE_STATUSES = [
  { value: 'draft', label: 'Ноорог' },
  { value: 'submitted', label: 'Илгээсэн' },
  { value: 'approved', label: 'Батлагдсан' },
  { value: 'rejected', label: 'Татгалзсан' },
  { value: 'paid', label: 'Төлсөн' },
];

export async function fetchFinanceDashboard(): Promise<FinanceDashboard | null> {
  return financeFetch<FinanceDashboard>('/dashboard');
}

export async function fetchFinanceReports(year?: number): Promise<FinanceReports | null> {
  const q = year ? `?year=${year}` : '';
  return financeFetch<FinanceReports>(`/reports${q}`);
}

export async function fetchFinanceList<T>(resource: string, query?: Record<string, string>): Promise<T[]> {
  const qs = query
    ? `?${Object.entries(query)
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')}`
    : '';
  return (await financeFetch<T[]>(`/${resource}${qs}`)) || [];
}

export async function createFinanceRecord<T>(resource: string, body: Record<string, unknown>): Promise<T | null> {
  return financeFetch<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function updateFinanceRecord<T>(
  resource: string,
  id: number,
  body: Record<string, unknown>,
): Promise<T | null> {
  return financeFetch<T>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteFinanceRecord(resource: string, id: number) {
  await financeFetch(`/${resource}/${id}`, { method: 'DELETE' });
  return true;
}

export async function approveExpense(id: number, body: { status?: string; approved_by?: number }) {
  return financeFetch(`/expenses/${id}/approve`, { method: 'POST', body: JSON.stringify(body) });
}
