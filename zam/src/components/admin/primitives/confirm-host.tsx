'use client';

import React, { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ConfirmOptions = {
  title?: React.ReactNode;
  content?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  centered?: boolean;
  width?: number;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  okButtonProps?: Record<string, unknown>;
  cancelButtonProps?: Record<string, unknown>;
  [key: string]: unknown;
};

let setConfirmState: React.Dispatch<React.SetStateAction<ConfirmOptions | null>> | null = null;

export function confirmDialog(options: ConfirmOptions) {
  setConfirmState?.(options);
}

export function ConfirmHost() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setConfirmState = setOptions;
    return () => {
      setConfirmState = null;
    };
  }, []);

  const close = () => {
    options?.onCancel?.();
    setOptions(null);
  };

  const confirm = async () => {
    try {
      setLoading(true);
      await options?.onOk?.();
      setOptions(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={!!options} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent style={{ maxWidth: options?.width ?? 480 }}>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.content && (
            <AlertDialogDescription>
              <div>{options.content}</div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={close}>{options?.cancelText ?? 'Үгүй'}</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={loading}>
            {options?.okText ?? 'Тийм'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
