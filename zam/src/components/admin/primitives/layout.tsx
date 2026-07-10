'use client';

import React from 'react';

import { cn } from '@/lib/utils';

type LayoutProps = React.HTMLAttributes<HTMLDivElement>;

function LayoutRoot({ className, style, children, ...props }: LayoutProps) {
  return (
    <div className={cn('min-h-screen', className)} style={style} {...props}>
      {children}
    </div>
  );
}

function Header({ className, style, children, ...props }: LayoutProps) {
  return (
    <header className={cn('bg-background', className)} style={style} {...props}>
      {children}
    </header>
  );
}

function Content({ className, style, children, ...props }: LayoutProps) {
  return (
    <main className={cn('flex-1', className)} style={style} {...props}>
      {children}
    </main>
  );
}

function Sider({ className, style, children, ...props }: LayoutProps) {
  return (
    <aside className={cn('shrink-0', className)} style={style} {...props}>
      {children}
    </aside>
  );
}

export const Layout = Object.assign(LayoutRoot, { Header, Content, Sider });
