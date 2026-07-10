'use client';

import { useMemo, useState } from 'react';
import { Button, Drawer, Form, Input, Popconfirm, Space, Table } from '@/components/admin/primitives';
import type { FormRule as Rule } from '@/components/admin/primitives/form-store';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@/components/admin/icons';
import ImageUploadField from '@/components/admin/ImageUploadField';
import RichTextEditor from '@/components/RichTextEditor';
import { isEmptyRichText, stripHtml } from '@/lib/richText';
import { resolveImageUrl } from '@/lib/homepage';

export type SectionColumn = {
  key: string;
  title: string;
  width?: number;
  render?: (value: unknown, row: Record<string, unknown>, index: number) => React.ReactNode;
};

export type SectionField = {
  name: string;
  label: string;
  type?: 'input' | 'textarea' | 'richtext' | 'number' | 'image';
  placeholder?: string;
  rules?: Rule[];
};

type SectionDataTableProps = {
  name: string | (string | number)[];
  columns: SectionColumn[];
  fields: SectionField[];
  addLabel: string;
  defaultRow: Record<string, unknown> | string;
  modalTitle?: string;
  scroll?: { x?: number | string };
};

function normalizePath(name: string | (string | number)[]) {
  return Array.isArray(name) ? name : [name];
}

function truncate(value: unknown, max = 72) {
  if (value === null || value === undefined || value === '') return '—';
  const text = stripHtml(String(value));
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function scalarToRow(value: string) {
  return { _scalar: value };
}

function rowToScalar(row: Record<string, unknown>) {
  return String(row._scalar ?? '');
}

function fieldIsRequired(rules?: Rule[]) {
  return rules?.some((rule) => typeof rule === 'object' && rule && 'required' in rule && rule.required) ?? false;
}

export default function SectionDataTable({
  name,
  columns,
  fields,
  addLabel,
  defaultRow,
  modalTitle = 'Мэдээлэл',
  scroll,
}: SectionDataTableProps) {
  const form = Form.useFormInstance();
  const path = normalizePath(name);
  const isScalar = typeof defaultRow === 'string';

  const watched = Form.useWatch(path, form);
  const rows = useMemo(() => {
    const raw = watched ?? [];
    if (!Array.isArray(raw)) return [];
    if (isScalar) return raw.map((item) => scalarToRow(String(item)));
    return raw as Record<string, unknown>[];
  }, [watched, isScalar]);

  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [modalForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const drawerFields = isScalar
    ? [{ name: '_scalar', label: fields[0]?.label ?? 'Утга', type: fields[0]?.type ?? ('textarea' as const), rules: fields[0]?.rules }]
    : fields;

  const hasRichText = drawerFields.some((field) => field.type === 'richtext');

  const tableData = rows.map((row, index) => ({ ...row, _index: index }));

  const openCreate = () => {
    setEditIndex(null);
    modalForm.setFieldsValue(isScalar ? { _scalar: defaultRow } : { ...defaultRow });
    setOpen(true);
  };

  const openEdit = (index: number) => {
    setEditIndex(index);
    modalForm.setFieldsValue(rows[index]);
    setOpen(true);
  };

  const persistRows = (next: Record<string, unknown>[] | string[]) => {
    form.setFieldValue(path, next);
  };

  const handleDelete = (index: number) => {
    if (isScalar) {
      const next = [...(watched as string[])];
      next.splice(index, 1);
      persistRows(next);
      return;
    }
    const next = [...rows];
    next.splice(index, 1);
    persistRows(next);
  };

  const handleDrawerSave = async () => {
    try {
      setSaving(true);
      const values = await modalForm.validateFields();
      if (isScalar) {
        const next = [...((watched as string[]) ?? [])];
        const scalar = rowToScalar(values);
        if (editIndex === null) next.push(scalar);
        else next[editIndex] = scalar;
        persistRows(next);
      } else {
        const next = [...rows];
        if (editIndex === null) next.push(values);
        else next[editIndex] = values;
        persistRows(next);
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const tableColumns = [
    ...columns.map((column) => ({
      title: column.title,
      dataIndex: column.key,
      key: column.key,
      width: column.width,
      ellipsis: true,
      render: (value: unknown, record: Record<string, unknown>) => {
        const index = record._index as number;
        if (column.render) return column.render(value, record, index);
        if (column.key === 'image' && value) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImageUrl(String(value))}
              alt=""
              className="h-10 w-14 rounded object-cover"
            />
          );
        }
        return truncate(value);
      },
    })),
    {
      title: 'Үйлдэл',
      key: '_actions',
      width: 110,
      fixed: 'right' as const,
      render: (_: unknown, record: Record<string, unknown>) => {
        const index = record._index as number;
        return (
          <Space size={4}>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(index)} />
            <Popconfirm title="Устгах уу?" onConfirm={() => handleDelete(index)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const renderField = (field: SectionField) => {
    const required = fieldIsRequired(field.rules);
    const richTextRules: Rule[] =
      field.type === 'richtext' && required
        ? [
            {
              validator: (_, value) =>
                isEmptyRichText(value) ? Promise.reject(new Error('Заавал')) : Promise.resolve(),
            },
          ]
        : [];

    if (field.type === 'richtext') {
      return (
        <Form.Item
          key={field.name}
          name={field.name}
          label={field.label}
          rules={[...(field.rules?.filter((rule) => !(typeof rule === 'object' && rule && 'required' in rule)) ?? []), ...richTextRules]}
          getValueFromEvent={(value: string) => value}
        >
          <RichTextEditor minHeight={field.name === 'body' ? 320 : 200} placeholder={field.placeholder} />
        </Form.Item>
      );
    }

    if (field.type === 'image') {
      return (
        <Form.Item key={field.name} name={field.name} label={field.label} rules={field.rules}>
          <ImageUploadField label={field.label} />
        </Form.Item>
      );
    }

    return (
      <Form.Item key={field.name} name={field.name} label={field.label} rules={field.rules}>
        {field.type === 'textarea' ? (
          <Input.TextArea rows={field.name === 'excerpt' ? 3 : 4} placeholder={field.placeholder} />
        ) : (
          <Input placeholder={field.placeholder} />
        )}
      </Form.Item>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="m-0 text-sm font-medium text-foreground">{modalTitle}</p>
        <Button type="default" size="small" icon={<PlusOutlined />} onClick={openCreate}>
          {addLabel}
        </Button>
      </div>

      <Table
        size="small"
        bordered={false}
        pagination={false}
        scroll={scroll}
        rowKey="_index"
        dataSource={tableData}
        locale={{ emptyText: 'Одоогоор мэдээлэл байхгүй' }}
        columns={tableColumns}
        className="admin-data-table"
      />

      <Drawer
        title={editIndex === null ? `${modalTitle} нэмэх` : `${modalTitle} засах`}
        placement="right"
        width={hasRichText ? 720 : 480}
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Болих</Button>
            <Button type="primary" loading={saving} onClick={handleDrawerSave}>
              Хадгалах
            </Button>
          </div>
        }
      >
        <Form form={modalForm} layout="vertical">
          {drawerFields.map((field) => renderField(field))}
        </Form>
      </Drawer>
    </div>
  );
}
