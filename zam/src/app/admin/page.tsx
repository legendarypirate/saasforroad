'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Divider } from 'antd';
import {
  TeamOutlined,
  ShoppingOutlined,
  CarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import ModuleFolderGrid from '@/components/admin/ModuleFolderGrid';
import { getUserRole, loadUserPermissions } from '@/lib/auth';

interface StatsData {
  projects: number;
  tasks: number;
  warehouseItems: number;
  averageProgress: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState(() => getUserRole());

  useEffect(() => {
    (async () => {
      setUserRole(getUserRole());
      const perms = await loadUserPermissions();
      setUserPermissions(perms);
      setUserRole(getUserRole());
    })();

    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task/stats`);
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
      icon: <CarOutlined style={{ fontSize: 28 }} />,
    },
    {
      title: 'Нийт даалгавар',
      value: stats?.tasks ?? 0,
      color: '#eb2f96',
      icon: <ShoppingOutlined style={{ fontSize: 28 }} />,
    },
    {
      title: 'Агуулахын бараа',
      value: stats?.warehouseItems ?? 0,
      color: '#fa8c16',
      icon: <TeamOutlined style={{ fontSize: 28 }} />,
    },
    {
      title: 'Дундаж гүйцэтгэл',
      value: `${stats?.averageProgress ?? 0}%`,
      color: '#52c41a',
      icon: <UserOutlined style={{ fontSize: 28 }} />,
    },
  ];

  return (
    <div>
      <ModuleFolderGrid userPermissions={userPermissions} userRole={userRole} />

      <Divider style={{ margin: '36px 0 28px' }} />

      <h2 style={{ color: '#082c5c', marginBottom: 20, fontSize: 18, fontWeight: 600 }}>
        Ерөнхий мэдээлэл
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[20, 20]}>
          {cards.map(({ title, value, color, icon }) => (
            <Col xs={24} sm={12} md={6} key={title}>
              <Card
                bordered={false}
                style={{
                  backgroundColor: color,
                  color: '#fff',
                  borderRadius: 12,
                  textAlign: 'center',
                }}
                bodyStyle={{
                  padding: '20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {icon}
                <div style={{ fontSize: 14, opacity: 0.9 }}>{title}</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
