'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { CheckOutlined, CloseOutlined, ReloadOutlined, StopOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface DeviceRow {
  id: number;
  user_id: number;
  device_id: string;
  device_name?: string | null;
  platform?: string | null;
  model?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  is_active: boolean;
  approved_at?: string | null;
  rejected_at?: string | null;
  review_note?: string | null;
  last_login_at?: string | null;
  createdAt: string;
  user?: { id: number; username: string; phone?: string; position?: string };
  approver?: { id: number; username: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Хүлээгдэж буй',
  approved: 'Зөвшөөрсөн',
  rejected: 'Татгалзсан',
  revoked: 'Цуцалсан',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  revoked: 'default',
};

export default function DeviceApprovalPage() {
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [search, setSearch] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revoke'>('approve');
  const [reviewNote, setReviewNote] = useState('');
  const [activeRow, setActiveRow] = useState<DeviceRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`${baseUrl}/api/devices${q}`);
      const json = await res.json();
      if (json.success) setRows(json.data || []);
    } catch (err) {
      console.error(err);
      message.error('Төхөөрөмжийн жагсаалт татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, statusFilter]);

  useEffect(() => {
    document.title = 'Төхөөрөмж баталгаажуулалт';
    fetchRows();
  }, [fetchRows]);

  const filteredRows = rows.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(row.device_name || '').toLowerCase().includes(q) ||
      String(row.device_id || '').toLowerCase().includes(q) ||
      String(row.user?.username || '').toLowerCase().includes(q) ||
      String(row.user?.phone || '').toLowerCase().includes(q)
    );
  });

  const openReview = (row: DeviceRow, action: 'approve' | 'reject' | 'revoke') => {
    setActiveRow(row);
    setReviewAction(action);
    setReviewNote('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!activeRow) return;
    setSubmitting(true);
    try {
      const endpoint =
        reviewAction === 'approve'
          ? 'approve'
          : reviewAction === 'reject'
            ? 'reject'
            : 'revoke';

      const res = await fetch(`${baseUrl}/api/devices/${activeRow.id}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_note: reviewNote.trim() || null }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(json.message || 'Амжилттай');
        setReviewOpen(false);
        fetchRows();
      } else {
        message.error(json.message || 'Алдаа гарлаа');
      }
    } catch (err) {
      console.error(err);
      message.error('Алдаа гарлаа');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<DeviceRow> = [
    {
      title: 'Ажилтан',
      key: 'user',
      width: 180,
      render: (_, row) => (
        <div>
          <Text strong>{row.user?.username || `#${row.user_id}`}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{row.user?.phone || '—'}</Text>
        </div>
      ),
    },
    {
      title: 'Төхөөрөмж',
      key: 'device',
      render: (_, row) => (
        <div>
          <Text>{row.device_name || '—'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.platform || '—'} · {row.model || '—'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Device ID',
      dataIndex: 'device_id',
      width: 220,
      ellipsis: true,
      render: (value: string) => <Text code style={{ fontSize: 11 }}>{value}</Text>,
    },
    {
      title: 'Төлөв',
      key: 'status',
      width: 150,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Tag color={STATUS_COLOR[row.status]}>{STATUS_LABEL[row.status] || row.status}</Tag>
          {row.is_active && <Tag color="blue">Идэвхтэй</Tag>}
        </Space>
      ),
    },
    {
      title: 'Сүүлд нэвтэрсэн',
      dataIndex: 'last_login_at',
      width: 150,
      render: (value?: string | null) =>
        value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—',
    },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, row) => (
        <Space size={4} wrap>
          {row.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => openReview(row, 'approve')}
              >
                Зөвшөөрөх
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => openReview(row, 'reject')}
              >
                Татгалзах
              </Button>
            </>
          )}
          {row.status === 'approved' && row.is_active && (
            <Button
              size="small"
              icon={<StopOutlined />}
              onClick={() => openReview(row, 'revoke')}
            >
              Цуцлах
            </Button>
          )}
          {row.status === 'approved' && !row.is_active && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => openReview(row, 'approve')}
            >
              Идэвхжүүлэх
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const reviewTitle =
    reviewAction === 'approve'
      ? 'Төхөөрөмж зөвшөөрөх'
      : reviewAction === 'reject'
        ? 'Төхөөрөмж татгалзах'
        : 'Төхөөрөмжийн эрх цуцлах';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Text type="secondary">
            Ажилтан шинэ төхөөрөмжөөр нэвтэрэхэд энд харагдана. Зөвхөн хамгийн сүүлд зөвшөөрөгдсөн төхөөрөмж ирц бүртгэнэ.
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchRows}>Шинэчлэх</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 180 }}
          options={[
            { value: 'pending', label: 'Хүлээгдэж буй' },
            { value: 'approved', label: 'Зөвшөөрсөн' },
            { value: 'rejected', label: 'Татгалзсан' },
            { value: 'revoked', label: 'Цуцалсан' },
            { value: '', label: 'Бүгд' },
          ]}
        />
        <Input.Search
          placeholder="Ажилтан, утас, төхөөрөмж..."
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filteredRows}
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      <Modal
        title={reviewTitle}
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        onOk={submitReview}
        confirmLoading={submitting}
        okText={reviewAction === 'approve' ? 'Зөвшөөрөх' : reviewAction === 'reject' ? 'Татгалзах' : 'Цуцлах'}
        cancelText="Болих"
        okButtonProps={{
          danger: reviewAction === 'reject' || reviewAction === 'revoke',
        }}
      >
        {activeRow && (
          <div style={{ marginBottom: 12 }}>
            <Text strong>{activeRow.user?.username}</Text>
            <br />
            <Text type="secondary">{activeRow.device_name} · {activeRow.platform}</Text>
            {reviewAction === 'approve' && (
              <p style={{ marginTop: 12, color: '#ad6800' }}>
                Зөвшөөрөхөд энэ төхөөрөмж идэвхтэй болж, тухайн ажилтны бусад төхөөрөмжүүд идэвхгүй болно.
              </p>
            )}
          </div>
        )}
        <Input.TextArea
          rows={3}
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder="Тайлбар (заавал биш)"
        />
      </Modal>
    </div>
  );
}
