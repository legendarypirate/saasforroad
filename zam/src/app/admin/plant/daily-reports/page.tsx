'use client';

import { useEffect, useState } from 'react';
import PlantEntityPage, { Tag } from '@/components/admin/plant/PlantEntityPage';
import { REPORT_STATUSES, fetchPlantList, formatQty } from '@/lib/plant';
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
      title="Өдрийн үйлдвэрлэлийн тайлан"
      resource="daily-reports"
      defaults={{
        report_date: dayjs(),
        status: 'submitted',
        unit: 'тн',
        hours_run: 0,
        quantity_produced: 0,
        quantity_shipped: 0,
        shift_count: 1,
      }}
      fields={[
        { key: 'plant_id', label: 'Үйлдвэр', type: 'select', options: plantOpts, required: true },
        { key: 'report_date', label: 'Огноо', type: 'date', required: true },
        { key: 'hours_run', label: 'Ажилласан цаг', type: 'number' },
        { key: 'downtime_hours', label: 'Зогсолт (цаг)', type: 'number' },
        { key: 'downtime_reason', label: 'Зогсолтын шалтгаан' },
        { key: 'quantity_produced', label: 'Үйлдвэрлэсэн', type: 'number' },
        { key: 'quantity_shipped', label: 'Ачилт', type: 'number' },
        { key: 'quantity_stock', label: 'Үлдэгдэл', type: 'number' },
        { key: 'unit', label: 'Нэгж' },
        { key: 'fuel_used', label: 'Шатахуун', type: 'number' },
        { key: 'power_kwh', label: 'Цахилгаан (кВт.ц)', type: 'number' },
        { key: 'weather', label: 'Цаг агаар' },
        { key: 'shift_count', label: 'Ээлж', type: 'number' },
        { key: 'headcount', label: 'Ажилтан тоо', type: 'number' },
        { key: 'created_by_name', label: 'Бүртгэсэн' },
        { key: 'status', label: 'Төлөв', type: 'select', options: REPORT_STATUSES },
        { key: 'summary', label: 'Товч', type: 'textarea' },
      ]}
      columns={[
        { title: 'Огноо', dataIndex: 'report_date', width: 110 },
        {
          title: 'Үйлдвэр',
          key: 'plant',
          render: (_, r) => (r.plant as { name?: string } | undefined)?.name || '—',
        },
        {
          title: 'Үйлдвэрлэсэн',
          key: 'prod',
          align: 'right',
          render: (_, r) => formatQty(Number(r.quantity_produced), String(r.unit || 'тн')),
        },
        {
          title: 'Ачилт',
          key: 'ship',
          align: 'right',
          render: (_, r) => formatQty(Number(r.quantity_shipped), String(r.unit || 'тн')),
        },
        { title: 'Цаг', dataIndex: 'hours_run', align: 'right' },
        { title: 'Зогсолт', dataIndex: 'downtime_hours', align: 'right' },
        {
          title: 'Төлөв',
          dataIndex: 'status',
          render: (v) => {
            const label = REPORT_STATUSES.find((s) => s.value === v)?.label || String(v);
            const color = v === 'approved' ? 'green' : v === 'submitted' ? 'blue' : 'default';
            return <Tag color={color}>{label}</Tag>;
          },
        },
      ]}
    />
  );
}
