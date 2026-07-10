'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, Drawer, Form, Input, Popconfirm, Select, Space, Table, Typography, message,
} from '@/components/admin/primitives';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@/components/admin/icons';
import { inventoryApi } from '@/lib/inventory';

const { Title, Text } = Typography;

export default function SupplierPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await inventoryApi.suppliers.list(q ? { q } : undefined));
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    document.title = 'Нийлүүлэгч';
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    form.setFieldsValue({
      ...row,
      productTypes: row.productTypes || [],
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await inventoryApi.suppliers.update(editing.id, values);
        message.success('Шинэчлэгдлээ');
      } else {
        await inventoryApi.suppliers.create(values);
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
      await inventoryApi.suppliers.remove(id);
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
          <Title level={4} style={{ margin: 0 }}>Нийлүүлэгч</Title>
          <Text type="secondary">Материал нийлүүлэгчид</Text>
        </div>
        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Хайх..."
            style={{ width: 200 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={load}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Нийлүүлэгч нэмэх
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: 'Нэр', dataIndex: 'name' },
          { title: 'Утас', dataIndex: 'phone', render: (v) => v || '—' },
          { title: 'И-мэйл', dataIndex: 'email', render: (v) => v || '—' },
          { title: 'Регистр', dataIndex: 'register', render: (v) => v || '—' },
          {
            title: 'Бүтээгдэхүүн',
            dataIndex: 'productTypes',
            render: (v) => (Array.isArray(v) ? v.join(', ') : v || '—'),
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
        title={editing ? 'Нийлүүлэгч засах' : 'Нийлүүлэгч нэмэх'}
        open={open}
        onClose={() => setOpen(false)}
        width={440}
        extra={<Button type="primary" onClick={save}>Хадгалах</Button>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Утас">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="И-мэйл">
            <Input />
          </Form.Item>
          <Form.Item name="register" label="Регистр">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Хаяг">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="productTypes" label="Бүтээгдэхүүний төрөл">
            <Select mode="tags" placeholder="Асфальт, Цемент..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
