"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";

export default function DataIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/data/brigada");
  }, [router]);

  return (
    <Shell>
      <p className="muted">Redirecting…</p>
    </Shell>
  );
}
