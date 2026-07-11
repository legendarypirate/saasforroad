'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Avatar,
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
  Upload,
} from '@/components/admin/primitives';
import {
  ArrowLeftOutlined,
  CameraOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@/components/admin/icons';
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
  type StudentStatus,
} from '@/lib/student';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const studentId = useMemo(() => Number(id), [id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [skillDraft, setSkillDraft] = useState('');
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [form] = Form.useForm();

  const skills = normalizeSkills(student?.skills);

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
      form.setFieldsValue({
        ...data,
        gpa: data.gpa != null ? Number(data.gpa) : undefined,
      });
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
      const res = await studentApi.update(studentId, {
        ...values,
        skills,
      });
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

  const uploadPhoto = async (file: File) => {
    setImageUploading(true);
    try {
      const res = await studentApi.uploadPhoto(studentId, file);
      if (!res.success || !res.data) throw new Error(res.message || 'Зураг хадгалахад алдаа');
      message.success('Зураг хадгалагдлаа');
      setStudent(res.data);
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Зураг хадгалахад алдаа');
    } finally {
      setImageUploading(false);
    }
  };

  const persistSkills = async (next: string[]) => {
    setSkillsSaving(true);
    try {
      const res = await studentApi.update(studentId, { skills: next });
      if (!res.success || !res.data) throw new Error(res.message || 'Ур чадвар хадгалахад алдаа');
      setStudent(res.data);
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Ур чадвар хадгалахад алдаа');
    } finally {
      setSkillsSaving(false);
    }
  };

  const addSkill = async () => {
    const value = skillDraft.trim();
    if (!value) return;
    if (skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      message.warning('Энэ ур чадвар аль хэдийн нэмэгдсэн');
      return;
    }
    setSkillDraft('');
    await persistSkills([...skills, value]);
  };

  const removeSkill = async (skill: string) => {
    await persistSkills(skills.filter((s) => s !== skill));
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
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin/data/student')}
        >
          Буцах
        </Button>

        <Upload
          showUploadList={false}
          accept="image/jpeg,image/png,image/webp"
          beforeUpload={(file) => {
            uploadPhoto(file);
            return false;
          }}
          disabled={imageUploading}
        >
          <div
            className="relative"
            style={{ cursor: imageUploading ? 'wait' : 'pointer' }}
            title="Зураг солих"
          >
            <Spin spinning={imageUploading}>
              <Avatar
                size={96}
                src={student.photo || undefined}
                icon={<UserOutlined />}
                style={{ border: '2px solid var(--border)' }}
              />
            </Spin>
            <div
              className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground"
            >
              <CameraOutlined />
            </div>
          </div>
        </Upload>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">{studentFullName(student)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Tag color={STUDENT_STATUS_COLORS[status] || 'default'}>
              {STUDENT_STATUS_LABELS[status] || student.status}
            </Tag>
            <span className="text-sm text-muted-foreground">
              {INTERNSHIP_TYPE_LABELS[type] || student.internship_type}
            </span>
            <span className="text-sm text-muted-foreground">
              Голч дүн: {formatGpa(student.gpa)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Зураг дээр дарж солино</p>
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
                  form.setFieldsValue({
                    ...student,
                    gpa: student.gpa != null ? Number(student.gpa) : undefined,
                  });
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

      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Ур чадвар</h2>
          {skillsSaving && <span className="text-xs text-muted-foreground">Хадгалж байна…</span>}
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {skills.length === 0 && (
            <span className="text-sm text-muted-foreground">Ур чадвар нэмээгүй</span>
          )}
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-sm"
            >
              {skill}
              <button
                type="button"
                className="ml-0.5 text-muted-foreground hover:text-destructive"
                aria-label={`${skill} устгах`}
                disabled={skillsSaving}
                onClick={() => removeSkill(skill)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex max-w-md flex-wrap gap-2">
          <Input
            placeholder="Жишээ: AutoCAD, Excel…"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onPressEnter={(e) => {
              e.preventDefault();
              addSkill();
            }}
            disabled={skillsSaving}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addSkill}
            loading={skillsSaving}
            disabled={!skillDraft.trim()}
          >
            Нэмэх
          </Button>
        </div>
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
            <Descriptions.Item label="Голч дүн">{formatGpa(student.gpa)}</Descriptions.Item>
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
            <Form.Item name="gpa" label="Голч дүн">
              <InputNumber min={0} max={4} step={0.01} className="w-full" placeholder="0.00 – 4.00" />
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
