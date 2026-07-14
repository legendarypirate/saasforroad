"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clearSession, getStoredAdmin, isLoggedIn, PlatformAdmin } from "@/lib/api";

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

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>RCOS Platform</h1>
        <p>admin.rcos.mn</p>
        <nav>
          <Link
            href="/tenants"
            className={`nav-link${pathname.startsWith("/tenants") ? " active" : ""}`}
          >
            Tenants
          </Link>
          <Link
            href="/tenants/new"
            className={`nav-link${pathname === "/tenants/new" ? " active" : ""}`}
          >
            Register tenant
          </Link>
        </nav>
        <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
          <div style={{ fontSize: "0.85rem", color: "#9bb5ab", marginBottom: "0.75rem" }}>
            {admin.name || admin.username}
          </div>
          <button className="btn secondary" type="button" onClick={logout} style={{ width: "100%", color: "#e8f2ee", borderColor: "rgba(255,255,255,0.2)" }}>
            Log out
          </button>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
