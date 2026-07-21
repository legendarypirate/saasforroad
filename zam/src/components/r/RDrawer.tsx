'use client';

import React from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export type RDrawerSide = 'left' | 'right' | 'top' | 'bottom';

export type RDrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned header slot (buttons, tags…). */
  extra?: React.ReactNode;
  /** Sticky footer (usually the save/cancel actions). */
  footer?: React.ReactNode;
  side?: RDrawerSide;
  width?: number | string;
  height?: number | string;
  /** Unmount the content while closed (fresh state each open). */
  destroyOnClose?: boolean;
  className?: string;
  bodyClassName?: string;
  bodyStyle?: React.CSSProperties;
  children?: React.ReactNode;
};

/**
 * Canonical slide-over used for CRUD create/edit forms.
 * Built on the shared `ui/sheet` base with a consistent header/body/footer.
 */
export function RDrawer({
  open,
  onClose,
  title,
  description,
  extra,
  footer,
  side = 'right',
  width = 480,
  height,
  destroyOnClose,
  className,
  bodyClassName,
  bodyStyle,
  children,
}: RDrawerProps) {
  if (destroyOnClose && !open) return null;

  const horizontal = side === 'left' || side === 'right';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={side}
        className={cn('flex w-full flex-col gap-0 p-0', className)}
        style={{
          maxWidth: horizontal ? width : undefined,
          height: horizontal ? undefined : height,
        }}
      >
        <SheetHeader
          className={cn(
            'flex-row items-center justify-between gap-3 border-b px-5 py-4',
            !title && !description && !extra && 'sr-only',
          )}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <SheetTitle>{title ?? 'Дэлгэрэнгүй'}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </div>
          {extra && <div className="shrink-0">{extra}</div>}
        </SheetHeader>

        <div
          className={cn('flex-1 overflow-y-auto px-5 py-4', bodyClassName)}
          style={bodyStyle}
        >
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t bg-muted/40 px-5 py-3">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
