'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Tag,
  message,
  Empty,
  Spin,
} from '@/components/admin/primitives';
import {
  ReloadOutlined,
  PhoneOutlined,
  ToolOutlined,
  EyeOutlined,
} from '@/components/admin/icons';
import {
  EQUIPMENT_API,
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  equipmentCoverUrl,
  type EquipmentItem,
  type EquipmentStatus,
} from '@/lib/equipment';

function money(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `₮${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function RentableTechniquePage() {
  const router = useRouter();
  const [rows, setRows] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EQUIPMENT_API}/marketplace`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Ачаалахад алдаа');
      setRows((json.data || []) as EquipmentItem[]);
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Түрээсийн техник';
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [
        r.name,
        r.model,
        r.registration_number,
        r.owner_name,
        r.phone,
        r.site,
        r.equipmentCategory?.name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }, [rows, q]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Түрээсийн техник</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Түрээслэх боломжтой төхөөрөмжүүд — зөвхөн харах / холбогдох
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input.Search
            allowClear
            placeholder="Хайх…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 240 }}
          />
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Шинэчлэх
          </Button>
        </div>
      </div>

      {loading && !rows.length ? (
        <div className="flex justify-center py-24">
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty description="Түрээслэх боломжтой техник байхгүй" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const cover = equipmentCoverUrl(item);
            const status = (item.status || 'available') as EquipmentStatus;
            const imgCount = item.images?.length ?? 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/admin/data/technique/${item.id}`)}
                className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] bg-muted">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={item.name}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ToolOutlined style={{ fontSize: 40 }} />
                    </div>
                  )}
                  {imgCount > 1 ? (
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-xs text-white">
                      {imgCount} зураг
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{item.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[item.model, item.registration_number].filter(Boolean).join(' · ') ||
                          '—'}
                      </div>
                    </div>
                    <Tag color={EQUIPMENT_STATUS_COLORS[status] || 'default'}>
                      {EQUIPMENT_STATUS_LABELS[status] || item.status || '—'}
                    </Tag>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium text-primary">
                      {money(Number(item.default_daily_rate))}
                      <span className="font-normal text-muted-foreground"> /өдөр</span>
                    </span>
                    {item.owner_name ? (
                      <span className="text-muted-foreground">{item.owner_name}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pt-1 text-sm">
                    {item.phone ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <PhoneOutlined />
                        {item.phone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Утас байхгүй</span>
                    )}
                    <span className="inline-flex items-center gap-1 text-primary">
                      <EyeOutlined />
                      Дэлгэрэнгүй
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
