'use client';

import UniformEntityPage, { Tag } from '@/components/admin/uniform/UniformEntityPage';
import { ITEM_CATEGORIES } from '@/lib/uniform';

export default function Page() {
  return (
    <UniformEntityPage
      title="Барааны бүртгэл"
      resource="items"
      defaults={{ category: 'workwear', unit: 'ширхэг', stock_qty: 0, min_stock: 5, unit_cost: 0, is_active: 1 }}
      beforeSave={(body) => ({
        ...body,
        is_active: body.is_active === 1 || body.is_active === '1' || body.is_active === true,
      })}
      fields={[
        { key: 'code', label: 'Код (хоосон бол авто)' },
        { key: 'name', label: 'Нэр', required: true },
        { key: 'category', label: 'Төрөл', type: 'select', options: ITEM_CATEGORIES, required: true },
        { key: 'size_options', label: 'Хэмжээ (ж: S,M,L,XL эсвэл 40-45)' },
        { key: 'unit', label: 'Нэгж' },
        { key: 'unit_cost', label: 'Нэгж үнэ', type: 'number' },
        { key: 'stock_qty', label: 'Эхний үлдэгдэл (зөвхөн шинэ)', type: 'number' },
        { key: 'min_stock', label: 'Доод үлдэгдэл', type: 'number' },
        {
          key: 'is_active',
          label: 'Идэвхтэй',
          type: 'select',
          options: [
            { value: 1, label: 'Тийм' },
            { value: 0, label: 'Үгүй' },
          ],
        },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Код', dataIndex: 'code', width: 90 },
        { title: 'Нэр', dataIndex: 'name' },
        {
          title: 'Төрөл',
          dataIndex: 'category',
          render: (v: string) => ITEM_CATEGORIES.find((c) => c.value === v)?.label || v,
        },
        { title: 'Хэмжээ', dataIndex: 'size_options', render: (v) => v || '—' },
        {
          title: 'Үлдэгдэл',
          dataIndex: 'stock_qty',
          align: 'right',
          render: (v, r) => {
            const low = Number(v) <= Number(r.min_stock);
            return <span className={low ? 'font-semibold text-amber-600' : ''}>{String(v)}</span>;
          },
        },
        {
          title: 'Төлөв',
          dataIndex: 'is_active',
          render: (v) => (v !== false ? <Tag color="green">Идэвхтэй</Tag> : <Tag>Идэвхгүй</Tag>),
        },
      ]}
    />
  );
}
