import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export type PersonalNote = {
  id: number;
  user_id: number;
  title: string;
  content?: string | null;
  parent_id?: number | null;
  icon?: string | null;
  is_favorite?: boolean;
  sort_order?: number;
  deadline_date?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function authHeaders(json = false): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const extra: Record<string, string> = {};
  if (json) extra['Content-Type'] = 'application/json';
  if (token) extra['Authorization'] = token;
  return tenantHeaders(extra);
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api/personal-notes${path}`, {
    ...init,
    headers: { ...authHeaders(Boolean(init?.body)), ...init?.headers },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Алдаа (${res.status})`);
  }
  return json as T;
}

export const personalNotesApi = {
  list(q?: string) {
    const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    return req<{ data: PersonalNote[] }>(qs).then((j) => j.data ?? []);
  },
  get(id: number) {
    return req<{ data: PersonalNote }>(`/${id}`).then((j) => j.data);
  },
  create(body: {
    title?: string;
    content?: string;
    parent_id?: number | null;
    icon?: string | null;
    is_favorite?: boolean;
    deadline_date?: string | null;
  }) {
    return req<{ data: PersonalNote }>('/', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
  update(
    id: number,
    body: Partial<{
      title: string;
      content: string;
      parent_id: number | null;
      icon: string | null;
      is_favorite: boolean;
      sort_order: number;
      deadline_date: string | null;
    }>,
  ) {
    return req<{ data: PersonalNote }>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }).then((j) => j.data);
  },
  remove(id: number) {
    return req<{ message?: string }>(`/${id}`, { method: 'DELETE' });
  },
};

export type NoteTreeNode = PersonalNote & { children: NoteTreeNode[] };

export function buildNoteTree(notes: PersonalNote[]): NoteTreeNode[] {
  const map = new Map<number, NoteTreeNode>();
  for (const n of notes) {
    map.set(n.id, { ...n, children: [] });
  }
  const roots: NoteTreeNode[] = [];
  for (const n of notes) {
    const node = map.get(n.id)!;
    const pid = n.parent_id;
    if (pid != null && map.has(pid)) {
      map.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
