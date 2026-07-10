'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';

export default function Page() {
  return (
    <HseEntityPage
      title="ХАБЭА хувцас (PPE)"
      resource="ppe-assignments"
      fields={[
        { key: 'ppe_item_id', label: 'PPE ID', type: 'number', required: true },
        { key: 'user_id', label: 'Ажилтан ID', type: 'number', required: true },
        { key: 'issued_at', label: 'Олгосон огноо', type: 'date', required: true },
        { key: 'replacement_due_at', label: 'Солих огноо', type: 'date' },
        { key: 'status', label: 'Төлөв', type: 'select', options: [
          { value: 'active', label: 'Идэвхтэй' }, { value: 'returned', label: 'Буцаасан' }, { value: 'expired', label: 'Дууссан' },
        ]},
      ]}
      columns={[
        { title: 'PPE', render: (_, r) => (r.ppeItem as { name?: string })?.name || String(r.ppe_item_id ?? '—') },
        { title: 'Ажилтан', render: (_, r) => (r.user as { username?: string })?.username || String(r.user_id ?? '—') },
        { title: 'Олгосон', dataIndex: 'issued_at' },
        { title: 'Төлөв', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
      ]}
    />
  );
}
