'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin } from 'antd';
import {
  TeamOutlined,
  ShoppingOutlined,
  CarOutlined,
  UserOutlined,
} from '@ant-design/icons';

// Define the type for the backend response
interface StatsData {
  projects: number;
  tasks: number;
  warehouseItems: number;
  averageProgress: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task/stats`); // ⬅️ your backend endpoint
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Нийт төсөл',
      value: stats?.projects ?? 0,
      color: '#1890ff',
      icon: <CarOutlined style={{ fontSize: 36, marginBottom: 12 }} />,
    },
    {
      title: 'Нийт даалгавар',
      value: stats?.tasks ?? 0,
      color: '#eb2f96',
      icon: <ShoppingOutlined style={{ fontSize: 36, marginBottom: 12 }} />,
    },
    {
      title: 'Нийт агуулахын бараа',
      value: stats?.warehouseItems ?? 0,
      color: '#fa8c16',
      icon: <TeamOutlined style={{ fontSize: 36, marginBottom: 12 }} />,
    },
    {
      title: 'Бүх төслийн дундаж гүйцэтгэлийн хувь',
      value: stats?.averageProgress ?? 0,
      color: '#52c41a',
      icon: <UserOutlined style={{ fontSize: 36, marginBottom: 12 }} />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: '#082c5c' }}>Хянах самбар</h1>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 100 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[32, 32]} style={{ marginTop: 24 }}>
          {cards.map(({ title, value, color, icon }) => (
            <Col xs={24} sm={12} md={6} key={title}>
              <Card
                bordered={false}
                style={{
                  backgroundColor: color,
                  color: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                  textAlign: 'center',
                  padding: '30px 0',
                  userSelect: 'none',
                  cursor: 'default',
                  transition: 'transform 0.3s ease',
                }}
                bodyStyle={{
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {icon}
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: '600', marginBottom: 10 }}>
                  {title}
                </h3>
                <span style={{ fontSize: 38, fontWeight: '700' }}>{value}</span>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
