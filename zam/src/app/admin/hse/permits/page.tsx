'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';
import { PERMIT_TYPES } from '@/lib/hse';

export default function Page() {
  return (
    <HseEntityPage
      title="Ажилын зөвшөөрөл (Permit to Work)"
      resource="permits"
      fields={[
        { key: 'permit_type', label: 'Төрөл', type: 'select', options: PERMIT_TYPES, required: true },
        { key: 'description', label: 'Тайлбар', type: 'textarea', required: true },
        { key: 'location', label: 'Байршил' },
        { key: 'status', label: 'Төлөв', type: 'select', options: [
          { value: 'requested', label: 'Хүсэлт' }, { value: 'supervisor', label: 'Ахлагч' },
          { value: 'hse', label: 'ХАБЭА' }, { value: 'manager', label: 'Менежер' },
          { value: 'active', label: 'Идэвхтэй' }, { value: 'closed', label: 'Хаасан' },
        ]},
      ]}
      columns={[
        { title: 'Төрөл', dataIndex: 'permit_type', render: (v: string) => PERMIT_TYPES.find((p) => p.value === v)?.label || v },
        { title: 'Тайлбар', dataIndex: 'description', ellipsis: true },
        { title: 'Төлөв', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
      ]}
    />
  );
}
