'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tag,
  Avatar,
  Tooltip,
  Descriptions,
  Divider,
  Dropdown,
  Menu,
  message,
  Badge,
  Form,
  Input,
  InputNumber,
  Select,
  Drawer
} from 'antd';
import {
  PlusOutlined,
  UserAddOutlined,
  EllipsisOutlined,
  ShareAltOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined
} from '@ant-design/icons';

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

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formDrawerVisible, setFormDrawerVisible] = useState(false);
  const [form] = Form.useForm<Project>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`);
        const result = await res.json();
        if (result.success) {
          setProjects(result.data);
        } else {
          console.error('Failed to fetch projects');
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

  const openEditDrawer = (project: Project) => {
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
        body: JSON.stringify(values)
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
      onClick={({ key }) => {
        if (key === 'edit') openEditDrawer(project);
        else if (key === 'invite') {/* invite logic */ }
        else message.info(`"${project.name}" дээр ${key} үйлдэл.`);
      }}
      items={[
        { key: 'invite', label: 'Хэрэглэгч урь', icon: <UserAddOutlined /> },
        { key: 'duplicate', label: 'Хувилах', icon: <CopyOutlined /> },
        { key: 'edit', label: 'Засах', icon: <EditOutlined /> },
        { key: 'archive', label: 'Архивлах', icon: <InboxOutlined /> },
        { key: 'delete', label: 'Устгах', icon: <DeleteOutlined />, danger: true }
      ]}
    />
  );

  return (
    <div style={{ padding: '24px' }}>
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4}>Төслийн жагсаалт</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Шинэ төсөл
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        {projects.map((project) => (
          <Col key={project.id} xs={24} sm={12} md={12} lg={6}>
            <Card
              title={<Text strong style={{ color: '#1890ff', fontSize: 16 }}>{project.name}</Text>}
              bordered
              extra={
                <Dropdown overlay={menu(project)} trigger={['click']}>
                  <EllipsisOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
                </Dropdown>
              }
              bodyStyle={{ paddingBottom: 12 }}
            >
              <Descriptions column={1} size="small" contentStyle={{ fontWeight: 500 }} labelStyle={{ fontWeight: 600 }}>
                <Descriptions.Item label="Байршил">{project.location}</Descriptions.Item>
                <Descriptions.Item label="Зорилго">{project.purpose}</Descriptions.Item>
                <Descriptions.Item label="Инженер">
                  <Tag color="purple">{project.engineer}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Тоног төхөөрөмж">{project.equipment}</Descriptions.Item>
                <Descriptions.Item label="Ажилтан">{project.staff}</Descriptions.Item>
                <Descriptions.Item label="Төсөв">
                  <Text type="danger" strong>
                    {project.budget.toLocaleString()}₮
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Төлөв">{statusTag(project.status)}</Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: '8px 0' }} />

              <Space size="middle" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Badge count={12} offset={[10, 0]} size="small" style={{ backgroundColor: '#52c41a' }}>
                  <Text strong>Даалгавар</Text>
                </Badge>
                <div>
                  <Text strong>Хэрэглэгчид:</Text>
                  <Avatar.Group maxCount={3} maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>
                    <Avatar>A</Avatar>
                    <Avatar>B</Avatar>
                    <Avatar>C</Avatar>
                  </Avatar.Group>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Drawer
        title={isEditMode ? 'Төслийг засах' : 'Шинэ төсөл нэмэх'}
        width={480}
        onClose={() => setFormDrawerVisible(false)}
        visible={formDrawerVisible}
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
