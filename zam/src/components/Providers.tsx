'use client';

import React from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConfirmHost } from '@/components/admin/primitives/modal';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
        <ConfirmHost />
      </TooltipProvider>
    </ThemeProvider>
  );
}
