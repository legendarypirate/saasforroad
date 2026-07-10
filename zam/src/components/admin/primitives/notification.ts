import React from 'react';
import { toast } from 'sonner';

type NotificationOpenArgs = {
  message?: React.ReactNode;
  description?: React.ReactNode;
  duration?: number;
  style?: React.CSSProperties;
  closeIcon?: React.ReactNode;
  showProgress?: boolean;
  [key: string]: unknown;
};

export const notification = {
  success: (args: string | NotificationOpenArgs) => {
    const text = typeof args === 'string' ? args : String(args.description ?? args.message ?? '');
    toast.success(text);
  },
  error: (args: string | NotificationOpenArgs) => {
    const text = typeof args === 'string' ? args : String(args.description ?? args.message ?? '');
    toast.error(text);
  },
  warning: (args: string | NotificationOpenArgs) => {
    const text = typeof args === 'string' ? args : String(args.description ?? args.message ?? '');
    toast.warning(text);
  },
  info: (args: string | NotificationOpenArgs) => {
    const text = typeof args === 'string' ? args : String(args.description ?? args.message ?? '');
    toast.info(text);
  },
  open: (args: NotificationOpenArgs) => {
    const text = args.description ?? args.message ?? '';
    toast(String(text), { duration: (args.duration ?? 4) * 1000 });
  },
};
