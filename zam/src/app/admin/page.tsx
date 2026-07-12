'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import ModuleFolderGrid from '@/components/admin/ModuleFolderGrid';
import { getUserPermissions, getUserRole, loadUserPermissions } from '@/lib/auth';

export default function Dashboard() {
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      setUserPermissions(getUserPermissions());
      setUserRole(getUserRole());
      const perms = await loadUserPermissions();
      if (!localStorage.getItem('token')) {
        router.replace('/login');
        return;
      }
      setUserPermissions(perms);
      setUserRole(getUserRole());
      setReady(true);
    })();
  }, [router]);

  if (!ready) {
    return <div className="min-h-[200px]" />;
  }

  return (
    <div>
      <ModuleFolderGrid userPermissions={userPermissions} userRole={userRole} />
    </div>
  );
}
