'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';

export default function Page() {
  return (
    <HseEntityPage
      title="Toolbox уулзалт"
      resource="toolbox-meetings"
      fields={[
        { key: 'topic', label: 'Сэдэв', required: true },
        { key: 'meeting_at', label: 'Огноо цаг', type: 'date', required: true },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Сэдэв', dataIndex: 'topic' },
        { title: 'Төсөл', render: (_, r) => (r.project as { name?: string })?.name || '—' },
        { title: 'Огноо', dataIndex: 'meeting_at' },
        { title: 'Төлөв', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
      ]}
    />
  );
}
