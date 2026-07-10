'use client';

import { useEffect, useState } from 'react';
import PlantEntityPage, { Tag } from '@/components/admin/plant/PlantEntityPage';
import { EXPENSE_CATEGORIES, fetchPlantList, formatMoney } from '@/lib/plant';
import { Spinner } from '@/components/ui/spinner';
import dayjs from 'dayjs';

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
      title="Зардлын бүртгэл"
      resource="expenses"
      defaults={{
        expense_date: dayjs(),
        category: 'fuel',
        status: 'posted',
        amount: 0,
      }}
      fields={[
        { key: 'plant_id', label: 'Үйлдвэр', type: 'select', options: plantOpts, required: true },
        { key: 'expense_date', label: 'Огноо', type: 'date', required: true },
        { key: 'category', label: 'Ангилал', type: 'select', options: EXPENSE_CATEGORIES, required: true },
        { key: 'amount', label: 'Дүн (₮)', type: 'number', required: true },
        { key: 'vat_amount', label: 'НӨАТ', type: 'number' },
        { key: 'description', label: 'Тайлбар', required: true },
        { key: 'vendor_name', label: 'Нийлүүлэгч' },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Огноо', dataIndex: 'expense_date', width: 110 },
        {
          title: 'Үйлдвэр',
          key: 'plant',
          render: (_, r) => (r.plant as { name?: string } | undefined)?.name || '—',
        },
        {
          title: 'Ангилал',
          dataIndex: 'category',
          render: (v) => (
            <Tag>{EXPENSE_CATEGORIES.find((c) => c.value === v)?.label || String(v)}</Tag>
          ),
        },
        { title: 'Тайлбар', dataIndex: 'description', ellipsis: true },
        {
          title: 'Дүн',
          dataIndex: 'amount',
          align: 'right',
          render: (v) => <span className="font-medium text-red-400">{formatMoney(Number(v))}</span>,
        },
        { title: 'Нийлүүлэгч', dataIndex: 'vendor_name' },
      ]}
    />
  );
}
