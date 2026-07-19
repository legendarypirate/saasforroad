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
  isFormValidationError,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import {
  createUniformRecord,
  deleteUniformRecord,
  fetchUniformList,
  updateUniformRecord,
} from '@/lib/uniform';

export type UniformFieldDef = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date';
  options?: Array<{ value: string | number; label: string }>;
  required?: boolean;
};

type Props = {
  title: string;
  resource: string;
  fields: UniformFieldDef[];
  columns: ColumnsType<Record<string, unknown>>;
  query?: Record<string, string>;
  defaults?: Record<string, unknown>;
  beforeSave?: (body: Record<string, unknown>) => Record<string, unknown>;
};

export default function UniformEntityPage({
  title,
  resource,
  fields,
  columns,
  query,
  defaults,
  beforeSave,
}: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUniformList<Record<string, unknown>>(resource, query);
      setRows(data);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [resource, query]);

  useEffect(() => {
    document.title = title;
    load();
  }, [title, load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    if (defaults) form.setFieldsValue(defaults);
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
      let body: Record<string, unknown> = {};
      fields.forEach((f) => {
        let v = values[f.key];
        if (f.type === 'date' && v) v = dayjs(v).format('YYYY-MM-DD');
        if (f.type === 'number' && v !== undefined && v !== null && v !== '') v = Number(v);
        body[f.key] = v;
      });

      const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const user = userRaw ? JSON.parse(userRaw) : null;
      body.created_by = user?.id;
      body.updated_by = user?.id;
      if (beforeSave) body = beforeSave(body);

      if (editing) await updateUniformRecord(resource, Number(editing.id), body);
      else await createUniformRecord(resource, body);

      message.success(editing ? 'Шинэчлэгдлээ' : 'Нэмэгдлээ');
      setOpen(false);
      load();
    } catch (e) {
      if (isFormValidationError(e) || (e && typeof e === 'object' && 'errorFields' in e)) return;
      message.error(e instanceof Error ? e.message : 'Алдаа гарлаа');
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Устгах уу?',
      onOk: async () => {
        try {
          await deleteUniformRecord(resource, id);
          message.success('Устгагдлаа');
          load();
        } catch (e) {
          message.error(e instanceof Error ? e.message : 'Алдаа');
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
      <Space style={{ marginBottom: 12 }} wrap>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Нэмэх
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[...columns, ...actionCol]}
        pagination={{ pageSize: 15 }}
        scroll={{ x: 900 }}
      />

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
            <Form.Item
              key={f.key}
              name={f.key}
              label={f.label}
              rules={f.required ? [{ required: true }] : undefined}
            >
              {f.type === 'textarea' ? (
                <Input.TextArea rows={3} />
              ) : f.type === 'select' ? (
                <Select options={f.options} allowClear showSearch optionFilterProp="label" />
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
