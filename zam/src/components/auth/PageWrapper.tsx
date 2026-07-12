'use client';

import * as React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ACTIONS } from '@/lib/rbac';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  /** e.g. `finance.accounts` or `system.role` — gates the page. */
  menuIndex?: string;
  /** Defaults to VIEW (`read`). */
  requiredAction?: string;
  className?: string;
  deniedText?: string;
}

export function PageWrapper({
  children,
  menuIndex,
  requiredAction = ACTIONS.VIEW,
  className = '',
  deniedText = 'Та энэ хуудсыг үзэх эрхгүй байна',
}: PageWrapperProps) {
  const { canAccess, ready } = usePermissions();

  if (!menuIndex) {
    return <div className={cn(className)}>{children}</div>;
  }

  if (!ready) {
    return (
      <div className="flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-6 text-primary" />
        <span>Уншиж байна...</span>
      </div>
    );
  }

  if (!canAccess(menuIndex, requiredAction)) {
    return (
      <div className="flex h-full min-h-[240px] w-full items-center justify-center text-sm text-muted-foreground">
        {deniedText}
      </div>
    );
  }

  return (
    <div className={cn(className)}>{children}</div>
  );
}
