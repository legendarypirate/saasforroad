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
  DollarOutlined,
  StopOutlined,
} from '@/components/admin/icons';
import EquipmentFormDrawer from '@/components/EquipmentFormDrawer';
import {
  EQUIPMENT_API,
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  expiryTone,
  fetchEquipmentCategories,
  type EquipmentCategory,
  type EquipmentItem,
  type EquipmentStatus,
} from '@/lib/equipment';

const { Text } = Typography;

function EquipmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');

  const [list, setList] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [rentingId, setRentingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [rentableFilter, setRentableFilter] = useState<string | undefined>();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      if (categoryId) params.set('equipment_category_id', String(categoryId));
      if (rentableFilter) params.set('is_rentable', rentableFilter);
      const res = await fetch(`${EQUIPMENT_API}?${params}`);
      const result = await res.json();
      if (result.success) setList(result.data);
      else message.error(result.message || 'Алдаа');
    } catch {
      message.error('Жагсаалт ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [q, status, categoryId, rentableFilter]);

  useEffect(() => {
    document.title = 'Техник';
    fetchEquipmentCategories(true)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
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

  const setRentable = async (record: EquipmentItem, next: boolean) => {
    setRentingId(record.id);
    try {
      const res = await fetch(`${EQUIPMENT_API}/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_rentable: next,
          ...(next && record.status === 'in_service' ? { status: 'available' } : {}),
        }),
      });
      const result = await res.json();
      if (!result.success) {
        message.error(result.message || 'Алдаа');
        return;
      }
      message.success(
        next
          ? 'Түрээслэх жагсаалтад нэмэгдлээ (Дата → Техник)'
          : 'Түрээсийн жагсаалтаас хаслаа'
      );
      setList((prev) =>
        prev.map((row) =>
          row.id === record.id
            ? { ...row, ...(result.data as EquipmentItem) }
            : row
        )
      );
    } catch {
      message.error('Түрээсийн төлөв солиход алдаа');
    } finally {
      setRentingId(null);
    }
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
      title: 'Ангилал',
      key: 'equipmentCategory',
      width: 130,
      render: (_, r) => r.equipmentCategory?.name || '—',
    },
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
      title: 'Түрээс',
      dataIndex: 'is_rentable',
      width: 110,
      render: (v: boolean | undefined) =>
        v === true ? <Tag color="green">Тийм</Tag> : <Tag>Үгүй</Tag>,
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
      width: 320,
      fixed: 'right',
      render: (_, record) => {
        const rentable = record.is_rentable === true;
        return (
          <Space wrap>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/admin/equipment/${record.id}`)}
            >
              Дэлгэрэнгүй
            </Button>
            {rentable ? (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                loading={rentingId === record.id}
                onClick={() => setRentable(record, false)}
              >
                Түрээсээс хасах
              </Button>
            ) : (
              <Button
                size="small"
                type="default"
                icon={<DollarOutlined />}
                loading={rentingId === record.id}
                onClick={() => setRentable(record, true)}
                style={{ borderColor: '#21cda8', color: '#009778' }}
              >
                Түрээслэх
              </Button>
            )}
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
        );
      },
    },
  ];

  return (
    <div>
      <div
        className="mb-4 flex flex-nowrap items-center gap-3 overflow-x-auto rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
      >
        <div className="ml-auto flex flex-nowrap items-center gap-2">
          <div style={{ width: 200, flexShrink: 0 }}>
            <Input
              allowClear
              placeholder="Нэр, дугаар, VIN..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onPressEnter={fetchList}
            />
          </div>
          <div style={{ width: 160, flexShrink: 0 }}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Ангилал"
              value={categoryId}
              onChange={(v) => setCategoryId(v)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <div style={{ width: 140, flexShrink: 0 }}>
            <Select
              allowClear
              placeholder="Төлөв"
              value={status}
              onChange={setStatus}
              options={Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
          <div style={{ width: 150, flexShrink: 0 }}>
            <Select
              allowClear
              placeholder="Түрээс"
              value={rentableFilter}
              onChange={setRentableFilter}
              options={[
                { value: 'true', label: 'Түрээслэх' },
                { value: 'false', label: 'Түрээсгүй' },
              ]}
            />
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchList} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Шинээр бүртгэх
          </Button>
        </div>
      </div>

      <Card size="small">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          columns={columns}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1180 }}
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
