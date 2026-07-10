'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function ModuleSubNav({ userPermissions, userRole }: ModuleSubNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mod = getModuleForPath(pathname);

  if (!mod) return null;

  const items = filterNavItems(mod.items, userPermissions, userRole);
  // Single-item modules (e.g. homepage) don't need a sub-nav bar
  if (items.length <= 1) return null;

  const selectedKey = resolveSelectedKey(pathname, mod);

  return (
    <div className="border-b border-border bg-background px-6 pb-0 pt-3">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{mod.label}</p>
      <Tabs value={selectedKey} onValueChange={(key) => router.push(key)}>
        <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0">
          {items.map((item) => (
            <TabsTrigger key={item.path} value={item.path} className="px-4 py-2">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
