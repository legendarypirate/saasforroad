'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';

export default function Page() {
  return (
    <HseEntityPage
      title="Сургалт ба гэрчилгээ"
      resource="training-records"
      fields={[
        { key: 'training_id', label: 'Сургалтын ID', type: 'number', required: true },
        { key: 'user_id', label: 'Ажилтан ID', type: 'number', required: true },
        { key: 'issued_at', label: 'Олгосон огноо', type: 'date', required: true },
        { key: 'expires_at', label: 'Дуусах огноо', type: 'date' },
        { key: 'trainer', label: 'Сургагч' },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Сургалт', render: (_, r) => (r.training as { name?: string })?.name || String(r.training_id ?? '—') },
        { title: 'Ажилтан', render: (_, r) => (r.user as { username?: string })?.username || String(r.user_id ?? '—') },
        { title: 'Дуусах', dataIndex: 'expires_at' },
        { title: 'Сургагч', dataIndex: 'trainer' },
      ]}
    />
  );
}
