'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Drawer, Form, Input, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role_id: number;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = 'Хэрэглэгч';

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`);
        const result = await res.json();
        if (result.success) {
          setUsers(result.data);
        } else {
          console.error('Failed to load users:', result.message);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleCreateUser = () => {
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    form.resetFields();
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values), // includes username, phone, email, role_id, password
      });
  
      const result = await response.json();
  
      if (response.ok) {
        console.log('User created:', result);
        // Optionally refresh user list
        setUsers((prev) => [...prev, result]);
        // Close drawer and reset form
        handleDrawerClose();
      } else {
        console.error('Failed to create user:', result.message);
      }
    } catch (error) {
      console.error('Validation or request failed:', error);
    }
  };
  
  const columns: ColumnsType<User> = [
    {
      title: 'Username',
      dataIndex: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
    },
    {
      title: 'Role',
      dataIndex: 'role_id',
      render: (role_id: number) => {
        const roles: Record<number, string> = {
          1: 'admin',
          2: 'customer',
          3: 'driver',
        };
        return roles[role_id] || `Role ${role_id}`;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => alert(`Edit ${record.username}`)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => alert(`Delete ${record.username}`)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Хэрэглэгч</h1>
      <Space style={{ marginBottom: 16, width: '100%' }} wrap>
        <Button
          type="primary"
          style={{ marginLeft: 'auto' }}
          onClick={handleCreateUser}
        >
          + Хэрэглэгч үүсгэх
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
      />

      {/* Drawer for creating a user */}
      <Drawer
        title="Хэрэглэгч үүсгэх"
        width={400}
        onClose={handleDrawerClose}
        visible={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={handleFormSubmit}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="Username" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="Phone" />
          </Form.Item>
          <Form.Item name="role_id" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select role">
              <Option value={1}>Admin</Option>
              <Option value={2}>Nyarav</Option>
              <Option value={3}>Project Manager</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter a password' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Хадгалах
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
