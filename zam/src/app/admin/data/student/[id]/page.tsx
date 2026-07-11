'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Tag,
  message,
  DatePicker,
  Popconfirm,
} from '@/components/admin/primitives';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined } from '@/components/admin/icons';
import { dateFormItemProps, formatDate } from '@/lib/userDates';
import {
  INTERNSHIP_TYPE_LABELS,
  STUDENT_STATUS_COLORS,
  STUDENT_STATUS_LABELS,
  studentApi,
  studentFullName,
  type InternshipType,
  type StudentRecord,
  type StudentStatus,
} from '@/lib/student';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const studentId = useMemo(() => Number(id), [id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [form] = Form.useForm();

  const display = (v?: string | number | null) =>
    v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : '—';

  const genderLabel = (v?: string | null) => {
    if (v === 'male') return 'Эр';
    if (v === 'female') return 'Эм';
    return display(v);
  };

  const load = async () => {
    if (!Number.isFinite(studentId)) return;
    setLoading(true);
    try {
      const data = await studentApi.get(studentId);
      if (!data) {
        message.error('Оюутан олдсонгүй');
        router.push('/admin/data/student');
        return;
      }
      setStudent(data);
      form.setFieldsValue(data);
    } catch (err) {
      console.error(err);
      message.error('Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Оюутан дэлгэрэнгүй';
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await studentApi.update(studentId, values);
      if (res.success && res.data) {
        message.success('Хадгалагдлаа');
        setStudent(res.data);
        setEditing(false);
      } else {
        message.error(res.message || 'Хадгалахад алдаа');
      }
    } catch {
      // validation
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const res = await studentApi.remove(studentId);
    if (res.success) {
      message.success('Устгагдлаа');
      router.push('/admin/data/student');
    } else {
      message.error(res.message || 'Устгахад алдаа');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  if (!student) return null;

  const status = student.status as StudentStatus;
  const type = student.internship_type as InternshipType;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin/data/student')}
        >
          Буцах
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">{studentFullName(student)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Tag color={STUDENT_STATUS_COLORS[status] || 'default'}>
              {STUDENT_STATUS_LABELS[status] || student.status}
            </Tag>
            <span className="text-sm text-muted-foreground">
              {INTERNSHIP_TYPE_LABELS[type] || student.internship_type}
            </span>
          </div>
        </div>
        <Space>
          {!editing ? (
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
              Засах
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  setEditing(false);
                  form.setFieldsValue(student);
                }}
              >
                Болих
              </Button>
              <Button type="primary" loading={saving} onClick={handleSave}>
                Хадгалах
              </Button>
            </>
          )}
          <Popconfirm
            title="Оюутны бүртгэлийг устгах уу?"
            okText="Устгах"
            cancelText="Болих"
            onConfirm={handleDelete}
          >
            <Button danger icon={<DeleteOutlined />}>
              Устгах
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {!editing ? (
        <div className="space-y-6">
          <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle" title="Хувийн мэдээлэл">
            <Descriptions.Item label="Овог">{display(student.last_name)}</Descriptions.Item>
            <Descriptions.Item label="Нэр">{display(student.first_name)}</Descriptions.Item>
            <Descriptions.Item label="Регистр">{display(student.register_number)}</Descriptions.Item>
            <Descriptions.Item label="Хүйс">{genderLabel(student.gender)}</Descriptions.Item>
            <Descriptions.Item label="Утас">{display(student.phone)}</Descriptions.Item>
            <Descriptions.Item label="И-мэйл">{display(student.email)}</Descriptions.Item>
            <Descriptions.Item label="Хаяг" span={2}>
              {display(student.address)}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle" title="Сургалт">
            <Descriptions.Item label="Сургууль">{display(student.school)}</Descriptions.Item>
            <Descriptions.Item label="Мэргэжил">{display(student.major)}</Descriptions.Item>
            <Descriptions.Item label="Курс">{display(student.course_year)}</Descriptions.Item>
            <Descriptions.Item label="Оюутны үнэмлэх">
              {display(student.student_card_no)}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle" title="Дадлага">
            <Descriptions.Item label="Төрөл">
              {INTERNSHIP_TYPE_LABELS[type] || display(student.internship_type)}
            </Descriptions.Item>
            <Descriptions.Item label="Төлөв">
              <Tag color={STUDENT_STATUS_COLORS[status] || 'default'}>
                {STUDENT_STATUS_LABELS[status] || student.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Эхлэх">{formatDate(student.start_date)}</Descriptions.Item>
            <Descriptions.Item label="Дуусах">{formatDate(student.end_date)}</Descriptions.Item>
            <Descriptions.Item label="Хэлтэс">{display(student.department)}</Descriptions.Item>
          </Descriptions>

          <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle" title="Яаралтай холбоо">
            <Descriptions.Item label="Холбоо барих">{display(student.emergency_contact)}</Descriptions.Item>
            <Descriptions.Item label="Утас">{display(student.emergency_phone)}</Descriptions.Item>
            <Descriptions.Item label="Тэмдэглэл" span={2}>
              {display(student.notes)}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ) : (
        <Form layout="vertical" form={form} className="max-w-3xl">
          <h2 className="mb-3 text-base font-semibold">Хувийн мэдээлэл</h2>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="last_name" label="Овог" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="first_name" label="Нэр" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="register_number" label="Регистр">
              <Input />
            </Form.Item>
            <Form.Item name="gender" label="Хүйс">
              <Select
                allowClear
                options={[
                  { value: 'male', label: 'Эр' },
                  { value: 'female', label: 'Эм' },
                ]}
              />
            </Form.Item>
            <Form.Item name="phone" label="Утас">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="И-мэйл">
              <Input />
            </Form.Item>
            <Form.Item name="address" label="Хаяг" className="sm:col-span-2">
              <Input />
            </Form.Item>
          </div>

          <h2 className="mb-3 mt-2 text-base font-semibold">Сургалт</h2>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="school" label="Сургууль">
              <Input />
            </Form.Item>
            <Form.Item name="major" label="Мэргэжил">
              <Input />
            </Form.Item>
            <Form.Item name="course_year" label="Курс">
              <InputNumber min={1} max={6} className="w-full" />
            </Form.Item>
            <Form.Item name="student_card_no" label="Оюутны үнэмлэх">
              <Input />
            </Form.Item>
          </div>

          <h2 className="mb-3 mt-2 text-base font-semibold">Дадлага</h2>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
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
            <Form.Item name="start_date" label="Эхлэх" {...dateFormItemProps()}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="end_date" label="Дуусах" {...dateFormItemProps()}>
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="department" label="Хэлтэс / нэгж">
              <Input />
            </Form.Item>
          </div>

          <h2 className="mb-3 mt-2 text-base font-semibold">Яаралтай холбоо</h2>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <Form.Item name="emergency_contact" label="Холбоо барих">
              <Input />
            </Form.Item>
            <Form.Item name="emergency_phone" label="Утас">
              <Input />
            </Form.Item>
            <Form.Item name="notes" label="Тэмдэглэл" className="sm:col-span-2">
              <Input.TextArea rows={3} />
            </Form.Item>
          </div>
        </Form>
      )}
    </div>
  );
}
