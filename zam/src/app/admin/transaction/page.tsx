'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Drawer, Form } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';

interface Material {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface Transaction {
  id: number;
  item_id: number;
  warehouse_id: number;
  type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string;
  project_id: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  material: Material;
  project: Project;
  warehouse: Warehouse;
}

export default function TransactionPage() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [data, setData] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Үүссэн огноо',
      dataIndex: 'createdAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD hh:mm A'),
    },
    {
      title: 'Бараа',
      dataIndex: ['material', 'name'],
      key: 'materialName',
    },
    {
      title: 'Агуулах',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouseName',
    },
    {
      title: 'Төслийн нэр',
      dataIndex: ['project', 'name'],
      key: 'projectName',
    },
    {
      title: 'Төрөл',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'In', value: 'in' },
        { text: 'Out', value: 'out' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Тоо ширхэг',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Нэгж үнэ',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => price.toFixed(2),
    },
    {
      title: 'Нийт үнэ',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (price: number) => price.toFixed(2),
    },
    {
      title: 'Тайлбар',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Үйлдэл',
      key: 'actions',
      render: (_: any, record: Transaction) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => alert(`Edit ${record.id}`)}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const fetchTransactions = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transaction?page=${pagination.current}&pageSize=${pagination.pageSize}`
      );
      const result = await res.json();

      if (result.success) {
        setData(result.data);
        // If your API sends total count for pagination, update it here:
        setPagination((prev) => ({ ...prev, total: result.total || result.data.length }));
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  useEffect(() => {
    document.title = 'Барааны гүйлгээ';
    fetchTransactions();
  }, [pagination.current, pagination.pageSize]);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTransactions();
      } else {
        console.error('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => setSelectedRowKeys(selectedKeys),
  };

  const handleDrawerOpen = () => setIsDrawerVisible(true);
  const handleDrawerClose = () => setIsDrawerVisible(false);

  // Example for form submission, you may adapt this as needed
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        name: values.name,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        fetchTransactions();
        form.resetFields();
        setIsDrawerVisible(false);
      } else {
        console.error('Failed to create transaction:', result.message);
      }
    } catch (err) {
      console.error('Validation or request error:', err);
    }
  };

  return (
    <div style={{ paddingBottom: '100px' }}>
      <h1 style={{ marginBottom: 24 }}>Барааны гүйлгээ</h1>

      <Space style={{ marginBottom: 16, width: '100%' }} wrap>
        <Button type="primary" style={{ marginLeft: 'auto' }} onClick={handleDrawerOpen}>
          + Гүйлгээ үүсгэх
        </Button>
      </Space>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          position: ['topRight'],
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) =>
            setPagination((prev) => ({ ...prev, current: page, pageSize })),
        }}
      />

      <Drawer
        title="Гүйлгээ үүсгэх"
        placement="right"
        visible={isDrawerVisible}
        onClose={handleDrawerClose}
        width="400px"
        bodyStyle={{ padding: '20px' }}
      >
        <Form form={form} layout="vertical">
          {/* Example field: adjust with actual transaction fields */}
          <Form.Item
            label="Нэр"
            name="name"
            rules={[{ required: true, message: 'Нэр оруулна уу!' }]}
          >
            <Input placeholder="Нэр оруулах" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleOk} block>
              Үүсгэх
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
