'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  TeamOutlined,
  ToolOutlined,
  UserAddOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LinkOutlined,
} from '@/components/admin/icons';
import dayjs from 'dayjs';
import TaskKanban from '@/components/TaskKanban';
import ProjectPhasesTab, { type ProjectPhase } from '@/components/ProjectPhasesTab';
import ProjectEquipmentTab from '@/components/ProjectEquipmentTab';
import StaffAvatarGroup, {
  buildMembersFromProject,
  buildBrigadeMembers,
  StaffAvatar,
  type StaffMember,
} from '@/components/StaffAvatarGroup';
import {
  PROJECT_STATUS_META,
  contractTypeLabel,
  formatBudget,
  formatKmRange,
  normalizeProjectStatus,
  stageLabel,
  type EarnedValue,
  type ProjectMilestone,
  type ProjectRisk,
} from '@/lib/project';
import Link from 'next/link';
import ProjectContractTab from '@/components/project/ProjectContractTab';
import ProjectPartiesTab from '@/components/project/ProjectPartiesTab';
import ProjectMilestonesTab from '@/components/project/ProjectMilestonesTab';
import ProjectProgressTab from '@/components/project/ProjectProgressTab';
import ProjectRiskTab from '@/components/project/ProjectRiskTab';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const baseUrl = process.env.NEXT_PUBLIC_API_URL;

interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  completionPercent: number;
  physicalPercent?: number;
  phasePercent?: number | null;
}

interface ProjectDetail {
  id: number;
  name: string;
  code?: string;
  location?: string;
  province?: string;
  aimag_soum?: string;
  road_name?: string;
  road_class?: string;
  km_from?: number | string | null;
  km_to?: number | string | null;
  length_km?: number | string | null;
  purpose?: string;
  client_name?: string;
  employer_name?: string;
  contractor_name?: string;
  engineer_org?: string;
  employer_rep?: string;
  contractor_rep?: string;
  contract_number?: string;
  contract_type?: string;
  contract_date?: string | null;
  currency?: string;
  retention_pct?: number | string | null;
  liquidated_damages_per_day?: number | string | null;
  funding_source?: string;
  tender_ref?: string;
  engineer?: string;
  budget: number;
  contingency_pct?: number | string | null;
  committed_amount?: number | string | null;
  equipment?: string;
  status: number;
  stage?: string;
  staff?: string;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  baseline_start?: string | null;
  baseline_end?: string | null;
  progress_percent?: number;
  progress_unit?: string;
  progress_planned?: number | string | null;
  progress_actual?: number | string | null;
  season_note?: string;
  notes?: string;
  road_project_id?: number | null;
  createdAt: string;
  delayed?: boolean;
  stats: ProjectStats;
  effective_progress?: number;
  phase_progress?: number | null;
  related?: {
    daily_reports: number;
    expenses_total: number;
    plant_sales_total: number;
    plant_sales_count: number;
    contracts: number;
    hse_incidents: number;
    equipment_count: number;
  };
  finance?: {
    budget: number;
    spent: number;
    remaining: number;
    utilization: number;
    contingency_pct?: number;
    committed_amount?: number;
  };
  earned_value?: EarnedValue;
  milestones?: ProjectMilestone[];
  risks?: ProjectRisk[];
  roadProject?: { id: number; code?: string; name?: string } | null;
  users?: Array<{
    id: number;
    username?: string;
    email?: string;
    position?: string;
    invite?: { inviteStatus?: string; role?: string };
  }>;
  phases?: ProjectPhase[];
}

interface UserOption {
  id: number;
  username?: string;
  email?: string;
  position?: string;
}

interface Milestone {
  id: number;
  name: string;
}

const BRIGADE_ROLES = [
  { value: 'Инженер', label: 'Инженер' },
  { value: 'Оператор', label: 'Оператор' },
  { value: 'Ажилчин', label: 'Ажилчин' },
  { value: 'Аюулгүй байдал', label: 'Аюулгүй байдал' },
  { value: 'member', label: 'Гишүүн' },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [taskForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editOpen, setEditOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/project/${projectId}`);
      const result = await res.json();
      if (result.success) {
        setProject(result.data);
      } else {
        message.error('Төсөл олдсонгүй');
        router.push('/admin/project');
      }
    } catch {
      message.error('Төсөл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    fetchProject();
    fetch(`${baseUrl}/api/milestone`)
      .then((r) => r.json())
      .then((d) => d.success && setMilestones(d.data))
      .catch(() => {});
  }, [fetchProject]);

  const handleTaskCreated = () => {
    setTaskDrawerOpen(false);
    taskForm.resetFields();
    setRefreshKey((k) => k + 1);
    fetchProject();
  };

  const handleAddTask = async () => {
    try {
      const values = await taskForm.validateFields();
      const res = await fetch(`${baseUrl}/api/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          project_id: Number(projectId),
          status: values.status ?? 1,
          due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        message.success('Даалгавар нэмэгдлээ');
        handleTaskCreated();
      } else {
        message.error(data.message || 'Алдаа гарлаа');
      }
    } catch {
      message.error('Форм бөглөнө үү');
    }
  };

  const stats = project?.stats;
  const statusInfo =
    PROJECT_STATUS_META[normalizeProjectStatus(project?.status ?? 1)] ?? PROJECT_STATUS_META[1];
  const physicalPercent =
    stats?.physicalPercent ??
    project?.effective_progress ??
    project?.progress_percent ??
    stats?.completionPercent ??
    0;
  const members = useMemo(
    () => (project ? buildMembersFromProject(project) : []),
    [project]
  );
  const brigadeMembers = useMemo(
    () => (project ? buildBrigadeMembers(project.users) : []),
    [project]
  );

  const existingMemberIds = useMemo(
    () => new Set(brigadeMembers.map((m) => Number(m.id)).filter((id) => !Number.isNaN(id))),
    [brigadeMembers]
  );

  const availableUsers = useMemo(
    () => allUsers.filter((u) => !existingMemberIds.has(u.id)),
    [allUsers, existingMemberIds]
  );

  const openMemberDrawer = async () => {
    setMemberDrawerOpen(true);
    memberForm.resetFields();
    memberForm.setFieldsValue({ role: 'Ажилчин' });
    setUsersLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/user`);
      const result = await res.json();
      if (result.success) {
        setAllUsers(result.data);
      }
    } catch {
      message.error('Хэрэглэгчийн жагсаалт ачаалахад алдаа гарлаа');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      const values = await memberForm.validateFields();
      setAddingMember(true);
      const res = await fetch(`${baseUrl}/api/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: values.userId,
          projectId: Number(projectId),
          role: values.role,
          inviteStatus: 'accepted',
        }),
      });
      const result = await res.json();
      if (result.success) {
        message.success('Бригадын гишүүн нэмэгдлээ');
        setMemberDrawerOpen(false);
        memberForm.resetFields();
        fetchProject();
      } else {
        message.error(result.message || 'Нэмэхэд алдаа гарлаа');
      }
    } catch {
      message.error('Форм бөглөнө үү');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      const res = await fetch(
        `${baseUrl}/api/invite/member?userId=${userId}&projectId=${projectId}`,
        { method: 'DELETE' }
      );
      const result = await res.json();
      if (result.success) {
        message.success('Бригадаас хасагдлаа');
        fetchProject();
      } else {
        message.error(result.message || 'Хасахад алдаа гарлаа');
      }
    } catch {
      message.error('Хасахад алдаа гарлаа');
    }
  };

  const progressColor = useMemo(() => {
    const pct = physicalPercent;
    if (pct >= 80) return '#52c41a';
    if (pct >= 40) return '#faad14';
    return '#1890ff';
  }, [physicalPercent]);

  const openEdit = () => {
    if (!project) return;
    editForm.setFieldsValue({
      ...project,
      status: normalizeProjectStatus(project.status),
      planned_start: project.planned_start ? dayjs(project.planned_start) : null,
      planned_end: project.planned_end ? dayjs(project.planned_end) : null,
      actual_start: project.actual_start ? dayjs(project.actual_start) : null,
      actual_end: project.actual_end ? dayjs(project.actual_end) : null,
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields();
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
      const res = await fetch(`${baseUrl}/api/project/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        message.success('Төсөл шинэчлэгдлээ');
        setEditOpen(false);
        fetchProject();
      } else message.error(result.message || 'Алдаа');
    } catch {
      message.error('Форм бөглөнө үү');
    }
  };

  if (loading && !project) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" tip="Төсөл ачааллаж байна..." />
      </div>
    );
  }

  if (!project) return null;

  const km = formatKmRange(project.km_from, project.km_to);
  const employer = project.employer_name || project.client_name;
  const metaItems = [
    {
      icon: <EnvironmentOutlined className="size-3.5" />,
      label:
        [project.road_name, project.province || project.location, km].filter(Boolean).join(' · ') ||
        '—',
    },
    employer
      ? { icon: <FileTextOutlined className="size-3.5" />, label: `Захиалагч: ${employer}` }
      : null,
    project.contract_number
      ? { icon: <FileTextOutlined className="size-3.5" />, label: `Гэрээ: ${project.contract_number}` }
      : null,
    { icon: <UserOutlined className="size-3.5" />, label: project.engineer || 'Инженер —' },
    {
      icon: <CalendarOutlined className="size-3.5" />,
      label:
        project.planned_start || project.planned_end
          ? `${project.planned_start || '—'} → ${project.planned_end || '—'}`
          : dayjs(project.createdAt).format('YYYY-MM-DD'),
    },
    {
      icon: <DollarOutlined className="size-3.5" />,
      label: formatBudget(Number(project.budget || 0)),
    },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string }>;

  const ev = project.earned_value;

  const statItems = [
    { label: 'Нийт', value: stats?.total ?? 0, color: 'text-foreground' },
    { label: 'Хүлээгдэж буй', value: stats?.todo ?? 0, color: 'text-sky-500' },
    { label: 'Явагдаж буй', value: stats?.inProgress ?? 0, color: 'text-amber-500' },
    { label: 'Дууссан', value: stats?.completed ?? 0, color: 'text-emerald-500' },
  ];

  const relatedCards = [
    {
      label: 'Өдрийн тайлан',
      value: project.related?.daily_reports ?? 0,
      href: `/admin/daily-report/list?project_id=${project.id}`,
    },
    {
      label: 'Санхүүгийн гэрээ',
      value: project.related?.contracts ?? 0,
      href: `/admin/finance/contracts`,
    },
    {
      label: 'Үйлдвэрийн борлуулалт',
      value: project.related?.plant_sales_count ?? 0,
      hint: formatBudget(project.related?.plant_sales_total ?? 0),
      href: `/admin/plant/sales`,
    },
    {
      label: 'ХАБЭА осол',
      value: project.related?.hse_incidents ?? 0,
      href: `/admin/hse/incidents`,
    },
    {
      label: 'Тоног төхөөрөмж',
      value: project.related?.equipment_count ?? 0,
      href: `#`,
      tab: 'equipment',
    },
  ];

  return (
    <div className="-m-6 min-h-[calc(100vh-112px)]">
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative px-6 pb-6 pt-5 sm:px-8 lg:px-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/project')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeftOutlined className="size-3.5" />
              Төслийн жагсаалт
            </button>
            <Button type="default" icon={<EditOutlined />} onClick={openEdit}>
              Засах
            </Button>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                {project.code ? (
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {project.code}
                  </span>
                ) : null}
                <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  {stageLabel(project.stage).split(' / ')[0]}
                </span>
                <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  {contractTypeLabel(project.contract_type)}
                </span>
                {project.road_class ? (
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                    Анги {project.road_class}
                  </span>
                ) : null}
                {project.delayed ? <Tag color="orange">Хоцорсон</Tag> : null}
                {project.season_note ? (
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                    {project.season_note}
                  </span>
                ) : null}
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {project.name}
                </h1>
                {project.purpose ? (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {project.purpose}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {metaItems.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground/90"
                  >
                    <span className="text-muted-foreground">{item.icon}</span>
                    {item.label}
                  </span>
                ))}
              </div>

              {project.finance && (
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="rounded-lg border border-border px-2.5 py-1.5">
                    Төсөв: <strong>{formatBudget(project.finance.budget)}</strong>
                  </span>
                  <span className="rounded-lg border border-border px-2.5 py-1.5">
                    Зарцуулсан:{' '}
                    <strong className="text-amber-500">{formatBudget(project.finance.spent)}</strong>
                  </span>
                  <span className="rounded-lg border border-border px-2.5 py-1.5">
                    Үлдэгдэл:{' '}
                    <strong
                      className={
                        project.finance.remaining >= 0 ? 'text-emerald-500' : 'text-red-400'
                      }
                    >
                      {formatBudget(project.finance.remaining)}
                    </strong>
                  </span>
                  {ev?.SPI != null ? (
                    <span className="rounded-lg border border-border px-2.5 py-1.5">
                      SPI:{' '}
                      <strong className={ev.SPI >= 1 ? 'text-emerald-500' : 'text-amber-500'}>
                        {ev.SPI.toFixed(2)}
                      </strong>
                    </span>
                  ) : null}
                  {ev?.CPI != null ? (
                    <span className="rounded-lg border border-border px-2.5 py-1.5">
                      CPI:{' '}
                      <strong className={ev.CPI >= 1 ? 'text-emerald-500' : 'text-amber-500'}>
                        {ev.CPI.toFixed(2)}
                      </strong>
                    </span>
                  ) : null}
                </div>
              )}

              <div>
                <p className="mb-2 text-xs text-muted-foreground">
                  Ажиллаж буй хүмүүс ({members.length})
                </p>
                <StaffAvatarGroup members={members} maxCount={8} size={36} showEmpty />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-5 rounded-2xl border border-border bg-muted/30 px-5 py-4 sm:px-6">
              <Progress
                type="circle"
                percent={physicalPercent}
                strokeColor={progressColor}
                trailColor="color-mix(in oklab, var(--muted-foreground) 22%, transparent)"
                strokeWidth={9}
                size={112}
                format={(pct) => (
                  <div className="text-center">
                    <div className="text-2xl font-bold tabular-nums text-foreground">{pct}%</div>
                    <div className="text-[11px] text-muted-foreground">Гүйцэтгэл</div>
                  </div>
                )}
              />
              <div className="min-w-[7rem]">
                <p className="text-xs text-muted-foreground">Даалгавар</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {stats?.completed ?? 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / {stats?.total ?? 0}
                  </span>
                </p>
                {stats?.phasePercent != null ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Үе шат дундаж: {stats.phasePercent}%
                  </p>
                ) : null}
                <Button
                  type="primary"
                  size="small"
                  className="mt-3"
                  icon={<PlusOutlined />}
                  onClick={() => setTaskDrawerOpen(true)}
                >
                  Даалгавар
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-background/60 px-4 py-3"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${item.color}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="px-6 pb-10 pt-6 sm:px-8 lg:px-10">
        <Tabs
          defaultActiveKey="overview"
          tabBarExtraContent={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTaskDrawerOpen(true)}>
              Шинэ даалгавар
            </Button>
          }
          items={[
            {
              key: 'overview',
              label: 'Тойм',
              children: (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'Үе шат', value: stageLabel(project.stage).split(' / ')[0] },
                      {
                        label: 'Гэрээ',
                        value: contractTypeLabel(project.contract_type).replace('FIDIC ', ''),
                      },
                      {
                        label: 'Урт',
                        value: project.length_km
                          ? `${Number(project.length_km)} км`
                          : km || '—',
                      },
                      {
                        label: 'Эрсдэл (нээлттэй өндөр)',
                        value: String(
                          (project.risks || []).filter(
                            (r) => r.status !== 'closed' && Number(r.score || 0) >= 15,
                          ).length,
                        ),
                      },
                    ].map((c) => (
                      <div key={c.label} className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs text-muted-foreground">{c.label}</p>
                        <p className="mt-1 text-lg font-semibold">{c.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border bg-card p-6">
                    <Title level={5} style={{ marginTop: 0 }}>
                      Stage-gate ахиц
                    </Title>
                    <div className="space-y-3">
                      {(project.phases || []).map((ph) => (
                        <div key={ph.id}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span>{ph.name}</span>
                            <span>{ph.completion_percent ?? 0}%</span>
                          </div>
                          <Progress
                            percent={Number(ph.completion_percent || 0)}
                            showInfo={false}
                            strokeColor={ph.color || progressColor}
                            size="small"
                          />
                        </div>
                      ))}
                      {!project.phases?.length ? (
                        <Text type="secondary">Үе шат байхгүй — төсөл үүсгэхэд автоматаар нэмэгдэнэ</Text>
                      ) : null}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-6">
                    <Title level={5} style={{ marginTop: 0 }}>
                      Даалгаврын график
                    </Title>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'flex-end',
                        height: 160,
                        paddingTop: 16,
                      }}
                    >
                      {[
                        { label: 'Хүлээгдэж буй', value: stats?.todo ?? 0, color: '#1890ff' },
                        { label: 'Явагдаж буй', value: stats?.inProgress ?? 0, color: '#fa8c16' },
                        { label: 'Дууссан', value: stats?.completed ?? 0, color: '#52c41a' },
                      ].map((bar) => {
                        const max = Math.max(stats?.total ?? 1, 1);
                        const height = Math.max(8, (bar.value / max) * 120);
                        return (
                          <div key={bar.label} style={{ flex: 1, textAlign: 'center' }}>
                            <div
                              style={{
                                height,
                                background: bar.color,
                                borderRadius: '6px 6px 0 0',
                                margin: '0 auto',
                                width: '70%',
                              }}
                            />
                            <Text strong style={{ display: 'block', marginTop: 8 }}>
                              {bar.value}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {bar.label}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'contract',
              label: 'Гэрээ',
              children: (
                <ProjectContractTab project={project} onSaved={fetchProject} />
              ),
            },
            {
              key: 'parties',
              label: 'Талууд',
              children: (
                <ProjectPartiesTab
                  project={project}
                  onSaved={fetchProject}
                  brigadeSlot={
                    <>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 16,
                        }}
                      >
                        <Text type="secondary">Талбайгийн бригад</Text>
                        <Button type="primary" icon={<UserAddOutlined />} onClick={openMemberDrawer}>
                          Хүн нэмэх
                        </Button>
                      </div>
                      <Row gutter={[16, 16]}>
                        {brigadeMembers.length === 0 ? (
                          <Col span={24}>
                            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
                              <Text type="secondary">Бригадын гишүүн байхгүй</Text>
                            </div>
                          </Col>
                        ) : (
                          brigadeMembers.map((member) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={member.id}>
                              <TeamMemberCard member={member} onRemove={handleRemoveMember} />
                            </Col>
                          ))
                        )}
                      </Row>
                    </>
                  }
                />
              ),
            },
            {
              key: 'schedule',
              label: 'Хуваарь',
              children: (
                <ProjectMilestonesTab
                  projectId={Number(projectId)}
                  phasesSlot={
                    <ProjectPhasesTab
                      projectId={projectId}
                      initialPhases={project.phases}
                      onPhasesChange={fetchProject}
                    />
                  }
                />
              ),
            },
            {
              key: 'progress',
              label: 'Ахиц / EV',
              children: (
                <ProjectProgressTab
                  project={project}
                  earnedValue={project.earned_value}
                  onSaved={fetchProject}
                />
              ),
            },
            {
              key: 'risks',
              label: 'Эрсдэл',
              children: <ProjectRiskTab projectId={Number(projectId)} />,
            },
            {
              key: 'tasks',
              label: 'Даалгаврууд',
              children: (
                <TaskKanban
                  key={refreshKey}
                  projectId={projectId}
                  onTasksChange={fetchProject}
                />
              ),
            },
            {
              key: 'equipment',
              label: 'Тоног төхөөрөмж',
              children: <ProjectEquipmentTab projectId={projectId} />,
            },
            {
              key: 'links',
              label: 'Холбоос',
              children: (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Энэ төсөлтэй холбоотой модулиудын тойм.
                  </p>
                  {project.roadProject ? (
                    <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                      Замын инженеринг:{' '}
                      <Link
                        href={`/admin/road-engineering/projects`}
                        className="font-medium text-primary"
                      >
                        {project.roadProject.code} — {project.roadProject.name}
                      </Link>
                    </div>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {relatedCards.map((card) => (
                      <Link
                        key={card.label}
                        href={card.href === '#' ? `/admin/project/${project.id}` : card.href}
                        className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/40"
                      >
                        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <LinkOutlined className="size-3.5" />
                          {card.label}
                        </div>
                        <div className="text-2xl font-semibold tabular-nums">{card.value}</div>
                        {card.hint ? (
                          <div className="mt-1 text-xs text-muted-foreground">{card.hint}</div>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              key: 'info',
              label: 'Мэдээлэл',
              children: (
                <Row gutter={[24, 16]}>
                  {[
                    { icon: <EnvironmentOutlined />, label: 'Код', value: project.code },
                    { icon: <EnvironmentOutlined />, label: 'Байршил', value: project.location },
                    { icon: <EnvironmentOutlined />, label: 'Аймаг', value: project.province },
                    { icon: <EnvironmentOutlined />, label: 'Замын нэр', value: project.road_name },
                    {
                      icon: <EnvironmentOutlined />,
                      label: 'Км хэсэг',
                      value: formatKmRange(project.km_from, project.km_to),
                    },
                    {
                      icon: <FileTextOutlined />,
                      label: 'Захиалагч',
                      value: project.employer_name || project.client_name,
                    },
                    {
                      icon: <FileTextOutlined />,
                      label: 'Гүйцэтгэгч',
                      value: project.contractor_name,
                    },
                    {
                      icon: <FileTextOutlined />,
                      label: 'Гэрээ №',
                      value: project.contract_number,
                    },
                    { icon: <UserOutlined />, label: 'Инженер', value: project.engineer },
                    {
                      icon: <DollarOutlined />,
                      label: 'Төсөв',
                      value: formatBudget(Number(project.budget)),
                    },
                    {
                      icon: <CalendarOutlined />,
                      label: 'Төлөвлөсөн хугацаа',
                      value:
                        project.planned_start || project.planned_end
                          ? `${project.planned_start || '—'} → ${project.planned_end || '—'}`
                          : null,
                    },
                    {
                      icon: <CalendarOutlined />,
                      label: 'Үүссэн огноо',
                      value: dayjs(project.createdAt).format('YYYY-MM-DD'),
                    },
                  ].map((item) => (
                    <Col xs={24} sm={12} md={8} key={item.label}>
                      <div className="flex items-start gap-3 rounded-[10px] border border-border bg-card px-5 py-4">
                        <span className="text-lg text-primary">{item.icon}</span>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.label}
                          </Text>
                          <div>
                            <Text strong>{item.value || '—'}</Text>
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                  {(project.purpose || project.notes) && (
                    <Col span={24}>
                      <div className="space-y-3 rounded-[10px] border border-border bg-card p-5">
                        {project.purpose ? (
                          <div>
                            <Text type="secondary">Зорилго</Text>
                            <Paragraph style={{ marginBottom: 0, marginTop: 4 }}>
                              {project.purpose}
                            </Paragraph>
                          </div>
                        ) : null}
                        {project.notes ? (
                          <div>
                            <Text type="secondary">Тэмдэглэл</Text>
                            <Paragraph style={{ marginBottom: 0, marginTop: 4 }}>
                              {project.notes}
                            </Paragraph>
                          </div>
                        ) : null}
                      </div>
                    </Col>
                  )}
                </Row>
              ),
            },
          ]}
        />
      </div>

      <Drawer
        title="Төсөл засах"
        width={520}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditOpen(false)}>Болих</Button>
            <Button type="primary" onClick={handleEditSave}>
              Хадгалах
            </Button>
          </div>
        }
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="client_name" label="Захиалагч">
            <Input />
          </Form.Item>
          <Form.Item name="contract_number" label="Гэрээ №">
            <Input />
          </Form.Item>
          <Form.Item name="road_name" label="Замын нэр">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="Байршил">
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="km_from" label="Эхлэх км">
              <InputNumber className="w-full" step={0.1} />
            </Form.Item>
            <Form.Item name="km_to" label="Дуусах км">
              <InputNumber className="w-full" step={0.1} />
            </Form.Item>
          </div>
          <Form.Item name="purpose" label="Зорилго">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="engineer" label="Инженер">
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="planned_start" label="Төлөвлөсөн эхлэл">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="planned_end" label="Төлөвлөсөн төгсгөл">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="actual_start" label="Бодит эхлэл">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item name="actual_end" label="Бодит төгсгөл">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="progress_percent" label="Гүйцэтгэл %">
              <InputNumber className="w-full" min={0} max={100} />
            </Form.Item>
            <Form.Item name="status" label="Төлөв" rules={[{ required: true }]}>
              <Select>
                <Option value={1}>Төлөвлөсөн</Option>
                <Option value={2}>Явагдаж буй</Option>
                <Option value={3}>Дууссан</Option>
                <Option value={4}>Архив</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="budget" label="Төсөв (₮)">
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="season_note" label="Улирлын тэмдэглэл">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Тэмдэглэл">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Шинэ даалгавар нэмэх"
        width={440}
        open={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setTaskDrawerOpen(false)} style={{ marginRight: 8 }}>
              Болих
            </Button>
            <Button type="primary" onClick={handleAddTask}>
              Нэмэх
            </Button>
          </div>
        }
      >
        <Form form={taskForm} layout="vertical" initialValues={{ status: 1, priority: 'medium' }}>
          <Form.Item label="Даалгаврын нэр" name="name" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
            <Input placeholder="Жишээ: Хөөх ажил — 12-р км" />
          </Form.Item>
          <Form.Item label="Дэлгэрэнгүй" name="detail">
            <Input.TextArea rows={3} placeholder="Тайлбар..." />
          </Form.Item>
          <Form.Item label="Үе шат (Milestone)" name="milestone_id">
            <Select allowClear placeholder="Сонгох">
              {milestones.map((ms) => (
                <Option key={ms.id} value={ms.id}>
                  {ms.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Эрэмбэлэлт" name="priority">
            <Select>
              <Option value="low">Бага</Option>
              <Option value="medium">Дунд</Option>
              <Option value="high">Өндөр</Option>
              <Option value="urgent">Яаралтай</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Дуусах хугацаа" name="due_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Бригадын гишүүн нэмэх"
        width={440}
        open={memberDrawerOpen}
        onClose={() => setMemberDrawerOpen(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setMemberDrawerOpen(false)} style={{ marginRight: 8 }}>
              Болих
            </Button>
            <Button type="primary" onClick={handleAddMember} loading={addingMember}>
              Нэмэх
            </Button>
          </div>
        }
      >
        <Form form={memberForm} layout="vertical" initialValues={{ role: 'Ажилчин' }}>
          <Form.Item
            label="Хэрэглэгч"
            name="userId"
            rules={[{ required: true, message: 'Хэрэглэгч сонгоно уу' }]}
          >
            <Select
              showSearch
              placeholder="Хэрэглэгч сонгох"
              loading={usersLoading}
              optionFilterProp="label"
              options={availableUsers.map((u) => ({
                value: u.id,
                label: u.username || u.email || `Хэрэглэгч #${u.id}`,
              }))}
              optionRender={(option) => {
                const user = availableUsers.find((u) => u.id === option.value);
                if (!user) return option.label;
                const name = user.username || user.email || `Хэрэглэгч #${user.id}`;
                return (
                  <Space>
                    <StaffAvatar name={name} size={28} />
                    <span>
                      {name}
                      {user.position ? ` · ${user.position}` : ''}
                    </span>
                  </Space>
                );
              }}
            />
          </Form.Item>
          <Form.Item label="Үүрэг" name="role" rules={[{ required: true, message: 'Үүрэг сонгоно уу' }]}>
            <Select options={BRIGADE_ROLES} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

function TeamMemberCard({
  member,
  onRemove,
}: {
  member: StaffMember;
  onRemove?: (userId: number) => void;
}) {
  return (
    <div className="relative flex h-full items-center gap-3.5 rounded-xl border border-border bg-card p-5">
      <StaffAvatar name={member.name} size={48} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <Text strong style={{ display: 'block' }}>
          {member.name}
        </Text>
        {member.role && (
          <Tag color="blue" style={{ marginTop: 4 }}>
            {member.role}
          </Tag>
        )}
        {member.email && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            {member.email}
          </Text>
        )}
      </div>
      {member.userId && onRemove && (
        <Popconfirm
          title="Бригадаас хасах уу?"
          okText="Тийм"
          cancelText="Үгүй"
          onConfirm={() => onRemove(member.userId!)}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            style={{ position: 'absolute', top: 8, right: 8 }}
          />
        </Popconfirm>
      )}
    </div>
  );
}
