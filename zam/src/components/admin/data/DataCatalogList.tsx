'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Input, Tag, message } from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { ReloadOutlined, MailOutlined, PhoneOutlined } from '@/components/admin/icons';
import {
  DATA_CATALOG_LABELS,
  fetchDataCatalog,
  type DataCatalogEntry,
  type DataCatalogKind,
} from '@/lib/dataCatalog';

type Props = {
  kind: DataCatalogKind;
};

export default function DataCatalogList({ kind }: Props) {
  const title = DATA_CATALOG_LABELS[kind];
  const [rows, setRows] = useState<DataCatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchDataCatalog(kind);
      setRows(list);
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = title;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.name, r.contact_name, r.phone, r.email, r.province, r.location, r.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }, [rows, q]);

  const columns: ColumnsType<DataCatalogEntry> = [
    {
      title: 'Нэр',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, r) => (
        <div>
          <div className="font-medium">{v}</div>
          {r.description ? (
            <div className="text-xs text-muted-foreground line-clamp-2">{r.description}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Холбоо барих',
      dataIndex: 'contact_name',
      key: 'contact',
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Байршил',
      key: 'loc',
      render: (_: unknown, r) =>
        [r.province, r.location].filter(Boolean).join(' · ') || '—',
    },
    {
      title: 'Холбогдох',
      key: 'actions',
      width: 220,
      render: (_: unknown, r) => (
        <div className="flex flex-wrap gap-2">
          {r.phone ? (
            <a href={`tel:${r.phone}`}>
              <Button size="small" icon={<PhoneOutlined />}>
                {r.phone}
              </Button>
            </a>
          ) : null}
          {r.email ? (
            <a href={`mailto:${r.email}`}>
              <Button size="small" icon={<MailOutlined />}>
                Имэйл
              </Button>
            </a>
          ) : null}
          {!r.phone && !r.email ? <span className="text-xs text-muted-foreground">—</span> : null}
        </div>
      ),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag>,
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Платформын дата — зөвхөн харах / холбогдох. Шинээр бүртгэх боломжгүй.
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Шинэчлэх
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          allowClear
          placeholder="Хайх…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: 'Одоогоор бүртгэл байхгүй' }}
      />
    </div>
  );
}
