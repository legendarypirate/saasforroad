"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getTokenExpiresAt, renewSession } from "@/lib/api";

function formatCountdown(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h)}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.8, flexShrink: 0 }}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "spc-spin" : undefined}
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

/**
 * Shows time remaining until the platform JWT expires and auto-logs-out when it
 * hits zero. Mirrors the tenant-side SessionCountdown.
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
        clearSession();
        router.replace("/login");
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
      const ok = await renewSession();
      if (!ok) return;
      const exp = getTokenExpiresAt();
      setRemainingMs(exp ? Math.max(0, exp - Date.now()) : null);
      setTickKey((k) => k + 1);
    } finally {
      setRenewing(false);
    }
  };

  if (remainingMs == null) return null;

  const urgent = remainingMs <= 60_000;
  const warn = remainingMs <= 5 * 60_000;
  const color = urgent ? "var(--danger)" : warn ? "var(--warn)" : "var(--muted)";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        marginBottom: "0.75rem",
      }}
    >
      <style>{`@keyframes spc-spin{to{transform:rotate(360deg)}}.spc-spin{animation:spc-spin 0.8s linear infinite}`}</style>
      <div
        title="Автоматаар гарах хүртэл үлдсэн хугацаа"
        aria-live="polite"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.25rem 0.6rem",
          borderRadius: "999px",
          border: `1px solid ${color}`,
          color,
          fontSize: "0.75rem",
          fontVariantNumeric: "tabular-nums",
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
          background: "var(--accent-soft)",
        }}
      >
        <ClockIcon />
        <span>{formatCountdown(remainingMs)}</span>
      </div>
      <button
        type="button"
        onClick={handleRenew}
        disabled={renewing}
        title="Сессийг сунгах"
        className="btn secondary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: "0.25rem 0.55rem",
          fontSize: "0.72rem",
        }}
      >
        <RefreshIcon spinning={renewing} />
        Сунгах
      </button>
    </div>
  );
}
