'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm',
        isDark && 'border-[color:var(--neon-border)] shadow-[var(--neon-glow-sm)]',
        className,
      )}
      title={isDark ? 'Гэрэл горим' : 'Харанхуй горим'}
    >
      <Sun
        className={cn(
          'size-4 transition-colors',
          isDark ? 'text-muted-foreground' : 'text-amber-500',
        )}
      />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label="Харанхуй горим солих"
        className={cn(
          isDark &&
            'data-checked:bg-[var(--neon-green)] data-checked:shadow-[var(--neon-glow-sm)]',
        )}
      />
      <Moon
        className={cn(
          'size-4 transition-colors',
          isDark ? 'text-[var(--neon-green)]' : 'text-muted-foreground',
        )}
      />
    </div>
  );
}
