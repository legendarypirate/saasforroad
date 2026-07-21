'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { RText } from './RText';

export type RSpinnerProps = {
  className?: string;
  /** Center inside a min-height block with an optional label. */
  center?: boolean;
  label?: React.ReactNode;
  size?: number;
};

export function RSpinner({ className, center, label, size = 20 }: RSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn('animate-spin text-muted-foreground', className)}
      style={{ width: size, height: size }}
      aria-label="Ачааллаж байна"
      role="status"
    />
  );

  if (!center) return spinner;

  return (
    <div className="flex min-h-40 w-full flex-col items-center justify-center gap-3">
      {spinner}
      {label && <RText variant="muted">{label}</RText>}
    </div>
  );
}
