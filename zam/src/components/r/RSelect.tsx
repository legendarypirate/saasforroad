'use client';

import React from 'react';

import { Select as SelectEngine } from '@/components/admin/primitives/select';
import { cn } from '@/lib/utils';
import { RField } from './RField';

export type ROption<V extends string | number = string | number> = {
  label: React.ReactNode;
  value: V;
};

export type RSelectProps<V extends string | number = string | number> = {
  options: ROption<V>[];
  value?: V | null;
  onChange?: (value: V | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Class for the trigger (e.g. width). */
  className?: string;
  /** Class for the outer field wrapper. */
  containerClassName?: string;
};

export function RSelect<V extends string | number = string | number>({
  options,
  value,
  onChange,
  placeholder = 'Сонгох',
  disabled,
  allowClear,
  label,
  required,
  hint,
  error,
  className,
  containerClassName,
}: RSelectProps<V>) {
  const control = (
    <SelectEngine
      value={value ?? undefined}
      onChange={(next: string | number | undefined) =>
        onChange?.(next as V | undefined)
      }
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      className={cn('w-full', className)}
    />
  );

  if (!label && !hint && !error) {
    return <div className={cn('w-full', containerClassName)}>{control}</div>;
  }

  return (
    <RField
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      {control}
    </RField>
  );
}
