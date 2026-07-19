'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Drawer,
  Select,
  Space,
  Table,
  Tag,
  message,
  DatePicker,
  Modal,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import {
  createHseRecord,
  deleteHseRecord,
  fetchHseList,
  updateHseRecord,
} from '@/lib/hse';

type FieldDef = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
};

type Props = {
  title: string;
  resource: string;
  fields: FieldDef[];
  columns: ColumnsType<Record<string, unknown>>;
};

export default function HseEntityPage({ title, resource, fields, columns }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchHseList<Record<string, unknown>>(resource);
    setRows(data);
    setLoading(false);
  }, [resource]);

  useEffect(() => {
    document.title = title;
    load();
  }, [title, load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    const values: Record<string, unknown> = {};
    fields.forEach((f) => {
      const v = row[f.key];
      values[f.key] = f.type === 'date' && v ? dayjs(String(v)) : v;
    });
    form.setFieldsValue(values);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const body: Record<string, unknown> = {};
      fields.forEach((f) => {
        let v = values[f.key];
        if (f.type === 'date' && v) v = dayjs(v).format('YYYY-MM-DD');
        body[f.key] = v;
      });

      const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userRaw ? JSON.parse(userRaw) : null;
      body.created_by = user?.id;
      body.updated_by = user?.id;

      const ok = editing
        ? await updateHseRecord(resource, Number(editing.id), body)
        : await createHseRecord(resource, body);

      if (ok) {
        message.success(editing ? 'Шинэчлэгдлээ' : 'Нэмэгдлээ');
        setOpen(false);
        load();
      } else {
        message.error('Алдаа гарлаа');
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа гарлаа');
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Устгах уу?',
      onOk: async () => {
        if (await deleteHseRecord(resource, id)) {
          message.success('Устгагдлаа');
          load();
        }
      },
    });
  };

  const actionCol: ColumnsType<Record<string, unknown>> = [
    {
      title: 'Үйлдэл',
      key: 'actions',
      render: (_, row) => (
        <Space>
          <Button type="link" onClick={() => openEdit(row)}>
            Засах
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(Number(row.id))} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Нэмэх
        </Button>
      </Space>

      <Table rowKey="id" loading={loading} dataSource={rows} columns={[...columns, ...actionCol]} pagination={{ pageSize: 15 }} />

      <Drawer
        title={editing ? 'Засах' : 'Шинэ бүртгэл'}
        open={open}
        onClose={() => setOpen(false)}
        width={520}
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
          {fields.map((f) => (
            <Form.Item key={f.key} name={f.key} label={f.label} rules={f.required ? [{ required: true }] : undefined}>
              {f.type === 'textarea' ? (
                <Input.TextArea rows={4} />
              ) : f.type === 'select' ? (
                <Select options={f.options} allowClear />
              ) : f.type === 'date' ? (
                <DatePicker style={{ width: '100%' }} />
              ) : f.type === 'number' ? (
                <Input type="number" />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
        </Form>
      </Drawer>
    </div>
  );
}

export { Tag };
