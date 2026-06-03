'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const baseUrl = process.env.NEXT_PUBLIC_API_URL;

export interface OilChangeRecord {
  id: number;
  equipment_id: number;
  changed_at: string;
  oil_type?: string;
  motor_hours_at_change?: number;
  quantity_liters?: number;
  notes?: string;
  changed_by?: string;
}

export interface ProjectEquipment {
  id: number;
  project_id: number;
  name: string;
  model?: string;
  registration_number?: string;
  motor_hours?: number;
  photo_front?: string;
  photo_back?: string;
  photo_left?: string;
  photo_right?: string;
  certificate_image?: string;
  notes?: string;
  oilChanges?: OilChangeRecord[];
}

const SIDE_LABELS: Record<string, string> = {
  photo_front: 'Урд',
  photo_back: 'Хойд',
  photo_left: 'Зүүн',
  photo_right: 'Баруун',
};

function assetUrl(relativePath?: string | null) {
  if (!relativePath) return undefined;
  return `${baseUrl}/assets/${relativePath}`;
}

interface ProjectEquipmentTabProps {
  projectId: string;
}

export default function ProjectEquipmentTab({ projectId }: ProjectEquipmentTabProps) {
  const [equipment, setEquipment] = useState<ProjectEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [equipDrawerOpen, setEquipDrawerOpen] = useState(false);
  const [oilDrawerOpen, setOilDrawerOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<ProjectEquipment | null>(null);
  const [oilEquipmentId, setOilEquipmentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [equipForm] = Form.useForm();
  const [oilForm] = Form.useForm();
  const [fileLists, setFileLists] = useState<Record<string, UploadFile[]>>({});

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/project_equipment?project_id=${projectId}`);
      const result = await res.json();
      if (result.success) {
        setEquipment(result.data);
      }
    } catch {
      message.error('Тоног төхөөрөмж ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const resetFileLists = (item?: ProjectEquipment | null) => {
    const lists: Record<string, UploadFile[]> = {};
    Object.keys(SIDE_LABELS).forEach((key) => {
      const path = item?.[key as keyof ProjectEquipment] as string | undefined;
      lists[key] = path
        ? [{ uid: key, name: key, status: 'done', url: assetUrl(path) }]
        : [];
    });
    lists.certificate_image = item?.certificate_image
      ? [{ uid: 'cert', name: 'cert', status: 'done', url: assetUrl(item.certificate_image) }]
      : [];
    setFileLists(lists);
  };

  const openAddEquipment = () => {
    setEditingEquipment(null);
    equipForm.resetFields();
    resetFileLists(null);
    setEquipDrawerOpen(true);
  };

  const openEditEquipment = (item: ProjectEquipment) => {
    setEditingEquipment(item);
    equipForm.setFieldsValue({
      name: item.name,
      model: item.model,
      registration_number: item.registration_number,
      motor_hours: item.motor_hours,
      notes: item.notes,
    });
    resetFileLists(item);
    setEquipDrawerOpen(true);
  };

  const appendFiles = (formData: FormData, key: string) => {
    const list = fileLists[key];
    if (list?.[0]?.originFileObj) {
      formData.append(key, list[0].originFileObj as File);
    }
  };

  const handleSaveEquipment = async () => {
    try {
      const values = await equipForm.validateFields();
      setSaving(true);

      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('name', values.name);
      if (values.model) formData.append('model', values.model);
      if (values.registration_number) formData.append('registration_number', values.registration_number);
      if (values.motor_hours != null) formData.append('motor_hours', String(values.motor_hours));
      if (values.notes) formData.append('notes', values.notes);

      Object.keys(SIDE_LABELS).forEach((k) => appendFiles(formData, k));
      appendFiles(formData, 'certificate_image');

      const url = editingEquipment
        ? `${baseUrl}/api/project_equipment/${editingEquipment.id}`
        : `${baseUrl}/api/project_equipment`;
      const method = editingEquipment ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      const result = await res.json();

      if (result.success) {
        message.success(editingEquipment ? 'Шинэчлэгдлээ' : 'Нэмэгдлээ');
        setEquipDrawerOpen(false);
        fetchEquipment();
      } else {
        message.error(result.message || 'Алдаа гарлаа');
      }
    } catch {
      message.error('Форм бөглөнө үү');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEquipment = async (id: number) => {
    try {
      const res = await fetch(`${baseUrl}/api/project_equipment/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        message.success('Устгагдлаа');
        fetchEquipment();
      }
    } catch {
      message.error('Устгахад алдаа гарлаа');
    }
  };

  const openOilDrawer = (equipmentId: number) => {
    setOilEquipmentId(equipmentId);
    oilForm.resetFields();
    oilForm.setFieldsValue({ changed_at: dayjs() });
    setOilDrawerOpen(true);
  };

  const handleSaveOilChange = async () => {
    if (!oilEquipmentId) return;
    try {
      const values = await oilForm.validateFields();
      setSaving(true);
      const res = await fetch(`${baseUrl}/api/project_equipment/${oilEquipmentId}/oil_change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changed_at: values.changed_at.format('YYYY-MM-DD'),
          oil_type: values.oil_type,
          motor_hours_at_change: values.motor_hours_at_change,
          quantity_liters: values.quantity_liters,
          notes: values.notes,
          changed_by: values.changed_by,
        }),
      });
      const result = await res.json();
      if (result.success) {
        message.success('Тосны сольсон түүх нэмэгдлээ');
        setOilDrawerOpen(false);
        fetchEquipment();
      } else {
        message.error(result.message || 'Алдаа гарлаа');
      }
    } catch {
      message.error('Форм бөглөнө үү');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOilChange = async (equipmentId: number, oilId: number) => {
    try {
      const res = await fetch(
        `${baseUrl}/api/project_equipment/${equipmentId}/oil_change/${oilId}`,
        { method: 'DELETE' }
      );
      const result = await res.json();
      if (result.success) {
        message.success('Түүх устгагдлаа');
        fetchEquipment();
      }
    } catch {
      message.error('Устгахад алдаа гарлаа');
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

  const oilColumns = (item: ProjectEquipment) => [
    {
      title: 'Огноо',
      dataIndex: 'changed_at',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
    },
    { title: 'Тосны төрөл', dataIndex: 'oil_type' },
    {
      title: 'Мот/цаг',
      dataIndex: 'motor_hours_at_change',
      render: (v: number) => (v != null ? Number(v).toLocaleString() : '—'),
    },
    {
      title: 'Литр',
      dataIndex: 'quantity_liters',
      render: (v: number) => (v != null ? v : '—'),
    },
    { title: 'Хэн сольсон', dataIndex: 'changed_by', ellipsis: true },
    { title: 'Тайлбар', dataIndex: 'notes', ellipsis: true },
    {
      title: '',
      key: 'action',
      width: 48,
      render: (_: unknown, record: OilChangeRecord) => (
        <Popconfirm title="Устгах уу?" onConfirm={() => handleDeleteOilChange(item.id, record.id)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            Тоног төхөөрөмж
          </Title>
          <Text type="secondary">{equipment.length} бүртгэлтэй</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddEquipment}>
          Тоног төхөөрөмж нэмэх
        </Button>
      </div>

      {equipment.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            Тоног төхөөрөмж бүртгэгдээгүй байна
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddEquipment}>
            Эхнийхийг нэмэх
          </Button>
        </Card>
      ) : (
        <Collapse
          accordion={false}
          items={equipment.map((item) => ({
            key: String(item.id),
            label: (
              <Space wrap>
                <Text strong>{item.name}</Text>
                {item.model && <Tag>{item.model}</Tag>}
                {item.registration_number && (
                  <Tag color="blue">{item.registration_number}</Tag>
                )}
                <Tag color="orange">
                  Мот/цаг: {Number(item.motor_hours ?? 0).toLocaleString()}
                </Tag>
                <Tag color="green">Тос: {(item.oilChanges?.length ?? 0)} удаа</Tag>
              </Space>
            ),
            extra: (
              <Space onClick={(e) => e.stopPropagation()}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => openEditEquipment(item)}
                />
                <Popconfirm title="Устгах уу?" onConfirm={() => handleDeleteEquipment(item.id)}>
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
            children: (
              <div>
                <Title level={5} style={{ marginTop: 0 }}>
                  4 талын зураг
                </Title>
                <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                  {(['photo_front', 'photo_back', 'photo_left', 'photo_right'] as const).map(
                    (key) => (
                      <Col xs={12} sm={6} key={key}>
                        <Card size="small" title={SIDE_LABELS[key]} styles={{ body: { padding: 8 } }}>
                          {item[key] ? (
                            <Image
                              src={assetUrl(item[key])}
                              alt={SIDE_LABELS[key]}
                              style={{ width: '100%', maxHeight: 140, objectFit: 'cover' }}
                            />
                          ) : (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Зураг байхгүй
                            </Text>
                          )}
                        </Card>
                      </Col>
                    )
                  )}
                </Row>

                <Title level={5}>Гэрчилгээний зураг</Title>
                <Row style={{ marginBottom: 20 }}>
                  <Col xs={24} sm={12} md={8}>
                    {item.certificate_image ? (
                      <Image
                        src={assetUrl(item.certificate_image)}
                        alt="Гэрчилгээ"
                        style={{ maxHeight: 200 }}
                      />
                    ) : (
                      <Text type="secondary">Гэрчилгээний зураг байхгүй</Text>
                    )}
                  </Col>
                </Row>

                {item.notes && (
                  <>
                    <Title level={5}>Тайлбар</Title>
                    <Text style={{ display: 'block', marginBottom: 16 }}>{item.notes}</Text>
                  </>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Title level={5} style={{ margin: 0 }}>
                    Тос, масло сольсон түүх
                  </Title>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => openOilDrawer(item.id)}
                  >
                    Сольсон түүх нэмэх
                  </Button>
                </div>
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={item.oilChanges ?? []}
                  columns={oilColumns(item)}
                  locale={{ emptyText: 'Тос сольсон түүх байхгүй' }}
                />
              </div>
            ),
          }))}
        />
      )}

      <Drawer
        title={editingEquipment ? 'Тоног төхөөрөмж засах' : 'Тоног төхөөрөмж нэмэх'}
        width={560}
        open={equipDrawerOpen}
        onClose={() => setEquipDrawerOpen(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setEquipDrawerOpen(false)} style={{ marginRight: 8 }}>
              Болих
            </Button>
            <Button type="primary" onClick={handleSaveEquipment} loading={saving}>
              Хадгалах
            </Button>
          </div>
        }
      >
        <Form form={equipForm} layout="vertical">
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

      <Drawer
        title="Тос, масло сольсон түүх нэмэх"
        width={420}
        open={oilDrawerOpen}
        onClose={() => setOilDrawerOpen(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setOilDrawerOpen(false)} style={{ marginRight: 8 }}>
              Болих
            </Button>
            <Button type="primary" onClick={handleSaveOilChange} loading={saving}>
              Нэмэх
            </Button>
          </div>
        }
      >
        <Form form={oilForm} layout="vertical">
          <Form.Item
            label="Солсон огноо"
            name="changed_at"
            rules={[{ required: true, message: 'Огноо сонгоно уу' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="Тосны төрөл" name="oil_type">
            <Input placeholder="Жишээ: 15W-40 дизель" />
          </Form.Item>
          <Form.Item label="Мот/цаг (солиход)" name="motor_hours_at_change">
            <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
          </Form.Item>
          <Form.Item label="Литр" name="quantity_liters">
            <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
          </Form.Item>
          <Form.Item label="Хэн сольсон" name="changed_by">
            <Input />
          </Form.Item>
          <Form.Item label="Тайлбар" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </Spin>
  );
}
