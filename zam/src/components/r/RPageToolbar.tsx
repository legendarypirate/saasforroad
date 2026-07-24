'use client';

import React from 'react';

import { cn } from '@/lib/utils';

/**
 * Standard admin list page chrome:
 * top actions row + full-width search strip (matches CRM list screens).
 */
export function RPageToolbar({
  title,
  tabs,
  actions,
  search,
  filters,
  className,
}: {
  title?: React.ReactNode;
  tabs?: React.ReactNode;
  actions?: React.ReactNode;
  search?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 space-y-3', className)}>
      {(title || tabs || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            {title ? (
              <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {title}
              </h1>
            ) : null}
            {tabs}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      )}
      {(search || filters) && (
        <div className="rounded-xl border border-[#e5e7eb] bg-card p-3 shadow-sm dark:border-border">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {search ? <div className="min-w-0 flex-1">{search}</div> : null}
            {filters ? (
              <div className="flex flex-wrap items-center gap-2">{filters}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
