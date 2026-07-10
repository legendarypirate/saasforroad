'use client';

import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import { DATE_FORMAT, dateFormItemProps } from '@/lib/userDates';
import {
  EQUIPMENT_API,
  expiryTone,
  type EquipmentDocRecord,
  type EquipmentItem,
} from '@/lib/equipment';

const { Text } = Typography;
const MNT = new Intl.NumberFormat('mn-MN');
const fmt = (v?: number | null) => `${MNT.format(Number(v) || 0)} ₮`;

type DocType = 'insurance' | 'inspection' | 'certificate' | 'tax' | 'other';

type FieldKey =
  | 'name'
  | 'issuer'
  | 'status'
  | 'number'
  | 'amount'
  | 'period'
  | 'issued_at'
  | 'expires_at'
  | 'paid'
  | 'notes';

type DocTabConfig = {
  docType: DocType | DocType[];
  title: React.ReactNode;
  addLabel: string;
  emptyText: string;
  fields: { key: FieldKey; label: string; required?: boolean; options?: { value: string; label: string }[] }[];
  columns: ColumnsType<EquipmentDocRecord>;
  defaults?: Record<string, unknown>;
  mapToForm?: (row: EquipmentDocRecord) => Record<string, unknown>;
  mapFromForm?: (values: Record<string, unknown>) => Record<string, unknown>;
};

async function saveDoc(
  equipmentId: number,
  editingId: number | null,
  body: Record<string, unknown>
) {
  const url = editingId
    ? `${EQUIPMENT_API}/${equipmentId}/documents/${editingId}`
    : `${EQUIPMENT_API}/${equipmentId}/documents`;
  const res = await fetch(url, {
    method: editingId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа');
  return json;
}

function DocHistoryPanel({
  item,
  config,
  onRefresh,
}: {
  item: EquipmentItem;
  config: DocTabConfig;
  onRefresh: (equipment?: EquipmentItem) => void;
}) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentDocRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const types = Array.isArray(config.docType) ? config.docType : [config.docType];
  const rows = useMemo(
    () => (item.documents || []).filter((d) => types.includes(d.doc_type as DocType)),
    [item.documents, types]
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      doc_type: types[0],
      issued_at: dayjs(),
      ...(config.defaults || {}),
    });
    setOpen(true);
  };

  const openEdit = (row: EquipmentDocRecord) => {
    setEditing(row);
    form.setFieldsValue(
      config.mapToForm
        ? config.mapToForm(row)
        : {
            ...row,
            issued_at: row.issued_at ? dayjs(row.issued_at) : undefined,
            expires_at: row.expires_at ? dayjs(row.expires_at) : undefined,
          }
    );
    setOpen(true);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const mapped = config.mapFromForm ? config.mapFromForm(values) : values;
      const body: Record<string, unknown> = {
        doc_type: mapped.doc_type || types[0],
        name: mapped.name,
        issuer: mapped.issuer ?? null,
        status: mapped.status ?? null,
        number: mapped.number ?? null,
        amount: mapped.amount ?? null,
        period: mapped.period ?? null,
        paid: mapped.paid ?? null,
        notes: mapped.notes ?? null,
        issued_at: dayjs.isDayjs(mapped.issued_at)
          ? mapped.issued_at.format(DATE_FORMAT)
          : mapped.issued_at || null,
        expires_at: dayjs.isDayjs(mapped.expires_at)
          ? mapped.expires_at.format(DATE_FORMAT)
          : mapped.expires_at || null,
      };
      const json = await saveDoc(item.id, editing?.id ?? null, body);
      message.success(editing ? 'Шинэчлэгдлээ' : 'Нэмэгдлээ');
      setOpen(false);
      onRefresh(json.equipment);
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    const res = await fetch(`${EQUIPMENT_API}/${item.id}/documents/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) {
      message.error(json.message || 'Алдаа');
      return;
    }
    message.success('Устгагдлаа');
    onRefresh(json.equipment);
  };

  const columns: ColumnsType<EquipmentDocRecord> = [
    ...config.columns,
    {
      title: '',
      key: 'actions',
      width: 90,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Устгах уу?" onConfirm={() => remove(r.id)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      size="small"
      title={config.title}
      extra={
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
          {config.addLabel}
        </Button>
      }
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Түүх жагсаалтаар харагдана · шинэ бүртгэлийг drawer-ээр нэмнэ
      </Text>
      <Table
        size="small"
        rowKey="id"
        pagination={{ pageSize: 10 }}
        dataSource={rows}
        columns={columns}
        scroll={{ x: 900 }}
        locale={{ emptyText: config.emptyText }}
      />

      <Drawer
        title={editing ? 'Засах' : config.addLabel}
        open={open}
        onClose={() => setOpen(false)}
        width={480}
        destroyOnClose
        extra={
          <Button type="primary" loading={saving} onClick={save}>
            Хадгалах
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          {types.length > 1 ? (
            <Form.Item name="doc_type" label="Төрөл" rules={[{ required: true }]}>
              <Select
                options={types.map((t) => ({
                  value: t,
                  label: t === 'tax' ? 'Татвар' : t === 'other' ? 'Бусад' : t,
                }))}
              />
            </Form.Item>
          ) : (
            <Form.Item name="doc_type" hidden>
              <Input />
            </Form.Item>
          )}
          <Row gutter={12}>
            {config.fields.map((f) => {
              const span = f.key === 'notes' ? 24 : 12;
              return (
                <Col span={span} key={f.key}>
                  <Form.Item
                    name={f.key}
                    label={f.label}
                    rules={f.required ? [{ required: true, message: 'Заавал' }] : undefined}
                    {...(f.key === 'issued_at' || f.key === 'expires_at' ? dateFormItemProps() : {})}
                    {...(f.key === 'paid' ? { valuePropName: 'checked' } : {})}
                  >
                    {f.key === 'status' && f.options ? (
                      <Select allowClear options={f.options} />
                    ) : f.key === 'issued_at' || f.key === 'expires_at' ? (
                      <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
                    ) : f.key === 'amount' ? (
                      <InputNumber style={{ width: '100%' }} min={0} />
                    ) : f.key === 'paid' ? (
                      <Switch />
                    ) : f.key === 'notes' ? (
                      <Input.TextArea rows={3} />
                    ) : (
                      <Input />
                    )}
                  </Form.Item>
                </Col>
              );
            })}
          </Row>
        </Form>
      </Drawer>
    </Card>
  );
}

export function InsuranceTab({
  item,
  onRefresh,
}: {
  item: EquipmentItem;
  onRefresh: (equipment?: EquipmentItem) => void;
}) {
  return (
    <DocHistoryPanel
      item={item}
      onRefresh={onRefresh}
      config={{
        docType: 'insurance',
        title: (
          <Space>
            <span>Даатгалын түүх</span>
            <Tag color={expiryTone(item.insurance_expiry)}>
              {item.insurance_status || item.insurance_expiry || 'одоогийн'}
            </Tag>
          </Space>
        ),
        addLabel: 'Даатгал нэмэх',
        emptyText: 'Даатгалын түүх байхгүй',
        defaults: { name: 'Даатгал', status: 'Хүчинтэй' },
        fields: [
          { key: 'issuer', label: 'Байгууллага', required: true },
          {
            key: 'status',
            label: 'Төлөв',
            options: ['Хүчинтэй', 'Хугацаа дууссан', '90 хоногт дуусна'].map((v) => ({
              value: v,
              label: v,
            })),
          },
          { key: 'number', label: 'Гэрээ №' },
          { key: 'amount', label: 'Дүн ₮' },
          { key: 'issued_at', label: 'Эхлэх огноо' },
          { key: 'expires_at', label: 'Дуусах огноо', required: true },
          { key: 'notes', label: 'Тэмдэглэл' },
        ],
        mapFromForm: (v) => ({
          ...v,
          name: v.issuer || 'Даатгал',
          doc_type: 'insurance',
        }),
        columns: [
          { title: 'Байгууллага', dataIndex: 'issuer', render: (v, r) => v || r.name },
          { title: 'Төлөв', dataIndex: 'status', width: 130 },
          { title: 'Гэрээ №', dataIndex: 'number', width: 120 },
          { title: 'Дүн', dataIndex: 'amount', width: 110, render: (v) => (v != null ? fmt(v) : '—') },
          {
            title: 'Дуусах',
            dataIndex: 'expires_at',
            width: 120,
            render: (v) => (v ? <Tag color={expiryTone(v)}>{v}</Tag> : '—'),
          },
          { title: 'Тэмдэглэл', dataIndex: 'notes', ellipsis: true },
        ],
      }}
    />
  );
}

export function InspectionTab({
  item,
  onRefresh,
}: {
  item: EquipmentItem;
  onRefresh: (equipment?: EquipmentItem) => void;
}) {
  return (
    <DocHistoryPanel
      item={item}
      onRefresh={onRefresh}
      config={{
        docType: 'inspection',
        title: 'Оношилгооны түүх',
        addLabel: 'Оношилгоо нэмэх',
        emptyText: 'Оношилгооны түүх байхгүй',
        defaults: { name: 'Техникийн оношилгоо', status: 'Тэнцсэн' },
        fields: [
          {
            key: 'status',
            label: 'Үр дүн',
            required: true,
            options: [
              { value: 'Тэнцсэн', label: 'Тэнцсэн' },
              { value: 'Тэнцээгүй', label: 'Тэнцээгүй' },
            ],
          },
          { key: 'issued_at', label: 'Үзлэгийн огноо', required: true },
          { key: 'expires_at', label: 'Дараагийн үзлэг' },
          { key: 'amount', label: 'Нэмэлт төлбөр ₮' },
          { key: 'issuer', label: 'Үзлэг хийсэн газар' },
          { key: 'notes', label: 'Тэмдэглэл' },
        ],
        mapFromForm: (v) => ({
          ...v,
          name: v.status || 'Оношилгоо',
          doc_type: 'inspection',
        }),
        columns: [
          { title: 'Үр дүн', dataIndex: 'status', width: 110 },
          { title: 'Огноо', dataIndex: 'issued_at', width: 110 },
          {
            title: 'Дараагийн',
            dataIndex: 'expires_at',
            width: 120,
            render: (v) => (v ? <Tag color={expiryTone(v)}>{v}</Tag> : '—'),
          },
          { title: 'Төлбөр', dataIndex: 'amount', width: 110, render: (v) => (v != null ? fmt(v) : '—') },
          { title: 'Газар', dataIndex: 'issuer', ellipsis: true },
          { title: 'Тэмдэглэл', dataIndex: 'notes', ellipsis: true },
        ],
      }}
    />
  );
}

export function CertificateTab({
  item,
  onRefresh,
}: {
  item: EquipmentItem;
  onRefresh: (equipment?: EquipmentItem) => void;
}) {
  return (
    <DocHistoryPanel
      item={item}
      onRefresh={onRefresh}
      config={{
        docType: 'certificate',
        title: 'Гэрчилгээний түүх',
        addLabel: 'Гэрчилгээ нэмэх',
        emptyText: 'Гэрчилгээ байхгүй',
        defaults: { name: 'Техникийн гэрчилгээ' },
        fields: [
          { key: 'name', label: 'Баримтын нэр', required: true },
          { key: 'number', label: 'Дугаар' },
          { key: 'issuer', label: 'Эзэмшигч / олгосон' },
          { key: 'issued_at', label: 'Олгосон огноо' },
          { key: 'expires_at', label: 'Дуусах огноо' },
          { key: 'notes', label: 'Тэмдэглэл' },
        ],
        mapFromForm: (v) => ({ ...v, doc_type: 'certificate' }),
        columns: [
          { title: 'Нэр', dataIndex: 'name' },
          { title: 'Дугаар', dataIndex: 'number', width: 120 },
          { title: 'Эзэмшигч', dataIndex: 'issuer', ellipsis: true },
          {
            title: 'Дуусах',
            dataIndex: 'expires_at',
            width: 120,
            render: (v) => (v ? <Tag color={expiryTone(v)}>{v}</Tag> : '—'),
          },
          { title: 'Тэмдэглэл', dataIndex: 'notes', ellipsis: true },
        ],
      }}
    />
  );
}

export function OtherDocsTab({
  item,
  onRefresh,
}: {
  item: EquipmentItem;
  onRefresh: (equipment?: EquipmentItem) => void;
}) {
  return (
    <DocHistoryPanel
      item={item}
      onRefresh={onRefresh}
      config={{
        docType: ['tax', 'other'],
        title: 'Бусад бичиг баримт / Татвар',
        addLabel: 'Баримт нэмэх',
        emptyText: 'Баримт байхгүй',
        defaults: { doc_type: 'other' },
        fields: [
          { key: 'name', label: 'Нэр', required: true },
          { key: 'number', label: 'Дугаар' },
          { key: 'issuer', label: 'Байгууллага' },
          { key: 'amount', label: 'Дүн ₮' },
          { key: 'period', label: 'Он, сар' },
          { key: 'issued_at', label: 'Огноо' },
          { key: 'expires_at', label: 'Дуусах' },
          { key: 'paid', label: 'Төлсөн' },
          { key: 'notes', label: 'Тэмдэглэл' },
        ],
        mapFromForm: (v) => ({ ...v, doc_type: v.doc_type || 'other' }),
        columns: [
          {
            title: 'Төрөл',
            dataIndex: 'doc_type',
            width: 90,
            render: (v) => (v === 'tax' ? 'Татвар' : 'Бусад'),
          },
          { title: 'Нэр', dataIndex: 'name' },
          { title: 'Дугаар', dataIndex: 'number', width: 110 },
          { title: 'Дүн', dataIndex: 'amount', width: 110, render: (v) => (v != null ? fmt(v) : '—') },
          { title: 'Он сар', dataIndex: 'period', width: 90 },
          {
            title: 'Дуусах',
            dataIndex: 'expires_at',
            width: 120,
            render: (v) => (v ? <Tag color={expiryTone(v)}>{v}</Tag> : '—'),
          },
          {
            title: 'Төлсөн',
            dataIndex: 'paid',
            width: 80,
            render: (v) => (v == null ? '—' : v ? 'Тийм' : 'Үгүй'),
          },
        ],
      }}
    />
  );
}
