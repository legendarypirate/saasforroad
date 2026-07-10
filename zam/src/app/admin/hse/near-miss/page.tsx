'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';

export default function Page() {
  return (
    <HseEntityPage
      title="Ослын эрсдэл (Near Miss)"
      resource="near-misses"
      fields={[
        { key: 'description', label: 'Тайлбар', type: 'textarea', required: true },
        { key: 'location', label: 'Байршил' },
        { key: 'witness', label: 'Гэрч' },
        { key: 'immediate_action', label: 'Шууд арга хэмжээ', type: 'textarea' },
        { key: 'root_cause', label: 'Үндсэн шалтгаан', type: 'textarea' },
        { key: 'corrective_action', label: 'Засварлах арга хэмжээ', type: 'textarea' },
      ]}
      columns={[
        { title: 'Тайлбар', dataIndex: 'description', ellipsis: true },
        { title: 'Байршил', dataIndex: 'location' },
        { title: 'Төлөв', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
      ]}
    />
  );
}
