'use client';

import React, { useState } from 'react';
import { Button, Col, Drawer, Form, Input, InputNumber, Row, Typography, Upload } from '@/components/admin/primitives';
type UploadFile = {
  uid: string;
  name: string;
  status?: 'done' | 'uploading' | 'error' | 'removed';
  url?: string;
  originFileObj?: File;
};
import { UploadOutlined } from '@/components/admin/icons';
import { assetUrl, EQUIPMENT_API, SIDE_LABELS, type EquipmentItem } from '@/lib/equipment';

const { Title } = Typography;

interface EquipmentFormDrawerProps {
  open: boolean;
  editing: EquipmentItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EquipmentFormDrawer({
  open,
  editing,
  onClose,
  onSaved,
}: EquipmentFormDrawerProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [fileLists, setFileLists] = useState<Record<string, UploadFile[]>>({});

  const resetFileLists = (item?: EquipmentItem | null) => {
    const lists: Record<string, UploadFile[]> = {};
    Object.keys(SIDE_LABELS).forEach((key) => {
      const path = item?.[key as keyof EquipmentItem] as string | undefined;
      lists[key] = path
        ? [{ uid: key, name: key, status: 'done', url: assetUrl(path) }]
        : [];
    });
    lists.certificate_image = item?.certificate_image
      ? [{ uid: 'cert', name: 'cert', status: 'done', url: assetUrl(item.certificate_image) }]
      : [];
    setFileLists(lists);
  };

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      form.setFieldsValue({
        name: editing.name,
        model: editing.model,
        registration_number: editing.registration_number,
        motor_hours: editing.motor_hours,
        notes: editing.notes,
      });
      resetFileLists(editing);
    } else {
      form.resetFields();
      resetFileLists(null);
    }
  }, [open, editing, form]);

  const appendFiles = (formData: FormData, key: string) => {
    const list = fileLists[key];
    if (list?.[0]?.originFileObj) {
      formData.append(key, list[0].originFileObj as File);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const formData = new FormData();
      formData.append('name', values.name);
      if (values.model) formData.append('model', values.model);
      if (values.registration_number) formData.append('registration_number', values.registration_number);
      if (values.motor_hours != null) formData.append('motor_hours', String(values.motor_hours));
      if (values.notes) formData.append('notes', values.notes);
      Object.keys(SIDE_LABELS).forEach((k) => appendFiles(formData, k));
      appendFiles(formData, 'certificate_image');

      const url = editing ? `${EQUIPMENT_API}/${editing.id}` : EQUIPMENT_API;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: formData });
      const result = await res.json();
      if (result.success) {
        onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const uploadButton = (field: string, label: string) => (
    <Upload
      listType="picture-card"
      fileList={fileLists[field] || []}
      maxCount={1}
      beforeUpload={() => false}
      onChange={({ fileList }) => setFileLists((prev) => ({ ...prev, [field]: fileList }))}
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
    <Drawer
      title={editing ? 'Тоног төхөөрөмж засах' : 'Тоног төхөөрөмж бүртгэх'}
      width={560}
      open={open}
      onClose={onClose}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Болих
          </Button>
          <Button type="primary" onClick={handleSave} loading={saving}>
            Хадгалах
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Нэр" name="name" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
          <Input placeholder="Жишээ: Экскаватор CAT 320" />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="Загвар" name="model">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Улсын дугаар" name="registration_number">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Одоогийн мот/цаг" name="motor_hours">
          <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
        </Form.Item>
        <Form.Item label="Тайлбар" name="notes">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Title level={5}>4 талын зураг</Title>
        <Row gutter={8}>
          {Object.entries(SIDE_LABELS).map(([key, label]) => (
            <Col span={12} key={key}>
              {uploadButton(key, label)}
            </Col>
          ))}
        </Row>
        <Title level={5} style={{ marginTop: 16 }}>
          Гэрчилгээний зураг
        </Title>
        {uploadButton('certificate_image', 'Гэрчилгээ')}
      </Form>
    </Drawer>
  );
}
