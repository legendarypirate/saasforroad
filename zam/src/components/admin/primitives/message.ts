import { uiToast } from '@/lib/toast';

export const message = {
  success: (text: string) => uiToast.success(text),
  error: (text: string) => uiToast.error(text),
  info: (text: string) => uiToast.info(text),
  warning: (text: string) => uiToast.warning(text),
  loading: (text: string) => uiToast.loading(text),
};
