'use client';

import { useEffect, useState } from 'react';
import FinanceEntityPage, { Tag } from '@/components/admin/finance/FinanceEntityPage';
import { formatMoney, PAYMENT_METHODS, fetchFinanceList } from '@/lib/finance';
import { Spinner } from '@/components/ui/spinner';

export default function Page() {
  const [ready, setReady] = useState(false);
  const [accountOpts, setAccountOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [invoiceOpts, setInvoiceOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [projectOpts, setProjectOpts] = useState<Array<{ value: number; label: string }>>([]);

  useEffect(() => {
    (async () => {
      const [accounts, invoices, projectsRes] = await Promise.all([
        fetchFinanceList<Record<string, unknown>>('accounts'),
        fetchFinanceList<Record<string, unknown>>('invoices'),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`).then((r) => r.json()),
      ]);
      setAccountOpts(accounts.map((a) => ({ value: Number(a.id), label: `${a.code} — ${a.name}` })));
      setInvoiceOpts(
        invoices.map((i) => ({
          value: Number(i.id),
          label: `${i.number} (${i.direction === 'ap' ? 'өглөг' : 'авлага'})`,
        })),
      );
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
      title="Төлбөр"
      resource="payments"
      defaults={{ direction: 'in', method: 'transfer', amount: 0 }}
      fields={[
        { key: 'payment_date', label: 'Огноо', type: 'date', required: true },
        { key: 'account_id', label: 'Данс', type: 'select', options: accountOpts, required: true },
        {
          key: 'direction',
          label: 'Чиглэл',
          type: 'select',
          options: [
            { value: 'in', label: 'Орлого' },
            { value: 'out', label: 'Зарлага' },
          ],
          required: true,
        },
        { key: 'amount', label: 'Дүн', type: 'number', required: true },
        { key: 'method', label: 'Хэлбэр', type: 'select', options: PAYMENT_METHODS },
        { key: 'invoice_id', label: 'Нэхэмжлэх', type: 'select', options: invoiceOpts },
        { key: 'project_id', label: 'Төсөл', type: 'select', options: projectOpts },
        { key: 'reference', label: 'Лавлагаа / гүйлгээний утга' },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Дугаар', dataIndex: 'number', width: 120 },
        { title: 'Огноо', dataIndex: 'payment_date', width: 110 },
        {
          title: 'Данс',
          render: (_, r) => (r.account as { name?: string })?.name || '—',
        },
        {
          title: 'Чиглэл',
          dataIndex: 'direction',
          render: (v: string) =>
            v === 'in' ? <Tag color="green">Орлого</Tag> : <Tag color="orange">Зарлага</Tag>,
        },
        {
          title: 'Дүн',
          dataIndex: 'amount',
          align: 'right',
          render: (v) => formatMoney(v as number),
        },
        {
          title: 'Нэхэмжлэх',
          render: (_, r) => (r.invoice as { number?: string })?.number || '—',
        },
      ]}
    />
  );
}
