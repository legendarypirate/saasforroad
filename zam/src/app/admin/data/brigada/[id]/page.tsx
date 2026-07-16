'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  Tabs,
  Table,
  Progress,
  Empty,
  Drawer,
  Popconfirm,
  Upload,
  Rate,
  Modal,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  ArrowLeftOutlined,
  StarOutlined,
} from '@/components/admin/icons';
import { formatDate } from '@/lib/userDates';
import {
  AVAILABILITY_COLORS,
  AVAILABILITY_LABELS,
  BRIGADA_API,
  BRIGADE_STATUS_COLORS,
  BRIGADE_STATUS_LABELS,
  HIRE_STATUS_COLORS,
  HIRE_STATUS_LABELS,
  brigadaApi,
  formatScore,
  normalizeSkills,
  type BrigadeAvailability,
  type BrigadeRecord,
  type BrigadeStatus,
  type HireRequest,
  type HireStatus,
} from '@/lib/brigada';

const API = process.env.NEXT_PUBLIC_API_URL || '';

const DOC_TYPES = [
  { value: 'certificate', label: 'Гэрчилгээ' },
  { value: 'license', label: 'Лиценз' },
  { value: 'insurance', label: 'Даатгал' },
  { value: 'safety', label: 'Аюулгүй байдал' },
  { value: 'other', label: 'Бусад' },
];

export default function BrigadeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const brigadeId = useMemo(() => Number(id), [id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [brigade, setBrigade] = useState<BrigadeRecord | null>(null);
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview');
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [equipments, setEquipments] = useState<{ id: number; name: string }[]>([]);

  const [hireOpen, setHireOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [reviewHire, setReviewHire] = useState<HireRequest | null>(null);

  const [form] = Form.useForm();
  const [hireForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [docForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const readOnlyTenantView = true;

  const openPasswordModal = () => {
    if (!brigade?.username && !brigade?.leader?.username) {
      message.warning('Энэ бригадад нэвтрэх нэр бүртгэгдээгүй байна');
      return;
    }
    passwordForm.resetFields();
    setPasswordOpen(true);
  };

  const handlePasswordSubmit = async () => {
    if (!brigade?.id) return;
    try {
      const values = await passwordForm.validateFields();
      const password = String(values.password || '').trim();
      const confirm = String(values.confirmPassword || '').trim();
      if (password.length < 4) {
        message.error('Нууц үг хамгийн багадаа 4 тэмдэгт байх ёстой');
        return;
      }
      if (password !== confirm) {
        message.error('Нууц үг таарахгүй байна');
        return;
      }
      setPasswordSaving(true);
      const res = await fetch(`${BRIGADA_API}/${brigade.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        message.success(result.message || 'Нууц үг солигдлоо');
        setPasswordOpen(false);
        passwordForm.resetFields();
      } else {
        message.error(result.message || 'Нууц үг солиход алдаа');
      }
    } catch {
      // validation
    } finally {
      setPasswordSaving(false);
    }
  };

  const load = async () => {
    if (!Number.isFinite(brigadeId)) return;
    setLoading(true);
    try {
      const data = await brigadaApi.get(brigadeId);
      if (!data) {
        message.error('Бригад олдсонгүй');
        router.push('/admin/data/brigada');
        return;
      }
      setBrigade(data);
      form.setFieldsValue({
        ...data,
        skills_text: normalizeSkills(data.skills).join(', '),
      });
    } catch (err) {
      console.error(err);
      message.error('Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Бригад дэлгэрэнгүй';
    load();
    fetch(`${API}/api/project`)
      .then((r) => r.json())
      .then((j) => {
        const list = Array.isArray(j) ? j : j.data || [];
        setProjects(list.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
    fetch(`${API}/api/equipment`)
      .then((r) => r.json())
      .then((j) => {
        const list = Array.isArray(j) ? j : j.data || [];
        setEquipments(list.map((e: { id: number; name: string }) => ({ id: e.id, name: e.name })));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brigadeId]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const skills = String(values.skills_text || '')
        .split(/[,;\n]/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      const res = await brigadaApi.update(brigadeId, { ...values, skills });
      if (res.success) {
        message.success('Хадгаллаа');
        setEditing(false);
        setBrigade(res.data!);
      } else {
        message.error(res.message || 'Алдаа');
      }
    } catch {
      // validation
    } finally {
      setSaving(false);
    }
  };

  const handleLogo = async (file: File) => {
    const res = await brigadaApi.uploadLogo(brigadeId, file);
    if (res.success) {
      message.success('Лого шинэчлэгдлээ');
      setBrigade(res.data!);
    } else {
      message.error(res.message || 'Алдаа');
    }
    return false;
  };

  const submitHire = async () => {
    try {
      const values = await hireForm.validateFields();
      setSaving(true);
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const res = await brigadaApi.createHire({
        brigade_id: brigadeId,
        project_id: values.project_id,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        priority: values.priority || 'normal',
        description: values.description,
        required_skills: String(values.skills_text || '')
          .split(/[,;\n]/)
          .map((s: string) => s.trim())
          .filter(Boolean),
        required_equipment: String(values.equipment_text || '')
          .split(/[,;\n]/)
          .map((s: string) => s.trim())
          .filter(Boolean),
        status: 'sent',
        requested_by: currentUser?.id ?? null,
      });
      if (res.success) {
        message.success('Hire хүсэлт илгээгдлээ');
        setHireOpen(false);
        load();
      } else message.error(res.message || 'Алдаа');
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const submitReview = async () => {
    try {
      const values = await reviewForm.validateFields();
      setSaving(true);
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const res = await brigadaApi.createReview({
        brigade_id: brigadeId,
        hire_request_id: reviewHire?.id,
        project_id: reviewHire?.project_id || values.project_id,
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
      } else message.error(res.message || 'Алдаа');
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const submitMember = async () => {
    try {
      const values = await memberForm.validateFields();
      setSaving(true);
      const res = await brigadaApi.addMember(brigadeId, {
        full_name: values.full_name,
        phone: values.phone || null,
        position: values.position || 'member',
        skills: String(values.skills_text || '')
          .split(/[,;\n]/)
          .map((s: string) => s.trim())
          .filter(Boolean),
        experience_years: values.experience_years,
      });
      if (res.success) {
        message.success('Гишүүн нэмэгдлээ');
        setMemberOpen(false);
        load();
      } else message.error(res.message || 'Алдаа');
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const submitDoc = async () => {
    try {
      const values = await docForm.validateFields();
      setSaving(true);
      const res = await brigadaApi.addDocument(brigadeId, values);
      if (res.success) {
        message.success('Баримт нэмэгдлээ');
        setDocOpen(false);
        load();
      } else message.error(res.message || 'Алдаа');
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const updateHire = async (hireId: number, status: HireStatus) => {
    const res = await brigadaApi.updateHireStatus(hireId, { status });
    if (res.success) {
      message.success('Төлөв шинэчлэгдлээ');
      load();
    } else message.error(res.message || 'Алдаа');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spin />
      </div>
    );
  }

  if (!brigade) return null;

  const skills = normalizeSkills(brigade.skills);
  const hires = brigade.hireRequests || [];
  const pendingHires = hires.filter((h) =>
    ['sent', 'changes_requested', 'rejected'].includes(h.status),
  );
  const activeProjects = hires.filter((h) => ['accepted', 'active'].includes(h.status));
  const completedProjects = hires.filter((h) => ['completed', 'reviewed'].includes(h.status));

  const memberCols: ColumnsType<(typeof brigade.members extends (infer M)[] | undefined ? M : never)> = [
    {
      title: 'Нэр',
      key: 'name',
      render: (_, r) => (
        <Space>
          <Avatar src={r.user?.profile_image || r.user?.image || r.photo || undefined} size={32}>
            {(r.user?.username || '?').slice(0, 1)}
          </Avatar>
          {r.full_name || r.username || r.user?.username || '—'}
        </Space>
      ),
    },
    { title: 'Албан тушаал', dataIndex: 'position' },
    {
      title: 'Ур чадвар',
      key: 'skills',
      render: (_, r) =>
        normalizeSkills(r.skills).length
          ? normalizeSkills(r.skills).map((s) => <Tag key={s}>{s}</Tag>)
          : '—',
    },
    {
      title: 'Туршлага',
      dataIndex: 'experience_years',
      render: (v) => (v != null ? `${v} жил` : '—'),
    },
    {
      title: 'Ирц',
      dataIndex: 'attendance_rate',
      render: (v) => `${formatScore(v, 0)}%`,
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (v) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag>,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/data/brigada')} />
          <Avatar src={brigade.logo || undefined} size={64}>
            {brigade.name.slice(0, 1)}
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">{brigade.name}</h1>
            <Space className="mt-1" wrap>
              <Tag color={BRIGADE_STATUS_COLORS[brigade.status as BrigadeStatus]}>
                {BRIGADE_STATUS_LABELS[brigade.status as BrigadeStatus] || brigade.status}
              </Tag>
              <Tag color={AVAILABILITY_COLORS[brigade.availability as BrigadeAvailability]}>
                {AVAILABILITY_LABELS[brigade.availability as BrigadeAvailability] ||
                  brigade.availability}
              </Tag>
              <span className="text-sm text-muted-foreground">
                Reputation {formatScore(brigade.reputation_score, 1)} · Үнэлгээ{' '}
                {formatScore(brigade.average_rating, 2)}
              </span>
            </Space>
          </div>
        </div>
        {readOnlyTenantView ? null : (
          <Space wrap>
            <Upload beforeUpload={handleLogo} showUploadList={false} accept="image/*">
              <Button>Лого</Button>
            </Upload>
            <Button
              onClick={() => {
                hireForm.resetFields();
                hireForm.setFieldsValue({ priority: 'normal' });
                setHireOpen(true);
              }}
            >
              Hire хүсэлт
            </Button>
            <Button onClick={openPasswordModal}>Нууц үг солих</Button>
            {!editing ? (
              <Button onClick={() => setEditing(true)}>Засах</Button>
            ) : (
              <>
                <Button onClick={() => setEditing(false)}>Болих</Button>
                <Button type="primary" loading={saving} onClick={handleSave}>
                  Хадгалах
                </Button>
              </>
            )}
          </Space>
        )}
      </div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'overview',
            label: 'Ерөнхий',
            children: editing ? (
              <Form form={form} layout="vertical" className="max-w-xl">
                <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="username" label="Нэвтрэх нэр">
                  <Input placeholder="Апп нэвтрэх нэр" />
                </Form.Item>
                <Form.Item name="leader_name" label="Ахлагчийн нэр">
                  <Input />
                </Form.Item>
                <Form.Item name="province" label="Аймаг">
                  <Input />
                </Form.Item>
                <Form.Item name="location" label="Байршил">
                  <Input />
                </Form.Item>
                <Form.Item name="contact_phone" label="Утас">
                  <Input />
                </Form.Item>
                <Form.Item name="contact_email" label="И-мэйл">
                  <Input />
                </Form.Item>
                <Form.Item name="skills_text" label="Ур чадвар">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="description" label="Тайлбар">
                  <Input.TextArea rows={4} />
                </Form.Item>
                <Form.Item name="availability" label="Боломж">
                  <Select
                    options={Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </Form.Item>
                <Form.Item name="status" label="Төлөв">
                  <Select
                    options={Object.entries(BRIGADE_STATUS_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </Form.Item>
              </Form>
            ) : (
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Ахлагч">
                  {brigade.leader_name || brigade.username || brigade.leader?.username || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Нэвтрэх нэр">{brigade.username || '—'}</Descriptions.Item>
                <Descriptions.Item label="Холбоо барих">
                  {brigade.contact_phone || '—'}
                  {brigade.contact_email ? ` · ${brigade.contact_email}` : ''}
                </Descriptions.Item>
                <Descriptions.Item label="Байршил">
                  {[brigade.province, brigade.location].filter(Boolean).join(' · ') || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Үүссэн">{formatDate(brigade.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="Ур чадвар" span={2}>
                  {skills.length ? skills.map((s) => <Tag key={s}>{s}</Tag>) : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Тайлбар" span={2}>
                  {brigade.description || '—'}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'stats',
            label: 'Статистик',
            children: (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Дууссан ажил', value: brigade.completed_tasks ?? 0 },
                  { label: 'Идэвхтэй ажил', value: brigade.active_tasks ?? 0 },
                  { label: 'Цуцлагдсан', value: brigade.cancelled_tasks ?? 0 },
                  { label: 'Дундаж үнэлгээ', value: formatScore(brigade.average_rating, 2) },
                  { label: 'Reputation', value: formatScore(brigade.reputation_score, 1) },
                  { label: 'Аюулгүй байдал', value: formatScore(brigade.safety_score, 1) },
                  { label: 'Гүйцэтгэлийн хувь', value: `${formatScore(brigade.completion_rate, 1)}%` },
                  { label: 'Дундаж саатал', value: formatScore(brigade.average_delay, 1) },
                ].map((c) => (
                  <div key={c.label} className="rounded-lg border px-3 py-3">
                    <div className="text-xs text-muted-foreground">{c.label}</div>
                    <div className="mt-1 text-xl font-semibold">{c.value}</div>
                  </div>
                ))}
              </div>
            ),
          },
          {
            key: 'members',
            label: `Гишүүд (${brigade.members?.length || 0})`,
            children: (
              <div>
                <Table
                  rowKey="id"
                  dataSource={brigade.members || []}
                  columns={memberCols}
                  pagination={false}
                />
              </div>
            ),
          },
          {
            key: 'equipment',
            label: `Техник (${brigade.equipmentLinks?.length || 0})`,
            children: (
              <div>
                {(brigade.equipmentLinks || []).length === 0 ? (
                  <Empty description="Техник байхгүй" />
                ) : (
                  <Table
                    rowKey="id"
                    pagination={false}
                    dataSource={brigade.equipmentLinks || []}
                    columns={[
                      {
                        title: 'Нэр',
                        render: (_, r) => r.equipment?.name || `#${r.equipment_id}`,
                      },
                      { title: 'Модель', render: (_, r) => r.equipment?.model || '—' },
                      {
                        title: 'Улсын дугаар',
                        render: (_, r) => r.equipment?.registration_number || '—',
                      },
                    ]}
                  />
                )}
              </div>
            ),
          },
          {
            key: 'skills',
            label: 'Ур чадвар',
            children: (
              <div className="flex flex-wrap gap-2">
                {skills.length ? (
                  skills.map((s) => (
                    <Tag key={s} className="px-3 py-1 text-sm">
                      {s}
                    </Tag>
                  ))
                ) : (
                  <Empty description="Ур чадвар бүртгэгдээгүй" />
                )}
              </div>
            ),
          },
          {
            key: 'projects',
            label: `Төслүүд${pendingHires.length ? ` (${pendingHires.length} хүлээгдэж)` : ''}`,
            children: (
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="font-medium">Хүлээгдэж буй хүсэлтүүд</h3>
                    <span className="text-xs text-muted-foreground">
                      Бригад аппаас зөвшөөрөх / татгалзах
                    </span>
                  </div>
                  {pendingHires.length === 0 ? (
                    <Empty description="Хүлээгдэж буй хүсэлт байхгүй" />
                  ) : (
                    <Table
                      rowKey="id"
                      pagination={false}
                      dataSource={pendingHires}
                      columns={[
                        {
                          title: 'Төсөл',
                          render: (_, r) => r.project?.name || `#${r.project_id}`,
                        },
                        {
                          title: 'Төлөв',
                          dataIndex: 'status',
                          render: (v: string) => (
                            <Tag color={HIRE_STATUS_COLORS[v as HireStatus]}>
                              {HIRE_STATUS_LABELS[v as HireStatus] || v}
                            </Tag>
                          ),
                        },
                        {
                          title: 'Хугацаа',
                          render: (_, r) =>
                            `${formatDate(r.start_date)} – ${formatDate(r.end_date)}`,
                        },
                        {
                          title: 'Тайлбар',
                          dataIndex: 'description',
                          ellipsis: true,
                          render: (v: string) => v || '—',
                        },
                        {
                          title: 'Хариу',
                          render: (_, r) =>
                            r.response_note || r.change_request_note || '—',
                        },
                      ]}
                    />
                  )}
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="font-medium">Идэвхтэй төслүүд</h3>
                    <span className="text-xs text-muted-foreground">
                      Зөвшөөрсөн → Идэвхжүүлэх → Дуусгах
                    </span>
                  </div>
                  {activeProjects.length === 0 ? (
                    <Empty description="Идэвхтэй төсөл байхгүй" />
                  ) : (
                    <Table
                      rowKey="id"
                      pagination={false}
                      dataSource={activeProjects}
                      columns={[
                        {
                          title: 'Төсөл',
                          render: (_, r) => r.project?.name || `#${r.project_id}`,
                        },
                        {
                          title: 'Төлөв',
                          dataIndex: 'status',
                          render: (v: string) => (
                            <Tag color={HIRE_STATUS_COLORS[v as HireStatus]}>
                              {HIRE_STATUS_LABELS[v as HireStatus] || v}
                            </Tag>
                          ),
                        },
                        {
                          title: 'Явц',
                          render: (_, r) => (
                            <Progress percent={Number(r.progress) || 0} />
                          ),
                        },
                        {
                          title: 'Хугацаа',
                          render: (_, r) =>
                            `${formatDate(r.start_date)} – ${formatDate(r.end_date)}`,
                        },
                        {
                          title: 'Тайлбар',
                          render: (_, r) =>
                            r.status === 'accepted'
                              ? 'Бригад аппаас ажил эхлүүлнэ'
                              : r.status === 'active'
                                ? 'Бригад аппаас дуусгана'
                                : '—',
                        },
                      ]}
                    />
                  )}
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="font-medium">Дууссан төслүүд</h3>
                    <span className="text-xs text-muted-foreground">
                      Дууссаны дараа од өгч үнэлнэ
                    </span>
                  </div>
                  {completedProjects.length === 0 ? (
                    <Empty description="Дууссан төсөл байхгүй" />
                  ) : (
                    <Table
                      rowKey="id"
                      pagination={false}
                      dataSource={completedProjects}
                      columns={[
                        {
                          title: 'Төсөл',
                          render: (_, r) => r.project?.name || `#${r.project_id}`,
                        },
                        {
                          title: 'Төлөв',
                          dataIndex: 'status',
                          render: (v: string) => (
                            <Tag color={HIRE_STATUS_COLORS[v as HireStatus]}>
                              {HIRE_STATUS_LABELS[v as HireStatus] || v}
                            </Tag>
                          ),
                        },
                        {
                          title: 'Хугацаа',
                          render: (_, r) =>
                            `${formatDate(r.start_date)} – ${formatDate(r.end_date)}`,
                        },
                        {
                          title: 'Үнэлгээ',
                          render: (_, r) =>
                            r.status === 'completed'
                              ? 'Үнэлгээг жагсаалтын хуудаснаас өгнө'
                              : <Tag color="gold">Үнэлсэн</Tag>,
                        },
                      ]}
                    />
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'reviews',
            label: `Үнэлгээ (${brigade.reviews?.length || 0})`,
            children: (
              <Table
                rowKey="id"
                dataSource={brigade.reviews || []}
                pagination={false}
                columns={[
                  {
                    title: 'Ерөнхий',
                    dataIndex: 'overall_rating',
                    render: (v) => (
                      <span className="inline-flex items-center gap-1.5">
                        <Rate value={Number(v) || 0} disabled allowHalf className="gap-0.5 [&_button]:size-5 [&_svg]:size-4" />
                      </span>
                    ),
                  },
                  { title: 'Чанар', dataIndex: 'quality', render: (v) => formatScore(v, 1) },
                  { title: 'АБ', dataIndex: 'safety', render: (v) => formatScore(v, 1) },
                  { title: 'Хурд', dataIndex: 'speed', render: (v) => formatScore(v, 1) },
                  {
                    title: 'Харилцаа',
                    dataIndex: 'communication',
                    render: (v) => formatScore(v, 1),
                  },
                  {
                    title: 'Сэтгэгдэл',
                    dataIndex: 'comment',
                    render: (v) => v || '—',
                  },
                  {
                    title: 'Үнэлэгч',
                    render: (_, r) => r.reviewer?.username || '—',
                  },
                  {
                    title: 'Огноо',
                    dataIndex: 'createdAt',
                    render: (v) => formatDate(v),
                  },
                ]}
              />
            ),
          },
          {
            key: 'documents',
            label: `Баримт (${brigade.documents?.length || 0})`,
            children: (
              <div>
                <Table
                  rowKey="id"
                  pagination={false}
                  dataSource={brigade.documents || []}
                  columns={[
                    { title: 'Гарчиг', dataIndex: 'title' },
                    {
                      title: 'Төрөл',
                      dataIndex: 'doc_type',
                      render: (v) => DOC_TYPES.find((d) => d.value === v)?.label || v,
                    },
                    {
                      title: 'Файл',
                      dataIndex: 'file_url',
                      render: (v) =>
                        v ? (
                          <a href={v} target="_blank" rel="noreferrer">
                            Нээх
                          </a>
                        ) : (
                          '—'
                        ),
                    },
                    {
                      title: 'Дуусах',
                      dataIndex: 'expires_at',
                      render: (v) => formatDate(v),
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'timeline',
            label: 'Түүх',
            children: (
              <div className="space-y-3">
                {(brigade.timeline || []).length === 0 ? (
                  <Empty description="Түүх байхгүй" />
                ) : (
                  (brigade.timeline || []).map((ev) => (
                    <div key={ev.id} className="rounded-lg border px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{ev.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(ev.createdAt)}
                        </div>
                      </div>
                      {ev.description && (
                        <div className="mt-1 text-sm text-muted-foreground">{ev.description}</div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        {ev.event_type}
                        {ev.actor?.username ? ` · ${ev.actor.username}` : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ),
          },
        ]}
      />

      <Drawer
        title="Hire хүсэлт илгээх"
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        width={420}
        extra={
          <Button type="primary" loading={saving} onClick={submitHire}>
            Илгээх
          </Button>
        }
      >
        <Form form={hireForm} layout="vertical">
          <Form.Item name="project_id" label="Төсөл" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>
          <Form.Item name="start_date" label="Эхлэх">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="end_date" label="Дуусах">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="priority" label="Чухалчлал">
            <Select
              options={[
                { value: 'low', label: 'Бага' },
                { value: 'normal', label: 'Энгийн' },
                { value: 'high', label: 'Өндөр' },
                { value: 'urgent', label: 'Яаралтай' },
              ]}
            />
          </Form.Item>
          <Form.Item name="skills_text" label="Шаардлагатай ур чадвар">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="equipment_text" label="Шаардлагатай техник">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Бригад үнэлэх (од өгөх)"
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        width={420}
        extra={
          <Button type="primary" loading={saving} onClick={submitReview}>
            Хадгалах
          </Button>
        }
      >
        <Form form={reviewForm} layout="vertical">
          {(['overall_rating', 'quality', 'safety', 'speed', 'communication'] as const).map(
            (field) => (
              <Form.Item
                key={field}
                name={field}
                label={
                  (
                    {
                      overall_rating: 'Ерөнхий',
                      quality: 'Чанар',
                      safety: 'Аюулгүй байдал',
                      speed: 'Хурд',
                      communication: 'Харилцаа',
                    } as const
                  )[field]
                }
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
            )
          )}
          <Form.Item name="comment" label="Сэтгэгдэл">
            <Input.TextArea rows={3} placeholder="Нэмэлт тайлбар..." />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Гишүүн нэмэх"
        open={memberOpen}
        onClose={() => setMemberOpen(false)}
        width={400}
        extra={
          <Button type="primary" loading={saving} onClick={submitMember}>
            Нэмэх
          </Button>
        }
      >
        <Form form={memberForm} layout="vertical">
          <Form.Item name="full_name" label="Нэр" rules={[{ required: true, message: 'Нэр заавал' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Утас">
            <Input />
          </Form.Item>
          <Form.Item name="position" label="Албан тушаал">
            <Input placeholder="member / engineer / operator" />
          </Form.Item>
          <Form.Item name="experience_years" label="Туршлага (жил)">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="skills_text" label="Ур чадвар">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Баримт нэмэх"
        open={docOpen}
        onClose={() => setDocOpen(false)}
        width={400}
        extra={
          <Button type="primary" loading={saving} onClick={submitDoc}>
            Хадгалах
          </Button>
        }
      >
        <Form form={docForm} layout="vertical">
          <Form.Item name="title" label="Гарчиг" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="doc_type" label="Төрөл">
            <Select options={DOC_TYPES} />
          </Form.Item>
          <Form.Item name="file_url" label="Файлын URL">
            <Input />
          </Form.Item>
          <Form.Item name="expires_at" label="Дуусах огноо">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="notes" label="Тэмдэглэл">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={`Нууц үг солих — ${brigade.username || brigade.leader?.username || 'Бригад'}`}
        open={passwordOpen}
        onCancel={() => {
          setPasswordOpen(false);
          passwordForm.resetFields();
        }}
        onOk={handlePasswordSubmit}
        okText="Хадгалах"
        cancelText="Болих"
        confirmLoading={passwordSaving}
        destroyOnClose
      >
        <p className="mb-3 text-sm text-muted-foreground">
          Бригад: <strong>{brigade.name}</strong> · Нэвтрэх нэр:{' '}
          <strong>{brigade.username || brigade.leader?.username || '—'}</strong>
        </p>
        <Form layout="vertical" form={passwordForm}>
          <Form.Item
            name="password"
            label="Шинэ нууц үг"
            rules={[{ required: true, message: 'Нууц үг оруулна уу' }]}
          >
            <Input.Password placeholder="Шинэ нууц үг" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Нууц үг давтах"
            rules={[{ required: true, message: 'Нууц үг давтана уу' }]}
          >
            <Input.Password placeholder="Нууц үг давтах" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
