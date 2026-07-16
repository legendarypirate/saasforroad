import { getToken } from '@/lib/auth';
import type { AdminFolderSectionId } from '@/config/adminNavigation';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export type FolderSectionKey = AdminFolderSectionId | 'modules' | 'data';

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
  orderedIds?: string[] | null,
): T[] {
  if (!orderedIds?.length) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const next: T[] = [];
  const seen = new Set<string>();
  for (const id of orderedIds) {
    const item = byId.get(id);
    if (!item || seen.has(id)) continue;
    next.push(item);
    seen.add(id);
  }
  for (const item of items) {
    if (seen.has(item.id)) continue;
    next.push(item);
  }
  return next;
}

export async function saveFolderOrderToServer(order: FolderOrderMap) {
  const token = getToken();
  if (!token || !API) return;
  try {
    await fetch(`${API}/api/auth/me/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ folderOrder: order }),
    });
  } catch {
    // non-blocking
  }
}
