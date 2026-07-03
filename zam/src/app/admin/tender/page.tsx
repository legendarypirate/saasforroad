'use client';

import React, { useEffect, useState } from 'react';
import { Button, Table, Tag, Modal, Form, Input, message, Space } from 'antd';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { createTender, fetchTenders, STATUS_LABELS, type TenderPackage } from '@/lib/tender';

const statusColor: Record<string, string> = {
  draft: 'default',
  processing: 'processing',
  ready: 'success',
};

export default function TenderListPage() {
  const router = useRouter();
  const [data, setData] = useState<TenderPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    setData(await fetchTenders());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const created = await createTender(values);
      if (created) {
        message.success('Тендер багц үүслээ');
        setOpen(false);
        form.resetFields();
        router.push(`/admin/tender/${created.id}`);
      } else {
        message.error('Үүсгэхэд алдаа гарлаа');
      }
    } catch {
      /* validation */
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: '#082c5c' }}>
            <FileTextOutlined style={{ marginRight: 8 }} />
            Тендерийн материал
          </h2>
          <p style={{ margin: '4px 0 0', color: '#888' }}>
            Инженерийн үнэмжлэх, И-Монгол лавлагаа upload → AI боловсруулалт → DOCX татах
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Шинэ тендер багц
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        onRow={(row) => ({ onClick: () => router.push(`/admin/tender/${row.id}`), style: { cursor: 'pointer' } })}
        columns={[
          { title: 'Тендерийн нэр', dataIndex: 'title' },
          { title: 'Дугаар', dataIndex: 'tender_number' },
          { title: 'Төсөл', dataIndex: 'project_name' },
          {
            title: 'Баримт',
            render: (_, row) => row.documents?.length ?? 0,
          },
          {
            title: 'Төлөв',
            dataIndex: 'status',
            render: (s: string) => <Tag color={statusColor[s] || 'default'}>{STATUS_LABELS[s] || s}</Tag>,
          },
          {
            title: '',
            render: (_, row) => (
              <Button type="link" onClick={(e) => { e.stopPropagation(); router.push(`/admin/tender/${row.id}`); }}>
                Нээх
              </Button>
            ),
          },
        ]}
      />

      <Modal
        title="Шинэ тендер багц"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleCreate}
        okText="Үүсгэх"
        cancelText="Болих"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Тендерийн нэр" rules={[{ required: true }]}>
            <Input placeholder="2026 оны замын засварын тендер" />
          </Form.Item>
          <Form.Item name="tender_number" label="Тендерийн дугаар">
            <Input />
          </Form.Item>
          <Form.Item name="project_name" label="Төслийн нэр">
            <Input />
          </Form.Item>
          <Form.Item name="client_name" label="Захиалагч">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Тайлбар">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
