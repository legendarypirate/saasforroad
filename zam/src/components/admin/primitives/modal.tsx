'use client';

import React from 'react';

import { RModal } from '@/components/r/RModal';
import { uiToast } from '@/lib/toast';

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

/**
 * AntD-shaped Modal, rendered through the shared {@link RModal} kit so all
 * CRUD dialogs & confirmations share one look & behaviour.
 */
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
  return (
    <RModal
      open={open ?? visible ?? false}
      onClose={() => onCancel?.()}
      title={title}
      footer={footer === null ? null : footer}
      okText={okText}
      cancelText={cancelText}
      onOk={onOk}
      confirmLoading={confirmLoading}
      width={width}
      destroyOnClose={destroyOnClose}
    >
      {children}
    </RModal>
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
