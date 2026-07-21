'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Space, Tag, Typography } from '@/components/admin/primitives';
import { EyeOutlined } from '@/components/admin/icons';
import {
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  expiryTone,
  latestInsurance,
  type EquipmentItem,
  type EquipmentStatus,
} from '@/lib/equipment';

const { Text } = Typography;

/** Compact read-only summary (e.g. project tab). Full editing lives on /admin/equipment/[id]. */
export default function EquipmentDetailPanel({
  item,
  readOnly = true,
}: {
  item: EquipmentItem;
  readOnly?: boolean;
  onRefresh?: () => void;
}) {
  const status = (item.status || 'in_service') as EquipmentStatus;
  return (
    <div>
      <Space wrap style={{ marginBottom: 12 }}>
        <Tag color={EQUIPMENT_STATUS_COLORS[status] || 'default'}>
          {EQUIPMENT_STATUS_LABELS[status] || item.status}
        </Tag>
        {item.registration_number && <Tag color="blue">{item.registration_number}</Tag>}
        <Tag color="orange">Мот/цаг: {Number(item.motor_hours ?? 0).toLocaleString()}</Tag>
        <Tag color={expiryTone(latestInsurance(item)?.expiry)}>Даатгал</Tag>
      </Space>
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        {[item.model, item.site, item.serial_number].filter(Boolean).join(' · ') || 'Нэмэлт мэдээлэл байхгүй'}
      </Text>
      <Link href={`/admin/equipment/${item.id}`}>
        <Button type="primary" size="small" icon={<EyeOutlined />}>
          Дэлгэрэнгүй профайл
        </Button>
      </Link>
    </div>
  );
}

export function EquipmentSummaryLabel({ item }: { item: EquipmentItem }) {
  return (
    <Space wrap>
      <Text strong>{item.name}</Text>
      {item.model && <Tag>{item.model}</Tag>}
      {item.registration_number && <Tag color="blue">{item.registration_number}</Tag>}
      <Tag color="orange">Мот/цаг: {Number(item.motor_hours ?? 0).toLocaleString()}</Tag>
    </Space>
  );
}
