'use client';

import React from 'react';

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
  className?: string;
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
    <select
      value={value == null ? '' : String(value)}
      disabled={disabled}
      className={cn(
        'h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
        className,
      )}
      onChange={(e) => {
        const raw = e.target.value;
        if (!raw && allowClear) {
          onChange?.(undefined);
          return;
        }
        const match = options.find((o) => String(o.value) === raw);
        onChange?.(match?.value);
      }}
    >
      <option value="" disabled={!allowClear}>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
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
