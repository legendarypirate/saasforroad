'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Table,
  message,
} from '@/components/admin/primitives';
import { AdminCrudActions } from '@/components/admin/AdminCrudActions';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { inventoryApi } from '@/lib/inventory';

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
      <AdminListToolbar
        description="Материал нийлүүлэгчид"
        showSearch
        searchValue={q}
        onSearchChange={setQ}
        onSearch={() => load()}
        searchPlaceholder="Хайх..."
        onReload={load}
        onCreate={openCreate}
        createLabel="Нийлүүлэгч нэмэх"
      />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 30, showSizeChanger: true }}
        columns={[
          { title: '№', key: 'index', width: 56, render: (_v, _r, i) => i + 1 },
          {
            title: 'Үйлдэл',
            width: 100,
            render: (_, r) => (
              <AdminCrudActions
                onEdit={() => openEdit(r)}
                onDelete={() => remove(r.id)}
              />
            ),
          },
          { title: 'Нэр', dataIndex: 'name' },
          { title: 'Утас', dataIndex: 'phone', render: (v) => v || '—' },
          { title: 'И-мэйл', dataIndex: 'email', render: (v) => v || '—' },
          { title: 'Регистр', dataIndex: 'register', render: (v) => v || '—' },
          {
            title: 'Бүтээгдэхүүн',
            dataIndex: 'productTypes',
            render: (v) => (Array.isArray(v) ? v.join(', ') : v || '—'),
          },
        ]}
      />

      <Drawer
        title={editing ? 'Нийлүүлэгч засах' : 'Нийлүүлэгч нэмэх'}
        description="Нийлүүлэгчийн мэдээллийг бөглөнө үү."
        open={open}
        onClose={() => setOpen(false)}
        width={560}
        destroyOnClose
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Болих</Button>
            <Button type="primary" onClick={save}>
              Хадгалах
            </Button>
          </>
        }
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="name" label="Нэр" rules={[{ required: true }]} className="sm:col-span-2">
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
            <Form.Item name="address" label="Хаяг" className="sm:col-span-2">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name="productTypes" label="Бүтээгдэхүүний төрөл" className="sm:col-span-2">
              <Select mode="tags" placeholder="Асфальт, Цемент..." />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
