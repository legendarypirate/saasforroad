"use client";

import { useEffect } from "react";
import { getTenantDomain } from "@/lib/tenant";

export default function TenantNotFoundPage() {
  const domain =
    typeof window !== "undefined" ? getTenantDomain() : "this domain";

  useEffect(() => {
    document.title = "Tenant not found | RCOS";
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background:
          "radial-gradient(900px 500px at 10% -10%, #c8e8dc 0%, transparent 55%), #f3f7f5",
        color: "#0f1c18",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "#fff",
          border: "1px solid #d5e0db",
          borderRadius: 16,
          padding: "2rem 1.75rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#5c6f68",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          RCOS SaaS
        </p>
        <h1 style={{ margin: "0.75rem 0 0.5rem", fontSize: "1.6rem" }}>
          Company not found
        </h1>
        <p style={{ margin: 0, color: "#5c6f68", lineHeight: 1.55 }}>
          <strong style={{ color: "#0f1c18" }}>{domain}</strong> is not
          registered as a tenant. Ask the platform admin to create this company
          at{" "}
          <a href="https://admin.rcos.mn" style={{ color: "#0d7a5f" }}>
            admin.rcos.mn
          </a>
          .
        </p>
        <p style={{ margin: "1.25rem 0 0", fontSize: "0.9rem", color: "#5c6f68" }}>
          Тухайн домэйн дээр бүртгэлтэй компани олдсонгүй.
        </p>
      </div>
    </main>
  );
}
