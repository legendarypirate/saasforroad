'use client';

import { useEffect, useState } from 'react';
import FinanceEntityPage, { Tag } from '@/components/admin/finance/FinanceEntityPage';
import { CONTRACT_TYPES, formatMoney } from '@/lib/finance';
import { Spinner } from '@/components/ui/spinner';

export default function Page() {
  const [ready, setReady] = useState(false);
  const [projectOpts, setProjectOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [supplierOpts, setSupplierOpts] = useState<Array<{ value: number; label: string }>>([]);

  useEffect(() => {
    (async () => {
      const [projectsRes, suppliersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`).then((r) => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supplier`).then((r) => r.json()),
      ]);
      setProjectOpts(
        (projectsRes.success ? projectsRes.data : []).map((p: { id: number; name: string }) => ({
          value: p.id,
          label: p.name,
        })),
      );
      setSupplierOpts(
        (suppliersRes.success ? suppliersRes.data || [] : []).map((s: { id: number; name: string }) => ({
          value: s.id,
          label: s.name,
        })),
      );
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <FinanceEntityPage
      title="Гэрээ"
      resource="contracts"
      defaults={{ type: 'client', status: 'active', vat_rate: 10, amount: 0 }}
      fields={[
        { key: 'number', label: 'Дугаар (хоосон бол авто)' },
        { key: 'type', label: 'Төрөл', type: 'select', options: CONTRACT_TYPES, required: true },
        { key: 'party_name', label: 'Талын нэр', required: true },
        { key: 'project_id', label: 'Төсөл', type: 'select', options: projectOpts },
        { key: 'supplier_id', label: 'Нийлүүлэгч', type: 'select', options: supplierOpts },
        { key: 'amount', label: 'Дүн', type: 'number', required: true },
        { key: 'vat_rate', label: 'НӨАТ %', type: 'number' },
        { key: 'start_date', label: 'Эхлэх', type: 'date' },
        { key: 'end_date', label: 'Дуусах', type: 'date' },
        {
          key: 'status',
          label: 'Төлөв',
          type: 'select',
          options: [
            { value: 'active', label: 'Идэвхтэй' },
            { value: 'completed', label: 'Дууссан' },
            { value: 'cancelled', label: 'Цуцлагдсан' },
          ],
        },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Дугаар', dataIndex: 'number', width: 120 },
        {
          title: 'Төрөл',
          dataIndex: 'type',
          render: (v: string) =>
            v === 'supplier' ? <Tag color="orange">Нийлүүлэгч</Tag> : <Tag color="blue">Захиалагч</Tag>,
        },
        { title: 'Тал', dataIndex: 'party_name' },
        {
          title: 'Төсөл',
          render: (_, r) => (r.project as { name?: string })?.name || '—',
        },
        {
          title: 'Дүн',
          dataIndex: 'amount',
          align: 'right',
          render: (v) => formatMoney(v as number),
        },
        { title: 'Төлөв', dataIndex: 'status' },
      ]}
    />
  );
}
