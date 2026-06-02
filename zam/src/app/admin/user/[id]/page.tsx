'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Tabs,
  Card,
  Row,
  Col,
  Descriptions,
  Typography,
  Button,
  Form,
  Input,
  Table,
  Space,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface UserDetail {
  id: number;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  roleRecord?: { id: number; name: string };
  createdAt?: string;
  updatedAt?: string;
}

interface ActionRow {
  id: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  createdAt: string;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [actions, setActions] = useState<ActionRow[]>([]);

  const [schoolForm] = Form.useForm();
  const [familyForm] = Form.useForm();
  const [emergencyForm] = Form.useForm();
  const [licenseForm] = Form.useForm();

  const userId = useMemo(() => Number(id), [id]);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [userRes, actionRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action?user_id=${userId}`),
      ]);

      const userJson = await userRes.json();
      const actionJson = await actionRes.json();

      const userData = userJson.data ?? userJson;
      setUser(userData || null);
      if (actionJson.success) setActions(actionJson.data || []);
    } catch (err) {
      console.error(err);
      message.error('Хэрэглэгчийн мэдээлэл ачаалах үед алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Хэрэглэгчийн дэлгэрэнгүй';
    fetchData();
  }, [userId]);

  const actionColumns: ColumnsType<ActionRow> = [
    { title: 'Гарчиг', dataIndex: 'title' },
    { title: 'Тайлбар', dataIndex: 'description', render: (v) => v || '—' },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (v) => <Tag color={v === 'done' ? 'green' : 'blue'}>{v || 'open'}</Tag>,
    },
    {
      title: 'Түвшин',
      dataIndex: 'priority',
      render: (v) => v || 'medium',
    },
    {
      title: 'Огноо',
      dataIndex: 'createdAt',
      render: (v) => new Date(v).toLocaleString(),
    },
  ];

  const fakeSave = () => message.success('Хадгаллаа (дараагийн алхам: DB холболт)');

  const items = [
    {
      key: 'general',
      label: 'Үндсэн мэдээлэл',
      children: (
        <Card loading={loading}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="ID">{user?.id ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Нэвтрэх нэр">{user?.username || '—'}</Descriptions.Item>
            <Descriptions.Item label="И-мэйл">{user?.email || '—'}</Descriptions.Item>
            <Descriptions.Item label="Утас">{user?.phone || '—'}</Descriptions.Item>
            <Descriptions.Item label="Эрх" span={2}>
              {user?.roleRecord?.name || user?.role || '—'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'school',
      label: 'Төгссөн сургууль',
      children: (
        <Card>
          <Form form={schoolForm} layout="vertical" onFinish={fakeSave}>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="schoolName" label="Сургуулийн нэр"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="major" label="Мэргэжил"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="degree" label="Зэрэг"><Input placeholder="Бакалавр, Магистр..." /></Form.Item></Col>
              <Col span={12}><Form.Item name="graduationYear" label="Төгссөн он"><Input /></Form.Item></Col>
            </Row>
            <Button type="primary" htmlType="submit">Хадгалах</Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'family',
      label: 'Гэр бүлийн байдал',
      children: (
        <Card>
          <Form form={familyForm} layout="vertical" onFinish={fakeSave}>
            <Row gutter={16}>
              <Col span={12}><Form.Item name="maritalStatus" label="Гэрлэлтийн байдал"><Input /></Form.Item></Col>
              <Col span={12}><Form.Item name="childrenCount" label="Хүүхдийн тоо"><Input /></Form.Item></Col>
              <Col span={24}><Form.Item name="familyNote" label="Тэмдэглэл"><Input.TextArea rows={3} /></Form.Item></Col>
            </Row>
            <Button type="primary" htmlType="submit">Хадгалах</Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'emergency',
      label: 'Яаралтай үед холбоо барих хүмүүс',
      children: (
        <Card>
          <Form form={emergencyForm} layout="vertical" onFinish={fakeSave}>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="name" label="Нэр"><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name="relation" label="Хамаарал"><Input placeholder="Эцэг, эх, эхнэр..." /></Form.Item></Col>
              <Col span={8}><Form.Item name="phone" label="Утас"><Input /></Form.Item></Col>
              <Col span={24}><Form.Item name="address" label="Хаяг"><Input /></Form.Item></Col>
            </Row>
            <Button type="primary" htmlType="submit">Хадгалах</Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'license',
      label: 'Жолооны үнэмлэх',
      children: (
        <Card>
          <Form form={licenseForm} layout="vertical" onFinish={fakeSave}>
            <Row gutter={16}>
              <Col span={8}><Form.Item name="licenseNo" label="Үнэмлэх №"><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name="category" label="Ангилал"><Input placeholder="B, C, CE..." /></Form.Item></Col>
              <Col span={8}><Form.Item name="expiry" label="Хүчинтэй хугацаа"><Input placeholder="YYYY-MM-DD" /></Form.Item></Col>
            </Row>
            <Button type="primary" htmlType="submit">Хадгалах</Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'disciplinary',
      label: 'Сахилгын арга хэмжээ',
      children: (
        <Card>
          <Table rowKey="id" columns={actionColumns} dataSource={actions} pagination={{ pageSize: 8 }} />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => router.push('/admin/user')}>Буцах</Button>
        <Title level={4} style={{ margin: 0 }}>Хэрэглэгчийн дэлгэрэнгүй</Title>
        <Text type="secondary">{user?.username ? `(${user.username})` : ''}</Text>
      </Space>

      <Tabs defaultActiveKey="general" items={items} />
    </div>
  );
}
