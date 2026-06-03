'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  Collapse,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import EquipmentDetailPanel, { EquipmentSummaryLabel } from '@/components/EquipmentDetailPanel';
import EquipmentFormDrawer from '@/components/EquipmentFormDrawer';
import { EQUIPMENT_API, type EquipmentItem } from '@/lib/equipment';

const { Title, Text } = Typography;

function EquipmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');

  const [list, setList] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [oilDrawerOpen, setOilDrawerOpen] = useState(false);
  const [oilEquipmentId, setOilEquipmentId] = useState<number | null>(null);
  const [oilForm] = Form.useForm();
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(EQUIPMENT_API);
      const result = await res.json();
      if (result.success) {
        setList(result.data);
        if (highlightId) {
          setActiveKeys([highlightId]);
        }
      }
    } catch {
      message.error('Жагсаалт ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [highlightId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = async (id: number) => {
    const res = await fetch(`${EQUIPMENT_API}/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      message.success('Устгагдлаа');
      fetchList();
    } else {
      message.error(result.message || 'Алдаа гарлаа');
    }
  };

  const openOilDrawer = (id: number) => {
    setOilEquipmentId(id);
    oilForm.resetFields();
    oilForm.setFieldsValue({ changed_at: dayjs() });
    setOilDrawerOpen(true);
  };

  const saveOilChange = async () => {
    if (!oilEquipmentId) return;
    const values = await oilForm.validateFields();
    const res = await fetch(`${EQUIPMENT_API}/${oilEquipmentId}/oil_change`, {
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
      message.success('Тосны түүх нэмэгдлээ');
      setOilDrawerOpen(false);
      fetchList();
    }
  };

  const deleteOil = async (equipmentId: number, oilId: number) => {
    const res = await fetch(`${EQUIPMENT_API}/${equipmentId}/oil_change/${oilId}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (result.success) {
      message.success('Түүх устгагдлаа');
      fetchList();
    }
  };

  const tableColumns: ColumnsType<EquipmentItem> = [
    { title: 'Нэр', dataIndex: 'name', render: (t, r) => <Text strong>{t}</Text> },
    { title: 'Загвар', dataIndex: 'model', render: (v) => v || '—' },
    { title: 'Улсын дугаар', dataIndex: 'registration_number', render: (v) => v || '—' },
    {
      title: 'Мот/цаг',
      dataIndex: 'motor_hours',
      render: (v) => Number(v ?? 0).toLocaleString(),
    },
    {
      title: 'Төсөл',
      key: 'projects',
      render: (_, r) =>
        r.projects?.length ? (
          <Space wrap size={4}>
            {r.projects.map((p) => (
              <Tag
                key={p.id}
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/admin/project/${p.id}`)}
              >
                {p.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              setFormOpen(true);
            }}
          />
          <Popconfirm title="Бүр мөсөн устгах уу?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        bordered={false}
        style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 60%, #64748b 100%)',
          borderRadius: 16,
        }}
        styles={{ body: { padding: '24px 28px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Space>
            <ToolOutlined style={{ fontSize: 32, color: '#fff' }} />
            <div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                Тоног төхөөрөмжийн бүртгэл
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                Нэгдсэн сан — төсөлд холбож ашиглана
              </Text>
            </div>
          </Space>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            style={{ background: '#d97706', borderColor: '#d97706' }}
          >
            Шинээр бүртгэх
          </Button>
        </div>
      </Card>

      <Spin spinning={loading}>
        <Card title="Жагсаалт" style={{ marginBottom: 24 }}>
          <Table
            rowKey="id"
            dataSource={list}
            columns={tableColumns}
            pagination={{ pageSize: 10 }}
            size="middle"
            onRow={(record) => ({
              onClick: () => setActiveKeys([String(record.id)]),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>

        <Card title="Дэлгэрэнгүй">
          {list.length === 0 ? (
            <Text type="secondary">Бүртгэл хоосон байна</Text>
          ) : (
            <Collapse
              activeKey={activeKeys}
              onChange={(keys) => setActiveKeys(keys as string[])}
              items={list.map((item) => ({
                key: String(item.id),
                label: <EquipmentSummaryLabel item={item} />,
                extra: (
                  <Space onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        setEditing(item);
                        setFormOpen(true);
                      }}
                    >
                      Засах
                    </Button>
                  </Space>
                ),
                children: (
                  <EquipmentDetailPanel
                    item={item}
                    onAddOil={openOilDrawer}
                    onDeleteOil={deleteOil}
                  />
                ),
              }))}
            />
          )}
        </Card>
      </Spin>

      <EquipmentFormDrawer
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          message.success('Хадгалагдлаа');
          fetchList();
        }}
      />

      <Drawer
        title="Тос, масло сольсон түүх"
        width={420}
        open={oilDrawerOpen}
        onClose={() => setOilDrawerOpen(false)}
        footer={
          <Button type="primary" onClick={saveOilChange}>
            Нэмэх
          </Button>
        }
      >
        <Form form={oilForm} layout="vertical">
          <Form.Item label="Солсон огноо" name="changed_at" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Тосны төрөл" name="oil_type">
            <Input />
          </Form.Item>
          <Form.Item label="Мот/цаг" name="motor_hours_at_change">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="Литр" name="quantity_liters">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="Хэн сольсон" name="changed_by">
            <Input />
          </Form.Item>
          <Form.Item label="Тайлбар" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default function EquipmentPage() {
  return (
    <Suspense fallback={<Spin style={{ display: 'block', margin: '48px auto' }} />}>
      <EquipmentPageContent />
    </Suspense>
  );
}
