'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Tag,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { EyeOutlined, ReloadOutlined, UserAddOutlined } from '@/components/admin/icons';
import { jobSeekerApi, type JobSeeker } from '@/lib/jobSeeker';

export default function JobSeekerListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [available, setAvailable] = useState<string>('1');
  const [hireOpen, setHireOpen] = useState(false);
  const [selected, setSelected] = useState<JobSeeker | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const list = await jobSeekerApi.list({
        q: q.trim() || undefined,
        available: available === 'all' ? 'all' : available === '0' ? '0' : undefined,
      });
      setRows(list);
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Ажил горилогч';
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  const openHire = (row: JobSeeker) => {
    setSelected(row);
    form.resetFields();
    form.setFieldsValue({
      employer_name: 'РД Зам',
      job_title: row.desired_role || '',
      message: '',
    });
    setHireOpen(true);
  };

  const submitHire = async () => {
    if (!selected) return;
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
      const res = await jobSeekerApi.sendHireRequest(selected.id, {
        ...values,
        requested_by,
      });
      message.success(res.message || 'Авах хүсэлт илгээгдлээ');
      setHireOpen(false);
      load();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(err instanceof Error ? err.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<JobSeeker> = [
    {
      title: 'Нэр',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (v, row) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>{v}</span>
          <span style={{ fontSize: 12, color: '#888' }}>{row.desired_role || '—'}</span>
        </Space>
      ),
    },
    {
      title: 'Холбоо',
      key: 'contact',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <span>{row.phone || '—'}</span>
          <span style={{ fontSize: 12, color: '#888' }}>{row.email || ''}</span>
        </Space>
      ),
    },
    { title: 'Аймаг', dataIndex: 'province', key: 'province', width: 120 },
    {
      title: 'Туршлага',
      dataIndex: 'experience_years',
      key: 'exp',
      width: 90,
      render: (v) => `${v ?? 0} жил`,
    },
    {
      title: 'Төлөв',
      dataIndex: 'is_available',
      key: 'avail',
      width: 120,
      render: (v) =>
        v !== false ? <Tag color="green">Хайж байна</Tag> : <Tag color="default">Хасагдсан</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/data/job-seeker/${row.id}`)}
          >
            Дэлгэрэнгүй
          </Button>
          {row.is_available !== false ? (
            <Button size="small" type="primary" icon={<UserAddOutlined />} onClick={() => openHire(row)}>
              Авах
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Space wrap>
          <Input.Search
            placeholder="Нэр, албан тушаал..."
            allowClear
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onSearch={() => load()}
            style={{ width: 240 }}
          />
          <Select
            value={available}
            onChange={setAvailable}
            style={{ width: 160 }}
            options={[
              { value: '1', label: 'Хайж буй' },
              { value: '0', label: 'Хасагдсан' },
              { value: 'all', label: 'Бүгд' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
        </Space>
        <Button onClick={() => router.push('/admin/data/job-seeker/hire-requests')}>
          Авах хүсэлтүүд
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Drawer
        title={selected ? `Авах хүсэлт — ${selected.full_name}` : 'Авах хүсэлт'}
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        width={420}
        extra={
          <Button type="primary" loading={saving} onClick={submitHire}>
            Илгээх
          </Button>
        }
      >
        <p style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
          Хүсэлт Анкет профайл дээр гарна. Хэрэглэгч зөвшөөрснөөр жагсаалтаас хасагдана.
        </p>
        <Form form={form} layout="vertical">
          <Form.Item
            name="employer_name"
            label="Ажил олгогч / компани"
            rules={[{ required: true, message: 'Нэр оруулна уу' }]}
          >
            <Input placeholder="Ж: РД Зам ХХК" />
          </Form.Item>
          <Form.Item name="job_title" label="Албан тушаал">
            <Input placeholder="Санал болгож буй албан тушаал" />
          </Form.Item>
          <Form.Item name="message" label="Зурвас">
            <Input.TextArea rows={4} placeholder="Товч санал / нөхцөл" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
