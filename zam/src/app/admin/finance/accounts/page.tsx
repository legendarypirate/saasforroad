'use client';

import FinanceEntityPage, { Tag } from '@/components/admin/finance/FinanceEntityPage';
import { ACCOUNT_TYPES, formatMoney } from '@/lib/finance';

export default function Page() {
  return (
    <FinanceEntityPage
      title="Касс / Банк"
      resource="accounts"
      defaults={{ type: 'bank', currency: 'MNT', is_active: 1, opening_balance: 0 }}
      fields={[
        { key: 'code', label: 'Код' },
        { key: 'name', label: 'Нэр', required: true },
        { key: 'type', label: 'Төрөл', type: 'select', options: ACCOUNT_TYPES, required: true },
        { key: 'bank_name', label: 'Банк' },
        { key: 'account_number', label: 'Дансны дугаар' },
        { key: 'opening_balance', label: 'Эхний үлдэгдэл', type: 'number' },
        { key: 'currency', label: 'Валют' },
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
      beforeSave={(body) => ({
        ...body,
        is_active: body.is_active === 1 || body.is_active === '1' || body.is_active === true,
      })}
      columns={[
        { title: 'Код', dataIndex: 'code', width: 100 },
        { title: 'Нэр', dataIndex: 'name' },
        {
          title: 'Төрөл',
          dataIndex: 'type',
          render: (v: string) => (v === 'cash' ? <Tag color="green">Касс</Tag> : <Tag color="blue">Банк</Tag>),
        },
        { title: 'Банк', dataIndex: 'bank_name', render: (v) => v || '—' },
        {
          title: 'Эхний үлдэгдэл',
          dataIndex: 'opening_balance',
          align: 'right',
          render: (v) => formatMoney(v as number),
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
