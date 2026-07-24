"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Ban, Eye } from "lucide-react";
import Shell from "@/components/Shell";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import {
  RActionButton,
  RBadge,
  RButton,
  RDrawer,
  RSelect,
  RTable,
  RTableActions,
  RTextarea,
} from "@/components/r";
import { api, PlatformFactory } from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  rejected: "Rejected",
  inactive: "Inactive",
};

const TYPE_LABEL: Record<string, string> = {
  asphalt: "Asphalt",
  cement: "Cement",
  crushing: "Crushing",
  emulsion: "Emulsion",
  ctb: "CTB",
  other: "Other",
};

function statusTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "pending") return "warning" as const;
  if (status === "rejected") return "danger" as const;
  return "neutral" as const;
}

export default function PlatformFactoriesPage() {
  const [rows, setRows] = useState<PlatformFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "active" | "rejected" | "inactive"
  >("pending");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PlatformFactory | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .listFactories({
        q: q.trim() || undefined,
        status: filter === "all" ? undefined : filter,
      })
      .then((res) => setRows(res.factories))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const counts = useMemo(() => {
    const all = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const active = rows.filter((r) => r.status === "active").length;
    return { all, pending, active };
  }, [rows]);

  async function setStatus(
    row: PlatformFactory,
    status: "active" | "rejected" | "inactive",
    note?: string
  ) {
    setBusyId(row.id);
    setError("");
    setMessage("");
    try {
      await api.setFactoryStatus(row.id, { status, note });
      setMessage(
        status === "active"
          ? `Approved “${row.name}”`
          : status === "rejected"
            ? `Rejected “${row.name}”`
            : `Deactivated “${row.name}”`
      );
      setDetail(null);
      setRejectNote("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Shell>
      <AdminListToolbar
        title="Үйлдвэр"
        description="Үйлдвэр аппаас нэмсэн ургамлууд — баталгаажуулбал tenant газрын зурагт гарна."
        searchValue={q}
        onSearchChange={setQ}
        onSearch={() => load()}
        onReload={load}
        filters={
          <RSelect
            value={filter}
            onChange={(v) => setFilter((v as typeof filter) || "all")}
            options={[
              { value: "all", label: "All statuses" },
              { value: "pending", label: "Pending" },
              { value: "active", label: "Active" },
              { value: "rejected", label: "Rejected" },
              { value: "inactive", label: "Inactive" },
            ]}
            className="w-44"
          />
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Нийт", value: loading ? "—" : counts.all },
          { label: "Хүлээгдэж буй", value: loading ? "—" : counts.pending },
          { label: "Идэвхтэй", value: loading ? "—" : counts.active },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-0.5 text-xl font-extrabold tabular-nums">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="error mb-3">{error}</p> : null}
      {message ? <p className="flash-ok mb-3">{message}</p> : null}

      <RTable
        columns={[
          {
            key: "name",
            title: "Plant",
            render: (row) => (
              <div>
                <button
                  type="button"
                  className="font-semibold text-[var(--ok)] hover:underline"
                  onClick={() => {
                    setDetail(row);
                    setRejectNote(row.rejection_note || "");
                  }}
                >
                  {row.name}
                </button>
                {row.description ? (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {row.description.slice(0, 72)}
                    {row.description.length > 72 ? "…" : ""}
                  </div>
                ) : null}
              </div>
            ),
          },
          {
            key: "company",
            title: "Company",
            render: (row) => (
              <div>
                <div>{row.company_name || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {row.company_username
                    ? `@${row.company_username}`
                    : row.owner_name || ""}
                </div>
              </div>
            ),
          },
          {
            key: "type",
            title: "Type",
            render: (row) =>
              TYPE_LABEL[row.plant_type || ""] || row.plant_type || "—",
          },
          {
            key: "contact",
            title: "Contact",
            render: (row) => (
              <div>
                <div>{row.phone || row.company_phone || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {[row.province, row.location].filter(Boolean).join(" · ")}
                </div>
              </div>
            ),
          },
          {
            key: "coords",
            title: "Coords",
            render: (row) =>
              row.latitude != null && row.longitude != null
                ? `${Number(row.latitude).toFixed(4)}, ${Number(row.longitude).toFixed(4)}`
                : "—",
          },
          {
            key: "status",
            title: "Status",
            render: (row) => (
              <RBadge tone={statusTone(row.status)} dot>
                {STATUS_LABEL[row.status] || row.status}
              </RBadge>
            ),
          },
          {
            key: "actions",
            title: "",
            align: "right",
            render: (row) => (
              <RTableActions>
                <RActionButton
                  icon={<Eye strokeWidth={2} />}
                  label="Харах"
                  onClick={() => {
                    setDetail(row);
                    setRejectNote(row.rejection_note || "");
                  }}
                />
                {row.status === "pending" ||
                row.status === "rejected" ||
                row.status === "inactive" ? (
                  <RActionButton
                    icon={<Check strokeWidth={2} />}
                    label="Approve"
                    tone="success"
                    disabled={busyId === row.id}
                    onClick={() => setStatus(row, "active")}
                  />
                ) : null}
                {row.status === "active" ? (
                  <RActionButton
                    icon={<Ban strokeWidth={2} />}
                    label="Deactivate"
                    tone="danger"
                    disabled={busyId === row.id}
                    onClick={() => setStatus(row, "inactive")}
                  />
                ) : null}
              </RTableActions>
            ),
          },
        ]}
        data={rows}
        rowKey="id"
        loading={loading}
        empty={
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No plants yet. Companies register in the plant app, then add plants
            one by one for approval.
          </div>
        }
      />

      <RDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name || "Дэлгэрэнгүй"}
        description={
          detail
            ? `${detail.company_name ? `${detail.company_name} · ` : ""}${
                TYPE_LABEL[detail.plant_type || ""] || detail.plant_type
              } · ${STATUS_LABEL[detail.status] || detail.status}`
            : undefined
        }
        destroyOnClose
        footer={
          detail?.status === "pending" ? (
            <>
              <RButton
                variant="outline"
                disabled={busyId === detail.id}
                onClick={() => setStatus(detail, "rejected", rejectNote)}
              >
                Reject
              </RButton>
              <RButton
                variant="primary"
                loading={busyId === detail.id}
                onClick={() => setStatus(detail, "active")}
              >
                Approve
              </RButton>
            </>
          ) : (
            <RButton variant="outline" onClick={() => setDetail(null)}>
              Хаах
            </RButton>
          )
        }
      >
        {detail ? (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-sm">
              {detail.description || "No description"}
            </p>
            <p className="text-sm text-muted-foreground">
              {detail.latitude}, {detail.longitude}
              {detail.phone ? ` · ${detail.phone}` : ""}
              {detail.email ? ` · ${detail.email}` : ""}
            </p>
            {detail.status === "pending" ? (
              <RTextarea
                label="Rejection note"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={2}
              />
            ) : null}
          </div>
        ) : null}
      </RDrawer>
    </Shell>
  );
}
