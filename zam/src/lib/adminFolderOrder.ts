import { getToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export type FolderSectionKey = 'modules' | 'data';

export type FolderOrderMap = Partial<Record<FolderSectionKey, string[]>>;

export type UiPreferences = {
  folderOrder?: FolderOrderMap;
  [key: string]: unknown;
};

function storageKey(userId: number | string) {
  return `admin_folder_order_${userId}`;
}

export function getStoredUserId(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    const id = Number(user?.id);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export function readLocalFolderOrder(userId?: number | null): FolderOrderMap {
  if (typeof window === 'undefined') return {};
  const id = userId ?? getStoredUserId();
  if (id == null) return {};
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) {
      // Fallback: preferences embedded in user blob from /auth/me
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const prefs = user?.ui_preferences as UiPreferences | undefined;
        return prefs?.folderOrder && typeof prefs.folderOrder === 'object'
          ? prefs.folderOrder
          : {};
      }
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeLocalFolderOrder(order: FolderOrderMap, userId?: number | null) {
  if (typeof window === 'undefined') return;
  const id = userId ?? getStoredUserId();
  if (id == null) return;
  localStorage.setItem(storageKey(id), JSON.stringify(order));

  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    user.ui_preferences = {
      ...(user.ui_preferences && typeof user.ui_preferences === 'object'
        ? user.ui_preferences
        : {}),
      folderOrder: order,
    };
    localStorage.setItem('user', JSON.stringify(user));
  } catch {
    // ignore
  }
}

/** Reorder items by saved id list; unknown/new ids append at the end. */
export function applyFolderOrder<T extends { id: string }>(
  items: T[],
  orderIds?: string[] | null,
): T[] {
  if (!orderIds?.length) return items;
  const map = new Map(items.map((item) => [item.id, item]));
  const ordered: T[] = [];
  for (const id of orderIds) {
    const item = map.get(id);
    if (item) {
      ordered.push(item);
      map.delete(id);
    }
  }
  for (const item of items) {
    if (map.has(item.id)) ordered.push(item);
  }
  return ordered;
}

export async function saveFolderOrderToServer(order: FolderOrderMap): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API}/api/auth/preferences`, {
      method: 'PATCH',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folderOrder: order }),
    });
    const json = await res.json();
    return Boolean(res.ok && json.success);
  } catch {
    return false;
  }
}

export function folderOrderFromPreferences(prefs?: UiPreferences | null): FolderOrderMap {
  if (!prefs?.folderOrder || typeof prefs.folderOrder !== 'object') return {};
  return prefs.folderOrder;
}
