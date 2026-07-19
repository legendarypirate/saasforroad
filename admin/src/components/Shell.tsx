"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  clearSession,
  getStoredAdmin,
  isLoggedIn,
  PLATFORM_DATA_KINDS,
  PlatformAdmin,
} from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeProvider";
import SessionCountdown from "@/components/SessionCountdown";

function IconGrid({ className = "nav-ico" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconPlus({ className = "nav-ico" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconPage({ className = "nav-ico" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M14 4v6h6" />
    </svg>
  );
}

function IconData({ className = "nav-ico" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </svg>
  );
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`nav-chevron${open ? " open" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const dataActive = pathname.startsWith("/data");
  const [dataOpen, setDataOpen] = useState(dataActive);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setAdmin(getStoredAdmin());
  }, [router]);

  useEffect(() => {
    if (dataActive) setDataOpen(true);
  }, [dataActive]);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  const activeKind = useMemo(() => {
    const m = pathname.match(/^\/data\/([^/]+)/);
    return m?.[1] || "";
  }, [pathname]);

  if (!admin) {
    return (
      <main className="main">
        <p className="muted">Checking session…</p>
      </main>
    );
  }

  const tenantsActive =
    pathname.startsWith("/tenants") && pathname !== "/tenants/new";
  const newActive = pathname === "/tenants/new";
  const landingActive = pathname.startsWith("/landing");

  return (
    <div className="shell">
      <aside className="sidebar">
        <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
          <div className="brand-mark">R</div>
          <div>
            <h1>RCOS Platform</h1>
            <p className="brand-sub">admin.rcos.mn</p>
          </div>
        </div>

        <nav className="nav-stack">
          <Link href="/tenants" className={`nav-link${tenantsActive ? " active" : ""}`}>
            <IconGrid />
            Түрээслэгч
          </Link>
          <Link href="/tenants/new" className={`nav-link${newActive ? " active" : ""}`}>
            <IconPlus />
            Бүртгэх
          </Link>
          <Link href="/landing" className={`nav-link${landingActive ? " active" : ""}`}>
            <IconPage />
            Landing
          </Link>

          <div className="nav-group">
            <button
              type="button"
              className={`nav-link nav-group-toggle${dataActive ? " active" : ""}`}
              onClick={() => setDataOpen((v) => !v)}
              aria-expanded={dataOpen}
            >
              <IconData />
              <span style={{ flex: 1, textAlign: "left" }}>Дата</span>
              <IconChevron open={dataOpen} />
            </button>
            {dataOpen ? (
              <div className="nav-sub">
                {PLATFORM_DATA_KINDS.map((k) => (
                  <Link
                    key={k.id}
                    href={`/data/${k.id}`}
                    className={`nav-sublink${activeKind === k.id ? " active" : ""}`}
                  >
                    {k.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem", fontWeight: 700 }}>
            {admin.name || admin.username}
          </div>
          <SessionCountdown />
          <ThemeToggle />
          <button className="btn secondary" type="button" onClick={logout} style={{ width: "100%" }}>
            Гарах
          </button>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
