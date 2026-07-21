'use client';

import { resolveAssetUrl } from '@/lib/assetUrl';

import React, { useEffect, useMemo, useState } from 'react';
import { Table, Input, Button, Tag, message, Upload } from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { UploadOutlined } from '@/components/admin/icons';

interface ActionRow {
  id: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  document_url?: string;
  createdAt: string;
  user?: {
    username?: string;
    phone?: string;
    email?: string;
  };
}

export default function ActionPage() {
  const [rows, setRows] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (username.trim()) p.set('username', username.trim());
    if (phone.trim()) p.set('phone', phone.trim());
    if (email.trim()) p.set('email', email.trim());
    return p.toString();
  }, [username, phone, email]);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/action${query ? `?${query}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setRows(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Арга хэмжээ';
    fetchActions();
  }, []);

  const uploadDocument = async (actionId: number, file: File) => {
    const body = new FormData();
    body.append('file', file);
    setUploadingId(actionId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action/${actionId}/upload-document`, {
        method: 'POST',
        body,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Upload failed');
      message.success('Баримт амжилттай хавсаргалаа');
      fetchActions();
    } catch (err) {
      console.error(err);
      message.error('Баримт хавсаргахад алдаа гарлаа');
    } finally {
      setUploadingId(null);
    }
  };

  const columns: ColumnsType<ActionRow> = [
    { title: 'Гарчиг', dataIndex: 'title' },
    { title: 'Тайлбар', dataIndex: 'description', render: (v) => v || '—' },
    { title: 'Нэр', render: (_, r) => r.user?.username || '—' },
    { title: 'Утас', render: (_, r) => r.user?.phone || '—' },
    { title: 'И-мэйл', render: (_, r) => r.user?.email || '—' },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (v) => <Tag color={v === 'done' ? 'green' : 'blue'}>{v || 'open'}</Tag>,
    },
    {
      title: 'Баримт',
      render: (_, r) =>
        r.document_url ? (
          <a href={resolveAssetUrl(r.document_url)} target="_blank" rel="noreferrer">
            Үзэх
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: 'Үйлдэл',
      key: 'action',
      render: (_, r) => (
        <Upload
          showUploadList={false}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          beforeUpload={(file) => {
            uploadDocument(r.id, file);
            return false;
          }}
        >
          <Button size="small" icon={<UploadOutlined />} loading={uploadingId === r.id}>
            Баримт хавсаргах
          </Button>
        </Upload>
      ),
    },
    { title: 'Огноо', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString() },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Input className="w-48" placeholder="Нэр" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input className="w-48" placeholder="Утас" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input className="w-56" placeholder="И-мэйл" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="primary" onClick={fetchActions}>Шүүх</Button>
        <Button onClick={() => { setUsername(''); setPhone(''); setEmail(''); setTimeout(fetchActions, 0); }}>Цэвэрлэх</Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} />
    </div>
  );
}
