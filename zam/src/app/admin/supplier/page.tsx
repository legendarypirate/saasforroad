'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Drawer, Form,Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  register: string;
  createdAt: string;
}

export default function SupplierPage() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [supplierData, setSupplierData] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const columns: ColumnsType<Supplier> = [
    {
      title: 'Үүссэн огноо',
      dataIndex: 'createdAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD hh:mm A'),
    },
    { title: 'Нэр', dataIndex: 'name' },
    { title: 'Утас', dataIndex: 'phone' },
    { title: 'И-мэйл', dataIndex: 'email' },
    { title: 'Байршил', dataIndex: 'address' },
    { title: 'Регистр', dataIndex: 'register' },
    {
    title: 'Барааны төрөл',
    dataIndex: 'productTypes',
    render: (types: string[]) => types?.length ? types.join(', ') : '—',
  },
    {
      title: 'Үйлдэл',
      key: 'actions',
      render: (_: any, record: Supplier) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => alert(`Edit ${record.name}`)}>Edit</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supplier/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const refreshed = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supplier`);
        const refreshedResult = await refreshed.json();
        if (refreshedResult.success) {
          setSupplierData(refreshedResult.data);
        }
      } else {
        console.error("Failed to delete supplier");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  useEffect(() => {
    document.title = 'Нийлүүлэгчид';
    const fetchData = async () => {
      try {
        const supplierRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supplier`);
        const result = await supplierRes.json();
        if (result.success) {
          setSupplierData(result.data);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const handleAddSupplier = () => {
    setIsDrawerVisible(true);
  };

  const handleOk = async () => {
  try {
    const values = await form.validateFields();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        productTypes: values.productTypes || [], // ⬅️ Make sure it's an array
      }),
    });

    const result = await response.json();

    if (result.success) {
      const refreshed = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supplier`);
      const refreshedResult = await refreshed.json();
      if (refreshedResult.success) {
        setSupplierData(refreshedResult.data);
      }
      form.resetFields();
      setIsDrawerVisible(false);
    } else {
      console.error('Failed to create supplier:', result.message);
    }
  } catch (err) {
    console.error('Validation or request error:', err);
  }
};


  const handleCloseDrawer = () => setIsDrawerVisible(false);

  return (
    <div style={{ paddingBottom: '100px' }}>
      <h1 style={{ marginBottom: 24 }}>Нийлүүлэгчид</h1>

      <Space style={{ marginBottom: 16 }} wrap>
        <Button type="primary" style={{ marginLeft: 'auto' }} onClick={handleAddSupplier}>
          + Нийлүүлэгч үүсгэх
        </Button>
      </Space>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={supplierData}
        rowKey="id"
        pagination={{
          position: ['topRight'],
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
          },
        }}
      />

      <Drawer
        title="Нийлүүлэгч үүсгэх"
        placement="right"
        open={isDrawerVisible}
        onClose={handleCloseDrawer}
        width="400px"
        bodyStyle={{ padding: '20px' }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Нэр" name="name" rules={[{ required: true }]}>
            <Input placeholder="Нийлүүлэгчийн нэр" />
          </Form.Item>
          <Form.Item label="Утас" name="phone" rules={[{ required: true }]}>
            <Input placeholder="Утасны дугаар" />
          </Form.Item>
          <Form.Item label="И-мэйл" name="email">
            <Input placeholder="И-мэйл хаяг" />
          </Form.Item>
          <Form.Item label="Байршил" name="address">
            <Input placeholder="Байршил" />
          </Form.Item>
          <Form.Item label="Регистр" name="register">
            <Input placeholder="Регистрийн дугаар" />
          </Form.Item>
          <Form.Item label="Нийлүүлдэг барааны төрөл" name="productTypes">
    <Select
      mode="tags"
      placeholder="Жишээ: Асфальт, Элс, Хайрга"
      style={{ width: '100%' }}
      tokenSeparators={[',']}
    />
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
