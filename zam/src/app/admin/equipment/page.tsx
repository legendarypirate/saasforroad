'use client';

import React, { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Popconfirm,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  PlusOutlined,
  DollarOutlined,
  StopOutlined,
  UploadOutlined,
} from '@/components/admin/icons';
import { RActionButton, RPageToolbar, RSearch, RTableActions } from '@/components/r';
import EquipmentFormDrawer from '@/components/EquipmentFormDrawer';
import {
  EQUIPMENT_API,
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  expiryTone,
  latestInsurance,
  fetchEquipmentCategories,
  type EquipmentCategory,
  type EquipmentItem,
  type EquipmentStatus,
} from '@/lib/equipment';
import { tenantHeaders } from '@/lib/tenant';
import {
  extractEquipmentFromCertificate,
  type EquipmentPrefill,
} from '@/lib/visionEquipment';

const { Text } = Typography;

function EquipmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');
  const certFileRef = useRef<HTMLInputElement>(null);

  const [list, setList] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [rentingId, setRentingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [prefill, setPrefill] = useState<EquipmentPrefill | null>(null);
  const [scanning, setScanning] = useState(false);
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
      const res = await fetch(`${EQUIPMENT_API}?${params}`, {
        headers: tenantHeaders(),
      });
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

  const openCreate = () => {
    setEditing(null);
    setPrefill(null);
    setFormOpen(true);
  };

  const handleCertificateUpload = async (file: File) => {
    setScanning(true);
    try {
      const data = await extractEquipmentFromCertificate(file);
      setEditing(null);
      setPrefill(data);
      setFormOpen(true);
      message.success('Гэрчилгээнээс мэдээлэл танигдлаа — формыг шалгаад хадгална уу');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Зураг таних амжилтгүй');
    } finally {
      setScanning(false);
      if (certFileRef.current) certFileRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`${EQUIPMENT_API}/${id}`, {
      method: 'DELETE',
      headers: tenantHeaders(),
    });
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
        headers: tenantHeaders({ 'Content-Type': 'application/json' }),
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
          : 'Түрээсийн жагсаалтаас хаслаа',
      );
      setList((prev) =>
        prev.map((row) =>
          row.id === record.id
            ? { ...row, ...(result.data as EquipmentItem) }
            : row,
        ),
      );
    } catch {
      message.error('Түрээсийн төлөв солиход алдаа');
    } finally {
      setRentingId(null);
    }
  };

  const columns: ColumnsType<EquipmentItem> = [
    {
      title: '№',
      key: 'index',
      width: 56,
      render: (_v, _r, index) => index + 1,
    },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 118,
      render: (_, record) => (
        <RTableActions>
          <RActionButton
            preset="view"
            onClick={() => router.push(`/admin/equipment/${record.id}`)}
          />
          <RActionButton
            preset="edit"
            onClick={() => {
              setPrefill(null);
              setEditing(record);
              setFormOpen(true);
            }}
          />
          <Popconfirm title="Устгах уу?" onConfirm={() => handleDelete(record.id)}>
            <span>
              <RActionButton preset="delete" />
            </span>
          </Popconfirm>
        </RTableActions>
      ),
    },
    {
      title: 'Улсын дугаар',
      dataIndex: 'registration_number',
      width: 120,
      render: (v) => v || '—',
    },
    {
      title: 'Дотоод №',
      dataIndex: 'asset_no',
      width: 100,
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
              {[r.model, r.serial_number].filter(Boolean).join(' · ') || '—'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Марк / модель',
      key: 'model',
      width: 140,
      render: (_, r) => r.model || '—',
    },
    {
      title: 'Ангилал',
      key: 'equipmentCategory',
      width: 130,
      render: (_, r) => r.equipmentCategory?.name || '—',
    },
    {
      title: 'Талбай',
      dataIndex: 'site',
      width: 130,
      render: (v) => v || '—',
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
      width: 130,
      render: (_v, record) => {
        const rentable = record.is_rentable === true;
        return (
          <Button
            size="small"
            type={rentable ? 'default' : 'primary'}
            danger={rentable}
            icon={rentable ? <StopOutlined /> : <DollarOutlined />}
            loading={rentingId === record.id}
            onClick={() => setRentable(record, !rentable)}
          >
            {rentable ? 'Хасах' : 'Түрээслэх'}
          </Button>
        );
      },
    },
    {
      title: 'Даатгал',
      dataIndex: 'insurances',
      width: 120,
      render: (_v, r) => {
        const ins = latestInsurance(r);
        return ins?.expiry || ins?.status ? (
          <Tag color={expiryTone(ins?.expiry)}>{ins?.status || ins?.expiry}</Tag>
        ) : (
          '—'
        );
      },
    },
  ];

  return (
    <div>
      <RPageToolbar
        title="Техник болон ангиллын бүртгэл"
        actions={
          <>
            <input
              ref={certFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleCertificateUpload(f);
              }}
            />
            <Button
              icon={<UploadOutlined />}
              loading={scanning}
              disabled={scanning}
              onClick={() => certFileRef.current?.click()}
            >
              {scanning ? 'Таниж байна…' : 'Гэрчилгээнээс'}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              + Техник бүртгэх
            </Button>
          </>
        }
        search={
          <RSearch
            showButton
            value={q}
            onChange={setQ}
            onSearch={() => fetchList()}
            placeholder="Хайлт хийх"
            containerClassName="w-full"
          />
        }
        filters={
          <>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Ангилал"
              value={categoryId}
              onChange={(v) => setCategoryId(v)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              style={{ minWidth: 150 }}
            />
            <Select
              allowClear
              placeholder="Төлөв"
              value={status}
              onChange={setStatus}
              options={Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              style={{ minWidth: 130 }}
            />
            <Select
              allowClear
              placeholder="Түрээс"
              value={rentableFilter}
              onChange={setRentableFilter}
              options={[
                { value: 'true', label: 'Түрээслэх' },
                { value: 'false', label: 'Түрээсгүй' },
              ]}
              style={{ minWidth: 130 }}
            />
          </>
        }
      />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        pagination={{ pageSize: 30, showSizeChanger: true }}
        scroll={{ x: 1280 }}
      />

      <EquipmentFormDrawer
        open={formOpen}
        editing={editing}
        prefill={prefill}
        onClose={() => {
          setFormOpen(false);
          setPrefill(null);
        }}
        onSaved={(item) => {
          message.success(
            editing ? 'Хадгалагдлаа' : 'Бүртгэгдлээ — дэлгэрэнгүй рүү шилжиж байна',
          );
          setPrefill(null);
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
