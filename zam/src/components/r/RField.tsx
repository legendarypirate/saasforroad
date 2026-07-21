'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { RText } from './RText';

export type RFieldProps = {
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
};

/** Shared label / hint / error scaffold for form controls. */
export function RField({
  label,
  required,
  hint,
  error,
  htmlFor,
  className,
  children,
}: RFieldProps) {
  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="inline-flex items-center gap-1">
          <RText variant="label">{label}</RText>
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <RText variant="caption" tone="danger">
          {error}
        </RText>
      ) : (
        hint && <RText variant="caption">{hint}</RText>
      )}
    </div>
  );
}
