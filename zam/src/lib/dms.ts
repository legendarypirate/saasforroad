const API = process.env.NEXT_PUBLIC_API_URL || '';

async function dmsFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<{ success: boolean; data?: T; message?: string }> {
  const res = await fetch(`${API}/api/document${path}`, init);
  return res.json();
}

export type DmsFolder = {
  id: number;
  name: string;
  parent_id: number | null;
  description?: string | null;
  sort_order: number;
  is_system: boolean;
};

export type DmsDocument = {
  id: number;
  name: string;
  parent_id: number | null;
  file_url: string;
  description?: string | null;
  doc_type: string;
  doc_number?: string | null;
  version: number;
  status: string;
  project_id?: number | null;
  tags?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  original_name?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  issuer?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  project?: { id: number; name: string; road_name?: string; contract_number?: string } | null;
  creator?: { id: number; username: string } | null;
};

export type DmsStats = {
  total: number;
  active: number;
  draft: number;
  archived: number;
  folders: number;
  expiring: number;
  by_type: Array<{ doc_type: string; count: number }>;
};

export const DOC_TYPES = [
  { value: 'contract', label: 'Гэрээ' },
  { value: 'drawing', label: 'Зураг төсөл' },
  { value: 'permit', label: 'Зөвшөөрөл' },
  { value: 'quality', label: 'Чанар' },
  { value: 'as_built', label: 'Гүйцэтгэл' },
  { value: 'correspondence', label: 'Албан бичиг' },
  { value: 'technical', label: 'Техникийн' },
  { value: 'financial', label: 'Санхүү' },
  { value: 'hse', label: 'ХАБЭА' },
  { value: 'survey', label: 'Геодези' },
  { value: 'other', label: 'Бусад' },
] as const;

export const DOC_STATUSES = [
  { value: 'draft', label: 'Ноорог', color: 'default' as const },
  { value: 'active', label: 'Идэвхтэй', color: 'green' as const },
  { value: 'archived', label: 'Архив', color: 'blue' as const },
  { value: 'expired', label: 'Хугацаа дууссан', color: 'red' as const },
] as const;

export function docTypeLabel(value?: string | null) {
  return DOC_TYPES.find((t) => t.value === value)?.label || value || '—';
}

export function docStatusMeta(value?: string | null) {
  return DOC_STATUSES.find((s) => s.value === value) || DOC_STATUSES[1];
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isExpiringSoon(expiry?: string | null, days = 30) {
  if (!expiry) return false;
  const end = new Date(expiry);
  if (Number.isNaN(end.getTime())) return false;
  const soon = new Date();
  soon.setDate(soon.getDate() + days);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end <= soon && end >= today;
}

export function isExpired(expiry?: string | null) {
  if (!expiry) return false;
  const end = new Date(expiry);
  if (Number.isNaN(end.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
}

export const dmsApi = {
  stats: () => dmsFetch<DmsStats>('/stats').then((j) => j.data ?? null),

  listFolders: (parentId: number | null) =>
    dmsFetch<DmsFolder[]>(`/folders?parent_id=${parentId ?? ''}`).then((j) => j.data ?? []),

  createFolder: (body: { name: string; parent_id: number | null; description?: string }) =>
    dmsFetch<DmsFolder>('/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  updateFolder: (id: number, body: Partial<{ name: string; parent_id: number | null; description: string }>) =>
    dmsFetch<DmsFolder>(`/folders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  deleteFolder: (id: number) =>
    dmsFetch(`/folders/${id}`, { method: 'DELETE' }),

  listDocuments: (params: {
    parent_id?: number | null;
    q?: string;
    doc_type?: string;
    status?: string;
    project_id?: number | string;
    expiring?: boolean;
    search_all?: boolean;
  }) => {
    const sp = new URLSearchParams();
    if (params.search_all) {
      sp.set('search_all', '1');
    } else if (params.parent_id !== undefined) {
      sp.set('parent_id', params.parent_id == null ? '' : String(params.parent_id));
    }
    if (params.q) sp.set('q', params.q);
    if (params.doc_type) sp.set('doc_type', params.doc_type);
    if (params.status) sp.set('status', params.status);
    if (params.project_id) sp.set('project_id', String(params.project_id));
    if (params.expiring) sp.set('expiring', '1');
    const q = sp.toString();
    return dmsFetch<DmsDocument[]>(q ? `?${q}` : '').then((j) => j.data ?? []);
  },

  upload: (form: FormData) =>
    dmsFetch<DmsDocument>('/', { method: 'POST', body: form }),

  update: (id: number, body: Record<string, unknown>) =>
    dmsFetch<DmsDocument>(`/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  replace: (id: number, form: FormData) =>
    dmsFetch<DmsDocument>(`/${id}/replace`, { method: 'POST', body: form }),

  remove: (id: number) => dmsFetch(`/${id}`, { method: 'DELETE' }),
};
