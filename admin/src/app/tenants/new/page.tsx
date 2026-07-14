"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
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

  const previewSlug =
    (form.slug.trim() ||
      form.name.trim().toLowerCase().replace(/\s+/g, "-") ||
      "slug")
      .replace(/[^a-z0-9-]/gi, "")
      .toLowerCase();

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
      <div className="page-header">
        <div>
          <Link href="/tenants" className="muted" style={{ fontSize: "0.88rem", fontWeight: 700 }}>
            ← Tenants
          </Link>
          <h1 className="page-title" style={{ marginTop: "0.45rem" }}>
            Register tenant
          </h1>
          <p className="page-desc">
            Empty domain → hosted at <code>{"{slug}.rcos.mn"}</code>. A custom domain can be
            primary; the SaaS subdomain stays as an alias.
          </p>
        </div>
      </div>

      <form className="panel stack" onSubmit={onSubmit} style={{ maxWidth: 880 }}>
        <h2 className="panel-title">Company</h2>
        <div className="grid-2">
          <div className="field">
            <label>Company / tenant name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Acme LLC"
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
              placeholder="tenant1.mn — leave empty for default"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
            />
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              Default: <code>{previewSlug}.rcos.mn</code>
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

        <h2 className="panel-title" style={{ marginTop: "0.5rem" }}>
          Enabled zam modules
        </h2>
        <div className="module-grid" style={{ marginBottom: "0.5rem" }}>
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

        <h2 className="panel-title" style={{ marginTop: "0.75rem" }}>
          Tenant superadmin (one)
        </h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: "0.85rem" }}>
          This user can manage every role &amp; permission inside their tenant on zam.
        </p>
        <div className="grid-2">
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

        <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create tenant"}
          </button>
          <Link href="/tenants" className="btn secondary">
            Cancel
          </Link>
        </div>
      </form>
    </Shell>
  );
}
