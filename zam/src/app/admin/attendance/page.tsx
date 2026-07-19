'use client';

import React, { useEffect, useState } from 'react';
import { Table, DatePicker, Card, Statistic, Row, Col, Tag, Space } from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import dayjs, { Dayjs } from 'dayjs';

interface AttendanceRow {
  id: number;
  user_id: number;
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string;
  user?: {
    id: number;
    username: string;
    phone: string;
    roleRecord?: { name: string };
  };
}

interface Summary {
  date: string;
  total: number;
  checked_in: number;
  checked_out: number;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const dateStr = selectedDate.format('YYYY-MM-DD');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance?date=${dateStr}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/summary?date=${dateStr}`),
      ]);
      const listJson = await listRes.json();
      const summaryJson = await summaryRes.json();
      if (listJson.success) setRecords(listJson.data);
      if (summaryJson.success) setSummary(summaryJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Ирцийн хяналт';
    fetchData();
  }, [dateStr]);

  const formatTime = (value: string | null) => {
    if (!value) return '—';
    return dayjs(value).format('HH:mm');
  };

  const columns: ColumnsType<AttendanceRow> = [
    {
      title: 'Ажилтан',
      render: (_, r) => r.user?.username || r.user?.phone || `#${r.user_id}`,
    },
    {
      title: 'Эрх',
      render: (_, r) => r.user?.roleRecord?.name || '—',
    },
    { title: 'Огноо', dataIndex: 'work_date' },
    {
      title: 'Ирсэн цаг',
      dataIndex: 'check_in_at',
      render: (v) => formatTime(v),
    },
    {
      title: 'Явсан цаг',
      dataIndex: 'check_out_at',
      render: (v) => formatTime(v),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (status, record) => {
        if (!record.check_in_at) return <Tag color="red">Ирээгүй</Tag>;
        if (!record.check_out_at) return <Tag color="orange">Ажиллаж байна</Tag>;
        return <Tag color="green">Дууссан</Tag>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Space className="rounded-lg border bg-card px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">Огноо:</span>
        <DatePicker value={selectedDate} onChange={(d) => d && setSelectedDate(d)} allowClear={false} />
      </Space>

      {summary && (
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic title="Нийт бүртгэл" value={summary.total} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="Ирсэн" value={summary.checked_in} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="Явсан" value={summary.checked_out} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Table columns={columns} dataSource={records} rowKey="id" loading={loading} />
      </Card>
    </div>
  );
}
