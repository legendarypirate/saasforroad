'use client';

import { useEffect, useState } from 'react';
import PlantEntityPage, { Tag } from '@/components/admin/plant/PlantEntityPage';
import { BATCH_STATUSES, fetchPlantList, formatQty } from '@/lib/plant';
import { Spinner } from '@/components/ui/spinner';
import dayjs from 'dayjs';

export default function Page() {
  const [plantOpts, setPlantOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [productOpts, setProductOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchPlantList<Record<string, unknown>>('sites'),
      fetchPlantList<Record<string, unknown>>('products'),
    ]).then(([sites, products]) => {
      setPlantOpts(sites.map((s) => ({ value: Number(s.id), label: String(s.name) })));
      setProductOpts(products.map((p) => ({ value: Number(p.id), label: String(p.name) })));
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
      title="Үйлдвэрлэлийн багц"
      resource="batches"
      defaults={{
        status: 'done',
        unit: 'тн',
        production_date: dayjs(),
        quantity_produced: 0,
        lab_ok: true,
      }}
      fields={[
        { key: 'plant_id', label: 'Үйлдвэр', type: 'select', options: plantOpts, required: true },
        { key: 'product_id', label: 'Бүтээгдэхүүн', type: 'select', options: productOpts },
        { key: 'batch_no', label: 'Багцын дугаар' },
        { key: 'production_date', label: 'Огноо', type: 'date', required: true },
        { key: 'quantity_produced', label: 'Үйлдвэрлэсэн тоо', type: 'number', required: true },
        { key: 'unit', label: 'Нэгж' },
        { key: 'mix_formula', label: 'Хольцын жор', type: 'textarea' },
        { key: 'operator_name', label: 'Оператор' },
        { key: 'fuel_used', label: 'Шатахуун', type: 'number' },
        { key: 'status', label: 'Төлөв', type: 'select', options: BATCH_STATUSES },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Огноо', dataIndex: 'production_date', width: 110 },
        {
          title: 'Үйлдвэр',
          key: 'plant',
          render: (_, r) => (r.plant as { name?: string } | undefined)?.name || '—',
        },
        {
          title: 'Бүтээгдэхүүн',
          key: 'product',
          render: (_, r) => (r.product as { name?: string } | undefined)?.name || '—',
        },
        { title: 'Багц №', dataIndex: 'batch_no' },
        {
          title: 'Тоо',
          key: 'qty',
          align: 'right',
          render: (_, r) => formatQty(Number(r.quantity_produced), String(r.unit || 'тн')),
        },
        {
          title: 'Лаб',
          dataIndex: 'lab_ok',
          render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'OK' : 'NG'}</Tag>,
        },
        {
          title: 'Төлөв',
          dataIndex: 'status',
          render: (v) => BATCH_STATUSES.find((s) => s.value === v)?.label || String(v),
        },
      ]}
    />
  );
}
