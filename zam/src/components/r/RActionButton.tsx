'use client';

import React from 'react';
import {
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Download,
  Copy,
  Check,
  Plus,
  type LucideIcon,
} from 'lucide-react';

import { Button as UiButton } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type RActionPreset =
  | 'view'
  | 'edit'
  | 'delete'
  | 'more'
  | 'download'
  | 'copy'
  | 'check'
  | 'add';

type Tone = 'default' | 'primary' | 'danger' | 'success';

const PRESETS: Record<RActionPreset, { icon: LucideIcon; label: string; tone: Tone }> = {
  view: { icon: Eye, label: 'Харах', tone: 'default' },
  edit: { icon: Pencil, label: 'Засах', tone: 'primary' },
  delete: { icon: Trash2, label: 'Устгах', tone: 'danger' },
  more: { icon: MoreHorizontal, label: 'Бусад', tone: 'default' },
  download: { icon: Download, label: 'Татах', tone: 'default' },
  copy: { icon: Copy, label: 'Хуулах', tone: 'default' },
  check: { icon: Check, label: 'Баталгаажуулах', tone: 'success' },
  add: { icon: Plus, label: 'Нэмэх', tone: 'primary' },
};

const TONE_CLASS: Record<Tone, string> = {
  default: 'text-muted-foreground hover:text-foreground',
  primary: 'text-primary hover:text-primary',
  danger: 'text-destructive hover:text-destructive',
  success: 'text-emerald-600 hover:text-emerald-600 dark:text-emerald-400',
};

const SIZE_MAP = {
  sm: 'icon-xs',
  md: 'icon-sm',
  lg: 'icon',
} as const;

export type RActionButtonProps = Omit<
  React.ComponentProps<typeof UiButton>,
  'size' | 'children'
> & {
  /** Quick preset that sets the icon, tooltip label and tone. */
  preset?: RActionPreset;
  /** Custom icon (overrides preset icon). */
  icon?: React.ReactNode;
  /** Tooltip text (overrides preset label). Pass null to disable the tooltip. */
  label?: string | null;
  tone?: Tone;
  size?: keyof typeof SIZE_MAP;
};

export function RActionButton({
  preset,
  icon,
  label,
  tone,
  size = 'md',
  className,
  ...props
}: RActionButtonProps) {
  const presetDef = preset ? PRESETS[preset] : undefined;
  const Icon = presetDef?.icon;
  const resolvedTone = tone ?? presetDef?.tone ?? 'default';
  const resolvedLabel = label === undefined ? presetDef?.label : label;

  const button = (
    <UiButton
      type="button"
      variant="ghost"
      size={SIZE_MAP[size]}
      aria-label={resolvedLabel ?? undefined}
      className={cn(TONE_CLASS[resolvedTone], className)}
      {...props}
    >
      {icon ?? (Icon ? <Icon /> : null)}
    </UiButton>
  );

  if (!resolvedLabel) return button;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent>{resolvedLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
