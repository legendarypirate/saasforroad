import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export type DmsScope = 'company' | 'personal';

async function dmsFetch<T = unknown>(
  path: string,
  init?: RequestInit,
  scope: DmsScope = 'company',
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const separator = path.includes('?') ? '&' : '?';
  const url = `${API}/api/document${path}${separator}scope=${scope}`;
  const extra: Record<string, string> = {
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  if (token) {
    extra['Authorization'] = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;
  }
  // Never set Content-Type on FormData — browser must add multipart boundary.
  if (init?.body && !(init.body instanceof FormData) && !extra['Content-Type']) {
    extra['Content-Type'] = 'application/json';
  }
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: tenantHeaders(extra),
      cache: 'no-store',
    });
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : 'Сүлжээний алдаа — дахин оролдоно уу',
    };
  }

  let body: { success?: boolean; data?: T; message?: string } = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  if (!res.ok) {
    return {
      success: false,
      message: body.message || `Хүсэлт амжилтгүй (${res.status})`,
      data: body.data,
    };
  }

  // Require explicit success + data for mutating calls; list can be empty array
  if (body.success !== true) {
    return {
      success: false,
      message: body.message || 'Амжилтгүй хариу',
      data: body.data,
    };
  }

  return {
    success: true,
    data: body.data,
    message: body.message,
  };
}

export type DmsFolder = {
  id: number;
  name: string;
  parent_id: number | null;
  description?: string | null;
  sort_order: number;
  is_system: boolean;
  owner_user_id?: number | null;
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
  owner_user_id?: number | null;
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

export function createDmsApi(scope: DmsScope = 'company') {
  return {
    stats: () => dmsFetch<DmsStats>('/stats', undefined, scope).then((j) => j.data ?? null),

    listFolders: (parentId: number | null) =>
      dmsFetch<DmsFolder[]>(`/folders?parent_id=${parentId ?? ''}`, undefined, scope).then(
        (j) => j.data ?? [],
      ),

    createFolder: (body: { name: string; parent_id: number | null; description?: string }) =>
      dmsFetch<DmsFolder>(
        '/folders',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
        scope,
      ),

    updateFolder: (
      id: number,
      body: Partial<{ name: string; parent_id: number | null; description: string }>,
    ) =>
      dmsFetch<DmsFolder>(
        `/folders/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(body),
        },
        scope,
      ),

    deleteFolder: (id: number) =>
      dmsFetch(`/folders/${id}`, { method: 'DELETE' }, scope),

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
      return dmsFetch<DmsDocument[]>(q ? `?${q}` : '', undefined, scope).then(
        (j) => (j.success === false ? [] : (j.data ?? [])),
      );
    },

    upload: (form: FormData) =>
      dmsFetch<DmsDocument>('/', { method: 'POST', body: form }, scope),

    update: (id: number, body: Record<string, unknown>) =>
      dmsFetch<DmsDocument>(
        `/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(body),
        },
        scope,
      ),

    replace: (id: number, form: FormData) =>
      dmsFetch<DmsDocument>(`/${id}/replace`, { method: 'POST', body: form }, scope),

    remove: (id: number) => dmsFetch(`/${id}`, { method: 'DELETE' }, scope),
  };
}

/** Default company DMS client (backward compatible). */
export const dmsApi = createDmsApi('company');
