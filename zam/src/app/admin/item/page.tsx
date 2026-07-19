'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, Drawer, Form, Input, InputNumber, Popconfirm, Select, Space, Switch,
  Table, Tag, Typography, message,
} from '@/components/admin/primitives';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@/components/admin/icons';
import { UNITS, formatMoney, inventoryApi } from '@/lib/inventory';

const { Text } = Typography;

export default function MaterialPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [materials, cats, wh, sup] = await Promise.all([
        inventoryApi.materials.list(q ? { q } : undefined),
        inventoryApi.categories.list(),
        inventoryApi.warehouses.list(),
        inventoryApi.suppliers.list(),
      ]);
      setRows(materials);
      setCategories(cats);
      setWarehouses(wh);
      setSuppliers(sup);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    document.title = 'Бараа материал';
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      unit: 'ширхэг',
      is_active: true,
      is_consumable: true,
      reorder_level: 0,
      standard_cost: 0,
    });
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    form.setFieldsValue(row);
    setOpen(true);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      if (!editing) {
        delete values.code;
      }
      if (editing) {
        await inventoryApi.materials.update(editing.id, values);
        message.success('Шинэчлэгдлээ');
      } else {
        await inventoryApi.materials.create(values);
        message.success('Нэмэгдлээ');
      }
      setOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const remove = async (id: number) => {
    try {
      await inventoryApi.materials.remove(id);
      message.success('Устгагдлаа');
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Text type="secondary">Материалын мастер бүртгэл (асфальт, хайрга, цемент, түлш...)</Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Нэр, код, barcode..."
            style={{ width: 240 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={load}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Бараа нэмэх
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        scroll={{ x: 1100 }}
        columns={[
          { title: 'Код', dataIndex: 'code', width: 110 },
          { title: 'Нэр', dataIndex: 'name', width: 180 },
          {
            title: 'Ангилал',
            dataIndex: ['category', 'name'],
            width: 120,
            render: (v) => v || '—',
          },
          { title: 'Нэгж', dataIndex: 'unit', width: 80 },
          { title: 'Бренд', dataIndex: 'brand', width: 100, render: (v) => v || '—' },
          {
            title: 'Дахин захиалга',
            dataIndex: 'reorder_level',
            width: 110,
            align: 'right',
          },
          {
            title: 'Стандарт үнэ',
            dataIndex: 'standard_cost',
            width: 120,
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            title: 'Төлөв',
            dataIndex: 'is_active',
            width: 90,
            render: (v) => (v !== false ? <Tag color="green">Идэвхтэй</Tag> : <Tag>Идэвхгүй</Tag>),
          },
          {
            title: 'Үйлдэл',
            width: 100,
            fixed: 'right',
            render: (_, r) => (
              <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title={editing ? 'Бараа засах' : 'Бараа нэмэх'}
        open={open}
        onClose={() => setOpen(false)}
        width={520}
        extra={<Button type="primary" onClick={save}>Хадгалах</Button>}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="name" label="Нэр" rules={[{ required: true }]} style={{ gridColumn: '1 / -1' }}>
              <Input placeholder="Жишээ: Битум 60/70, Цемент М400" />
            </Form.Item>
            {editing ? (
              <Form.Item name="code" label="Код">
                <Input />
              </Form.Item>
            ) : (
              <Form.Item label="Код">
                <Text type="secondary">Авто үүснэ</Text>
              </Form.Item>
            )}
            <Form.Item name="barcode" label="Barcode">
              <Input />
            </Form.Item>
            <Form.Item name="category_id" label="Ангилал">
              <Select
                allowClear
                options={categories.map((c: any) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
            <Form.Item name="unit" label="Нэгж" rules={[{ required: true }]}>
              <Select options={UNITS.map((u) => ({ value: u, label: u }))} />
            </Form.Item>
            <Form.Item name="brand" label="Бренд">
              <Input />
            </Form.Item>
            <Form.Item name="specification" label="Спецификаци">
              <Input />
            </Form.Item>
            <Form.Item name="reorder_level" label="Дахин захиалгын түвшин">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="min_stock" label="Доод үлдэгдэл">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="max_stock" label="Дээд үлдэгдэл">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="standard_cost" label="Стандарт үнэ">
              <InputNumber money style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="default_warehouse_id" label="Үндсэн агуулах">
              <Select
                allowClear
                options={warehouses.map((w: any) => ({ value: w.id, label: w.name }))}
              />
            </Form.Item>
            <Form.Item name="default_supplier_id" label="Үндсэн нийлүүлэгч">
              <Select
                allowClear
                options={suppliers.map((s: any) => ({ value: s.id, label: s.name }))}
              />
            </Form.Item>
            <Form.Item name="description" label="Тайлбар" style={{ gridColumn: '1 / -1' }}>
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="is_consumable" label="Хэрэглээний" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
