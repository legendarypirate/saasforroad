'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';

type SelectOptionProps = {
  value: string | number;
  children?: React.ReactNode;
};

function SelectOption(_props: SelectOptionProps) {
  // Marker component — options are read from children by SelectBase.
  return null;
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

function resolvePortalContainer(anchor: HTMLElement | null): HTMLElement {
  if (typeof document === 'undefined') return document.body;
  const host =
    anchor?.closest('[data-slot="sheet-content"], [data-slot="dialog-content"]') ?? null;
  return (host as HTMLElement | null) ?? document.body;
}

function SelectBase({
  value,
  onChange,
  placeholder = 'Сонгох',
  className,
  style,
  disabled,
  allowClear,
  children,
  options,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerWrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const resolved =
    value !== undefined && value !== null && value !== '' ? String(value) : undefined;
  const selected = items.find((item) => String(item.value) === resolved);

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

    const top = rect.bottom - containerRect.top + 4;
    let left = rect.left - containerRect.left;
    const width = Math.max(rect.width, 160);
    const maxLeft =
      (container === document.body ? window.innerWidth : container.clientWidth) - width - 8;
    left = Math.max(8, Math.min(left, maxLeft));
    setCoords({ top, left, width });
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

    // Use bubble phase so the trigger click that opened the menu is not cancelled.
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  const pick = (next: string | number | undefined) => {
    onChange?.(next);
    setOpen(false);
  };

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            data-select-popup=""
            role="listbox"
            className="z-[200] max-h-60 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
            style={{
              top: coords.top,
              left: coords.left,
              width: coords.width,
              position:
                resolvePortalContainer(triggerWrapRef.current) === document.body
                  ? 'fixed'
                  : 'absolute',
            }}
          >
            {items.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Хоосон</div>
            ) : (
              items.map((item) => {
                const itemValue = String(item.value);
                const isSelected = itemValue === resolved;
                return (
                  <button
                    key={itemValue}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      isSelected && 'bg-accent/60',
                    )}
                    onClick={() => pick(item.value)}
                  >
                    <span className="flex-1 truncate">{item.label}</span>
                    {isSelected && <Check className="size-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>,
          resolvePortalContainer(triggerWrapRef.current),
        )
      : null;

  return (
    <>
      <div ref={triggerWrapRef} className="relative w-full">
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-input/30',
            className,
          )}
          style={style}
          onClick={() => !disabled && setOpen((v) => !v)}
        >
          <span className={cn('truncate text-left', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {allowClear && resolved && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pick(undefined);
                }}
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronDown className="size-4 text-muted-foreground" />
          </span>
        </button>
      </div>
      {panel}
    </>
  );
}

export const Select = Object.assign(SelectBase, { Option: SelectOption });
