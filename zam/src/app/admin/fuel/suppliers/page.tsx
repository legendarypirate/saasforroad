'use client';

import FuelEntityPage, { Tag } from '@/components/admin/fuel/FuelEntityPage';
import { SUPPLIER_STATUSES } from '@/lib/fuel';

export default function Page() {
  return (
    <FuelEntityPage
      title="Шатахуун нийлүүлэгч"
      resource="suppliers"
      searchPlaceholder="Нэр / утас / ТТД…"
      exportFilename="fuel-suppliers.csv"
      defaults={{ status: 'active' }}
      filterFields={[{ key: 'status', label: 'Төлөв', options: SUPPLIER_STATUSES }]}
      mapExportRow={(r) => ({
        name: r.name,
        phone: r.phone,
        email: r.email,
        address: r.address,
        tax_number: r.tax_number,
        status: r.status,
      })}
      fields={[
        { key: 'name', label: 'Нийлүүлэгчийн нэр', required: true },
        { key: 'phone', label: 'Утас' },
        { key: 'email', label: 'И-мэйл' },
        { key: 'address', label: 'Хаяг', type: 'textarea' },
        { key: 'tax_number', label: 'Татвар төлөгчийн дугаар' },
        { key: 'status', label: 'Төлөв', type: 'select', options: SUPPLIER_STATUSES, required: true },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Нэр', dataIndex: 'name' },
        { title: 'Утас', dataIndex: 'phone', render: (v) => v || '—' },
        { title: 'И-мэйл', dataIndex: 'email', render: (v) => v || '—' },
        { title: 'ТТД', dataIndex: 'tax_number', render: (v) => v || '—' },
        {
          title: 'Төлөв',
          dataIndex: 'status',
          render: (v: string) => (
            <Tag color={v === 'active' ? 'green' : undefined}>
              {SUPPLIER_STATUSES.find((s) => s.value === v)?.label || v}
            </Tag>
          ),
        },
      ]}
    />
  );
}
