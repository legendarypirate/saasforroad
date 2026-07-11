'use client';

import { useMemo } from 'react';
import RoadEntityPage from '@/components/admin/road/RoadEntityPage';
import { BUDGET_CATEGORIES, formatMnt } from '@/lib/roadEngineering';
import type { ColumnsType } from '@/components/admin/primitives';

export default function BudgetRatesPage() {
  const columns: ColumnsType<Record<string, unknown>> = useMemo(
    () => [
      { title: 'Код', dataIndex: 'code', width: 100 },
      {
        title: 'Ангилал',
        dataIndex: 'category',
        width: 140,
        render: (v) => BUDGET_CATEGORIES.find((c) => c.value === v)?.label || String(v),
      },
      { title: 'Нэр', dataIndex: 'name', ellipsis: true },
      { title: 'Нэгж', dataIndex: 'unit', width: 80 },
      {
        title: 'Нэгж үнэ',
        dataIndex: 'unit_price',
        width: 140,
        render: (v) => formatMnt(Number(v)),
      },
      {
        title: 'Хөдөлмөр %',
        dataIndex: 'labor_share',
        width: 100,
      },
      {
        title: 'Материал %',
        dataIndex: 'material_share',
        width: 100,
      },
      {
        title: 'Техник %',
        dataIndex: 'equipment_share',
        width: 100,
      },
    ],
    [],
  );

  return (
    <RoadEntityPage
      title="Нэгж үнийн сан / Rate library"
      resource="budget/rates"
      fields={[
        { key: 'code', label: 'Код', required: true },
        {
          key: 'category',
          label: 'Ангилал',
          type: 'select',
          required: true,
          options: BUDGET_CATEGORIES,
        },
        { key: 'name', label: 'Нэр', required: true },
        { key: 'unit', label: 'Нэгж', required: true },
        { key: 'unit_price', label: 'Нэгж үнэ (₮)', type: 'number', required: true },
        { key: 'labor_share', label: 'Хөдөлмөр %', type: 'number' },
        { key: 'material_share', label: 'Материал %', type: 'number' },
        { key: 'equipment_share', label: 'Техник %', type: 'number' },
        { key: 'productivity', label: 'Бүтээмж / өдөр', type: 'number' },
        { key: 'remarks', label: 'Тайлбар', type: 'textarea' },
      ]}
      columns={columns}
    />
  );
}
