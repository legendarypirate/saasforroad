'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JobSeekerDetailRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/data/job-seeker');
  }, [router]);
  return null;
}
