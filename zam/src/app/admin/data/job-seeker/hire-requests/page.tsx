'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Space, Select, Tag, message } from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { ReloadOutlined } from '@/components/admin/icons';
import { jobSeekerApi, type HireRequest } from '@/lib/jobSeeker';

const STATUS_COLOR: Record<string, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  cancelled: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Хүлээгдэж буй',
  approved: 'Зөвшөөрсөн',
  rejected: 'Татгалзсан',
  cancelled: 'Цуцлагдсан',
};

export default function HireRequestsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | undefined>();

  const load = async () => {
    setLoading(true);
    try {
      const list = await jobSeekerApi.hireRequests({ status });
      setRows(list);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Авах хүсэлт';
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const columns: ColumnsType<HireRequest> = [
    {
      title: 'Ажил горилогч',
      key: 'candidate',
      render: (_, row) => (
        <Button
          type="link"
          onClick={() => router.push(`/admin/data/job-seeker/${row.candidate_id}`)}
        >
          {row.candidate?.full_name || `#${row.candidate_id}`}
        </Button>
      ),
    },
    { title: 'Ажил олгогч', dataIndex: 'employer_name', key: 'employer' },
    { title: 'Албан тушаал', dataIndex: 'job_title', key: 'title' },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={STATUS_COLOR[v] || 'default'}>{STATUS_LABEL[v] || v}</Tag>,
    },
    {
      title: 'Огноо',
      dataIndex: 'createdAt',
      key: 'date',
      render: (v) => (v ? new Date(v).toLocaleString('mn-MN') : '—'),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="Төлөв"
          style={{ width: 180 }}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'pending', label: 'Хүлээгдэж буй' },
            { value: 'approved', label: 'Зөвшөөрсөн' },
            { value: 'rejected', label: 'Татгалзсан' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button onClick={() => router.push('/admin/data/job-seeker')}>Жагсаалт</Button>
      </Space>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={rows} pagination={{ pageSize: 20 }} />
    </div>
  );
}
