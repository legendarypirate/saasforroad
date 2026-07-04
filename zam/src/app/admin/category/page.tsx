'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, Drawer, Form, Input, Popconfirm, Select, Space, Table, Typography, message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { inventoryApi } from '@/lib/inventory';

const { Title, Text } = Typography;

interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
}

export default function CategoryPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await inventoryApi.categories.list());
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Ангилал';
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (row: Category) => {
    setEditing(row);
    form.setFieldsValue(row);
    setOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await inventoryApi.categories.update(editing.id, values);
        message.success('Шинэчлэгдлээ');
      } else {
        await inventoryApi.categories.create(values);
        message.success('Нэмэгдлээ');
      }
      setOpen(false);
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const remove = async (id: number) => {
    try {
      await inventoryApi.categories.remove(id);
      message.success('Устгагдлаа');
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const parentName = (id?: number | null) =>
    rows.find((r) => r.id === id)?.name || '—';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Ангилал</Title>
          <Text type="secondary">Барааны ангилал (олон түвшинтэй)</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Ангилал нэмэх
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: 'Нэр', dataIndex: 'name' },
          { title: 'Эцэг ангилал', dataIndex: 'parent_id', render: (v) => parentName(v) },
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
        title={editing ? 'Ангилал засах' : 'Ангилал нэмэх'}
        open={open}
        onClose={() => setOpen(false)}
        width={420}
        extra={<Button type="primary" onClick={save}>Хадгалах</Button>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input placeholder="Жишээ: Асфальт, Цемент, Түлш" />
          </Form.Item>
          <Form.Item name="parent_id" label="Эцэг ангилал">
            <Select
              allowClear
              placeholder="Үндсэн ангилал"
              options={rows
                .filter((r) => r.id !== editing?.id)
                .map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
