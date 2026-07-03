const API = process.env.NEXT_PUBLIC_API_URL || '';

function readStoredPermissions(): string[] {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return [];
    const user = JSON.parse(userStr);
    return user.permissions || [];
  } catch {
    return [];
  }
}

function readStoredRole(): string {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return '';
    const user = JSON.parse(userStr);
    return user.role || localStorage.getItem('role') || '';
  } catch {
    return '';
  }
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
      const merged = { ...prev, ...data.user };
      localStorage.setItem('user', JSON.stringify(merged));
      if (merged.permissions) {
        localStorage.setItem('permissions', JSON.stringify(merged.permissions));
      }
      if (merged.role) localStorage.setItem('role', merged.role);
      return merged.permissions || [];
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
