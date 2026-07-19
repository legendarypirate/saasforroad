'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import {
  ArrowRight,
  Droplets,
  Fuel,
  TrendingUp,
  AlertTriangle,
  Gauge,
  Wallet,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tag, Table } from '@/components/admin/primitives';
import { fetchFuelDashboard, fuelTypeLabel, type FuelDashboard } from '@/lib/fuel';

const LINKS = [
  { href: '/admin/fuel/purchases', title: 'Худалдан авалт', desc: 'Орлого, нэхэмжлэх, сав нэмэгдэх' },
  { href: '/admin/fuel/tanks', title: 'Сав / танк', desc: 'Үлдэгдэл, багтаамж' },
  { href: '/admin/fuel/issues', title: 'Олголт', desc: 'Машинд олгох, одометр' },
  { href: '/admin/fuel/consumption', title: 'Зарцуулалт', desc: 'Л/100км, хэтрэлт' },
  { href: '/admin/fuel/suppliers', title: 'Нийлүүлэгч', desc: 'Нийлүүлэгчийн бүртгэл' },
  { href: '/admin/fuel/reports', title: 'Тайлан', desc: 'Excel / PDF / хэвлэх' },
];

export default function FuelDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<FuelDashboard | null>(null);

  useEffect(() => {
    document.title = 'Шатахуун удирдлага';
    (async () => {
      try {
        setDash(await fetchFuelDashboard());
      } catch {
        setDash(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kpis = [
    { label: 'Өнөөдөр худалдсан', value: `${dash?.purchased_today ?? 0} л`, icon: Droplets },
    { label: 'Өнөөдөр олгосон', value: `${dash?.issued_today ?? 0} л`, icon: Fuel },
    { label: 'Одоогийн үлдэгдэл', value: `${dash?.current_stock ?? 0} л`, icon: Gauge },
    { label: 'Сарын зардал', value: `${(dash?.monthly_cost ?? 0).toLocaleString()} ₮`, icon: Wallet },
    { label: 'Дундаж зарцуулалт', value: `${dash?.average_consumption ?? 0} л/100км`, icon: TrendingUp },
    {
      label: 'Их зарцуулалттай',
      value: dash?.high_consumption_count ?? 0,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Автопарк — худалдан авалт, сав, олголт, зарцуулалтын самбар
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {kpis.map((k) => (
              <Card key={k.label}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <k.icon className="size-4" /> {k.label}
                  </CardDescription>
                  <CardTitle className="text-2xl tabular-nums">{k.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Сарын худалдан авалт (л)</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dash?.charts.monthly_purchase || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#a16207" name="Литр" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Сарын олголт (л)</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dash?.charts.monthly_consumption || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#0f766e" name="Литр" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Зардлын чиг хандлага</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dash?.charts.cost_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cost" stroke="#b45309" name="Зардал ₮" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {dash?.high_consumption?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Их зарцуулалттай техникууд</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dash.high_consumption.map((i) => (
                  <div key={i.id} className="flex justify-between border-b border-border/60 py-2 text-sm last:border-0">
                    <span>{i.equipment}</span>
                    <span className="tabular-nums text-amber-700">
                      {i.rate} л/100км <Tag color="orange">хэтэрсэн</Tag>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Сүүлийн худалдан авалт</CardTitle>
              </CardHeader>
              <CardContent>
                <Table
                  rowKey="id"
                  pagination={false}
                  size="small"
                  dataSource={dash?.recent_purchases || []}
                  columns={[
                    { title: 'Огноо', dataIndex: 'purchase_date', width: 100 },
                    {
                      title: 'Нийлүүлэгч',
                      render: (_, r) => (r.supplier as { name?: string })?.name || '—',
                    },
                    {
                      title: 'Литр',
                      dataIndex: 'quantity',
                      align: 'right',
                      render: (v) => Number(v).toLocaleString(),
                    },
                    {
                      title: 'Дүн',
                      dataIndex: 'total_amount',
                      align: 'right',
                      render: (v) => `${Number(v).toLocaleString()} ₮`,
                    },
                  ]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Сүүлийн олголт</CardTitle>
              </CardHeader>
              <CardContent>
                <Table
                  rowKey="id"
                  pagination={false}
                  size="small"
                  dataSource={dash?.recent_issues || []}
                  columns={[
                    { title: 'Огноо', dataIndex: 'issue_date', width: 100 },
                    {
                      title: 'Техник',
                      render: (_, r) => {
                        const eq = r.equipment as { name?: string; registration_number?: string } | undefined;
                        if (!eq) return '—';
                        return eq.registration_number ? `${eq.name} (${eq.registration_number})` : eq.name;
                      },
                    },
                    {
                      title: 'Литр',
                      dataIndex: 'quantity',
                      align: 'right',
                      render: (v) => Number(v).toLocaleString(),
                    },
                    {
                      title: 'Төрөл',
                      dataIndex: 'fuel_type',
                      render: (v: string) => fuelTypeLabel(v),
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div>
              <div className="font-medium">{item.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
