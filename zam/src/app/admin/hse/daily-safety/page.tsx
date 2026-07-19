'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Drawer,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tabs,
  message,
  DatePicker,
  Progress,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import {
  createDailyInstruction,
  deleteDailyInstruction,
  fetchDailyInstructions,
  fetchInstructionCompletion,
  fetchProjects,
  updateDailyInstruction,
  type DailyInstruction,
  type InstructionCompletion,
} from '@/lib/hse';

export default function DailySafetyPage() {
  const [instructions, setInstructions] = useState<DailyInstruction[]>([]);
  const [completion, setCompletion] = useState<InstructionCompletion | null>(null);
  const [projects, setProjects] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DailyInstruction | null>(null);
  const [date, setDate] = useState(dayjs());
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    const [inst, comp, projs] = await Promise.all([
      fetchDailyInstructions(),
      fetchInstructionCompletion(date.format('YYYY-MM-DD')),
      fetchProjects(),
    ]);
    setInstructions(inst);
    setCompletion(comp);
    setProjects(projs);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    document.title = 'Өглөөний ХАБЭА заавар';
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'draft', publish_date: dayjs() });
    setOpen(true);
  };

  const openEdit = (row: DailyInstruction) => {
    setEditing(row);
    form.setFieldsValue({
      ...row,
      publish_date: dayjs(row.publish_date),
      expiry_date: row.expiry_date ? dayjs(row.expiry_date) : undefined,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = userRaw ? JSON.parse(userRaw) : null;
    const body = {
      title: values.title,
      content: values.content,
      project_id: values.project_id || null,
      department: values.department || null,
      publish_date: dayjs(values.publish_date).format('YYYY-MM-DD'),
      expiry_date: values.expiry_date ? dayjs(values.expiry_date).format('YYYY-MM-DD') : null,
      status: values.status,
      created_by: user?.id,
      updated_by: user?.id,
    };
    const ok = editing
      ? await updateDailyInstruction(editing.id, body)
      : await createDailyInstruction(body);
    if (ok) {
      message.success(editing ? 'Шинэчлэгдлээ' : 'Үүсгэгдлээ');
      setOpen(false);
      load();
    } else {
      message.error('Алдаа гарлаа');
    }
  };

  const columns: ColumnsType<DailyInstruction> = [
    { title: 'Гарчиг', dataIndex: 'title' },
    { title: 'Хувилбар', dataIndex: 'version', width: 90 },
    { title: 'Төсөл', render: (_, r) => r.project?.name || 'Бүгд' },
    { title: 'Огноо', dataIndex: 'publish_date' },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (s) => (
        <Tag color={s === 'published' ? 'green' : s === 'archived' ? 'default' : 'blue'}>{s}</Tag>
      ),
    },
    {
      title: 'Үйлдэл',
      render: (_, row) => (
        <Space>
          <Button type="link" onClick={() => openEdit(row)}>
            Засах
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              Modal.confirm({
                title: 'Устгах уу?',
                onOk: async () => {
                  if (await deleteDailyInstruction(row.id)) {
                    message.success('Устгагдлаа');
                    load();
                  }
                },
              })
            }
          />
        </Space>
      ),
    },
  ];

  const pendingCols: ColumnsType<{ id: number; username: string; phone?: string }> = [
    { title: 'Ажилтан', dataIndex: 'username' },
    { title: 'Утас', dataIndex: 'phone' },
  ];

  return (
    <div className="space-y-4">
      <Space wrap>
        <DatePicker value={date} onChange={(d) => d && setDate(d)} />
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Заавар үүсгэх
        </Button>
      </Space>

      {completion && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card size="small" title="Нийт ажилтан">
            <p className="text-2xl font-bold">{completion.total_employees}</p>
          </Card>
          <Card size="small" title="Баталгаажсан">
            <p className="text-2xl font-bold text-green-600">{completion.completed}</p>
          </Card>
          <Card size="small" title="Хийгээгүй">
            <p className="text-2xl font-bold text-amber-600">{completion.not_completed}</p>
          </Card>
          <Card size="small" title="Гүйцэтгэл">
            <Progress percent={completion.completion_percentage} />
          </Card>
        </div>
      )}

      <Tabs
        items={[
          {
            key: 'instructions',
            label: 'Зааврууд',
            children: (
              <Table rowKey="id" loading={loading} dataSource={instructions} columns={columns} pagination={{ pageSize: 10 }} />
            ),
          },
          {
            key: 'pending',
            label: `Хийгээгүй (${completion?.not_completed ?? 0})`,
            children: (
              <Table
                rowKey="id"
                dataSource={completion?.pending_users || []}
                columns={pendingCols}
                pagination={{ pageSize: 15 }}
              />
            ),
          },
        ]}
      />

      <Drawer
        title={editing ? 'Заавар засах' : 'Шинэ заавар'}
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
          <Form.Item name="title" label="Гарчиг" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="Агуулга" rules={[{ required: true }]}>
            <Input.TextArea rows={8} />
          </Form.Item>
          <Form.Item name="project_id" label="Төсөл">
            <Select allowClear placeholder="Бүх төсөл" options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
          <Form.Item name="department" label="Хэлтэс">
            <Input />
          </Form.Item>
          <Form.Item name="publish_date" label="Нийтлэх огноо" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiry_date" label="Дуусах огноо">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Төлөв" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'draft', label: 'Ноорог' },
                { value: 'published', label: 'Нийтлэгдсэн' },
                { value: 'archived', label: 'Архив' },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
