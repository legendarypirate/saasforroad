'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  createFuelRecord,
  deleteFuelRecord,
  downloadCsv,
  fetchFuelList,
  printTable,
  updateFuelRecord,
} from '@/lib/fuel';

export type FuelFieldDef = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date';
  options?: Array<{ value: string | number; label: string }>;
  required?: boolean;
  hidden?: boolean;
};

type Props = {
  title: string;
  resource: string;
  fields: FuelFieldDef[];
  columns: ColumnsType<Record<string, unknown>>;
  query?: Record<string, string>;
  defaults?: Record<string, unknown>;
  beforeSave?: (body: Record<string, unknown>) => Record<string, unknown>;
  searchPlaceholder?: string;
  filterFields?: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
  exportFilename?: string;
  mapExportRow?: (row: Record<string, unknown>) => Record<string, unknown>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  drawerWidth?: number;
};

export default function FuelEntityPage({
  title,
  resource,
  fields,
  columns,
  query,
  defaults,
  beforeSave,
  searchPlaceholder = 'Хайх…',
  filterFields,
  exportFilename,
  mapExportRow,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  drawerWidth = 520,
}: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFuelList<Record<string, unknown>>(resource, {
        ...query,
        ...filters,
        q: q || undefined,
      });
      setRows(data);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [resource, query, filters, q]);

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

      if (editing) await updateFuelRecord(resource, Number(editing.id), body);
      else await createFuelRecord(resource, body);

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
          await deleteFuelRecord(resource, id);
          message.success('Устгагдлаа');
          load();
        } catch (e) {
          message.error(e instanceof Error ? e.message : 'Алдаа');
        }
      },
    });
  };

  const handleExport = () => {
    const mapped = rows.map((r) => (mapExportRow ? mapExportRow(r) : r));
    downloadCsv(exportFilename || `${resource}.csv`, mapped);
  };

  const actionCol: ColumnsType<Record<string, unknown>> = useMemo(
    () => [
      {
        title: 'Үйлдэл',
        key: 'actions',
        fixed: 'right' as const,
        width: 120,
        render: (_, row) => (
          <Space>
            {canEdit ? (
              <Button type="link" onClick={() => openEdit(row)}>
                Засах
              </Button>
            ) : null}
            {canDelete ? (
              <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(Number(row.id))} />
            ) : null}
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, canDelete],
  );

  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search
          allowClear
          placeholder={searchPlaceholder}
          style={{ width: 220 }}
          onSearch={(v) => setQ(v)}
        />
        {filterFields?.map((f) => (
          <Select
            key={f.key}
            allowClear
            placeholder={f.label}
            style={{ minWidth: 140 }}
            options={f.options}
            value={filters[f.key] || undefined}
            onChange={(v) =>
              setFilters((prev) => {
                const next = { ...prev };
                if (v == null || v === '') delete next[f.key];
                else next[f.key] = String(v);
                return next;
              })
            }
          />
        ))}
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button onClick={handleExport}>CSV</Button>
        <Button onClick={() => printTable(title)}>Хэвлэх</Button>
        {canCreate ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Нэмэх
          </Button>
        ) : null}
      </Space>

      <div id="fuel-print-area">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={canEdit || canDelete ? [...columns, ...actionCol] : columns}
          pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: [15, 30, 50] }}
          scroll={{ x: 900 }}
        />
      </div>

      <Drawer
        title={editing ? 'Засах' : 'Шинэ бүртгэл'}
        open={open}
        onClose={() => setOpen(false)}
        width={drawerWidth}
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
          {fields
            .filter((f) => !f.hidden)
            .map((f) => (
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
                  <Input type="number" step="any" />
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
