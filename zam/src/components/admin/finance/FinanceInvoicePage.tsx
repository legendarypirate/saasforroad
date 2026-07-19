'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Drawer,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import {
  createFinanceRecord,
  deleteFinanceRecord,
  fetchFinanceList,
  formatMoney,
  INVOICE_STATUSES,
  updateFinanceRecord,
} from '@/lib/finance';

type Line = { description: string; qty: number; unit_price: number; vat_rate: number };

type Props = {
  title: string;
  direction: 'ar' | 'ap';
};

export default function FinanceInvoicePage({ title, direction }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [lines, setLines] = useState<Line[]>([{ description: '', qty: 1, unit_price: 0, vat_rate: 10 }]);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, projs, sups] = await Promise.all([
        fetchFinanceList<Record<string, unknown>>('invoices', { direction }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`).then((r) => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supplier`).then((r) => r.json()),
      ]);
      setRows(data);
      setProjects(projs.success ? projs.data : []);
      setSuppliers(sups.success ? (sups.data || []) : []);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [direction]);

  useEffect(() => {
    document.title = title;
    load();
  }, [title, load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      issue_date: dayjs(),
      status: 'issued',
      vat_rate: 10,
    });
    setLines([{ description: '', qty: 1, unit_price: 0, vat_rate: 10 }]);
    setOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    form.setFieldsValue({
      ...row,
      issue_date: row.issue_date ? dayjs(String(row.issue_date)) : null,
      due_date: row.due_date ? dayjs(String(row.due_date)) : null,
    });
    const existing = (row.lines as Line[] | undefined) || [];
    setLines(
      existing.length
        ? existing.map((l) => ({
            description: l.description || '',
            qty: Number(l.qty) || 1,
            unit_price: Number(l.unit_price) || 0,
            vat_rate: Number(l.vat_rate) || 10,
          }))
        : [{ description: '', qty: 1, unit_price: 0, vat_rate: 10 }],
    );
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const body = {
        ...values,
        direction,
        issue_date: values.issue_date ? dayjs(values.issue_date).format('YYYY-MM-DD') : undefined,
        due_date: values.due_date ? dayjs(values.due_date).format('YYYY-MM-DD') : null,
        created_by: user?.id,
        lines: lines.map((l) => ({
          ...l,
          amount: Number(l.qty) * Number(l.unit_price),
        })),
      };
      if (editing) await updateFinanceRecord('invoices', Number(editing.id), body);
      else await createFinanceRecord('invoices', body);
      message.success(editing ? 'Шинэчлэгдлээ' : 'Нэмэгдлээ');
      setOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<Record<string, unknown>> = [
    { title: 'Дугаар', dataIndex: 'number', width: 130 },
    {
      title: direction === 'ap' ? 'Нийлүүлэгч' : 'Харилцагч',
      render: (_, r) =>
        (r.supplier as { name?: string })?.name ||
        (r.counterparty as string) ||
        '—',
    },
    {
      title: 'Төсөл',
      render: (_, r) => (r.project as { name?: string })?.name || '—',
    },
    { title: 'Огноо', dataIndex: 'issue_date', width: 110 },
    {
      title: 'Нийт',
      dataIndex: 'total',
      align: 'right',
      render: (v) => formatMoney(v as number),
    },
    {
      title: 'Төлсөн',
      dataIndex: 'paid_amount',
      align: 'right',
      render: (v) => formatMoney(v as number),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (v: string) => {
        const label = INVOICE_STATUSES.find((s) => s.value === v)?.label || v;
        const color =
          v === 'paid' ? 'green' : v === 'partial' ? 'gold' : v === 'cancelled' ? 'red' : 'blue';
        return <Tag color={color}>{label}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Нэмэх
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          ...columns,
          {
            title: 'Үйлдэл',
            render: (_, row) => (
              <Space>
                <Button type="link" onClick={() => openEdit(row)}>
                  Засах
                </Button>
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    Modal.confirm({
                      title: 'Устгах уу?',
                      onOk: async () => {
                        await deleteFinanceRecord('invoices', Number(row.id));
                        message.success('Устгагдлаа');
                        load();
                      },
                    })
                  }
                />
              </Space>
            ),
          },
        ]}
        pagination={{ pageSize: 15 }}
        scroll={{ x: 1000 }}
      />

      <Drawer
        title={editing ? 'Засах' : 'Шинэ нэхэмжлэх'}
        open={open}
        onClose={() => setOpen(false)}
        width={640}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Болих</Button>
            <Button type="primary" onClick={handleSave}>
              Хадгалах
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="counterparty" label="Харилцагчийн нэр">
              <Input />
            </Form.Item>
            {direction === 'ap' ? (
              <Form.Item name="supplier_id" label="Нийлүүлэгч" rules={[{ required: true }]}>
                <Select
                  options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            ) : (
              <Form.Item name="project_id" label="Төсөл">
                <Select
                  allowClear
                  options={projects.map((p) => ({ value: p.id, label: p.name }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            )}
            {direction === 'ap' && (
              <Form.Item name="project_id" label="Төсөл">
                <Select
                  allowClear
                  options={projects.map((p) => ({ value: p.id, label: p.name }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            )}
            <Form.Item name="issue_date" label="Огноо" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="due_date" label="Төлөх хугацаа">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="status" label="Төлөв">
              <Select options={INVOICE_STATUSES} />
            </Form.Item>
            <Form.Item name="description" label="Тайлбар" style={{ gridColumn: '1 / -1' }}>
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>
        </Form>

        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>Мөрүүд</strong>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setLines((prev) => [...prev, { description: '', qty: 1, unit_price: 0, vat_rate: 10 }])}
            >
              Мөр нэмэх
            </Button>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 110px 80px 32px', gap: 8, marginBottom: 8 }}>
              <Input
                placeholder="Тайлбар"
                value={line.description}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], description: e.target.value };
                  setLines(next);
                }}
              />
              <InputNumber
                min={0}
                value={line.qty}
                onChange={(v) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], qty: Number(v) || 0 };
                  setLines(next);
                }}
              />
              <InputNumber
                money
                min={0}
                value={line.unit_price}
                onChange={(v) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], unit_price: Number(v) || 0 };
                  setLines(next);
                }}
              />
              <InputNumber
                min={0}
                value={line.vat_rate}
                onChange={(v) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], vat_rate: Number(v) || 0 };
                  setLines(next);
                }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={lines.length <= 1}
                onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
              />
            </div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Баганууд: тайлбар · тоо · нэгж үнэ · НӨАТ %</p>
        </div>
      </Drawer>
    </div>
  );
}
