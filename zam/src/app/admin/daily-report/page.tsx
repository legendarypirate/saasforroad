'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  HardHat,
  Package,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  fetchDailySummary,
  todayLocalISO,
  type DailySummary,
} from '@/lib/dailyReport';
import { cn } from '@/lib/utils';

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'ok' | 'warn' | 'critical';
}) {
  const toneClass =
    tone === 'critical'
      ? 'text-red-600 bg-red-50 dark:bg-red-950/40'
      : tone === 'warn'
        ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
        : tone === 'ok'
          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
          : 'text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40';

  return (
    <Card size="sm">
      <CardContent className="flex items-start gap-3 pt-4">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', toneClass)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground/75">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {hint ? <p className="mt-0.5 text-xs text-foreground/65">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DailyReportSummaryPage() {
  const [date, setDate] = useState(todayLocalISO());
  const [data, setData] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const summary = await fetchDailySummary(d);
      setData(summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Өдрийн товч — Daily Report';
    load(date);
  }, [date, load]);

  const t = data?.totals;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Ерөнхий захиралд зориулсан 2–3 минутын хураангуй
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            className="w-auto"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Link
            href="/admin/daily-report/new"
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            Шинэ тайлан
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : !data || !t ? (
        <Card>
          <CardContent className="py-12 text-center text-foreground/70">
            Өгөгдөл ачаалж чадсангүй
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi
              label="Тайлан илгээсэн төсөл"
              value={t.projects_reported}
              hint={date}
              icon={TrendingUp}
              tone={t.projects_reported > 0 ? 'ok' : 'warn'}
            />
            <Kpi
              label="ХАБЭА — осол"
              value={t.safety_incidents + (t.system_accidents || 0)}
              hint={`Тайлан: ${t.safety_incidents} · Систем: ${t.system_accidents} · Дөхсөн: ${t.safety_near_misses}`}
              icon={AlertTriangle}
              tone={t.safety_incidents + t.system_accidents > 0 ? 'critical' : 'ok'}
            />
            <Kpi
              label="Явц (төлөвлөгөөнд)"
              value={t.progress_pct != null ? `${t.progress_pct}%` : '—'}
              hint={`${t.progress_actual} / ${t.progress_planned}`}
              icon={TrendingUp}
              tone={
                t.progress_pct == null
                  ? 'default'
                  : t.progress_pct >= 90
                    ? 'ok'
                    : t.progress_pct >= 70
                      ? 'warn'
                      : 'critical'
              }
            />
            <Kpi
              label="Ирц (тайлан)"
              value={`${t.labor_present}/${t.labor_planned || '—'}`}
              hint={
                data.attendance_pulse
                  ? `Системийн check-in: ${data.attendance_pulse.checked_in}`
                  : `Тасалсан: ${t.labor_absent} · Илүү цаг: ${t.labor_overtime}`
              }
              icon={Users}
              tone={
                t.labor_planned > 0 && t.labor_present < t.labor_planned * 0.85 ? 'warn' : 'default'
              }
            />
            <Kpi
              label="Техник"
              value={`${t.equipment_working} ажиллаж`}
              hint={`Зогссон: ${t.equipment_idle} · Эвдэрсэн: ${t.equipment_broken}`}
              icon={Wrench}
              tone={t.equipment_broken > 0 ? 'warn' : 'ok'}
            />
            <Kpi
              label="Материал дутагдал"
              value={t.materials_shortages}
              hint="Зөвхөн чухал дутагдал"
              icon={Package}
              tone={t.materials_shortages > 0 ? 'warn' : 'ok'}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HardHat className="size-4" />
                  Анхаарах зүйлс
                </CardTitle>
                <CardDescription>Хамгийн чухал 12 мөр — урт тайлан биш</CardDescription>
              </CardHeader>
              <CardContent>
                {data.attention.length === 0 ? (
                  <p className="py-6 text-center text-sm text-foreground/70">
                    Өнөөдөр онцгой анхаарах зүйл бүртгэгдээгүй.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.attention.map((item, i) => (
                      <li
                        key={`${item.project}-${i}`}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm',
                          item.level === 'critical' &&
                            'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
                          item.level === 'warn' &&
                            'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
                          item.level === 'info' && 'border-border bg-muted/40',
                        )}
                      >
                        <span className="font-semibold">{item.project}</span>
                        <span className="text-muted-foreground"> — {item.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Төслүүдийн товч</CardTitle>
                <CardDescription>Тайлан ирсэн төслүүд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.projects.length === 0 ? (
                  <p className="py-6 text-center text-sm text-foreground/70">
                    Энэ өдөр тайлан байхгүй.
                  </p>
                ) : (
                  data.projects.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <p className="font-semibold">{p.project_name}</p>
                      <p className="mt-1 text-xs text-foreground/65">
                        Явц {p.progress_pct}% · Ирц {p.labor_present}/{p.labor_planned || '—'} ·
                        Эвдрэл {p.equipment_broken} · Материал {p.materials_shortages}
                      </p>
                      {p.weather_note ? (
                        <p className="mt-1 text-xs text-foreground/65">Цаг агаар: {p.weather_note}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
