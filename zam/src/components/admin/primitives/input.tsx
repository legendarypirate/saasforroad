'use client';

import React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

import { Input as UiInput } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type InputProps = Omit<React.ComponentProps<typeof UiInput>, 'prefix'> & {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  addonBefore?: React.ReactNode;
  allowClear?: boolean;
  onSearch?: (value: string) => void;
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  enterButton?: boolean | React.ReactNode;
};

function BaseInput({
  prefix,
  suffix,
  className,
  addonAfter,
  addonBefore,
  allowClear,
  onPressEnter,
  onSearch,
  enterButton,
  onChange,
  onKeyDown,
  value,
  defaultValue,
  disabled,
  ...props
}: InputProps) {
  // Strip Ant Design-only props so they never reach the DOM.
  void onSearch;
  void enterButton;

  const hasValue = value !== undefined && value !== null && String(value).length > 0;

  const handleClear = () => {
    if (disabled) return;
    const event = {
      target: { value: '' },
      currentTarget: { value: '' },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange?.(event);
  };

  const widthClass = className; // may include w-[…] for filter bars

  const input = (
    <div className={cn('relative flex items-center', widthClass ?? 'w-full')}>
      {prefix && <span className="pointer-events-none absolute left-3 z-10 text-muted-foreground">{prefix}</span>}
      <UiInput
        className={cn(
          'h-10 w-full',
          prefix && 'pl-9',
          (suffix || allowClear) && 'pr-9',
        )}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={onChange}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.key === 'Enter') onPressEnter?.(e);
        }}
        {...props}
      />
      {allowClear && hasValue && !disabled ? (
        <button
          type="button"
          className="absolute right-2 z-10 rounded p-0.5 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
          aria-label="Цэвэрлэх"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        suffix && <span className="absolute right-3 text-muted-foreground">{suffix}</span>
      )}
    </div>
  );

  if (addonBefore || addonAfter) {
    return (
      <div className={cn('flex items-center gap-2', widthClass ?? 'w-full')}>
        {addonBefore}
        <div className="relative flex min-w-0 flex-1 items-center">
          {prefix && <span className="pointer-events-none absolute left-3 z-10 text-muted-foreground">{prefix}</span>}
          <UiInput
            className={cn(
              'h-10 w-full',
              prefix && 'pl-9',
              (suffix || allowClear) && 'pr-9',
            )}
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            onChange={onChange}
            onKeyDown={(e) => {
              onKeyDown?.(e);
              if (e.key === 'Enter') onPressEnter?.(e);
            }}
            {...props}
          />
          {allowClear && hasValue && !disabled ? (
            <button
              type="button"
              className="absolute right-2 z-10 rounded p-0.5 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
              aria-label="Цэвэрлэх"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            suffix && <span className="absolute right-3 text-muted-foreground">{suffix}</span>
          )}
        </div>
        {addonAfter}
      </div>
    );
  }

  return input;
}

function PasswordInput({ className, ...props }: InputProps) {
  const [visible, setVisible] = React.useState(false);
  return (
    <BaseInput
      {...props}
      type={visible ? 'text' : 'password'}
      className={className}
      suffix={
        <button type="button" onClick={() => setVisible((v) => !v)} className="text-muted-foreground">
          {visible ? 'Hide' : 'Show'}
        </button>
      }
    />
  );
}

function TextAreaInput({
  rows = 3,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  allowClear?: boolean;
  onPressEnter?: unknown;
  onSearch?: unknown;
  enterButton?: unknown;
  prefix?: unknown;
  suffix?: unknown;
  addonAfter?: unknown;
  addonBefore?: unknown;
}) {
  const {
    allowClear: _allowClear,
    onPressEnter: _onPressEnter,
    onSearch: _onSearch,
    enterButton: _enterButton,
    prefix: _prefix,
    suffix: _suffix,
    addonAfter: _addonAfter,
    addonBefore: _addonBefore,
    ...rest
  } = props;
  return <Textarea rows={rows} className={cn('min-h-20', className)} {...rest} />;
}

function SearchInput({
  onSearch,
  onChange,
  onPressEnter,
  value,
  placeholder,
  className,
  allowClear,
  enterButton,
  prefix,
  suffix,
  addonAfter,
  addonBefore,
  ...props
}: InputProps) {
  void allowClear;
  void enterButton;
  void prefix;
  void suffix;
  void addonAfter;
  void addonBefore;

  return (
    <div className={cn('relative inline-flex items-center', className ?? 'w-full')}>
      <UiInput
        value={value}
        placeholder={placeholder}
        className="h-10 w-full pr-9"
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onPressEnter?.(e);
            onSearch?.((e.target as HTMLInputElement).value);
          }
        }}
        {...props}
      />
      <button
        type="button"
        className="absolute right-2 text-muted-foreground"
        onClick={() => onSearch?.(String(value ?? ''))}
      >
        <SearchIcon className="size-4" />
      </button>
    </div>
  );
}

export const Input = Object.assign(BaseInput, {
  Password: PasswordInput,
  TextArea: TextAreaInput,
  Search: SearchInput,
});

type InputNumberProps = Omit<React.ComponentProps<typeof UiInput>, 'onChange' | 'value'> & {
  min?: number;
  max?: number;
  step?: number;
  addonAfter?: React.ReactNode;
  addonBefore?: React.ReactNode;
  onChange?: (value: number | string | null) => void;
  value?: number | string | null;
};

export function InputNumber({
  className,
  min,
  max,
  step,
  addonAfter,
  addonBefore,
  onChange,
  value,
  ...props
}: InputNumberProps) {
  const input = (
    <UiInput
      type="number"
      min={min}
      max={max}
      step={step}
      value={value === null || value === undefined ? '' : value}
      className={cn('h-10', className)}
      onChange={(e) => {
        const raw = e.target.value;
        onChange?.(raw === '' ? null : Number.isNaN(Number(raw)) ? raw : Number(raw));
      }}
      {...props}
    />
  );

  if (addonBefore || addonAfter) {
    return (
      <div className="flex w-full items-center gap-2">
        {addonBefore}
        {input}
        {addonAfter}
      </div>
    );
  }

  return input;
}
