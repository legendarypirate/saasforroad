"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { AdminCrudActions } from "@/components/admin/AdminCrudActions";
import { RBadge, RTable } from "@/components/r";
import { api, Tenant } from "@/lib/api";

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError("");
    api
      .listTenants()
      .then((res) => setTenants(res.tenants))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Ачаалахад алдаа")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const activeCount = tenants.filter((t) => t.is_active).length;

  return (
    <Shell>
      <AdminListToolbar
        title="Түрээслэгчид"
        description="Түрээслэгч бүр өөрийн домэйн дээр zam ERP ажиллуулна."
        onReload={load}
        onCreate={() => router.push("/tenants/new")}
        createLabel="Түрээслэгч бүртгэх"
        actions={undefined}
      />

      <div className="mb-4 grid grid-cols-3 gap-2">
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
            className="rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-0.5 text-xl font-extrabold tracking-tight tabular-nums text-foreground">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="error mb-3">{error}</p> : null}

      <RTable
        columns={[
          {
            key: "name",
            title: "Нэр",
            render: (t) => (
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t.slug}
                </div>
              </div>
            ),
          },
          {
            key: "domain",
            title: "Домэйн",
            render: (t) => (
              <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-[var(--ok)]">
                {t.domain}
              </code>
            ),
          },
          {
            key: "status",
            title: "Төлөв",
            render: (t) => (
              <RBadge tone={t.is_active ? "success" : "danger"} dot>
                {t.is_active ? "Идэвхтэй" : "Идэвхгүй"}
              </RBadge>
            ),
          },
          {
            key: "users",
            title: "Хэрэглэгч",
            render: (t) => t.user_count ?? 0,
          },
          {
            key: "superadmin",
            title: "Суперадмин",
            render: (t) => t.superadmin?.username || "—",
          },
          {
            key: "modules",
            title: "Модуль",
            render: (t) => (t.modules || []).length,
          },
          {
            key: "actions",
            title: "",
            align: "right",
            render: (t) => (
              <AdminCrudActions onView={() => router.push(`/tenants/${t.id}`)} />
            ),
          },
        ]}
        data={tenants}
        rowKey="id"
        loading={loading}
        empty={
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            Түрээслэгч байхгүй. Эхнийхийг бүртгэнэ үү.
          </div>
        }
      />
    </Shell>
  );
}
