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
  InputNumber,
  Select,
  message,
  Tag,
  Tooltip,
  DatePicker,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { EyeOutlined, PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import { dateFormItemProps, formatDate } from '@/lib/userDates';
import {
  INTERNSHIP_TYPE_LABELS,
  STUDENT_STATUS_COLORS,
  STUDENT_STATUS_LABELS,
  formatGpa,
  normalizeSkills,
  studentApi,
  studentFullName,
  type InternshipType,
  type StudentRecord,
  type StudentStats,
  type StudentStatus,
} from '@/lib/student';

export default function StudentListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<StudentRecord[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StudentStatus | undefined>();
  const [internshipType, setInternshipType] = useState<InternshipType | undefined>();
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [list, st] = await Promise.all([
        studentApi.list({
          q: q.trim() || undefined,
          status,
          internship_type: internshipType,
        }),
        studentApi.stats(),
      ]);
      setRows(list);
      setStats(st);
    } catch (err) {
      console.error(err);
      message.error('Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Оюутан';
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, internshipType]);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      internship_type: 'internship',
      status: 'applied',
      gender: undefined,
    });
    setDrawerOpen(true);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await studentApi.create(values);
      if (res.success) {
        message.success('Оюутан бүртгэгдлээ');
        setDrawerOpen(false);
        load();
      } else {
        message.error(res.message || 'Үүсгэхэд алдаа');
      }
    } catch {
      // validation
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<StudentRecord> = [
    {
      title: 'Овог нэр',
      key: 'name',
      render: (_, r) => (
        <button
          type="button"
          className="text-left font-medium text-primary hover:underline"
          onClick={() => router.push(`/admin/data/student/${r.id}`)}
        >
          {studentFullName(r)}
        </button>
      ),
    },
    {
      title: 'Сургууль / Мэргэжил',
      key: 'school',
      render: (_, r) => (
        <div className="max-w-[220px]">
          <div className="truncate">{r.school || '—'}</div>
          <div className="truncate text-xs text-muted-foreground">{r.major || ''}</div>
        </div>
      ),
    },
    {
      title: 'Курс',
      dataIndex: 'course_year',
      width: 70,
      render: (v) => (v != null ? `${v}` : '—'),
    },
    {
      title: 'Голч',
      dataIndex: 'gpa',
      width: 80,
      render: (v) => formatGpa(v),
    },
    {
      title: 'Ур чадвар',
      key: 'skills',
      width: 220,
      render: (_, r) => {
        const skills = normalizeSkills(r.skills);
        if (skills.length === 0) return '—';
        return (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {skills.slice(0, 4).map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
            {skills.length > 4 && <Tag>+{skills.length - 4}</Tag>}
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
      title: 'Төлөв',
      dataIndex: 'status',
      width: 130,
      render: (v: string) => (
        <Tag color={STUDENT_STATUS_COLORS[v as StudentStatus] || 'default'}>
          {STUDENT_STATUS_LABELS[v as StudentStatus] || v}
        </Tag>
      ),
    },
    {
      title: 'Хугацаа',
      key: 'dates',
      width: 160,
      render: (_, r) => (
        <span className="text-xs">
          {formatDate(r.start_date)} – {formatDate(r.end_date)}
        </span>
      ),
    },
    {
      title: 'Утас',
      dataIndex: 'phone',
      width: 110,
      render: (v) => v || '—',
    },
    {
      title: '',
      key: 'action',
      width: 56,
      render: (_, r) => (
        <Tooltip title="Дэлгэрэнгүй">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/data/student/${r.id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Оюутан</h1>
          <p className="text-sm text-muted-foreground">
            Дадлагажигч, дипломын ажил, сайн дурын оюутны бүртгэл
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Оюутан бүртгэх
        </Button>
      </div>

      {stats && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { label: 'Нийт', value: stats.total },
            { label: 'Хүсэлт', value: stats.applied },
            { label: 'Идэвхтэй', value: stats.active },
            { label: 'Дууссан', value: stats.completed },
            { label: 'Цуцлагдсан', value: stats.cancelled },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-card px-3 py-2 text-center"
            >
              <div className="text-lg font-semibold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="Нэр, сургууль, утас…"
          className="w-[240px]"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={() => load()}
        />
        <Select
          allowClear
          placeholder="Төлөв"
          className="w-[160px]"
          value={status}
          onChange={(v) => setStatus(v)}
          options={Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <Select
          allowClear
          placeholder="Төрөл"
          className="w-[150px]"
          value={internshipType}
          onChange={(v) => setInternshipType(v)}
          options={Object.entries(INTERNSHIP_TYPE_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <Button icon={<ReloadOutlined />} onClick={() => load()}>
          Шинэчлэх
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={rows}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
      />

      <Drawer
        title="Оюутан бүртгэх"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleCreate}>
          <div className="grid grid-cols-2 gap-x-3">
            <Form.Item name="last_name" label="Овог" rules={[{ required: true }]}>
              <Input placeholder="Овог" />
            </Form.Item>
            <Form.Item name="first_name" label="Нэр" rules={[{ required: true }]}>
              <Input placeholder="Нэр" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Form.Item name="register_number" label="Регистр">
              <Input placeholder="Регистрийн дугаар" />
            </Form.Item>
            <Form.Item name="gender" label="Хүйс">
              <Select
                allowClear
                placeholder="Сонгох"
                options={[
                  { value: 'male', label: 'Эр' },
                  { value: 'female', label: 'Эм' },
                ]}
              />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Form.Item name="phone" label="Утас">
              <Input placeholder="Утас" />
            </Form.Item>
            <Form.Item name="email" label="И-мэйл">
              <Input placeholder="И-мэйл" />
            </Form.Item>
          </div>
          <Form.Item name="school" label="Сургууль">
            <Input placeholder="Их сургууль / коллеж" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-3">
            <Form.Item name="major" label="Мэргэжил">
              <Input placeholder="Мэргэжил" />
            </Form.Item>
            <Form.Item name="course_year" label="Курс">
              <InputNumber min={1} max={6} className="w-full" placeholder="Жил" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Form.Item name="internship_type" label="Төрөл" rules={[{ required: true }]}>
              <Select
                options={Object.entries(INTERNSHIP_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
            <Form.Item name="status" label="Төлөв" rules={[{ required: true }]}>
              <Select
                options={Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Form.Item name="start_date" label="Эхлэх" {...dateFormItemProps()}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="end_date" label="Дуусах" {...dateFormItemProps()}>
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="department" label="Хэлтэс / нэгж">
            <Input placeholder="Жишээ: Лаборатори, Барилга…" />
          </Form.Item>
          <Form.Item name="notes" label="Тэмдэглэл">
            <Input.TextArea rows={3} placeholder="Нэмэлт мэдээлэл" />
          </Form.Item>
          <Space className="w-full justify-end">
            <Button onClick={() => setDrawerOpen(false)}>Болих</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Хадгалах
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
}
