'use client';

import React, { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerProps = {
  value?: Dayjs | null;
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

function toDate(value?: Dayjs | null) {
  if (!value) return undefined;
  return value.toDate();
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
  const format = formatProp ?? (picker === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            className={cn('min-w-[160px] justify-start font-normal', className)}
            style={style}
          />
        }
      >
        <CalendarIcon className="mr-2 size-4 shrink-0" />
        <span className="truncate">
          {value && typeof (value as Dayjs).format === 'function'
            ? (value as Dayjs).format(format)
            : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={toDate(value)}
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
        {allowClear && value && (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange?.(null)}>
              Цэвэрлэх
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
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
