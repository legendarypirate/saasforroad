'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Timer } from 'lucide-react';

import { clearAuthSession, getTokenExpiresAt } from '@/lib/auth';
import { uiToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

function formatCountdown(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Shows time remaining until JWT auto-logout (server issues 30m tokens).
 */
export default function SessionCountdown() {
  const router = useRouter();
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const tick = () => {
      const exp = getTokenExpiresAt();
      if (!exp) {
        if (!cancelled) setRemainingMs(null);
        return;
      }
      const left = Math.max(0, exp - Date.now());
      if (!cancelled) setRemainingMs(left);

      if (left <= 0) {
        clearAuthSession();
        uiToast.error('Хугацаа дууссан — дахин нэвтэрнэ үү');
        router.replace('/login');
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [router]);

  if (remainingMs == null) return null;

  const urgent = remainingMs <= 60_000;
  const warn = remainingMs <= 5 * 60_000;

  return (
    <div
      title="Автоматаар гарах хүртэл үлдсэн хугацаа"
      className={cn(
        'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs tabular-nums sm:inline-flex',
        urgent
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : warn
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
            : 'border-border bg-muted/50 text-muted-foreground',
      )}
      aria-live="polite"
      aria-label={`Автоматаар гарах хүртэл ${formatCountdown(remainingMs)}`}
    >
      <Timer className="size-3.5 shrink-0 opacity-80" aria-hidden />
      <span>{formatCountdown(remainingMs)}</span>
    </div>
  );
}
