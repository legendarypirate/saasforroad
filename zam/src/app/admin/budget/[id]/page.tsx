'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Form,
  Input,
  MoneyInput,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@/components/admin/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  BUDGET_CATEGORIES,
  BUDGET_STATUSES,
  approveBudget,
  createBudgetItem,
  deleteBudgetItem,
  downloadCsv,
  estimateBudget,
  fetchBudget,
  formatMnt,
  updateBudget,
  updateBudgetItem,
  type RoadBudget,
  type RoadBudgetItem,
} from '@/lib/roadEngineering';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function RoadBudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [budget, setBudget] = useState<RoadBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [editing, setEditing] = useState<RoadBudgetItem | null>(null);
  const [form] = Form.useForm();
  const [metaForm] = Form.useForm();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchBudget(id);
      setBudget(data);
      if (data) {
        metaForm.setFieldsValue({
          contingency_pct: data.contingency_pct,
          overhead_pct: data.overhead_pct,
          profit_pct: data.profit_pct,
          vat_pct: data.vat_pct,
          notes: data.notes,
          prepared_by: data.prepared_by,
        });
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [id, metaForm]);

  useEffect(() => {
    document.title = 'Төсвийн дэлгэрэнгүй';
    load();
  }, [load]);

  const runEstimate = async () => {
    setEstimating(true);
    try {
      const result = await estimateBudget(id);
      message.success(
        `Тооцоологдлоо: ${result?.generated_lines ?? 0} мөр · ${formatMnt(result?.summary.total)}`,
      );
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Тооцоолол амжилтгүй');
    } finally {
      setEstimating(false);
    }
  };

  const saveMeta = async () => {
    try {
      const v = await metaForm.validateFields();
      await updateBudget(id, v);
      message.success('Хувь хэмжээ шинэчлэгдлээ');
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const saveItem = async () => {
    try {
      const v = await form.validateFields();
      const body = {
        budget_id: id,
        category: v.category,
        code: v.code,
        description: v.description,
        unit: v.unit,
        quantity: Number(v.quantity || 0),
        unit_price: Number(v.unit_price || 0),
        remarks: v.remarks,
        source: editing?.source || 'manual',
      };
      if (editing) await updateBudgetItem(editing.id, body);
      else await createBudgetItem(body);
      message.success(editing ? 'Шинэчлэгдлээ' : 'Мөр нэмэгдлээ');
      setItemOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<RoadBudgetItem> = useMemo(
    () => [
      {
        title: 'Ангилал',
        dataIndex: 'category',
        width: 130,
        render: (v) => BUDGET_CATEGORIES.find((c) => c.value === v)?.label || v,
      },
      { title: 'Код', dataIndex: 'code', width: 90 },
      { title: 'Тайлбар', dataIndex: 'description', ellipsis: true },
      { title: 'Нэгж', dataIndex: 'unit', width: 70 },
      {
        title: 'Тоо',
        dataIndex: 'quantity',
        width: 100,
        render: (v) => Number(v).toLocaleString(),
      },
      {
        title: 'Нэгж үнэ',
        dataIndex: 'unit_price',
        width: 120,
        render: (v) => formatMnt(v),
      },
      {
        title: 'Дүн',
        dataIndex: 'amount',
        width: 130,
        render: (v) => <span className="font-semibold">{formatMnt(v)}</span>,
      },
      {
        title: 'Эх',
        dataIndex: 'source',
        width: 90,
        render: (v) => <Tag>{v || '—'}</Tag>,
      },
      {
        title: '',
        key: 'act',
        width: 120,
        render: (_, row) => (
          <Space>
            <Button
              type="link"
              onClick={() => {
                setEditing(row);
                form.setFieldsValue(row);
                setItemOpen(true);
              }}
            >
              Засах
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                Modal.confirm({
                  title: 'Мөр устгах уу?',
                  onOk: async () => {
                    await deleteBudgetItem(row.id);
                    load();
                  },
                })
              }
            />
          </Space>
        ),
      },
    ],
    [form, load],
  );

  if (loading && !budget) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!budget) return <p className="text-muted-foreground">Төсөв олдсонгүй</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button type="link" className="px-0" onClick={() => router.push('/admin/budget')}>
            ← Төсөвт буцах
          </Button>
          <h2 className="text-xl font-semibold">{budget.name}</h2>
          <p className="text-sm text-muted-foreground">
            {budget.code} · {budget.project?.code} {budget.project?.name} · v{budget.version}
          </p>
        </div>
        <Space wrap>
          <Tag>{BUDGET_STATUSES.find((s) => s.value === budget.status)?.label || budget.status}</Tag>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            loading={estimating}
            onClick={runEstimate}
          >
            Автомат тооцоо (Estimator)
          </Button>
          <Button
            icon={<CheckOutlined />}
            disabled={budget.status === 'approved'}
            onClick={async () => {
              await approveBudget(id, budget.prepared_by || 'Админ');
              message.success('Батлагдлаа');
              load();
            }}
          >
            Батлах
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              downloadCsv(
                `${budget.code}.csv`,
                (budget.items || []) as unknown as Record<string, unknown>[],
              )
            }
          >
            Excel
          </Button>
          <Button
            onClick={() => {
              const w = window.open('', '_blank');
              if (!w || !budget) return;
              w.document.write(`<html><head><title>${budget.code}</title></head><body>
                <h1>${budget.name}</h1>
                <p>${budget.project?.code || ''} · ${formatMnt(budget.total_amount)}</p>
                <table border="1" cellpadding="6"><tr><th>Ангилал</th><th>Тайлбар</th><th>Тоо</th><th>Үнэ</th><th>Дүн</th></tr>
                ${(budget.items || [])
                  .map(
                    (i) =>
                      `<tr><td>${i.category}</td><td>${i.description}</td><td>${i.quantity}</td><td>${i.unit_price}</td><td>${i.amount}</td></tr>`,
                  )
                  .join('')}
                </table></body></html>`);
              w.document.close();
              w.print();
            }}
          >
            PDF
          </Button>
        </Space>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { label: 'Үндсэн дүн', value: formatMnt(budget.base_amount) },
          { label: `Нөөц (${budget.contingency_pct}%)`, value: formatMnt(budget.contingency_amount) },
          { label: `Нэмэлт (${budget.overhead_pct}%)`, value: formatMnt(budget.overhead_amount) },
          { label: `Ашиг (${budget.profit_pct}%)`, value: formatMnt(budget.profit_amount) },
          { label: `НӨАТ (${budget.vat_pct}%)`, value: formatMnt(budget.vat_amount) },
          { label: 'Нийт', value: formatMnt(budget.total_amount) },
          { label: '₮/км', value: formatMnt(budget.cost_per_km) },
        ].map((c) => (
          <Card key={c.label} className="dark:border-[color:var(--neon-border)]">
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-[11px] text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="dark:border-[color:var(--neon-border)] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ангиллаар зардал</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budget.category_summary || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1e6)}сая`} />
                <Tooltip formatter={(v: number) => formatMnt(v)} />
                <Bar dataKey="amount" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="dark:border-[color:var(--neon-border)]">
          <CardHeader>
            <CardTitle className="text-base">Тооцооллын нөхцөл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(budget.assumptions || []).map((a) => (
              <div key={a.key} className="flex justify-between gap-2 border-b border-border/50 py-1.5">
                <span className="text-muted-foreground">{a.label}</span>
                <span className="font-medium">
                  {a.value} {a.unit}
                </span>
              </div>
            ))}
            {!budget.assumptions?.length && (
              <p className="text-muted-foreground">Estimator ажиллуулбал нөхцөлүүдийг бөглөнө.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="dark:border-[color:var(--neon-border)]">
        <CardHeader>
          <CardTitle className="text-base">Хувь хэмжээ / тохиргоо</CardTitle>
        </CardHeader>
        <CardContent>
          <Form form={metaForm} layout="inline" className="flex flex-wrap gap-3">
            <Form.Item name="contingency_pct" label="Нөөц %">
              <Input type="number" style={{ width: 90 }} />
            </Form.Item>
            <Form.Item name="overhead_pct" label="Нэмэлт %">
              <Input type="number" style={{ width: 90 }} />
            </Form.Item>
            <Form.Item name="profit_pct" label="Ашиг %">
              <Input type="number" style={{ width: 90 }} />
            </Form.Item>
            <Form.Item name="vat_pct" label="НӨАТ %">
              <Input type="number" style={{ width: 90 }} />
            </Form.Item>
            <Form.Item name="prepared_by" label="Бэлтгэсэн">
              <Input style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="notes" label="Тэмдэглэл">
              <Input style={{ width: 220 }} />
            </Form.Item>
            <Button type="primary" onClick={saveMeta}>
              Хадгалах
            </Button>
          </Form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Ажлын жагсаалт ({budget.items?.length || 0})</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ category: 'other', quantity: 1, unit_price: 0 });
            setItemOpen(true);
          }}
        >
          Гараар мөр нэмэх
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={budget.items || []}
        columns={columns}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1100 }}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={6}>
              <b>Үндсэн дүн</b>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1}>
              <b>{formatMnt(budget.base_amount)}</b>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} colSpan={2} />
          </Table.Summary.Row>
        )}
      />

      <Modal
        title={editing ? 'Мөр засах' : 'Шинэ мөр'}
        open={itemOpen}
        onCancel={() => setItemOpen(false)}
        onOk={saveItem}
        okText="Хадгалах"
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="category" label="Ангилал" rules={[{ required: true }]}>
            <Select options={BUDGET_CATEGORIES} />
          </Form.Item>
          <Form.Item name="code" label="Код">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space>
            <Form.Item name="unit" label="Нэгж">
              <Input />
            </Form.Item>
            <Form.Item name="quantity" label="Тоо хэмжээ" rules={[{ required: true }]}>
              <Input type="number" step="any" />
            </Form.Item>
            <Form.Item name="unit_price" label="Нэгж үнэ" rules={[{ required: true }]}>
              <MoneyInput className="w-full" min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="remarks" label="Тэмдэглэл">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
