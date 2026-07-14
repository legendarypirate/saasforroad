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

  const activeCount = tenants.filter((t) => t.is_active).length;

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-desc">
            Each tenant runs zam on its own domain as a single-tenant ERP.
          </p>
        </div>
        <Link href="/tenants/new" className="btn">
          Register tenant
        </Link>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="label">Total</div>
          <div className="value">{loading ? "—" : tenants.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active</div>
          <div className="value">{loading ? "—" : activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Offline</div>
          <div className="value">{loading ? "—" : tenants.length - activeCount}</div>
        </div>
      </div>

      <div className="panel">
        {loading ? <p className="muted">Loading…</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error ? (
          <div className="table-wrap">
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
                      <div className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>
                        {t.slug}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: "0.82rem" }}>{t.domain}</code>
                    </td>
                    <td>
                      <span className={`badge ${t.is_active ? "on" : "off"}`}>
                        {t.is_active ? "Active" : "Off"}
                      </span>
                    </td>
                    <td>{t.user_count ?? 0}</td>
                    <td>{t.superadmin?.username || "—"}</td>
                    <td>{(t.modules || []).length}</td>
                    <td>
                      <Link href={`/tenants/${t.id}`} className="btn secondary chip">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        No tenants yet. Register the first one.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
