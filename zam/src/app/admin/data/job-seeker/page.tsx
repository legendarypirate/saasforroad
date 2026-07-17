'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Input,
  InputNumber,
  Switch,
  Tabs,
  message,
  Tag,
  Avatar,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  EyeOutlined,
  ReloadOutlined,
  MailOutlined,
} from '@/components/admin/icons';
import { formatDate } from '@/lib/userDates';
import {
  jobSeekerApi,
  EDUCATION_LABELS,
  type JobSeeker,
} from '@/lib/jobSeeker';
import {
  studentApi,
  studentFullName,
  formatGpa,
  normalizeSkills,
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_COLORS,
  INTERNSHIP_TYPE_LABELS,
  type StudentRecord,
  type StudentStatus,
  type InternshipType,
} from '@/lib/student';

export default function JobSeekerListPage() {
  useEffect(() => {
    document.title = 'Ажил горилогч';
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="mb-1 text-2xl font-semibold">Ажил горилогч / Оюутан</h1>
        <p className="text-sm text-muted-foreground">
          Замын салбарын ажил горилогчид болон дадлагын оюутнууд. Санал илгээх,
          хүсэлт харах, боломжит нэр дэвшигчдийг нэг дороос харах боломжтой.
        </p>
      </div>

      <Tabs
        defaultActiveKey="seekers"
        items={[
          {
            key: 'seekers',
            label: 'Ажил горилогч',
            children: <JobSeekerPanel />,
          },
          {
            key: 'students',
            label: 'Оюутан / дадлагажигч',
            children: <StudentPanel />,
          },
        ]}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- Seekers */

function JobSeekerPanel() {
  const router = useRouter();
  const [rows, setRows] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [province, setProvince] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [offerOpen, setOfferOpen] = useState(false);
  const [offerTarget, setOfferTarget] = useState<JobSeeker | null>(null);
  const [saving, setSaving] = useState(false);
  const [offerForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobSeekerApi.list({
        search: q.trim() || undefined,
        province: province.trim() || undefined,
        available: onlyAvailable ? 'true' : undefined,
      });
      setRows(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [q, province, onlyAvailable]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyAvailable]);

  const openOffer = (row: JobSeeker) => {
    setOfferTarget(row);
    offerForm.resetFields();
    setOfferOpen(true);
  };

  const handleOffer = async () => {
    if (!offerTarget) return;
    try {
      const values = await offerForm.validateFields();
      setSaving(true);
      await jobSeekerApi.createOffer(offerTarget.id, {
        job_title: values.job_title,
        message: values.message,
        salary_offer: values.salary_offer ?? null,
        start_date: values.start_date || null,
      });
      message.success('Санал илгээгдлээ');
      setOfferOpen(false);
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<JobSeeker> = [
    {
      title: '',
      dataIndex: 'photo',
      width: 56,
      render: (v, r) => (
        <Avatar src={v || undefined} size={38}>
          {(r.full_name || '?').slice(0, 1)}
        </Avatar>
      ),
    },
    {
      title: 'Нэр',
      dataIndex: 'full_name',
      render: (v, r) => (
        <button
          type="button"
          className="text-left font-medium text-primary hover:underline"
          onClick={() => router.push(`/admin/data/job-seeker/${r.id}`)}
        >
          {v}
        </button>
      ),
    },
    {
      title: 'Хүсэж буй ажил',
      dataIndex: 'desired_role',
      render: (v) => v || '—',
    },
    {
      title: 'Туршлага',
      dataIndex: 'experience_years',
      width: 90,
      render: (v) => (v ? `${v} жил` : '—'),
    },
    {
      title: 'Боловсрол',
      dataIndex: 'education_level',
      width: 120,
      render: (v) => (v ? EDUCATION_LABELS[v] || v : '—'),
    },
    {
      title: 'Аймаг / хот',
      dataIndex: 'province',
      width: 130,
      render: (v) => v || '—',
    },
    {
      title: 'Утас',
      dataIndex: 'phone',
      width: 120,
      render: (v) => v || '—',
    },
    {
      title: 'Төлөв',
      dataIndex: 'is_available',
      width: 110,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>
          {v ? 'Ажил хайж буй' : 'Идэвхгүй'}
        </Tag>
      ),
    },
    {
      title: 'Шинэчилсэн',
      dataIndex: 'updatedAt',
      width: 110,
      render: (v) => formatDate(v),
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/data/job-seeker/${r.id}`)}
          />
          <Button
            size="small"
            type="primary"
            icon={<MailOutlined />}
            onClick={() => openOffer(r)}
          >
            Санал
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="Нэр, ажлын байр, утас..."
          className="w-[240px] shrink-0"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={load}
        />
        <Input
          allowClear
          placeholder="Аймаг / хот"
          className="w-[160px] shrink-0"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          onPressEnter={load}
        />
        <span className="flex items-center gap-2 text-sm">
          <Switch checked={onlyAvailable} onChange={setOnlyAvailable} />
          Зөвхөн ажил хайж буй
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            onClick={() => router.push('/admin/data/job-seeker/hire-requests')}
          >
            Санал / хүсэлтүүд
          </Button>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      <Drawer
        title={offerTarget ? `Санал илгээх — ${offerTarget.full_name}` : 'Санал'}
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        width={440}
        extra={
          <Button type="primary" loading={saving} onClick={handleOffer}>
            Илгээх
          </Button>
        }
      >
        <Form form={offerForm} layout="vertical">
          <Form.Item
            name="job_title"
            label="Ажлын байр"
            rules={[{ required: true, message: 'Ажлын байр оруулна уу' }]}
          >
            <Input placeholder="Жишээ: Экскаваторчин" />
          </Form.Item>
          <Form.Item name="salary_offer" label="Санал болгох цалин (₮)">
            <InputNumber
              className="w-full"
              min={0}
              step={100000}
              formatter={(v) =>
                `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
            />
          </Form.Item>
          <Form.Item name="start_date" label="Эхлэх огноо">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="message" label="Захидал">
            <Input.TextArea rows={4} placeholder="Саналын тайлбар..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

/* --------------------------------------------------------------- Students */

function StudentPanel() {
  const [rows, setRows] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentApi.list({ q: q.trim() || undefined });
      setRows(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<StudentRecord> = [
    {
      title: '',
      dataIndex: 'photo',
      width: 56,
      render: (v, r) => (
        <Avatar src={v || undefined} size={38}>
          {(r.first_name || r.last_name || '?').slice(0, 1)}
        </Avatar>
      ),
    },
    {
      title: 'Нэр',
      key: 'name',
      render: (_, r) => (
        <div>
          <div className="font-medium">{studentFullName(r)}</div>
          {r.register_number ? (
            <div className="text-xs text-muted-foreground">
              {r.register_number}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Сургууль / мэргэжил',
      key: 'school',
      render: (_, r) =>
        [r.school, r.major].filter(Boolean).join(' · ') || '—',
    },
    {
      title: 'Курс',
      dataIndex: 'course_year',
      width: 80,
      render: (v) => (v ? `${v}-р курс` : '—'),
    },
    {
      title: 'Голч',
      dataIndex: 'gpa',
      width: 80,
      render: (v) => formatGpa(v),
    },
    {
      title: 'Ур чадвар',
      dataIndex: 'skills',
      render: (v: string[] | null) => {
        const skills = normalizeSkills(v);
        if (!skills.length) return '—';
        return (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 4).map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
            {skills.length > 4 ? (
              <span className="text-xs text-muted-foreground">
                +{skills.length - 4}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: 'Төрөл',
      dataIndex: 'internship_type',
      width: 120,
      render: (v: string) =>
        INTERNSHIP_TYPE_LABELS[v as InternshipType] || v || '—',
    },
    {
      title: 'Утас',
      dataIndex: 'phone',
      width: 120,
      render: (v) => v || '—',
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 130,
      render: (v: string) => (
        <Tag color={STUDENT_STATUS_COLORS[v as StudentStatus] || 'default'}>
          {STUDENT_STATUS_LABELS[v as StudentStatus] || v}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="Нэр, сургууль, мэргэжил, утас..."
          className="w-[260px] shrink-0"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={load}
        />
        <div className="ml-auto">
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        locale={{ emptyText: 'Одоогоор оюутны бүртгэл байхгүй' }}
      />
    </div>
  );
}
