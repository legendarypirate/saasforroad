"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Ban, X } from "lucide-react";
import Shell from "@/components/Shell";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import {
  RActionButton,
  RBadge,
  RSelect,
  RTable,
  RTableActions,
} from "@/components/r";
import { api, PlatformDriverJobOpening } from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  draft: "Ноорог",
  pending: "Хяналтад",
  approved: "Батлагдсан",
  rejected: "Татгалзсан",
  closed: "Хаалттай",
};

export default function DriverJobOpeningsPage() {
  const [rows, setRows] = useState<PlatformDriverJobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "closed"
  >("pending");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .listDriverJobOpenings({
        q: q.trim() || undefined,
        status: filter === "all" ? undefined : filter,
      })
      .then((res) => setRows(res.openings))
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
    const pending = rows.filter((r) => r.status === "pending").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    return { all: rows.length, pending, approved };
  }, [rows]);

  async function setStatus(
    row: PlatformDriverJobOpening,
    status: "approved" | "rejected" | "closed",
    admin_note?: string
  ) {
    setBusyId(row.id);
    setError("");
    setMessage("");
    try {
      await api.setDriverJobOpeningStatus(row.id, { status, admin_note });
      setMessage(
        status === "approved"
          ? `Батлагдлаа: “${row.title}”`
          : status === "rejected"
            ? `Татгалзлаа: “${row.title}”`
            : `Хаагдлаа: “${row.title}”`
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
        title="Жолоочийн зар"
        description="Zam-аас илгээсэн ажлын зар. Баталгаажсан зар Freelancer апп-д харагдана."
        searchValue={q}
        onSearchChange={setQ}
        onSearch={() => load()}
        onReload={load}
        filters={
          <RSelect
            value={filter}
            onChange={(v) => setFilter((v as typeof filter) || "pending")}
            options={[
              { value: "all", label: "Бүх төлөв" },
              { value: "pending", label: "Хяналтад" },
              { value: "approved", label: "Батлагдсан" },
              { value: "rejected", label: "Татгалзсан" },
              { value: "closed", label: "Хаалттай" },
            ]}
            className="w-44"
          />
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Нийт", value: loading ? "—" : counts.all },
          { label: "Хяналтад", value: loading ? "—" : counts.pending },
          { label: "Батлагдсан", value: loading ? "—" : counts.approved },
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
            key: "title",
            title: "Зар",
            render: (row) => (
              <div>
                <div className="font-semibold">{row.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {row.company_name || "—"}
                  {row.project_name ? ` · ${row.project_name}` : ""}
                </div>
              </div>
            ),
          },
          {
            key: "role",
            title: "Албан тушаал",
            render: (row) => row.position_type || "—",
          },
          {
            key: "location",
            title: "Байршил",
            render: (row) =>
              [row.province, row.location].filter(Boolean).join(" · ") || "—",
          },
          {
            key: "salary",
            title: "Цалин",
            render: (row) => row.salary_note || "—",
          },
          {
            key: "status",
            title: "Төлөв",
            render: (row) => (
              <RBadge
                tone={
                  row.status === "approved"
                    ? "success"
                    : row.status === "pending"
                      ? "warning"
                      : row.status === "rejected"
                        ? "danger"
                        : "neutral"
                }
                dot
              >
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
                {row.status === "pending" ? (
                  <>
                    <RActionButton
                      icon={<Check strokeWidth={2} />}
                      label="Батлах"
                      tone="success"
                      disabled={busyId === row.id}
                      onClick={() => setStatus(row, "approved")}
                    />
                    <RActionButton
                      icon={<X strokeWidth={2} />}
                      label="Татгалзах"
                      tone="danger"
                      disabled={busyId === row.id}
                      onClick={() => {
                        const note = window.prompt("Татгалзах шалтгаан (заавал биш)");
                        if (note === null) return;
                        setStatus(row, "rejected", note || undefined);
                      }}
                    />
                  </>
                ) : null}
                {row.status === "approved" ? (
                  <RActionButton
                    icon={<Ban strokeWidth={2} />}
                    label="Хаах"
                    tone="danger"
                    disabled={busyId === row.id}
                    onClick={() => setStatus(row, "closed")}
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
            Жолоочийн зар байхгүй. Zam-аас илгээсний дараа энд гарна.
          </div>
        }
      />
    </Shell>
  );
}
