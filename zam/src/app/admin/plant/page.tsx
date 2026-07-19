'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Space,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import { ReloadOutlined } from '@/components/admin/icons';
import {
  fetchPlantDashboard,
  formatMoney,
  formatQty,
  plantTypeLabel,
  seedPlantDefaults,
  type PlantDashboard,
} from '@/lib/plant';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'good' | 'bad' | 'warn';
}) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-500'
      : tone === 'bad'
        ? 'text-red-500'
        : tone === 'warn'
          ? 'text-amber-500'
          : 'text-foreground';
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums', toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function PlantDashboardPage() {
  const [data, setData] = useState<PlantDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let dash = await fetchPlantDashboard();
      if (dash && dash.plant_count === 0) {
        await seedPlantDefaults();
        dash = await fetchPlantDashboard();
        message.success('Үндсэн үйлдвэрүүд үүслээ (асфальт, цемент, бутлуур, эмульс)');
      }
      setData(dash);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Үйлдвэр — Самбар';
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Асфальт, цемент, бутлуур, эмульс — орлого / зарлага / үйлдвэрлэл
            {data?.period ? ` · ${data.period.start} → ${data.period.end}` : ''}
          </p>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
          <Link href="/admin/plant/sites">
            <Button type="primary">Үйлдвэрүүд</Button>
          </Link>
        </Space>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Үйлдвэр" value={String(data?.plant_count ?? 0)} hint={`Идэвхтэй ${data?.active_plants ?? 0}`} />
        <Kpi
          label="Сарын орлого"
          value={formatMoney(data?.month_income)}
          tone="good"
          hint={`Авлага: ${formatMoney(data?.unpaid_sales)}`}
        />
        <Kpi label="Сарын зарлага" value={formatMoney(data?.month_expense)} tone="bad" />
        <Kpi
          label="Цэвэр дүн"
          value={formatMoney(data?.month_net)}
          tone={(data?.month_net ?? 0) >= 0 ? 'good' : 'bad'}
          hint={`Үйлдвэрлэл: ${formatQty(data?.month_produced)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Үйлдвэрээр — орлого / зарлага</h2>
            <Link href="/admin/plant/sales" className="text-xs text-primary hover:underline">
              Борлуулалт
            </Link>
          </div>
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={data?.by_plant || []}
            columns={[
              {
                title: 'Үйлдвэр',
                dataIndex: 'name',
                render: (v, row) => (
                  <div>
                    <div className="font-medium">{String(v)}</div>
                    <div className="text-xs text-muted-foreground">
                      {plantTypeLabel(String(row.plant_type))}
                    </div>
                  </div>
                ),
              },
              {
                title: 'Орлого',
                dataIndex: 'income',
                align: 'right',
                render: (v) => <span className="text-emerald-500">{formatMoney(Number(v))}</span>,
              },
              {
                title: 'Зарлага',
                dataIndex: 'expense',
                align: 'right',
                render: (v) => <span className="text-red-400">{formatMoney(Number(v))}</span>,
              },
              {
                title: 'Цэвэр',
                dataIndex: 'net',
                align: 'right',
                render: (v) => (
                  <span className={Number(v) >= 0 ? 'text-emerald-500' : 'text-red-400'}>
                    {formatMoney(Number(v))}
                  </span>
                ),
              },
              {
                title: 'Үйлдвэрлэсэн',
                dataIndex: 'produced',
                align: 'right',
                render: (v) => formatQty(Number(v)),
              },
            ]}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Бага үлдэгдэл</h2>
              <Link href="/admin/plant/stocks" className="text-xs text-primary hover:underline">
                Үлдэгдэл
              </Link>
            </div>
            {(data?.low_stock?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Анхааруулга байхгүй</p>
            ) : (
              <ul className="space-y-2">
                {data?.low_stock.map((s) => {
                  const mat = s.material as { name?: string; unit?: string } | undefined;
                  const plant = s.plant as { name?: string } | undefined;
                  return (
                    <li
                      key={String(s.id)}
                      className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{mat?.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{plant?.name}</div>
                      </div>
                      <Tag color="orange">{formatQty(Number(s.quantity), mat?.unit || 'тн')}</Tag>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Сүүлийн өдрийн тайлан</h2>
              <Link href="/admin/plant/daily-reports" className="text-xs text-primary hover:underline">
                Бүгд
              </Link>
            </div>
            {(data?.recent_reports?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Тайлан байхгүй</p>
            ) : (
              <ul className="space-y-2">
                {data?.recent_reports.slice(0, 5).map((r) => {
                  const plant = r.plant as { name?: string } | undefined;
                  return (
                    <li
                      key={String(r.id)}
                      className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium">{plant?.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{String(r.report_date)}</div>
                      </div>
                      <span className="tabular-nums text-muted-foreground">
                        {formatQty(Number(r.quantity_produced), String(r.unit || 'тн'))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {[
          { href: '/admin/plant/sites', label: 'Үйлдвэр' },
          { href: '/admin/plant/products', label: 'Бүтээгдэхүүн' },
          { href: '/admin/plant/materials', label: 'Түүхий эд' },
          { href: '/admin/plant/movements', label: 'Орлого/зарлага' },
          { href: '/admin/plant/batches', label: 'Багц' },
          { href: '/admin/plant/sales', label: 'Борлуулалт' },
          { href: '/admin/plant/expenses', label: 'Зардал' },
          { href: '/admin/plant/daily-reports', label: 'Өдрийн тайлан' },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-muted"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
