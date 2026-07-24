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
  Tabs,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { PlusOutlined } from '@/components/admin/icons';
import { KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { tenantHeaders } from '@/lib/tenant';
import { RActionButton, RPageToolbar, RSearch, RTableActions } from '@/components/r';

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

/** Treat null/empty as active — older creates left is_active unset and vanished from the active tab. */
function isUserActive(value: User['is_active']) {
  if (value === undefined || value === null || value === '') return true;
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
  const [q, setQ] = useState('');
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

  const filteredBySearch = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => {
      const hay = [u.username, u.email, u.phone, u.roleRecord?.name, u.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [users, q]);

  const activeUsers = useMemo(
    () => filteredBySearch.filter((u) => isUserActive(u.is_active)),
    [filteredBySearch],
  );
  const inactiveUsers = useMemo(
    () => filteredBySearch.filter((u) => !isUserActive(u.is_active)),
    [filteredBySearch],
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
        prev.map((u) => (u.id === user.id ? { ...u, is_active: active ? '1' : '0' } : u)),
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
        body: JSON.stringify({ ...values, is_active: '1' }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        message.success('Хэрэглэгч үүслээ');
        const createdRoleId = result.data?.role_id as number | undefined;
        if (roleFilter && createdRoleId && roleFilter !== createdRoleId) {
          setRoleFilter(undefined);
        } else {
          await fetchUsers(roleFilter);
        }
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
        },
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
    {
      title: '№',
      key: 'index',
      width: 56,
      render: (_v, _r, index) => index + 1,
    },
    {
      title: 'Үйлдэл',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <RTableActions>
          <RActionButton
            preset="view"
            onClick={() => router.push(`/admin/user/${record.id}`)}
          />
          <RActionButton
            icon={<KeyRound />}
            label="Нууц үг солих"
            tone="primary"
            onClick={() => openPasswordModal(record)}
          />
        </RTableActions>
      ),
    },
    { title: 'Нэвтрэх нэр', dataIndex: 'username' },
    { title: 'И-мэйл', dataIndex: 'email', render: (v) => v || '—' },
    {
      title: 'Цалин',
      dataIndex: 'salary',
      render: (v) => (v != null ? `${Number(v).toLocaleString('mn-MN')} ₮` : '—'),
    },
    { title: 'Утас', dataIndex: 'phone', render: (v) => v || '—' },
    {
      title: 'Эрх',
      render: (_, record) => record.roleRecord?.name || record.role || '—',
    },
    {
      title: 'Төлөв',
      key: 'status',
      width: 180,
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
  ];

  const tableProps = {
    columns,
    rowKey: 'id' as const,
    loading,
    pagination: { pageSize: 30, showSizeChanger: true },
    scroll: { x: 960 },
  };

  return (
    <div>
      <RPageToolbar
        title="Хэрэглэгч"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerVisible(true)}
          >
            + Хэрэглэгч үүсгэх
          </Button>
        }
        search={
          <RSearch
            showButton
            value={q}
            onChange={setQ}
            onSearch={setQ}
            placeholder="Хайлт хийх"
            containerClassName="w-full"
          />
        }
        filters={
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Эрхээр шүүх"
            style={{ minWidth: 180 }}
            value={roleFilter}
            onChange={(v) => setRoleFilter(v)}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
        }
      />

      <Tabs
        activeKey={statusTab}
        onChange={(key) => setStatusTab(key as 'active' | 'inactive')}
        items={[
          {
            key: 'active',
            label: `Идэвхтэй (${activeUsers.length})`,
            children: (
              <Table
                {...tableProps}
                dataSource={activeUsers}
                locale={{ emptyText: 'Идэвхтэй хэрэглэгч байхгүй' }}
              />
            ),
          },
          {
            key: 'inactive',
            label: `Гарсан / идэвхгүй (${inactiveUsers.length})`,
            children: (
              <Table
                {...tableProps}
                dataSource={inactiveUsers}
                locale={{ emptyText: 'Идэвхгүй хэрэглэгч байхгүй' }}
              />
            ),
          },
        ]}
      />

      <Drawer
        title="Хэрэглэгч үүсгэх"
        description="Системд нэвтрэх шинэ хэрэглэгчийн мэдээллийг бөглөнө үү."
        width={640}
        open={drawerVisible}
        onClose={handleDrawerClose}
        destroyOnClose
        footer={
          <>
            <Button onClick={handleDrawerClose}>Болих</Button>
            <Button type="primary" onClick={() => form.submit()}>
              Хадгалах
            </Button>
          </>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleFormSubmit} className="space-y-1">
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            <Form.Item
              name="username"
              label="Нэвтрэх нэр"
              rules={[{ required: true, message: 'Нэвтрэх нэр оруулна уу' }]}
              className="sm:col-span-1"
            >
              <Input placeholder="Ж: bold.baatar" autoComplete="off" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Утас"
              rules={[{ required: true, message: 'Утасны дугаар оруулна уу' }]}
            >
              <Input placeholder="99112233" inputMode="tel" />
            </Form.Item>
            <Form.Item name="email" label="И-мэйл" className="sm:col-span-2">
              <Input placeholder="name@company.mn" type="email" autoComplete="off" />
            </Form.Item>
            <Form.Item
              name="role_id"
              label="Эрх"
              rules={[{ required: true, message: 'Эрх сонгоно уу' }]}
              className="sm:col-span-2"
            >
              <Select
                placeholder="Эрх сонгох"
                showSearch
                optionFilterProp="label"
                options={roles.map((r) => ({ value: r.id, label: r.name }))}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="Нууц үг"
              rules={[
                { required: true, message: 'Нууц үг оруулна уу' },
                { min: 4, message: 'Хамгийн багадаа 4 тэмдэгт' },
              ]}
              className="sm:col-span-2"
            >
              <Input.Password placeholder="Нууц үг" autoComplete="new-password" />
            </Form.Item>
          </div>
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
