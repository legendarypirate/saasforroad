"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTenantDomain, isPlatformHost } from "@/lib/tenant";

export default function TenantNotFoundPage() {
  const router = useRouter();
  const domain =
    typeof window !== "undefined" ? getTenantDomain() : "this domain";

  useEffect(() => {
    if (isPlatformHost()) {
      router.replace("/");
      return;
    }
    document.title = "Tenant not found | RCOS";
  }, [router]);

  if (typeof window !== "undefined" && isPlatformHost()) {
    return null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background:
          "radial-gradient(900px 500px at 10% -10%, rgba(61, 214, 165, 0.12) 0%, transparent 55%), #0b1014",
        color: "#e8eef4",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background:
            "linear-gradient(165deg, rgba(30, 42, 54, 0.95), rgba(15, 22, 30, 0.98))",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          borderRadius: 16,
          padding: "2rem 1.75rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#8b9aab",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          RCOS SaaS
        </p>
        <h1
          style={{
            margin: "0.75rem 0 0.5rem",
            fontSize: "1.6rem",
            fontWeight: 800,
          }}
        >
          Company not found
        </h1>
        <p style={{ margin: 0, color: "#8b9aab", lineHeight: 1.55 }}>
          <strong style={{ color: "#e8eef4" }}>{domain}</strong> is not
          registered as a tenant. Ask the platform admin to create this company
          at{" "}
          <a href="https://admin.rcos.mn" style={{ color: "#3dd6a5" }}>
            admin.rcos.mn
          </a>
          .
        </p>
        <p
          style={{ margin: "1.25rem 0 0", fontSize: "0.9rem", color: "#8b9aab" }}
        >
          Тухайн домэйн дээр бүртгэлтэй компани олдсонгүй.
        </p>
        <p style={{ margin: "1.5rem 0 0" }}>
          <a
            href="https://rcos.mn"
            style={{ color: "#3dd6a5", fontWeight: 700 }}
          >
            ← rcos.mn платформ
          </a>
        </p>
      </div>
    </main>
  );
}
