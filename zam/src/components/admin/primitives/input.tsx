'use client';

import React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

import { Input as UiInput } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  formatMoneyGrouped,
  formatMoneyTyping,
  parseMoneyInput,
} from '@/lib/money';
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

type InputNumberProps = Omit<
  React.ComponentProps<typeof UiInput>,
  'onChange' | 'value' | 'type' | 'size'
> & {
  min?: number;
  max?: number;
  step?: number;
  size?: 'small' | 'middle' | 'large' | string;
  addonAfter?: React.ReactNode;
  addonBefore?: React.ReactNode;
  onChange?: (value: number | string | null) => void;
  value?: number | string | null;
  /** AntD-compatible: blur/commit on Enter. */
  onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>;
  /** Show 4,000,000-style grouping; still emits number | null */
  money?: boolean;
  maxFractionDigits?: number;
};

const NUMBER_SIZE_CLASS: Record<string, string> = {
  small: 'h-8 text-sm',
  middle: 'h-10',
  large: 'h-11',
};

export function InputNumber({
  className,
  min,
  max,
  step,
  size = 'middle',
  addonAfter,
  addonBefore,
  onChange,
  value,
  money,
  maxFractionDigits = 2,
  onPressEnter,
  onKeyDown,
  controls: _controls,
  formatter: _formatter,
  parser: _parser,
  ...props
}: InputNumberProps & {
  controls?: unknown;
  formatter?: unknown;
  parser?: unknown;
}) {
  void _controls;
  void _formatter;
  void _parser;

  if (money) {
    return (
      <MoneyInput
        className={className}
        min={min}
        max={max}
        size={size}
        addonAfter={addonAfter}
        addonBefore={addonBefore}
        onChange={onChange}
        value={value}
        maxFractionDigits={maxFractionDigits}
        onPressEnter={onPressEnter}
        onKeyDown={onKeyDown}
        {...props}
      />
    );
  }

  const sizeClass = NUMBER_SIZE_CLASS[size] ?? NUMBER_SIZE_CLASS.middle;

  const input = (
    <UiInput
      type="number"
      min={min}
      max={max}
      step={step}
      value={value === null || value === undefined ? '' : value}
      className={cn(sizeClass, className)}
      onChange={(e) => {
        const raw = e.target.value;
        onChange?.(raw === '' ? null : Number.isNaN(Number(raw)) ? raw : Number(raw));
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === 'Enter') onPressEnter?.(e);
      }}
      {...props}
    />
  );

  if (addonBefore || addonAfter) {
    return (
      <div
        className={cn(
          'flex w-full items-stretch overflow-hidden rounded-lg border border-input bg-transparent',
          size === 'small' ? 'h-8' : size === 'large' ? 'h-11' : 'h-10',
        )}
      >
        {addonBefore ? (
          <span className="flex items-center bg-muted/50 px-2 text-xs text-muted-foreground">
            {addonBefore}
          </span>
        ) : null}
        <div className="min-w-0 flex-1 [&_input]:h-full [&_input]:rounded-none [&_input]:border-0 [&_input]:shadow-none [&_input]:ring-0">
          {input}
        </div>
        {addonAfter ? (
          <span className="flex items-center bg-muted/50 px-2 text-xs text-muted-foreground">
            {addonAfter}
          </span>
        ) : null}
      </div>
    );
  }

  return input;
}

type MoneyInputProps = Omit<InputNumberProps, 'money' | 'step' | 'type'>;

/** Money amount input: displays 4,000,000, emits number | null for forms/APIs. */
export function MoneyInput({
  className,
  min,
  max,
  addonAfter,
  addonBefore,
  onChange,
  value,
  maxFractionDigits = 2,
  onBlur,
  onFocus,
  onKeyDown,
  onPressEnter,
  size = 'middle',
  controls: _controls,
  formatter: _formatter,
  parser: _parser,
  ...props
}: MoneyInputProps & {
  size?: 'small' | 'middle' | 'large' | string;
  onPressEnter?: React.KeyboardEventHandler<HTMLInputElement>;
  controls?: unknown;
  formatter?: unknown;
  parser?: unknown;
}) {
  void _controls;
  void _formatter;
  void _parser;
  const [text, setText] = React.useState(() =>
    formatMoneyGrouped(value as number | string | null | undefined, maxFractionDigits),
  );
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) {
      setText(formatMoneyGrouped(value as number | string | null | undefined, maxFractionDigits));
    }
  }, [value, focused, maxFractionDigits]);

  const emit = (raw: string) => {
    let n = parseMoneyInput(raw);
    if (n !== null) {
      if (min !== undefined && n < min) n = min;
      if (max !== undefined && n > max) n = max;
    }
    onChange?.(n);
  };

  const sizeClass = NUMBER_SIZE_CLASS[size] ?? NUMBER_SIZE_CLASS.middle;

  const input = (
    <UiInput
      inputMode="decimal"
      autoComplete="off"
      value={text}
      className={cn(sizeClass, 'tabular-nums', className)}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        const n = parseMoneyInput(text);
        setText(formatMoneyGrouped(n, maxFractionDigits));
        emit(text);
        onBlur?.(e);
      }}
      onChange={(e) => {
        const next = formatMoneyTyping(e.target.value, maxFractionDigits);
        setText(next);
        emit(next);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === 'Enter') onPressEnter?.(e);
      }}
      {...props}
    />
  );

  if (addonBefore || addonAfter) {
    return (
      <div
        className={cn(
          'flex w-full items-stretch overflow-hidden rounded-lg border border-input bg-transparent',
          size === 'small' ? 'h-8' : size === 'large' ? 'h-11' : 'h-10',
        )}
      >
        {addonBefore ? (
          <span className="flex items-center bg-muted/50 px-2 text-xs text-muted-foreground">
            {addonBefore}
          </span>
        ) : null}
        <div className="min-w-0 flex-1 [&_input]:h-full [&_input]:rounded-none [&_input]:border-0 [&_input]:shadow-none [&_input]:ring-0">
          {input}
        </div>
        {addonAfter ? (
          <span className="flex items-center bg-muted/50 px-2 text-xs text-muted-foreground">
            {addonAfter}
          </span>
        ) : null}
      </div>
    );
  }

  return input;
}

