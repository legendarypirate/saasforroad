'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

import { Input as UiInput } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type RSearchProps = Omit<
  React.ComponentProps<typeof UiInput>,
  'onChange' | 'value' | 'type'
> & {
  value?: string;
  onChange?: (value: string) => void;
  /** Fired on Enter or clear. */
  onSearch?: (value: string) => void;
  allowClear?: boolean;
  containerClassName?: string;
};

export function RSearch({
  value = '',
  onChange,
  onSearch,
  allowClear = true,
  placeholder = 'Хайх…',
  className,
  containerClassName,
  disabled,
  ...props
}: RSearchProps) {
  const hasValue = value.length > 0;
  return (
    <div className={cn('relative flex items-center', containerClassName ?? 'w-64 max-w-full')}>
      <Search className="pointer-events-none absolute left-3 z-10 size-4 text-muted-foreground" />
      <UiInput
        type="search"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        className={cn('h-10 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden', className)}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch?.((e.target as HTMLInputElement).value);
        }}
        {...props}
      />
      {allowClear && hasValue && !disabled && (
        <button
          type="button"
          aria-label="Цэвэрлэх"
          className="absolute right-2 z-10 rounded p-0.5 text-muted-foreground hover:text-foreground"
          onClick={() => {
            onChange?.('');
            onSearch?.('');
          }}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
