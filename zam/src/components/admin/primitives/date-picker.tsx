'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type DatePickerProps = {
  value?: Dayjs | string | null;
  onChange?: (date: Dayjs | null, dateString?: string) => void;
  format?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  allowClear?: boolean;
  disabled?: boolean;
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year';
  showTime?: boolean;
  [key: string]: unknown;
};

function toDayjs(value?: Dayjs | string | null): Dayjs | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }
  if (typeof (value as Dayjs).format === 'function' && (value as Dayjs).isValid?.()) {
    return value as Dayjs;
  }
  return null;
}

function toDate(value?: Dayjs | string | null) {
  const d = toDayjs(value);
  return d ? d.toDate() : undefined;
}

/** Prefer sheet/dialog content so the calendar stays inside the modal focus scope. */
function resolvePortalContainer(anchor: HTMLElement | null): HTMLElement {
  if (typeof document === 'undefined') return document.body;
  const host =
    anchor?.closest('[data-slot="sheet-content"], [data-slot="dialog-content"]') ?? null;
  return (host as HTMLElement | null) ?? document.body;
}

function DatePickerBase({
  value,
  onChange,
  format: formatProp,
  placeholder = 'Огноо сонгох',
  style,
  className,
  allowClear = true,
  disabled,
  picker,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerWrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const format = formatProp ?? (picker === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD');
  const resolved = toDayjs(value);

  useEffect(() => setMounted(true), []);

  const updatePosition = () => {
    const el = triggerWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const container = resolvePortalContainer(el);
    const containerRect =
      container === document.body
        ? { top: 0, left: 0 }
        : container.getBoundingClientRect();

    // Position relative to the portal container (sheet/dialog or viewport).
    const top = rect.bottom - containerRect.top + 4;
    let left = rect.left - containerRect.left;
    const panelWidth = Math.max(rect.width, 288);
    const maxLeft =
      (container === document.body ? window.innerWidth : container.clientWidth) - panelWidth - 8;
    left = Math.max(8, Math.min(left, maxLeft));

    setCoords({ top, left, width: panelWidth });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerWrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const onReposition = () => updatePosition();

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onReposition);
    // Capture scroll from drawer body and nested scrollers.
    window.addEventListener('scroll', onReposition, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            data-date-picker-popup=""
            className="absolute z-[200] rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-md ring-1 ring-foreground/10"
            style={{
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              position:
                resolvePortalContainer(triggerWrapRef.current) === document.body
                  ? 'fixed'
                  : 'absolute',
            }}
          >
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={toDate(resolved)}
              onSelect={(date) => {
                const next = date
                  ? picker === 'month'
                    ? dayjs(date).startOf('month')
                    : dayjs(date)
                  : null;
                onChange?.(next, next ? next.format(format) : undefined);
                setOpen(false);
              }}
            />
            {allowClear && resolved && (
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onChange?.(null);
                    setOpen(false);
                  }}
                >
                  Цэвэрлэх
                </Button>
              </div>
            )}
          </div>,
          resolvePortalContainer(triggerWrapRef.current),
        )
      : null;

  return (
    <>
      <div ref={triggerWrapRef} className="inline-flex w-full min-w-[160px]">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn('w-full justify-start font-normal', className)}
          style={style}
          onClick={() => setOpen((v) => !v)}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          <span className="truncate">{resolved ? resolved.format(format) : placeholder}</span>
        </Button>
      </div>
      {panel}
    </>
  );
}

type RangeValue = [Dayjs | null, Dayjs | null] | null;

type RangePickerProps = {
  value?: RangeValue;
  onChange?: (dates: RangeValue) => void;
  format?: string;
  placeholder?: [string, string];
  style?: React.CSSProperties;
  className?: string;
  [key: string]: unknown;
};

function RangePicker({
  value,
  onChange,
  format = 'YYYY-MM-DD',
  placeholder = ['Эхлэх', 'Дуусах'],
  style,
  className,
}: RangePickerProps) {
  const [start, end] = value ?? [null, null];

  return (
    <div className={cn('grid gap-2 sm:grid-cols-2', className)} style={style}>
      <DatePickerBase
        value={start}
        onChange={(d) => onChange?.([d, end])}
        format={format}
        placeholder={placeholder[0]}
      />
      <DatePickerBase
        value={end}
        onChange={(d) => onChange?.([start, d])}
        format={format}
        placeholder={placeholder[1]}
      />
    </div>
  );
}

export const DatePicker = Object.assign(DatePickerBase, { RangePicker });
