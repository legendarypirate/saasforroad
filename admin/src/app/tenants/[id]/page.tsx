"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Shell";
import ModuleCategoryGrid from "@/components/ModuleCategoryGrid";
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

  function setManyModules(ids: string[], checked: boolean) {
    setSelectedModules((prev) => {
      const set = new Set(prev);
      ids.forEach((mid) => (checked ? set.add(mid) : set.delete(mid)));
      return Array.from(set);
    });
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
        <Link href="/tenants" className="link-accent">
          ← Back to tenants
        </Link>
      </Shell>
    );
  }

  const saasUrl = tenant.saas_url || `https://${tenant.slug}.rcos.mn`;
  const saasDomain = tenant.saas_domain || `${tenant.slug}.rcos.mn`;

  return (
    <Shell>
      <div className="page-header">
        <div>
          <Link href="/tenants" className="muted" style={{ fontSize: "0.88rem", fontWeight: 700 }}>
            ← Tenants
          </Link>
          <h1 className="page-title" style={{ marginTop: "0.45rem" }}>
            {tenant.name}
          </h1>
          <p className="page-desc">
            SaaS:{" "}
            <a className="link-accent" href={saasUrl} target="_blank" rel="noreferrer">
              {saasUrl}
            </a>
            {" · "}
            custom: <code>{tenant.domain}</code>
            {" · "}
            <span className={`badge ${tenant.is_active ? "on" : "off"}`}>
              {tenant.is_active ? "Active" : "Off"}
            </span>
          </p>
        </div>
      </div>

      {message ? <p className="flash-ok">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="stack">
        <form className="panel" onSubmit={saveTenantMeta}>
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Tenant details</h2>
              <p className="muted" style={{ margin: "0.35rem 0 0", maxWidth: "62ch", lineHeight: 1.5 }}>
                No VPS edit per tenant. <code>{saasDomain}</code> is covered by wildcard SSL. For a
                custom domain, point DNS (Cloudflare proxy recommended) at your VPS — saving keeps
                the <code>.rcos.mn</code> subdomain as an alias.
              </p>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Name</label>
              <input
                value={tenant.name}
                onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Custom / primary domain</label>
              <input
                value={tenant.domain}
                onChange={(e) => setTenant({ ...tenant, domain: e.target.value })}
                placeholder="teensclub.mn or leave as slug.rcos.mn"
              />
            </div>
            <div className="field">
              <label>SaaS URL (auto)</label>
              <input value={saasDomain} readOnly />
            </div>
            <div className="field">
              <label>Aliases</label>
              <input value={(tenant.domains || []).join(", ") || "—"} readOnly />
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
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Zam modules</h2>
              <p className="muted" style={{ margin: "0.3rem 0 0" }}>
                Disabled modules are hidden for this tenant and stripped from login permissions.
              </p>
            </div>
            <button className="btn" type="button" onClick={saveModules} disabled={saving}>
              Save modules
            </button>
          </div>
          <ModuleCategoryGrid
            modules={modules}
            selected={selectedModules}
            onToggle={toggleModule}
            onSetMany={setManyModules}
          />
        </section>

        <form className="panel" onSubmit={saveSuperadmin}>
          <h2 className="panel-title">Tenant superadmin (exactly one)</h2>
          <p className="muted" style={{ marginTop: "0.35rem" }}>
            Current: <strong>{tenant.superadmin?.username || "none"}</strong>
          </p>
          <div className="grid-2">
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
          <h2 className="panel-title">Role permissions</h2>
          <p className="muted" style={{ marginTop: "0.35rem" }}>
            Assign permissions for this tenant. The tenant superadmin can also manage roles from
            zam.
          </p>
          <div className="chip-row">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`btn chip ${activeRoleId === r.id ? "" : "secondary"}`}
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
