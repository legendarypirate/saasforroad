'use client';

import { useEffect, useState } from 'react';
import UniformEntityPage, { Tag } from '@/components/admin/uniform/UniformEntityPage';
import { fetchUniformList } from '@/lib/uniform';
import { Spinner } from '@/components/ui/spinner';

export default function Page() {
  const [ready, setReady] = useState(false);
  const [itemOpts, setItemOpts] = useState<Array<{ value: number; label: string }>>([]);

  useEffect(() => {
    (async () => {
      const items = await fetchUniformList<Record<string, unknown>>('items');
      setItemOpts(
        items.map((i) => ({
          value: Number(i.id),
          label: `${i.code || ''} ${i.name} (үлд: ${i.stock_qty})`.trim(),
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
    <UniformEntityPage
      title="Үлдэгдэл — орлого / тохируулга"
      resource="movements"
      defaults={{ type: 'in', qty: 1 }}
      fields={[
        { key: 'movement_date', label: 'Огноо', type: 'date', required: true },
        { key: 'item_id', label: 'Бараа', type: 'select', options: itemOpts, required: true },
        {
          key: 'type',
          label: 'Төрөл',
          type: 'select',
          options: [
            { value: 'in', label: 'Орлого (+)' },
            { value: 'out', label: 'Зарлага (−)' },
            { value: 'adjust', label: 'Тохируулга (+/− delta)' },
          ],
          required: true,
        },
        { key: 'qty', label: 'Тоо (тохируулгад delta)', type: 'number', required: true },
        { key: 'reference', label: 'Лавлагаа' },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Огноо', dataIndex: 'movement_date', width: 110 },
        {
          title: 'Бараа',
          render: (_, r) => (r.item as { name?: string })?.name || '—',
        },
        {
          title: 'Төрөл',
          dataIndex: 'type',
          render: (v: string) =>
            v === 'in' ? (
              <Tag color="green">Орлого</Tag>
            ) : v === 'out' ? (
              <Tag color="orange">Зарлага</Tag>
            ) : (
              <Tag>Тохируулга</Tag>
            ),
        },
        { title: 'Тоо', dataIndex: 'qty', align: 'right' },
        { title: 'Лавлагаа', dataIndex: 'reference', render: (v) => v || '—' },
      ]}
    />
  );
}
