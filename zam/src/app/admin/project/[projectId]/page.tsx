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
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import TaskKanban from '@/components/TaskKanban';

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

const ROAD_PHASES = [
  'Газар шалгалт',
  'Дөвөн хөөрөлт',
  'Хөөх ажил',
  'Асфальт',
  'Тэмдэглэгээ',
  'Хүлээлгэн өгөх',
];

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [taskForm] = Form.useForm();
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

  const progressColor = useMemo(() => {
    if (!stats) return '#1890ff';
    if (stats.completionPercent >= 80) return '#52c41a';
    if (stats.completionPercent >= 40) return '#faad14';
    return '#1890ff';
  }, [stats]);

  if (loading && !project) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Төсөл ачааллаж байна..." />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div style={{ margin: -24, minHeight: 'calc(100vh - 112px)' }}>
      {/* Hero header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 45%, #d97706 100%)',
          padding: '32px 40px 48px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 20px,
              #fff 20px,
              #fff 22px
            )`,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/project')}
            style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 16, paddingLeft: 0 }}
          >
            Төслийн жагсаалт
          </Button>

          <Row gutter={[32, 24]} align="middle">
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={8}>
                <Space wrap>
                  <Tag color={statusInfo.color} style={{ fontSize: 13, padding: '2px 10px' }}>
                    {statusInfo.label}
                  </Tag>
                  <Tag color="default" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}>
                    Зам барилгын төсөл
                  </Tag>
                </Space>
                <Title level={2} style={{ color: '#fff', margin: 0 }}>
                  {project.name}
                </Title>
                <Space wrap size="large">
                  <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <EnvironmentOutlined /> {project.location || '—'}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <UserOutlined /> {project.engineer || '—'}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <CalendarOutlined /> {dayjs(project.createdAt).format('YYYY-MM-DD')}
                  </Text>
                </Space>
                {project.purpose && (
                  <Paragraph style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 0, maxWidth: 640 }}>
                    {project.purpose}
                  </Paragraph>
                )}
              </Space>
            </Col>

            <Col xs={24} lg={8} style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={stats?.completionPercent ?? 0}
                  strokeColor={progressColor}
                  trailColor="rgba(255,255,255,0.2)"
                  strokeWidth={10}
                  size={160}
                  format={(pct) => (
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{pct}%</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Гүйцэтгэл</div>
                    </div>
                  )}
                />
                <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginTop: 8 }}>
                  {stats?.completed ?? 0} / {stats?.total ?? 0} даалгавар дууссан
                </Text>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '20px 40px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title={<Text type="secondary">Нийт даалгавар</Text>}
              value={stats?.total ?? 0}
              valueStyle={{ color: '#1a365d' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title={<Text type="secondary">Хүлээгдэж буй</Text>}
              value={stats?.todo ?? 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title={<Text type="secondary">Явагдаж буй</Text>}
              value={stats?.inProgress ?? 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title={<Text type="secondary">Дууссан</Text>}
              value={stats?.completed ?? 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>
      </div>

      {/* Main content */}
      <div style={{ padding: '24px 40px 40px', background: '#fff' }}>
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
              key: 'overview',
              label: 'Тойм',
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <div
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 24,
                        height: '100%',
                      }}
                    >
                      <Title level={5} style={{ marginTop: 0 }}>
                        Зам барилгын үе шатууд
                      </Title>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {ROAD_PHASES.map((phase, idx) => {
                          const phaseProgress = Math.min(
                            100,
                            Math.max(0, ((stats?.completionPercent ?? 0) - idx * (100 / ROAD_PHASES.length)) * (ROAD_PHASES.length / 100) * 100)
                          );
                          const isDone = (stats?.completionPercent ?? 0) >= ((idx + 1) / ROAD_PHASES.length) * 100;
                          const isActive = !isDone && (stats?.completionPercent ?? 0) >= (idx / ROAD_PHASES.length) * 100;
                          return (
                            <div key={phase}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text strong={isActive}>{phase}</Text>
                                <Tag color={isDone ? 'green' : isActive ? 'orange' : 'default'}>
                                  {isDone ? 'Дууссан' : isActive ? 'Явагдаж буй' : 'Хүлээгдэж буй'}
                                </Tag>
                              </div>
                              <Progress
                                percent={isDone ? 100 : isActive ? Math.round(phaseProgress) : 0}
                                showInfo={false}
                                strokeColor={isDone ? '#52c41a' : isActive ? '#fa8c16' : '#d9d9d9'}
                                size="small"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 24,
                        height: '100%',
                      }}
                    >
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
                      <div
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: '16px 20px',
                          display: 'flex',
                          gap: 12,
                          alignItems: 'flex-start',
                        }}
                      >
                        <span style={{ fontSize: 20, color: '#2c5282' }}>{item.icon}</span>
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
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
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
    </div>
  );
}
