'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';

export default function Page() {
  return (
    <HseEntityPage
      title="Тоног төхөөрөмжийн аюулгүй байдал"
      resource="equipment-inspections"
      fields={[
        { key: 'equipment_id', label: 'Тоног төхөөрөмж ID', type: 'number', required: true },
        { key: 'inspected_at', label: 'Үзлэгийн огноо', type: 'date', required: true },
        { key: 'defects', label: 'Согог', type: 'textarea' },
        { key: 'maintenance_requested', label: 'Засвар хүссэн (1/0)', type: 'number' },
      ]}
      columns={[
        { title: 'Тоног төхөөрөмж', render: (_, r) => (r.equipment as { name?: string })?.name || r.equipment_id },
        { title: 'Огноо', dataIndex: 'inspected_at' },
        { title: 'Засвар', dataIndex: 'maintenance_requested', render: (v: boolean) => (v ? <Tag color="orange">Тийм</Tag> : 'Үгүй') },
      ]}
    />
  );
}
