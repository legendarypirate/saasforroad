'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ACTIONS,
  buildPermissionKey,
  canAccessPermission,
  canPermission,
  type ActionName,
} from '@/lib/rbac';
import { getUserPermissions, getUserRole, loadUserPermissions } from '@/lib/auth';
import { isAdminRole } from '@/config/adminNavigation';

export function usePermissions() {
  // Stable SSR/client defaults — read session only in useEffect
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPermissions(getUserPermissions());
      setRole(getUserRole());
      const perms = await loadUserPermissions();
      if (cancelled) return;
      setPermissions(perms);
      setRole(getUserRole());
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = isAdminRole(role);

  const can = useCallback(
    (key?: string) => canPermission(key, permissions, role, { ready }),
    [permissions, role, ready],
  );

  const canAccess = useCallback(
    (menuIndex: string, action: string = ACTIONS.VIEW) =>
      canAccessPermission(menuIndex, action, permissions, role, { ready }),
    [permissions, role, ready],
  );

  const canModule = useCallback(
    (index: string) => canAccess(index, ACTIONS.MODULE),
    [canAccess],
  );

  return {
    permissions,
    role,
    ready,
    isAdmin,
    can,
    canAccess,
    canModule,
    buildKey: buildPermissionKey,
    ACTIONS,
  };
}

export type { ActionName };
export { ACTIONS, buildPermissionKey };
