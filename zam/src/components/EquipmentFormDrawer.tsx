'use client';

import React, { useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from '@/components/admin/primitives';
import dayjs from 'dayjs';
import { DATE_FORMAT, dateFormItemProps } from '@/lib/userDates';
import {
  EQUIPMENT_API,
  EQUIPMENT_STATUS_LABELS,
  type EquipmentItem,
} from '@/lib/equipment';
import { WorkerSelect } from '@/components/equipment/WorkerSelect';

interface EquipmentFormDrawerProps {
  open: boolean;
  editing: EquipmentItem | null;
  onClose: () => void;
  /** Called after successful save with the saved record */
  onSaved: (item: EquipmentItem) => void;
}

/** Create / quick-edit: only Excel sheet «Ерөнхий» section A fields. */
export default function EquipmentFormDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: EquipmentFormDrawerProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        ...editing,
        import_date: editing.import_date ? dayjs(editing.import_date) : undefined,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: 'in_service',
        category: 'machine',
        unit: 'ширхэг',
        is_rentable: true,
        motor_hours: 0,
        default_daily_rate: 0,
      });
    }
  }, [open, editing, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload: Record<string, unknown> = {
        asset_no: values.asset_no || null,
        name: values.name,
        model: values.model || null,
        registration_number: values.registration_number || null,
        serial_number: values.serial_number || null,
        capacity: values.capacity || null,
        country_of_origin: values.country_of_origin || null,
        year_manufactured: values.year_manufactured || null,
        import_date: dayjs.isDayjs(values.import_date)
          ? values.import_date.format(DATE_FORMAT)
          : values.import_date || null,
        site: values.site || null,
        color: values.color || null,
        responsible_user_id: values.responsible_user_id ?? null,
        operator_user_id: values.operator_user_id ?? null,
        phone: values.phone || null,
        status: values.status,
        motor_hours: values.motor_hours ?? 0,
        category: values.category,
        unit: values.unit || 'ширхэг',
        default_daily_rate: values.default_daily_rate ?? 0,
        is_rentable: values.is_rentable !== false,
        notes: values.notes || null,
      };

      const url = editing ? `${EQUIPMENT_API}/${editing.id}` : EQUIPMENT_API;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Алдаа');
      onSaved(result.data);
      onClose();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      // message shown by caller or leave silent for validation
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editing ? 'Ерөнхий мэдээлэл засах' : 'Шинэ тоног бүртгэх'}
      width={560}
      open={open}
      onClose={onClose}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>Болих</Button>
          <Button type="primary" onClick={handleSave} loading={saving}>
            {editing ? 'Хадгалах' : 'Бүртгээд үргэлжлүүлэх'}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item name="asset_no" label="Дотоод дугаар">
              <Input placeholder="№ 24" />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item name="name" label="Техникийн нэр" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
              <Input placeholder="Асфальтбетон дэвсэгч" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="model" label="Марк / Модель">
              <Input placeholder="XCMG RP952" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="registration_number" label="Улсын дугаар">
              <Input placeholder="66-07УР" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="serial_number" label="Серийн / VIN">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="capacity" label="Хүчин чадал / Жин">
              <Input placeholder="29,500 кг" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="country_of_origin" label="Үйлдвэрлэсэн улс">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="year_manufactured" label="Үйлдвэрлэсэн он">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="import_date" label="Монголд орсон" {...dateFormItemProps()}>
              <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="site" label="Харьяалагдах талбай">
              <Input placeholder="Үлэмжийн зам" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="color" label="Өнгө">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="responsible_user_id" label="Хариуцагч">
              <WorkerSelect placeholder="Дотоод ажилтан сонгох" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="operator_user_id" label="Жолооч / Оператор">
              <WorkerSelect
                placeholder="Дотоод ажилтан сонгох"
                onChange={(id, worker) => {
                  form.setFieldsValue({ operator_user_id: id });
                  if (worker?.phone) form.setFieldsValue({ phone: worker.phone });
                }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="phone" label="Утас">
              <Input placeholder="Оператор сонгоход автоматаар" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="Одоогийн төлөв">
              <Select
                options={Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="motor_hours" label="Мото цаг / Гүйлт">
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="category" label="Ангилал">
              <Select
                options={[
                  { value: 'machine', label: 'Машин / тоног' },
                  { value: 'tool', label: 'Барилгын хэрэгсэл' },
                  { value: 'material', label: 'Материал' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="default_daily_rate" label="Өдрийн түрээс (₮)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="is_rentable" label="Түрээслэх боломжтой" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="notes" label="Тэмдэглэл">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
