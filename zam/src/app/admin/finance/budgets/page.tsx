'use client';

import { useEffect, useState } from 'react';
import FinanceEntityPage from '@/components/admin/finance/FinanceEntityPage';
import { formatMoney } from '@/lib/finance';
import { Spinner } from '@/components/ui/spinner';

export default function Page() {
  const [ready, setReady] = useState(false);
  const [projectOpts, setProjectOpts] = useState<Array<{ value: number; label: string }>>([]);

  useEffect(() => {
    (async () => {
      const projectsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`).then((r) => r.json());
      setProjectOpts(
        (projectsRes.success ? projectsRes.data : []).map((p: { id: number; name: string }) => ({
          value: p.id,
          label: p.name,
        })),
      );
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <FinanceEntityPage
      title="Төсөв"
      resource="budgets"
      defaults={{ year: new Date().getFullYear(), category: 'Ерөнхий', planned_amount: 0 }}
      fields={[
        { key: 'year', label: 'Жил', type: 'number', required: true },
        { key: 'category', label: 'Ангилал', required: true },
        { key: 'project_id', label: 'Төсөл (хоосон = компани)', type: 'select', options: projectOpts },
        { key: 'planned_amount', label: 'Төлөвлөсөн дүн', type: 'number', required: true },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Жил', dataIndex: 'year', width: 80 },
        { title: 'Ангилал', dataIndex: 'category' },
        {
          title: 'Төсөл',
          render: (_, r) => (r.project as { name?: string })?.name || 'Компани',
        },
        {
          title: 'Төлөвлөгөө',
          dataIndex: 'planned_amount',
          align: 'right',
          render: (v) => formatMoney(v as number),
        },
      ]}
    />
  );
}
