'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { ReloadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import { DATE_FORMAT, dateFormItemProps } from '@/lib/userDates';
import {
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  RENTAL_API,
  formatMnt,
  monthLabel,
  type EquipmentRental,
  type PaymentStatus,
  type RentalPayment,
} from '@/lib/equipmentRental';

const { Text } = Typography;

type FlatPayment = RentalPayment & {
  contract_number?: string;
  client_company?: string;
  equipment_name?: string;
  rental: EquipmentRental;
};

export default function RentalPaymentsPage() {
  const [rentals, setRentals] = useState<EquipmentRental[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [payTarget, setPayTarget] = useState<FlatPayment | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(RENTAL_API);
      const json = await res.json();
      if (json.success) setRentals(json.data);
      else message.error(json.message || 'Алдаа');
    } catch {
      message.error('Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Түрээсийн төлбөр';
    load();
  }, [load]);

  const rows = useMemo(() => {
    const flat: FlatPayment[] = [];
    for (const r of rentals) {
      for (const p of r.payments || []) {
        flat.push({
          ...p,
          contract_number: r.contract_number,
          client_company: r.client_company,
          equipment_name: r.equipment?.name,
          rental: r,
        });
      }
    }
    flat.sort((a, b) => {
      if (a.period_year !== b.period_year) return b.period_year - a.period_year;
      return b.period_month - a.period_month;
    });
    return statusFilter ? flat.filter((p) => p.status === statusFilter) : flat;
  }, [rentals, statusFilter]);

  const openPay = (row: FlatPayment) => {
    setPayTarget(row);
    payForm.setFieldsValue({
      amount_paid: Number(row.amount_due) - Number(row.amount_paid || 0),
      paid_date: dayjs(),
      invoice_number: row.invoice_number,
      notes: row.notes,
    });
    setPayOpen(true);
  };

  const savePayment = async () => {
    if (!payTarget) return;
    try {
      const values = await payForm.validateFields();
      const paidTotal = Number(payTarget.amount_paid || 0) + Number(values.amount_paid || 0);
      const res = await fetch(`${RENTAL_API}/${payTarget.rental_id}/payments/${payTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: paidTotal,
          paid_date: dayjs.isDayjs(values.paid_date)
            ? values.paid_date.format(DATE_FORMAT)
            : values.paid_date,
          invoice_number: values.invoice_number,
          notes: values.notes,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        message.error(json.message || 'Алдаа');
        return;
      }
      message.success('Төлбөр бүртгэгдлээ');
      setPayOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<FlatPayment> = [
    { title: 'Гэрээ', dataIndex: 'contract_number', width: 120 },
    { title: 'Компани', dataIndex: 'client_company' },
    { title: 'Хөрөнгө', dataIndex: 'equipment_name', render: (v) => v || '—' },
    {
      title: 'Сар',
      key: 'period',
      width: 140,
      render: (_, r) => monthLabel(r.period_year, r.period_month),
    },
    {
      title: 'Хугацаа',
      key: 'range',
      width: 200,
      render: (_, r) => `${r.period_start} — ${r.period_end}`,
    },
    {
      title: 'Тооцоо',
      dataIndex: 'notes',
      width: 160,
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v || '—'}</Text>,
    },
    {
      title: 'Төлөх',
      dataIndex: 'amount_due',
      align: 'right',
      render: (v) => formatMnt(v),
    },
    {
      title: 'Төлсөн',
      dataIndex: 'amount_paid',
      align: 'right',
      render: (v) => formatMnt(v),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 120,
      render: (v: PaymentStatus) => (
        <Tag color={PAYMENT_STATUS_COLORS[v]}>{PAYMENT_STATUS_LABELS[v]}</Tag>
      ),
    },
    {
      title: 'Үйлдэл',
      width: 120,
      render: (_, r) =>
        r.status !== 'paid' ? (
          <Button size="small" type="link" onClick={() => openPay(r)}>
            Төлбөр
          </Button>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Text type="secondary">Сарын хуваарь — өдрийн үнэ × хоногоор бодогдсон</Text>
        </div>
        <Space wrap>
          <Select
            allowClear
            placeholder="Төлөв"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Button icon={<ReloadOutlined />} onClick={load}>Шинэчлэх</Button>
        </Space>
      </div>

      <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} scroll={{ x: 1100 }} />

      <Drawer
        title="Төлбөр бүртгэх"
        open={payOpen}
        onClose={() => setPayOpen(false)}
        width={420}
        extra={<Button type="primary" onClick={savePayment}>Хадгалах</Button>}
      >
        {payTarget && (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              {payTarget.client_company} · {monthLabel(payTarget.period_year, payTarget.period_month)}
              <br />
              Үлдэгдэл: {formatMnt(Number(payTarget.amount_due) - Number(payTarget.amount_paid || 0))}
            </Text>
            <Form form={payForm} layout="vertical">
              <Form.Item name="amount_paid" label="Төлөх дүн (₮)" rules={[{ required: true }]}>
                <InputNumber money style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item name="paid_date" label="Огноо" rules={[{ required: true }]} {...dateFormItemProps()}>
                <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="invoice_number" label="Нэхэмжлэх №">
                <Input />
              </Form.Item>
              <Form.Item name="notes" label="Тэмдэглэл">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Form>
          </>
        )}
      </Drawer>
    </div>
  );
}
