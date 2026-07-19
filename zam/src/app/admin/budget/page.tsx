'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@/components/admin/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectSelect } from '@/components/admin/road/RoadSelectors';
import {
  BUDGET_STATUSES,
  createBudget,
  deleteBudget,
  downloadCsv,
  duplicateBudget,
  fetchBudgetDashboard,
  fetchBudgets,
  formatMnt,
  type RoadBudget,
} from '@/lib/roadEngineering';
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

const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308'];

export default function RoadBudgetPage() {
  const router = useRouter();
  const [rows, setRows] = useState<RoadBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<number>();
  const [dash, setDash] = useState<Awaited<ReturnType<typeof fetchBudgetDashboard>> | null>(null);
  const [newProjectId, setNewProjectId] = useState<number>();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, d] = await Promise.all([
        fetchBudgets(projectId ? { project_id: projectId } : undefined),
        fetchBudgetDashboard(),
      ]);
      setRows(list);
      setDash(d);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    document.title = 'Замын төсөв';
    load();
  }, [load]);

  const create = async () => {
    try {
      const v = await form.validateFields();
      const project_id = Number(v.project_id || newProjectId);
      if (!project_id) {
        message.warning('Төсөл сонгоно уу');
        return;
      }
      const created = await createBudget({
        project_id,
        name: v.name,
        contingency_pct: Number(v.contingency_pct || 10),
        overhead_pct: Number(v.overhead_pct || 8),
        profit_pct: Number(v.profit_pct || 5),
        vat_pct: Number(v.vat_pct || 10),
        prepared_by: v.prepared_by || 'Замын инженер',
      });
      message.success('Төсөв үүслээ');
      setOpen(false);
      if (created?.id) router.push(`/admin/budget/${created.id}`);
      else load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<RoadBudget> = [
    { title: 'Код', dataIndex: 'code', width: 140 },
    { title: 'Нэр', dataIndex: 'name', ellipsis: true },
    {
      title: 'Төсөл',
      key: 'project',
      render: (_, r) => r.project?.code || r.project_id,
      width: 120,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 110,
      render: (v) => <Tag>{BUDGET_STATUSES.find((s) => s.value === v)?.label || v}</Tag>,
    },
    {
      title: 'Нийт төсөв',
      dataIndex: 'total_amount',
      width: 150,
      render: (v) => formatMnt(v),
    },
    {
      title: '₮/км',
      dataIndex: 'cost_per_km',
      width: 130,
      render: (v) => (v ? formatMnt(v) : '—'),
    },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 220,
      render: (_, row) => (
        <Space>
          <Button type="link" onClick={() => router.push(`/admin/budget/${row.id}`)}>
            Нээх
          </Button>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={async () => {
              const copy = await duplicateBudget(row.id);
              message.success('Хууллаа');
              if (copy?.id) router.push(`/admin/budget/${copy.id}`);
              else load();
            }}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              Modal.confirm({
                title: 'Төсөв устгах уу?',
                onOk: async () => {
                  await deleteBudget(row.id);
                  message.success('Устгагдлаа');
                  load();
                },
              })
            }
          />
        </Space>
      ),
    },
  ];

  const statusChart = Object.entries(dash?.by_status || {}).map(([status, value]) => ({
    name: BUDGET_STATUSES.find((s) => s.value === status)?.label || status,
    value,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Шороо · хучилт · culvert/гүүр · нэгж үнэ · нөөц/НӨАТ — замын төсөвт тооцоо
          </p>
        </div>
        <Space wrap>
          <ProjectSelect value={projectId} onChange={setProjectId} />
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
          <Button onClick={() => router.push('/admin/budget/estimator')}>Тооцоолуур</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); form.setFieldsValue({ contingency_pct: 10, overhead_pct: 8, profit_pct: 5, vat_pct: 10 }); setNewProjectId(undefined); setOpen(true); }}>
            Шинэ төсөв
          </Button>
          <Button onClick={() => downloadCsv('road-budgets.csv', rows as unknown as Record<string, unknown>[])}>
            Excel
          </Button>
        </Space>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Төсөв', value: dash?.cards.budgets ?? 0 },
          { label: 'Батлагдсан', value: dash?.cards.approved ?? 0 },
          { label: 'Нэгж үнэ', value: dash?.cards.active_rates ?? 0 },
          { label: 'Нийт дүн', value: formatMnt(dash?.cards.total_estimate) },
          { label: 'Дундаж ₮/км', value: formatMnt(dash?.cards.avg_cost_per_km) },
          { label: 'Төсөл', value: dash?.cards.projects ?? 0 },
        ].map((c) => (
          <Card key={c.label} className="dark:border-[color:var(--neon-border)]">
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-xs text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="dark:border-[color:var(--neon-border)] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Төсөвүүдийн дүн</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.slice(0, 8).map((r) => ({ name: r.code, total: Number(r.total_amount || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1e6)}сая`} />
                <Tooltip formatter={(v: number) => formatMnt(v)} />
                <Bar dataKey="total" fill="#21cda8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="dark:border-[color:var(--neon-border)]">
          <CardHeader>
            <CardTitle className="text-base">Статусаар</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                  {statusChart.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={{ pageSize: 12 }} />

      <Modal title="Шинэ төсөв" open={open} onCancel={() => setOpen(false)} onOk={create} okText="Үүсгэх" width={520}>
        <Form form={form} layout="vertical" initialValues={{ contingency_pct: 10, overhead_pct: 8, profit_pct: 5, vat_pct: 10 }}>
          <Form.Item name="project_id" label="Төсөл ID" rules={[{ required: true, message: 'Төсөл сонгоно уу' }]} hidden>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Төсөл" required>
            <ProjectSelect
              allowClear={false}
              value={newProjectId}
              onChange={(id) => {
                setNewProjectId(id);
                form.setFieldsValue({ project_id: id });
              }}
            />
          </Form.Item>
          <Form.Item name="name" label="Төсвийн нэр">
            <Input placeholder="Анхны төсөв / Bid estimate" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Form.Item name="contingency_pct" label="Нөөц %">
              <Input type="number" />
            </Form.Item>
            <Form.Item name="overhead_pct" label="Нэмэлт %">
              <Input type="number" />
            </Form.Item>
            <Form.Item name="profit_pct" label="Ашиг %">
              <Input type="number" />
            </Form.Item>
            <Form.Item name="vat_pct" label="НӨАТ %">
              <Input type="number" />
            </Form.Item>
          </div>
          <Form.Item name="prepared_by" label="Бэлтгэсэн">
            <Input placeholder="Замын инженер" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
