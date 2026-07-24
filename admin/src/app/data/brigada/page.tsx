"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Ban } from "lucide-react";
import Shell from "@/components/Shell";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import {
  RActionButton,
  RBadge,
  RSelect,
  RTable,
  RTableActions,
} from "@/components/r";
import { api, PlatformBrigade } from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
  suspended: "Түдгэлзүүлсэн",
};

export default function PlatformBrigadesPage() {
  const [rows, setRows] = useState<PlatformBrigade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "suspended">(
    "all"
  );
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .listBrigades({
        q: q.trim() || undefined,
        status: filter === "all" ? undefined : filter,
      })
      .then((res) => setRows(res.brigades))
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
    const active = rows.filter((r) => r.status === "active").length;
    return { all, active, off: all - active };
  }, [rows]);

  async function setStatus(row: PlatformBrigade, status: "active" | "inactive") {
    setBusyId(row.id);
    setError("");
    setMessage("");
    try {
      await api.setBrigadeStatus(row.id, { status });
      setMessage(
        status === "active"
          ? `Activated “${row.name}”`
          : `Deactivated “${row.name}”`
      );
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
        title="Бригад"
        description="Бригад аппаас бүртгэгдсэн. Идэвхжүүлснээр компаниуд хөлслөнө."
        searchValue={q}
        onSearchChange={setQ}
        onSearch={() => load()}
        onReload={load}
        filters={
          <RSelect
            value={filter}
            onChange={(v) => setFilter((v as typeof filter) || "all")}
            options={[
              { value: "all", label: "Бүх төлөв" },
              { value: "active", label: "Идэвхтэй" },
              { value: "inactive", label: "Идэвхгүй" },
              { value: "suspended", label: "Түдгэлзүүлсэн" },
            ]}
            className="w-44"
          />
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Нийт", value: loading ? "—" : counts.all },
          { label: "Идэвхтэй", value: loading ? "—" : counts.active },
          { label: "Идэвхгүй", value: loading ? "—" : counts.off },
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
            title: "Нэр",
            render: (row) => (
              <div>
                <div className="font-semibold">{row.name}</div>
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
            key: "leader",
            title: "Удирдагч",
            render: (row) => (
              <div>
                <div>{row.leader_name || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {row.username ? `@${row.username}` : "нэвтрэх нэргүй"}
                </div>
              </div>
            ),
          },
          {
            key: "contact",
            title: "Холбоо",
            render: (row) => (
              <div>
                <div>{row.phone || row.contact_phone || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {row.contact_email || ""}
                </div>
              </div>
            ),
          },
          {
            key: "location",
            title: "Байршил",
            render: (row) =>
              [row.province, row.location].filter(Boolean).join(" · ") || "—",
          },
          {
            key: "rating",
            title: "Үнэлгээ",
            render: (row) => (
              <div>
                {(row.average_rating ?? 0).toFixed(1)}
                <div className="text-[11px] text-muted-foreground">
                  нэр {(row.reputation_score ?? 0).toFixed(0)}
                </div>
              </div>
            ),
          },
          {
            key: "status",
            title: "Төлөв",
            render: (row) => {
              const on = row.status === "active" && row.is_active;
              return (
                <RBadge tone={on ? "success" : "neutral"} dot>
                  {STATUS_LABEL[row.status] || row.status}
                </RBadge>
              );
            },
          },
          {
            key: "actions",
            title: "",
            align: "right",
            render: (row) => {
              const on = row.status === "active" && row.is_active;
              return (
                <RTableActions>
                  {on ? (
                    <RActionButton
                      icon={<Ban strokeWidth={2} />}
                      label="Идэвхгүй болгох"
                      tone="danger"
                      disabled={busyId === row.id}
                      onClick={() => setStatus(row, "inactive")}
                    />
                  ) : (
                    <RActionButton
                      icon={<Check strokeWidth={2} />}
                      label="Идэвхжүүлэх"
                      tone="success"
                      disabled={busyId === row.id}
                      onClick={() => setStatus(row, "active")}
                    />
                  )}
                </RTableActions>
              );
            },
          },
        ]}
        data={rows}
        rowKey="id"
        loading={loading}
        empty={
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            Бригад байхгүй. Бригад апп-д бүртгэгдсэний дараа энд гарна.
          </div>
        }
      />
    </Shell>
  );
}
