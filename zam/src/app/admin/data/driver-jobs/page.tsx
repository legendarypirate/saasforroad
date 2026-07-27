'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { AdminCrudActions } from '@/components/admin/AdminCrudActions';
import { AdminListToolbar } from '@/components/admin/AdminListToolbar';
import { RActionButton, REmpty, RTableActions } from '@/components/r';
import { Send, Ban, Truck } from 'lucide-react';
import { fetchProjects, type ProjectRecord } from '@/lib/project';
import { formatMoneyTyping } from '@/lib/money';
import {
  OPENING_STATUS_COLORS,
  OPENING_STATUS_LABELS,
  driverJobsApi,
  type DriverJobOpening,
  type DriverJobStatus,
} from '@/lib/driverJobs';

function formatSalaryNote(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const withoutSep = trimmed.replace(/,/g, '');
  if (!/^\d+$/.test(withoutSep)) return raw;
  return formatMoneyTyping(withoutSep, 0);
}

const POSITION_OPTIONS = [
  { value: 'driver', label: 'Жолооч' },
  { value: 'operator', label: 'Оператор' },
  { value: 'mechanic', label: 'Механик' },
  { value: 'helper', label: 'Туслах' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Бүх төлөв' },
  { value: 'draft', label: 'Ноорог' },
  { value: 'pending', label: 'Хяналтад' },
  { value: 'approved', label: 'Батлагдсан' },
  { value: 'rejected', label: 'Татгалзсан' },
  { value: 'closed', label: 'Хаалттай' },
];

export default function DriverJobsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<DriverJobOpening[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DriverJobOpening | null>(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ads, projs] = await Promise.all([
        driverJobsApi.openings(),
        fetchProjects(),
      ]);
      setRows(ads);
      setProjects(Array.isArray(projs) ? projs : []);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Жолоочийн зар';
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!needle) return true;
      return [
        row.title,
        row.project_name,
        row.province,
        row.location,
        row.salary_note,
        row.position_type,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [rows, q, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      position_type: 'driver',
      headcount: 1,
      submit: false,
    });
    setOpen(true);
  };

  const openEdit = (row: DriverJobOpening) => {
    setEditing(row);
    form.setFieldsValue({
      title: row.title,
      description: row.description,
      project_id: row.project_id,
      position_type: row.position_type,
      province: row.province,
      location: row.location,
      salary_note: row.salary_note
        ? formatSalaryNote(String(row.salary_note))
        : row.salary_note,
      requirements: row.requirements,
      headcount: row.headcount,
      closes_at: row.closes_at,
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await driverJobsApi.updateOpening(editing.id, values);
        message.success('Шинэчлэгдлээ');
      } else {
        await driverJobsApi.createOpening(values);
        message.success(
          values.submit ? 'Админд илгээлээ' : 'Ноорог хадгалагдлаа',
        );
      }
      setOpen(false);
      load();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(err instanceof Error ? err.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: DriverJobOpening) => {
    try {
      await driverJobsApi.deleteOpening(row.id);
      message.success('Устгалаа');
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<DriverJobOpening> = [
    { title: '№', key: 'index', width: 56, render: (_v, _r, i) => i + 1 },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 148,
      render: (_, row) => {
        if (['draft', 'rejected'].includes(row.status)) {
          return (
            <AdminCrudActions
              onEdit={() => openEdit(row)}
              onDelete={() => remove(row)}
            >
              <RActionButton
                icon={<Send />}
                label="Админд илгээх"
                tone="success"
                onClick={async () => {
                  try {
                    await driverJobsApi.submitOpening(row.id);
                    message.success('Админд илгээлээ');
                    load();
                  } catch (err) {
                    message.error(
                      err instanceof Error ? err.message : 'Алдаа',
                    );
                  }
                }}
              />
            </AdminCrudActions>
          );
        }
        if (row.status === 'approved') {
          return (
            <RTableActions>
              <RActionButton
                icon={<Ban />}
                label="Хаах"
                tone="danger"
                onClick={async () => {
                  try {
                    await driverJobsApi.closeOpening(row.id);
                    message.success('Хаагдлаа');
                    load();
                  } catch (err) {
                    message.error(
                      err instanceof Error ? err.message : 'Алдаа',
                    );
                  }
                }}
              />
            </RTableActions>
          );
        }
        return null;
      },
    },
    {
      title: 'Гарчиг',
      dataIndex: 'title',
      render: (v, row) => (
        <div>
          <button
            type="button"
            className="text-left font-medium text-primary hover:underline disabled:cursor-default disabled:no-underline disabled:text-foreground"
            disabled={!['draft', 'rejected'].includes(row.status)}
            onClick={() => openEdit(row)}
          >
            {v}
          </button>
          {row.project_name ? (
            <div className="text-xs text-muted-foreground">{row.project_name}</div>
          ) : null}
          {row.status === 'rejected' && row.admin_note ? (
            <div className="mt-0.5 text-xs text-destructive line-clamp-1">
              {row.admin_note}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Албан тушаал',
      dataIndex: 'position_type',
      width: 120,
      render: (v) =>
        POSITION_OPTIONS.find((p) => p.value === v)?.label || v || '—',
    },
    {
      title: 'Байршил',
      key: 'location',
      render: (_, row) =>
        [row.province, row.location].filter(Boolean).join(' · ') || '—',
    },
    {
      title: 'Цалин',
      dataIndex: 'salary_note',
      width: 140,
      render: (v) => v || '—',
    },
    {
      title: 'Орон тоо',
      dataIndex: 'headcount',
      width: 90,
      align: 'right',
      render: (v) => v ?? 1,
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 120,
      render: (v: DriverJobStatus) => (
        <Tag color={OPENING_STATUS_COLORS[v] || 'default'}>
          {OPENING_STATUS_LABELS[v] || v}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <AdminListToolbar
        description="Freelancer апп-д харагдах зар — платформ админ баталгаажуулна"
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder="Гарчиг, байршил, цалин…"
        onReload={load}
        onCreate={openCreate}
        createLabel="Зар нэмэх"
        filters={
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTER_OPTIONS}
            className="w-40"
          />
        }
        actions={
          <Button
            onClick={() =>
              router.push('/admin/data/driver-jobs/applications')
            }
          >
            Хүсэлтүүд
          </Button>
        }
      />

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        empty={
          <REmpty
            iconType={Truck}
            title="Зар олдсонгүй"
            description="Шинэ зар нэмээд админд илгээнэ үү."
          />
        }
      />

      <Drawer
        title={editing ? 'Зар засах' : 'Шинэ зар'}
        description="Баталгаажсан зар Freelancer апп-д харагдана."
        open={open}
        onClose={() => setOpen(false)}
        width={560}
        destroyOnClose
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Болих</Button>
            <Button type="primary" loading={saving} onClick={save}>
              {editing ? 'Хадгалах' : 'Үүсгэх'}
            </Button>
          </>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Гарчиг"
            rules={[{ required: true, message: 'Гарчиг оруулна уу' }]}
          >
            <Input placeholder="Жишээ: Ачааны жолооч" />
          </Form.Item>
          <Form.Item name="project_id" label="Төсөл (заавал биш)">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Сонгох"
              options={projects.map((p) => ({
                value: p.id,
                label: p.name || p.road_name || `#${p.id}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="position_type" label="Албан тушаал">
            <Select options={POSITION_OPTIONS} />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="requirements" label="Шаардлага">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="province" label="Аймаг / хот">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="Байршил">
            <Input />
          </Form.Item>
          <Form.Item name="salary_note" label="Цалин / нөхцөл">
            <Input
              inputMode="decimal"
              placeholder="3,500,000"
              onChange={(e) => {
                form.setFieldValue(
                  'salary_note',
                  formatSalaryNote(e.target.value),
                );
              }}
            />
          </Form.Item>
          <Form.Item name="headcount" label="Орон тоо">
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item name="closes_at" label="Дуусах огноо">
            <Input type="date" />
          </Form.Item>
          {!editing ? (
            <Form.Item
              name="submit"
              label="Админд илгээх"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          ) : null}
        </Form>
      </Drawer>
    </div>
  );
}
