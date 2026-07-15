'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentDetailRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/data/student');
  }, [router]);
  return null;
}
