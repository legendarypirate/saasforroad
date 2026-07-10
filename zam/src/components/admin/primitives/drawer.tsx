'use client';

import React from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type DrawerProps = {
  title?: React.ReactNode;
  open?: boolean;
  visible?: boolean;
  onClose?: () => void;
  width?: number | string;
  height?: number | string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  bodyStyle?: React.CSSProperties;
  destroyOnClose?: boolean;
  [key: string]: unknown;
};

export function Drawer({
  title,
  open,
  visible,
  onClose,
  width = 400,
  height,
  children,
  footer,
  extra,
  className,
  placement = 'right',
  bodyStyle,
  destroyOnClose,
}: DrawerProps) {
  const isOpen = open ?? visible ?? false;
  const side = placement === 'left' ? 'left' : placement === 'top' ? 'top' : placement === 'bottom' ? 'bottom' : 'right';

  if (destroyOnClose && !isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose?.()}>
      <SheetContent
        side={side}
        className={cn('flex w-full flex-col gap-0 p-0', className)}
        style={{
          maxWidth: side === 'left' || side === 'right' ? width : undefined,
          height: side === 'top' || side === 'bottom' ? height : undefined,
        }}
      >
        {(title || extra) && (
          <SheetHeader className="flex-row items-center justify-between border-b px-6 py-4">
            {title && <SheetTitle>{title}</SheetTitle>}
            {extra}
          </SheetHeader>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={bodyStyle}>
          {children}
        </div>
        {footer && <div className="border-t px-6 py-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
