'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined } from '@/components/admin/icons';
import {
  MILESTONE_STATUSES,
  MILESTONE_TYPES,
  createMilestone,
  deleteMilestone,
  fetchMilestones,
  updateMilestone,
  type ProjectMilestone,
} from '@/lib/project';

type Props = {
  projectId: number;
  phasesSlot?: React.ReactNode;
};

export default function ProjectMilestonesTab({ projectId, phasesSlot }: Props) {
  const [rows, setRows] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectMilestone | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchMilestones(projectId));
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      if (editing) {
        await updateMilestone(editing.id, v);
        message.success('Шинэчлэгдлээ');
      } else {
        await createMilestone({ ...v, project_id: projectId });
        message.success('Үе шат нэмэгдлээ');
      }
      setOpen(false);
      setEditing(null);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<ProjectMilestone> = [
    { title: 'Нэр', dataIndex: 'name' },
    {
      title: 'Төрөл',
      dataIndex: 'type',
      width: 120,
      render: (v) => MILESTONE_TYPES.find((t) => t.value === v)?.label || v,
    },
    { title: 'Хугацаа', dataIndex: 'due_date', width: 110 },
    { title: 'Биелсэн', dataIndex: 'actual_date', width: 110 },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 120,
      render: (v) => (
        <Tag>{MILESTONE_STATUSES.find((s) => s.value === v)?.label || v}</Tag>
      ),
    },
    { title: 'Жин %', dataIndex: 'weight', width: 80 },
    {
      title: '',
      key: 'a',
      width: 140,
      render: (_, row) => (
        <Space>
          <Button
            type="link"
            className="px-0"
            onClick={() => {
              setEditing(row);
              form.setFieldsValue(row);
              setOpen(true);
            }}
          >
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
                  await deleteMilestone(row.id);
                  load();
                },
              })
            }
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {phasesSlot}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Гэрээний / техникийн milestone</h3>
          <p className="text-sm text-muted-foreground">Хүлээлгэн өгөх, төлбөр, техникийн гарц.</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ type: 'technical', status: 'pending', weight: 0 });
            setOpen(true);
          }}
        >
          Milestone
        </Button>
      </div>

      <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={false} />

      <Modal
        title={editing ? 'Milestone засах' : 'Шинэ milestone'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        okText="Хадгалах"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="type" label="Төрөл">
              <Select options={[...MILESTONE_TYPES]} />
            </Form.Item>
            <Form.Item name="status" label="Статус">
              <Select options={[...MILESTONE_STATUSES]} />
            </Form.Item>
            <Form.Item name="due_date" label="Хугацаа">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="actual_date" label="Биелсэн огноо">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="weight" label="Жин %">
              <InputNumber className="w-full" min={0} max={100} />
            </Form.Item>
          </div>
          <Form.Item name="criteria" label="Шалгуур">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
