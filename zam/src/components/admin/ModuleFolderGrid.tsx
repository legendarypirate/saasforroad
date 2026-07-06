'use client';

import React from 'react';
import { Row, Col, Typography } from 'antd';
import {
  ProjectOutlined,
  DropboxOutlined,
  IdcardOutlined,
  FileDoneOutlined,
  HomeOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  AccountBookOutlined,
  EnvironmentOutlined,
  RobotOutlined,
  SkinOutlined,
  ToolOutlined,
  TeamOutlined,
  ExperimentOutlined,
  SolutionOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
  filterModules,
  filterDataFolders,
  getDefaultModulePath,
  type ModuleConfig,
} from '@/config/adminNavigation';

const MODULE_ICONS: Record<string, React.ReactNode> = {
  operations: <ProjectOutlined />,
  inventory: <DropboxOutlined />,
  hr: <IdcardOutlined />,
  homepage: <HomeOutlined />,
  tender: <FileTextOutlined />,
  documents: <FileDoneOutlined />,
  finance: <AccountBookOutlined />,
  gps: <EnvironmentOutlined />,
  'ai-tender': <RobotOutlined />,
  'uniform-supply': <SkinOutlined />,
  'data-technique': <ToolOutlined />,
  'data-brigade': <TeamOutlined />,
  'data-laboratory': <ExperimentOutlined />,
  'data-job-seeker': <SolutionOutlined />,
  'data-production': <BuildOutlined />,
};

interface ModuleFolderGridProps {
  userPermissions: string[];
  userRole?: string;
}

function ModuleFolder({
  mod,
  userPermissions,
  onOpen,
}: {
  mod: ModuleConfig;
  userPermissions: string[];
  onOpen: (path: string) => void;
}) {
  const itemCount = mod.items.length;
  const isComingSoon = Boolean(mod.comingSoon);

  const handleOpen = () => {
    if (isComingSoon) return;
    onOpen(getDefaultModulePath(mod, userPermissions));
  };

  return (
    <div
      role={isComingSoon ? undefined : 'button'}
      tabIndex={isComingSoon ? undefined : 0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (isComingSoon) return;
        if (e.key === 'Enter' || e.key === ' ') {
          handleOpen();
        }
      }}
      style={{
        background: isComingSoon ? '#fafafa' : '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 12,
        padding: '28px 24px',
        cursor: isComingSoon ? 'not-allowed' : 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        opacity: isComingSoon ? 0.72 : 1,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (isComingSoon) return;
        e.currentTarget.style.borderColor = mod.color;
        e.currentTarget.style.boxShadow = `0 8px 24px ${mod.color}33`;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        if (isComingSoon) return;
        e.currentTarget.style.borderColor = '#e8e8e8';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {isComingSoon && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: '#f0f0f0',
            color: '#8c8c8c',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 20,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}
        >
          Coming soon
        </span>
      )}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          background: `${mod.color}18`,
          color: mod.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          marginBottom: 16,
          position: 'relative',
          filter: isComingSoon ? 'grayscale(0.35)' : undefined,
        }}
      >
        {MODULE_ICONS[mod.id]}
        <FolderOpenOutlined
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            fontSize: 22,
            color: mod.color,
            background: isComingSoon ? '#fafafa' : '#fff',
            borderRadius: 4,
            padding: 2,
          }}
        />
      </div>
      <Typography.Title
        level={4}
        style={{ margin: '0 0 8px', color: isComingSoon ? '#8c8c8c' : '#262626' }}
      >
        {mod.label}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5 }}>
        {mod.description}
      </Typography.Text>
      {!isComingSoon && (
        <Typography.Text
          style={{
            marginTop: 12,
            fontSize: 12,
            color: mod.color,
            fontWeight: 500,
          }}
        >
          {itemCount} дэд цэс
        </Typography.Text>
      )}
    </div>
  );
}

function FolderSection({
  title,
  description,
  folders,
  userPermissions,
  onOpen,
}: {
  title: string;
  description: string;
  folders: ModuleConfig[];
  userPermissions: string[];
  onOpen: (path: string) => void;
}) {
  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 8, color: '#082c5c' }}>
        {title}
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 28 }}>
        {description}
      </Typography.Paragraph>
      <Row gutter={[24, 24]}>
        {folders.map((mod) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={mod.id}>
            <ModuleFolder mod={mod} userPermissions={userPermissions} onOpen={onOpen} />
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default function ModuleFolderGrid({ userPermissions, userRole }: ModuleFolderGridProps) {
  const router = useRouter();
  const modules = filterModules(userPermissions, userRole);
  const dataFolders = filterDataFolders();

  const handleOpen = (path: string) => {
    router.push(path);
  };

  return (
    <div>
      <FolderSection
        title="Модуль сонгох"
        description="ERP системийн модулуудыг сонгон ажиллана уу"
        folders={modules}
        userPermissions={userPermissions}
        onOpen={handleOpen}
      />
      <div style={{ marginTop: 48 }}>
        <FolderSection
          title="Дата"
          description="Компанийн мэдээллийн сан, дата модулууд"
          folders={dataFolders}
          userPermissions={userPermissions}
          onOpen={handleOpen}
        />
      </div>
    </div>
  );
}
