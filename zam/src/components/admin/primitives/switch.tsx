'use client';

import React from 'react';

import { Switch as UiSwitch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** Form.Item with valuePropName="checked" injects this */
  onCheckedChange?: (checked: boolean) => void;
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
  onCheckedChange,
  disabled,
  className,
  checkedChildren,
  unCheckedChildren,
  style,
}: SwitchProps) {
  const handleChange = (next: boolean) => {
    onCheckedChange?.(next);
    onChange?.(next);
  };

  return (
    <div className="inline-flex items-center gap-2">
      <UiSwitch
        checked={checked}
        onCheckedChange={handleChange}
        disabled={disabled}
        className={className}
        style={style}
      />
      {(checked ? checkedChildren : unCheckedChildren) && (
        <span className={cn('text-sm', disabled && 'opacity-50')}>
          {checked ? checkedChildren : unCheckedChildren}
        </span>
      )}
    </div>
  );
}
