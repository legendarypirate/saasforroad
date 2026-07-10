'use client';

import React from 'react';

import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type SelectOptionProps = {
  value: string | number;
  children?: React.ReactNode;
};

function SelectOption({ value, children }: SelectOptionProps) {
  return <SelectItem value={String(value)}>{children}</SelectItem>;
}

type SelectProps = {
  value?: string | number | null;
  defaultValue?: string | number;
  onChange?: (value: any, option?: any) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  allowClear?: boolean;
  children?: React.ReactNode;
  options?: Array<{ label: React.ReactNode; value: string | number }>;
  mode?: 'multiple' | 'tags';
  showSearch?: boolean;
  optionFilterProp?: string;
  filterOption?: boolean | ((input: string, option: any) => boolean);
  [key: string]: unknown;
};

function SelectBase({
  value,
  onChange,
  placeholder,
  className,
  style,
  disabled,
  children,
  options,
}: SelectProps) {
  const childOptions = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<SelectOptionProps> =>
      React.isValidElement(child) && child.type === SelectOption,
  );

  const items =
    options ??
    childOptions.map((child) => ({
      value: child.props.value,
      label: child.props.children,
    }));

  return (
    <UiSelect
      value={value !== undefined && value !== null ? String(value) : undefined}
      onValueChange={(v) => onChange?.(v)}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full', className)} style={style}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={String(item.value)} value={String(item.value)}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </UiSelect>
  );
}

export const Select = Object.assign(SelectBase, { Option: SelectOption });
