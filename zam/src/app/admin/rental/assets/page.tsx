'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import { EQUIPMENT_API, type EquipmentItem } from '@/lib/equipment';
import {
  ASSET_CATEGORY_LABELS,
  ASSET_STATUS_LABELS,
  formatMnt,
  monthlyFromDaily,
  type AssetCategory,
} from '@/lib/equipmentRental';

const { Title, Text } = Typography;

const UNITS = ['ширхэг', 'тн', 'кг', 'м', 'м²', 'м³', 'багц', 'өдөр'];

export default function RentalAssetsPage() {
  const [rows, setRows] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [form] = Form.useForm();
  const watchDaily = Form.useWatch('default_daily_rate', form);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`${EQUIPMENT_API}?${params}`);
      const json = await res.json();
      if (json.success) setRows(json.data);
      else message.error(json.message || 'Алдаа');
    } catch {
      message.error('Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [category, q]);

  useEffect(() => {
    document.title = 'Тоног бүртгэл | Түрээс';
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      category: 'machine',
      unit: 'ширхэг',
      is_rentable: true,
      status: 'available',
      default_daily_rate: 0,
      motor_hours: 0,
    });
    setOpen(true);
  };

  const openEdit = (row: EquipmentItem) => {
    setEditing(row);
    form.setFieldsValue(row);
    setOpen(true);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      const url = editing ? `${EQUIPMENT_API}/${editing.id}` : EQUIPMENT_API;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) {
        message.error(json.message || 'Алдаа');
        return;
      }
      message.success(editing ? 'Шинэчлэгдлээ' : 'Бүртгэгдлээ');
      setOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const remove = async (id: number) => {
    const res = await fetch(`${EQUIPMENT_API}/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      message.success('Устгагдлаа');
      load();
    } else message.error(json.message || 'Алдаа');
  };

  const columns: ColumnsType<EquipmentItem> = [
    {
      title: 'Нэр',
      dataIndex: 'name',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {[r.model, r.registration_number].filter(Boolean).join(' · ') || '—'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ангилал',
      dataIndex: 'category',
      width: 150,
      render: (v: AssetCategory) => ASSET_CATEGORY_LABELS[v] || v || 'Машин',
    },
    { title: 'Нэгж', dataIndex: 'unit', width: 90, render: (v) => v || 'ширхэг' },
    {
      title: 'Өдрийн үнэ',
      dataIndex: 'default_daily_rate',
      width: 130,
      align: 'right',
      render: (v) => formatMnt(v),
    },
    {
      title: 'Сарын (~×30)',
      key: 'monthly',
      width: 130,
      align: 'right',
      render: (_, r) => formatMnt(monthlyFromDaily(r.default_daily_rate)),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 110,
      render: (v) => <Tag>{ASSET_STATUS_LABELS[v] || v || 'Чөлөөтэй'}</Tag>,
    },
    {
      title: 'Үйлдэл',
      width: 100,
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Тоног / хэрэгслийн бүртгэл</Title>
          <Text type="secondary">
            Замын машин тоног, барилгын шон, хүрз, арматур зэргийг энд бүртгэнэ
          </Text>
        </div>
        <Space wrap>
          <Select
            allowClear
            placeholder="Ангилал"
            style={{ width: 180 }}
            value={category}
            onChange={setCategory}
            options={Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Input
            allowClear
            placeholder="Хайх..."
            style={{ width: 180 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={load}
          />
          <Button icon={<ReloadOutlined />} onClick={load} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Нэмэх
          </Button>
        </Space>
      </div>

      <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} scroll={{ x: 900 }} />

      <Drawer
        title={editing ? 'Засах' : 'Шинэ бүртгэл'}
        open={open}
        onClose={() => setOpen(false)}
        width={480}
        extra={<Button type="primary" onClick={save}>Хадгалах</Button>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input placeholder="Жишээ: Экскаватор CAT 320 / Арматур Ø12 / Хүрз" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Form.Item name="category" label="Ангилал" rules={[{ required: true }]}>
              <Select
                options={Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="unit" label="Нэгж">
              <Select options={UNITS.map((u) => ({ value: u, label: u }))} />
            </Form.Item>
            <Form.Item name="model" label="Загвар / марк">
              <Input />
            </Form.Item>
            <Form.Item name="registration_number" label="Улсын дугаар / код">
              <Input />
            </Form.Item>
            <Form.Item
              name="default_daily_rate"
              label="Өдрийн түрээсийн үнэ (₮)"
              rules={[{ required: true }]}
              extra={`Сарын ойролцоо: ${formatMnt(monthlyFromDaily(watchDaily))} (×30)`}
            >
              <InputNumber style={{ width: '100%' }} min={0} step={1000} />
            </Form.Item>
            <Form.Item name="status" label="Төлөв">
              <Select
                options={Object.entries(ASSET_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="motor_hours" label="Мото цаг">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="is_rentable" label="Түрээслэх боломжтой" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Тэмдэглэл">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
