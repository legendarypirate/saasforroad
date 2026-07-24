'use client';

import React from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
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

function resolveSize(value?: number | string) {
  if (value == null) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

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
  width = 560,
  height,
  destroyOnClose,
  className,
  bodyClassName,
  bodyStyle,
  children,
}: RDrawerProps) {
  if (destroyOnClose && !open) return null;

  const horizontal = side === 'left' || side === 'right';
  const sizeValue = resolveSize(horizontal ? width : height);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={side}
        className={cn(
          'flex w-full flex-col gap-0 p-0',
          /* Override shadcn Sheet default sm:max-w-sm so custom widths work */
          horizontal && 'sm:max-w-none',
          className,
        )}
        style={{
          width: horizontal ? sizeValue : undefined,
          maxWidth: horizontal ? '100vw' : undefined,
          height: !horizontal ? sizeValue : undefined,
        }}
      >
        <SheetHeader
          className={cn(
            'space-y-0 border-b bg-background px-6 py-4 text-left',
            !title && !description && !extra && 'sr-only',
          )}
        >
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="flex min-w-0 flex-col gap-1">
              <SheetTitle className="text-lg font-semibold tracking-tight">
                {title ?? 'Дэлгэрэнгүй'}
              </SheetTitle>
              {description ? (
                <SheetDescription className="text-sm leading-relaxed">
                  {description}
                </SheetDescription>
              ) : null}
            </div>
            {extra ? <div className="shrink-0 pt-0.5">{extra}</div> : null}
          </div>
        </SheetHeader>

        <div
          className={cn('flex-1 overflow-y-auto px-6 py-5', bodyClassName)}
          style={bodyStyle}
        >
          {children}
        </div>

        {footer ? (
          <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t bg-muted/30 px-6 py-4 sm:space-x-0">
            {footer}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
