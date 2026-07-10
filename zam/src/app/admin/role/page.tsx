'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Drawer, Form, message, Switch, Divider, Input } from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { EditOutlined, PlusOutlined } from '@/components/admin/icons';

interface Role {
  id: number;
  name: string;
  description?: string;
  mobile_access?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: number;
  module: string;
  action: string;
}

export default function RolePermissionPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);

  useEffect(() => {
    document.title = 'Эрхийн зохицуулалт';
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role`);
      const result = await res.json();
      if (result.success) setRoles(result.data);
      else message.error('Эрх ачаалахад алдаа гарлаа');
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permission`);
      const result = await res.json();
      if (result.success) setPermissions(result.data);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const handleCreateRole = async () => {
    try {
      const values = await createForm.validateFields();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (res.ok) {
        message.success('Эрх амжилттай үүслээ');
        setCreateDrawerVisible(false);
        createForm.resetFields();
        fetchRoles();
      } else {
        message.error(result.message || 'Үүсгэхэд алдаа гарлаа');
      }
    } catch {
      message.error('Мэдээлэл буруу байна');
    }
  };

  const openPermissionDrawer = async (role: Role) => {
    setSelectedRole(role);
    setDrawerVisible(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role_permission/${role.id}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        const permissionIds = result.data.map((p: Permission) => p.id);
        setRolePermissions(permissionIds);
      }
    } catch (err) {
      console.error('Failed to fetch role permissions', err);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role_permission/${selectedRole?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: rolePermissions }),
      });
      const result = await res.json();
      if (res.ok) {
        message.success('Эрх хадгалагдлаа');
        setDrawerVisible(false);
        setRolePermissions([]);
        form.resetFields();
      } else {
        message.error(result.message || 'Хадгалахад алдаа гарлаа');
      }
    } catch {
      message.error('Алдаа гарлаа');
    }
  };

  const columns: ColumnsType<Role> = [
    { title: 'Эрхийн нэр', dataIndex: 'name' },
    { title: 'Тайлбар', dataIndex: 'description' },
    {
      title: 'Апп нэвтрэх',
      dataIndex: 'mobile_access',
      render: (v: boolean) => (v ? 'Тийм' : 'Үгүй'),
    },
    {
      title: 'Үйлдэл',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openPermissionDrawer(record)}>
            Эрх тохируулах
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Эрхийн зохицуулалт</h1>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateDrawerVisible(true)}>
          + Шинэ эрх үүсгэх
        </Button>
      </Space>

      <Table columns={columns} dataSource={roles} rowKey="id" loading={loading} />

      <Drawer
        title="Шинэ эрх үүсгэх"
        width={400}
        onClose={() => {
          setCreateDrawerVisible(false);
          createForm.resetFields();
        }}
        open={createDrawerVisible}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateRole}>
          <Form.Item name="name" label="Эрхийн нэр" rules={[{ required: true }]}>
            <Input placeholder="Жишээ: Ажилчин" />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="mobile_access" label="Апп-аар нэвтрэх эрх" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Хадгалах
          </Button>
        </Form>
      </Drawer>

      <Drawer
        title={`Эрх тохируулах: ${selectedRole?.name}`}
        width={480}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedRole(null);
          setRolePermissions([]);
        }}
        open={drawerVisible}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Цэсний эрхүүд">
            {permissions.map((p) => (
              <Form.Item key={p.id} style={{ marginBottom: 12 }}>
                <Space>
                  <Switch
                    checked={rolePermissions.includes(p.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setRolePermissions((prev) => [...prev, p.id]);
                      } else {
                        setRolePermissions((prev) => prev.filter((id) => id !== p.id));
                      }
                    }}
                  />
                  <span>{`${p.module} — ${p.action}`}</span>
                </Space>
              </Form.Item>
            ))}
          </Form.Item>
          <Divider />
          <Button type="primary" htmlType="submit" block>
            Хадгалах
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
