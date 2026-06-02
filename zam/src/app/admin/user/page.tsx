'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Drawer, Form, Input, Select, message, Switch, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Option } = Select;

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role_id: number;
  role?: string;
  roleRecord?: Role;
  is_active?: string | boolean | number;
  createdAt: string;
  updatedAt: string;
}

function isUserActive(value: User['is_active']) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role`);
      const result = await res.json();
      if (result.success) setRoles(result.data);
    } catch (err) {
      console.error('Fetch roles error:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`);
      const result = await res.json();
      if (result.success) setUsers(result.data);
      else message.error(result.message || 'Ачаалахад алдаа');
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Хэрэглэгч';
    fetchRoles();
    fetchUsers();
  }, []);

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    form.resetFields();
  };

  const toggleActive = async (user: User, active: boolean) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active ? '1' : '0' }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Шинэчлэхэд алдаа');

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: active ? '1' : '0' } : u))
      );
      message.success(active ? 'Ажилтан идэвхтэй боллоо' : 'Ажилтан идэвхгүй боллоо');
    } catch (err) {
      console.error(err);
      message.error('Төлөв өөрчлөхөд алдаа гарлаа');
    } finally {
      setTogglingId(null);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        message.success('Хэрэглэгч үүслээ');
        fetchUsers();
        handleDrawerClose();
      } else {
        message.error(result.message || 'Үүсгэхэд алдаа');
      }
    } catch {
      message.error('Мэдээлэл буруу байна');
    }
  };

  const columns: ColumnsType<User> = [
    { title: 'Нэвтрэх нэр', dataIndex: 'username' },
    { title: 'И-мэйл', dataIndex: 'email' },
    { title: 'Утас', dataIndex: 'phone' },
    {
      title: 'Эрх',
      render: (_, record) => record.roleRecord?.name || record.role || '—',
    },
    {
      title: 'Төлөв',
      key: 'status',
      render: (_, record) => {
        const active = isUserActive(record.is_active);
        return (
          <Space>
            <Switch
              checked={active}
              loading={togglingId === record.id}
              onChange={(checked) => toggleActive(record, checked)}
            />
            <Tag color={active ? 'green' : 'red'}>{active ? 'Идэвхтэй' : 'Гарсан'}</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Үйлдэл',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => router.push(`/admin/user/${record.id}`)}
        >
          Дэлгэрэнгүй
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Хэрэглэгч</h1>
      <Space style={{ marginBottom: 16, width: '100%' }} wrap>
        <Button type="primary" style={{ marginLeft: 'auto' }} icon={<PlusOutlined />} onClick={() => setDrawerVisible(true)}>
          + Хэрэглэгч үүсгэх
        </Button>
      </Space>

      <Table columns={columns} dataSource={users} rowKey="id" loading={loading} />

      <Drawer title="Хэрэглэгч үүсгэх" width={400} onClose={handleDrawerClose} open={drawerVisible}>
        <Form layout="vertical" form={form} onFinish={handleFormSubmit}>
          <Form.Item name="username" label="Нэвтрэх нэр" rules={[{ required: true }]}>
            <Input placeholder="Нэвтрэх нэр" />
          </Form.Item>
          <Form.Item name="email" label="И-мэйл">
            <Input placeholder="И-мэйл" />
          </Form.Item>
          <Form.Item name="phone" label="Утас" rules={[{ required: true }]}>
            <Input placeholder="Утасны дугаар" />
          </Form.Item>
          <Form.Item name="role_id" label="Эрх" rules={[{ required: true }]}>
            <Select placeholder="Эрх сонгох">
              {roles.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="password" label="Нууц үг" rules={[{ required: true }]}>
            <Input.Password placeholder="Нууц үг" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Хадгалах
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
