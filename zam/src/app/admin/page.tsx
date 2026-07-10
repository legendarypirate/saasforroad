'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import ModuleFolderGrid from '@/components/admin/ModuleFolderGrid';
import { getUserPermissions, getUserRole, loadUserPermissions } from '@/lib/auth';

export default function Dashboard() {
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<string[]>(() => getUserPermissions());
  const [userRole, setUserRole] = useState(() => getUserRole());

  useEffect(() => {
    (async () => {
      const perms = await loadUserPermissions();
      if (!localStorage.getItem('token')) {
        router.replace('/login');
        return;
      }
      setUserPermissions(perms);
      setUserRole(getUserRole());
    })();
  }, [router]);

  return (
    <div>
      <ModuleFolderGrid userPermissions={userPermissions} userRole={userRole} />
    </div>
  );
}
