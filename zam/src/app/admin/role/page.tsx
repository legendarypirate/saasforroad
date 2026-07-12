'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy /admin/role → system-access */
export default function LegacyRolePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/system-access');
  }, [router]);
  return null;
}
