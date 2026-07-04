'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Layout, Menu, message, Spin, Modal, Dropdown, Avatar, Button, Typography } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  HomeOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import ModuleSubNav from '@/components/admin/ModuleSubNav';
import { DASHBOARD_PATH } from '@/config/adminNavigation';

import { getUserRole, getUsername, loadUserPermissions } from '@/lib/auth';

const { Header, Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState(() => getUserRole());
  const [username, setUsername] = useState('Admin');

  const handleLogout = () => {
    message.success('Logged out');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('permissions');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    router.push('/');
  };

  const showConfirm = () => {
    Modal.confirm({
      title: 'Та гарахдаа итгэлтэй байна уу?',
      okText: 'Тийм',
      cancelText: 'Үгүй',
      centered: true,
      width: 500,
      onOk: handleLogout,
    });
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="userinfo" icon={<UserOutlined />} disabled>
        Таны нэр: {username}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={showConfirm} danger>
        Гарах
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    (async () => {
      setUsername(getUsername());
      setUserRole(getUserRole());
      const perms = await loadUserPermissions();
      setUserPermissions(perms);
      setUserRole(getUserRole());
    })();
  }, []);

  const isDashboard = pathname === DASHBOARD_PATH;

  const goHome = () => {
    setLoading(true);
    startTransition(() => {
      router.push(DASHBOARD_PATH);
      setTimeout(() => setLoading(false), 400);
    });
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Typography.Title
            level={4}
            style={{ margin: 0, color: '#082c5c', cursor: 'pointer', userSelect: 'none' }}
            onClick={goHome}
          >
            <AppstoreOutlined style={{ marginRight: 8 }} />
            Замын систем
          </Typography.Title>
          {!isDashboard && (
            <Button type="text" icon={<HomeOutlined />} onClick={goHome}>
              Модуль сонгох
            </Button>
          )}
        </div>
        <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight" arrow>
          <Avatar
            size="large"
            style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
            icon={<UserOutlined />}
          />
        </Dropdown>
      </Header>

      {!isDashboard && <ModuleSubNav userPermissions={userPermissions} userRole={userRole} />}

      <Content
        style={{
          padding: '16px 20px',
          maxWidth: '100%',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Spin spinning={loading || isPending} tip="Ачааллаж байна..." size="large">
          <div
            style={{
              padding: isDashboard ? 32 : 16,
              background: '#fff',
              minHeight: 360,
              borderRadius: 12,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {children}
          </div>
        </Spin>
      </Content>
    </Layout>
  );
}
