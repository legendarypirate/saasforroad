'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';
import { OBSERVATION_TYPES } from '@/lib/hse';

export default function Page() {
  return (
    <HseEntityPage
      title="Аюулгүй байдлын ажиглалт"
      resource="observations"
      fields={[
        { key: 'observation_type', label: 'Төрөл', type: 'select', options: OBSERVATION_TYPES, required: true },
        { key: 'description', label: 'Тайлбар', type: 'textarea', required: true },
        { key: 'priority', label: 'Эрэмбэ', type: 'select', options: [
          { value: 'low', label: 'Бага' }, { value: 'medium', label: 'Дунд' }, { value: 'high', label: 'Өндөр' },
        ]},
        { key: 'status', label: 'Төлөв', type: 'select', options: [
          { value: 'open', label: 'Нээлттэй' }, { value: 'assigned', label: 'Хуваарилсан' },
          { value: 'corrected', label: 'Зассан' }, { value: 'verified', label: 'Баталсан' }, { value: 'closed', label: 'Хаасан' },
        ]},
      ]}
      columns={[
        { title: 'Төрөл', dataIndex: 'observation_type', render: (v: string) => OBSERVATION_TYPES.find((o) => o.value === v)?.label || v },
        { title: 'Тайлбар', dataIndex: 'description', ellipsis: true },
        { title: 'Эрэмбэ', dataIndex: 'priority' },
        { title: 'Төлөв', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
      ]}
    />
  );
}
