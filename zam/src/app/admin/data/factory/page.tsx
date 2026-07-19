'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button, Input, Tag, message } from '@/components/admin/primitives';
import { MailOutlined, PhoneOutlined, ReloadOutlined } from '@/components/admin/icons';
import {
  fetchPublicFactories,
  PLANT_TYPE_LABELS,
  type PublicFactory,
} from '@/lib/factories';
import type { FactoryMapSite } from '@/components/admin/data/factory/factoryMapShared';

const FactoryMap = dynamic(
  () => import('@/components/admin/data/factory/FactoryMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] flex-1 items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Газрын зураг ачаалж байна…
      </div>
    ),
  },
);

function toMapSite(f: PublicFactory): FactoryMapSite {
  return {
    id: f.id,
    name: f.name,
    plant_type: f.plant_type || 'other',
    latitude: f.latitude,
    longitude: f.longitude,
    aimag: f.province,
    location: f.location,
    status: f.status,
  };
}

export default function FactoryCatalogPage() {
  const [rows, setRows] = useState<PublicFactory[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focus, setFocus] = useState<[number, number] | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchPublicFactories();
      setRows(list);
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Үйлдвэр';
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [
        r.name,
        r.owner_name,
        r.phone,
        r.email,
        r.province,
        r.location,
        r.description,
        r.plant_type,
        PLANT_TYPE_LABELS[r.plant_type || ''],
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }, [rows, q]);

  const sites = useMemo(() => filtered.map(toMapSite), [filtered]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) || null,
    [rows, selectedId]
  );

  const selectFactory = (f: PublicFactory | FactoryMapSite) => {
    setSelectedId(f.id);
    const lat = Number(f.latitude);
    const lng = Number(f.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setFocus([lat, lng]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[560px] flex-col gap-0 md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-border md:w-[360px] md:border-b-0 md:border-r">
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Баталгаажсан үйлдвэрүүд — газрын зураг + холбоо барих.
              </p>
            </div>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={load}
              loading={loading}
            />
          </div>
          <Input
            allowClear
            placeholder="Хайх…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && rows.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">Ачаалж байна…</p>
          ) : null}
          {!loading && filtered.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              Одоогоор баталгаажсан үйлдвэр байхгүй.
            </p>
          ) : null}
          {filtered.map((f) => {
            const active = selectedId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => selectFactory(f)}
                className={`mb-1 w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-transparent hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 font-medium leading-snug">{f.name}</div>
                  <Tag className="shrink-0">
                    {PLANT_TYPE_LABELS[f.plant_type || ''] || f.plant_type || '—'}
                  </Tag>
                </div>
                {f.company_name ? (
                  <div className="mt-0.5 text-xs text-muted-foreground">{f.company_name}</div>
                ) : null}
                <div className="mt-1 text-xs text-muted-foreground">
                  {[f.province, f.location].filter(Boolean).join(' · ') || 'Байршил тодорхойгүй'}
                </div>
                {f.phone ? (
                  <div className="mt-1 text-xs text-muted-foreground">{f.phone}</div>
                ) : null}
              </button>
            );
          })}
        </div>

        {selected ? (
          <div className="space-y-2 border-t border-border p-4 text-sm">
            <div className="font-medium">{selected.name}</div>
            {selected.company_name ? (
              <div className="text-xs text-muted-foreground">{selected.company_name}</div>
            ) : null}
            {selected.description ? (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {selected.description}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {selected.phone ? (
                <a href={`tel:${selected.phone}`}>
                  <Button size="small" icon={<PhoneOutlined />}>
                    {selected.phone}
                  </Button>
                </a>
              ) : null}
              {selected.email ? (
                <a href={`mailto:${selected.email}`}>
                  <Button size="small" icon={<MailOutlined />}>
                    Имэйл
                  </Button>
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </aside>

      <div className="relative min-h-[420px] flex-1">
        <FactoryMap
          sites={sites}
          selectedId={selectedId}
          placing={false}
          editPin={null}
          focus={focus}
          onSelectSite={selectFactory}
          onMapClick={() => {}}
          onEditDrag={() => {}}
        />
      </div>
    </div>
  );
}
