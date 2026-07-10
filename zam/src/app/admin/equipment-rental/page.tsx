'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EquipmentRentalRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/rental/contracts');
  }, [router]);
  return null;
}
