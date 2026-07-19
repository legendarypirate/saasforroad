'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tag } from '@/components/admin/primitives';
import {
  fetchRoadDashboard,
  formatStation,
  ROAD_STATUSES,
  type RoadDashboard,
} from '@/lib/roadEngineering';

const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#14b8a6'];

export default function RoadEngineeringDashboardPage() {
  const [data, setData] = useState<RoadDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Замын инженеринг — Самбар';
    fetchRoadDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Самбарын өгөгдөл ачааллахад алдаа гарлаа.</p>;
  }

  const cards = [
    { label: 'Төсөл', value: data.cards.projects },
    { label: 'Замын урт (м)', value: data.cards.road_length.toLocaleString() },
    { label: 'Cut (м³)', value: data.cards.earthwork_cut.toLocaleString() },
    { label: 'Fill (м³)', value: data.cards.earthwork_fill.toLocaleString() },
    { label: 'Байгууламж', value: data.cards.structures },
    { label: 'Хөндлөн огтлол', value: data.cards.cross_sections },
    { label: 'Хэмжилтийн цэг', value: data.cards.survey_points },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Төсөл, тэнхлэг, профиль, шорооны ажил — нэгтгэсэн самбар
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {cards.map((c) => (
          <Card key={c.label} className="dark:border-[color:var(--neon-border)]">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="dark:border-[color:var(--neon-border)] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Төслийн явц (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.progress}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="progress" fill="#21cda8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="dark:border-[color:var(--neon-border)]">
          <CardHeader>
            <CardTitle className="text-base">Шорооны баланс</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.earthwork_balance}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {data.charts.earthwork_balance.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="dark:border-[color:var(--neon-border)]">
          <CardHeader>
            <CardTitle className="text-base">Статусаар замын урт</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.length_by_status}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="length" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="dark:border-[color:var(--neon-border)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Сүүлийн төслүүд</CardTitle>
            <Link href="/admin/road-engineering/projects" className="text-sm text-primary hover:underline">
              Бүгдийг харах
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {p.code} · {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatStation(p.start_station)} — {formatStation(p.end_station)} · {Number(p.length || 0).toLocaleString()} м
                  </p>
                </div>
                <Tag>
                  {ROAD_STATUSES.find((s) => s.value === p.status)?.label || p.status}
                </Tag>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
