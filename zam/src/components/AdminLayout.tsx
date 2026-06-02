'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Layout, Menu, message, Spin, MenuProps, Modal,Dropdown,Avatar, } from 'antd';
import {
  DashboardOutlined,
  AlertOutlined,
  CalendarOutlined,
  OrderedListOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  HomeOutlined,
  TeamOutlined,
  KeyOutlined,
  FileTextOutlined,
  TagsOutlined,
  ProjectOutlined,
  BellOutlined,
  UserOutlined,
  SwapOutlined,
  DatabaseOutlined,
  DropboxOutlined,
  FileDoneOutlined,
  BankOutlined,
  SettingOutlined,
  TruckOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';

const { Header, Sider, Content } = Layout;

interface MenuItemType {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  permission?: string;
  children?: MenuItemType[];
}

// Retrieve user permissions from localStorage
function getUserPermissions(): string[] {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return [];
    const user = JSON.parse(userStr);
    return user.permissions || [];
  } catch (e) {
    console.error('Failed to parse user from localStorage', e);
    return [];
  }
}

// Check if the user has a specific permission
function hasPermission(permission: string, userPermissions: string[]): boolean {
  if (!permission) return true;
  // No permissions loaded yet (legacy admin) — show all menus
  if (userPermissions.length === 0) return true;
  return userPermissions.includes(permission);
}

const showConfirm = (handleLogout: () => void) => {
  Modal.confirm({
    title: 'Та гарахдаа итгэлтэй байна уу?',
    okText: 'Тийм',
    cancelText: 'Үгүй',
    centered: true,
    width: 500,
    onOk: handleLogout,
  });
};

// Recursively filter menu items by permission
function filterMenuByPermission(items: MenuItemType[], userPermissions: string[]): MenuItemType[] {
  return items
    .map(item => {
      if (item.children) {
        const children = filterMenuByPermission(item.children, userPermissions);
        if (children.length === 0) return null;
        return { ...item, children };
      }
      return hasPermission(item.permission || '', userPermissions) ? item : null;
    })
    .filter((item): item is MenuItemType => item !== null);
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

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

  
  const handleLogout = () => {
    message.success('Logged out');
    // Clear localStorage or token as needed here
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

const userMenu = (
  <Menu>
    <Menu.Item key="userinfo" icon={<UserOutlined />} disabled>
      Таны нэр: Admin
    </Menu.Item>
    <Menu.Divider />
    <Menu.Item
  key="logout"
  icon={<LogoutOutlined />}
  onClick={() => showConfirm()}
  danger
>
  Гарах
</Menu.Item>

  </Menu>
);

  useEffect(() => {
    setUserPermissions(getUserPermissions());
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin/attendance')) {
      setOpenKeys((prev) => (prev.includes('hr') ? prev : [...prev, 'hr']));
    }
  }, [pathname]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    if (e.key === '/admin/logout' || e.key === 'hr') return;
    setLoading(true);
    router.push(e.key);
    setTimeout(() => setLoading(false), 500);
  };

  const menuItems: MenuItemType[] = [
    { key: '/admin', icon: <DashboardOutlined />, label: 'Хянах самбар' },
  { key: '/admin/accident', icon: <AlertOutlined />, label: 'Ослын дуудлага' },
  { key: '/admin/calendar', icon: <CalendarOutlined />, label: 'Календар' },
  { key: '/admin/project', icon: <ProjectOutlined />, label: 'Төслүүд' },
  { key: '/admin/task', icon: <OrderedListOutlined />, label: 'Үүрэг даалгаврууд' },
  {
    key: 'settings',
    icon: <DropboxOutlined />, // more fitting than SettingOutlined
    label: 'Бараа материал',
    children: [
      { key: '/admin/category', label: 'Ангилал', icon: <AppstoreOutlined /> },
      { key: '/admin/item', label: 'Бараа материалын жагсаалт', icon: <TagsOutlined /> },
      { key: '/admin/warehouse', label: 'Агуулах бүртгэх', icon: <BankOutlined /> },
      { key: '/admin/stock', label: 'Үлдэгдэл', icon: <DatabaseOutlined /> },
      { key: '/admin/transaction', label: 'Бараа материалын хөдөлгөөн', icon: <SwapOutlined /> },
    ],
  },
  { key: '/admin/supplier', icon: <TeamOutlined />, label: 'Нийлүүлэгч' },
  { key: '/admin/google', icon: <TeamOutlined />, label: 'Google Map' },

  { key: '/admin/document', icon: <FileDoneOutlined />, label: 'Баримт бичиг' },
  { key: '/admin/notification', icon: <BellOutlined />, label: 'Мэдэгдэл' },
  { key: '/admin/user', icon: <UserOutlined />, label: 'Хэрэглэгч нар', permission: 'user:read' },
  { key: '/admin/role', icon: <KeyOutlined />, label: 'Эрхийн зохицуулалт', permission: 'role:read' },
  {
    key: 'hr',
    icon: <IdcardOutlined />,
    label: 'HR удирдлага',
    children: [
      {
        key: '/admin/attendance',
        icon: <ClockCircleOutlined />,
        label: 'Ирцийн хяналт',
        permission: 'attendance:read',
      },
    ],
  },

  ];

  // Filter menu by user's permissions
  const filteredMenuItems = filterMenuByPermission(menuItems, userPermissions);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="logo" style={{ color: 'white', padding: '16px', textAlign: 'center' }}>
          Замын систем
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          onClick={handleMenuClick}
          items={filteredMenuItems as MenuProps['items']}
        />
      </Sider>
      <Layout>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight" arrow>
          <Avatar
            size="large"
            style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
            icon={<UserOutlined />}
          />
        </Dropdown>
      </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <Spin spinning={loading || isPending} tip="Ачааллаж байна..." size="large">
            <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
              {children}
            </div>
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
}
