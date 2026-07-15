"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Shell from "@/components/Shell";
import {
  api,
  PLATFORM_DATA_KINDS,
  PlatformDataEntry,
} from "@/lib/api";

type FormState = {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  province: string;
  location: string;
  description: string;
  status: string;
  is_active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  contact_name: "",
  phone: "",
  email: "",
  province: "",
  location: "",
  description: "",
  status: "active",
  is_active: true,
});

function entryToForm(e: PlatformDataEntry): FormState {
  return {
    name: e.name || "",
    contact_name: e.contact_name || "",
    phone: e.phone || "",
    email: e.email || "",
    province: e.province || "",
    location: e.location || "",
    description: e.description || "",
    status: e.status || "active",
    is_active: e.is_active !== false,
  };
}

export default function PlatformDataKindPage() {
  const params = useParams();
  const kind = String(params.kind || "");
  const kindMeta = useMemo(
    () => PLATFORM_DATA_KINDS.find((k) => k.id === kind),
    [kind]
  );

  const [entries, setEntries] = useState<PlatformDataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<PlatformDataEntry | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!kindMeta) return;
    setLoading(true);
    setError("");
    api
      .listData(kind)
      .then((res) => setEntries(res.entries))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    setCreating(false);
    setEditing(null);
    setForm(emptyForm());
    setMessage("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  if (!kindMeta) {
    return (
      <Shell>
        <p className="error">Unknown data kind.</p>
      </Shell>
    );
  }

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setForm(emptyForm());
    setMessage("");
  }

  function openEdit(row: PlatformDataEntry) {
    setCreating(false);
    setEditing(row);
    setForm(entryToForm(row));
    setMessage("");
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(emptyForm());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const body = {
        kind,
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        province: form.province.trim() || null,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
        status: form.status,
        is_active: form.is_active,
      };
      if (editing) {
        await api.updateData(editing.id, body);
        setMessage("Updated");
      } else {
        await api.createData(body);
        setMessage("Created");
      }
      closeForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: PlatformDataEntry) {
    if (!confirm(`Delete “${row.name}”?`)) return;
    setError("");
    try {
      await api.deleteData(row.id);
      setMessage("Deleted");
      if (editing?.id === row.id) closeForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const showForm = creating || !!editing;

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">{kindMeta.label}</h1>
          <p className="page-desc">
            Platform-owned catalog. Tenants can view and contact only — they cannot
            create or edit these records.
          </p>
        </div>
        <button type="button" className="btn" onClick={openCreate}>
          Add entry
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="flash-ok">{message}</p> : null}

      {showForm ? (
        <div className="panel" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>
            {editing ? "Edit entry" : "New entry"}
          </h2>
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Name *
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              Contact name
              <input
                value={form.contact_name}
                onChange={(e) =>
                  setForm({ ...form, contact_name: e.target.value })
                }
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Province / city
              <input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              />
            </label>
            <label>
              Location
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
            <label className="full">
              Description
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              Visible to tenants
            </label>
            <div className="full" style={{ display: "flex", gap: "0.65rem" }}>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="panel">
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                      {row.description ? (
                        <div
                          className="muted"
                          style={{ fontSize: "0.8rem", marginTop: 2 }}
                        >
                          {row.description.slice(0, 80)}
                          {row.description.length > 80 ? "…" : ""}
                        </div>
                      ) : null}
                    </td>
                    <td>{row.contact_name || "—"}</td>
                    <td>{row.phone || "—"}</td>
                    <td>{row.email || "—"}</td>
                    <td>
                      {[row.province, row.location].filter(Boolean).join(" · ") ||
                        "—"}
                    </td>
                    <td>
                      <span
                        className={`badge ${row.is_active ? "on" : "off"}`}
                      >
                        {row.is_active ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        className="btn secondary chip"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        className="btn secondary chip"
                        onClick={() => onDelete(row)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        No entries yet. Add the first {kindMeta.label} record.
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
