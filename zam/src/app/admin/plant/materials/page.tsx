'use client';

import PlantEntityPage, { Tag } from '@/components/admin/plant/PlantEntityPage';
import { MATERIAL_TYPES, formatMoney } from '@/lib/plant';

export default function Page() {
  return (
    <PlantEntityPage
      title="Түүхий эд"
      resource="materials"
      defaults={{ material_type: 'aggregate', unit: 'тн', min_stock: 0 }}
      fields={[
        { key: 'name', label: 'Нэр', required: true },
        { key: 'material_type', label: 'Төрөл', type: 'select', options: MATERIAL_TYPES },
        { key: 'unit', label: 'Нэгж' },
        { key: 'min_stock', label: 'Доод үлдэгдэл', type: 'number' },
        { key: 'unit_cost_default', label: 'Өртөг (₮)', type: 'number' },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Нэр', dataIndex: 'name' },
        {
          title: 'Төрөл',
          dataIndex: 'material_type',
          render: (v) => (
            <Tag color="blue">{MATERIAL_TYPES.find((t) => t.value === v)?.label || String(v)}</Tag>
          ),
        },
        { title: 'Нэгж', dataIndex: 'unit', width: 70 },
        { title: 'Доод үлдэгдэл', dataIndex: 'min_stock', align: 'right' },
        {
          title: 'Өртөг',
          dataIndex: 'unit_cost_default',
          align: 'right',
          render: (v) => formatMoney(Number(v)),
        },
      ]}
    />
  );
}
