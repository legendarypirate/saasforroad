'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, Drawer, Form, Input, InputNumber, Popconfirm, Space, Switch, Table, Tag, Typography, message,
} from '@/components/admin/primitives';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@/components/admin/icons';
import { inventoryApi } from '@/lib/inventory';

const { Text } = Typography;

interface Warehouse {
  id: number;
  code?: string;
  name: string;
  location?: string;
  description?: string;
  capacity?: number;
  status?: string;
  is_active?: boolean;
}

export default function WarehousePage() {
  const [rows, setRows] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await inventoryApi.warehouses.list());
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Агуулах';
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, status: 'active' });
    setOpen(true);
  };

  const openEdit = (row: Warehouse) => {
    setEditing(row);
    form.setFieldsValue(row);
    setOpen(true);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await inventoryApi.warehouses.update(editing.id, values);
        message.success('Шинэчлэгдлээ');
      } else {
        await inventoryApi.warehouses.create(values);
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
      await inventoryApi.warehouses.remove(id);
      message.success('Устгагдлаа');
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Text type="secondary">Төв болон талбайн агуулахууд</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Агуулах нэмэх
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: 'Код', dataIndex: 'code', width: 100, render: (v) => v || '—' },
          { title: 'Нэр', dataIndex: 'name' },
          { title: 'Байршил', dataIndex: 'location', render: (v) => v || '—' },
          { title: 'Тайлбар', dataIndex: 'description', ellipsis: true, render: (v) => v || '—' },
          {
            title: 'Төлөв',
            dataIndex: 'is_active',
            width: 100,
            render: (v) => (v !== false ? <Tag color="green">Идэвхтэй</Tag> : <Tag>Идэвхгүй</Tag>),
          },
          {
            title: 'Үйлдэл',
            width: 120,
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
        title={editing ? 'Агуулах засах' : 'Агуулах нэмэх'}
        open={open}
        onClose={() => setOpen(false)}
        width={440}
        extra={<Button type="primary" onClick={save}>Хадгалах</Button>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Код">
            <Input placeholder="WH-01" />
          </Form.Item>
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input placeholder="Төв агуулах, Талбайн агуулах..." />
          </Form.Item>
          <Form.Item name="location" label="Байршил">
            <Input placeholder="Хаяг / байршил" />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="capacity" label="Багтаамж">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
