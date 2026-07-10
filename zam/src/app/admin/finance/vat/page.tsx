'use client';

import FinanceEntityPage, { Tag } from '@/components/admin/finance/FinanceEntityPage';
import { formatMoney } from '@/lib/finance';

export default function Page() {
  return (
    <FinanceEntityPage
      title="НӨАТ бүртгэл"
      resource="vat-entries"
      defaults={{ type: 'output', vat_rate: 10, base_amount: 0, vat_amount: 0 }}
      fields={[
        { key: 'entry_date', label: 'Огноо', type: 'date', required: true },
        {
          key: 'type',
          label: 'Төрөл',
          type: 'select',
          options: [
            { value: 'output', label: 'Гарах НӨАТ (борлуулалт)' },
            { value: 'input', label: 'Орох НӨАТ (худалдан авалт)' },
          ],
          required: true,
        },
        { key: 'counterparty', label: 'Харилцагч' },
        { key: 'base_amount', label: 'Суурь дүн', type: 'number', required: true },
        { key: 'vat_rate', label: 'НӨАТ %', type: 'number' },
        { key: 'vat_amount', label: 'НӨАТ дүн', type: 'number', required: true },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Огноо', dataIndex: 'entry_date', width: 110 },
        {
          title: 'Төрөл',
          dataIndex: 'type',
          render: (v: string) =>
            v === 'input' ? <Tag color="orange">Орох</Tag> : <Tag color="blue">Гарах</Tag>,
        },
        { title: 'Харилцагч', dataIndex: 'counterparty', render: (v) => v || '—' },
        {
          title: 'Суурь',
          dataIndex: 'base_amount',
          align: 'right',
          render: (v) => formatMoney(v as number),
        },
        {
          title: 'НӨАТ',
          dataIndex: 'vat_amount',
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
