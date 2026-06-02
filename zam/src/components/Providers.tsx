'use client';

import { ConfigProvider } from 'antd';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0F4C81',
          borderRadius: 10,
          fontFamily: 'var(--font-nunito), Nunito, system-ui, sans-serif',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
