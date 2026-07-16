'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Tag,
  message,
  Spin,
  Empty,
} from '@/components/admin/primitives';
import {
  ArrowLeftOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@/components/admin/icons';
import {
  EQUIPMENT_API,
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  equipmentAllImageUrls,
  type EquipmentItem,
  type EquipmentStatus,
} from '@/lib/equipment';

function money(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `₮${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === '') return null;
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 border-b border-border/60 py-2 text-sm last:border-0">
      <div className="text-muted-foreground">{label}</div>
      <div>{value}</div>
    </div>
  );
}

export default function RentableTechniqueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [item, setItem] = useState<EquipmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${EQUIPMENT_API}/marketplace/${id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Олдсонгүй');
        const data = json.data as EquipmentItem;
        if (!cancelled) {
          setItem(data);
          document.title = data.name || 'Техник';
        }
      } catch (err) {
        if (!cancelled) {
          message.error(err instanceof Error ? err.message : 'Алдаа');
          setItem(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin/data/technique')}
          className="mb-4"
        >
          Буцах
        </Button>
        <Empty description="Олдсонгүй" />
      </div>
    );
  }

  const images = equipmentAllImageUrls(item);
  const status = (item.status || 'available') as EquipmentStatus;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/admin/data/technique')}
      >
        Буцах
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-border bg-muted aspect-[16/11]">
            {images.length ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[Math.min(activeImg, images.length - 1)]}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Зураг байхгүй
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border ${
                    i === activeImg ? 'border-primary ring-1 ring-primary' : 'border-border'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold">{item.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {[item.equipmentCategory?.name, item.model, item.registration_number]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </p>
            </div>
            <Tag color={EQUIPMENT_STATUS_COLORS[status] || 'default'}>
              {EQUIPMENT_STATUS_LABELS[status] || item.status || '—'}
            </Tag>
          </div>

          <div className="mt-4 text-2xl font-semibold text-primary">
            {money(Number(item.default_daily_rate))}
            <span className="ml-1 text-sm font-normal text-muted-foreground">/өдөр</span>
          </div>

          <div className="mt-4 space-y-0">
            <Row label="Эзэмшигч" value={item.owner_name} />
            <Row
              label="Утас"
              value={
                item.phone ? (
                  <a className="inline-flex items-center gap-1 text-primary" href={`tel:${item.phone}`}>
                    <PhoneOutlined />
                    {item.phone}
                  </a>
                ) : null
              }
            />
            <Row
              label="Байршил"
              value={
                item.site ? (
                  <span className="inline-flex items-center gap-1">
                    <EnvironmentOutlined />
                    {item.site}
                  </span>
                ) : null
              }
            />
            <Row label="Он" value={item.year_manufactured} />
            <Row label="Мото цаг" value={item.motor_hours != null ? String(item.motor_hours) : null} />
            <Row label="Сериал" value={item.serial_number} />
            <Row label="Тэмдэглэл" value={item.notes} />
          </div>

          {item.phone ? (
            <a
              href={`tel:${item.phone}`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <PhoneOutlined />
              Холбогдох
            </a>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
              Холбоо барих утас бүртгэгдээгүй
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
