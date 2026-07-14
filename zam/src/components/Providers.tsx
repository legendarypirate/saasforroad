'use client';

import React from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';
import { TenantProvider } from '@/components/TenantProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConfirmHost } from '@/components/admin/primitives/modal';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <TenantProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
          <ConfirmHost />
        </TenantProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
