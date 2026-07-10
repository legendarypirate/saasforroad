'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  Table,
  Typography,
  Upload,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined, SaveOutlined, UploadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import { DATE_FORMAT, dateFormItemProps } from '@/lib/userDates';
import {
  EQUIPMENT_API,
  EQUIPMENT_STATUS_LABELS,
  SIDE_LABELS,
  assetUrl,
  financeTotals,
  type EquipmentItem,
  type MonthlyFinanceRecord,
  type OilChangeRecord,
  type ServiceLogRecord,
} from '@/lib/equipment';
import { WorkerSelect } from '@/components/equipment/WorkerSelect';

const { Text } = Typography;
const MNT = new Intl.NumberFormat('mn-MN');
const fmt = (v?: number | null) => `${MNT.format(Number(v) || 0)} ₮`;

type UploadFile = {
  uid: string;
  name: string;
  status?: 'done' | 'uploading' | 'error' | 'removed';
  url?: string;
  originFileObj?: File;
};

async function patchJson(id: number, body: Record<string, unknown>) {
  const res = await fetch(`${EQUIPMENT_API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа');
  return json.data as EquipmentItem;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Алдаа');
  return json;
}

function SectionSaveBar({
  saving,
  onSave,
  hint,
}: {
  saving: boolean;
  onSave: () => void;
  hint?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      <Text type="secondary" style={{ fontSize: 13 }}>{hint}</Text>
      <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
        Хадгалах
      </Button>
    </div>
  );
}

/* ——— 1. Ерөнхий ——— */
export function GeneralTab({ item, onSaved }: { item: EquipmentItem; onSaved: (i: EquipmentItem) => void }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      ...item,
      import_date: item.import_date ? dayjs(item.import_date) : undefined,
    });
  }, [item, form]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const data = await patchJson(item.id, {
        ...v,
        import_date: dayjs.isDayjs(v.import_date) ? v.import_date.format(DATE_FORMAT) : v.import_date,
      });
      message.success('Ерөнхий мэдээлэл хадгалагдлаа');
      onSaved(data);
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card size="small" title="A. Ерөнхий мэдээлэл">
      <SectionSaveBar saving={saving} onSave={save} hint="Excel sheet 1 — зөвхөн ерөнхий талбарууд" />
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col xs={24} sm={8}><Form.Item name="asset_no" label="Дотоод дугаар"><Input /></Form.Item></Col>
          <Col xs={24} sm={16}><Form.Item name="name" label="Техникийн нэр" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="model" label="Марк / Модель"><Input /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="registration_number" label="Улсын дугаар"><Input /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="serial_number" label="Серийн / VIN"><Input /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="capacity" label="Хүчин чадал / Жин"><Input /></Form.Item></Col>
          <Col xs={24} sm={8}><Form.Item name="country_of_origin" label="Үйлдвэрлэсэн улс"><Input /></Form.Item></Col>
          <Col xs={24} sm={8}><Form.Item name="year_manufactured" label="Үйлдвэрлэсэн он"><Input /></Form.Item></Col>
          <Col xs={24} sm={8}>
            <Form.Item name="import_date" label="Монголд орсон" {...dateFormItemProps()}>
              <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}><Form.Item name="site" label="Талбай"><Input /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="color" label="Өнгө"><Input /></Form.Item></Col>
          <Col xs={24} sm={8}>
            <Form.Item name="responsible_user_id" label="Хариуцагч">
              <WorkerSelect placeholder="Дотоод ажилтан сонгох" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="operator_user_id" label="Оператор">
              <WorkerSelect
                placeholder="Дотоод ажилтан сонгох"
                onChange={(id, worker) => {
                  form.setFieldsValue({ operator_user_id: id });
                  if (worker?.phone) form.setFieldsValue({ phone: worker.phone });
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}><Form.Item name="phone" label="Утас"><Input /></Form.Item></Col>
          <Col xs={24} sm={8}>
            <Form.Item name="status" label="Төлөв">
              <Select options={Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}><Form.Item name="motor_hours" label="Мото цаг"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          <Col xs={24} sm={8}><Form.Item name="default_daily_rate" label="Өдрийн түрээс ₮"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
        </Row>
      </Form>
    </Card>
  );
}

/* ——— 2. Зураг ——— */
const PHOTO_SLOTS = [
  ...Object.entries(SIDE_LABELS).map(([key, label]) => ({ key, label })),
  { key: 'certificate_image', label: 'Гэрчилгээ' },
] as const;

export function PhotosTab({ item, onSaved }: { item: EquipmentItem; onSaved: (i: EquipmentItem) => void }) {
  const [fileLists, setFileLists] = useState<Record<string, UploadFile[]>>({});
  const [saving, setSaving] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    const lists: Record<string, UploadFile[]> = {};
    for (const { key } of PHOTO_SLOTS) {
      const path = item[key as keyof EquipmentItem] as string | undefined;
      const local = fileLists[key]?.[0]?.originFileObj;
      if (local) {
        lists[key] = fileLists[key];
      } else {
        lists[key] = path
          ? [{ uid: key, name: key, status: 'done', url: assetUrl(path) }]
          : [];
      }
    }
    setFileLists(lists);
    // only re-sync when item changes (saved photos), not on every fileLists edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const gallery = useMemo(() => {
    return PHOTO_SLOTS.map(({ key, label }) => {
      const entry = fileLists[key]?.[0];
      const url = entry?.url || (entry?.originFileObj ? URL.createObjectURL(entry.originFileObj) : null);
      return { key, label, url };
    }).filter((g) => !!g.url) as { key: string; label: string; url: string }[];
  }, [fileLists]);

  useEffect(() => {
    if (viewerIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewerIndex(null);
        return;
      }
      if (!gallery.length) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setViewerIndex((i) => (i == null ? 0 : (i - 1 + gallery.length) % gallery.length));
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setViewerIndex((i) => (i == null ? 0 : (i + 1) % gallery.length));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerIndex, gallery.length]);

  const openViewer = (slotKey: string) => {
    const idx = gallery.findIndex((g) => g.key === slotKey);
    if (idx >= 0) setViewerIndex(idx);
  };

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      let hasNew = false;
      for (const { key } of PHOTO_SLOTS) {
        const entry = fileLists[key]?.[0];
        const f = entry?.originFileObj instanceof File ? entry.originFileObj : null;
        if (f) {
          fd.append(key, f);
          hasNew = true;
        }
      }
      if (!hasNew) {
        message.info('Шинэ зураг сонгоогүй байна');
        return;
      }
      const res = await fetch(`${EQUIPMENT_API}/${item.id}`, { method: 'PUT', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      message.success('Зураг хадгалагдлаа');
      onSaved(json.data);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  const current = viewerIndex != null ? gallery[viewerIndex] : null;

  return (
    <Card size="small" title="Техникийн зураг — 4 тал + гэрчилгээ">
      <SectionSaveBar
        saving={saving}
        onSave={save}
        hint="Зураг дээр дарж бүтэн харна · ← → гараар шилжинэ · шинэ файл сонгоод Хадгалах"
      />
      <Row gutter={[16, 16]}>
        {PHOTO_SLOTS.map(({ key, label }) => {
          const entry = fileLists[key]?.[0];
          const preview =
            entry?.url ||
            (entry?.originFileObj ? URL.createObjectURL(entry.originFileObj) : null);
          return (
            <Col xs={12} sm={8} md={key === 'certificate_image' ? 12 : 6} key={key}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                {label}
              </Text>
              {preview ? (
                <button
                  type="button"
                  onClick={() => openViewer(key)}
                  className="group relative mb-2 block w-full overflow-hidden rounded-lg border border-border bg-muted/20"
                  style={{ aspectRatio: '4/3', cursor: 'zoom-in' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt={label}
                    className="size-full object-cover transition group-hover:scale-[1.02]"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-center text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                    Бүтэн харах
                  </span>
                </button>
              ) : (
                <div
                  className="mb-2 flex items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground"
                  style={{ aspectRatio: '4/3' }}
                >
                  Зураг байхгүй
                </div>
              )}
              <Upload
                listType="picture-card"
                accept="image/*"
                fileList={entry?.originFileObj ? [entry] : []}
                maxCount={1}
                beforeUpload={() => false}
                onChange={({ fileList }) => setFileLists((p) => ({ ...p, [key]: fileList }))}
              >
                <div className="flex flex-col items-center gap-1 p-1">
                  <UploadOutlined />
                  <div style={{ fontSize: 11 }}>{preview ? 'Солих' : 'Оруулах'}</div>
                </div>
              </Upload>
            </Col>
          );
        })}
      </Row>

      {current && viewerIndex != null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90"
          onClick={() => setViewerIndex(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
            onClick={() => setViewerIndex(null)}
          >
            Хаах ✕
          </button>
          <div className="absolute left-4 top-4 text-sm text-white/80">
            {current.label} · {viewerIndex + 1}/{gallery.length}
            <span className="ml-3 text-white/50">← → шилжих · Esc хаах</span>
          </div>

          {gallery.length > 1 && (
            <button
              type="button"
              aria-label="Өмнөх"
              className="absolute left-3 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
              onClick={(e) => {
                e.stopPropagation();
                setViewerIndex((i) => (i == null ? 0 : (i - 1 + gallery.length) % gallery.length));
              }}
            >
              ‹
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.label}
            className="max-h-[90vh] max-w-[92vw] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {gallery.length > 1 && (
            <button
              type="button"
              aria-label="Дараах"
              className="absolute right-3 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
              onClick={(e) => {
                e.stopPropagation();
                setViewerIndex((i) => (i == null ? 0 : (i + 1) % gallery.length));
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </Card>
  );
}


/* ——— 3. ТО / Засвар ——— */
export function ServiceTab({ item, onRefresh }: { item: EquipmentItem; onRefresh: () => void }) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const add = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await postJson(`${EQUIPMENT_API}/${item.id}/service_logs`, {
        ...v,
        service_date: dayjs.isDayjs(v.service_date) ? v.service_date.format(DATE_FORMAT) : v.service_date,
        next_service_date: dayjs.isDayjs(v.next_service_date)
          ? v.next_service_date.format(DATE_FORMAT)
          : v.next_service_date,
      });
      message.success('Бүртгэгдлээ');
      setOpen(false);
      form.resetFields();
      onRefresh();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ServiceLogRecord> = [
    { title: 'Огноо', dataIndex: 'service_date', width: 110 },
    { title: 'Мото цаг', dataIndex: 'motor_hours', width: 90 },
    { title: 'Төрөл', dataIndex: 'service_type', width: 90 },
    { title: 'Тайлбар', dataIndex: 'description', ellipsis: true },
    { title: 'Эд анги', dataIndex: 'parts_replaced', ellipsis: true },
    { title: 'Зардал', dataIndex: 'cost', width: 110, render: (v) => fmt(v) },
    { title: 'Газар', dataIndex: 'service_provider', ellipsis: true },
    { title: 'Инженер', dataIndex: 'engineer', width: 110 },
    { title: 'Дараагийн ТО', dataIndex: 'next_service_date', width: 110 },
    {
      title: '',
      width: 48,
      render: (_, r) => (
        <Popconfirm
          title="Устгах?"
          onConfirm={async () => {
            await fetch(`${EQUIPMENT_API}/${item.id}/service_logs/${r.id}`, { method: 'DELETE' });
            onRefresh();
          }}
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      size="small"
      title="ТО, Засварын түүх"
      extra={
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({ service_type: 'ТО', service_date: dayjs() });
            setOpen(true);
          }}
        >
          Шинэ мөр
        </Button>
      }
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Түүх жагсаалтаар · шинэ бүртгэл drawer-ээр
      </Text>
      <Table
        size="small"
        rowKey="id"
        pagination={{ pageSize: 10 }}
        dataSource={item.serviceLogs || []}
        columns={columns}
        scroll={{ x: 1100 }}
        locale={{ emptyText: 'Түүх байхгүй — «Шинэ мөр» дарж нэмнэ үү' }}
      />
      <Drawer
        title="ТО / Засвар нэмэх"
        open={open}
        onClose={() => setOpen(false)}
        width={520}
        destroyOnClose
        extra={<Button type="primary" loading={saving} onClick={add}>Хадгалах</Button>}
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="service_date" label="Огноо" rules={[{ required: true }]} {...dateFormItemProps()}>
                <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="motor_hours" label="Мото цаг"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="service_type" label="Төрөл">
                <Select options={['ТО', 'Засвар', 'Бусад'].map((v) => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="cost" label="Зардал ₮"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="Хийсэн ажил"><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="parts_replaced" label="Орлуулсан эд анги"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="service_provider" label="Гүйцэтгэсэн газар"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="engineer" label="Инженер"><Input /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="next_service_date" label="Дараагийн ТО" {...dateFormItemProps()}>
                <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Drawer>
    </Card>
  );
}

/* ——— Тос масло ——— */
export function OilTab({ item, onRefresh }: { item: EquipmentItem; onRefresh: () => void }) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const oilColumns: ColumnsType<OilChangeRecord> = [
    { title: 'Огноо', dataIndex: 'changed_at', width: 110 },
    { title: 'Мото цаг', dataIndex: 'motor_hours_at_change', width: 100 },
    { title: 'Тос', dataIndex: 'oil_type' },
    { title: 'Литр', dataIndex: 'quantity_liters', width: 80 },
    { title: 'Тэмдэглэл', dataIndex: 'notes', ellipsis: true },
    {
      title: '',
      width: 48,
      render: (_, r) => (
        <Popconfirm
          title="Устгах?"
          onConfirm={async () => {
            await fetch(`${EQUIPMENT_API}/${item.id}/oil_change/${r.id}`, { method: 'DELETE' });
            onRefresh();
          }}
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await postJson(`${EQUIPMENT_API}/${item.id}/oil_change`, {
        ...v,
        changed_at: dayjs.isDayjs(v.changed_at) ? v.changed_at.format(DATE_FORMAT) : v.changed_at,
      });
      message.success('Нэмэгдлээ');
      setOpen(false);
      onRefresh();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      size="small"
      title="Тос масло солих түүх"
      extra={
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({ changed_at: dayjs() });
            setOpen(true);
          }}
        >
          Солих бүртгэх
        </Button>
      }
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Түүх жагсаалтаар · шинэ солих бүртгэл drawer-ээр
      </Text>
      <Table
        size="small"
        rowKey="id"
        pagination={{ pageSize: 10 }}
        dataSource={item.oilChanges || []}
        columns={oilColumns}
        locale={{ emptyText: 'Түүх байхгүй' }}
      />
      <Drawer
        title="Тос масло солих"
        open={open}
        onClose={() => setOpen(false)}
        width={420}
        destroyOnClose
        extra={<Button type="primary" loading={saving} onClick={save}>Хадгалах</Button>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="changed_at" label="Огноо" rules={[{ required: true }]} {...dateFormItemProps()}>
            <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="motor_hours_at_change" label="Мото цаг"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="oil_type" label="Тосны нэр"><Input /></Form.Item>
          <Form.Item name="quantity_liters" label="Хэмжээ (л)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="changed_by" label="Хэн сольсон"><Input /></Form.Item>
          <Form.Item name="notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Drawer>
    </Card>
  );
}

export {
  InsuranceTab,
  InspectionTab,
  CertificateTab,
  OtherDocsTab,
} from './DocHistoryTabs';

/* ——— Орлого ——— */
export function FinanceTab({ item, onRefresh }: { item: EquipmentItem; onRefresh: () => void }) {
  const [finYear, setFinYear] = useState(dayjs().year());
  const [finForm] = Form.useForm();

  const financeByMonth = useMemo(() => {
    const map = new Map<number, MonthlyFinanceRecord>();
    for (const r of item.monthlyFinances || []) {
      if (Number(r.year) === finYear) map.set(Number(r.month), r);
    }
    return map;
  }, [item.monthlyFinances, finYear]);

  const financeRows = useMemo(() => {
    const keys = [
      { key: 'rental_income', label: 'Түрээсийн орлого' },
      { key: 'operator_salary', label: 'Операторын цалин' },
      { key: 'oil_cost', label: 'Тос, масло' },
      { key: 'service_cost', label: 'ТО / Засвар' },
      { key: 'fuel_cost', label: 'Шатахуун' },
      { key: 'other_cost', label: 'Бусад зардал' },
    ] as const;
    const rows = keys.map((k) => {
      const row: Record<string, unknown> = { key: k.key, label: k.label };
      let total = 0;
      for (let m = 1; m <= 12; m++) {
        const val = Number(financeByMonth.get(m)?.[k.key] || 0);
        row[`m${m}`] = val;
        total += val;
      }
      row.total = total;
      return row;
    });
    const expenseRow: Record<string, unknown> = { key: 'expense', label: 'ДҮН ЗАРДАЛ' };
    const profitRow: Record<string, unknown> = { key: 'profit', label: 'ЦЭВЭР АШИГ' };
    const pctRow: Record<string, unknown> = { key: 'pct', label: 'Ашгийн хувь (%)' };
    let expT = 0;
    let profT = 0;
    let incT = 0;
    for (let m = 1; m <= 12; m++) {
      const rec = financeByMonth.get(m);
      const t = rec ? financeTotals(rec) : { expense: 0, income: 0, profit: 0, pct: 0 };
      expenseRow[`m${m}`] = t.expense;
      profitRow[`m${m}`] = t.profit;
      pctRow[`m${m}`] = t.pct;
      expT += t.expense;
      profT += t.profit;
      incT += t.income;
    }
    expenseRow.total = expT;
    profitRow.total = profT;
    pctRow.total = incT > 0 ? Math.round((profT / incT) * 1000) / 10 : 0;
    return [...rows, expenseRow, profitRow, pctRow];
  }, [financeByMonth]);

  return (
    <Card size="small" title="Сарын орлого, ашгийн тооцоо">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <Text type="secondary">Excel sheet 5 — сар бүрийг тусад нь оруулна</Text>
        <Select
          style={{ width: 120 }}
          value={finYear}
          onChange={setFinYear}
          options={[finYear - 1, finYear, finYear + 1].map((y) => ({ value: y, label: String(y) }))}
        />
      </div>
      <Card size="small" style={{ marginBottom: 12, background: 'var(--muted, #f8fafc)' }}>
        <Form
          form={finForm}
          layout="inline"
          style={{ flexWrap: 'wrap', gap: 8 }}
          initialValues={{ month: dayjs().month() + 1 }}
          onFinish={async (v) => {
            const existing = financeByMonth.get(Number(v.month));
            await postJson(`${EQUIPMENT_API}/${item.id}/finances`, {
              year: finYear,
              month: Number(v.month),
              rental_income: v.rental_income ?? existing?.rental_income ?? 0,
              operator_salary: v.operator_salary ?? existing?.operator_salary ?? 0,
              oil_cost: v.oil_cost ?? existing?.oil_cost ?? 0,
              service_cost: v.service_cost ?? existing?.service_cost ?? 0,
              fuel_cost: v.fuel_cost ?? existing?.fuel_cost ?? 0,
              other_cost: v.other_cost ?? existing?.other_cost ?? 0,
            });
            message.success('Сар хадгалагдлаа');
            onRefresh();
          }}
        >
          <Form.Item name="month" label="Сар" rules={[{ required: true }]}>
            <Select
              style={{ width: 90 }}
              options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }))}
              onChange={(m) => {
                const ex = financeByMonth.get(Number(m));
                if (ex) {
                  finForm.setFieldsValue({
                    rental_income: Number(ex.rental_income),
                    operator_salary: Number(ex.operator_salary),
                    oil_cost: Number(ex.oil_cost),
                    service_cost: Number(ex.service_cost),
                    fuel_cost: Number(ex.fuel_cost),
                    other_cost: Number(ex.other_cost),
                  });
                }
              }}
            />
          </Form.Item>
          <Form.Item name="rental_income" label="Орлого"><InputNumber min={0} /></Form.Item>
          <Form.Item name="operator_salary" label="Цалин"><InputNumber min={0} /></Form.Item>
          <Form.Item name="oil_cost" label="Тос"><InputNumber min={0} /></Form.Item>
          <Form.Item name="service_cost" label="ТО"><InputNumber min={0} /></Form.Item>
          <Form.Item name="fuel_cost" label="Шатахуун"><InputNumber min={0} /></Form.Item>
          <Form.Item name="other_cost" label="Бусад"><InputNumber min={0} /></Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Сар хадгалах</Button>
        </Form>
      </Card>
      <Table
        size="small"
        rowKey="key"
        pagination={false}
        dataSource={financeRows}
        scroll={{ x: 1200 }}
        columns={[
          { title: 'Үзүүлэлт', dataIndex: 'label', fixed: 'left', width: 160 },
          ...Array.from({ length: 12 }, (_, i) => ({
            title: `${i + 1}`,
            dataIndex: `m${i + 1}`,
            width: 90,
            align: 'right' as const,
            render: (v: number, r: Record<string, unknown>) =>
              r.key === 'pct' ? `${v}%` : MNT.format(Number(v) || 0),
          })),
          {
            title: 'НИЙТ',
            dataIndex: 'total',
            width: 110,
            align: 'right' as const,
            render: (v: number, r: Record<string, unknown>) =>
              r.key === 'pct' ? `${v}%` : MNT.format(Number(v) || 0),
          },
        ]}
      />
    </Card>
  );
}
