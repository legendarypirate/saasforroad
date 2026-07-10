'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Image,
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
  expiryTone,
  financeTotals,
  type EquipmentDocRecord,
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
export function PhotosTab({ item, onSaved }: { item: EquipmentItem; onSaved: (i: EquipmentItem) => void }) {
  const [fileLists, setFileLists] = useState<Record<string, UploadFile[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const lists: Record<string, UploadFile[]> = {};
    for (const key of Object.keys(SIDE_LABELS)) {
      const path = item[key as keyof EquipmentItem] as string | undefined;
      lists[key] = path ? [{ uid: key, name: key, status: 'done', url: assetUrl(path) }] : [];
    }
    lists.certificate_image = item.certificate_image
      ? [{ uid: 'cert', name: 'cert', status: 'done', url: assetUrl(item.certificate_image) }]
      : [];
    setFileLists(lists);
  }, [item]);

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      let hasNew = false;
      for (const key of [...Object.keys(SIDE_LABELS), 'certificate_image']) {
        const f = fileLists[key]?.[0]?.originFileObj;
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

  const up = (field: string, label: string) => (
    <Upload
      listType="picture-card"
      fileList={fileLists[field] || []}
      maxCount={1}
      beforeUpload={() => false}
      onChange={({ fileList }) => setFileLists((p) => ({ ...p, [field]: fileList }))}
    >
      {(fileLists[field]?.length ?? 0) < 1 && (
        <div>
          <UploadOutlined />
          <div style={{ marginTop: 8, fontSize: 11 }}>{label}</div>
        </div>
      )}
    </Upload>
  );

  return (
    <Card size="small" title="Техникийн зураг — 4 тал + гэрчилгээ">
      <SectionSaveBar saving={saving} onSave={save} hint="Excel sheet 2 — зөвхөн шинээр сонгосон зураг илгээгдэнэ" />
      <Row gutter={[12, 12]}>
        {Object.entries(SIDE_LABELS).map(([key, label]) => (
          <Col xs={12} sm={6} key={key}>
            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
            <div style={{ marginTop: 6 }}>{up(key, label)}</div>
            {item[key as keyof EquipmentItem] && !fileLists[key]?.[0]?.originFileObj && (
              <Image
                src={assetUrl(String(item[key as keyof EquipmentItem]))}
                alt={label}
                style={{ width: '100%', maxHeight: 100, objectFit: 'cover', marginTop: 8, borderRadius: 6 }}
              />
            )}
          </Col>
        ))}
        <Col span={24}>
          <Text type="secondary" style={{ fontSize: 12 }}>Гэрчилгээ / бүртгэлийн баримт</Text>
          <div style={{ marginTop: 6 }}>{up('certificate_image', 'Гэрчилгээ')}</div>
        </Col>
      </Row>
    </Card>
  );
}

/* ——— 3. ТО / Засвар ——— */
export function ServiceTab({ item, onRefresh }: { item: EquipmentItem; onRefresh: () => void }) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);

  const add = async () => {
    try {
      const v = await form.validateFields();
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
        Excel sheet 3 — хийгдэх бүрт шинэ мөр нэмнэ
      </Text>
      {open && (
        <Card size="small" style={{ marginBottom: 12, background: 'var(--muted, #f8fafc)' }}>
          <Form form={form} layout="vertical">
            <Row gutter={12}>
              <Col xs={24} sm={6}>
                <Form.Item name="service_date" label="Огноо" rules={[{ required: true }]} {...dateFormItemProps()}>
                  <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}><Form.Item name="motor_hours" label="Мото цаг"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
              <Col xs={24} sm={6}>
                <Form.Item name="service_type" label="Төрөл">
                  <Select options={[{ value: 'ТО' }, { value: 'Засвар' }, { value: 'Бусад' }].map((o) => ({ value: o.value, label: o.value }))} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}><Form.Item name="cost" label="Зардал ₮"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
              <Col xs={24} sm={12}><Form.Item name="description" label="Хийсэн ажил"><Input /></Form.Item></Col>
              <Col xs={24} sm={12}><Form.Item name="parts_replaced" label="Орлуулсан эд анги"><Input /></Form.Item></Col>
              <Col xs={24} sm={8}><Form.Item name="service_provider" label="Гүйцэтгэсэн газар"><Input /></Form.Item></Col>
              <Col xs={24} sm={8}><Form.Item name="engineer" label="Инженер"><Input /></Form.Item></Col>
              <Col xs={24} sm={8}>
                <Form.Item name="next_service_date" label="Дараагийн ТО" {...dateFormItemProps()}>
                  <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={24}><Form.Item name="notes" label="Тэмдэглэл"><Input /></Form.Item></Col>
            </Row>
            <Space>
              <Button type="primary" onClick={add}>Хадгалах</Button>
              <Button onClick={() => setOpen(false)}>Болих</Button>
            </Space>
          </Form>
        </Card>
      )}
      <Table
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={item.serviceLogs || []}
        columns={columns}
        scroll={{ x: 1100 }}
        locale={{ emptyText: 'Түүх байхгүй — «Шинэ мөр» дарж нэмнэ үү' }}
      />
    </Card>
  );
}

/* ——— Shared section save helper ——— */
async function saveFormSection(
  itemId: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formInst: any,
  dateKeys: string[],
  onSaved: (i: EquipmentItem) => void
) {
  const v = await formInst.validateFields();
  const body: Record<string, unknown> = { ...v };
  for (const dk of dateKeys) {
    if (dayjs.isDayjs(body[dk])) body[dk] = (body[dk] as dayjs.Dayjs).format(DATE_FORMAT);
  }
  const data = await patchJson(itemId, body);
  message.success('Хадгалагдлаа');
  onSaved(data);
}

/* ——— Даатгал ——— */
export function InsuranceTab({ item, onSaved }: { item: EquipmentItem; onSaved: (i: EquipmentItem) => void }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      insurance_company: item.insurance_company,
      insurance_status: item.insurance_status,
      insurance_expiry: item.insurance_expiry ? dayjs(item.insurance_expiry) : undefined,
      insurance_amount: item.insurance_amount,
      insurance_contract_no: item.insurance_contract_no,
      insurance_notes: item.insurance_notes,
    });
  }, [item, form]);

  return (
    <Card
      size="small"
      title={
        <Space>
          <span>Даатгал</span>
          <Tag color={expiryTone(item.insurance_expiry)}>
            {item.insurance_status || item.insurance_expiry || 'хугацаа'}
          </Tag>
        </Space>
      }
    >
      <SectionSaveBar
        saving={saving}
        hint="Даатгалын байгууллага, дуусах хугацаа, дүн"
        onSave={async () => {
          try {
            setSaving(true);
            await saveFormSection(item.id, form, ['insurance_expiry'], onSaved);
          } catch (e) {
            if (e && typeof e === 'object' && 'errorFields' in e) return;
            message.error(e instanceof Error ? e.message : 'Алдаа');
          } finally {
            setSaving(false);
          }
        }}
      />
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col xs={24} sm={12}><Form.Item name="insurance_company" label="Байгууллага"><Input /></Form.Item></Col>
          <Col xs={24} sm={12}>
            <Form.Item name="insurance_status" label="Төлөв">
              <Select allowClear options={['Хүчинтэй', 'Хугацаа дууссан', '90 хоногт дуусна'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="insurance_expiry" label="Дуусах огноо" {...dateFormItemProps()}>
              <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}><Form.Item name="insurance_amount" label="Дүн ₮"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          <Col xs={24} sm={8}><Form.Item name="insurance_contract_no" label="Гэрээ №"><Input /></Form.Item></Col>
          <Col span={24}><Form.Item name="insurance_notes" label="Тэмдэглэл"><Input.TextArea rows={2} /></Form.Item></Col>
        </Row>
      </Form>
    </Card>
  );
}

/* ——— Техникийн оношилгоо ——— */
export function InspectionTab({ item, onSaved }: { item: EquipmentItem; onSaved: (i: EquipmentItem) => void }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      inspection_result: item.inspection_result,
      inspection_date: item.inspection_date ? dayjs(item.inspection_date) : undefined,
      next_inspection_date: item.next_inspection_date ? dayjs(item.next_inspection_date) : undefined,
      inspection_extra_fee: item.inspection_extra_fee,
      inspection_notes: item.inspection_notes,
    });
  }, [item, form]);

  return (
    <Card
      size="small"
      title={
        <Space>
          <span>Техникийн оношилгоо</span>
          <Tag color={expiryTone(item.next_inspection_date)}>
            {item.inspection_result || item.next_inspection_date || 'хугацаа'}
          </Tag>
        </Space>
      }
    >
      <SectionSaveBar
        saving={saving}
        hint="Үзлэгийн үр дүн, огноо, дараагийн үзлэг"
        onSave={async () => {
          try {
            setSaving(true);
            await saveFormSection(item.id, form, ['inspection_date', 'next_inspection_date'], onSaved);
          } catch (e) {
            if (e && typeof e === 'object' && 'errorFields' in e) return;
            message.error(e instanceof Error ? e.message : 'Алдаа');
          } finally {
            setSaving(false);
          }
        }}
      />
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Form.Item name="inspection_result" label="Үр дүн">
              <Select allowClear options={[{ value: 'Тэнцсэн' }, { value: 'Тэнцээгүй' }].map((o) => ({ value: o.value, label: o.value }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="inspection_date" label="Үзлэгийн огноо" {...dateFormItemProps()}>
              <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="next_inspection_date" label="Дараагийн үзлэг" {...dateFormItemProps()}>
              <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}><Form.Item name="inspection_extra_fee" label="Нэмэлт төлбөр ₮"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="inspection_notes" label="Тэмдэглэл"><Input /></Form.Item></Col>
        </Row>
      </Form>
    </Card>
  );
}

/* ——— Тос масло ——— */
export function OilTab({ item, onSaved, onRefresh }: { item: EquipmentItem; onSaved: (i: EquipmentItem) => void; onRefresh: () => void }) {
  const [form] = Form.useForm();
  const [histForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [oilOpen, setOilOpen] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      last_oil_change_date: item.last_oil_change_date ? dayjs(item.last_oil_change_date) : undefined,
      last_oil_motor_hours: item.last_oil_motor_hours,
      next_oil_motor_hours: item.next_oil_motor_hours,
      oil_type_name: item.oil_type_name,
      oil_quantity_liters: item.oil_quantity_liters,
      oil_notes: item.oil_notes,
    });
  }, [item, form]);

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

  return (
    <div>
      <Card size="small" title="Тос масло — сүүлийн мэдээлэл" style={{ marginBottom: 16 }}>
        <SectionSaveBar
          saving={saving}
          hint="Сүүлийн солих товч мэдээлэл"
          onSave={async () => {
            try {
              setSaving(true);
              await saveFormSection(item.id, form, ['last_oil_change_date'], onSaved);
            } catch (e) {
              if (e && typeof e === 'object' && 'errorFields' in e) return;
              message.error(e instanceof Error ? e.message : 'Алдаа');
            } finally {
              setSaving(false);
            }
          }}
        />
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item name="last_oil_change_date" label="Сүүлийн солисон" {...dateFormItemProps()}>
                <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}><Form.Item name="last_oil_motor_hours" label="Мото цаг (солих үед)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col xs={24} sm={8}><Form.Item name="next_oil_motor_hours" label="Дараагийн солих мото цаг"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="oil_type_name" label="Тосны нэр"><Input /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="oil_quantity_liters" label="Хэмжээ (л)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={24}><Form.Item name="oil_notes" label="Тэмдэглэл"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Card>

      <Card
        size="small"
        title="Солих түүх"
        extra={
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              histForm.resetFields();
              histForm.setFieldsValue({ changed_at: dayjs() });
              setOilOpen(true);
            }}
          >
            Түүх нэмэх
          </Button>
        }
      >
        {oilOpen && (
          <Form
            form={histForm}
            layout="inline"
            style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}
            onFinish={async (v) => {
              await postJson(`${EQUIPMENT_API}/${item.id}/oil_change`, {
                ...v,
                changed_at: dayjs.isDayjs(v.changed_at) ? v.changed_at.format(DATE_FORMAT) : v.changed_at,
              });
              message.success('Нэмэгдлээ');
              setOilOpen(false);
              onRefresh();
            }}
          >
            <Form.Item name="changed_at" rules={[{ required: true }]} {...dateFormItemProps()}>
              <DatePicker format={DATE_FORMAT} />
            </Form.Item>
            <Form.Item name="motor_hours_at_change"><InputNumber placeholder="Мото цаг" min={0} /></Form.Item>
            <Form.Item name="oil_type"><Input placeholder="Тосны нэр" /></Form.Item>
            <Form.Item name="quantity_liters"><InputNumber placeholder="Литр" min={0} /></Form.Item>
            <Button type="primary" htmlType="submit">Хадгалах</Button>
            <Button onClick={() => setOilOpen(false)}>Болих</Button>
          </Form>
        )}
        <Table size="small" rowKey="id" pagination={false} dataSource={item.oilChanges || []} columns={oilColumns} locale={{ emptyText: 'Түүх байхгүй' }} />
      </Card>
    </div>
  );
}

/* ——— Гэрчилгээ ——— */
export function CertificateTab({ item, onSaved }: { item: EquipmentItem; onSaved: (i: EquipmentItem) => void }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      tech_certificate: item.tech_certificate,
      certificate_number: item.certificate_number,
      certificate_expiry: item.certificate_expiry ? dayjs(item.certificate_expiry) : undefined,
      owner_name: item.owner_name,
      purchase_document: item.purchase_document,
      certificate_notes: item.certificate_notes,
    });
  }, [item, form]);

  return (
    <Card
      size="small"
      title={
        <Space>
          <span>Гэрчилгээ</span>
          <Tag color={expiryTone(item.certificate_expiry)}>
            {item.certificate_expiry || 'хугацаа'}
          </Tag>
        </Space>
      }
    >
      <SectionSaveBar
        saving={saving}
        hint="Техникийн гэрчилгээ, эзэмшигч, дуусах огноо"
        onSave={async () => {
          try {
            setSaving(true);
            await saveFormSection(item.id, form, ['certificate_expiry'], onSaved);
          } catch (e) {
            if (e && typeof e === 'object' && 'errorFields' in e) return;
            message.error(e instanceof Error ? e.message : 'Алдаа');
          } finally {
            setSaving(false);
          }
        }}
      />
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col xs={24} sm={12}><Form.Item name="tech_certificate" label="Техникийн гэрчилгээ"><Input /></Form.Item></Col>
          <Col xs={24} sm={12}><Form.Item name="certificate_number" label="Дугаар"><Input /></Form.Item></Col>
          <Col xs={24} sm={8}>
            <Form.Item name="certificate_expiry" label="Дуусах огноо" {...dateFormItemProps()}>
              <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}><Form.Item name="owner_name" label="Эзэмшигч"><Input /></Form.Item></Col>
          <Col xs={24} sm={8}><Form.Item name="purchase_document" label="Худалдан авсан баримт"><Input /></Form.Item></Col>
          <Col span={24}><Form.Item name="certificate_notes" label="Тэмдэглэл"><Input /></Form.Item></Col>
        </Row>
      </Form>
    </Card>
  );
}

/* ——— Бусад бичиг баримт (+ татвар) ——— */
export function OtherDocsTab({ item, onSaved, onRefresh }: { item: EquipmentItem; onSaved: (i: EquipmentItem) => void; onRefresh: () => void }) {
  const [taxForm] = Form.useForm();
  const [docForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [docOpen, setDocOpen] = useState(false);

  useEffect(() => {
    taxForm.setFieldsValue({
      road_tax_amount: item.road_tax_amount,
      atboyahat_amount: item.atboyahat_amount,
      air_pollution_fee: item.air_pollution_fee,
      transaction_fee: item.transaction_fee,
      tax_period: item.tax_period,
      tax_paid: item.tax_paid,
    });
  }, [item, taxForm]);

  const docColumns: ColumnsType<EquipmentDocRecord> = [
    { title: 'Төрөл', dataIndex: 'doc_type', width: 100 },
    { title: 'Нэр', dataIndex: 'name' },
    { title: 'Дугаар', dataIndex: 'number', width: 120 },
    { title: 'Дүн', dataIndex: 'amount', width: 100, render: (v) => (v != null ? fmt(v) : '—') },
    {
      title: 'Дуусах',
      dataIndex: 'expires_at',
      width: 120,
      render: (v) => (v ? <Tag color={expiryTone(v)}>{v}</Tag> : '—'),
    },
    { title: 'Байгууллага', dataIndex: 'issuer', ellipsis: true },
    {
      title: '',
      width: 48,
      render: (_, r) => (
        <Popconfirm
          title="Устгах?"
          onConfirm={async () => {
            await fetch(`${EQUIPMENT_API}/${item.id}/documents/${r.id}`, { method: 'DELETE' });
            onRefresh();
          }}
        >
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card size="small" title="Татвар" style={{ marginBottom: 16 }}>
        <SectionSaveBar
          saving={saving}
          hint="Зам ашиглалт, АТБӨЯХАТ, агаарын бохирдол…"
          onSave={async () => {
            try {
              setSaving(true);
              await saveFormSection(item.id, taxForm, [], onSaved);
            } catch (e) {
              if (e && typeof e === 'object' && 'errorFields' in e) return;
              message.error(e instanceof Error ? e.message : 'Алдаа');
            } finally {
              setSaving(false);
            }
          }}
        />
        <Form form={taxForm} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} sm={12}><Form.Item name="road_tax_amount" label="Зам ашиглалтын татвар ₮"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="atboyahat_amount" label="АТБӨЯХАТ ₮"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="air_pollution_fee" label="Агаарын бохирдлын төлбөр ₮"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="transaction_fee" label="Гүйлгээний хураамж ₮"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="tax_period" label="Он, сар"><Input placeholder="2026-03" /></Form.Item></Col>
            <Col xs={24} sm={12}><Form.Item name="tax_paid" label="Төлсөн эсэх" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
        </Form>
      </Card>

      <Card
        size="small"
        title="Бусад бичиг баримт"
        extra={
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              docForm.resetFields();
              docForm.setFieldsValue({ doc_type: 'other' });
              setDocOpen(true);
            }}
          >
            Нэмэх
          </Button>
        }
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Импортын гэрчилгээ, паспорт гэх мэт — мөр бүрт нэмнэ
        </Text>
        {docOpen && (
          <Form
            form={docForm}
            layout="vertical"
            style={{ marginBottom: 12 }}
            onFinish={async (v) => {
              await postJson(`${EQUIPMENT_API}/${item.id}/documents`, {
                ...v,
                expires_at: dayjs.isDayjs(v.expires_at) ? v.expires_at.format(DATE_FORMAT) : v.expires_at,
              });
              message.success('Нэмэгдлээ');
              setDocOpen(false);
              onRefresh();
            }}
          >
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="doc_type" label="Төрөл" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'certificate', label: 'Гэрчилгээ' },
                      { value: 'tax', label: 'Татвар' },
                      { value: 'other', label: 'Бусад' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={8}><Form.Item name="name" label="Нэр" rules={[{ required: true }]}><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name="number" label="Дугаар"><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name="amount" label="Дүн"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
              <Col span={8}>
                <Form.Item name="expires_at" label="Дуусах" {...dateFormItemProps()}>
                  <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}><Form.Item name="issuer" label="Байгууллага"><Input /></Form.Item></Col>
            </Row>
            <Space>
              <Button type="primary" htmlType="submit">Хадгалах</Button>
              <Button onClick={() => setDocOpen(false)}>Болих</Button>
            </Space>
          </Form>
        )}
        <Table size="small" rowKey="id" pagination={false} dataSource={item.documents || []} columns={docColumns} locale={{ emptyText: 'Баримт байхгүй' }} />
      </Card>
    </div>
  );
}

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
