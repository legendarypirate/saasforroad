'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

type RateProps = {
  value?: number | string | null;
  defaultValue?: number;
  count?: number;
  allowHalf?: boolean;
  allowClear?: boolean;
  disabled?: boolean;
  onChange?: (value: number) => void;
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Interactive star rating (1–5), Form.Item compatible via value/onChange. */
export function Rate({
  value,
  defaultValue = 0,
  count = 5,
  allowHalf = true,
  allowClear = true,
  disabled = false,
  onChange,
  className,
}: RateProps) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const parsed = Number(value);
  const current = controlled
    ? Number.isFinite(parsed)
      ? parsed
      : 0
    : inner;
  const display = hover ?? current;

  const commit = (next: number) => {
    if (disabled) return;
    let v = clamp(next, 0, count);
    if (allowClear && v === current) v = 0;
    if (!controlled) setInner(v);
    onChange?.(v);
  };

  const pickFromEvent = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!allowHalf) return index + 1;
    const rect = e.currentTarget.getBoundingClientRect();
    const left = e.clientX < rect.left + rect.width / 2;
    return left ? index + 0.5 : index + 1;
  };

  return (
    <div
      className={cn('inline-flex items-center gap-1', disabled && 'pointer-events-none opacity-90', className)}
      role="radiogroup"
      aria-label="Үнэлгээ"
    >
      {Array.from({ length: count }, (_, i) => {
        const full = display >= i + 1;
        const half = !full && display >= i + 0.5;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            className={cn(
              'relative inline-flex size-8 items-center justify-center rounded-md transition-transform',
              !disabled && 'hover:scale-110 active:scale-95',
              disabled ? 'cursor-default' : 'cursor-pointer',
            )}
            aria-label={`${i + 1} од`}
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              if (disabled) return;
              setHover(pickFromEvent(i, e));
            }}
            onClick={(e) => commit(pickFromEvent(i, e))}
          >
            <Star className="size-7 text-muted-foreground/30" strokeWidth={1.6} />
            {(full || half) && (
              <span
                className="pointer-events-none absolute inset-0 flex items-center justify-start overflow-hidden"
                style={{ width: half ? '50%' : '100%' }}
              >
                <Star
                  className="size-7 shrink-0 fill-amber-400 text-amber-400"
                  strokeWidth={1.6}
                />
              </span>
            )}
          </button>
        );
      })}
      {!disabled && (
        <span className="ml-1.5 min-w-8 text-sm font-semibold tabular-nums text-foreground">
          {current > 0 ? (current % 1 === 0 ? String(current) : current.toFixed(1)) : '—'}
        </span>
      )}
    </div>
  );
}
