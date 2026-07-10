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

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const baseUrl = process.env.NEXT_PUBLIC_API_URL;

interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  completionPercent: number;
}

interface ProjectDetail {
  id: number;
  name: string;
  location: string;
  purpose: string;
  engineer: string;
  budget: number;
  equipment: string;
  status: number;
  staff: string;
  createdAt: string;
  stats: ProjectStats;
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

const statusConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'Төлөвлөсөн', color: 'blue' },
  2: { label: 'Явагдаж буй', color: 'orange' },
  3: { label: 'Дууссан', color: 'green' },
};

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
  const statusInfo = project ? statusConfig[project.status] ?? statusConfig[1] : statusConfig[1];
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
    if (!stats) return '#1890ff';
    if (stats.completionPercent >= 80) return '#52c41a';
    if (stats.completionPercent >= 40) return '#faad14';
    return '#1890ff';
  }, [stats]);

  if (loading && !project) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spin size="large" tip="Төсөл ачааллаж байна..." />
      </div>
    );
  }

  if (!project) return null;

  const metaItems = [
    { icon: <EnvironmentOutlined className="size-3.5" />, label: project.location || '—' },
    { icon: <UserOutlined className="size-3.5" />, label: project.engineer || '—' },
    { icon: <CalendarOutlined className="size-3.5" />, label: dayjs(project.createdAt).format('YYYY-MM-DD') },
    {
      icon: <DollarOutlined className="size-3.5" />,
      label: `${Number(project.budget || 0).toLocaleString()}₮`,
    },
  ];

  const statItems = [
    { label: 'Нийт', value: stats?.total ?? 0, color: 'text-foreground' },
    { label: 'Хүлээгдэж буй', value: stats?.todo ?? 0, color: 'text-sky-500' },
    { label: 'Явагдаж буй', value: stats?.inProgress ?? 0, color: 'text-amber-500' },
    { label: 'Дууссан', value: stats?.completed ?? 0, color: 'text-emerald-500' },
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
          <button
            type="button"
            onClick={() => router.push('/admin/project')}
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftOutlined className="size-3.5" />
            Төслийн жагсаалт
          </button>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  Зам барилгын төсөл
                </span>
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
                percent={stats?.completionPercent ?? 0}
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
                <p className="text-xs text-muted-foreground">Дууссан даалгавар</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {stats?.completed ?? 0}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / {stats?.total ?? 0}
                  </span>
                </p>
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
          defaultActiveKey="tasks"
          tabBarExtraContent={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTaskDrawerOpen(true)}>
              Шинэ даалгавар
            </Button>
          }
          items={[
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
              key: 'phases',
              label: 'Үе шатууд',
              children: (
                <ProjectPhasesTab
                  projectId={projectId}
                  initialPhases={project.phases}
                  onPhasesChange={fetchProject}
                />
              ),
            },
            {
              key: 'overview',
              label: 'Тойм',
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24}>
                    <div className="h-full rounded-xl border border-border bg-card p-6">
                      <Title level={5} style={{ marginTop: 0 }}>
                        Гүйцэтгэлийн график
                      </Title>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 180, paddingTop: 24 }}>
                        {[
                          { label: 'Хүлээгдэж буй', value: stats?.todo ?? 0, color: '#1890ff' },
                          { label: 'Явагдаж буй', value: stats?.inProgress ?? 0, color: '#fa8c16' },
                          { label: 'Дууссан', value: stats?.completed ?? 0, color: '#52c41a' },
                        ].map((bar) => {
                          const max = Math.max(stats?.total ?? 1, 1);
                          const height = Math.max(8, (bar.value / max) * 140);
                          return (
                            <div key={bar.label} style={{ flex: 1, textAlign: 'center' }}>
                              <div
                                style={{
                                  height,
                                  background: bar.color,
                                  borderRadius: '6px 6px 0 0',
                                  margin: '0 auto',
                                  width: '70%',
                                  transition: 'height 0.4s ease',
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
                      <Progress
                        percent={stats?.completionPercent ?? 0}
                        strokeColor={progressColor}
                        style={{ marginTop: 24 }}
                        format={(p) => `Нийт ${p}%`}
                      />
                    </div>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'equipment',
              label: 'Тоног төхөөрөмж',
              children: <ProjectEquipmentTab projectId={projectId} />,
            },
            {
              key: 'team',
              label: `Бригад (${brigadeMembers.length})`,
              children: (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text type="secondary">Төсөл дээр ажиллаж буй бригадын гишүүд</Text>
                    <Button type="primary" icon={<UserAddOutlined />} onClick={openMemberDrawer}>
                      Хүн нэмэх
                    </Button>
                  </div>
                  <Row gutter={[16, 16]}>
                    {brigadeMembers.length === 0 ? (
                      <Col span={24}>
                        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
                          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                            Бригадын гишүүн байхгүй байна
                          </Text>
                          <Button type="primary" icon={<UserAddOutlined />} onClick={openMemberDrawer}>
                            Эхний гишүүн нэмэх
                          </Button>
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
              ),
            },
            {
              key: 'info',
              label: 'Мэдээлэл',
              children: (
                <Row gutter={[24, 16]}>
                  {[
                    { icon: <EnvironmentOutlined />, label: 'Байршил', value: project.location },
                    { icon: <UserOutlined />, label: 'Инженер', value: project.engineer },
                    { icon: <TeamOutlined />, label: 'Ажилтан', value: project.staff },
                    { icon: <ToolOutlined />, label: 'Тоног төхөөрөмж', value: project.equipment },
                    {
                      icon: <DollarOutlined />,
                      label: 'Төсөв',
                      value: `${Number(project.budget).toLocaleString()}₮`,
                    },
                    { icon: <CalendarOutlined />, label: 'Үүссэн огноо', value: dayjs(project.createdAt).format('YYYY-MM-DD') },
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
                  {project.purpose && (
                    <Col span={24}>
                      <div className="rounded-[10px] border border-border bg-card p-5">
                        <Text type="secondary">Зорилго</Text>
                        <Paragraph style={{ marginBottom: 0, marginTop: 4 }}>{project.purpose}</Paragraph>
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
