'use client';

import React, { useEffect, useState } from 'react';
import ModuleFolderGrid from '@/components/admin/ModuleFolderGrid';
import { getUserPermissions, getUserRole, loadUserPermissions } from '@/lib/auth';

export default function Dashboard() {
  const [userPermissions, setUserPermissions] = useState<string[]>(() => getUserPermissions());
  const [userRole, setUserRole] = useState(() => getUserRole());

  useEffect(() => {
    (async () => {
      setUserRole(getUserRole());
      const perms = await loadUserPermissions();
      setUserPermissions(perms);
      setUserRole(getUserRole());
    })();
  }, []);

  return (
    <div>
      <ModuleFolderGrid userPermissions={userPermissions} userRole={userRole} />
    </div>
  );
}
