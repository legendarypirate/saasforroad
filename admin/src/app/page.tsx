"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isLoggedIn() ? "/tenants" : "/login");
  }, [router]);

  return (
    <main className="main" style={{ display: "grid", placeItems: "center" }}>
      <p className="muted">Loading…</p>
    </main>
  );
}
