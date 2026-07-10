'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  ToolOutlined,
} from '@/components/admin/icons';
import EquipmentFormDrawer from '@/components/EquipmentFormDrawer';
import {
  EQUIPMENT_API,
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  expiryTone,
  type EquipmentItem,
  type EquipmentStatus,
} from '@/lib/equipment';

const { Title, Text } = Typography;

function EquipmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');

  const [list, setList] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      const res = await fetch(`${EQUIPMENT_API}?${params}`);
      const result = await res.json();
      if (result.success) setList(result.data);
      else message.error(result.message || 'Алдаа');
    } catch {
      message.error('Жагсаалт ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    document.title = 'Тоног төхөөрөмж';
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (highlightId) router.replace(`/admin/equipment/${highlightId}`);
  }, [highlightId, router]);

  const handleDelete = async (id: number) => {
    const res = await fetch(`${EQUIPMENT_API}/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      message.success('Устгагдлаа');
      fetchList();
    } else message.error(result.message || 'Алдаа');
  };

  const columns: ColumnsType<EquipmentItem> = [
    {
      title: 'Дотоод №',
      dataIndex: 'asset_no',
      width: 90,
      render: (v) => v || '—',
    },
    {
      title: 'Нэр',
      dataIndex: 'name',
      render: (t, r) => (
        <div>
          <Text strong>{t}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {[r.model, r.registration_number].filter(Boolean).join(' · ') || '—'}
            </Text>
          </div>
        </div>
      ),
    },
    { title: 'Талбай', dataIndex: 'site', width: 140, render: (v) => v || '—' },
    {
      title: 'Мот/цаг',
      dataIndex: 'motor_hours',
      width: 100,
      render: (v) => Number(v ?? 0).toLocaleString(),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 120,
      render: (v: EquipmentStatus) => (
        <Tag color={EQUIPMENT_STATUS_COLORS[v] || 'default'}>
          {EQUIPMENT_STATUS_LABELS[v] || v || '—'}
        </Tag>
      ),
    },
    {
      title: 'Даатгал',
      dataIndex: 'insurance_expiry',
      width: 120,
      render: (v, r) =>
        v || r.insurance_status ? (
          <Tag color={expiryTone(v)}>{r.insurance_status || v}</Tag>
        ) : (
          '—'
        ),
    },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/equipment/${record.id}`)}
          >
            Дэлгэрэнгүй
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              setFormOpen(true);
            }}
          />
          <Popconfirm title="Устгах уу?" onConfirm={() => handleDelete(record.id)}>
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
                Тоног төхөөрөмж
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                Эхлээд ерөнхий мэдээлэл бүртгэ → Дэлгэрэнгүй дээр Excel-ийн tab-уудаар нэмнэ
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

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            allowClear
            placeholder="Нэр, дугаар, VIN, талбай..."
            style={{ width: 240 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPressEnter={fetchList}
          />
          <Select
            allowClear
            placeholder="Төлөв"
            style={{ width: 160 }}
            value={status}
            onChange={setStatus}
            options={Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchList}>
            Шинэчлэх
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          columns={columns}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <EquipmentFormDrawer
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(item) => {
          message.success(editing ? 'Хадгалагдлаа' : 'Бүртгэгдлээ — дэлгэрэнгүй рүү шилжиж байна');
          if (!editing) {
            router.push(`/admin/equipment/${item.id}`);
          } else {
            fetchList();
          }
        }}
      />
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
