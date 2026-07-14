"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { api, ModuleInfo } from "@/lib/api";

export default function NewTenantPage() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    domain: "",
    company_name: "",
    contact_email: "",
    contact_phone: "",
    notes: "",
    admin_username: "",
    admin_password: "",
    admin_email: "",
    admin_name: "",
  });

  useEffect(() => {
    api.listModules().then((res) => {
      setModules(res.modules);
      setSelected(res.allIds);
    });
  }, []);

  function toggleModule(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const slug =
        form.slug.trim() ||
        form.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        slug,
        // Empty → API defaults to {slug}.rcos.mn
        domain: form.domain.trim().toLowerCase() || undefined,
        company_name: form.company_name.trim() || form.name.trim(),
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        notes: form.notes.trim() || null,
        modules: selected,
      };
      if (form.admin_username && form.admin_password) {
        body.superadmin = {
          username: form.admin_username.trim(),
          password: form.admin_password,
          email: form.admin_email.trim() || null,
          name: form.admin_name.trim() || null,
        };
      }
      const res = await api.createTenant(body);
      router.push(`/tenants/${res.tenant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <h1 style={{ marginTop: 0 }}>Register tenant</h1>
      <p className="muted">
        Creates a single-tenant workspace. If you leave domain empty, zam is hosted at{" "}
        <strong>{"{slug}.rcos.mn"}</strong> (e.g. tenant1 → tenant1.rcos.mn). Optional custom
        domain (tenant1.mn) can be set as primary; the .rcos.mn subdomain stays as an alias.
      </p>

      <form className="panel" onSubmit={onSubmit} style={{ maxWidth: 860 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1rem" }}>
          <div className="field">
            <label>Company / tenant name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Slug</label>
            <input
              placeholder="tenant1"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Custom domain (optional)</label>
            <input
              placeholder="tenant1.mn — leave empty for tenant1.rcos.mn"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
            />
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              Default:{" "}
              {(form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-") || "slug")
                .replace(/[^a-z0-9-]/gi, "")
                .toLowerCase()}
              .rcos.mn
            </span>
          </div>
          <div className="field">
            <label>Company name</label>
            <input
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Contact email</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Contact phone</label>
            <input
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            />
          </div>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <h3 style={{ marginBottom: "0.5rem" }}>Enabled zam modules</h3>
        <div className="module-grid" style={{ marginBottom: "1.25rem" }}>
          {modules.map((m) => (
            <label key={m.id} className="module-item">
              <input
                type="checkbox"
                checked={selected.includes(m.id)}
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

        <h3 style={{ marginBottom: "0.5rem" }}>Tenant superadmin (one)</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          This user can manage every role &amp; permission inside their tenant on zam.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 1rem" }}>
          <div className="field">
            <label>Username</label>
            <input
              value={form.admin_username}
              onChange={(e) => setForm({ ...form, admin_username: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={form.admin_password}
              onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Display name</label>
            <input
              value={form.admin_name}
              onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.admin_email}
              onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
            />
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create tenant"}
        </button>
      </form>
    </Shell>
  );
}
