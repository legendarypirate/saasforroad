'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  Button,
  Space,
  Drawer,
  Form,
  message,
  Switch,
  Input,
  Popconfirm,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { PlusOutlined } from '@/components/admin/icons';
import { KeyRound } from 'lucide-react';
import { RActionButton, RTableActions } from '@/components/r';
import { PageWrapper } from '@/components/auth/PageWrapper';
import { CanAccess } from '@/components/auth/CanAccess';
import { usePermissions } from '@/hooks/usePermissions';
import { ACTIONS } from '@/lib/rbac';
import { tenantHeaders } from '@/lib/tenant';
import { isAdminRole } from '@/config/adminNavigation';

const MENU_INDEX = 'system.role';

interface Role {
  id: number;
  name: string;
  description?: string;
  mobile_access?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SystemAccessPage() {
  const router = useRouter();
  const { canAccess } = usePermissions();
  const canCreate = canAccess(MENU_INDEX, ACTIONS.CREATE);
  const canUpdate = canAccess(MENU_INDEX, ACTIONS.UPDATE);
  const canDelete = canAccess(MENU_INDEX, ACTIONS.DELETE);

  const [roles, setRoles] = useState<Role[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editForm] = Form.useForm();

  useEffect(() => {
    document.title = 'Эрхийн зохицуулалт';
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role`, {
        headers: tenantHeaders(),
      });
      const result = await res.json();
      if (result.success) setRoles(result.data);
      else message.error('Эрх ачаалахад алдаа гарлаа');
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (!canDelete) {
      message.error('Эрх устгах эрхгүй');
      return;
    }
    setDeletingId(role.id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role/${role.id}`, {
        method: 'DELETE',
        headers: tenantHeaders(),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        message.success('Эрх устгагдлаа');
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
      } else {
        message.error(result.message || 'Устгахад алдаа гарлаа');
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      message.error('Устгахад алдаа гарлаа');
    } finally {
      setDeletingId(null);
    }
  };

  const goToPermissions = (roleId: number) => {
    router.push(`/admin/system-access/${roleId}/permissions`);
  };

  const openEditRole = (role: Role) => {
    if (!canUpdate) {
      message.error('Эрх засах эрхгүй');
      return;
    }
    setEditingRole(role);
    editForm.setFieldsValue({
      name: role.name,
      description: role.description,
      mobile_access: !!role.mobile_access,
    });
  };

  const handleEditRole = async () => {
    if (!editingRole) return;
    try {
      const values = await editForm.validateFields();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role/${editingRole.id}`, {
        method: 'PUT',
        headers: tenantHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (res.ok && result.success !== false) {
        message.success('Эрх шинэчлэгдлээ');
        setEditingRole(null);
        editForm.resetFields();
        fetchRoles();
      } else {
        message.error(result.message || 'Шинэчлэхэд алдаа гарлаа');
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error('Мэдээлэл буруу байна');
    }
  };

  const handleCreateRole = async () => {
    if (!canCreate) {
      message.error('Шинэ эрх үүсгэх эрхгүй');
      return;
    }
    try {
      const values = await createForm.validateFields();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role`, {
        method: 'POST',
        headers: tenantHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(values),
      });
      const result = await res.json();
      if (res.ok && result.data?.id) {
        message.success('Эрх амжилттай үүслээ');
        setCreateDrawerVisible(false);
        createForm.resetFields();
        goToPermissions(result.data.id);
      } else {
        message.error(result.message || 'Үүсгэхэд алдаа гарлаа');
      }
    } catch {
      message.error('Мэдээлэл буруу байна');
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
        <RTableActions>
          {canUpdate && (
            <RActionButton preset="edit" onClick={() => openEditRole(record)} />
          )}
          {canUpdate && (
            <RActionButton
              icon={<KeyRound />}
              label="Эрх тохируулах"
              tone="primary"
              onClick={() => goToPermissions(record.id)}
            />
          )}
          {canDelete && !isAdminRole(record.name) && (
            <Popconfirm
              title="Энэ эрхийг устгах уу?"
              description="Хэрэглэгч энэ эрхийг ашиглаж байвал устгах боломжгүй."
              okText="Устгах"
              cancelText="Болих"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDeleteRole(record)}
            >
              <span>
                <RActionButton preset="delete" disabled={deletingId === record.id} />
              </span>
            </Popconfirm>
          )}
        </RTableActions>
      ),
    },
  ];

  return (
    <PageWrapper menuIndex={MENU_INDEX} requiredAction={ACTIONS.VIEW}>
      <div>
        <Space style={{ marginBottom: 12 }}>
          <CanAccess menuIndex={MENU_INDEX} action={ACTIONS.CREATE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateDrawerVisible(true)}
            >
              + Шинэ эрх үүсгэх
            </Button>
          </CanAccess>
        </Space>

        <Table columns={columns} dataSource={roles} rowKey="id" loading={loading} />

        <Drawer
          title="Шинэ эрх үүсгэх"
          width={400}
          onClose={() => {
            setCreateDrawerVisible(false);
            createForm.resetFields();
          }}
          open={createDrawerVisible && canCreate}
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
              Үүсгээд эрх тохируулах
            </Button>
          </Form>
        </Drawer>

        <Drawer
          title="Эрх засах"
          width={400}
          onClose={() => {
            setEditingRole(null);
            editForm.resetFields();
          }}
          open={!!editingRole && canUpdate}
        >
          <Form form={editForm} layout="vertical" onFinish={handleEditRole}>
            <Form.Item name="name" label="Эрхийн нэр" rules={[{ required: true }]}>
              <Input placeholder="Жишээ: Шатахуун менежер" />
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
      </div>
    </PageWrapper>
  );
}
