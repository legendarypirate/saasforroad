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
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Ачаалахад алдаа")
      )
      .finally(() => setLoading(false));
  }, []);

  const activeCount = tenants.filter((t) => t.is_active).length;

  return (
    <Shell>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-[var(--muted)]">
          Түрээслэгч бүр өөрийн домэйн дээр zam ERP ажиллуулна.
        </p>
        <Link href="/tenants/new" className="btn !px-3 !py-1.5 !text-[13px]">
          + Түрээслэгч бүртгэх
        </Link>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { label: "Нийт", value: loading ? "—" : tenants.length },
          { label: "Идэвхтэй", value: loading ? "—" : activeCount },
          {
            label: "Идэвхгүй",
            value: loading ? "—" : tenants.length - activeCount,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-2"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              {s.label}
            </div>
            <div className="mt-0.5 text-xl font-extrabold tracking-tight tabular-nums">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]">
        {loading ? (
          <p className="px-3 py-6 text-center text-[13px] text-[var(--muted)]">
            Ачаалж байна…
          </p>
        ) : null}
        {error ? <p className="error px-3 py-3">{error}</p> : null}
        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--panel-2)]/60">
                  {[
                    "Нэр",
                    "Домэйн",
                    "Төлөв",
                    "Хэрэглэгч",
                    "Суперадмин",
                    "Модуль",
                    "",
                  ].map((h) => (
                    <th
                      key={h || "actions"}
                      className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--line)] transition-colors last:border-0 hover:bg-[var(--accent-soft)]"
                  >
                    <td className="px-3 py-2 align-middle">
                      <div className="font-bold leading-tight">{t.name}</div>
                      <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                        {t.slug}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <code className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[11px] text-[var(--accent)]">
                        {t.domain}
                      </code>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span
                        className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                          t.is_active
                            ? "bg-[var(--accent-soft)] text-[var(--ok)]"
                            : "bg-[rgba(240,113,120,0.12)] text-[var(--danger)]"
                        }`}
                      >
                        {t.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle tabular-nums">
                      {t.user_count ?? 0}
                    </td>
                    <td className="px-3 py-2 align-middle text-[var(--muted)]">
                      {t.superadmin?.username || "—"}
                    </td>
                    <td className="px-3 py-2 align-middle tabular-nums">
                      {(t.modules || []).length}
                    </td>
                    <td className="px-3 py-2 align-middle text-right">
                      <Link
                        href={`/tenants/${t.id}`}
                        className="inline-flex rounded-lg border border-[var(--line-strong)] px-2.5 py-1 text-[12px] font-bold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        Удирдах
                      </Link>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-10 text-center text-[13px] text-[var(--muted)]"
                    >
                      Түрээслэгч байхгүй. Эхнийхийг бүртгэнэ үү.
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
