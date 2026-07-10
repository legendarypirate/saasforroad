'use client';

import React, { useState } from 'react';

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

type PopconfirmProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  children?: React.ReactNode;
  okText?: string;
  cancelText?: string;
};

export function Popconfirm({
  title = 'Баталгаажуулах уу?',
  description,
  onConfirm,
  children,
  okText = 'Тийм',
  cancelText = 'Үгүй',
}: PopconfirmProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelText}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onConfirm?.();
                setOpen(false);
              }}
            >
              {okText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
