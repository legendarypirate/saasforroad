'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Drawer, Form, Input, Select, Modal, notification,Tag } from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { EditOutlined, DeleteOutlined, CloseOutlined } from '@/components/admin/icons';

const { Option } = Select;

interface Accident {
  id: number;
  location: string;
  description: string;
  ware_id: number;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
  };
}

export default function UsersPage() {
  const [good, setGood] = useState<Accident[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [merchants, setMerchants] = useState([]);
  const [wares, setWares] = useState([]);
  const [selectedGood, setSelectedGood] = useState<Accident | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);

  const isMerchant = user?.role === 2;
  const merchantId = isMerchant ? user?.id : null;

  useEffect(() => {
    document.title = 'Ослын дуудлага';

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Get user from localStorage
        const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const parsedUser = userData ? JSON.parse(userData) : null;
        setUser(parsedUser);
        setUsername(typeof window !== 'undefined' ? localStorage.getItem('username') : null);

        // Goods with optional merchant_id filter
        let goodsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/accident`;
        if (parsedUser?.role === 2) {
          goodsUrl += `?merchant_id=${parsedUser.id}`;
        }

        const goodsRes = await fetch(goodsUrl);
        const goodsResult = await goodsRes.json();
        if (goodsResult.success) {
          setGood(goodsResult.data);
        }

        
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleCreateGood = () => {
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    form.resetFields();
  };

  const openNotification = (type: 'success' | 'error' | 'warning', messageText: string) => {
    let backgroundColor = '#52c41a'; // default green
    if (type === 'error') backgroundColor = '#ff4d4f';
    else if (type === 'warning') backgroundColor = '#fa8c16';

    notification.open({
      message: null,
      description: <div style={{ color: 'white' }}>{messageText}</div>,
      duration: 4,
      style: {
        backgroundColor,
        borderRadius: '4px',
      },
      closeIcon: <CloseOutlined style={{ color: '#fff' }} />,
    });
  };

  const handleStockUpdate = async (values: { type: number; amount: number }) => {
    if (!selectedGood) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/good/${selectedGood.id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedGood.id,
          type: values.type,
          amount: Number(values.amount),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setGood((prevGoods) =>
          prevGoods.map((good) =>
            good.id === selectedGood.id ? { ...good, stock: result.data.stock } : good
          )
        );
        setModalVisible(false);

        if (values.type === 1) {
          openNotification('success', 'Амжилттай орлогодолоо');
        } else if (values.type === 2) {
          openNotification('warning', 'Амжилттай зарлагадлаа');
        }
      } else {
        Modal.error({ title: 'Error', content: result.message });
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      Modal.error({ title: 'Error', content: 'Failed to update stock' });
    }
  };
  const handleSolveAccident = async (accident: Accident) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accident/${accident.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 2 }), // Set status to "solved"
      });
  
      const result = await response.json();
  
      if (result.success) {
        // Update UI
        setGood((prev) =>
          prev.map((item) =>
            item.id === accident.id ? { ...item, status: 2 } : item
          )
        );
        openNotification('success', 'Ослын дуудлага амжилттай шийдэгдлээ');
      } else {
        Modal.error({ title: 'Алдаа', content: result.message });
      }
    } catch (error) {
      console.error('Error solving accident:', error);
      Modal.error({ title: 'Алдаа', content: 'Ослын дуудлага шийдвэрлэхэд алдаа гарлаа' });
    }
  };
  
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/good`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok) {
        setGood((prev) => [...prev, result.data]);
        handleDrawerClose();
      } else {
        console.error('Failed to create good:', result.message);
      }
    } catch (error) {
      console.error('Validation or request failed:', error);
    }
  };

  const columns: ColumnsType<Accident> = [
    {
      title: 'Байршил',
      dataIndex: ['location'],
    },
    {
      title: 'Тайлбар',
      dataIndex: ['description'],
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (status: number) => {
        switch (status) {
          case 1:
            return <Tag color="blue">Шинэ</Tag>;
          case 2:
            return <Tag color="green">Шийдэгдсэн</Tag>;
          default:
            return <Tag color="default">Тодорхойгүй</Tag>;
        }
      },
    },  
    { 
      title: 'Илгээгчийн нэр', 
      dataIndex: ['merchant'], 
      render: (_, record) => record.user?.username || '-' 
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleSolveAccident(record)}
          >
            Шийдвэрлэх
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Ослын дуудлага</h1>
      

      <Table columns={columns} dataSource={good} rowKey="id" loading={loading} />

      <Drawer
        title="Бараа үүсгэх"
        width={400}
        onClose={handleDrawerClose}
        visible={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <Form layout="vertical" form={form} onFinish={handleFormSubmit}>
          <Form.Item name="name" label="Барааны нэр" rules={[{ required: true }]}>
            <Input placeholder="Барааны нэр" />
          </Form.Item>
          <Form.Item name="stock" label="Үлдэгдэл" rules={[{ required: true }]}>
            <Input type="number" placeholder="Үлдэгдэл" />
          </Form.Item>

          {isMerchant ? (
            <>
              <Form.Item label="Дэлгүүр">
                <div
                  style={{
                    padding: '4px 11px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 2,
                    backgroundColor: '#f5f5f5',
                    color: 'rgba(0, 0, 0, 0.85)',
                    minHeight: 32,
                  }}
                >
                  {username}
                </div>
              </Form.Item>
              <Form.Item name="merchant_id" initialValue={merchantId} hidden>
                <Input />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="merchant_id"
              label="Дэлгүүр"
              rules={[{ required: true, message: 'Дэлгүүр сонгоно уу!' }]}
            >
              <Select placeholder="Дэлгүүр сонгох">
                {merchants.map((merchant: any) => (
                  <Option key={merchant.id} value={merchant.id}>
                    {merchant.username}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="ware_id" label="Агуулах" rules={[{ required: true }]}>
            <Select placeholder="Агуулах сонгох">
              {wares.map((ware: any) => (
                <Option key={ware.id} value={ware.id}>
                  {ware.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Хадгалах
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={`Орлого эсвэл Зарлага`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        centered
      >
       
      </Modal>
    </div>
  );
}
