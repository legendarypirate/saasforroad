'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

import { Input as UiInput } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { RButton } from './RButton';

export type RSearchProps = Omit<
  React.ComponentProps<typeof UiInput>,
  'onChange' | 'value' | 'type'
> & {
  value?: string;
  onChange?: (value: string) => void;
  /** Fired on Enter, clear, or search button click. */
  onSearch?: (value: string) => void;
  allowClear?: boolean;
  containerClassName?: string;
  /** Show a primary "Хайх" button on the right (list-page pattern). */
  showButton?: boolean;
  buttonLabel?: string;
};

export function RSearch({
  value = '',
  onChange,
  onSearch,
  allowClear = true,
  placeholder = 'Хайлт хийх',
  className,
  containerClassName,
  disabled,
  showButton = false,
  buttonLabel = 'Хайх',
  ...props
}: RSearchProps) {
  const hasValue = value.length > 0;

  const input = (
    <div className={cn('relative flex min-w-0 flex-1 items-center')}>
      <Search className="pointer-events-none absolute left-3 z-10 size-4 text-muted-foreground" />
      <UiInput
        type="search"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'h-10 border-[#e5e7eb] bg-white pr-9 pl-9 shadow-none [&::-webkit-search-cancel-button]:hidden dark:bg-card',
          showButton && 'rounded-r-none border-r-0',
          className,
        )}
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

  if (!showButton) {
    return (
      <div className={cn('relative flex items-center', containerClassName ?? 'w-64 max-w-full')}>
        {input}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex w-full max-w-full items-stretch overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-sm dark:border-border dark:bg-card',
        containerClassName,
      )}
    >
      <div className="min-w-0 flex-1 [&_input]:border-0 [&_input]:shadow-none [&_input]:ring-0">
        {input}
      </div>
      <RButton
        type="button"
        variant="primary"
        size="md"
        disabled={disabled}
        className="h-10 shrink-0 rounded-none rounded-r-lg px-5"
        onClick={() => onSearch?.(value)}
      >
        {buttonLabel}
      </RButton>
    </div>
  );
}
