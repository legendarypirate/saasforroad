'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

import { AdminModuleNav } from '@/components/admin/AdminModuleNav';
import {
  filterNavItems,
  getModuleForPath,
  type ModuleConfig,
} from '@/config/adminNavigation';

interface ModuleSubNavProps {
  userPermissions: string[];
  userRole?: string;
}

function resolveSelectedKey(pathname: string, mod: ModuleConfig): string {
  const exact = mod.items.find((item) => pathname === item.path);
  if (exact) return exact.path;

  const prefix = mod.items
    .filter((item) => pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return prefix?.path ?? mod.items[0].path;
}

/**
 * Module-aware wrapper around {@link AdminModuleNav}.
 * Used once from AdminLayout for every multi-page admin module.
 */
export default function ModuleSubNav({ userPermissions, userRole }: ModuleSubNavProps) {
  const pathname = usePathname();
  const mod = getModuleForPath(pathname);

  if (!mod) return null;

  const items = filterNavItems(mod.items, userPermissions, userRole);
  // Single-item modules don't need a redundant sub-nav.
  if (items.length === 0) return null;
  if (items.length === 1 && mod.items.length <= 1) return null;

  const selectedKey = resolveSelectedKey(pathname, mod);

  return (
    <AdminModuleNav
      title={mod.label}
      accentColor={mod.color}
      activeKey={selectedKey}
      items={items.map((item) => ({
        key: item.path,
        label: item.label,
        href: item.path,
      }))}
    />
  );
}
