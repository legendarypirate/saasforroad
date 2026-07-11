'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@/components/admin/icons';
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  Modal,
  Select,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  NOTIF_AUDIENCES,
  NOTIF_PRIORITIES,
  NOTIF_STATUSES,
  formatNotifDate,
  notifAudienceLabel,
  notifPriorityMeta,
  notifStatusMeta,
  notificationApi,
  type NotificationRecord,
  type NotificationStats,
} from '@/lib/notification';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || '';

type ProjectOpt = { id: number; name: string };

type FormState = {
  title: string;
  description: string;
  status: string;
  audience: string;
  priority: string;
  project_id: string;
  expires_at: string;
};

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  status: 'draft',
  audience: 'all',
  priority: 'normal',
  project_id: '',
  expires_at: '',
});

export default function NotificationPage() {
  const [rows, setRows] = useState<NotificationRecord[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const isFiltering = Boolean(q || filterStatus || filterAudience || filterPriority);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, st] = await Promise.all([
        notificationApi.list({
          q: q || undefined,
          status: filterStatus || undefined,
          audience: filterAudience || undefined,
          priority: filterPriority || undefined,
        }),
        notificationApi.stats(),
      ]);
      setRows(list);
      setStats(st);
    } catch {
      message.error('Мэдэгдэл татаж чадсангүй');
    } finally {
      setLoading(false);
    }
  }, [q, filterStatus, filterAudience, filterPriority]);

  useEffect(() => {
    document.title = 'Мэдэгдэл';
    fetch(`${API}/api/project`)
      .then((r) => r.json())
      .then((j) => {
        const data = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
        setProjects(data.map((p: ProjectOpt) => ({ id: p.id, name: p.name })));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: String(p.id), label: p.name })),
    [projects],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (record: NotificationRecord) => {
    setEditing(record);
    setForm({
      title: record.title || '',
      description: record.description || '',
      status: record.status || 'draft',
      audience: record.audience || 'all',
      priority: record.priority || 'normal',
      project_id: record.project_id ? String(record.project_id) : '',
      expires_at: record.expires_at ? String(record.expires_at).slice(0, 10) : '',
    });
    setDrawerOpen(true);
  };

  const save = async (publishNow = false) => {
    if (!form.title.trim()) {
      message.warning('Гарчиг оруулна уу');
      return;
    }
    if (form.audience === 'project' && !form.project_id) {
      message.warning('Төсөл сонгоно уу');
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: publishNow ? 'published' : form.status,
        audience: form.audience,
        priority: form.priority,
        project_id: form.project_id || null,
        expires_at: form.expires_at || null,
      };

      const res = editing
        ? await notificationApi.update(editing.id, body)
        : await notificationApi.create(body);

      if (!res.success) {
        message.error(res.message || 'Хадгалахад алдаа гарлаа');
        return;
      }
      message.success(publishNow ? 'Нийтлэгдлээ' : 'Амжилттай хадгалагдлаа');
      setDrawerOpen(false);
      setEditing(null);
      setForm(emptyForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const publish = async (record: NotificationRecord) => {
    const res = await notificationApi.publish(record.id);
    if (!res.success) {
      message.error(res.message || 'Нийтлэхэд алдаа гарлаа');
      return;
    }
    message.success('Нийтлэгдлээ');
    load();
  };

  const archive = async (record: NotificationRecord) => {
    const res = await notificationApi.archive(record.id);
    if (!res.success) {
      message.error(res.message || 'Архивлахад алдаа гарлаа');
      return;
    }
    message.success('Архивлагдлаа');
    load();
  };

  const remove = (record: NotificationRecord) => {
    Modal.confirm({
      title: `"${record.title}" устгах уу?`,
      okText: 'Устгах',
      cancelText: 'Болих',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await notificationApi.remove(record.id);
        if (!res.success) {
          message.error(res.message || 'Устгахад алдаа гарлаа');
          return;
        }
        message.success('Устгагдлаа');
        load();
      },
    });
  };

  const columns: ColumnsType<NotificationRecord> = [
    {
      title: 'Гарчиг',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <div className="min-w-[180px]">
          <div className="font-medium text-foreground">{title}</div>
          {record.description && (
            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const meta = notifStatusMeta(status);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Зорилтот',
      dataIndex: 'audience',
      key: 'audience',
      width: 110,
      render: (v: string) => notifAudienceLabel(v),
    },
    {
      title: 'Чухал',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (v: string) => {
        const meta = notifPriorityMeta(v);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Төсөл',
      key: 'project',
      width: 140,
      render: (_: unknown, r) => r.project?.name || '—',
    },
    {
      title: 'Нийтэлсэн',
      dataIndex: 'published_at',
      key: 'published_at',
      width: 150,
      render: (v: string) => formatNotifDate(v),
    },
    {
      title: 'Үүсгэсэн',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => formatNotifDate(v),
    },
    {
      title: 'Үйлдэл',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: unknown, record) => (
        <div className="flex flex-wrap gap-1">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Засах
          </Button>
          {record.status !== 'published' && (
            <Button type="link" size="small" onClick={() => publish(record)}>
              Нийтлэх
            </Button>
          )}
          {record.status !== 'archived' && (
            <Button type="link" size="small" onClick={() => archive(record)}>
              Архив
            </Button>
          )}
          <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(record)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Мэдэгдэл</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Системийн зарлал, мэдэгдэл — ноорог, нийтлэх, архивлах
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Шинэ мэдэгдэл
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Нийт', value: stats.total },
            { label: 'Ноорог', value: stats.draft },
            { label: 'Нийтэлсэн', value: stats.published },
            { label: 'Архив', value: stats.archived },
            {
              label: 'Яаралтай',
              value: stats.urgent,
              warn: stats.urgent > 0,
              onClick: () => setFilterPriority('urgent'),
            },
          ].map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className={cn(
                'rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors',
                card.onClick && 'hover:border-primary/40 hover:bg-muted/40',
                card.warn && 'border-destructive/40 bg-destructive/5',
              )}
            >
              <div className="text-xs text-muted-foreground">{card.label}</div>
              <div
                className={cn(
                  'mt-1 text-2xl font-semibold tabular-nums',
                  card.warn && 'text-destructive',
                )}
              >
                {card.value}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card p-3">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Гарчиг, агуулга…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <Select
          allowClear
          placeholder="Төлөв"
          value={filterStatus || undefined}
          onChange={(v) => setFilterStatus(v || '')}
          options={NOTIF_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          className="w-[140px] shrink-0"
        />
        <Select
          allowClear
          placeholder="Зорилтот"
          value={filterAudience || undefined}
          onChange={(v) => setFilterAudience(v || '')}
          options={NOTIF_AUDIENCES.map((a) => ({ value: a.value, label: a.label }))}
          className="w-[140px] shrink-0"
        />
        <Select
          allowClear
          placeholder="Чухал"
          value={filterPriority || undefined}
          onChange={(v) => setFilterPriority(v || '')}
          options={NOTIF_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
          className="w-[130px] shrink-0"
        />
        {isFiltering && (
          <Button
            className="shrink-0"
            onClick={() => {
              setQ('');
              setFilterStatus('');
              setFilterAudience('');
              setFilterPriority('');
            }}
          >
            Цэвэрлэх
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
        />
      </div>

      <Drawer
        title={editing ? 'Мэдэгдэл засах' : 'Шинэ мэдэгдэл'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={460}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDrawerOpen(false)}>Болих</Button>
            <Button loading={saving} onClick={() => save(false)}>
              Хадгалах
            </Button>
            <Button type="primary" loading={saving} onClick={() => save(true)}>
              Нийтлэх
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Гарчиг *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Жишээ: Замын хаалт — УБ–Дархан"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Агуулга *</label>
            <Input.TextArea
              rows={5}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Мэдэгдлийн дэлгэрэнгүй…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Төлөв</label>
              <Select
                className="w-full"
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                options={NOTIF_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Чухал байдал</label>
              <Select
                className="w-full"
                value={form.priority}
                onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                options={NOTIF_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Зорилтот бүлэг</label>
            <Select
              className="w-full"
              value={form.audience}
              onChange={(v) => setForm((f) => ({ ...f, audience: v }))}
              options={NOTIF_AUDIENCES.map((a) => ({ value: a.value, label: a.label }))}
            />
          </div>
          {form.audience === 'project' && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Төсөл *</label>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                className="w-full"
                placeholder="Төсөл сонгох"
                value={form.project_id || undefined}
                onChange={(v) => setForm((f) => ({ ...f, project_id: v || '' }))}
                options={projectOptions}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Дуусах огноо</label>
            <DatePicker
              className="w-full"
              value={form.expires_at || undefined}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  expires_at: v ? (typeof v === 'string' ? v : v.format('YYYY-MM-DD')) : '',
                }))
              }
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
