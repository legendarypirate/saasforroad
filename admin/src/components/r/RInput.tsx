'use client';

import React from 'react';
import { X } from 'lucide-react';

import { Input as UiInput } from '@/components/ui/input';
import { Textarea as UiTextarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { RField } from './RField';

let autoId = 0;
function useFieldId(explicit?: string) {
  const reactId = React.useId();
  return explicit ?? `r-field-${reactId || ++autoId}`;
}

export type RInputProps = Omit<React.ComponentProps<typeof UiInput>, 'prefix'> & {
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  allowClear?: boolean;
  /** Class for the outer field wrapper (width, spacing…). */
  containerClassName?: string;
  onValueChange?: (value: string) => void;
};

export const RInput = React.forwardRef<HTMLInputElement, RInputProps>(
  function RInput(
    {
      label,
      required,
      hint,
      error,
      prefix,
      suffix,
      allowClear,
      containerClassName,
      className,
      id,
      value,
      disabled,
      onChange,
      onValueChange,
      ...props
    },
    ref,
  ) {
    const fieldId = useFieldId(id);
    const hasValue =
      value !== undefined && value !== null && String(value).length > 0;

    const emit = (next: string) => {
      onValueChange?.(next);
    };

    const clear = () => {
      if (disabled) return;
      const event = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
      emit('');
    };

    const control = (
      <div className="relative flex items-center">
        {prefix && (
          <span className="pointer-events-none absolute left-3 z-10 text-muted-foreground [&_svg]:size-4">
            {prefix}
          </span>
        )}
        <UiInput
          ref={ref}
          id={fieldId}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-10',
            prefix && 'pl-9',
            (suffix || allowClear) && 'pr-9',
            className,
          )}
          onChange={(e) => {
            onChange?.(e);
            emit(e.target.value);
          }}
          {...props}
        />
        {allowClear && hasValue && !disabled ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Цэвэрлэх"
            className="absolute right-2 z-10 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          suffix && (
            <span className="absolute right-3 text-muted-foreground [&_svg]:size-4">
              {suffix}
            </span>
          )
        )}
      </div>
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
        htmlFor={fieldId}
        className={containerClassName}
      >
        {control}
      </RField>
    );
  },
);

export type RTextareaProps = React.ComponentProps<typeof UiTextarea> & {
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  containerClassName?: string;
  onValueChange?: (value: string) => void;
};

export const RTextarea = React.forwardRef<HTMLTextAreaElement, RTextareaProps>(
  function RTextarea(
    {
      label,
      required,
      hint,
      error,
      containerClassName,
      className,
      id,
      rows = 3,
      onChange,
      onValueChange,
      ...props
    },
    ref,
  ) {
    const fieldId = useFieldId(id);
    const control = (
      <UiTextarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn('min-h-20', className)}
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        {...props}
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
        htmlFor={fieldId}
        className={containerClassName}
      >
        {control}
      </RField>
    );
  },
);
