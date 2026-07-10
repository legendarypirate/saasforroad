'use client';

import { useEffect, useState } from 'react';
import PlantEntityPage, { Tag } from '@/components/admin/plant/PlantEntityPage';
import {
  BUYER_TYPES,
  PAYMENT_STATUSES,
  fetchPlantList,
  formatMoney,
  formatQty,
} from '@/lib/plant';
import { Spinner } from '@/components/ui/spinner';
import dayjs from 'dayjs';

export default function Page() {
  const [plantOpts, setPlantOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [productOpts, setProductOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [projectOpts, setProjectOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchPlantList<Record<string, unknown>>('sites'),
      fetchPlantList<Record<string, unknown>>('products'),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`).then((r) => r.json()),
    ]).then(([sites, products, projectsRes]) => {
      setPlantOpts(sites.map((s) => ({ value: Number(s.id), label: String(s.name) })));
      setProductOpts(products.map((p) => ({ value: Number(p.id), label: String(p.name) })));
      setProjectOpts(
        (projectsRes.success ? projectsRes.data : []).map((p: { id: number; name: string }) => ({
          value: p.id,
          label: p.name,
        })),
      );
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
      title="Борлуулалт / орлого"
      resource="sales"
      defaults={{
        sale_date: dayjs(),
        buyer_type: 'project',
        payment_status: 'unpaid',
        unit: 'тн',
        quantity: 0,
        unit_price: 0,
      }}
      beforeSave={(body) => {
        const qty = Number(body.quantity || 0);
        const price = Number(body.unit_price || 0);
        return { ...body, total_amount: qty * price };
      }}
      fields={[
        { key: 'plant_id', label: 'Үйлдвэр', type: 'select', options: plantOpts, required: true },
        { key: 'product_id', label: 'Бүтээгдэхүүн', type: 'select', options: productOpts },
        { key: 'project_id', label: 'Төсөл', type: 'select', options: projectOpts },
        { key: 'sale_date', label: 'Огноо', type: 'date', required: true },
        { key: 'buyer_name', label: 'Худалдан авагч', required: true },
        { key: 'buyer_type', label: 'Төрөл', type: 'select', options: BUYER_TYPES },
        { key: 'quantity', label: 'Тоо', type: 'number', required: true },
        { key: 'unit', label: 'Нэгж' },
        { key: 'unit_price', label: 'Нэгж үнэ (₮)', type: 'number', required: true },
        { key: 'payment_status', label: 'Төлбөр', type: 'select', options: PAYMENT_STATUSES },
        { key: 'invoice_no', label: 'Нэхэмжлэх №' },
        { key: 'delivery_note', label: 'Ачилтын баримт' },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Огноо', dataIndex: 'sale_date', width: 110 },
        {
          title: 'Үйлдвэр',
          key: 'plant',
          render: (_, r) => (r.plant as { name?: string } | undefined)?.name || '—',
        },
        { title: 'Худалдан авагч', dataIndex: 'buyer_name' },
        {
          title: 'Бүтээгдэхүүн',
          key: 'product',
          render: (_, r) => (r.product as { name?: string } | undefined)?.name || '—',
        },
        {
          title: 'Тоо',
          key: 'qty',
          align: 'right',
          render: (_, r) => formatQty(Number(r.quantity), String(r.unit || 'тн')),
        },
        {
          title: 'Дүн',
          dataIndex: 'total_amount',
          align: 'right',
          render: (v) => <span className="font-medium text-emerald-500">{formatMoney(Number(v))}</span>,
        },
        {
          title: 'Төлбөр',
          dataIndex: 'payment_status',
          render: (v) => {
            const label = PAYMENT_STATUSES.find((s) => s.value === v)?.label || String(v);
            const color = v === 'paid' ? 'green' : v === 'partial' ? 'orange' : 'red';
            return <Tag color={color}>{label}</Tag>;
          },
        },
      ]}
    />
  );
}
