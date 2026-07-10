'use client';

import React from 'react';

import { Switch as UiSwitch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  checkedChildren?: React.ReactNode;
  unCheckedChildren?: React.ReactNode;
  style?: React.CSSProperties;
  [key: string]: unknown;
};

export function Switch({
  checked,
  onChange,
  disabled,
  className,
  checkedChildren,
  unCheckedChildren,
  style,
}: SwitchProps) {
  return (
    <label className="inline-flex items-center gap-2">
      <UiSwitch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={className}
        style={style}
      />
      {(checked ? checkedChildren : unCheckedChildren) && (
        <span className={cn('text-sm', disabled && 'opacity-50')}>
          {checked ? checkedChildren : unCheckedChildren}
        </span>
      )}
    </label>
  );
}
