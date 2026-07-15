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
  Dropdown,
  Avatar,
  Modal,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  EyeOutlined,
  ReloadOutlined,
  MoreOutlined,
  TeamOutlined,
  StarOutlined,
  MailOutlined,
  StopOutlined,
  CheckCircleOutlined,
  KeyOutlined,
} from '@/components/admin/icons';
import { formatDate } from '@/lib/userDates';
import {
  AVAILABILITY_COLORS,
  AVAILABILITY_LABELS,
  BRIGADA_API,
  BRIGADE_STATUS_COLORS,
  BRIGADE_STATUS_LABELS,
  brigadaApi,
  formatScore,
  type BrigadeAvailability,
  type BrigadeRecord,
  type BrigadeStats,
  type BrigadeStatus,
} from '@/lib/brigada';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function BrigadeListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<BrigadeRecord[]>([]);
  const [stats, setStats] = useState<BrigadeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  const [hireTarget, setHireTarget] = useState<BrigadeRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [province, setProvince] = useState<string | undefined>();
  const [availability, setAvailability] = useState<BrigadeAvailability | undefined>();
  const [status, setStatus] = useState<BrigadeStatus | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [minReputation, setMinReputation] = useState<number | undefined>();
  const [minCompleted, setMinCompleted] = useState<number | undefined>();
  const [skill, setSkill] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [hireForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [passwordTarget, setPasswordTarget] = useState<{
    brigadeId: number;
    username: string;
    brigadeName: string;
  } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const openPasswordModal = (row: BrigadeRecord) => {
    const username = row.username || row.leader?.username;
    if (!username) {
      message.warning('Энэ бригадад нэвтрэх нэр бүртгэгдээгүй байна');
      return;
    }
    setPasswordTarget({
      brigadeId: row.id,
      username,
      brigadeName: row.name,
    });
    passwordForm.resetFields();
  };

  const closePasswordModal = () => {
    setPasswordTarget(null);
    passwordForm.resetFields();
  };

  const handlePasswordSubmit = async () => {
    if (!passwordTarget) return;
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
      const res = await fetch(`${BRIGADA_API}/${passwordTarget.brigadeId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        message.success(result.message || 'Нууц үг солигдлоо');
        closePasswordModal();
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
    setLoading(true);
    try {
      const [listRes, st] = await Promise.all([
        brigadaApi.list({
          q: q.trim() || undefined,
          province,
          availability,
          status,
          min_rating: minRating,
          min_reputation: minReputation,
          min_completed: minCompleted,
          skill: skill.trim() || undefined,
          sort,
          order,
          page,
          pageSize,
        }),
        brigadaApi.stats(),
      ]);
      setRows(listRes.rows);
      setTotal(listRes.meta?.total ?? listRes.rows.length);
      setStats(st);
    } catch (err) {
      console.error(err);
      message.error('Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Бригад';
    fetch(`${API}/api/project`)
      .then((r) => r.json())
      .then((j) => {
        const list = Array.isArray(j) ? j : j.data || [];
        setProjects(list.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [province, availability, status, minRating, minReputation, minCompleted, page, pageSize, sort, order]);

  const openHire = (row: BrigadeRecord) => {
    setHireTarget(row);
    hireForm.resetFields();
    hireForm.setFieldsValue({ priority: 'normal', brigade_id: row.id });
    setHireOpen(true);
  };

  const handleHire = async () => {
    try {
      const values = await hireForm.validateFields();
      setSaving(true);
      const required_skills = String(values.skills_text || '')
        .split(/[,;\n]/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      const required_equipment = String(values.equipment_text || '')
        .split(/[,;\n]/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const res = await brigadaApi.createHire({
        brigade_id: hireTarget?.id,
        project_id: values.project_id,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        priority: values.priority,
        description: values.description,
        required_skills,
        required_equipment,
        status: 'sent',
        requested_by: currentUser?.id ?? null,
      });
      if (res.success) {
        message.success('Hire хүсэлт илгээгдлээ');
        setHireOpen(false);
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

  const setBrigadeStatus = async (row: BrigadeRecord, next: BrigadeStatus) => {
    const res = await brigadaApi.setStatus(row.id, next);
    if (res.success) {
      message.success(next === 'suspended' ? 'Түдгэлзүүллээ' : 'Идэвхжүүллээ');
      load();
    } else {
      message.error(res.message || 'Алдаа');
    }
  };

  const actionMenu = (row: BrigadeRecord) => ({
    items: [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'Дэлгэрэнгүй',
        onClick: () => router.push(`/admin/data/brigada/${row.id}`),
      },
      {
        key: 'hire',
        icon: <MailOutlined />,
        label: 'Hire хүсэлт илгээх',
        onClick: () => openHire(row),
      },
      {
        key: 'members',
        icon: <TeamOutlined />,
        label: 'Гишүүд',
        onClick: () => router.push(`/admin/data/brigada/${row.id}?tab=members`),
      },
      {
        key: 'reviews',
        icon: <StarOutlined />,
        label: 'Үнэлгээ',
        onClick: () => router.push(`/admin/data/brigada/${row.id}?tab=reviews`),
      },
      {
        key: 'password',
        icon: <KeyOutlined />,
        label: 'Ахлагчийн нууц үг солих',
        onClick: () => openPasswordModal(row),
      },
      {
        key: 'stats',
        label: 'Статистик',
        onClick: () => router.push(`/admin/data/brigada/${row.id}?tab=stats`),
      },
      row.status === 'suspended'
        ? {
            key: 'activate',
            icon: <CheckCircleOutlined />,
            label: 'Идэвхжүүлэх',
            onClick: () => setBrigadeStatus(row, 'active'),
          }
        : {
            key: 'suspend',
            icon: <StopOutlined />,
            label: 'Түдгэлзүүлэх',
            danger: true,
            onClick: () => setBrigadeStatus(row, 'suspended'),
          },
    ],
  });

  const columns: ColumnsType<BrigadeRecord> = [
    {
      title: 'Лого',
      dataIndex: 'logo',
      width: 64,
      render: (v, r) => (
        <Avatar src={v || undefined} size={40}>
          {(r.name || '?').slice(0, 1)}
        </Avatar>
      ),
    },
    {
      title: 'Бригад',
      dataIndex: 'name',
      sorter: true,
      render: (v, r) => (
        <button
          type="button"
          className="text-left font-medium text-primary hover:underline"
          onClick={() => router.push(`/admin/data/brigada/${r.id}`)}
        >
          {v}
        </button>
      ),
    },
    {
      title: 'Ахлагч',
      key: 'leader',
      render: (_, r) => r.username || r.leader?.username || r.leader_name || '—',
    },
    {
      title: 'Аймаг / Байршил',
      key: 'loc',
      render: (_, r) => (
        <div className="max-w-[160px]">
          <div className="truncate">{r.province || '—'}</div>
          <div className="truncate text-xs text-muted-foreground">{r.location || ''}</div>
        </div>
      ),
    },
    {
      title: 'Гишүүд',
      key: 'members',
      width: 80,
      render: (_, r) => r.member_count ?? r.members?.length ?? 0,
    },
    {
      title: 'Идэвхтэй төсөл',
      key: 'active',
      width: 100,
      render: (_, r) => r.active_projects ?? r.active_tasks ?? 0,
    },
    {
      title: 'Дууссан',
      dataIndex: 'completed_tasks',
      width: 80,
      sorter: true,
      render: (v) => v ?? 0,
    },
    {
      title: 'Үнэлгээ',
      dataIndex: 'average_rating',
      width: 90,
      sorter: true,
      render: (v) => formatScore(v, 2),
    },
    {
      title: 'Reputation',
      dataIndex: 'reputation_score',
      width: 100,
      sorter: true,
      render: (v) => formatScore(v, 1),
    },
    {
      title: 'Боломж',
      dataIndex: 'availability',
      width: 110,
      render: (v: string) => (
        <Tag color={AVAILABILITY_COLORS[v as BrigadeAvailability] || 'default'}>
          {AVAILABILITY_LABELS[v as BrigadeAvailability] || v}
        </Tag>
      ),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 120,
      render: (v: string) => (
        <Tag color={BRIGADE_STATUS_COLORS[v as BrigadeStatus] || 'default'}>
          {BRIGADE_STATUS_LABELS[v as BrigadeStatus] || v}
        </Tag>
      ),
    },
    {
      title: 'Үүссэн',
      dataIndex: 'createdAt',
      width: 110,
      sorter: true,
      render: (v) => formatDate(v),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right',
      render: (_, r) => (
        <Dropdown menu={actionMenu(r)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Бригад</h1>
          <p className="text-sm text-muted-foreground">
            Платформын бригад (бүртгэл: brigad app / admin.rcos.mn). Компани зөвхөн hire / үнэлгээ өгнө.
          </p>
        </div>
        <Space>
          <Button onClick={() => router.push('/admin/data/brigada/hires')}>
            Hire хүсэлтүүд
          </Button>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
        </Space>
      </div>

      {stats && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Нийт бригад', value: stats.total },
            { label: 'Боломжтой', value: stats.available },
            { label: 'Завгүй', value: stats.busy },
            { label: 'Идэвхтэй hire', value: stats.active_hire_requests },
            { label: 'Дууссан ажил', value: stats.completed_tasks },
            { label: 'Дундаж үнэлгээ', value: formatScore(stats.average_rating, 2) },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border bg-card px-3 py-3">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="mt-1 text-xl font-semibold">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input.Search
          allowClear
          placeholder="Хайх..."
          className="w-[200px] shrink-0"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={() => {
            setPage(1);
            load();
          }}
        />
        <Input
          allowClear
          placeholder="Аймаг"
          className="w-[140px] shrink-0"
          value={province || ''}
          onChange={(e) => {
            setPage(1);
            setProvince(e.target.value || undefined);
          }}
        />
        <Select
          allowClear
          placeholder="Боломж"
          className="w-[140px] shrink-0"
          value={availability}
          onChange={(v) => {
            setPage(1);
            setAvailability(v);
          }}
          options={Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Select
          allowClear
          placeholder="Төлөв"
          className="w-[140px] shrink-0"
          value={status}
          onChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
          options={Object.entries(BRIGADE_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <InputNumber
          min={0}
          max={5}
          step={0.5}
          placeholder="Мин үнэлгээ"
          className="w-[120px] shrink-0"
          value={minRating}
          onChange={(v) => {
            setPage(1);
            setMinRating(v ?? undefined);
          }}
        />
        <InputNumber
          min={0}
          max={100}
          placeholder="Мин reputation"
          className="w-[130px] shrink-0"
          value={minReputation}
          onChange={(v) => {
            setPage(1);
            setMinReputation(v ?? undefined);
          }}
        />
        <InputNumber
          min={0}
          placeholder="Мин дууссан"
          className="w-[120px] shrink-0"
          value={minCompleted}
          onChange={(v) => {
            setPage(1);
            setMinCompleted(v ?? undefined);
          }}
        />
        <Input
          allowClear
          placeholder="Ур чадвар"
          className="w-[140px] shrink-0"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          onPressEnter={() => {
            setPage(1);
            load();
          }}
        />
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 1400 }}
        onChange={(_p, _f, sorter) => {
          const s = Array.isArray(sorter) ? sorter[0] : sorter;
          if (s?.field && s.order) {
            setSort(String(s.field));
            setOrder(s.order === 'ascend' ? 'ASC' : 'DESC');
          }
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Drawer
        title={hireTarget ? `Hire: ${hireTarget.name}` : 'Hire хүсэлт'}
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        width={440}
        extra={
          <Button type="primary" loading={saving} onClick={handleHire}>
            Илгээх
          </Button>
        }
      >
        <Form form={hireForm} layout="vertical">
          <Form.Item
            name="project_id"
            label="Төсөл"
            rules={[{ required: true, message: 'Төсөл сонгоно уу' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>
          <Form.Item name="start_date" label="Эхлэх огноо">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="end_date" label="Дуусах огноо">
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

      <Modal
        title={
          passwordTarget
            ? `Нууц үг солих — ${passwordTarget.username}`
            : 'Нууц үг солих'
        }
        open={Boolean(passwordTarget)}
        onCancel={closePasswordModal}
        onOk={handlePasswordSubmit}
        okText="Хадгалах"
        cancelText="Болих"
        confirmLoading={passwordSaving}
        destroyOnClose
      >
        {passwordTarget && (
          <p className="mb-3 text-sm text-muted-foreground">
            Бригад: <strong>{passwordTarget.brigadeName}</strong> · Ахлагч:{' '}
            <strong>{passwordTarget.username}</strong>
          </p>
        )}
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
