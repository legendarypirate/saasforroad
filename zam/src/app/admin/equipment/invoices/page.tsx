'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Popconfirm,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { RPageToolbar, RSearch } from '@/components/r';
import { tenantHeaders } from '@/lib/tenant';

const API = `${process.env.NEXT_PUBLIC_API_URL}/api/assist/admin/invoices`;

type AssistInvoice = {
  id: number;
  invoice_number: string;
  plate_number?: string | null;
  equipment_name?: string | null;
  service_name?: string | null;
  driver_name?: string | null;
  service_man_name?: string | null;
  amount: number | string;
  currency: string;
  status: 'unpaid' | 'paid' | 'cancelled' | string;
  paid_at?: string | null;
  createdAt?: string;
  call?: {
    id: number;
    request_code?: string;
    completed_at?: string | null;
    driver_rating?: number | null;
  } | null;
};

function authHeaders() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return tenantHeaders(token ? { Authorization: token } : undefined);
}

function formatMoney(amount: number | string, currency = 'MNT') {
  const n = Number(amount) || 0;
  return `${n.toLocaleString('mn-MN')} ${currency}`;
}

export default function EquipmentInvoicesPage() {
  const [rows, setRows] = useState<AssistInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [payingId, setPayingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (status) params.set('status', status);
      const res = await fetch(`${API}?${params}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setRows(json.data || []);
      else message.error(json.message || 'Алдаа');
    } catch {
      message.error('Нэхэмжлэх татахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    document.title = 'Техник — Нэхэмжлэх';
    load();
  }, [load]);

  const markPaid = async (id: number) => {
    setPayingId(id);
    try {
      const res = await fetch(`${API}/${id}/mark-paid`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!json.success) {
        message.error(json.message || 'Алдаа');
        return;
      }
      message.success('Төлсөн гэж тэмдэглэлээ');
      await load();
    } catch {
      message.error('Төлбөр тэмдэглэхэд алдаа');
    } finally {
      setPayingId(null);
    }
  };

  const columns: ColumnsType<AssistInvoice> = [
    {
      title: 'Дугаар',
      dataIndex: 'invoice_number',
      width: 160,
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          {row.call?.request_code ? (
            <div style={{ fontSize: 12, opacity: 0.65 }}>{row.call.request_code}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Техник',
      key: 'equipment',
      render: (_, row) => (
        <div>
          <div>{row.equipment_name || '—'}</div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>{row.plate_number || ''}</div>
        </div>
      ),
    },
    {
      title: 'Үйлчилгээ',
      dataIndex: 'service_name',
      render: (v) => v || '—',
    },
    {
      title: 'Жолооч / Ажилтан',
      key: 'people',
      render: (_, row) => (
        <div style={{ fontSize: 13 }}>
          <div>{row.driver_name || '—'}</div>
          <div style={{ opacity: 0.65 }}>{row.service_man_name || ''}</div>
        </div>
      ),
    },
    {
      title: 'Дүн',
      dataIndex: 'amount',
      width: 140,
      render: (v, row) => formatMoney(v, row.currency),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 120,
      render: (s: string) => {
        const color =
          s === 'paid' ? 'green' : s === 'cancelled' ? 'default' : 'orange';
        const label =
          s === 'paid' ? 'Төлсөн' : s === 'cancelled' ? 'Цуцлагдсан' : 'Төлөөгүй';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Огноо',
      dataIndex: 'createdAt',
      width: 120,
      render: (v?: string) =>
        v ? new Date(v).toLocaleDateString('mn-MN') : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_, row) =>
        row.status === 'unpaid' ? (
          <Popconfirm
            title="Төлсөн гэж тэмдэглэх үү?"
            onConfirm={() => markPaid(row.id)}
          >
            <Button type="primary" size="small" loading={payingId === row.id}>
              Төлсөн
            </Button>
          </Popconfirm>
        ) : row.paid_at ? (
          <span style={{ fontSize: 12, opacity: 0.65 }}>
            {new Date(row.paid_at).toLocaleDateString('mn-MN')}
          </span>
        ) : null,
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <RPageToolbar
        title="Нэхэмжлэх"
        search={
          <RSearch
            value={q}
            onChange={setQ}
            onSearch={() => load()}
            placeholder="Дугаар, улсын дугаар..."
            showButton
          />
        }
        filters={
          <>
            <Button
              type={status === undefined ? 'primary' : 'default'}
              onClick={() => setStatus(undefined)}
            >
              Бүгд
            </Button>
            <Button
              type={status === 'unpaid' ? 'primary' : 'default'}
              onClick={() => setStatus('unpaid')}
            >
              Төлөөгүй
            </Button>
            <Button
              type={status === 'paid' ? 'primary' : 'default'}
              onClick={() => setStatus('paid')}
            >
              Төлсөн
            </Button>
          </>
        }
      />
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 960 }}
      />
    </div>
  );
}
