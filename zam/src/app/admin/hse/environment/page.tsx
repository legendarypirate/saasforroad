'use client';

import HseEntityPage from '@/components/admin/hse/HseEntityPage';

export default function Page() {
  return (
    <HseEntityPage
      title="Байгаль орчны удирдлага"
      resource="environmental"
      fields={[
        { key: 'record_type', label: 'Төрөл', type: 'select', options: [
          { value: 'dust', label: 'Тоос' }, { value: 'noise', label: 'Дуу чимээ' },
          { value: 'waste', label: 'Хог хаягдал' }, { value: 'fuel_spill', label: 'Шатахуун алдсан' },
          { value: 'water', label: 'Усны бохирдол' }, { value: 'incident', label: 'Осол' },
        ], required: true },
        { key: 'value', label: 'Утга', type: 'number' },
        { key: 'unit', label: 'Нэгж' },
        { key: 'description', label: 'Тайлбар', type: 'textarea' },
      ]}
      columns={[
        { title: 'Төрөл', dataIndex: 'record_type' },
        { title: 'Утга', render: (_, r) => `${r.value ?? '—'} ${r.unit ?? ''}` },
        { title: 'Тайлбар', dataIndex: 'description', ellipsis: true },
      ]}
    />
  );
}
