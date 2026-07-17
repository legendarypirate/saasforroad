'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Space,
  Tabs,
  Tag,
  Modal,
  Input,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { ArrowLeftOutlined, ReloadOutlined } from '@/components/admin/icons';
import { formatDate } from '@/lib/userDates';
import {
  jobSeekerApi,
  OFFER_STATUS_COLORS,
  OFFER_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  type JobOffer,
  type JobApplication,
  type ApplicationStatus,
} from '@/lib/jobSeeker';

export default function JobSeekerHiresPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, a] = await Promise.all([
        jobSeekerApi.offers(),
        jobSeekerApi.applications(),
      ]);
      setOffers(o);
      setApplications(a);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Санал / хүсэлтүүд';
    load();
  }, [load]);

  const withdrawOffer = async (o: JobOffer) => {
    try {
      await jobSeekerApi.updateOffer(o.id, { status: 'withdrawn' });
      message.success('Санал цуцлагдлаа');
      load();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    }
  };

  const respondApplication = (a: JobApplication, status: ApplicationStatus) => {
    let note = '';
    Modal.confirm({
      title:
        status === 'accepted'
          ? 'Хүсэлт зөвшөөрөх'
          : status === 'rejected'
            ? 'Хүсэлт татгалзах'
            : 'Хянасан гэж тэмдэглэх',
      content: (
        <div className="mt-2">
          <Input.TextArea
            rows={3}
            placeholder="Тэмдэглэл (заавал биш)"
            onChange={(e) => {
              note = e.target.value;
            }}
          />
        </div>
      ),
      okText: 'Батлах',
      cancelText: 'Болих',
      onOk: async () => {
        try {
          await jobSeekerApi.respondToApplication(a.id, {
            status,
            response_note: note || undefined,
          });
          message.success('Хадгалагдлаа');
          load();
        } catch (err) {
          if (err instanceof Error) message.error(err.message);
        }
      },
    });
  };

  const offerColumns: ColumnsType<JobOffer> = [
    {
      title: 'Ажил горилогч',
      key: 'seeker',
      render: (_, r) => (
        <button
          type="button"
          className="text-left font-medium text-primary hover:underline"
          onClick={() =>
            router.push(`/admin/data/job-seeker/${r.job_seeker_id}`)
          }
        >
          {r.job_seeker?.full_name || `#${r.job_seeker_id}`}
        </button>
      ),
    },
    { title: 'Ажлын байр', dataIndex: 'job_title', render: (v) => v || '—' },
    {
      title: 'Цалин',
      dataIndex: 'salary_offer',
      width: 120,
      render: (v) => (v ? `${Number(v).toLocaleString()}₮` : '—'),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 120,
      render: (v: string) => (
        <Tag color={OFFER_STATUS_COLORS[v] || 'default'}>
          {OFFER_STATUS_LABELS[v] || v}
        </Tag>
      ),
    },
    {
      title: 'Илгээсэн',
      dataIndex: 'createdAt',
      width: 120,
      render: (v) => formatDate(v),
    },
    {
      title: '',
      key: 'actions',
      width: 110,
      render: (_, r) =>
        r.status === 'sent' ? (
          <Button size="small" danger onClick={() => withdrawOffer(r)}>
            Цуцлах
          </Button>
        ) : null,
    },
  ];

  const appColumns: ColumnsType<JobApplication> = [
    {
      title: 'Ажил горилогч',
      key: 'seeker',
      render: (_, r) => (
        <button
          type="button"
          className="text-left font-medium text-primary hover:underline"
          onClick={() =>
            router.push(`/admin/data/job-seeker/${r.job_seeker_id}`)
          }
        >
          {r.job_seeker?.full_name || `#${r.job_seeker_id}`}
        </button>
      ),
    },
    { title: 'Албан тушаал', dataIndex: 'position', render: (v) => v || '—' },
    { title: 'Захидал', dataIndex: 'message', render: (v) => v || '—' },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 120,
      render: (v: string) => (
        <Tag color={APPLICATION_STATUS_COLORS[v] || 'default'}>
          {APPLICATION_STATUS_LABELS[v] || v}
        </Tag>
      ),
    },
    {
      title: 'Ирсэн',
      dataIndex: 'createdAt',
      width: 120,
      render: (v) => formatDate(v),
    },
    {
      title: '',
      key: 'actions',
      width: 210,
      render: (_, r) =>
        r.status === 'pending' || r.status === 'reviewed' ? (
          <Space>
            {r.status === 'pending' && (
              <Button size="small" onClick={() => respondApplication(r, 'reviewed')}>
                Хянасан
              </Button>
            )}
            <Button
              size="small"
              type="primary"
              onClick={() => respondApplication(r, 'accepted')}
            >
              Зөвшөөрөх
            </Button>
            <Button
              size="small"
              danger
              onClick={() => respondApplication(r, 'rejected')}
            >
              Татгалзах
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/data/job-seeker')}
          >
            Жагсаалт
          </Button>
          <h1 className="text-2xl font-semibold">Санал / хүсэлтүүд</h1>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
      </div>

      <Tabs
        items={[
          {
            key: 'offers',
            label: `Илгээсэн санал (${offers.length})`,
            children: (
              <Table
                rowKey="id"
                loading={loading}
                columns={offerColumns}
                dataSource={offers}
                scroll={{ x: 800 }}
                pagination={{ pageSize: 20 }}
              />
            ),
          },
          {
            key: 'applications',
            label: `Ирсэн хүсэлт (${applications.length})`,
            children: (
              <Table
                rowKey="id"
                loading={loading}
                columns={appColumns}
                dataSource={applications}
                scroll={{ x: 900 }}
                pagination={{ pageSize: 20 }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
