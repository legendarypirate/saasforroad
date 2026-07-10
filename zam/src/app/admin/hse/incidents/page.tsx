'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';
import { INCIDENT_TYPES } from '@/lib/hse';

export default function Page() {
  return (
    <HseEntityPage
      title="Ослын удирдлага"
      resource="incidents"
      fields={[
        { key: 'incident_type', label: 'Төрөл', type: 'select', options: INCIDENT_TYPES, required: true },
        { key: 'title', label: 'Гарчиг', required: true },
        { key: 'description', label: 'Тайлбар', type: 'textarea' },
        { key: 'location', label: 'Байршил' },
        { key: 'severity', label: 'Ноцтой байдал', type: 'select', options: [
          { value: 'low', label: 'Бага' }, { value: 'medium', label: 'Дунд' }, { value: 'high', label: 'Өндөр' },
        ]},
        { key: 'status', label: 'Төлөв', type: 'select', options: [
          { value: 'reported', label: 'Мэдээлсэн' }, { value: 'investigating', label: 'Мөрдөж буй' },
          { value: 'action', label: 'Арга хэмжээ' }, { value: 'closed', label: 'Хаасан' },
        ]},
      ]}
      columns={[
        { title: 'Гарчиг', dataIndex: 'title' },
        { title: 'Төрөл', dataIndex: 'incident_type', render: (v: string) => INCIDENT_TYPES.find((i) => i.value === v)?.label || v },
        { title: 'Ноцтой', dataIndex: 'severity' },
        { title: 'Төлөв', dataIndex: 'status', render: (s: string) => <Tag color={s === 'closed' ? 'green' : 'orange'}>{s}</Tag> },
      ]}
    />
  );
}
