'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Table, Space, Input, Button, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface ActionRow {
  id: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
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
    { title: 'Огноо', dataIndex: 'createdAt', render: (v) => new Date(v).toLocaleString() },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Арга хэмжээ</h1>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input placeholder="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="primary" onClick={fetchActions}>Шүүх</Button>
        <Button onClick={() => { setUsername(''); setPhone(''); setEmail(''); setTimeout(fetchActions, 0); }}>Цэвэрлэх</Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} />
    </div>
  );
}
