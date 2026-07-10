'use client';

import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

import { Input as UiInput } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<typeof UiInput> & {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonAfter?: React.ReactNode;
  addonBefore?: React.ReactNode;
  allowClear?: boolean;
  onSearch?: (value: string) => void;
  enterButton?: boolean | React.ReactNode;
  [key: string]: unknown;
};

function BaseInput({ prefix, suffix, className, addonAfter, addonBefore, ...props }: InputProps) {
  const input = (
    <div className="relative flex w-full flex-1 items-center">
      {prefix && <span className="pointer-events-none absolute left-3 text-muted-foreground">{prefix}</span>}
      <UiInput className={cn('h-10', prefix && 'pl-9', suffix && 'pr-9', className)} {...props} />
      {suffix && <span className="absolute right-3 text-muted-foreground">{suffix}</span>}
    </div>
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

function TextAreaInput({ rows = 3, className, ...props }: React.ComponentProps<typeof Textarea>) {
  return <Textarea rows={rows} className={cn('min-h-20', className)} {...props} />;
}

function SearchInput({
  onSearch,
  onChange,
  value,
  placeholder,
  className,
  ...props
}: InputProps) {
  return (
    <div className="relative flex w-full items-center">
      <UiInput
        value={value}
        placeholder={placeholder}
        className={cn('pr-9', className)}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
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
  [key: string]: unknown;
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
