'use client';

import React from 'react';

import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type TooltipProps = {
  title?: React.ReactNode;
  children?: React.ReactNode;
};

export function Tooltip({ title, children }: TooltipProps) {
  if (!title) return <>{children}</>;
  return (
    <UiTooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{children}</TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </UiTooltip>
  );
}
