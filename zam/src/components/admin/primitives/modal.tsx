'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { uiToast } from '@/lib/toast';

import { Button } from './button';
import { ConfirmHost, confirmDialog } from './confirm-host';

type ModalProps = {
  title?: React.ReactNode;
  open?: boolean;
  visible?: boolean;
  onCancel?: () => void;
  onOk?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode | null;
  confirmLoading?: boolean;
  okText?: string;
  cancelText?: string;
  width?: number;
  centered?: boolean;
  destroyOnClose?: boolean;
  okButtonProps?: Record<string, unknown>;
  cancelButtonProps?: Record<string, unknown>;
  styles?: { header?: React.CSSProperties; body?: React.CSSProperties; footer?: React.CSSProperties };
  [key: string]: unknown;
};

function ModalComponent({
  title,
  open,
  visible,
  onCancel,
  onOk,
  children,
  footer,
  confirmLoading,
  okText = 'OK',
  cancelText = 'Цуцлах',
  width,
  destroyOnClose,
}: ModalProps) {
  const isOpen = open ?? visible ?? false;

  if (destroyOnClose && !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onCancel?.()}>
      <DialogContent style={{ maxWidth: width ?? 520 }} className="sm:max-w-lg">
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div>{children}</div>
        {footer !== null && (
          <DialogFooter>
            {footer ?? (
              <>
                <Button type="default" onClick={onCancel}>
                  {cancelText}
                </Button>
                <Button type="primary" onClick={onOk} loading={confirmLoading}>
                  {okText}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const Modal = Object.assign(ModalComponent, {
  confirm: confirmDialog,
  error: (opts: { title?: React.ReactNode; content?: React.ReactNode }) =>
    uiToast.error(String(opts.content ?? opts.title ?? 'Алдаа')),
  success: (opts: { title?: React.ReactNode; content?: React.ReactNode }) =>
    uiToast.success(String(opts.content ?? opts.title ?? 'Амжилттай')),
  warning: (opts: { title?: React.ReactNode; content?: React.ReactNode }) =>
    uiToast.warning(String(opts.content ?? opts.title ?? 'Анхааруулга')),
  info: (opts: { title?: React.ReactNode; content?: React.ReactNode }) =>
    uiToast.info(String(opts.content ?? opts.title ?? 'Мэдээлэл')),
});

export { ConfirmHost };
