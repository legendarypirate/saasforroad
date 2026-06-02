'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Tabs,
  Card,
  Descriptions,
  Typography,
  Button,
  Form,
  Input,
  Table,
  Space,
  Tag,
  Select,
  Popconfirm,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

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

interface SchoolRow {
  id: number;
  schoolName: string;
  major: string;
  degree: string;
  graduationYear: string;
}

interface FamilyRow {
  key: string;
  maritalStatus: string;
  childrenCount: string;
  familyNote: string;
}

interface EmergencyRow {
  id: number;
  name: string;
  relation: string;
  phone: string;
  address: string;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [families, setFamilies] = useState<FamilyRow[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRow[]>([]);
  const [actionSaving, setActionSaving] = useState(false);
  const [emergencySaving, setEmergencySaving] = useState(false);
  const [schoolSaving, setSchoolSaving] = useState(false);

  const [schoolForm] = Form.useForm();
  const [familyForm] = Form.useForm();
  const [emergencyForm] = Form.useForm();
  const [disciplineForm] = Form.useForm();

  const userId = useMemo(() => Number(id), [id]);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [userRes, actionRes, emergencyRes, schoolRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action?user_id=${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emergency_contact?user_id=${userId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/education?user_id=${userId}`),
      ]);

      const userJson = await userRes.json();
      const actionJson = await actionRes.json();
      const emergencyJson = await emergencyRes.json();
      const schoolJson = await schoolRes.json();

      const userData = userJson.data ?? userJson;
      setUser(userData || null);
      if (actionJson.success) setActions(actionJson.data || []);
      if (emergencyJson.success) setEmergencies(emergencyJson.data || []);
      if (schoolJson.success) {
        setSchools(
          (schoolJson.data || []).map((s: any) => ({
            id: s.id,
            schoolName: s.school_name,
            major: s.major || "",
            degree: s.degree || "",
            graduationYear: s.graduation_year || "",
          }))
        );
      }
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
    {
      title: 'Үйлдэл',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Энэ мөрийг устгах уу?"
          okText="Тийм"
          cancelText="Үгүй"
          onConfirm={() => deleteDisciplinaryAction(record.id)}
        >
          <Button danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const fakeSave = () => message.success('Хадгаллаа (дараагийн алхам: DB холболт)');

  const addSchool = async () => {
    const values = await schoolForm.validateFields();
    if (!userId) return;
    setSchoolSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/education`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          school_name: values.schoolName,
          major: values.major,
          degree: values.degree,
          graduation_year: values.graduationYear,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Хадгалах үед алдаа");
      schoolForm.resetFields();
      message.success("Төгссөн сургууль нэмэгдлээ");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Төгссөн сургууль хадгалахад алдаа гарлаа");
    } finally {
      setSchoolSaving(false);
    }
  };

  const deleteSchool = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/education/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Устгах үед алдаа");
      message.success("Төгссөн сургууль устгагдлаа");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Төгссөн сургууль устгах үед алдаа гарлаа");
    }
  };

  const addFamily = async () => {
    const values = await familyForm.validateFields();
    setFamilies((prev) => [...prev, { key: `${Date.now()}`, ...values }]);
    familyForm.resetFields();
  };

  const deleteFamily = (key: string) => {
    setFamilies((prev) => prev.filter((r) => r.key !== key));
  };

  const addEmergency = async () => {
    const values = await emergencyForm.validateFields();
    if (!userId) return;
    setEmergencySaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emergency_contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, user_id: userId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Хадгалах үед алдаа');
      emergencyForm.resetFields();
      message.success('Яаралтай холбоо барих хүн нэмэгдлээ');
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Яаралтай холбоо барих хүн хадгалахад алдаа гарлаа');
    } finally {
      setEmergencySaving(false);
    }
  };

  const deleteEmergency = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/emergency_contact/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Устгах үед алдаа');
      message.success('Яаралтай холбоо барих хүн устгагдлаа');
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Яаралтай холбоо барих хүн устгах үед алдаа гарлаа');
    }
  };

  const addDisciplinaryAction = async () => {
    if (!userId) return;
    const values = await disciplineForm.validateFields();
    setActionSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, user_id: userId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа гарлаа');
      message.success('Сахилгын арга хэмжээ нэмэгдлээ');
      disciplineForm.resetFields();
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Сахилгын арга хэмжээ нэмэх үед алдаа гарлаа');
    } finally {
      setActionSaving(false);
    }
  };

  const deleteDisciplinaryAction = async (actionId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action/${actionId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Устгах үед алдаа гарлаа');
      message.success('Сахилгын арга хэмжээ устгагдлаа');
      fetchData();
    } catch (err) {
      console.error(err);
      message.error('Сахилгын арга хэмжээ устгах үед алдаа гарлаа');
    }
  };

  const schoolColumns: ColumnsType<SchoolRow> = [
    { title: 'Сургууль', dataIndex: 'schoolName' },
    { title: 'Мэргэжил', dataIndex: 'major' },
    { title: 'Зэрэг', dataIndex: 'degree' },
    { title: 'Төгссөн он', dataIndex: 'graduationYear' },
    {
      title: 'Үйлдэл',
      key: 'action',
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => deleteSchool(record.id)} />
      ),
    },
  ];

  const familyColumns: ColumnsType<FamilyRow> = [
    { title: 'Гэрлэлтийн байдал', dataIndex: 'maritalStatus' },
    { title: 'Хүүхдийн тоо', dataIndex: 'childrenCount' },
    { title: 'Тэмдэглэл', dataIndex: 'familyNote' },
    {
      title: 'Үйлдэл',
      key: 'action',
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => deleteFamily(record.key)} />
      ),
    },
  ];

  const emergencyColumns: ColumnsType<EmergencyRow> = [
    { title: 'Нэр', dataIndex: 'name' },
    { title: 'Хамаарал', dataIndex: 'relation' },
    { title: 'Утас', dataIndex: 'phone' },
    { title: 'Хаяг', dataIndex: 'address' },
    {
      title: 'Үйлдэл',
      key: 'action',
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => deleteEmergency(record.id)} />
      ),
    },
  ];

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
          <Form form={schoolForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item name="schoolName" rules={[{ required: true, message: 'Сургууль' }]}>
              <Input placeholder="Сургуулийн нэр" />
            </Form.Item>
            <Form.Item name="major" rules={[{ required: true, message: 'Мэргэжил' }]}>
              <Input placeholder="Мэргэжил" />
            </Form.Item>
            <Form.Item name="degree">
              <Input placeholder="Зэрэг" />
            </Form.Item>
            <Form.Item name="graduationYear">
              <Input placeholder="Төгссөн он" />
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} loading={schoolSaving} onClick={addSchool} />
          </Form>
          <Table rowKey="id" columns={schoolColumns} dataSource={schools} pagination={false} />
        </Card>
      ),
    },
    {
      key: 'family',
      label: 'Гэр бүлийн байдал',
      children: (
        <Card>
          <Form form={familyForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item name="maritalStatus" rules={[{ required: true, message: 'Гэрлэлтийн байдал' }]}>
              <Input placeholder="Гэрлэлтийн байдал" />
            </Form.Item>
            <Form.Item name="childrenCount">
              <Input placeholder="Хүүхдийн тоо" />
            </Form.Item>
            <Form.Item name="familyNote">
              <Input placeholder="Тэмдэглэл" style={{ width: 320 }} />
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} onClick={addFamily} />
          </Form>
          <Table rowKey="key" columns={familyColumns} dataSource={families} pagination={false} />
        </Card>
      ),
    },
    {
      key: 'emergency',
      label: 'Яаралтай үед холбоо барих хүмүүс',
      children: (
        <Card>
          <Form form={emergencyForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item name="name" rules={[{ required: true, message: 'Нэр' }]}>
              <Input placeholder="Нэр" />
            </Form.Item>
            <Form.Item name="relation">
              <Input placeholder="Хамаарал" />
            </Form.Item>
            <Form.Item name="phone" rules={[{ required: true, message: 'Утас' }]}>
              <Input placeholder="Утас" />
            </Form.Item>
            <Form.Item name="address">
              <Input placeholder="Хаяг" style={{ width: 280 }} />
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} loading={emergencySaving} onClick={addEmergency} />
          </Form>
          <Table rowKey="id" columns={emergencyColumns} dataSource={emergencies} pagination={false} />
        </Card>
      ),
    },
    {
      key: 'disciplinary',
      label: 'Сахилгын арга хэмжээ',
      children: (
        <Card>
          <Form form={disciplineForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item name="title" rules={[{ required: true, message: 'Гарчиг' }]}>
              <Input placeholder="Арга хэмжээний гарчиг" style={{ width: 220 }} />
            </Form.Item>
            <Form.Item name="description">
              <Input placeholder="Тайлбар" style={{ width: 260 }} />
            </Form.Item>
            <Form.Item name="status" initialValue="open">
              <Select style={{ width: 130 }} options={[{ value: 'open', label: 'open' }, { value: 'done', label: 'done' }]} />
            </Form.Item>
            <Form.Item name="priority" initialValue="medium">
              <Select
                style={{ width: 130 }}
                options={[{ value: 'low', label: 'low' }, { value: 'medium', label: 'medium' }, { value: 'high', label: 'high' }]}
              />
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} loading={actionSaving} onClick={addDisciplinaryAction} />
          </Form>
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
