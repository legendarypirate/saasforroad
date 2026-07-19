'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Timer } from 'lucide-react';

import {
  bindTokenLifetime,
  clearAuthSession,
  DEFAULT_SESSION_TTL_MS,
  getToken,
  getTokenRemainingMs,
  refreshAuthSession,
  renewSessionToken,
} from '@/lib/auth';
import { uiToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

function formatCountdown(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Countdown uses a *relative* TTL from login/renew time (not JWT exp vs wall clock),
 * so a wrong Windows system time cannot force an instant logout loop.
 * When local TTL hits 0, we still confirm with the server before logging out.
 */
export default function SessionCountdown() {
  const router = useRouter();
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [tickKey, setTickKey] = useState(0);
  const verifyingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const tick = () => {
      if (!getToken()) {
        if (!cancelled) setRemainingMs(null);
        return;
      }

      const left = getTokenRemainingMs();
      if (!cancelled) setRemainingMs(left);

      if (left > 0) return;
      if (verifyingRef.current) return;
      verifyingRef.current = true;

      (async () => {
        try {
          // Local TTL ended — try renew; server clock is authoritative
          const renewed = await renewSessionToken();
          if (cancelled) return;
          if (renewed) {
            setRemainingMs(getTokenRemainingMs());
            setTickKey((k) => k + 1);
            return;
          }

          const session = await refreshAuthSession();
          if (cancelled) return;
          if (session) {
            // Token still valid on server — extend local grace, avoid API spam
            const token = getToken();
            if (token) {
              try {
                localStorage.setItem('token_received_at', String(Date.now()));
                localStorage.setItem(
                  'token_ttl_ms',
                  String(Math.min(5 * 60 * 1000, DEFAULT_SESSION_TTL_MS)),
                );
              } catch {
                bindTokenLifetime(token);
              }
            }
            setRemainingMs(getTokenRemainingMs());
            setTickKey((k) => k + 1);
            return;
          }

          clearAuthSession();
          uiToast.error('Хугацаа дууссан — дахин нэвтэрнэ үү');
          router.replace('/login');
        } finally {
          verifyingRef.current = false;
        }
      })();
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
        const session = await refreshAuthSession();
        if (!session) {
          uiToast.error('Хугацаа шинэчилж чадсангүй — дахин нэвтэрнэ үү');
          clearAuthSession();
          router.replace('/login');
          return;
        }
        uiToast.error('Шинэчилж чадсангүй — дахин оролдоно уу');
        return;
      }
      setRemainingMs(getTokenRemainingMs());
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
