"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Shell from "@/components/Shell";
import { AdminCrudActions } from "@/components/admin/AdminCrudActions";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import {
  RBadge,
  RButton,
  RDrawer,
  RInput,
  RSelect,
  RTable,
  RTextarea,
} from "@/components/r";
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

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault();
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
      <AdminListToolbar
        title={kindMeta.label}
        description="Platform-owned catalog. Tenants can view and contact only — they cannot create or edit these records."
        onReload={load}
        onCreate={openCreate}
        createLabel="Нэмэх"
      />

      {error ? <p className="error mb-3">{error}</p> : null}
      {message ? <p className="flash-ok mb-3">{message}</p> : null}

      <RTable
        columns={[
          {
            key: "name",
            title: "Нэр",
            render: (row) => (
              <div>
                <div className="font-semibold">{row.name}</div>
                {row.description ? (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {row.description.slice(0, 80)}
                    {row.description.length > 80 ? "…" : ""}
                  </div>
                ) : null}
              </div>
            ),
          },
          {
            key: "contact",
            title: "Холбоо барих",
            render: (row) => row.contact_name || "—",
          },
          {
            key: "phone",
            title: "Утас",
            render: (row) => row.phone || "—",
          },
          {
            key: "email",
            title: "Имэйл",
            render: (row) => row.email || "—",
          },
          {
            key: "location",
            title: "Байршил",
            render: (row) =>
              [row.province, row.location].filter(Boolean).join(" · ") || "—",
          },
          {
            key: "status",
            title: "Төлөв",
            render: (row) => (
              <RBadge tone={row.is_active ? "success" : "neutral"} dot>
                {row.is_active ? "Visible" : "Hidden"}
              </RBadge>
            ),
          },
          {
            key: "actions",
            title: "",
            align: "right",
            render: (row) => (
              <AdminCrudActions
                onEdit={() => openEdit(row)}
                onDelete={() => onDelete(row)}
                deleteTitle={`“${row.name}” устгах уу?`}
              />
            ),
          },
        ]}
        data={entries}
        rowKey="id"
        loading={loading}
        empty={
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            Одоогоор бүртгэлгүй. Эхний {kindMeta.label} нэмнэ үү.
          </div>
        }
      />

      <RDrawer
        open={showForm}
        onClose={closeForm}
        title={editing ? "Засах" : "Шинэ бүртгэл"}
        description={kindMeta.label}
        destroyOnClose
        footer={
          <>
            <RButton variant="outline" onClick={closeForm} disabled={saving}>
              Болих
            </RButton>
            <RButton
              variant="primary"
              loading={saving}
              onClick={() => void onSubmit()}
            >
              Хадгалах
            </RButton>
          </>
        }
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <RInput
            label="Нэр"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <RInput
            label="Холбоо барих хүн"
            value={form.contact_name}
            onChange={(e) =>
              setForm({ ...form, contact_name: e.target.value })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <RInput
              label="Утас"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <RInput
              label="Имэйл"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <RInput
              label="Аймаг / хот"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
            <RInput
              label="Байршил"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <RTextarea
            label="Тайлбар"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <RSelect
            label="Төлөв"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v || "active" })}
            options={[
              { value: "active", label: "active" },
              { value: "inactive", label: "inactive" },
            ]}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
            />
            Visible to tenants
          </label>
        </form>
      </RDrawer>
    </Shell>
  );
}
