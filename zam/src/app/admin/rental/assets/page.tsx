'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Assets moved to dedicated Тоног төхөөрөмж module. */
export default function RentalAssetsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/equipment');
  }, [router]);
  return null;
}
