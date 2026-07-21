'use client';

import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { RButton } from './RButton';

const SIZE_WIDTH: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 400,
  md: 520,
  lg: 720,
  xl: 960,
};

export type RModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Custom footer. Pass `null` to hide the footer entirely. */
  footer?: React.ReactNode | null;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  confirmLoading?: boolean;
  okDisabled?: boolean;
  /** Render the confirm button as destructive (delete confirmations). */
  danger?: boolean;
  width?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  destroyOnClose?: boolean;
  className?: string;
  bodyClassName?: string;
};

/** Canonical centered dialog for confirmations and compact CRUD forms. */
export function RModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  okText = 'Хадгалах',
  cancelText = 'Болих',
  onOk,
  confirmLoading,
  okDisabled,
  danger,
  width,
  size = 'md',
  destroyOnClose,
  className,
  bodyClassName,
}: RModalProps) {
  if (destroyOnClose && !open) return null;

  const maxWidth = width ?? SIZE_WIDTH[size];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        style={{ maxWidth }}
        className={cn('w-full sm:max-w-[unset]', className)}
      >
        <DialogHeader className={cn(!title && !description && 'sr-only')}>
          <DialogTitle>{title ?? 'Цонх'}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children != null && <div className={bodyClassName}>{children}</div>}

        {footer !== null && (
          <DialogFooter>
            {footer ?? (
              <>
                <RButton variant="outline" onClick={onClose}>
                  {cancelText}
                </RButton>
                <RButton
                  variant={danger ? 'danger' : 'primary'}
                  onClick={onOk}
                  loading={confirmLoading}
                  disabled={okDisabled}
                >
                  {okText}
                </RButton>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
