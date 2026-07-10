'use client';

import PlantEntityPage, { Tag } from '@/components/admin/plant/PlantEntityPage';
import { PLANT_STATUSES, PLANT_TYPES, plantTypeLabel } from '@/lib/plant';

export default function Page() {
  return (
    <PlantEntityPage
      title="Үйлдвэрүүд"
      resource="sites"
      defaults={{ status: 'active', plant_type: 'asphalt', capacity_unit: 'тн' }}
      fields={[
        { key: 'code', label: 'Код' },
        { key: 'name', label: 'Нэр', required: true },
        { key: 'plant_type', label: 'Төрөл', type: 'select', options: PLANT_TYPES, required: true },
        { key: 'location', label: 'Байршил' },
        { key: 'aimag', label: 'Аймаг / хот' },
        { key: 'capacity_per_hour', label: 'Чадал / цаг', type: 'number' },
        { key: 'capacity_unit', label: 'Нэгж' },
        { key: 'status', label: 'Төлөв', type: 'select', options: PLANT_STATUSES },
        { key: 'manager_name', label: 'Менежер' },
        { key: 'phone', label: 'Утас' },
        { key: 'opened_date', label: 'Ашиглалтад орсон', type: 'date' },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Код', dataIndex: 'code', width: 90 },
        { title: 'Нэр', dataIndex: 'name' },
        {
          title: 'Төрөл',
          dataIndex: 'plant_type',
          render: (v) => <Tag color="blue">{plantTypeLabel(String(v))}</Tag>,
        },
        { title: 'Байршил', dataIndex: 'location' },
        {
          title: 'Чадал',
          key: 'cap',
          render: (_, r) =>
            r.capacity_per_hour
              ? `${r.capacity_per_hour} ${r.capacity_unit || 'тн'}/цаг`
              : '—',
        },
        {
          title: 'Төлөв',
          dataIndex: 'status',
          render: (v) => {
            const label = PLANT_STATUSES.find((s) => s.value === v)?.label || String(v);
            const color = v === 'active' ? 'green' : v === 'seasonal' ? 'orange' : 'default';
            return <Tag color={color}>{label}</Tag>;
          },
        },
        { title: 'Менежер', dataIndex: 'manager_name' },
      ]}
    />
  );
}
