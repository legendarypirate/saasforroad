'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Collapse,
  Modal,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import {
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  ToolOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import EquipmentDetailPanel, { EquipmentSummaryLabel } from '@/components/EquipmentDetailPanel';
import { EQUIPMENT_API, type EquipmentItem } from '@/lib/equipment';

const { Title, Text } = Typography;
const baseUrl = process.env.NEXT_PUBLIC_API_URL;

interface ProjectEquipmentTabProps {
  projectId: string;
}

export default function ProjectEquipmentTab({ projectId }: ProjectEquipmentTabProps) {
  const router = useRouter();
  const [assigned, setAssigned] = useState<EquipmentItem[]>([]);
  const [catalog, setCatalog] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  const fetchAssigned = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/project_equipment?project_id=${projectId}`);
      const result = await res.json();
      if (result.success) {
        setAssigned(result.data);
      }
    } catch {
      message.error('Тоног төхөөрөмж ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchCatalog = useCallback(async () => {
    const res = await fetch(EQUIPMENT_API);
    const result = await res.json();
    if (result.success) {
      setCatalog(result.data);
    }
  }, []);

  useEffect(() => {
    fetchAssigned();
  }, [fetchAssigned]);

  const assignedIds = new Set(assigned.map((a) => a.id));
  const availableToAssign = catalog.filter((e) => !assignedIds.has(e.id));

  const openAssignModal = async () => {
    await fetchCatalog();
    setSelectedEquipmentId(null);
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedEquipmentId) {
      message.warning('Тоног төхөөрөмж сонгоно уу');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`${baseUrl}/api/project_equipment/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: Number(projectId),
          equipment_id: selectedEquipmentId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        message.success('Төсөлд холбогдлоо');
        setAssignOpen(false);
        fetchAssigned();
      } else {
        message.error(result.message || 'Алдаа гарлаа');
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (equipmentId: number) => {
    const res = await fetch(
      `${baseUrl}/api/project_equipment/unassign?project_id=${projectId}&equipment_id=${equipmentId}`,
      { method: 'DELETE' }
    );
    const result = await res.json();
    if (result.success) {
      message.success('Төслөөс хасагдлаа (бүртгэл хэвээр)');
      fetchAssigned();
    }
  };

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            Энэ төслийн тоног төхөөрөмж
          </Title>
          <Text type="secondary">
            Бүртгэлийг{' '}
            <a onClick={() => router.push('/admin/equipment')} style={{ cursor: 'pointer' }}>
              Тоног төхөөрөмж
            </a>{' '}
            цэснээс удирдана
          </Text>
        </div>
        <Space wrap>
          <Button icon={<ToolOutlined />} onClick={() => router.push('/admin/equipment')}>
            Бүртгэл рүү
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => router.push('/admin/equipment')}>
            Шинэ бүртгэл
          </Button>
          <Button type="primary" icon={<LinkOutlined />} onClick={openAssignModal}>
            Төсөлд холбох
          </Button>
        </Space>
      </div>

      {assigned.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Энэ төсөлд холбогдсон тоног төхөөрөмж байхгүй
          </Text>
          <Space>
            <Button type="primary" icon={<LinkOutlined />} onClick={openAssignModal}>
              Бүртгэлээс холбох
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => router.push('/admin/equipment')}>
              Шинээр бүртгэх
            </Button>
          </Space>
        </Card>
      ) : (
        <Collapse
          items={assigned.map((item) => ({
            key: String(item.id),
            label: <EquipmentSummaryLabel item={item} />,
            extra: (
              <Space onClick={(e) => e.stopPropagation()}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => router.push(`/admin/equipment?id=${item.id}`)}
                >
                  Засах
                </Button>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DisconnectOutlined />}
                  onClick={() => handleUnassign(item.id)}
                >
                  Хасах
                </Button>
              </Space>
            ),
            children: (
              <EquipmentDetailPanel item={item} readOnly />
            ),
          }))}
        />
      )}

      <Modal
        title="Төсөлд тоног төхөөрөмж холбох"
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={handleAssign}
        confirmLoading={assigning}
        okText="Холбох"
        cancelText="Болих"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Бүртгэлийн сангаас сонгоно. Шинэ нэмэх бол «Шинэ бүртгэл» товчийг ашиглана.
        </Text>
        <Select
          showSearch
          placeholder="Тоног төхөөрөмж сонгох"
          style={{ width: '100%' }}
          value={selectedEquipmentId ?? undefined}
          onChange={setSelectedEquipmentId}
          optionFilterProp="label"
          options={availableToAssign.map((e) => ({
            value: e.id,
            label: `${e.name}${e.registration_number ? ` (${e.registration_number})` : ''}`,
          }))}
          notFoundContent={
            <span>
              Боломжтой төхөөрөмж байхгүй.{' '}
              <a onClick={() => router.push('/admin/equipment')}>Бүртгэлд нэмэх</a>
            </span>
          }
        />
      </Modal>
    </Spin>
  );
}
