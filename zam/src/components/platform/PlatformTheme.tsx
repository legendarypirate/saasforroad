"use client";

import { useEffect, useState } from "react";

const KEY = "rcos-platform-theme";

export type PlatformTheme = "dark" | "light";

function readTheme(): PlatformTheme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

export function usePlatformTheme() {
  const [theme, setThemeState] = useState<PlatformTheme>("dark");

  useEffect(() => {
    const t = readTheme();
    setThemeState(t);
    document.documentElement.dataset.plTheme = t;
  }, []);

  function setTheme(mode: PlatformTheme) {
    setThemeState(mode);
    window.localStorage.setItem(KEY, mode);
    document.documentElement.dataset.plTheme = mode;
  }

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return { theme, setTheme, toggle };
}

export function PlatformThemeToggle({
  theme,
  onToggle,
}: {
  theme: PlatformTheme;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="pl-theme-btn"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

/** Icons for data modules — by id with sensible fallbacks. */
export function DataItemIcon({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    className: "pl-data-ico",
  } as const;

  switch (id) {
    case "data-factory":
      return (
        <svg {...common}>
          <path d="M3 21h18" strokeLinecap="round" />
          <path d="M5 21V10l4 2V8l4 2V5l6 3v13" strokeLinejoin="round" />
          <path d="M9 21v-4h4v4" />
        </svg>
      );
    case "data-technique":
      return (
        <svg {...common}>
          <circle cx="7" cy="17" r="2.5" />
          <circle cx="17" cy="17" r="2.5" />
          <path d="M4.5 17H2l2-7h9l1.5 4H19" strokeLinejoin="round" />
          <path d="M9.5 10l1-4h3" strokeLinecap="round" />
        </svg>
      );
    case "data-brigade":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3.5 19c.5-3 2.8-5 5.5-5s5 2 5.5 5" strokeLinecap="round" />
          <path d="M14 19c.3-2 1.6-3.5 3.5-3.5 1.4 0 2.6.8 3.2 2" strokeLinecap="round" />
        </svg>
      );
    case "data-laboratory":
      return (
        <svg {...common}>
          <path d="M9 3h6" strokeLinecap="round" />
          <path d="M10 3v6.2L5.5 18a2.4 2.4 0 0 0 2.1 3.5h9a2.4 2.4 0 0 0 2.1-3.5L14 9.2V3" strokeLinejoin="round" />
          <path d="M8.2 14h7.6" strokeLinecap="round" />
        </svg>
      );
    case "data-job-seeker":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c1-3.5 3.6-5.5 7-5.5s6 2 7 5.5" strokeLinecap="round" />
          <path d="M16.5 6.5l2 1 1.2-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "data-student":
      return (
        <svg {...common}>
          <path d="M3 10l9-5 9 5-9 5-9-5z" strokeLinejoin="round" />
          <path d="M7 12.2V17c0 .8 2.2 2.4 5 2.4s5-1.6 5-2.4v-4.8" strokeLinecap="round" />
          <path d="M21 10v5" strokeLinecap="round" />
        </svg>
      );
    case "data-road-sign":
      return (
        <svg {...common}>
          <path d="M12 3v18" strokeLinecap="round" />
          <path d="M6 4h10.5l2.5 3-2.5 3H6z" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <ellipse cx="12" cy="6" rx="7" ry="2.5" />
          <path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
          <path d="M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" />
          <path d="M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" />
        </svg>
      );
  }
}
