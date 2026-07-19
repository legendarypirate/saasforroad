'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { ReloadOutlined } from '@/components/admin/icons';
import {
  DEFAULT_CONSUMPTION_STANDARD,
  downloadCsv,
  fetchFuelList,
  printTable,
  recalcFuelConsumptions,
} from '@/lib/fuel';

export default function FuelConsumptionPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [highOnly, setHighOnly] = useState(false);
  const [standard, setStandard] = useState(DEFAULT_CONSUMPTION_STANDARD);
  const [equipment, setEquipment] = useState<Array<{ value: string; label: string }>>([]);
  const [equipmentId, setEquipmentId] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFuelList<Record<string, unknown>>('consumptions', {
        high_only: highOnly ? '1' : undefined,
        equipment_id: equipmentId,
      });
      setRows(data);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [highOnly, equipmentId]);

  useEffect(() => {
    document.title = 'Шатахууны зарцуулалт';
    load();
  }, [load]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/equipment`)
      .then((r) => r.json())
      .then((json) => {
        const list = json.success ? (Array.isArray(json.data) ? json.data : json.data?.rows || []) : [];
        setEquipment(
          list.map((e: { id: number; name: string; registration_number?: string }) => ({
            value: String(e.id),
            label: `${e.name}${e.registration_number ? ` (${e.registration_number})` : ''}`,
          })),
        );
      })
      .catch(() => undefined);
  }, []);

  const handleRecalc = async () => {
    try {
      const res = await recalcFuelConsumptions(standard);
      message.success(`Дахин тооцоолсон: ${res?.created ?? 0} бичлэг`);
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<Record<string, unknown>> = [
    {
      title: 'Техник',
      render: (_, r) => {
        const eq = r.equipment as { name?: string; registration_number?: string } | undefined;
        if (!eq) return '—';
        return eq.registration_number ? `${eq.name} (${eq.registration_number})` : eq.name;
      },
    },
    {
      title: 'Жолооч',
      render: (_, r) => (r.driver as { username?: string })?.username || '—',
    },
    {
      title: 'Хугацаа',
      render: (_, r) => `${r.period_from || '—'} → ${r.period_to || '—'}`,
    },
    {
      title: 'Зай (км)',
      dataIndex: 'distance_km',
      align: 'right',
      render: (v) => Number(v).toLocaleString(),
    },
    {
      title: 'Шатахуун (л)',
      dataIndex: 'fuel_used',
      align: 'right',
      render: (v) => Number(v).toLocaleString(),
    },
    {
      title: 'Л/100км',
      dataIndex: 'consumption_rate',
      align: 'right',
      render: (v, r) => (
        <span className={r.is_high ? 'font-semibold text-amber-700' : ''}>
          {Number(v).toFixed(2)}
          {r.is_high ? <Tag color="orange" className="ml-2">их</Tag> : null}
        </span>
      ),
    },
    {
      title: 'Стандарт',
      dataIndex: 'standard_rate',
      align: 'right',
      render: (v) => Number(v).toFixed(1),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="Техник"
          style={{ minWidth: 200 }}
          options={equipment}
          value={equipmentId}
          onChange={(v) => setEquipmentId(v)}
          showSearch
          optionFilterProp="label"
        />
        <Select
          style={{ width: 180 }}
          value={highOnly ? 'high' : 'all'}
          onChange={(v) => setHighOnly(v === 'high')}
          options={[
            { value: 'all', label: 'Бүгд' },
            { value: 'high', label: 'Зөвхөн хэтрэлт' },
          ]}
        />
        <span className="text-sm text-muted-foreground">Стандарт:</span>
        <InputNumber min={1} value={standard} onChange={(v) => setStandard(Number(v) || DEFAULT_CONSUMPTION_STANDARD)} />
        <Button onClick={handleRecalc}>Дахин тооцоолох</Button>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button
          onClick={() =>
            downloadCsv(
              'fuel-consumption.csv',
              rows.map((r) => ({
                vehicle: (r.equipment as { name?: string })?.name,
                driver: (r.driver as { username?: string })?.username,
                distance: r.distance_km,
                fuel_used: r.fuel_used,
                rate: r.consumption_rate,
                standard: r.standard_rate,
                high: r.is_high,
              })),
            )
          }
        >
          CSV
        </Button>
        <Button onClick={() => printTable('Зарцуулалт')}>Хэвлэх</Button>
      </Space>

      <p className="mb-4 text-sm text-muted-foreground">
        Томьёо: (Өмнөх олголтын литр / одометрийн зөрүү) × 100 = Л/100км. Стандартыг хэтэрвэл тэмдэглэнэ.
      </p>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 15, showSizeChanger: true }}
        scroll={{ x: 900 }}
        rowClassName={(r) => (r.is_high ? 'bg-amber-50/60' : '')}
      />
    </div>
  );
}
