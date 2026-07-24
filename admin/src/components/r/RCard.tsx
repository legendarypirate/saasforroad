'use client';

import React from 'react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type RCardProps = React.ComponentProps<typeof Card> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned header slot (buttons, menus…). */
  action?: React.ReactNode;
  footer?: React.ReactNode;
  /** Remove default content padding when embedding full-bleed content. */
  flush?: boolean;
  bodyClassName?: string;
};

export function RCard({
  title,
  description,
  action,
  footer,
  flush,
  className,
  bodyClassName,
  children,
  ...props
}: RCardProps) {
  const hasHeader = title || description || action;
  return (
    <Card className={className} {...props}>
      {hasHeader && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      {children != null && (
        <CardContent className={cn(flush && 'px-0', bodyClassName)}>
          {children}
        </CardContent>
      )}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
