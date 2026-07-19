const API = process.env.NEXT_PUBLIC_API_URL || '';

import { setStoredTenant, tenantHeaders } from '@/lib/tenant';

const AUTH_KEYS = [
  'user',
  'token',
  'permissions',
  'role',
  'username',
  'token_received_at',
  'token_ttl_ms',
] as const;

/** Server JWT lifetime (tenant auth). Used when JWT lacks iat/exp pair. */
export const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;

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

function decodeJwtPayload(token: string): { exp?: number; iat?: number } | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { exp?: number; iat?: number };
  } catch {
    return null;
  }
}

/**
 * Session length from token claims / API — never compare exp to Date.now()
 * (that breaks when the PC clock is wrong).
 */
function ttlMsFromToken(token: string, expiresInSec?: number): number {
  if (typeof expiresInSec === 'number' && Number.isFinite(expiresInSec) && expiresInSec > 0) {
    return Math.round(expiresInSec * 1000);
  }
  const payload = decodeJwtPayload(token);
  if (
    payload?.exp &&
    payload?.iat &&
    typeof payload.exp === 'number' &&
    typeof payload.iat === 'number' &&
    payload.exp > payload.iat
  ) {
    return (payload.exp - payload.iat) * 1000;
  }
  return DEFAULT_SESSION_TTL_MS;
}

/**
 * Bind a relative deadline using the client's local clock only for *elapsed* time.
 * deadline = receivedAt + ttl — both sides use the same (possibly wrong) clock, so skew is fine.
 */
export function bindTokenLifetime(token: string, expiresInSec?: number): void {
  if (typeof window === 'undefined') return;
  try {
    const ttl = ttlMsFromToken(token, expiresInSec);
    localStorage.setItem('token_received_at', String(Date.now()));
    localStorage.setItem('token_ttl_ms', String(ttl));
  } catch {
    // ignore
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

export type SetAuthSessionOptions = {
  /** Seconds until expiry from API (preferred). */
  expiresInSec?: number;
  /**
   * When false, keep the existing relative countdown (e.g. /api/auth/me user refresh).
   * When true (default), start a fresh TTL window for this token.
   */
  resetLifetime?: boolean;
};

/**
 * Replace session entirely — never merge with a previous user.
 * Returns false if localStorage is blocked/full.
 */
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
  options?: SetAuthSessionOptions,
): boolean {
  if (typeof window === 'undefined') return false;

  const role = String(user.role_name || user.role || '').trim();
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const storedUser = {
    ...user,
    role,
    role_name: role,
    permissions,
  };

  const prevReceived = localStorage.getItem('token_received_at');
  const prevTtl = localStorage.getItem('token_ttl_ms');
  const resetLifetime = options?.resetLifetime !== false;

  try {
    // Clear identity keys but preserve lifetime if we're only refreshing the user blob
    for (const key of ['user', 'token', 'permissions', 'role', 'username'] as const) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(storedUser));
    localStorage.setItem('permissions', JSON.stringify(permissions));
    localStorage.setItem('role', role);
    if (user.username) localStorage.setItem('username', String(user.username));

    if (resetLifetime || !prevReceived || !prevTtl) {
      bindTokenLifetime(token, options?.expiresInSec);
    } else {
      localStorage.setItem('token_received_at', prevReceived);
      localStorage.setItem('token_ttl_ms', prevTtl);
    }

    if (localStorage.getItem('token') !== token) {
      clearAuthSession();
      return false;
    }
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
}

/** Sync read of cached permissions (for first paint). */
export function getUserPermissions(): string[] {
  if (typeof window === 'undefined') return [];
  return readStoredPermissions().filter((p): p is string => typeof p === 'string' && p.length > 0);
}

let refreshInflight: Promise<{
  permissions: string[];
  role: string;
  username: string;
} | null> | null = null;

/**
 * Validate current token and refresh role/permissions from API.
 * Returns null if there is no valid session (storage is cleared).
 */
export async function refreshAuthSession(): Promise<{
  permissions: string[];
  role: string;
  username: string;
} | null> {
  if (refreshInflight) return refreshInflight;
  refreshInflight = doRefreshAuthSession().finally(() => {
    refreshInflight = null;
  });
  return refreshInflight;
}

async function doRefreshAuthSession(): Promise<{
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

    // Same token — do not reset the relative countdown
    if (!setAuthSession(token, data.user, { resetLifetime: false })) {
      return null;
    }
    if (data.user.tenant) {
      setStoredTenant(data.user.tenant);
    }

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

/**
 * Remaining ms until local relative session deadline.
 * Independent of whether the PC clock matches real world time.
 */
export function getTokenRemainingMs(): number {
  if (typeof window === 'undefined') return 0;
  const token = getToken();
  if (!token) return 0;

  let received = Number(localStorage.getItem('token_received_at'));
  let ttl = Number(localStorage.getItem('token_ttl_ms'));

  if (!Number.isFinite(received) || !Number.isFinite(ttl) || ttl <= 0) {
    // Migrate older sessions that only stored the JWT
    bindTokenLifetime(token);
    received = Number(localStorage.getItem('token_received_at'));
    ttl = Number(localStorage.getItem('token_ttl_ms'));
  }

  if (!Number.isFinite(received) || !Number.isFinite(ttl) || ttl <= 0) {
    return DEFAULT_SESSION_TTL_MS;
  }

  return Math.max(0, ttl - (Date.now() - received));
}

/** @deprecated Use getTokenRemainingMs() — absolute JWT exp is unsafe with clock skew. */
export function getTokenExpiresAt(): number | null {
  const left = getTokenRemainingMs();
  if (!getToken()) return null;
  return Date.now() + left;
}

/** Ask server for a new 30m JWT and reset the relative countdown. */
export async function renewSessionToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: 'POST',
      headers: tenantHeaders({ Authorization: token }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success || !json.token) return false;
    try {
      localStorage.setItem('token', json.token);
      bindTokenLifetime(
        json.token,
        typeof json.expiresIn === 'number' ? json.expiresIn : undefined,
      );
      return localStorage.getItem('token') === json.token;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}
