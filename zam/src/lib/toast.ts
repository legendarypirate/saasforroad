import { toast } from 'sonner';

/** Sonner toast helpers for admin pages. */
export const uiToast = {
  success: (text: string) => toast.success(text),
  error: (text: string) => toast.error(text),
  info: (text: string) => toast.info(text),
  warning: (text: string) => toast.warning(text),
  loading: (text: string) => toast.loading(text),
};
