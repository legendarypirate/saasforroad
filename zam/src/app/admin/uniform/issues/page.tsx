'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Drawer,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import { createUniformRecord, deleteUniformRecord, fetchUniformList } from '@/lib/uniform';

type Line = { item_id?: number; size: string; qty: number };

export default function UniformIssuesPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ size: '', qty: 1 }]);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [issues, usersRes, projectsRes, itemList] = await Promise.all([
        fetchUniformList<Record<string, unknown>>('issues'),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`).then((r) => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`).then((r) => r.json()),
        fetchUniformList<Record<string, unknown>>('items'),
      ]);
      setRows(issues);
      const userList = usersRes.success
        ? Array.isArray(usersRes.data)
          ? usersRes.data
          : usersRes.data?.rows || []
        : [];
      setUsers(userList);
      setProjects(projectsRes.success ? projectsRes.data : []);
      setItems(itemList.filter((i) => i.is_active !== false));
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Олголтын бүртгэл';
    load();
  }, [load]);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ issue_date: dayjs() });
    setLines([{ size: '', qty: 1 }]);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const validLines = lines.filter((l) => l.item_id && l.qty > 0);
      if (!validLines.length) {
        message.error('Дор хаяж нэг бараа нэмнэ үү');
        return;
      }
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      await createUniformRecord('issues', {
        ...values,
        issue_date: dayjs(values.issue_date).format('YYYY-MM-DD'),
        issued_by: user?.id,
        created_by: user?.id,
        lines: validLines,
      });
      message.success('Олголт бүртгэгдлээ');
      setOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<Record<string, unknown>> = [
    { title: 'Дугаар', dataIndex: 'number', width: 130 },
    { title: 'Огноо', dataIndex: 'issue_date', width: 110 },
    {
      title: 'Ажилтан',
      render: (_, r) => (r.receiver as { username?: string })?.username || '—',
    },
    {
      title: 'Төсөл',
      render: (_, r) => (r.project as { name?: string })?.name || '—',
    },
    {
      title: 'Бараа',
      render: (_, r) => {
        const ls = (r.lines as Array<{ item?: { name?: string }; size?: string; qty?: number }>) || [];
        return ls.map((l) => `${l.item?.name || '?'}${l.size ? ` (${l.size})` : ''} ×${l.qty}`).join(', ') || '—';
      },
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (v: string) => {
        const map: Record<string, string> = {
          issued: 'Олгосон',
          partial_returned: 'Хэсэг буцаасан',
          returned: 'Бүрэн буцаасан',
          cancelled: 'Цуцлагдсан',
        };
        return <Tag color={v === 'returned' ? 'green' : 'blue'}>{map[v] || v}</Tag>;
      },
    },
    {
      title: 'Олгосон',
      render: (_, r) => (r.issuer as { username?: string })?.username || '—',
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <h2 style={{ margin: 0 }}>Олголтын бүртгэл</h2>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Олголт нэмэх
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          ...columns,
          {
            title: 'Үйлдэл',
            render: (_, row) => (
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  Modal.confirm({
                    title: 'Устгах уу? Үлдэгдэл буцаана.',
                    onOk: async () => {
                      await deleteUniformRecord('issues', Number(row.id));
                      message.success('Устгагдлаа');
                      load();
                    },
                  })
                }
              />
            ),
          },
        ]}
        pagination={{ pageSize: 15 }}
        scroll={{ x: 1000 }}
      />

      <Drawer
        title="Шинэ олголт"
        open={open}
        onClose={() => setOpen(false)}
        width={640}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Болих</Button>
            <Button type="primary" onClick={handleSave}>
              Хадгалах
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="issue_date" label="Огноо" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="user_id" label="Ажилтан (хэн авсан)" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={users.map((u) => ({ value: u.id, label: u.username }))}
              />
            </Form.Item>
            <Form.Item name="project_id" label="Төсөл">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Form.Item>
            <Form.Item name="notes" label="Тэмдэглэл" style={{ gridColumn: '1 / -1' }}>
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>
        </Form>

        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>Ямар хувцас / хэрэгсэл</strong>
            <Button size="small" icon={<PlusOutlined />} onClick={() => setLines((p) => [...p, { size: '', qty: 1 }])}>
              Мөр нэмэх
            </Button>
          </div>
          {lines.map((line, idx) => (
            <div
              key={idx}
              style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px 32px', gap: 8, marginBottom: 8 }}
            >
              <Select
                placeholder="Бараа"
                showSearch
                optionFilterProp="label"
                value={line.item_id}
                options={items.map((i) => ({
                  value: Number(i.id),
                  label: `${i.name} (үлд: ${i.stock_qty})`,
                }))}
                onChange={(v) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], item_id: Number(v) };
                  setLines(next);
                }}
              />
              <Input
                placeholder="Хэмжээ"
                value={line.size}
                onChange={(e) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], size: e.target.value };
                  setLines(next);
                }}
              />
              <InputNumber
                min={1}
                value={line.qty}
                onChange={(v) => {
                  const next = [...lines];
                  next[idx] = { ...next[idx], qty: Number(v) || 1 };
                  setLines(next);
                }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={lines.length <= 1}
                onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}
              />
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
