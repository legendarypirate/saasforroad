'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { RActionButton, REmpty, RTableActions } from '@/components/r';
import { Check, Users, X } from 'lucide-react';
import {
  APPLICATION_STATUS_LABELS,
  driverJobsApi,
  type DriverJobApplication,
  type DriverJobApplicationStatus,
} from '@/lib/driverJobs';

const APP_STATUS_COLORS: Record<DriverJobApplicationStatus, string> = {
  pending: 'processing',
  accepted: 'success',
  rejected: 'error',
  withdrawn: 'default',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Бүх төлөв' },
  { value: 'pending', label: 'Хүлээгдэж буй' },
  { value: 'accepted', label: 'Зөвшөөрсөн' },
  { value: 'rejected', label: 'Татгалзсан' },
  { value: 'withdrawn', label: 'Цуцласан' },
];

export default function DriverJobApplicationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<DriverJobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await driverJobsApi.applications());
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Жолоочийн хүсэлтүүд';
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!needle) return true;
      return [
        row.driver?.full_name,
        row.driver?.phone,
        row.opening?.title,
        row.message,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [rows, q, statusFilter]);

  const respond = async (
    row: DriverJobApplication,
    status: 'accepted' | 'rejected',
  ) => {
    let response_note: string | undefined;
    if (status === 'rejected') {
      response_note = await new Promise<string | undefined>((resolve) => {
        let note = '';
        Modal.confirm({
          title: 'Татгалзах шалтгаан',
          content: (
            <Input.TextArea
              rows={3}
              placeholder="Заавал биш"
              onChange={(e) => {
                note = e.target.value;
              }}
            />
          ),
          onOk: () => resolve(note || undefined),
          onCancel: () => resolve(undefined),
        });
      });
      if (response_note === undefined) return;
    }

    setBusyId(row.id);
    try {
      await driverJobsApi.respondApplication(row.id, { status, response_note });
      message.success(status === 'accepted' ? 'Зөвшөөрлөө' : 'Татгалзлаа');
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Алдаа');
    } finally {
      setBusyId(null);
    }
  };

  const columns: ColumnsType<DriverJobApplication> = [
    { title: '№', key: 'index', width: 56, render: (_v, _r, i) => i + 1 },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 100,
      render: (_, row) =>
        row.status === 'pending' ? (
          <RTableActions>
            <RActionButton
              icon={<Check />}
              label="Зөвшөөрөх"
              tone="success"
              disabled={busyId === row.id}
              onClick={() => respond(row, 'accepted')}
            />
            <RActionButton
              icon={<X />}
              label="Татгалзах"
              tone="danger"
              disabled={busyId === row.id}
              onClick={() => respond(row, 'rejected')}
            />
          </RTableActions>
        ) : null,
    },
    {
      title: 'Жолооч',
      key: 'driver',
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.driver?.full_name || '—'}</div>
          <div className="text-xs text-muted-foreground">
            {[row.driver?.phone, row.driver?.plate_number]
              .filter(Boolean)
              .join(' · ')}
          </div>
        </div>
      ),
    },
    {
      title: 'Зар',
      key: 'opening',
      render: (_, row) => row.opening?.title || `#${row.opening_id}`,
    },
    {
      title: 'Мессеж',
      dataIndex: 'message',
      ellipsis: true,
      render: (v) => v || '—',
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 130,
      render: (v: DriverJobApplicationStatus) => (
        <Tag color={APP_STATUS_COLORS[v] || 'default'}>
          {APPLICATION_STATUS_LABELS[v] || v}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <AdminListToolbar
        description="Freelancer аппаас ирсэн өргөдөл"
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Жолооч, зар, мессеж…"
        onReload={load}
        filters={
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
            className="w-40"
          />
        }
        actions={
          <Button onClick={() => router.push('/admin/data/driver-jobs')}>
            Зарууд
          </Button>
        }
      />

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        empty={
          <REmpty
            iconType={Users}
            title="Хүсэлт байхгүй"
            description="Жолооч аппаас өргөдөл илгээсний дараа энд гарна."
          />
        }
      />
    </div>
  );
}
