"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Shell";
import {
  api,
  ModuleInfo,
  Permission,
  Tenant,
  TenantRole,
} from "@/lib/api";

export default function TenantDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
  const [roleKeys, setRoleKeys] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [adminForm, setAdminForm] = useState({
    username: "",
    password: "",
    email: "",
    name: "",
    phone: "",
  });

  const load = useCallback(async () => {
    if (!id) return;
    setError("");
    const [t, mods, rolesRes, perms] = await Promise.all([
      api.getTenant(id),
      api.listModules(),
      api.listRoles(id),
      api.listPermissions(),
    ]);
    setTenant(t.tenant);
    setModules(mods.modules);
    setSelectedModules(t.tenant.modules || mods.allIds);
    setRoles(rolesRes.roles);
    setPermissions(perms.permissions);
    if (t.tenant.superadmin) {
      setAdminForm((prev) => ({
        ...prev,
        username: t.tenant.superadmin?.username || "",
        email: t.tenant.superadmin?.email || "",
        name: t.tenant.superadmin?.name || "",
        phone: t.tenant.superadmin?.phone || "",
      }));
    }
    if (rolesRes.roles[0]) {
      setActiveRoleId(rolesRes.roles[0].id);
      setRoleKeys(rolesRes.roles[0].permission_keys || []);
    }
  }, [id]);

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load")
    );
  }, [load]);

  const activeRole = useMemo(
    () => roles.find((r) => r.id === activeRoleId) || null,
    [roles, activeRoleId]
  );

  function toggleModule(moduleId: string) {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((x) => x !== moduleId)
        : [...prev, moduleId]
    );
  }

  async function saveModules() {
    setSaving(true);
    setMessage("");
    try {
      const res = await api.updateModules(id, selectedModules);
      setTenant(res.tenant);
      setMessage("Modules updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveTenantMeta(e: FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await api.updateTenant(id, {
        name: tenant.name,
        domain: tenant.domain,
        is_active: tenant.is_active,
        company_name: tenant.company_name,
        contact_email: tenant.contact_email,
        contact_phone: tenant.contact_phone,
        notes: tenant.notes,
      });
      setTenant(res.tenant);
      setMessage("Tenant saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveSuperadmin(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api.setSuperadmin(id, {
        username: adminForm.username.trim(),
        password: adminForm.password,
        email: adminForm.email.trim() || undefined,
        name: adminForm.name.trim() || undefined,
        phone: adminForm.phone.trim() || undefined,
      });
      setAdminForm((prev) => ({ ...prev, password: "" }));
      await load();
      setMessage("Superadmin set (single admin for this tenant)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveRolePermissions() {
    if (!activeRoleId) return;
    setSaving(true);
    setMessage("");
    try {
      await api.updateRolePermissions(id, activeRoleId, roleKeys);
      await load();
      setMessage("Role permissions updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (!tenant && !error) {
    return (
      <Shell>
        <p className="muted">Loading tenant…</p>
      </Shell>
    );
  }

  if (!tenant) {
    return (
      <Shell>
        <p className="error">{error}</p>
        <Link href="/tenants">Back</Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/tenants" className="muted">
          ← Tenants
        </Link>
        <h1 style={{ margin: "0.4rem 0 0.2rem" }}>{tenant.name}</h1>
        <p className="muted" style={{ margin: 0 }}>
          zam · {tenant.domain} · slug {tenant.slug}
        </p>
      </div>

      {message ? (
        <p style={{ color: "var(--accent)", fontWeight: 600 }}>{message}</p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}

      <div style={{ display: "grid", gap: "1rem" }}>
        <form className="panel" onSubmit={saveTenantMeta}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Tenant details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1rem" }}>
            <div className="field">
              <label>Name</label>
              <input
                value={tenant.name}
                onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Domain</label>
              <input
                value={tenant.domain}
                onChange={(e) => setTenant({ ...tenant, domain: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Company</label>
              <input
                value={tenant.company_name || ""}
                onChange={(e) =>
                  setTenant({ ...tenant, company_name: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Status</label>
              <select
                value={tenant.is_active ? "1" : "0"}
                onChange={(e) =>
                  setTenant({ ...tenant, is_active: e.target.value === "1" })
                }
              >
                <option value="1">Active</option>
                <option value="0">Disabled</option>
              </select>
            </div>
          </div>
          <button className="btn" type="submit" disabled={saving}>
            Save details
          </button>
        </form>

        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Zam modules</h2>
              <p className="muted" style={{ margin: "0.3rem 0 0" }}>
                Disabled modules are hidden for this tenant and stripped from login permissions.
              </p>
            </div>
            <button className="btn" type="button" onClick={saveModules} disabled={saving}>
              Save modules
            </button>
          </div>
          <div className="module-grid" style={{ marginTop: "1rem" }}>
            {modules.map((m) => (
              <label key={m.id} className="module-item">
                <input
                  type="checkbox"
                  checked={selectedModules.includes(m.id)}
                  onChange={() => toggleModule(m.id)}
                />
                <span>
                  <strong style={{ display: "block" }}>{m.label}</strong>
                  <span className="muted" style={{ fontSize: "0.75rem" }}>
                    {m.id}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <form className="panel" onSubmit={saveSuperadmin}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Tenant superadmin (exactly one)
          </h2>
          <p className="muted">
            Current: <strong>{tenant.superadmin?.username || "none"}</strong>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1rem" }}>
            <div className="field">
              <label>Username</label>
              <input
                required
                value={adminForm.username}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, username: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>New password</label>
              <input
                type="password"
                required
                value={adminForm.password}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, password: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Name</label>
              <input
                value={adminForm.name}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, name: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                value={adminForm.email}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, email: e.target.value })
                }
              />
            </div>
          </div>
          <button className="btn" type="submit" disabled={saving}>
            Create / replace superadmin
          </button>
        </form>

        <section className="panel">
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Role permissions (tenant-scoped)
          </h2>
          <p className="muted">
            Platform admin can assign any permission inside this tenant. Tenant
            superadmin can also manage roles from zam.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`btn ${activeRoleId === r.id ? "" : "secondary"}`}
                onClick={() => {
                  setActiveRoleId(r.id);
                  setRoleKeys(r.permission_keys || []);
                }}
              >
                {r.name}
              </button>
            ))}
          </div>

          {activeRole ? (
            <>
              <div className="module-grid">
                {permissions.map((p) => (
                  <label key={p.id} className="module-item">
                    <input
                      type="checkbox"
                      checked={roleKeys.includes(p.key)}
                      onChange={() =>
                        setRoleKeys((prev) =>
                          prev.includes(p.key)
                            ? prev.filter((k) => k !== p.key)
                            : [...prev, p.key]
                        )
                      }
                    />
                    <span style={{ fontSize: "0.85rem" }}>
                      <strong>{p.key}</strong>
                    </span>
                  </label>
                ))}
              </div>
              <button
                className="btn"
                type="button"
                style={{ marginTop: "1rem" }}
                onClick={saveRolePermissions}
                disabled={saving}
              >
                Save permissions for {activeRole.name}
              </button>
            </>
          ) : (
            <p className="muted">No roles yet</p>
          )}
        </section>
      </div>
    </Shell>
  );
}
