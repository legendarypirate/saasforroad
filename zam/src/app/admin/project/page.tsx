'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Typography,
  Tag,
  Dropdown,
  message,
  Form,
  Input,
  InputNumber,
  Select,
  Drawer,
  Progress,
} from '@/components/admin/primitives';
import {
  PlusOutlined,
  UserAddOutlined,
  EllipsisOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  EnvironmentOutlined,
  UserOutlined,
  RightOutlined,
} from '@/components/admin/icons';
import StaffAvatarGroup, { buildMembersFromProject } from '@/components/StaffAvatarGroup';
import { cn } from '@/lib/utils';

const { Title, Text } = Typography;
const { Option } = Select;

interface Project {
  id?: number;
  name: string;
  location: string;
  purpose: string;
  engineer: string;
  budget: number;
  equipment: string;
  status: number;
  staff: string;
  createdAt: string;
  users?: Array<{
    id: number;
    username?: string;
    email?: string;
    position?: string;
    invite?: { inviteStatus?: string; role?: string };
  }>;
}

interface TaskSummary {
  project_id: number;
  status: string | number;
}

const STATUS_META: Record<
  number,
  { label: string; color: string; dot: string }
> = {
  1: { label: 'Төлөвлөсөн', color: 'blue', dot: 'bg-sky-500' },
  2: { label: 'Явагдаж буй', color: 'orange', dot: 'bg-amber-500' },
  3: { label: 'Дууссан', color: 'green', dot: 'bg-emerald-500' },
};

function normalizeStatus(status: number) {
  return STATUS_META[status] ? status : 1;
}

function statusTag(status: number) {
  const meta = STATUS_META[normalizeStatus(status)];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

function computeProjectStats(tasks: TaskSummary[]) {
  const map: Record<number, { total: number; done: number }> = {};
  tasks.forEach((t) => {
    const pid = t.project_id;
    if (!map[pid]) map[pid] = { total: 0, done: 0 };
    map[pid].total += 1;
    const isDone = t.status === 3 || t.status === 'Completed';
    if (isDone) map[pid].done += 1;
  });
  return map;
}

function formatBudget(value: number) {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}сая₮`;
  return `${n.toLocaleString()}₮`;
}

export default function ProjectPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskStats, setTaskStats] = useState<Record<number, { total: number; done: number }>>({});
  const [formDrawerVisible, setFormDrawerVisible] = useState(false);
  const [form] = Form.useForm<Project>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [projRes, taskRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task`),
        ]);
        const projResult = await projRes.json();
        const taskResult = await taskRes.json();

        if (projResult.success) {
          setProjects(projResult.data);
        }
        if (taskResult.success) {
          setTaskStats(computeProjectStats(taskResult.data));
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    })();
  }, []);

  const openAddDrawer = () => {
    setIsEditMode(false);
    setEditingProjectId(null);
    form.resetFields();
    form.setFieldsValue({ status: 1, budget: 0 });
    setFormDrawerVisible(true);
  };

  const openEditDrawer = (project: Project) => {
    setIsEditMode(true);
    setEditingProjectId(project.id ?? null);
    form.setFieldsValue({ ...project, status: normalizeStatus(project.status) });
    setFormDrawerVisible(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, status: normalizeStatus(Number(values.status)) };
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/project${isEditMode && editingProjectId ? `/${editingProjectId}` : ''}`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        message.success(isEditMode ? 'Төсөл шинэчлэгдлээ' : 'Төсөл нэмэгдлээ');
        setFormDrawerVisible(false);

        if (isEditMode) {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === editingProjectId
                ? { ...payload, id: editingProjectId!, createdAt: p.createdAt, users: p.users }
                : p,
            ),
          );
        } else {
          setProjects((prev) => [...prev, result.data]);
        }
      } else {
        message.error('Алдаа гарлаа, дахин оролдоно уу.');
      }
    } catch {
      message.error('Формийн утга буруу байна.');
    }
  };

  const projectActions = (project: Project) => [
    {
      key: 'view',
      label: 'Дэлгэрэнгүй харах',
      icon: <RightOutlined className="size-3.5" />,
      onClick: () => router.push(`/admin/project/${project.id}`),
    },
    {
      key: 'edit',
      label: 'Засах',
      icon: <EditOutlined className="size-3.5" />,
      onClick: () => openEditDrawer(project),
    },
    {
      key: 'invite',
      label: 'Хэрэглэгч урь',
      icon: <UserAddOutlined className="size-3.5" />,
      onClick: () => message.info(`"${project.name}" — урилга удахгүй`),
    },
    {
      key: 'duplicate',
      label: 'Хувилах',
      icon: <CopyOutlined className="size-3.5" />,
      onClick: () => message.info(`"${project.name}" — хувилах удахгүй`),
    },
    {
      key: 'archive',
      label: 'Архивлах',
      icon: <InboxOutlined className="size-3.5" />,
      onClick: () => message.info(`"${project.name}" — архивлах удахгүй`),
    },
    {
      key: 'delete',
      label: 'Устгах',
      icon: <DeleteOutlined className="size-3.5" />,
      danger: true,
      onClick: () => message.info(`"${project.name}" — устгах удахгүй`),
    },
  ];

  const summary = useMemo(() => {
    const ongoing = projects.filter((p) => normalizeStatus(p.status) === 2).length;
    const planned = projects.filter((p) => normalizeStatus(p.status) === 1).length;
    const done = projects.filter((p) => normalizeStatus(p.status) === 3).length;
    return { total: projects.length, ongoing, planned, done };
  }, [projects]);

  const summaryChips = [
    { label: 'Нийт', value: summary.total, className: 'bg-muted text-foreground' },
    { label: 'Явагдаж буй', value: summary.ongoing, className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    { label: 'Төлөвлөсөн', value: summary.planned, className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
    { label: 'Дууссан', value: summary.done, className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <Title level={4} className="!mb-1">
              Төслийн жагсаалт
            </Title>
            <Text type="secondary">Зам барилгын төслүүд болон гүйцэтгэлийн тойм</Text>
          </div>
          <div className="flex flex-wrap gap-2">
            {summaryChips.map((chip) => (
              <span
                key={chip.label}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                  chip.className,
                )}
              >
                <span className="opacity-70">{chip.label}</span>
                <span className="tabular-nums font-semibold">{chip.value}</span>
              </span>
            ))}
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Шинэ төсөл
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <Text type="secondary" className="mb-4 block">
            Төсөл бүртгэгдээгүй байна
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
            Эхний төсөл нэмэх
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {projects.map((project) => {
            const stats = project.id ? taskStats[project.id] : undefined;
            const percent =
              stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
            const progressColor =
              percent >= 80 ? '#22c55e' : percent >= 40 ? '#f59e0b' : '#38bdf8';
            const members = buildMembersFromProject(project);
            const status = normalizeStatus(project.status);
            const meta = STATUS_META[status];

            return (
              <article
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/admin/project/${project.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/admin/project/${project.id}`);
                  }
                }}
                className={cn(
                  'group flex cursor-pointer flex-col rounded-2xl border border-border bg-card',
                  'p-5 shadow-sm transition-all duration-200',
                  'hover:border-primary/40 hover:shadow-md hover:shadow-primary/5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                )}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden />
                      {statusTag(status)}
                    </div>
                    <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                      {project.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <EnvironmentOutlined className="size-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{project.location || 'Байршил тодорхойгүй'}</span>
                    </p>
                  </div>

                  <Dropdown menu={{ items: projectActions(project) }}>
                    <button
                      type="button"
                      aria-label="Үйлдлүүд"
                      className={cn(
                        'inline-flex size-8 shrink-0 items-center justify-center rounded-lg',
                        'text-muted-foreground transition-colors',
                        'hover:bg-muted hover:text-foreground',
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EllipsisOutlined className="size-4" />
                    </button>
                  </Dropdown>
                </div>

                <div className="mb-4 flex items-center gap-4 rounded-xl bg-muted/40 px-3 py-3">
                  <Progress
                    type="circle"
                    percent={percent}
                    size={56}
                    strokeWidth={7}
                    strokeColor={progressColor}
                    trailColor="color-mix(in oklab, var(--muted-foreground) 25%, transparent)"
                    format={(p) => (
                      <span className="text-xs font-semibold tabular-nums text-foreground">{p}%</span>
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Гүйцэтгэл
                    </p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                      {stats?.done ?? 0}
                      <span className="font-normal text-muted-foreground"> / {stats?.total ?? 0}</span>
                      <span className="ml-1 text-xs font-normal text-muted-foreground">даалгавар</span>
                    </p>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <UserOutlined className="size-3 shrink-0 opacity-70" />
                      <span className="truncate">
                        {project.engineer?.trim() || 'Инженер тодорхойгүй'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/70 pt-4">
                  <div className="min-w-0">
                    <p className="mb-1.5 text-[11px] text-muted-foreground">Баг</p>
                    <StaffAvatarGroup members={members} maxCount={4} size={28} showEmpty />
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 text-[11px] text-muted-foreground">Төсөв</p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatBudget(Number(project.budget))}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Drawer
        title={isEditMode ? 'Төслийг засах' : 'Шинэ төсөл нэмэх'}
        width={480}
        onClose={() => setFormDrawerVisible(false)}
        open={formDrawerVisible}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setFormDrawerVisible(false)}>Болих</Button>
            <Button onClick={handleFormSubmit} type="primary">
              {isEditMode ? 'Хадгалах' : 'Нэмэх'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1, budget: 0 }}>
          <Form.Item label="Нэр" name="name" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
            <Input placeholder="Жишээ: УБ — Дархан зам" />
          </Form.Item>
          <Form.Item label="Байршил" name="location" rules={[{ required: true, message: 'Байршил оруулна уу' }]}>
            <Input placeholder="Хот / аймаг / хэсэг" />
          </Form.Item>
          <Form.Item label="Зорилго" name="purpose">
            <Input.TextArea rows={2} placeholder="Товч зорилго..." />
          </Form.Item>
          <Form.Item label="Инженер" name="engineer">
            <Input placeholder="Хариуцсан инженер" />
          </Form.Item>
          <Form.Item label="Тоног төхөөрөмж" name="equipment">
            <Input placeholder="Товч тэмдэглэл (заавал биш)" />
          </Form.Item>
          <Form.Item label="Ажилтан" name="staff">
            <Input placeholder="Нэрсийг таслалаар" />
          </Form.Item>
          <Form.Item label="Төсөв (₮)" name="budget" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item label="Төлөв" name="status" rules={[{ required: true, message: 'Төлөв сонгоно уу' }]}>
            <Select>
              <Option value={1}>Төлөвлөсөн</Option>
              <Option value={2}>Явагдаж буй</Option>
              <Option value={3}>Дууссан</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
