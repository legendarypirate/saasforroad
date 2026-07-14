'use client';

import FuelEntityPage, { Tag } from '@/components/admin/fuel/FuelEntityPage';
import { FUEL_TYPES, TANK_STATUSES, fuelTypeLabel } from '@/lib/fuel';

export default function Page() {
  return (
    <FuelEntityPage
      title="Шатахууны сав / танк"
      resource="tanks"
      searchPlaceholder="Нэр / байршил…"
      exportFilename="fuel-tanks.csv"
      defaults={{ fuel_type: 'diesel', status: 'active', capacity: 10000, current_stock: 0, min_stock: 500 }}
      filterFields={[
        { key: 'fuel_type', label: 'Төрөл', options: FUEL_TYPES },
        { key: 'status', label: 'Төлөв', options: TANK_STATUSES },
      ]}
      mapExportRow={(r) => ({
        name: r.name,
        capacity: r.capacity,
        current_stock: r.current_stock,
        available: r.available_capacity,
        utilization: r.utilization_pct,
        location: r.location,
        fuel_type: r.fuel_type,
        status: r.status,
      })}
      fields={[
        { key: 'name', label: 'Савны нэр', required: true },
        { key: 'capacity', label: 'Багтаамж (л)', type: 'number', required: true },
        { key: 'current_stock', label: 'Эхний үлдэгдэл (зөвхөн шинэ)', type: 'number' },
        { key: 'min_stock', label: 'Доод үлдэгдэл', type: 'number' },
        { key: 'location', label: 'Байршил' },
        { key: 'fuel_type', label: 'Түлшний төрөл', type: 'select', options: FUEL_TYPES, required: true },
        { key: 'status', label: 'Төлөв', type: 'select', options: TANK_STATUSES, required: true },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Нэр', dataIndex: 'name' },
        {
          title: 'Төрөл',
          dataIndex: 'fuel_type',
          render: (v: string) => fuelTypeLabel(v),
        },
        { title: 'Байршил', dataIndex: 'location', render: (v) => v || '—' },
        {
          title: 'Үлдэгдэл',
          dataIndex: 'current_stock',
          align: 'right',
          render: (v, r) => {
            const status = String(r.stock_status || '');
            return (
              <span className={status !== 'ok' ? 'font-semibold text-amber-700' : ''}>
                {Number(v).toLocaleString()} л{' '}
                {status === 'out_of_stock' ? (
                  <Tag color="red">дууссан</Tag>
                ) : status === 'low_stock' ? (
                  <Tag color="orange">бага</Tag>
                ) : null}
              </span>
            );
          },
        },
        {
          title: 'Чөлөөт багтаамж',
          dataIndex: 'available_capacity',
          align: 'right',
          render: (v) => `${Number(v).toLocaleString()} л`,
        },
        {
          title: 'Ашиглалт',
          dataIndex: 'utilization_pct',
          align: 'right',
          render: (v) => `${v}%`,
        },
        {
          title: 'Багтаамж',
          dataIndex: 'capacity',
          align: 'right',
          render: (v) => `${Number(v).toLocaleString()} л`,
        },
        {
          title: 'Төлөв',
          dataIndex: 'status',
          render: (v: string) => {
            const label = TANK_STATUSES.find((s) => s.value === v)?.label || v;
            return <Tag color={v === 'active' ? 'green' : v === 'maintenance' ? 'orange' : undefined}>{label}</Tag>;
          },
        },
      ]}
    />
  );
}
