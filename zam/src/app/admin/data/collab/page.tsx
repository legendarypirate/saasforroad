'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Empty,
  Input,
  Select,
  Spin,
  Tag,
  message,
} from '@/components/admin/primitives';
import { ReloadOutlined } from '@/components/admin/icons';
import {
  ROLE_LABELS,
  collabApi,
  type CollabRole,
  type JobAd,
} from '@/lib/collab';

const ROLE_OPTIONS = [
  { value: '', label: 'Бүх үүрэг' },
  { value: 'subcontractor', label: ROLE_LABELS.subcontractor },
  { value: 'partner', label: ROLE_LABELS.partner },
  { value: 'specialist', label: ROLE_LABELS.specialist },
];

export default function CollabMarketplacePage() {
  const router = useRouter();
  const [rows, setRows] = useState<JobAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [province, setProvince] = useState('');
  const [role, setRole] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await collabApi.marketplace({
        q: q.trim() || undefined,
        province: province.trim() || undefined,
        role_sought: (role as CollabRole) || undefined,
      });
      setRows(data);
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [q, province, role]);

  useEffect(() => {
    document.title = 'Хамтын ажиллагаа';
    load();
  }, [load]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Бусад байгууллагын төслийн зарууд — туслан гүйцэтгэгч / түнш / мэргэжилтэн
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input.Search
            allowClear
            placeholder="Хайх…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onSearch={() => load()}
            style={{ width: 200 }}
          />
          <Input
            allowClear
            placeholder="Аймаг / хот"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            style={{ width: 140 }}
          />
          <Select
            value={role}
            onChange={setRole}
            options={ROLE_OPTIONS}
            style={{ width: 180 }}
          />
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Шинэчлэх
          </Button>
          <Button type="default" onClick={() => router.push('/admin/data/collab/my-ads')}>
            Миний зарууд
          </Button>
        </div>
      </div>

      {loading && !rows.length ? (
        <div className="flex justify-center py-24">
          <Spin size="large" />
        </div>
      ) : rows.length === 0 ? (
        <Empty description="Нийтэлсэн зар байхгүй" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((ad) => (
            <button
              key={ad.id}
              type="button"
              onClick={() => router.push(`/admin/data/collab/${ad.id}`)}
              className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                  {ad.title}
                </h3>
                <Tag color="blue">
                  {ad.role_label || ROLE_LABELS[ad.role_sought] || ad.role_sought}
                </Tag>
              </div>
              <p className="mb-1 text-xs text-muted-foreground">
                {ad.company_name || '—'} · {ad.project_name || 'Төсөл'}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {[ad.province, ad.location].filter(Boolean).join(' · ') ||
                  'Байршил тодорхойгүй'}
              </p>
              {ad.budget_note ? (
                <p className="mt-2 text-xs text-foreground/80">{ad.budget_note}</p>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
