'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  message,
  Rate,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { ReloadOutlined, StarOutlined } from '@/components/admin/icons';
import { formatDate } from '@/lib/userDates';
import {
  HIRE_STATUS_COLORS,
  HIRE_STATUS_LABELS,
  brigadaApi,
  type HireRequest,
  type HireStatus,
} from '@/lib/brigada';

export default function BrigadeHiresPage() {
  const router = useRouter();
  const [rows, setRows] = useState<HireRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<HireStatus | 'all' | undefined>('all');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewHire, setReviewHire] = useState<HireRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [reviewForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await brigadaApi.listHires({
        status: status && status !== 'all' ? status : undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      message.error('Хүсэлтүүд ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    document.title = 'Hire хүсэлтүүд';
    load();
  }, [load]);

  const updateHire = async (hireId: number, next: HireStatus) => {
    const res = await brigadaApi.updateHireStatus(hireId, { status: next });
    if (res.success) {
      message.success('Төлөв шинэчлэгдлээ');
      load();
    } else {
      message.error(res.message || 'Алдаа');
    }
  };

  const submitReview = async () => {
    if (!reviewHire) return;
    try {
      const values = await reviewForm.validateFields();
      setSaving(true);
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const res = await brigadaApi.createReview({
        brigade_id: reviewHire.brigade_id,
        hire_request_id: reviewHire.id,
        project_id: reviewHire.project_id,
        overall_rating: values.overall_rating,
        quality: values.quality,
        safety: values.safety,
        speed: values.speed,
        communication: values.communication,
        comment: values.comment,
        reviewer_user_id: currentUser?.id ?? null,
      });
      if (res.success) {
        message.success('Үнэлгээ хадгаллаа');
        setReviewOpen(false);
        setReviewHire(null);
        load();
      } else {
        message.error(res.message || 'Алдаа');
      }
    } catch {
      // validation
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<HireRequest> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
    },
    {
      title: 'Бригад',
      render: (_, r) => (
        <Button
          type="link"
          className="px-0"
          onClick={() => router.push(`/admin/data/brigada/${r.brigade_id}?tab=projects`)}
        >
          {r.brigade?.name || `#${r.brigade_id}`}
        </Button>
      ),
    },
    {
      title: 'Төсөл',
      render: (_, r) => r.project?.name || `#${r.project_id}`,
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 140,
      render: (v: string) => (
        <Tag color={HIRE_STATUS_COLORS[v as HireStatus]}>
          {HIRE_STATUS_LABELS[v as HireStatus] || v}
        </Tag>
      ),
    },
    {
      title: 'Хугацаа',
      width: 180,
      render: (_, r) => `${formatDate(r.start_date)} – ${formatDate(r.end_date)}`,
    },
    {
      title: 'Тайлбар',
      dataIndex: 'description',
      ellipsis: true,
      render: (v: string) => v || '—',
    },
    {
      title: 'Үйлдэл',
      width: 200,
      render: (_, r) => {
        if (r.status === 'sent' || r.status === 'changes_requested') {
          return <span className="text-xs text-muted-foreground">Бригадын хариу хүлээж байна</span>;
        }
        if (r.status === 'accepted') {
          return (
            <Button size="small" type="primary" onClick={() => updateHire(r.id, 'active')}>
              Идэвхжүүлэх
            </Button>
          );
        }
        if (r.status === 'active') {
          return (
            <Button size="small" onClick={() => updateHire(r.id, 'completed')}>
              Дуусгах
            </Button>
          );
        }
        if (r.status === 'completed') {
          return (
            <Button
              size="small"
              type="primary"
              icon={<StarOutlined />}
              onClick={() => {
                setReviewHire(r);
                reviewForm.resetFields();
                reviewForm.setFieldsValue({
                  overall_rating: 0,
                  quality: 0,
                  safety: 0,
                  speed: 0,
                  communication: 0,
                });
                setReviewOpen(true);
              }}
            >
              Од өгөх
            </Button>
          );
        }
        if (r.status === 'reviewed') {
          return <Tag color="gold">Үнэлсэн</Tag>;
        }
        if (r.status === 'rejected') {
          return <Tag color="red">Татгалзсан</Tag>;
        }
        return null;
      },
    },
  ];

  const pendingCount = rows.filter((r) => r.status === 'sent').length;
  const toRateCount = rows.filter((r) => r.status === 'completed').length;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Бригад апп зөвшөөрсний дараа эндээс идэвхжүүлж, дуусгаж, од өгнө
          </p>
        </div>
        <Space>
          <Button onClick={() => router.push('/admin/data/brigada')}>Бригад руу</Button>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
        </Space>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Нийт', value: rows.length },
          { label: 'Хүлээгдэж (апп)', value: pendingCount },
          { label: 'Идэвхтэй', value: rows.filter((r) => r.status === 'active').length },
          { label: 'Од өгөх', value: toRateCount },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border bg-card px-3 py-3">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select
          allowClear
          placeholder="Төлөв"
          className="w-[180px] shrink-0"
          value={status}
          onChange={(v) => setStatus(v ?? 'all')}
          options={[
            { value: 'all', label: 'Бүгд' },
            ...Object.entries(HIRE_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>

      {rows.length === 0 && !loading ? (
        <Empty description="Хүсэлт байхгүй" />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      )}

      <Drawer
        title="Бригад үнэлэх (од өгөх)"
        open={reviewOpen}
        onClose={() => {
          setReviewOpen(false);
          setReviewHire(null);
        }}
        width={420}
        extra={
          <Button type="primary" loading={saving} onClick={submitReview}>
            Хадгалах
          </Button>
        }
      >
        <p className="mb-3 text-sm text-muted-foreground">
          {reviewHire?.brigade?.name} · {reviewHire?.project?.name || `#${reviewHire?.project_id}`}
        </p>
        <Form form={reviewForm} layout="vertical">
          {(
            [
              ['overall_rating', 'Ерөнхий'],
              ['quality', 'Чанар'],
              ['safety', 'Аюулгүй байдал'],
              ['speed', 'Хурд'],
              ['communication', 'Харилцаа'],
            ] as const
          ).map(([name, label]) => (
            <Form.Item
              key={name}
              name={name}
              label={label}
              rules={[
                {
                  required: true,
                  validator: async (_rule, val) => {
                    if (!val || Number(val) < 0.5) {
                      throw new Error('Од сонгоно уу');
                    }
                  },
                },
              ]}
            >
              <Rate allowHalf />
            </Form.Item>
          ))}
          <Form.Item name="comment" label="Сэтгэгдэл">
            <Input.TextArea rows={3} placeholder="Нэмэлт тайлбар..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
