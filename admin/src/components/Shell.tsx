"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clearSession, getStoredAdmin, isLoggedIn, PlatformAdmin } from "@/lib/api";

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

export default function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setAdmin(getStoredAdmin());
  }, [router]);

  function logout() {
    clearSession();
    router.replace("/login");
  }

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
            Tenants
          </Link>
          <Link href="/tenants/new" className={`nav-link${newActive ? " active" : ""}`}>
            <IconPlus />
            Register tenant
          </Link>
          <Link href="/landing" className={`nav-link${landingActive ? " active" : ""}`}>
            <IconPage />
            Landing
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem", fontWeight: 700 }}>
            {admin.name || admin.username}
          </div>
          <button className="btn secondary" type="button" onClick={logout} style={{ width: "100%" }}>
            Log out
          </button>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
