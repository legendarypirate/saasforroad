'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag } from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';

interface FeedbackRow {
  id: number;
  message: string;
  is_anonymous: boolean;
  username?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt: string;
  user?: {
    username?: string;
    phone?: string;
    email?: string;
  };
}

export default function FeedbackPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`);
      const json = await res.json();
      if (json.success) setRows(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Санал хүсэлт';
    fetchFeedback();
  }, []);

  const columns: ColumnsType<FeedbackRow> = [
    { title: 'Санал', dataIndex: 'message' },
    {
      title: 'Нууцлал',
      dataIndex: 'is_anonymous',
      render: (v) => (v ? <Tag color="purple">Аноним</Tag> : <Tag color="blue">Нээлттэй</Tag>),
    },
    {
      title: 'Нэр',
      render: (_, r) => r.username || r.user?.username || '—',
    },
    {
      title: 'Утас',
      render: (_, r) => r.phone || r.user?.phone || '—',
    },
    {
      title: 'И-мэйл',
      render: (_, r) => r.email || r.user?.email || '—',
    },
    { title: 'Огноо', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString() },
  ];

  return <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} />;
}
