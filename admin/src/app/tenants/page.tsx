"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api, Tenant } from "@/lib/api";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listTenants()
      .then((res) => setTenants(res.tenants))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "end", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.7rem" }}>Tenants</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            Each tenant runs zam on its own domain (tenant1.mn, …) as a single-tenant ERP.
          </p>
        </div>
        <Link href="/tenants/new" className="btn">
          Register tenant
        </Link>
      </div>

      <div className="panel">
        {loading ? <p className="muted">Loading…</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Users</th>
                <th>Superadmin</th>
                <th>Modules</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.name}</strong>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {t.slug}
                    </div>
                  </td>
                  <td>{t.domain}</td>
                  <td>
                    <span className={`badge ${t.is_active ? "on" : "off"}`}>
                      {t.is_active ? "Active" : "Off"}
                    </span>
                  </td>
                  <td>{t.user_count ?? 0}</td>
                  <td>{t.superadmin?.username || "—"}</td>
                  <td>{(t.modules || []).length}</td>
                  <td>
                    <Link href={`/tenants/${t.id}`} className="btn secondary">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No tenants yet. Register the first one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        ) : null}
      </div>
    </Shell>
  );
}
