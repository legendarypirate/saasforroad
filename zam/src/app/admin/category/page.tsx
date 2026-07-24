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
import { REmpty } from '@/components/r';
import { Tags } from 'lucide-react';
import { inventoryApi } from '@/lib/inventory';

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
    try {
      const values = await form.validateFields();
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
      if (e && typeof e === 'object' && 'errorFields' in e) return;
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
      <AdminListToolbar
        description="Барааны ангилал (олон түвшинтэй)"
        onReload={load}
        onCreate={openCreate}
        createLabel="Ангилал нэмэх"
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
          { title: 'Эцэг ангилал', dataIndex: 'parent_id', render: (v) => parentName(v) },
        ]}
        empty={
          <REmpty
            iconType={Tags}
            title="Ангилал олдсонгүй"
            description="Одоогоор бүртгэгдсэн ангилал байхгүй байна."
          />
        }
      />

      <Drawer
        title={editing ? 'Ангилал засах' : 'Ангилал нэмэх'}
        description="Ангиллын нэр болон эцэг ангиллыг сонгоно уу."
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
