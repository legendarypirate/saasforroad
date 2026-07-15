'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BrigadaHiresRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/data/brigada');
  }, [router]);
  return null;
}
