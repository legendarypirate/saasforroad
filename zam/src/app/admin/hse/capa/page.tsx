'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';

export default function Page() {
  return (
    <HseEntityPage
      title="CAPA — Засварлах арга хэмжээ"
      resource="capa"
      fields={[
        { key: 'source_type', label: 'Эх үүсвэр', type: 'select', options: [
          { value: 'incident', label: 'Осол' }, { value: 'inspection', label: 'Үзлэг' },
          { value: 'observation', label: 'Ажиглалт' }, { value: 'audit', label: 'Аудит' },
          { value: 'near_miss', label: 'Near miss' },
        ], required: true },
        { key: 'action', label: 'Арга хэмжээ', type: 'textarea', required: true },
        { key: 'deadline', label: 'Хугацаа', type: 'date' },
        { key: 'status', label: 'Төлөв', type: 'select', options: [
          { value: 'open', label: 'Нээлттэй' }, { value: 'in_progress', label: 'Явж буй' },
          { value: 'verified', label: 'Баталсан' }, { value: 'closed', label: 'Хаасан' },
        ]},
      ]}
      columns={[
        { title: 'Эх үүсвэр', dataIndex: 'source_type' },
        { title: 'Арга хэмжээ', dataIndex: 'action', ellipsis: true },
        { title: 'Хугацаа', dataIndex: 'deadline' },
        { title: 'Төлөв', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
      ]}
    />
  );
}
