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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface LeaveRow {
  id: number;
  user_id: number;
  leave_type: 'paid' | 'unpaid';
  start_date: string;
  end_date: string;
  start_at?: string | null;
  end_at?: string | null;
  hours?: number | null;
  total_hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  review_note?: string | null;
  reviewed_at?: string | null;
  createdAt: string;
  user?: { id: number; username: string; phone?: string; email?: string };
  reviewer?: { id: number; username: string } | null;
}

function formatLeaveDateTime(value?: string | null, fallback?: string) {
  if (value) return dayjs(value).format('YYYY-MM-DD HH:mm');
  if (fallback) return dayjs(fallback).format('YYYY-MM-DD');
  return '—';
}

function formatLeaveRange(row: LeaveRow) {
  if (row.start_at && row.end_at) {
    return `${formatLeaveDateTime(row.start_at)} → ${formatLeaveDateTime(row.end_at)}`;
  }
  return `${formatLeaveDateTime(null, row.start_date)} → ${formatLeaveDateTime(null, row.end_date)}`;
}

const TYPE_LABEL: Record<string, string> = {
  paid: 'Цалинтай',
  unpaid: 'Цалингүй',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Хүлээгдэж буй',
  approved: 'Зөвшөөрсөн',
  rejected: 'Татгалзсан',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
};

export default function LeaveRequestPage() {
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [reviewNote, setReviewNote] = useState('');
  const [activeRow, setActiveRow] = useState<LeaveRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const q = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`${baseUrl}/api/leave-request${q}`);
      const json = await res.json();
      if (json.success) setRows(json.data || []);
    } catch (err) {
      console.error(err);
      message.error('Чөлөөний хүсэлт татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, statusFilter]);

  useEffect(() => {
    document.title = 'Чөлөөний хүсэлт';
    fetchRows();
  }, [fetchRows]);

  const openReview = (row: LeaveRow, action: 'approved' | 'rejected') => {
    setActiveRow(row);
    setReviewAction(action);
    setReviewNote('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!activeRow) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/api/leave-request/${activeRow.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewAction,
          review_note: reviewNote.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        message.success(json.message || 'Амжилттай');
        setReviewOpen(false);
        setActiveRow(null);
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

  const columns: ColumnsType<LeaveRow> = [
    {
      title: 'Ажилтан',
      render: (_, r) => r.user?.username || `ID ${r.user_id}`,
      fixed: 'left',
      width: 160,
    },
    {
      title: 'Төрөл',
      dataIndex: 'leave_type',
      width: 110,
      render: (v) => (
        <Tag color={v === 'paid' ? 'blue' : 'default'}>{TYPE_LABEL[v] || v}</Tag>
      ),
    },
    {
      title: 'Эхлэх цаг',
      key: 'start_at',
      width: 150,
      render: (_, r) => formatLeaveDateTime(r.start_at, r.start_date),
    },
    {
      title: 'Дуусах цаг',
      key: 'end_at',
      width: 150,
      render: (_, r) => formatLeaveDateTime(r.end_at, r.end_date),
    },
    {
      title: 'Тооцогдсон цаг',
      dataIndex: 'total_hours',
      width: 120,
      render: (v) => (
        <Text strong style={{ color: '#1677ff' }}>
          {Number(v).toFixed(2)} цаг
        </Text>
      ),
    },
    {
      title: 'Шалтгаан',
      dataIndex: 'reason',
      ellipsis: true,
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 130,
      render: (v) => <Tag color={STATUS_COLOR[v]}>{STATUS_LABEL[v] || v}</Tag>,
    },
    {
      title: 'Илгээсэн',
      dataIndex: 'createdAt',
      width: 150,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Үйлдэл',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, r) =>
        r.status === 'pending' ? (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => openReview(r, 'approved')}
            >
              Зөвшөөрөх
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => openReview(r, 'rejected')}
            >
              Татгалзах
            </Button>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.reviewer?.username ? `${r.reviewer.username}` : '—'}
            {r.reviewed_at ? ` · ${dayjs(r.reviewed_at).format('MM-DD')}` : ''}
          </Text>
        ),
    },
  ];

  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Чөлөөний хүсэлт
          </Title>
          <Text type="secondary">
            Апп-аас ирсэн цалинтай/цалингүй чөлөөний хүсэлтийг зөвшөөрөх, татгалзах
          </Text>
        </div>
        <Space>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={[
              { value: '', label: 'Бүгд' },
              { value: 'pending', label: 'Хүлээгдэж буй' },
              { value: 'approved', label: 'Зөвшөөрсөн' },
              { value: 'rejected', label: 'Татгалзсан' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchRows}>
            Шинэчлэх
          </Button>
        </Space>
      </div>

      {statusFilter === 'pending' && pendingCount > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          {pendingCount} хүсэлт зөвшөөрөл хүлээж байна
        </div>
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        scroll={{ x: 1300 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      <Modal
        title={reviewAction === 'approved' ? 'Чөлөө зөвшөөрөх' : 'Чөлөөний хүсэлт татгалзах'}
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        onOk={submitReview}
        okText={reviewAction === 'approved' ? 'Зөвшөөрөх' : 'Татгалзах'}
        cancelText="Болих"
        okButtonProps={{
          danger: reviewAction === 'rejected',
          loading: submitting,
        }}
      >
        {activeRow && (
          <div className="space-y-3">
            <div>
              <Text strong>{activeRow.user?.username}</Text>
              <div>{TYPE_LABEL[activeRow.leave_type]}</div>
              <div style={{ marginTop: 4 }}>{formatLeaveRange(activeRow)}</div>
              <div style={{ marginTop: 6 }}>
                <Text strong style={{ color: '#1677ff', fontSize: 16 }}>
                  Тооцогдсон цаг: {Number(activeRow.total_hours).toFixed(2)} цаг
                </Text>
              </div>
              <div className="mt-2 text-gray-600">{activeRow.reason}</div>
            </div>
            <div>
              <Text type="secondary">Тайлбар (заавал биш)</Text>
              <Input.TextArea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Шийдвэрийн тайлбар..."
              />
            </div>
            {reviewAction === 'approved' && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Зөвшөөрөгдсөн чөлөө ирц болон цалингийн тооцоололд автоматаар орно.
              </Text>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
