'use client';

import { useEffect, useState } from 'react';
import PlantEntityPage, { Tag } from '@/components/admin/plant/PlantEntityPage';
import { PRODUCT_TYPES, fetchPlantList, formatMoney } from '@/lib/plant';
import { Spinner } from '@/components/ui/spinner';

export default function Page() {
  const [plantOpts, setPlantOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchPlantList<Record<string, unknown>>('sites').then((sites) => {
      setPlantOpts(sites.map((s) => ({ value: Number(s.id), label: String(s.name) })));
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <PlantEntityPage
      title="Бүтээгдэхүүн"
      resource="products"
      defaults={{ product_type: 'asphalt_mix', unit: 'тн', is_active: true, unit_price_default: 0 }}
      fields={[
        { key: 'plant_id', label: 'Үйлдвэр', type: 'select', options: plantOpts },
        { key: 'name', label: 'Нэр', required: true },
        { key: 'product_type', label: 'Төрөл', type: 'select', options: PRODUCT_TYPES },
        { key: 'grade', label: 'Зэрэг / марк' },
        { key: 'unit', label: 'Нэгж' },
        { key: 'unit_price_default', label: 'Үндсэн үнэ (₮)', type: 'number' },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        {
          title: 'Үйлдвэр',
          key: 'plant',
          render: (_, r) => (r.plant as { name?: string } | undefined)?.name || '—',
        },
        { title: 'Нэр', dataIndex: 'name' },
        {
          title: 'Төрөл',
          dataIndex: 'product_type',
          render: (v) => PRODUCT_TYPES.find((t) => t.value === v)?.label || String(v),
        },
        { title: 'Зэрэг', dataIndex: 'grade' },
        { title: 'Нэгж', dataIndex: 'unit', width: 70 },
        {
          title: 'Үнэ',
          dataIndex: 'unit_price_default',
          align: 'right',
          render: (v) => formatMoney(Number(v)),
        },
        {
          title: 'Идэвхтэй',
          dataIndex: 'is_active',
          render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Тийм' : 'Үгүй'}</Tag>,
        },
      ]}
    />
  );
}
