'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy path — equipment registry now lives under Түрээс module. */
export default function EquipmentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/rental/assets');
  }, [router]);
  return null;
}
