const API = process.env.NEXT_PUBLIC_API_URL;

export const UNITS = [
  'ширхэг',
  'тн',
  'кг',
  'л',
  'м',
  'м²',
  'м³',
  'хайрцаг',
  'уут',
  'ороомог',
] as const;

export const DOC_TYPES = [
  { value: 'RECEIPT', label: 'Орлого (GRN)', color: 'green' },
  { value: 'ISSUE', label: 'Зарлага', color: 'red' },
  { value: 'RETURN', label: 'Буцаалт', color: 'blue' },
  { value: 'TRANSFER', label: 'Шилжүүлэг', color: 'purple' },
  { value: 'ADJUSTMENT', label: 'Тохируулга', color: 'orange' },
  { value: 'COUNT', label: 'Тооллого', color: 'cyan' },
  { value: 'DAMAGE', label: 'Гэмтэл', color: 'magenta' },
  { value: 'LOSS', label: 'Алдагдал', color: 'volcano' },
  { value: 'CONSUMPTION', label: 'Хэрэглээ', color: 'geekblue' },
] as const;

export function docTypeLabel(type: string) {
  return DOC_TYPES.find((d) => d.value === type)?.label || type;
}

export function docTypeColor(type: string) {
  return DOC_TYPES.find((d) => d.value === type)?.color || 'default';
}

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа гарлаа');
  return json;
}

export const inventoryApi = {
  categories: {
    list: () => jsonFetch(`${API}/api/angilal`).then((j) => j.data),
    create: (body: object) =>
      jsonFetch(`${API}/api/angilal`, { method: 'POST', body: JSON.stringify(body) }).then((j) => j.data),
    update: (id: number, body: object) =>
      jsonFetch(`${API}/api/angilal/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then((j) => j.data),
    remove: (id: number) =>
      jsonFetch(`${API}/api/angilal/${id}`, { method: 'DELETE' }),
  },
  materials: {
    list: (params?: Record<string, string>) => {
      const q = params ? `?${new URLSearchParams(params)}` : '';
      return jsonFetch(`${API}/api/material${q}`).then((j) => j.data);
    },
    create: (body: object) =>
      jsonFetch(`${API}/api/material`, { method: 'POST', body: JSON.stringify(body) }).then((j) => j.data),
    update: (id: number, body: object) =>
      jsonFetch(`${API}/api/material/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then((j) => j.data),
    remove: (id: number) =>
      jsonFetch(`${API}/api/material/${id}`, { method: 'DELETE' }),
  },
  warehouses: {
    list: () => jsonFetch(`${API}/api/warehouse`).then((j) => j.data),
    create: (body: object) =>
      jsonFetch(`${API}/api/warehouse`, { method: 'POST', body: JSON.stringify(body) }).then((j) => j.data),
    update: (id: number, body: object) =>
      jsonFetch(`${API}/api/warehouse/${id}`, { method: 'PUT', body: JSON.stringify(body) }).then((j) => j.data),
    remove: (id: number) =>
      jsonFetch(`${API}/api/warehouse/${id}`, { method: 'DELETE' }),
  },
  stocks: {
    list: (params?: Record<string, string>) => {
      const q = params ? `?${new URLSearchParams(params)}` : '';
      return jsonFetch(`${API}/api/stock${q}`);
    },
  },
  suppliers: {
    list: (params?: Record<string, string>) => {
      const q = params ? `?${new URLSearchParams(params)}` : '';
      return jsonFetch(`${API}/api/supplier${q}`).then((j) => j.data);
    },
    create: (body: object) =>
      jsonFetch(`${API}/api/supplier`, { method: 'POST', body: JSON.stringify(body) }).then((j) => j.data),
    update: (id: number, body: object) =>
      jsonFetch(`${API}/api/supplier/${id}`, { method: 'PATCH', body: JSON.stringify(body) }).then((j) => j.data),
    remove: (id: number) =>
      jsonFetch(`${API}/api/supplier/${id}`, { method: 'DELETE' }),
  },
  documents: {
    list: (params?: Record<string, string>) => {
      const q = params ? `?${new URLSearchParams(params)}` : '';
      return jsonFetch(`${API}/api/inventory/documents${q}`).then((j) => j.data);
    },
    create: (body: object) =>
      jsonFetch(`${API}/api/inventory/documents`, { method: 'POST', body: JSON.stringify(body) }).then((j) => j.data),
    cancel: (id: number, reason?: string) =>
      jsonFetch(`${API}/api/inventory/documents/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }).then((j) => j.data),
  },
  movements: {
    list: (params?: Record<string, string>) => {
      const q = params ? `?${new URLSearchParams(params)}` : '';
      return jsonFetch(`${API}/api/inventory/movements${q}`).then((j) => j.data);
    },
  },
  dashboard: () => jsonFetch(`${API}/api/inventory/dashboard`).then((j) => j.data),
  projects: () => jsonFetch(`${API}/api/project`).then((j) => j.data || j),
};

export function formatQty(n: number | string) {
  return Number(n || 0).toLocaleString('mn-MN', { maximumFractionDigits: 3 });
}

export function formatMoney(n: number | string) {
  return `${Math.round(Number(n || 0)).toLocaleString('mn-MN')} ₮`;
}
