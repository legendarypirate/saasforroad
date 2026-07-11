'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
  DatePicker,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@/components/admin/icons';
import dayjs from 'dayjs';
import {
  ROAD_CLASSES,
  ROAD_STATUSES,
  archiveProject,
  createRoadRecord,
  deleteRoadRecord,
  downloadCsv,
  duplicateProject,
  fetchProjects,
  formatStation,
  updateRoadRecord,
  type RoadProject,
} from '@/lib/roadEngineering';

export default function RoadProjectsPage() {
  const [rows, setRows] = useState<RoadProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [roadClass, setRoadClass] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoadProject | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProjects({ q, status, road_class: roadClass });
      setRows(data);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [q, status, roadClass]);

  useEffect(() => {
    document.title = 'Замын төслүүд';
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'draft', progress: 0, start_station: 0 });
    setOpen(true);
  };

  const openEdit = (row: RoadProject) => {
    setEditing(row);
    form.setFieldsValue({
      ...row,
      start_date: row.start_date ? dayjs(row.start_date) : null,
      end_date: row.end_date ? dayjs(row.end_date) : null,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const body = {
        ...values,
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : null,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : null,
        start_station: Number(values.start_station || 0),
        end_station: Number(values.end_station || 0),
        length: Number(values.length || Math.max(0, Number(values.end_station || 0) - Number(values.start_station || 0))),
        progress: Number(values.progress || 0),
      };
      if (editing) await updateRoadRecord('projects', editing.id, body);
      else await createRoadRecord('projects', body);
      message.success(editing ? 'Шинэчлэгдлээ' : 'Төсөл үүслээ');
      setOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<RoadProject> = useMemo(
    () => [
      { title: 'Код', dataIndex: 'code', width: 130 },
      { title: 'Нэр', dataIndex: 'name', ellipsis: true },
      {
        title: 'Анги',
        dataIndex: 'road_class',
        width: 90,
        render: (v) => ROAD_CLASSES.find((c) => c.value === v)?.label || v || '—',
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        width: 120,
        render: (v) => <Tag>{ROAD_STATUSES.find((s) => s.value === v)?.label || v}</Tag>,
      },
      {
        title: 'Урт',
        dataIndex: 'length',
        width: 100,
        render: (v) => `${Number(v || 0).toLocaleString()} м`,
      },
      {
        title: 'Явц',
        dataIndex: 'progress',
        width: 90,
        render: (v) => `${Number(v || 0)}%`,
      },
      { title: 'Зураг төсөл', dataIndex: 'designer', width: 140, ellipsis: true },
      { title: 'Гүйцэтгэгч', dataIndex: 'contractor', width: 140, ellipsis: true },
      {
        title: 'Станц',
        key: 'station',
        width: 140,
        render: (_, r) => `${formatStation(r.start_station)}–${formatStation(r.end_station)}`,
      },
      {
        title: 'Үйлдэл',
        key: 'actions',
        fixed: 'right',
        width: 220,
        render: (_, row) => (
          <Space>
            <Button type="link" onClick={() => openEdit(row)}>
              Засах
            </Button>
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={async () => {
                await duplicateProject(row.id);
                message.success('Хууллаа');
                load();
              }}
            />
            <Button
              type="link"
              onClick={async () => {
                await archiveProject(row.id);
                message.success('Архивлалаа');
                load();
              }}
            >
              Архив
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                Modal.confirm({
                  title: 'Устгах уу?',
                  onOk: async () => {
                    await deleteRoadRecord('projects', row.id);
                    message.success('Устгагдлаа');
                    load();
                  },
                })
              }
            />
          </Space>
        ),
      },
    ],
    [load],
  );

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <h2 style={{ margin: 0 }}>Замын төслүүд</h2>
        <Input.Search
          placeholder="Хайх..."
          allowClear
          style={{ width: 220 }}
          onSearch={setQ}
          onChange={(e) => !e.target.value && setQ('')}
        />
        <Select
          allowClear
          placeholder="Статус"
          style={{ width: 140 }}
          options={ROAD_STATUSES}
          value={status}
          onChange={setStatus}
        />
        <Select
          allowClear
          placeholder="Замын анги"
          style={{ width: 140 }}
          options={ROAD_CLASSES}
          value={roadClass}
          onChange={setRoadClass}
        />
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Шинэ төсөл
        </Button>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => downloadCsv('road-projects.csv', rows as unknown as Record<string, unknown>[])}
        >
          Excel / CSV
        </Button>
        <Button
          onClick={() => {
            const w = window.open('', '_blank');
            if (!w) return;
            w.document.write(`<html><head><title>Төслүүд</title></head><body><h1>Замын төслүүд</h1><table border="1" cellpadding="6"><tr><th>Код</th><th>Нэр</th><th>Урт</th><th>Статус</th></tr>${rows.map((r) => `<tr><td>${r.code}</td><td>${r.name}</td><td>${r.length}</td><td>${r.status}</td></tr>`).join('')}</table></body></html>`);
            w.document.close();
            w.print();
          }}
        >
          PDF
        </Button>
      </Space>

      <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={{ pageSize: 12 }} scroll={{ x: 1200 }} />

      <Drawer
        title={editing ? 'Төсөл засах' : 'Шинэ төсөл'}
        open={open}
        onClose={() => setOpen(false)}
        width={560}
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
          <Form.Item name="code" label="Код" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="road_class" label="Замын анги">
            <Select options={ROAD_CLASSES} allowClear />
          </Form.Item>
          <Form.Item name="status" label="Статус">
            <Select options={ROAD_STATUSES} />
          </Form.Item>
          <Form.Item name="description" label="Тайлбар">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Space style={{ width: '100%' }} className="w-full [&_.ant-space-item]:flex-1">
            <Form.Item name="province" label="Аймаг/хот" className="w-full">
              <Input />
            </Form.Item>
            <Form.Item name="district" label="Сум/дүүрэг" className="w-full">
              <Input />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="start_station" label="Эхлэх станц">
              <Input type="number" />
            </Form.Item>
            <Form.Item name="end_station" label="Төгсөх станц">
              <Input type="number" />
            </Form.Item>
            <Form.Item name="length" label="Урт (м)">
              <Input type="number" />
            </Form.Item>
          </Space>
          <Form.Item name="progress" label="Явц (%)">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="designer" label="Зураг төсөл">
            <Input />
          </Form.Item>
          <Form.Item name="contractor" label="Гүйцэтгэгч">
            <Input />
          </Form.Item>
          <Form.Item name="consultant" label="Зөвлөх">
            <Input />
          </Form.Item>
          <Space>
            <Form.Item name="start_date" label="Эхлэх">
              <DatePicker />
            </Form.Item>
            <Form.Item name="end_date" label="Дуусах">
              <DatePicker />
            </Form.Item>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
}
