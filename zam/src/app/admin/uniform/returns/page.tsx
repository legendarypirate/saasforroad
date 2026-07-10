'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Drawer,
  Select,
  Space,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import { PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import {
  RETURN_CONDITIONS,
  createUniformRecord,
  fetchUniformList,
} from '@/lib/uniform';

export default function Page() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [openLines, setOpenLines] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [returns, lines] = await Promise.all([
        fetchUniformList<Record<string, unknown>>('returns'),
        fetchUniformList<Record<string, unknown>>('open-issue-lines'),
      ]);
      setRows(returns);
      setOpenLines(lines);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Буцаалт';
    load();
  }, [load]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      await createUniformRecord('returns', {
        ...values,
        return_date: dayjs(values.return_date).format('YYYY-MM-DD'),
        received_by: user?.id,
        created_by: user?.id,
      });
      message.success('Буцаалт бүртгэгдлээ');
      setOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <h2 style={{ margin: 0 }}>Буцаалт</h2>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({ return_date: dayjs(), condition: 'good', qty: 1 });
            setOpen(true);
          }}
        >
          Буцаалт нэмэх
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 15 }}
        columns={[
          { title: 'Огноо', dataIndex: 'return_date', width: 110 },
          {
            title: 'Олголт',
            render: (_, r) => {
              const line = r.issueLine as {
                issue?: { number?: string; receiver?: { username?: string } };
                item?: { name?: string };
                size?: string;
              };
              return `${line?.issue?.number || ''} · ${line?.issue?.receiver?.username || ''} · ${line?.item?.name || ''}${line?.size ? ` (${line.size})` : ''}`;
            },
          },
          { title: 'Тоо', dataIndex: 'qty', width: 70 },
          {
            title: 'Нөхцөл',
            dataIndex: 'condition',
            render: (v: string) => {
              const label = RETURN_CONDITIONS.find((c) => c.value === v)?.label || v;
              const color = v === 'good' ? 'green' : v === 'lost' ? 'red' : 'orange';
              return <Tag color={color}>{label}</Tag>;
            },
          },
          {
            title: 'Хүлээн авсан',
            render: (_, r) => (r.receiver as { username?: string })?.username || '—',
          },
        ]}
      />

      <Drawer
        title="Буцаалт"
        open={open}
        onClose={() => setOpen(false)}
        width={480}
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
          <Form.Item name="return_date" label="Огноо" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="issue_line_id" label="Олголтын мөр" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={openLines.map((l) => {
                const issue = l.issue as { number?: string; receiver?: { username?: string } };
                const item = l.item as { name?: string };
                const rem = Number(l.qty) - Number(l.qty_returned);
                return {
                  value: Number(l.id),
                  label: `${issue?.number} · ${issue?.receiver?.username} · ${item?.name}${l.size ? ` (${l.size})` : ''} · үлд ${rem}`,
                };
              })}
            />
          </Form.Item>
          <Form.Item name="qty" label="Тоо" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="condition" label="Нөхцөл" rules={[{ required: true }]}>
            <Select options={RETURN_CONDITIONS} />
          </Form.Item>
          <Form.Item name="notes" label="Тэмдэглэл">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
