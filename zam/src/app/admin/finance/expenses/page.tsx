'use client';

import { useEffect, useState } from 'react';
import FinanceEntityPage, { Tag } from '@/components/admin/finance/FinanceEntityPage';
import {
  EXPENSE_STATUSES,
  formatMoney,
  fetchFinanceList,
  approveExpense,
} from '@/lib/finance';
import { Spinner } from '@/components/ui/spinner';
import { Button, Space, message } from '@/components/admin/primitives';

export default function Page() {
  const [ready, setReady] = useState(false);
  const [accountOpts, setAccountOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [projectOpts, setProjectOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      const [accounts, projectsRes] = await Promise.all([
        fetchFinanceList<Record<string, unknown>>('accounts'),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`).then((r) => r.json()),
      ]);
      setAccountOpts(accounts.map((a) => ({ value: Number(a.id), label: `${a.code} — ${a.name}` })));
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
      key={tick}
      title="Зардлын бүртгэл"
      resource="expenses"
      defaults={{ status: 'submitted', amount: 0, vat_amount: 0 }}
      fields={[
        { key: 'expense_date', label: 'Огноо', type: 'date', required: true },
        { key: 'category', label: 'Ангилал', required: true },
        { key: 'amount', label: 'Дүн', type: 'number', required: true },
        { key: 'vat_amount', label: 'НӨАТ', type: 'number' },
        { key: 'account_id', label: 'Данс', type: 'select', options: accountOpts },
        { key: 'project_id', label: 'Төсөл', type: 'select', options: projectOpts },
        { key: 'status', label: 'Төлөв', type: 'select', options: EXPENSE_STATUSES },
        { key: 'description', label: 'Тайлбар', type: 'textarea' },
      ]}
      columns={[
        { title: 'Огноо', dataIndex: 'expense_date', width: 110 },
        { title: 'Ангилал', dataIndex: 'category' },
        {
          title: 'Дүн',
          dataIndex: 'amount',
          align: 'right',
          render: (v) => formatMoney(v as number),
        },
        {
          title: 'Төсөл',
          render: (_, r) => (r.project as { name?: string })?.name || '—',
        },
        {
          title: 'Төлөв',
          dataIndex: 'status',
          render: (v: string, row) => (
            <Space>
              <Tag color={v === 'approved' ? 'green' : v === 'rejected' ? 'red' : 'blue'}>
                {EXPENSE_STATUSES.find((s) => s.value === v)?.label || v}
              </Tag>
              {(v === 'submitted' || v === 'draft') && (
                <Button
                  type="link"
                  size="small"
                  onClick={async () => {
                    const userRaw = localStorage.getItem('user');
                    const user = userRaw ? JSON.parse(userRaw) : null;
                    try {
                      await approveExpense(Number(row.id), { status: 'approved', approved_by: user?.id });
                      message.success('Батлагдлаа');
                      setTick((t) => t + 1);
                    } catch (e) {
                      message.error(e instanceof Error ? e.message : 'Алдаа');
                    }
                  }}
                >
                  Батлах
                </Button>
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}
