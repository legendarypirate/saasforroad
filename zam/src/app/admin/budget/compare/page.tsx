'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Select, Space, Table, message } from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BUDGET_CATEGORIES,
  fetchBudget,
  fetchBudgets,
  formatMnt,
  type RoadBudget,
} from '@/lib/roadEngineering';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function BudgetComparePage() {
  const [budgets, setBudgets] = useState<RoadBudget[]>([]);
  const [leftId, setLeftId] = useState<number>();
  const [rightId, setRightId] = useState<number>();
  const [left, setLeft] = useState<RoadBudget | null>(null);
  const [right, setRight] = useState<RoadBudget | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Төсөв харьцуулалт';
    fetchBudgets().then(setBudgets).catch(() => setBudgets([]));
  }, []);

  const loadPair = async () => {
    if (!leftId || !rightId) {
      message.warning('Хоёр төсөв сонгоно уу');
      return;
    }
    setLoading(true);
    try {
      const [a, b] = await Promise.all([fetchBudget(leftId), fetchBudget(rightId)]);
      setLeft(a);
      setRight(b);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!left || !right) return [];
    const cats = new Set<string>();
    (left.category_summary || []).forEach((c) => cats.add(c.category));
    (right.category_summary || []).forEach((c) => cats.add(c.category));
    return [...cats].map((cat) => ({
      category: BUDGET_CATEGORIES.find((c) => c.value === cat)?.label || cat,
      A: Number(left.category_summary?.find((c) => c.category === cat)?.amount || 0),
      B: Number(right.category_summary?.find((c) => c.category === cat)?.amount || 0),
    }));
  }, [left, right]);

  const diffRows = useMemo(() => {
    if (!left || !right) return [];
    return [
      { key: 'base', label: 'Үндсэн дүн', a: left.base_amount, b: right.base_amount },
      { key: 'cont', label: 'Нөөц', a: left.contingency_amount, b: right.contingency_amount },
      { key: 'oh', label: 'Нэмэлт', a: left.overhead_amount, b: right.overhead_amount },
      { key: 'profit', label: 'Ашиг', a: left.profit_amount, b: right.profit_amount },
      { key: 'vat', label: 'НӨАТ', a: left.vat_amount, b: right.vat_amount },
      { key: 'total', label: 'Нийт', a: left.total_amount, b: right.total_amount },
      { key: 'km', label: '₮/км', a: left.cost_per_km || 0, b: right.cost_per_km || 0 },
    ].map((r) => ({
      ...r,
      diff: Number(r.b) - Number(r.a),
      pct: Number(r.a) ? ((Number(r.b) - Number(r.a)) / Number(r.a)) * 100 : 0,
    }));
  }, [left, right]);

  const columns: ColumnsType<(typeof diffRows)[0]> = [
    { title: 'Үзүүлэлт', dataIndex: 'label' },
    { title: left?.code || 'A', dataIndex: 'a', render: (v) => formatMnt(v) },
    { title: right?.code || 'B', dataIndex: 'b', render: (v) => formatMnt(v) },
    {
      title: 'Зөрүү (B−A)',
      dataIndex: 'diff',
      render: (v) => (
        <span className={Number(v) >= 0 ? 'text-red-500' : 'text-emerald-500'}>{formatMnt(v)}</span>
      ),
    },
    {
      title: '%',
      dataIndex: 'pct',
      render: (v) => `${Number(v).toFixed(1)}%`,
    },
  ];

  const options = budgets.map((b) => ({
    value: b.id,
    label: `${b.code} — ${b.name} (${formatMnt(b.total_amount)})`,
  }));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Хоёр хувилбарын дүн, ангилал, ₮/км-ийг харьцуулна.</p>
      </div>

      <Space wrap>
        <Select
          style={{ minWidth: 280 }}
          placeholder="Төсөв A"
          options={options}
          value={leftId}
          onChange={(v) => setLeftId(Number(v))}
        />
        <Select
          style={{ minWidth: 280 }}
          placeholder="Төсөв B"
          options={options}
          value={rightId}
          onChange={(v) => setRightId(Number(v))}
        />
        <Button type="primary" loading={loading} onClick={loadPair}>
          Харьцуулах
        </Button>
      </Space>

      {left && right && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-xs text-muted-foreground">A нийт</CardTitle>
              </CardHeader>
              <CardContent className="font-bold">{formatMnt(left.total_amount)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-xs text-muted-foreground">B нийт</CardTitle>
              </CardHeader>
              <CardContent className="font-bold">{formatMnt(right.total_amount)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-3">
                <CardTitle className="text-xs text-muted-foreground">Зөрүү</CardTitle>
              </CardHeader>
              <CardContent className="font-bold">
                {formatMnt(Number(right.total_amount) - Number(left.total_amount))}
              </CardContent>
            </Card>
          </div>

          <Card className="dark:border-[color:var(--neon-border)]">
            <CardHeader>
              <CardTitle className="text-base">Ангиллаар</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1e6)}сая`} />
                  <Tooltip formatter={(v: number) => formatMnt(v)} />
                  <Legend />
                  <Bar dataKey="A" name={left.code} fill="#f97316" />
                  <Bar dataKey="B" name={right.code} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Table rowKey="key" dataSource={diffRows} columns={columns} pagination={false} />
        </>
      )}
    </div>
  );
}
