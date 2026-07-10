const API = process.env.NEXT_PUBLIC_API_URL || '';

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

/** Sync read of cached permissions (for first paint). */
export function getUserPermissions(): string[] {
  if (typeof window === 'undefined') return [];
  return readStoredPermissions();
}

/** Load permissions from API (fresh), fallback to localStorage. */
export async function loadUserPermissions(): Promise<string[]> {
  const token = localStorage.getItem('token');
  if (!token) return readStoredPermissions();

  try {
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { Authorization: token },
    });
    if (!res.ok) return readStoredPermissions();

    const data = await res.json();
    if (data.success && data.user) {
      const existing = localStorage.getItem('user');
      const prev = existing ? JSON.parse(existing) : {};
      const merged = {
        ...prev,
        ...data.user,
        // Prefer role name from API; keep string role for nav checks
        role: data.user.role || data.user.role_name || prev.role,
        role_name: data.user.role_name || data.user.role || prev.role_name,
      };
      localStorage.setItem('user', JSON.stringify(merged));
      if (merged.permissions) {
        localStorage.setItem('permissions', JSON.stringify(merged.permissions));
      }
      if (merged.role) localStorage.setItem('role', String(merged.role));
      return Array.isArray(merged.permissions) ? merged.permissions : [];
    }
  } catch {
    /* use cache */
  }

  return readStoredPermissions();
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
