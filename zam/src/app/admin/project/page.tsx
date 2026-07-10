'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  DatePicker,
  Modal,
} from '@/components/admin/primitives';
import {
  PlusOutlined,
  EllipsisOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  EnvironmentOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@/components/admin/icons';
import StaffAvatarGroup, { buildMembersFromProject } from '@/components/StaffAvatarGroup';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import {
  PROJECT_STATUS_META,
  formatBudget,
  formatKmRange,
  normalizeProjectStatus,
  type ProjectRecord,
} from '@/lib/project';

const { Title, Text } = Typography;
const { Option } = Select;
const API = process.env.NEXT_PUBLIC_API_URL;

interface TaskSummary {
  project_id: number;
  status: string | number;
}

function statusTag(status: number) {
  const meta = PROJECT_STATUS_META[normalizeProjectStatus(status)];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

function computeProjectStats(tasks: TaskSummary[]) {
  const map: Record<number, { total: number; done: number }> = {};
  tasks.forEach((t) => {
    const pid = t.project_id;
    if (!map[pid]) map[pid] = { total: 0, done: 0 };
    map[pid].total += 1;
    if (t.status === 3 || t.status === 'Completed') map[pid].done += 1;
  });
  return map;
}

export default function ProjectPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [taskStats, setTaskStats] = useState<Record<number, { total: number; done: number }>>({});
  const [formDrawerVisible, setFormDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const qs = params.toString() ? `?${params}` : '';

      const [projRes, taskRes] = await Promise.all([
        fetch(`${API}/api/project${qs}`),
        fetch(`${API}/api/task`),
      ]);
      const projResult = await projRes.json();
      const taskResult = await taskRes.json();
      if (projResult.success) setProjects(projResult.data);
      if (taskResult.success) setTaskStats(computeProjectStats(taskResult.data));
    } catch (err) {
      console.error(err);
      message.error('Төсөл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    document.title = 'Төслүүд';
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const openAddDrawer = () => {
    setIsEditMode(false);
    setEditingProjectId(null);
    form.resetFields();
    form.setFieldsValue({
      status: 1,
      budget: 0,
      progress_percent: 0,
      progress_unit: '%',
    });
    setFormDrawerVisible(true);
  };

  const openEditDrawer = (project: ProjectRecord) => {
    setIsEditMode(true);
    setEditingProjectId(project.id ?? null);
    form.setFieldsValue({
      ...project,
      status: normalizeProjectStatus(project.status),
      planned_start: project.planned_start ? dayjs(project.planned_start) : null,
      planned_end: project.planned_end ? dayjs(project.planned_end) : null,
      actual_start: project.actual_start ? dayjs(project.actual_start) : null,
      actual_end: project.actual_end ? dayjs(project.actual_end) : null,
    });
    setFormDrawerVisible(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        planned_start: values.planned_start
          ? dayjs(values.planned_start).format('YYYY-MM-DD')
          : null,
        planned_end: values.planned_end ? dayjs(values.planned_end).format('YYYY-MM-DD') : null,
        actual_start: values.actual_start
          ? dayjs(values.actual_start).format('YYYY-MM-DD')
          : null,
        actual_end: values.actual_end ? dayjs(values.actual_end).format('YYYY-MM-DD') : null,
      };
      const apiUrl = `${API}/api/project${isEditMode && editingProjectId ? `/${editingProjectId}` : ''}`;
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
        load();
      } else {
        message.error(result.message || 'Алдаа гарлаа');
      }
    } catch {
      message.error('Формийн утга буруу байна.');
    }
  };

  const runAction = async (key: string, project: ProjectRecord) => {
    if (!project.id) return;
    if (key === 'view') {
      router.push(`/admin/project/${project.id}`);
      return;
    }
    if (key === 'edit') {
      openEditDrawer(project);
      return;
    }
    if (key === 'duplicate') {
      const res = await fetch(`${API}/api/project/${project.id}/duplicate`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        message.success('Хуулбар үүслээ');
        load();
      } else message.error(result.message || 'Алдаа');
      return;
    }
    if (key === 'archive') {
      const res = await fetch(`${API}/api/project/${project.id}/archive`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        message.success('Архивлагдлаа');
        load();
      } else message.error(result.message || 'Алдаа');
      return;
    }
    if (key === 'delete') {
      Modal.confirm({
        title: `"${project.name}" устгах уу?`,
        content: 'Энэ үйлдлийг буцаах боломжгүй.',
        okType: 'danger',
        onOk: async () => {
          const res = await fetch(`${API}/api/project/${project.id}`, { method: 'DELETE' });
          const result = await res.json();
          if (result.success) {
            message.success('Устгагдлаа');
            load();
          } else message.error(result.message || 'Алдаа');
        },
      });
    }
  };

  const summary = useMemo(() => {
    const active = projects.filter((p) => normalizeProjectStatus(p.status) !== 4);
    return {
      total: active.length,
      ongoing: projects.filter((p) => p.status === 2).length,
      planned: projects.filter((p) => p.status === 1).length,
      done: projects.filter((p) => p.status === 3).length,
      archived: projects.filter((p) => p.status === 4).length,
    };
  }, [projects]);

  const chips = [
    { key: 'all', label: 'Бүгд', value: summary.total + summary.archived },
    { key: '2', label: 'Явагдаж буй', value: summary.ongoing },
    { key: '1', label: 'Төлөвлөсөн', value: summary.planned },
    { key: '3', label: 'Дууссан', value: summary.done },
    { key: '4', label: 'Архив', value: summary.archived },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <Title level={4} className="!mb-1">
              Төслийн жагсаалт
            </Title>
            <Text type="secondary">Зам барилгын төсөл — захиалагч, км хэсэг, гүйцэтгэл, төсөв</Text>
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition',
                  statusFilter === chip.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80',
                )}
              >
                <span className="opacity-80">{chip.label}</span>
                <span className="tabular-nums font-semibold">{chip.value}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
            Шинэ төсөл
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <SearchOutlined className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Нэр, захиалагч, гэрээ, байршил..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      {loading && projects.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">Ачааллаж байна...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <Text type="secondary" className="mb-4 block">
            Төсөл олдсонгүй
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
            Эхний төсөл нэмэх
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {projects.map((project) => {
            const stats = project.id ? taskStats[project.id] : undefined;
            const taskPercent =
              stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
            const percent = Number(project.effective_progress ?? project.progress_percent ?? taskPercent);
            const progressColor =
              percent >= 80 ? '#22c55e' : percent >= 40 ? '#f59e0b' : '#38bdf8';
            const members = buildMembersFromProject(project);
            const status = normalizeProjectStatus(project.status);
            const meta = PROJECT_STATUS_META[status];
            const km = formatKmRange(project.km_from, project.km_to);

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
                  'group flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 shadow-sm',
                  'transition-all duration-200 hover:border-primary/40 hover:shadow-md',
                  status === 4 && 'opacity-70',
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={cn('size-1.5 rounded-full', meta.dot)} />
                      {statusTag(status)}
                      {project.contract_number ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                          {project.contract_number}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary">
                      {project.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <EnvironmentOutlined className="size-3.5 shrink-0 opacity-70" />
                      <span className="truncate">
                        {[project.road_name, project.location, km].filter(Boolean).join(' · ') ||
                          'Байршил тодорхойгүй'}
                      </span>
                    </p>
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'view', label: 'Дэлгэрэнгүй', onClick: () => runAction('view', project) },
                        { key: 'edit', label: 'Засах', icon: <EditOutlined className="size-3.5" />, onClick: () => runAction('edit', project) },
                        { key: 'duplicate', label: 'Хувилах', icon: <CopyOutlined className="size-3.5" />, onClick: () => runAction('duplicate', project) },
                        { key: 'archive', label: 'Архивлах', icon: <InboxOutlined className="size-3.5" />, onClick: () => runAction('archive', project) },
                        { key: 'delete', label: 'Устгах', icon: <DeleteOutlined className="size-3.5" />, danger: true, onClick: () => runAction('delete', project) },
                      ],
                    }}
                  >
                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EllipsisOutlined className="size-4" />
                    </button>
                  </Dropdown>
                </div>

                {(project.client_name || project.engineer) && (
                  <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                    {project.client_name ? (
                      <p>
                        <span className="opacity-70">Захиалагч: </span>
                        <span className="text-foreground/90">{project.client_name}</span>
                      </p>
                    ) : null}
                    {project.engineer ? (
                      <p className="flex items-center gap-1">
                        <UserOutlined className="size-3 opacity-70" />
                        {project.engineer}
                      </p>
                    ) : null}
                  </div>
                )}

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
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">
                      {stats?.done ?? 0}
                      <span className="font-normal text-muted-foreground"> / {stats?.total ?? 0}</span>
                      <span className="ml-1 text-xs font-normal text-muted-foreground">даалгавар</span>
                    </p>
                    {(project.planned_start || project.planned_end) && (
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {project.planned_start || '—'} → {project.planned_end || '—'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/70 pt-4">
                  <div>
                    <p className="mb-1.5 text-[11px] text-muted-foreground">Баг</p>
                    <StaffAvatarGroup members={members} maxCount={4} size={28} showEmpty />
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 text-[11px] text-muted-foreground">Төсөв</p>
                    <p className="text-sm font-semibold tabular-nums">
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
        width={520}
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
        <Form form={form} layout="vertical">
          <Form.Item label="Нэр" name="name" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
            <Input placeholder="Жишээ: УБ — Дархан авто зам" />
          </Form.Item>
          <Form.Item label="Захиалагч" name="client_name">
            <Input placeholder="Захиалагч байгууллага" />
          </Form.Item>
          <Form.Item label="Гэрээний дугаар" name="contract_number">
            <Input placeholder="Гэрээ №" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Замын нэр" name="road_name">
              <Input placeholder="УБ–Дархан" />
            </Form.Item>
            <Form.Item label="Байршил" name="location">
              <Input placeholder="Аймаг / хэсэг" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Эхлэх км" name="km_from">
              <InputNumber className="w-full" step={0.1} />
            </Form.Item>
            <Form.Item label="Дуусах км" name="km_to">
              <InputNumber className="w-full" step={0.1} />
            </Form.Item>
          </div>
          <Form.Item label="Зорилго" name="purpose">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Инженер" name="engineer">
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Төлөвлөсөн эхлэл" name="planned_start">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Төлөвлөсөн төгсгөл" name="planned_end">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Бодит эхлэл" name="actual_start">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Бодит төгсгөл" name="actual_end">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Гүйцэтгэл %" name="progress_percent">
              <InputNumber className="w-full" min={0} max={100} />
            </Form.Item>
            <Form.Item label="Төлөв" name="status" rules={[{ required: true }]}>
              <Select>
                <Option value={1}>Төлөвлөсөн</Option>
                <Option value={2}>Явагдаж буй</Option>
                <Option value={3}>Дууссан</Option>
                <Option value={4}>Архив</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="Төсөв (₮)" name="budget" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item label="Улирлын тэмдэглэл" name="season_note">
            <Input placeholder="Жишээ: 5–10 сар ажиллана" />
          </Form.Item>
          <Form.Item label="Ажилтан (текст)" name="staff">
            <Input placeholder="Нэрсийг таслалаар" />
          </Form.Item>
          <Form.Item label="Тэмдэглэл" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
