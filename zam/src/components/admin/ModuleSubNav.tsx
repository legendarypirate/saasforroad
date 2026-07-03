'use client';

import React from 'react';
import { Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import {
  filterNavItems,
  getModuleForPath,
  type ModuleConfig,
} from '@/config/adminNavigation';

interface ModuleSubNavProps {
  userPermissions: string[];
  userRole?: string;
}

function resolveSelectedKey(pathname: string, mod: ModuleConfig): string {
  const exact = mod.items.find((item) => pathname === item.path);
  if (exact) return exact.path;

  const prefix = mod.items
    .filter((item) => pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return prefix?.path ?? mod.items[0].path;
}

export default function ModuleSubNav({ userPermissions, userRole }: ModuleSubNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mod = getModuleForPath(pathname);

  if (!mod) return null;

  const items = filterNavItems(mod.items, userPermissions, userRole);
  if (items.length === 0) return null;

  const selectedKey = resolveSelectedKey(pathname, mod);

  const menuItems: MenuProps['items'] = items.map((item) => ({
    key: item.path,
    label: item.label,
  }));

  const handleClick: MenuProps['onClick'] = ({ key }) => {
    router.push(key);
  };

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px',
      }}
    >
      <Typography.Title level={5} style={{ margin: '12px 0 0', color: '#595959' }}>
        {mod.label}
      </Typography.Title>
      <Menu
        mode="horizontal"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleClick}
        style={{ borderBottom: 'none', minWidth: 0, flex: 1 }}
      />
    </div>
  );
}
