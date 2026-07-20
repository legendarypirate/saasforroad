import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';

async function notifFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<{ success: boolean; data?: T; message?: string }> {
  const res = await fetch(`${API}/api/notification${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...tenantHeaders(),
      ...init?.headers,
    },
  });
  return res.json();
}

export type NotificationRecord = {
  id: number;
  user_id?: number | null;
  title: string;
  description?: string | null;
  status: string;
  audience: string;
  priority: string;
  project_id?: number | null;
  published_at?: string | null;
  expires_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
  project?: { id: number; name: string } | null;
  author?: { id: number; username: string } | null;
};

export type NotificationStats = {
  total: number;
  draft: number;
  published: number;
  archived: number;
  urgent: number;
};

export const NOTIF_STATUSES = [
  { value: 'draft', label: 'Ноорог', color: 'default' as const },
  { value: 'published', label: 'Нийтэлсэн', color: 'green' as const },
  { value: 'archived', label: 'Архив', color: 'blue' as const },
] as const;

export const NOTIF_AUDIENCES = [
  { value: 'all', label: 'Бүгд' },
  { value: 'admin', label: 'Админ' },
  { value: 'mobile', label: 'Мобайл' },
  { value: 'project', label: 'Төсөл' },
] as const;

export const NOTIF_PRIORITIES = [
  { value: 'normal', label: 'Энгийн', color: 'default' as const },
  { value: 'high', label: 'Өндөр', color: 'orange' as const },
  { value: 'urgent', label: 'Яаралтай', color: 'red' as const },
] as const;

export function notifStatusMeta(value?: string | null) {
  return NOTIF_STATUSES.find((s) => s.value === value) || NOTIF_STATUSES[0];
}

export function notifAudienceLabel(value?: string | null) {
  return NOTIF_AUDIENCES.find((a) => a.value === value)?.label || value || '—';
}

export function notifPriorityMeta(value?: string | null) {
  return NOTIF_PRIORITIES.find((p) => p.value === value) || NOTIF_PRIORITIES[0];
}

export function formatNotifDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const notificationApi = {
  stats: () => notifFetch<NotificationStats>('/stats').then((j) => j.data ?? null),

  list: (params?: {
    q?: string;
    status?: string;
    audience?: string;
    priority?: string;
    project_id?: string | number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set('q', params.q);
    if (params?.status) sp.set('status', params.status);
    if (params?.audience) sp.set('audience', params.audience);
    if (params?.priority) sp.set('priority', params.priority);
    if (params?.project_id) sp.set('project_id', String(params.project_id));
    const q = sp.toString();
    return notifFetch<NotificationRecord[]>(q ? `?${q}` : '').then((j) => j.data ?? []);
  },

  create: (body: Record<string, unknown>) =>
    notifFetch<NotificationRecord>('/', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: Record<string, unknown>) =>
    notifFetch<NotificationRecord>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  publish: (id: number) =>
    notifFetch<NotificationRecord>(`/${id}/publish`, { method: 'POST' }),

  archive: (id: number) =>
    notifFetch<NotificationRecord>(`/${id}/archive`, { method: 'POST' }),

  remove: (id: number) => notifFetch(`/${id}`, { method: 'DELETE' }),
};
