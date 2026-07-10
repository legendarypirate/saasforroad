'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
  // Show even a single item — previously `<= 1` hid the whole HR bar when
  // permissions only allowed one page (common on stale Windows sessions).
  if (items.length === 0) return null;

  const selectedKey = resolveSelectedKey(pathname, mod);
  const isDenseNav =
    mod.id === 'hse' ||
    mod.id === 'hr' ||
    mod.id === 'finance' ||
    mod.id === 'uniform-supply' ||
    mod.id === 'rental' ||
    mod.id === 'equipment' ||
    items.length >= 10;

  if (isDenseNav) {
    const cols =
      items.length > 14
        ? 'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9'
        : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7';

    return (
      <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-2">
            <span
              className="h-4 w-1 rounded-full"
              style={{ backgroundColor: mod.color || 'var(--primary)' }}
              aria-hidden
            />
            <p className="text-sm font-semibold text-foreground">{mod.label}</p>
          </div>
          <nav aria-label={mod.label} className={cn('grid gap-1.5', cols)}>
            {items.map((item) => {
              const active = selectedKey === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => router.push(item.path)}
                  title={item.label}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-center text-[11px] font-medium leading-snug transition-all sm:text-xs',
                    'whitespace-normal break-words',
                    active
                      ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-background px-4 pb-0 pt-3 sm:px-6">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{mod.label}</p>
      <Tabs value={selectedKey} onValueChange={(key) => router.push(key)}>
        <div className="w-full overflow-x-auto">
          <TabsList
            variant="line"
            className="h-auto min-w-max justify-start rounded-none border-0 bg-transparent p-0"
          >
            {items.map((item) => (
              <TabsTrigger key={item.path} value={item.path} className="shrink-0 px-4 py-2">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}
