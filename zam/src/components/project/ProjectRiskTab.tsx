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
  RISK_CATEGORIES,
  RISK_STATUSES,
  createRisk,
  deleteRisk,
  fetchRisks,
  riskScoreColor,
  updateRisk,
  type ProjectRisk,
} from '@/lib/project';
import { cn } from '@/lib/utils';

type Props = { projectId: number };

export default function ProjectRiskTab({ projectId }: Props) {
  const [rows, setRows] = useState<ProjectRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRisk | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchRisks(projectId));
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
        await updateRisk(editing.id, v);
        message.success('Шинэчлэгдлээ');
      } else {
        await createRisk({ ...v, project_id: projectId });
        message.success('Эрсдэл бүртгэгдлээ');
      }
      setOpen(false);
      setEditing(null);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<ProjectRisk> = [
    { title: 'Эрсдэл', dataIndex: 'title', ellipsis: true },
    {
      title: 'Ангилал',
      dataIndex: 'category',
      width: 110,
      render: (v) => RISK_CATEGORIES.find((c) => c.value === v)?.label || v,
    },
    { title: 'L', dataIndex: 'likelihood', width: 50 },
    { title: 'I', dataIndex: 'impact', width: 50 },
    {
      title: 'Оноо',
      dataIndex: 'score',
      width: 70,
      render: (v) => (
        <span className={cn('font-semibold', riskScoreColor(Number(v) || 0))}>{v}</span>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 120,
      render: (v) => <Tag>{RISK_STATUSES.find((s) => s.value === v)?.label || v}</Tag>,
    },
    { title: 'Эзэмшигч', dataIndex: 'owner', width: 120, ellipsis: true },
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
                  await deleteRisk(row.id);
                  load();
                },
              })
            }
          />
        </Space>
      ),
    },
  ];

  const matrix = [5, 4, 3, 2, 1].map((L) =>
    [1, 2, 3, 4, 5].map((I) => rows.filter((r) => r.likelihood === L && r.impact === I).length),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Эрсдэлийн бүртгэл</h3>
          <p className="text-sm text-muted-foreground">
            Likelihood × Impact · 15+ = өндөр эрсдэл
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({
              category: 'schedule',
              likelihood: 3,
              impact: 3,
              status: 'open',
            });
            setOpen(true);
          }}
        >
          Эрсдэл нэмэх
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border p-3">
        <p className="mb-2 text-xs text-muted-foreground">5×5 матриц (Impact → / Likelihood ↓)</p>
        <div className="inline-grid grid-cols-6 gap-1 text-center text-xs">
          <div />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="font-medium text-muted-foreground">
              I{i}
            </div>
          ))}
          {matrix.map((row, li) => (
            <div key={`row-${5 - li}`} className="contents">
              <div className="flex items-center font-medium text-muted-foreground">
                L{5 - li}
              </div>
              {row.map((count, ii) => {
                const score = (5 - li) * (ii + 1);
                const bg =
                  score >= 15
                    ? 'bg-red-500/20'
                    : score >= 8
                      ? 'bg-amber-500/20'
                      : 'bg-emerald-500/15';
                return (
                  <div
                    key={`${li}-${ii}`}
                    className={cn('flex size-9 items-center justify-center rounded-md font-semibold', bg)}
                  >
                    {count || '·'}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={{ pageSize: 10 }} />

      <Modal
        title={editing ? 'Эрсдэл засах' : 'Шинэ эрсдэл'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        okText="Хадгалах"
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Гарчиг" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="category" label="Ангилал">
              <Select options={[...RISK_CATEGORIES]} />
            </Form.Item>
            <Form.Item name="status" label="Статус">
              <Select options={[...RISK_STATUSES]} />
            </Form.Item>
            <Form.Item name="likelihood" label="Likelihood (1–5)">
              <InputNumber className="w-full" min={1} max={5} />
            </Form.Item>
            <Form.Item name="impact" label="Impact (1–5)">
              <InputNumber className="w-full" min={1} max={5} />
            </Form.Item>
            <Form.Item name="residual_score" label="Үлдэгдэл оноо">
              <InputNumber className="w-full" min={1} max={25} />
            </Form.Item>
            <Form.Item name="owner" label="Эзэмшигч">
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="mitigation" label="Бууруулах арга хэмжээ">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
