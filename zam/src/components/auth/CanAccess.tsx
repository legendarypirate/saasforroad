'use client';

import type { ReactNode } from 'react';
import { usePermissions, ACTIONS } from '@/hooks/usePermissions';

interface CanAccessProps {
  /** Prefix without action, e.g. `finance.accounts` or `finance`, or a full key `finance.accounts:read`. */
  menuIndex: string;
  /** Defaults to `read` (ACTIONS.VIEW). */
  action?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function CanAccess({
  menuIndex,
  action = ACTIONS.VIEW,
  fallback = null,
  children,
}: CanAccessProps) {
  const { canAccess, ready } = usePermissions();

  if (!ready || !canAccess(menuIndex, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
