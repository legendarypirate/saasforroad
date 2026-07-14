const API = process.env.NEXT_PUBLIC_API_URL || '';

import { setStoredTenant, tenantHeaders } from '@/lib/tenant';

const AUTH_KEYS = ['user', 'token', 'permissions', 'role', 'username'] as const;

function readStoredPermissions(): string[] {
  try {
    const fromKey = localStorage.getItem('permissions');
    if (fromKey) {
      const parsed = JSON.parse(fromKey);
      if (Array.isArray(parsed)) return parsed;
    }
    const userStr = localStorage.getItem('user');
    if (!userStr) return [];
    const user = JSON.parse(userStr);
    return Array.isArray(user.permissions) ? user.permissions : [];
  } catch {
    return [];
  }
}

function readStoredRole(): string {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const fromUser = user.role_name || user.role || '';
      if (typeof fromUser === 'string' && fromUser.trim()) return fromUser.trim();
    }
    return (localStorage.getItem('role') || '').trim();
  } catch {
    return '';
  }
}

/** Wipe all auth-related storage (logout / invalid token). */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  for (const key of AUTH_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

/** Replace session entirely — never merge with a previous user. */
export function setAuthSession(
  token: string,
  user: {
    id?: number;
    username?: string;
    role?: string;
    role_name?: string;
    role_id?: number | null;
    permissions?: string[];
    [key: string]: unknown;
  },
): void {
  if (typeof window === 'undefined') return;
  clearAuthSession();

  const role = String(user.role_name || user.role || '').trim();
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const storedUser = {
    ...user,
    role,
    role_name: role,
    permissions,
  };

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(storedUser));
  localStorage.setItem('permissions', JSON.stringify(permissions));
  localStorage.setItem('role', role);
  if (user.username) localStorage.setItem('username', String(user.username));
}

/** Sync read of cached permissions (for first paint). */
export function getUserPermissions(): string[] {
  if (typeof window === 'undefined') return [];
  return readStoredPermissions().filter((p): p is string => typeof p === 'string' && p.length > 0);
}

/**
 * Validate current token and refresh role/permissions from API.
 * Returns null if there is no valid session (storage is cleared).
 */
export async function refreshAuthSession(): Promise<{
  permissions: string[];
  role: string;
  username: string;
} | null> {
  const token = localStorage.getItem('token');
  if (!token) {
    clearAuthSession();
    return null;
  }

  try {
    const res = await fetch(`${API}/api/auth/me`, {
      headers: tenantHeaders({ Authorization: token }),
    });

    if (res.status === 401 || res.status === 403) {
      clearAuthSession();
      return null;
    }

    if (!res.ok) {
      // Network/server error — keep cache only if we still have a user blob
      const role = readStoredRole();
      const permissions = readStoredPermissions();
      if (!role && permissions.length === 0 && !localStorage.getItem('user')) {
        clearAuthSession();
        return null;
      }
      return {
        permissions,
        role,
        username: getUsername(),
      };
    }

    const data = await res.json();
    if (!data.success || !data.user) {
      clearAuthSession();
      return null;
    }

    // Keep the same token; replace user/permissions completely
    setAuthSession(token, data.user);
    if (data.user.tenant) {
      setStoredTenant(data.user.tenant);
    }

    // Sync folder order cache from server preferences
    try {
      const folderOrder = data.user?.ui_preferences?.folderOrder;
      if (folderOrder && typeof folderOrder === 'object' && data.user?.id != null) {
        localStorage.setItem(
          `admin_folder_order_${data.user.id}`,
          JSON.stringify(folderOrder),
        );
      }
    } catch {
      // ignore
    }

    return {
      permissions: Array.isArray(data.user.permissions) ? data.user.permissions : [],
      role: String(data.user.role || data.user.role_name || ''),
      username: data.user.username || getUsername(),
    };
  } catch {
    const role = readStoredRole();
    const permissions = readStoredPermissions();
    if (!localStorage.getItem('user')) return null;
    return { permissions, role, username: getUsername() };
  }
}

/** Load permissions from API (fresh), clear session if token is invalid. */
export async function loadUserPermissions(): Promise<string[]> {
  const session = await refreshAuthSession();
  return session?.permissions ?? [];
}

export function getUserRole(): string {
  return readStoredRole();
}

export function getUsername(): string {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return 'Admin';
    const user = JSON.parse(userStr);
    return user.username || 'Admin';
  } catch {
    return 'Admin';
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/** JWT `exp` as epoch ms, or null if missing/invalid. */
export function getTokenExpiresAt(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (!payload.exp || typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

/** Remaining ms until JWT expiry (0 if already expired). */
export function getTokenRemainingMs(): number {
  const exp = getTokenExpiresAt();
  if (!exp) return 0;
  return Math.max(0, exp - Date.now());
}

/** Ask server for a new 30m JWT and store it. */
export async function renewSessionToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: token },
    });
    const json = await res.json();
    if (!res.ok || !json.success || !json.token) return false;
    localStorage.setItem('token', json.token);
    return true;
  } catch {
    return false;
  }
}

