'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tag,
  Tooltip,
  Dropdown,
  Menu,
  message,
  Form,
  Input,
  InputNumber,
  Select,
  Drawer,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  UserAddOutlined,
  EllipsisOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  EnvironmentOutlined,
  RightOutlined,
} from '@ant-design/icons';
import StaffAvatarGroup, { buildMembersFromProject } from '@/components/StaffAvatarGroup';

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

const statusTag = (status: number) => {
  switch (status) {
    case 1:
      return <Tag color="blue">Төлөвлөсөн</Tag>;
    case 2:
      return <Tag color="orange">Явагдаж буй</Tag>;
    case 3:
      return <Tag color="green">Дууссан</Tag>;
    default:
      return <Tag color="default">Тодорхойгүй</Tag>;
  }
};

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
    setFormDrawerVisible(true);
  };

  const openEditDrawer = (project: Project, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditMode(true);
    setEditingProjectId(project.id ?? null);
    form.setFieldsValue({ ...project });
    setFormDrawerVisible(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/project${isEditMode && editingProjectId ? `/${editingProjectId}` : ''}`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await res.json();

      if (result.success) {
        message.success(isEditMode ? 'Төсөл шинэчлэгдлээ' : 'Төсөл нэмэгдлээ');
        setFormDrawerVisible(false);

        if (isEditMode) {
          setProjects((prev) =>
            prev.map((p) => (p.id === editingProjectId ? { ...values, id: editingProjectId!, createdAt: p.createdAt } : p))
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

  const menu = (project: Project) => (
    <Menu
      onClick={({ key, domEvent }) => {
        domEvent.stopPropagation();
        if (key === 'edit') openEditDrawer(project);
        else if (key === 'view') router.push(`/admin/project/${project.id}`);
        else message.info(`"${project.name}" дээр ${key} үйлдэл.`);
      }}
      items={[
        { key: 'view', label: 'Дэлгэрэнгүй харах', icon: <RightOutlined /> },
        { key: 'invite', label: 'Хэрэглэгч урь', icon: <UserAddOutlined /> },
        { key: 'duplicate', label: 'Хувилах', icon: <CopyOutlined /> },
        { key: 'edit', label: 'Засах', icon: <EditOutlined /> },
        { key: 'archive', label: 'Архивлах', icon: <InboxOutlined /> },
        { key: 'delete', label: 'Устгах', icon: <DeleteOutlined />, danger: true },
      ]}
    />
  );

  const summary = useMemo(() => {
    const ongoing = projects.filter((p) => p.status === 2).length;
    const planned = projects.filter((p) => p.status === 1).length;
    const done = projects.filter((p) => p.status === 3).length;
    return { total: projects.length, ongoing, planned, done };
  }, [projects]);

  return (
    <div style={{ padding: '24px' }}>
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }} wrap>
        <div>
          <Title level={4} style={{ marginBottom: 4 }}>
            Төслийн жагсаалт
          </Title>
          <Text type="secondary">
            Нийт {summary.total} · Явагдаж буй {summary.ongoing} · Төлөвлөсөн {summary.planned} · Дууссан {summary.done}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Шинэ төсөл
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        {projects.map((project) => {
          const stats = project.id ? taskStats[project.id] : undefined;
          const percent = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
          const progressColor = percent >= 80 ? '#52c41a' : percent >= 40 ? '#faad14' : '#1890ff';
          const members = buildMembersFromProject(project);

          return (
            <Col key={project.id} xs={24} sm={12} lg={8} xl={6}>
              <Card
                hoverable
                onClick={() => router.push(`/admin/project/${project.id}`)}
                title={
                  <Tooltip title={project.name}>
                    <Text strong style={{ color: '#1a365d', fontSize: 15 }}>
                      {project.name}
                    </Text>
                  </Tooltip>
                }
                bordered
                extra={
                  <Dropdown overlay={menu(project)} trigger={['click']}>
                    <EllipsisOutlined
                      style={{ fontSize: 20, cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                }
                styles={{ body: { paddingBottom: 12 } }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Space wrap size={4}>
                    {statusTag(project.status)}
                    <Tag icon={<EnvironmentOutlined />}>{project.location || '—'}</Tag>
                  </Space>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Progress
                      type="circle"
                      percent={percent}
                      size={64}
                      strokeColor={progressColor}
                      format={(p) => <span style={{ fontSize: 13 }}>{p}%</span>}
                    />
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                        Гүйцэтгэл
                      </Text>
                      <Text strong>
                        {stats?.done ?? 0}/{stats?.total ?? 0} даалгавар
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {project.engineer || 'Инженер тодорхойгүй'}
                      </Text>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                        Ажиллаж буй хүмүүс
                      </Text>
                      <StaffAvatarGroup members={members} maxCount={4} size={32} showEmpty />
                    </div>
                    <Text type="danger" strong style={{ fontSize: 13 }}>
                      {Number(project.budget).toLocaleString()}₮
                    </Text>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Дэлгэрэнгүй <RightOutlined />
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Drawer
        title={isEditMode ? 'Төслийг засах' : 'Шинэ төсөл нэмэх'}
        width={480}
        onClose={() => setFormDrawerVisible(false)}
        open={formDrawerVisible}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setFormDrawerVisible(false)} style={{ marginRight: 8 }}>
              Болих
            </Button>
            <Button onClick={handleFormSubmit} type="primary">
              {isEditMode ? 'Хадгалах' : 'Нэмэх'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Нэр" name="name" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Байршил" name="location" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Зорилго" name="purpose">
            <Input />
          </Form.Item>
          <Form.Item label="Инженер" name="engineer">
            <Input />
          </Form.Item>
          <Form.Item label="Тоног төхөөрөмж" name="equipment">
            <Input />
          </Form.Item>
          <Form.Item label="Ажилтан" name="staff">
            <Input />
          </Form.Item>
          <Form.Item label="Төсөв (₮)" name="budget" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Төлөв" name="status" rules={[{ required: true }]}>
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
