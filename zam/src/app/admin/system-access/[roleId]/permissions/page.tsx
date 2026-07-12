'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Space, Spin, message } from '@/components/admin/primitives';
import { ArrowLeftOutlined } from '@/components/admin/icons';
import { PageWrapper } from '@/components/auth/PageWrapper';
import { usePermissions } from '@/hooks/usePermissions';
import { ACTIONS } from '@/lib/rbac';
import {
  RolePermissionsEditor,
  type PermissionRow,
} from '@/components/admin/system-access/RolePermissionsEditor';

const MENU_INDEX = 'system.role';

interface Role {
  id: number;
  name: string;
  description?: string;
}

export default function RolePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = Number(params?.roleId);
  const { canAccess } = usePermissions();
  const canUpdate = canAccess(MENU_INDEX, ACTIONS.UPDATE);

  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isFinite(roleId) || roleId <= 0) {
      message.error('Буруу role');
      router.replace('/admin/system-access');
      return;
    }
    setLoading(true);
    try {
      const [roleRes, permRes, rpRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role/${roleId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permission`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/role_permission/${roleId}`),
      ]);

      const roleJson = await roleRes.json();
      const permJson = await permRes.json();
      const rpJson = await rpRes.json();

      // findOne returns the role row directly (no { success, data } envelope)
      const roleData = roleJson?.data ?? (roleJson?.id ? roleJson : null);
      if (!roleRes.ok || !roleData) {
        message.error(roleJson?.message || 'Role олдсонгүй');
        router.replace('/admin/system-access');
        return;
      }

      setRole(roleData);
      if (permJson.success) setPermissions(permJson.data || []);
      if (rpJson.success && Array.isArray(rpJson.data)) {
        setSelectedIds(rpJson.data.map((p: PermissionRow) => p.id));
      } else {
        setSelectedIds([]);
      }
    } catch (err) {
      console.error(err);
      message.error('Ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [roleId, router]);

  useEffect(() => {
    document.title = 'Эрх тохируулах';
    load();
  }, [load]);

  const persist = async (ids: number[]) => {
    if (!canUpdate) {
      message.error('Эрх хадгалах эрхгүй');
      return false;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/role_permission/${roleId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: ids }),
        },
      );
      const result = await res.json();
      if (!res.ok) {
        message.error(result.message || 'Хадгалахад алдаа гарлаа');
        return false;
      }
      return true;
    } catch {
      message.error('Хадгалахад алдаа гарлаа');
      return false;
    }
  };

  return (
    <PageWrapper menuIndex={MENU_INDEX} requiredAction={ACTIONS.VIEW}>
      <div>
        <Space style={{ marginBottom: 16 }} className="flex items-center justify-between gap-2">
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/system-access')}
          >
            Буцах
          </Button>
          <h1 style={{ marginBottom: 8 }}>
            Эрх тохируулах{role ? `: ${role.name}` : ''}
          </h1>
          {role?.description ? (
            <p className="mb-6 text-sm text-muted-foreground">{role.description}</p>
          ) : (
            <div className="mb-6" />
          )}
        </Space>


        {loading || !role ? (
          <div className="flex justify-center py-16">
            <Spin />
          </div>
        ) : (
          <RolePermissionsEditor
            roleId={role.id}
            roleName={role.name}
            permissions={permissions}
            selectedIds={selectedIds}
            canUpdate={canUpdate}
            onSelectedIdsChange={setSelectedIds}
            onPersist={persist}
          />
        )}
      </div>
    </PageWrapper>
  );
}
