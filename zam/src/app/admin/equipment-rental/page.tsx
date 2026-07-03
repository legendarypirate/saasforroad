'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { EQUIPMENT_API, type EquipmentItem } from '@/lib/equipment';
import { DATE_FORMAT, dateFormItemProps, toDayjs } from '@/lib/userDates';
import {
  RENTAL_API,
  RENTAL_STATUS_COLORS,
  RENTAL_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  formatMnt,
  monthLabel,
  paymentProgress,
  type EquipmentRental,
  type RentalPayment,
  type RentalStats,
  type RentalStatus,
} from '@/lib/equipmentRental';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function EquipmentRentalPage() {
  const [list, setList] = useState<EquipmentRental[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [stats, setStats] = useState<RentalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentRental | null>(null);
  const [form] = Form.useForm();

  const [payDrawerOpen, setPayDrawerOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<{ rental: EquipmentRental; payment: RentalPayment } | null>(null);
  const [payForm] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('q', search.trim());

      const [rentalRes, equipRes, statsRes] = await Promise.all([
        fetch(`${RENTAL_API}?${params}`),
        fetch(EQUIPMENT_API),
        fetch(`${RENTAL_API}/stats`),
      ]);

      const rentalJson = await rentalRes.json();
      const equipJson = await equipRes.json();
      const statsJson = await statsRes.json();

      if (rentalJson.success) setList(rentalJson.data);
      if (equipJson.success) setEquipment(equipJson.data);
      if (statsJson.success) setStats(statsJson.data);
    } catch {
      message.error('Мэдээлэл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    document.title = 'Тоног төхөөрөмж түрээс';
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', monthly_rate: 0, deposit_amount: 0 });
    setDrawerOpen(true);
  };

  const openEdit = (row: EquipmentRental) => {
    setEditing(row);
    form.setFieldsValue({
      ...row,
      contract_period: [toDayjs(row.start_date), toDayjs(row.end_date)],
    });
    setDrawerOpen(true);
  };

  const saveRental = async () => {
    const values = await form.validateFields();
    const [start, end] = values.contract_period || [];
    const payload = {
      contract_number: values.contract_number,
      equipment_id: values.equipment_id,
      client_company: values.client_company,
      client_register: values.client_register,
      client_director: values.client_director,
      client_phone: values.client_phone,
      client_email: values.client_email,
      start_date: start.format(DATE_FORMAT),
      end_date: end.format(DATE_FORMAT),
      monthly_rate: values.monthly_rate,
      deposit_amount: values.deposit_amount,
      motor_hours_start: values.motor_hours_start,
      delivery_location: values.delivery_location,
      status: values.status,
      notes: values.notes,
    };

    const url = editing ? `${RENTAL_API}/${editing.id}` : RENTAL_API;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) {
      message.error(json.message || 'Хадгалахад алдаа');
      return;
    }
    message.success(editing ? 'Гэрээ шинэчлэгдлээ' : 'Түрээсийн гэрээ үүслээ');
    setDrawerOpen(false);
    fetchAll();
  };

  const deleteRental = async (id: number) => {
    const res = await fetch(`${RENTAL_API}/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      message.success('Устгагдлаа');
      fetchAll();
    } else {
      message.error(json.message || 'Алдаа');
    }
  };

  const completeRental = async (id: number) => {
    const res = await fetch(`${RENTAL_API}/${id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (json.success) {
      message.success('Түрээс дууссан төлөвт шилжлээ');
      fetchAll();
    } else {
      message.error(json.message || 'Алдаа');
    }
  };

  const openPayment = (rental: EquipmentRental, payment: RentalPayment) => {
    setPayTarget({ rental, payment });
    payForm.setFieldsValue({
      amount_paid: Number(payment.amount_due),
      paid_date: dayjs(),
      invoice_number: payment.invoice_number,
      notes: payment.notes,
    });
    setPayDrawerOpen(true);
  };

  const savePayment = async () => {
    if (!payTarget) return;
    const values = await payForm.validateFields();
    const res = await fetch(
      `${RENTAL_API}/${payTarget.rental.id}/payments/${payTarget.payment.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: values.amount_paid,
          paid_date: dayjs.isDayjs(values.paid_date)
            ? values.paid_date.format(DATE_FORMAT)
            : values.paid_date,
          invoice_number: values.invoice_number,
          notes: values.notes,
        }),
      }
    );
    const json = await res.json();
    if (!json.success) {
      message.error(json.message || 'Алдаа');
      return;
    }
    message.success('Төлбөр бүртгэгдлээ');
    setPayDrawerOpen(false);
    fetchAll();
  };

  const paymentColumns: ColumnsType<RentalPayment> = [
    {
      title: 'Сар',
      key: 'period',
      render: (_, r) => monthLabel(r.period_year, r.period_month),
    },
    {
      title: 'Хугацаа',
      key: 'range',
      render: (_, r) => `${r.period_start} — ${r.period_end}`,
    },
    {
      title: 'Төлөх дүн',
      dataIndex: 'amount_due',
      render: (v) => formatMnt(v),
    },
    {
      title: 'Төлсөн',
      dataIndex: 'amount_paid',
      render: (v) => formatMnt(v),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (v: keyof typeof PAYMENT_STATUS_LABELS) => (
        <Tag color={PAYMENT_STATUS_COLORS[v]}>{PAYMENT_STATUS_LABELS[v] || v}</Tag>
      ),
    },
    {
      title: 'Үйлдэл',
      key: 'action',
      render: () => null,
    },
  ];

  const columns: ColumnsType<EquipmentRental> = [
    {
      title: 'Гэрээ №',
      dataIndex: 'contract_number',
      width: 140,
    },
    {
      title: 'Тоног төхөөрөмж',
      key: 'equipment',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.equipment?.name || '—'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.equipment?.registration_number || r.equipment?.model || ''}
          </Text>
        </div>
      ),
    },
    {
      title: 'Түрээслэгч',
      dataIndex: 'client_company',
      render: (v, r) => (
        <div>
          <div>{v}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.client_phone || r.client_register || ''}
          </Text>
        </div>
      ),
    },
    {
      title: 'Хугацаа',
      key: 'period',
      render: (_, r) => `${r.start_date} — ${r.end_date}`,
    },
    {
      title: 'Сарын түрээс',
      dataIndex: 'monthly_rate',
      render: (v) => formatMnt(v),
    },
    {
      title: 'Төлбөрийн явц',
      key: 'progress',
      render: (_, r) => {
        const { paid, due, percent } = paymentProgress(r.payments);
        return (
          <div>
            <div>{formatMnt(paid)} / {formatMnt(due)}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{percent}%</Text>
          </div>
        );
      },
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 110,
      render: (v: RentalStatus) => (
        <Tag color={RENTAL_STATUS_COLORS[v]}>{RENTAL_STATUS_LABELS[v]}</Tag>
      ),
    },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          {record.status === 'active' && (
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              title="Дуусгах"
              onClick={() => completeRental(record.id)}
            />
          )}
          <Popconfirm title="Устгах уу?" onConfirm={() => deleteRental(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Тоног төхөөрөмж түрээс</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>Шинэчлэх</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Шинэ түрээс
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic title="Идэвхтэй түрээс" value={stats?.activeRentals ?? 0} suffix="гэрээ" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic title="Сарын түрээсийн орлого" value={formatMnt(stats?.monthlyRevenue)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic title="Энэ сар төлсөн" value={formatMnt(stats?.paidThisMonth)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Хугацаа хэтэрсэн"
              value={formatMnt(stats?.overdueAmount)}
              valueStyle={{ color: stats?.overdueAmount ? '#cf1322' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Гэрээ №, компани, регистр..."
            allowClear
            style={{ width: 280 }}
            onSearch={setSearch}
          />
          <Select
            allowClear
            placeholder="Төлөв"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(RENTAL_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={list}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={record.payments || []}
                columns={paymentColumns.map((col) =>
                  col.key === 'action'
                    ? {
                        ...col,
                        render: (_: unknown, payment: RentalPayment) =>
                          payment.status !== 'paid' ? (
                            <Button size="small" type="link" onClick={() => openPayment(record, payment)}>
                              Төлбөр бүртгэх
                            </Button>
                          ) : (
                            <Text type="secondary">—</Text>
                          ),
                      }
                    : col
                )}
              />
            ),
            rowExpandable: (record) => (record.payments?.length ?? 0) > 0,
          }}
        />
      </Card>

      <Drawer
        title={editing ? 'Түрээсийн гэрээ засах' : 'Шинэ түрээсийн гэрээ'}
        width={560}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Цуцлах</Button>
            <Button type="primary" onClick={saveRental}>Хадгалах</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="contract_number" label="Гэрээний дугаар">
            <Input placeholder="Автоматаар үүснэ" />
          </Form.Item>
          <Form.Item name="equipment_id" label="Тоног төхөөрөмж" rules={[{ required: true, message: 'Сонгоно уу' }]}>
            <Select
              showSearch
              placeholder="Экскаватор, кран..."
              optionFilterProp="label"
              options={equipment.map((e) => ({
                value: e.id,
                label: `${e.name}${e.registration_number ? ` (${e.registration_number})` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="client_company" label="Түрээслэгч компани" rules={[{ required: true, message: 'Заавал' }]}>
            <Input placeholder="Жижиг замын компанийн нэр" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="client_register" label="Регистрийн дугаар">
              <Input />
            </Form.Item>
            <Form.Item name="client_director" label="Захирал">
              <Input />
            </Form.Item>
            <Form.Item name="client_phone" label="Утас">
              <Input />
            </Form.Item>
            <Form.Item name="client_email" label="И-мэйл">
              <Input />
            </Form.Item>
          </div>
          <Form.Item
            name="contract_period"
            label="Түрээсийн хугацаа"
            rules={[{ required: true, message: 'Огноо сонгоно уу' }]}
          >
            <RangePicker format={DATE_FORMAT} style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="monthly_rate" label="Сарын түрээс (₮)" rules={[{ required: true, message: 'Заавал' }]}>
              <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="deposit_amount" label="Барьцаа (₮)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="motor_hours_start" label="Мото цаг (эхлэх)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="status" label="Төлөв">
              <Select options={Object.entries(RENTAL_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
          </div>
          <Form.Item name="delivery_location" label="Ажиллах байршил">
            <Input placeholder="Төсөл / замын хэсэг" />
          </Form.Item>
          <Form.Item name="notes" label="Тэмдэглэл">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Сарын төлбөр бүртгэх"
        width={420}
        open={payDrawerOpen}
        onClose={() => setPayDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setPayDrawerOpen(false)}>Цуцлах</Button>
            <Button type="primary" onClick={savePayment}>Хадгалах</Button>
          </Space>
        }
      >
        {payTarget && (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {payTarget.rental.client_company} · {monthLabel(payTarget.payment.period_year, payTarget.payment.period_month)}
            </Text>
            <Form form={payForm} layout="vertical">
              <Form.Item name="amount_paid" label="Төлсөн дүн (₮)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item name="paid_date" label="Төлсөн огноо" rules={[{ required: true }]} {...dateFormItemProps()}>
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
