'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Timer } from 'lucide-react';

import { clearAuthSession, getTokenExpiresAt, renewSessionToken } from '@/lib/auth';
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
  const [renewing, setRenewing] = useState(false);
  const [tickKey, setTickKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let loggedOut = false;

    const tick = () => {
      const exp = getTokenExpiresAt();
      if (!exp) {
        if (!cancelled) setRemainingMs(null);
        return;
      }
      const left = Math.max(0, exp - Date.now());
      if (!cancelled) setRemainingMs(left);

      if (left <= 0 && !loggedOut) {
        loggedOut = true;
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
  }, [router, tickKey]);

  const handleRenew = async () => {
    if (renewing) return;
    setRenewing(true);
    try {
      const ok = await renewSessionToken();
      if (!ok) {
        uiToast.error('Хугацаа шинэчилж чадсангүй');
        return;
      }
      const exp = getTokenExpiresAt();
      setRemainingMs(exp ? Math.max(0, exp - Date.now()) : null);
      setTickKey((k) => k + 1);
      uiToast.success('Сесс 30 минутаар шинэчлэгдлээ');
    } finally {
      setRenewing(false);
    }
  };

  if (remainingMs == null) return null;

  const urgent = remainingMs <= 60_000;
  const warn = remainingMs <= 5 * 60_000;

  return (
    <div className="hidden items-center gap-1.5 sm:inline-flex">
      <div
        title="Автоматаар гарах хүртэл үлдсэн хугацаа"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs tabular-nums',
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
      <button
        type="button"
        onClick={handleRenew}
        disabled={renewing}
        title="Сессийг 30 минутаар шинэчлэх"
        className={cn(
          'inline-flex h-7 items-center gap-1 rounded-full border border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors',
          'hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        <RefreshCw className={cn('size-3.5', renewing && 'animate-spin')} aria-hidden />
        Шинэчлэх
      </button>
    </div>
  );
}
