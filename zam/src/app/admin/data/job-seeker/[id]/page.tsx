'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Descriptions,
  Space,
  Tag,
  message,
  Drawer,
  Form,
  Input,
} from '@/components/admin/primitives';
import { ArrowLeftOutlined, UserAddOutlined } from '@/components/admin/icons';
import { jobSeekerApi, type JobSeeker } from '@/lib/jobSeeker';

export default function JobSeekerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [row, setRow] = useState<JobSeeker | null>(null);
  const [loading, setLoading] = useState(true);
  const [hireOpen, setHireOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const data = await jobSeekerApi.get(id);
      setRow(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Ажил горилогч';
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitHire = async () => {
    if (!row) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      const userRaw = localStorage.getItem('user');
      let requested_by: string | undefined;
      try {
        const u = userRaw ? JSON.parse(userRaw) : null;
        requested_by = u?.username || u?.email || undefined;
      } catch {
        /* ignore */
      }
      const res = await jobSeekerApi.sendHireRequest(row.id, { ...values, requested_by });
      message.success(res.message || 'Илгээгдлээ');
      setHireOpen(false);
      load();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(err instanceof Error ? err.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Ачааллаж байна...</div>;
  if (!row) return <div style={{ padding: 24 }}>Олдсонгүй</div>;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/data/job-seeker')}>
          Буцах
        </Button>
        {row.is_available !== false ? (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({
                employer_name: 'РД Зам',
                job_title: row.desired_role || '',
              });
              setHireOpen(true);
            }}
          >
            Авах хүсэлт илгээх
          </Button>
        ) : null}
      </Space>

      <Card title={row.full_name} loading={loading}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Төлөв">
            {row.is_available !== false ? (
              <Tag color="green">Ажил хайж байна</Tag>
            ) : (
              <Tag>Жагсаалтаас хасагдсан</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Албан тушаал">{row.desired_role || '—'}</Descriptions.Item>
          <Descriptions.Item label="Утас">{row.phone || '—'}</Descriptions.Item>
          <Descriptions.Item label="И-мэйл">{row.email || '—'}</Descriptions.Item>
          <Descriptions.Item label="Аймаг">{row.province || '—'}</Descriptions.Item>
          <Descriptions.Item label="Туршлага">{row.experience_years ?? 0} жил</Descriptions.Item>
          <Descriptions.Item label="Боловсрол">{row.education || '—'}</Descriptions.Item>
          <Descriptions.Item label="Ур чадвар">
            {Array.isArray(row.skills) && row.skills.length ? row.skills.join(', ') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Танилцуулга">{row.about || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {row.hire_requests?.length ? (
        <Card title="Авах хүсэлтүүд" style={{ marginTop: 16 }}>
          {row.hire_requests.map((h) => (
            <div key={h.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
              <Space>
                <strong>{h.employer_name}</strong>
                <Tag>{h.status}</Tag>
              </Space>
              {h.job_title ? <div style={{ fontSize: 13 }}>{h.job_title}</div> : null}
              {h.message ? <div style={{ fontSize: 13, color: '#666' }}>{h.message}</div> : null}
            </div>
          ))}
        </Card>
      ) : null}

      <Drawer
        title="Авах хүсэлт"
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        width={420}
        extra={
          <Button type="primary" loading={saving} onClick={submitHire}>
            Илгээх
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="employer_name" label="Ажил олгогч" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="job_title" label="Албан тушаал">
            <Input />
          </Form.Item>
          <Form.Item name="message" label="Зурвас">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
