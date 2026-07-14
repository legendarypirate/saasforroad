'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import FuelEntityPage from '@/components/admin/fuel/FuelEntityPage';
import { FUEL_TYPES, fuelTypeLabel, fetchFuelList } from '@/lib/fuel';

export default function Page() {
  const [suppliers, setSuppliers] = useState<Array<{ value: number; label: string }>>([]);
  const [tanks, setTanks] = useState<Array<{ value: number; label: string }>>([]);

  useEffect(() => {
    (async () => {
      const [s, t] = await Promise.all([
        fetchFuelList<Record<string, unknown>>('suppliers', { status: 'active' }),
        fetchFuelList<Record<string, unknown>>('tanks', { status: 'active' }),
      ]);
      setSuppliers(s.map((x) => ({ value: Number(x.id), label: String(x.name) })));
      setTanks(
        t.map((x) => ({
          value: Number(x.id),
          label: `${x.name} (${Number(x.current_stock).toLocaleString()} л)`,
        })),
      );
    })().catch(() => undefined);
  }, []);

  return (
    <FuelEntityPage
      title="Шатахуун худалдан авалт"
      resource="purchases"
      searchPlaceholder="Нэхэмжлэх / тэмдэглэл…"
      exportFilename="fuel-purchases.csv"
      defaults={{ purchase_date: dayjs(), fuel_type: 'diesel', quantity: 0, unit_price: 0 }}
      beforeSave={(body) => {
        const qty = Number(body.quantity) || 0;
        const price = Number(body.unit_price) || 0;
        return { ...body, total_amount: Math.round(qty * price * 100) / 100 };
      }}
      filterFields={[
        { key: 'fuel_type', label: 'Түлшний төрөл', options: FUEL_TYPES },
        {
          key: 'supplier_id',
          label: 'Нийлүүлэгч',
          options: suppliers.map((s) => ({ value: String(s.value), label: s.label })),
        },
        {
          key: 'tank_id',
          label: 'Сав',
          options: tanks.map((t) => ({ value: String(t.value), label: t.label })),
        },
      ]}
      mapExportRow={(r) => ({
        date: r.purchase_date,
        supplier: (r.supplier as { name?: string })?.name,
        invoice: r.invoice_number,
        fuel_type: r.fuel_type,
        quantity: r.quantity,
        unit_price: r.unit_price,
        total: r.total_amount,
        tank: (r.tank as { name?: string })?.name,
        notes: r.notes,
      })}
      fields={[
        { key: 'purchase_date', label: 'Огноо', type: 'date', required: true },
        { key: 'supplier_id', label: 'Нийлүүлэгч', type: 'select', options: suppliers, required: true },
        { key: 'invoice_number', label: 'Нэхэмжлэхийн дугаар' },
        { key: 'fuel_type', label: 'Түлшний төрөл', type: 'select', options: FUEL_TYPES, required: true },
        { key: 'quantity', label: 'Тоо хэмжээ (л)', type: 'number', required: true },
        { key: 'unit_price', label: 'Нэгж үнэ', type: 'number', required: true },
        { key: 'tank_id', label: 'Сав', type: 'select', options: tanks, required: true },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Огноо', dataIndex: 'purchase_date', width: 110 },
        {
          title: 'Нийлүүлэгч',
          render: (_, r) => (r.supplier as { name?: string })?.name || '—',
        },
        { title: 'Нэхэмжлэх', dataIndex: 'invoice_number', render: (v) => v || '—' },
        {
          title: 'Төрөл',
          dataIndex: 'fuel_type',
          render: (v: string) => fuelTypeLabel(v),
        },
        {
          title: 'Литр',
          dataIndex: 'quantity',
          align: 'right',
          render: (v) => Number(v).toLocaleString(),
        },
        {
          title: 'Нэгж үнэ',
          dataIndex: 'unit_price',
          align: 'right',
          render: (v) => Number(v).toLocaleString(),
        },
        {
          title: 'Нийт дүн',
          dataIndex: 'total_amount',
          align: 'right',
          render: (v) => `${Number(v).toLocaleString()} ₮`,
        },
        {
          title: 'Сав',
          render: (_, r) => (r.tank as { name?: string })?.name || '—',
        },
      ]}
    />
  );
}
