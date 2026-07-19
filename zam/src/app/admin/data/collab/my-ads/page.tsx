'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@/components/admin/icons';
import { fetchProjects, type ProjectRecord } from '@/lib/project';
import {
  AD_STATUS_COLORS,
  AD_STATUS_LABELS,
  ROLE_LABELS,
  collabApi,
  type JobAd,
  type JobAdStatus,
} from '@/lib/collab';

export default function CollabMyAdsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<JobAd[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JobAd | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ads, projs] = await Promise.all([
        collabApi.myAds(),
        fetchProjects(),
      ]);
      setRows(ads);
      setProjects(Array.isArray(projs) ? projs : []);
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Миний зарууд';
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      role_sought: 'subcontractor',
      publish: false,
    });
    setOpen(true);
  };

  const openEdit = (row: JobAd) => {
    setEditing(row);
    form.setFieldsValue({
      title: row.title,
      description: row.description,
      project_id: row.project_id,
      role_sought: row.role_sought,
      province: row.province,
      location: row.location,
      budget_note: row.budget_note,
      starts_at: row.starts_at,
      closes_at: row.closes_at,
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await collabApi.updateAd(editing.id, values);
        message.success('Шинэчлэгдлээ');
      } else {
        await collabApi.createAd(values);
        message.success('Үүсгэлээ');
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

  const columns: ColumnsType<JobAd> = [
    {
      title: 'Гарчиг',
      dataIndex: 'title',
      render: (v, row) => (
        <button
          type="button"
          className="text-left text-primary hover:underline"
          onClick={() => openEdit(row)}
        >
          {v}
        </button>
      ),
    },
    {
      title: 'Төсөл',
      dataIndex: 'project_name',
      width: 160,
      render: (v) => v || '—',
    },
    {
      title: 'Үүрэг',
      dataIndex: 'role_sought',
      width: 140,
      render: (v, row) => row.role_label || ROLE_LABELS[v] || v,
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 110,
      render: (s: JobAdStatus) => (
        <Tag color={AD_STATUS_COLORS[s]}>{AD_STATUS_LABELS[s] || s}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 280,
      render: (_, row) => (
        <Space size="small" wrap>
          {row.status === 'draft' && (
            <Button
              size="small"
              type="primary"
              onClick={async () => {
                try {
                  await collabApi.publishAd(row.id);
                  message.success('Нийтэллээ');
                  load();
                } catch (e) {
                  message.error(e instanceof Error ? e.message : 'Алдаа');
                }
              }}
            >
              Нийтлэх
            </Button>
          )}
          {row.status === 'published' && (
            <Button
              size="small"
              onClick={async () => {
                try {
                  await collabApi.closeAd(row.id);
                  message.success('Хааллаа');
                  load();
                } catch (e) {
                  message.error(e instanceof Error ? e.message : 'Алдаа');
                }
              }}
            >
              Хаах
            </Button>
          )}
          <Button
            size="small"
            icon={<TeamOutlined />}
            onClick={() =>
              router.push(`/admin/data/collab/project/${row.project_id}`)
            }
          >
            Хамтрагч
          </Button>
          {row.status !== 'published' && (
            <Button
              size="small"
              danger
              onClick={async () => {
                try {
                  await collabApi.deleteAd(row.id);
                  message.success('Устгалаа');
                  load();
                } catch (e) {
                  message.error(e instanceof Error ? e.message : 'Алдаа');
                }
              }}
            >
              Устгах
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Өөрийн төсөлд туслан гүйцэтгэгч / түнш хайх зарууд
        </p>
        <Space>
          <Button onClick={() => router.push('/admin/data/collab')}>Зах зээл</Button>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Шинэчлэх
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Зар нэмэх
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        size="small"
        pagination={{ pageSize: 20 }}
      />

      <Drawer
        title={editing ? 'Зар засах' : 'Шинэ зар'}
        open={open}
        onClose={() => setOpen(false)}
        width={440}
        extra={
          <Button type="primary" loading={saving} onClick={save}>
            Хадгалах
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="project_id"
            label="Төсөл"
            rules={[{ required: true, message: 'Төсөл сонгоно уу' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={projects.map((p) => ({
                value: p.id,
                label: p.name || p.road_name || `#${p.id}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="title"
            label="Гарчиг"
            rules={[{ required: true, message: 'Гарчиг оруулна уу' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="role_sought" label="Хайж буй үүрэг">
            <Select
              options={[
                { value: 'subcontractor', label: ROLE_LABELS.subcontractor },
                { value: 'partner', label: ROLE_LABELS.partner },
                { value: 'specialist', label: ROLE_LABELS.specialist },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="province" label="Аймаг / хот">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="Байршил">
            <Input />
          </Form.Item>
          <Form.Item name="budget_note" label="Төсөв / тэмдэглэл">
            <Input />
          </Form.Item>
          {!editing && (
            <Form.Item name="publish" label="Шууд нийтлэх" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
