'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Drawer, Form, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface StockItem {
  id: number;
  item_id: number;
  warehouse_id: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  material: {
    id: number;
    name: string;
  };
  warehouse: {
    id: number;
    name: string;
  };
}

export default function StockPage() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const columns: ColumnsType<StockItem> = [
    {
      title: 'Огноо',
      dataIndex: 'createdAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Материал',
      dataIndex: ['material', 'name'],
    },
    {
      title: 'Агуулах',
      dataIndex: ['warehouse', 'name'],
    },
    {
      title: 'Тоо хэмжээ',
      dataIndex: 'quantity',
    },
    {
      title: 'Үйлдэл',
      key: 'actions',
      render: (_: any, record: StockItem) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => alert(`Edit ${record.id}`)}>Edit</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchData();
      } else {
        console.error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock`);
      const result = await res.json();
      if (result.success) {
        setStockData(result.data);
        setPagination((prev) => ({ ...prev, total: result.data.length }));
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  useEffect(() => {
      document.title='Үлдэгдэл';
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => setSelectedRowKeys(selectedKeys),
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Үлдэгдэл бүртгэл</h1>

      <Space style={{ marginBottom: 16, width: '100%' }}>
        <Button type="primary" style={{ marginLeft: 'auto' }} onClick={() => setIsDrawerVisible(true)}>
          + Бүртгэх
        </Button>
      </Space>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={stockData}
        rowKey="id"
        pagination={{
          position: ['topRight'],
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
        }}
      />

      <Drawer
        title="Шинэ үлдэгдэл бүртгэх"
        placement="right"
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        width="400px"
        bodyStyle={{ padding: '20px' }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Материал ID" name="item_id" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item label="Агуулах ID" name="warehouse_id" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item label="Тоо хэмжээ" name="quantity" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={async () => {
              const values = await form.validateFields();
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
              });
              const result = await res.json();
              if (result.success) {
                form.resetFields();
                setIsDrawerVisible(false);
                fetchData();
              }
            }} block>
              Үүсгэх
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}