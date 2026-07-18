'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Switch,
  Tag,
  Modal,
  Tooltip,
  Tabs,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { EyeOutlined, KeyOutlined, PlusOutlined } from '@/components/admin/icons';
import { useRouter } from 'next/navigation';
import { tenantHeaders } from '@/lib/tenant';

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
  salary?: number;
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
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState<number | undefined>();
  const [statusTab, setStatusTab] = useState<'active' | 'inactive'>('active');
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role`, {
        headers: tenantHeaders(),
      });
      const result = await res.json();
      if (result.success) setRoles(result.data);
    } catch (err) {
      console.error('Fetch roles error:', err);
    }
  };

  const fetchUsers = async (roleId?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleId) params.set('role_id', String(roleId));
      const qs = params.toString();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user${qs ? `?${qs}` : ''}`,
        { headers: tenantHeaders() },
      );
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
  }, []);

  useEffect(() => {
    fetchUsers(roleFilter);
  }, [roleFilter]);

  const activeUsers = useMemo(
    () => users.filter((u) => isUserActive(u.is_active)),
    [users],
  );
  const inactiveUsers = useMemo(
    () => users.filter((u) => !isUserActive(u.is_active)),
    [users],
  );
  const handleDrawerClose = () => {
    setDrawerVisible(false);
    form.resetFields();
  };

  const toggleActive = async (user: User, active: boolean) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/${user.id}`, {
        method: 'PATCH',
        headers: tenantHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ is_active: active ? '1' : '0' }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Шинэчлэхэд алдаа');

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: active ? '1' : '0' } : u))
      );
      message.success(active ? 'Ажилтан идэвхтэй боллоо' : 'Ажилтан идэвхгүй боллоо');
      setStatusTab(active ? 'active' : 'inactive');
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
        headers: tenantHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        message.success('Хэрэглэгч үүслээ');
        fetchUsers(roleFilter);
        setStatusTab('active');
        handleDrawerClose();
      } else {
        message.error(result.message || 'Үүсгэхэд алдаа');
      }
    } catch {
      message.error('Мэдээлэл буруу байна');
    }
  };

  const openPasswordModal = (user: User) => {
    setPasswordUser(user);
    passwordForm.resetFields();
  };

  const closePasswordModal = () => {
    setPasswordUser(null);
    passwordForm.resetFields();
  };

  const handlePasswordSubmit = async () => {
    if (!passwordUser) return;
    try {
      const values = await passwordForm.validateFields();
      setPasswordSaving(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/${passwordUser.id}/password`,
        {
          method: 'PATCH',
          headers: tenantHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ password: values.password }),
        }
      );
      const result = await res.json();
      if (res.ok && result.success) {
        message.success(result.message || 'Нууц үг солигдлоо');
        closePasswordModal();
      } else {
        message.error(result.message || 'Нууц үг солиход алдаа');
      }
    } catch {
      // validation errors
    } finally {
      setPasswordSaving(false);
    }
  };

  const columns: ColumnsType<User> = [
    { title: 'Нэвтрэх нэр', dataIndex: 'username' },
    { title: 'И-мэйл', dataIndex: 'email' },
    {
      title: 'Цалин',
      dataIndex: 'salary',
      render: (v) => (v != null ? `${Number(v).toLocaleString('mn-MN')} ₮` : '—'),
    },
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
      width: 100,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Дэлгэрэнгүй">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/admin/user/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Нууц үг солих">
            <Button
              type="text"
              icon={<KeyOutlined />}
              onClick={() => openPasswordModal(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Хэрэглэгч</h1>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Эрхээр шүүх"
          className="w-[200px]"
          value={roleFilter}
          onChange={(v) => setRoleFilter(v)}
          options={roles.map((r) => ({ value: r.id, label: r.name }))}
        />
        <Button
          type="primary"
          className="ml-auto"
          icon={<PlusOutlined />}
          onClick={() => setDrawerVisible(true)}
        >
          + Хэрэглэгч үүсгэх
        </Button>
      </div>

      <Tabs
        activeKey={statusTab}
        onChange={(key) => setStatusTab(key as 'active' | 'inactive')}
        items={[
          {
            key: 'active',
            label: `Идэвхтэй (${activeUsers.length})`,
            children: (
              <Table
                columns={columns}
                dataSource={activeUsers}
                rowKey="id"
                loading={loading}
                locale={{ emptyText: 'Идэвхтэй хэрэглэгч байхгүй' }}
              />
            ),
          },
          {
            key: 'inactive',
            label: `Гарсан / идэвхгүй (${inactiveUsers.length})`,
            children: (
              <Table
                columns={columns}
                dataSource={inactiveUsers}
                rowKey="id"
                loading={loading}
                locale={{ emptyText: 'Идэвхгүй хэрэглэгч байхгүй' }}
              />
            ),
          },
        ]}
      />

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

      <Modal
        title={passwordUser ? `Нууц үг солих — ${passwordUser.username}` : 'Нууц үг солих'}
        open={Boolean(passwordUser)}
        onCancel={closePasswordModal}
        onOk={handlePasswordSubmit}
        okText="Хадгалах"
        cancelText="Болих"
        confirmLoading={passwordSaving}
        destroyOnClose
      >
        <Form layout="vertical" form={passwordForm}>
          <Form.Item
            name="password"
            label="Шинэ нууц үг"
            rules={[
              { required: true, message: 'Нууц үг оруулна уу' },
              { min: 4, message: 'Хамгийн багадаа 4 тэмдэгт' },
            ]}
          >
            <Input.Password placeholder="Шинэ нууц үг" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Нууц үг давтах"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Нууц үг давтана уу' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Нууц үг таарахгүй байна'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Нууц үг давтах" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
