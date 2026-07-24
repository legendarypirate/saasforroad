'use client';

import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

export type AdminModuleNavItem = {
  key: string;
  label: string;
  href: string;
};

export type AdminModuleNavProps = {
  /** Module title shown above the links (e.g. "Бараа материал", "HR удирдлага"). */
  title: string;
  items: AdminModuleNavItem[];
  /** Active item key (usually the path). */
  activeKey: string;
  className?: string;
  /** Optional accent bar beside the title. */
  accentColor?: string;
};

/**
 * Canonical admin module sub-navigation.
 * Minimal text links — active state is bold only (no button chrome).
 */
export function AdminModuleNav({
  title,
  items,
  activeKey,
  className,
  accentColor,
}: AdminModuleNavProps) {
  return (
    <div
      className={cn(
        'border-y border-border bg-background px-4 py-3 sm:px-6',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {accentColor ? (
          <span
            className="h-3.5 w-0.5 rounded-full"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
        ) : null}
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </div>

      <nav
        aria-label={title}
        className="flex min-w-0 items-center gap-5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const active = activeKey === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              title={item.label}
              className={cn(
                'shrink-0 text-sm whitespace-nowrap transition-colors',
                active
                  ? 'font-bold text-foreground'
                  : 'font-normal text-muted-foreground hover:text-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
