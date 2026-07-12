import { hasPermission, isAdminRole } from '@/config/adminNavigation';

/** Standard action suffixes for Module → Menu → Action keys. */
export const ACTIONS = {
  MODULE: 'module',
  VIEW: 'read',
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  WRITE: 'write',
  EXPORT: 'export',
} as const;

export type ActionName = (typeof ACTIONS)[keyof typeof ACTIONS];

/**
 * Build a permission key.
 * - menuIndex `finance.accounts` + action `read` → `finance.accounts:read`
 * - menuIndex `finance` + action `module` → `finance:module`
 * - If menuIndex already contains `:`, it is treated as a full key (action ignored).
 */
export function buildPermissionKey(menuIndex: string, action: string = ACTIONS.VIEW): string {
  const trimmed = menuIndex.trim();
  if (!trimmed) return '';
  if (trimmed.includes(':')) return trimmed;
  return `${trimmed}:${action}`;
}

export function canPermission(
  key: string | undefined,
  userPermissions: string[],
  userRole?: string | null,
  options?: { ready?: boolean },
): boolean {
  if (!key) return true;
  if (isAdminRole(userRole)) return true;

  // Still loading session — deny so PageWrapper can show loader
  if (options?.ready === false) return false;

  return hasPermission(key, userPermissions);
}

export function canAccessPermission(
  menuIndex: string,
  action: string,
  userPermissions: string[],
  userRole?: string | null,
  options?: { ready?: boolean },
): boolean {
  return canPermission(buildPermissionKey(menuIndex, action), userPermissions, userRole, options);
}
