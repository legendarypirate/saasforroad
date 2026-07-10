'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';

export default function Page() {
  return (
    <HseEntityPage
      title="Үзлэг"
      resource="inspections"
      fields={[
        { key: 'inspected_at', label: 'Үзлэгийн огноо', type: 'date', required: true },
        { key: 'overall_result', label: 'Үр дүн', type: 'select', options: [
          { value: 'pass', label: 'Тэнцсэн' }, { value: 'fail', label: 'Тэнцээгүй' }, { value: 'partial', label: 'Хэсэгчлэн' },
        ]},
        { key: 'comments', label: 'Тайлбар', type: 'textarea' },
      ]}
      columns={[
        { title: 'Огноо', dataIndex: 'inspected_at' },
        { title: 'Төсөл', render: (_, r) => (r.project as { name?: string })?.name || '—' },
        { title: 'Үр дүн', dataIndex: 'overall_result', render: (v: string) => <Tag color={v === 'pass' ? 'green' : 'red'}>{v}</Tag> },
      ]}
    />
  );
}
