'use client';

import React from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type REmptyProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Custom icon node, or a Lucide icon component via `iconType`. */
  icon?: React.ReactNode;
  iconType?: LucideIcon;
  /** Call-to-action slot (e.g. an RButton). */
  action?: React.ReactNode;
  className?: string;
  /** Compact padding for inline table cells. */
  size?: 'default' | 'lg';
};

/**
 * Canonical empty state — large outline icon + title + muted description.
 * Matches the admin “Ангилал олдсонгүй” empty table pattern.
 */
export function REmpty({
  title = 'Мэдээлэл олдсонгүй',
  description = 'Одоогоор бүртгэгдсэн мэдээлэл байхгүй байна.',
  icon,
  iconType: IconType,
  action,
  className,
  size = 'lg',
}: REmptyProps) {
  const Icon = IconType ?? Inbox;

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center text-center',
        size === 'lg' ? 'gap-3 px-6 py-16 sm:py-20' : 'gap-2 px-4 py-10',
        className,
      )}
    >
      <div className="text-muted-foreground/35 [&_svg]:stroke-[1.25]">
        {icon ?? <Icon className={size === 'lg' ? 'size-16 sm:size-20' : 'size-12'} />}
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
