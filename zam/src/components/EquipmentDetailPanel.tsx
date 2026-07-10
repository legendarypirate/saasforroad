'use client';

import React from 'react';
import { Button, Card, Col, Image, Row, Space, Table, Tag, Typography, Popconfirm } from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from '@/components/admin/primitives';
import { assetUrl, SIDE_LABELS, type EquipmentItem, type OilChangeRecord } from '@/lib/equipment';

const { Title, Text } = Typography;

interface EquipmentDetailPanelProps {
  item: EquipmentItem;
  onAddOil?: (equipmentId: number) => void;
  onDeleteOil?: (equipmentId: number, oilId: number) => void;
  readOnly?: boolean;
}

export default function EquipmentDetailPanel({
  item,
  onAddOil,
  onDeleteOil,
  readOnly = false,
}: EquipmentDetailPanelProps) {
  const oilColumns: ColumnsType<OilChangeRecord> = [
    {
      title: 'Огноо',
      dataIndex: 'changed_at',
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
    },
    { title: 'Тосны төрөл', dataIndex: 'oil_type' },
    {
      title: 'Мот/цаг',
      dataIndex: 'motor_hours_at_change',
      render: (v: number) => (v != null ? Number(v).toLocaleString() : '—'),
    },
    {
      title: 'Литр',
      dataIndex: 'quantity_liters',
      render: (v: number) => (v != null ? v : '—'),
    },
    { title: 'Хэн сольсон', dataIndex: 'changed_by', ellipsis: true },
    { title: 'Тайлбар', dataIndex: 'notes', ellipsis: true },
  ];

  if (!readOnly && onDeleteOil) {
    oilColumns.push({
      title: '',
      key: 'action',
      width: 48,
      render: (_: unknown, record: OilChangeRecord) => (
        <Popconfirm title="Устгах уу?" onConfirm={() => onDeleteOil(item.id, record.id)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    });
  }

  return (
    <div>
      <Title level={5} style={{ marginTop: 0 }}>
        4 талын зураг
      </Title>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {(['photo_front', 'photo_back', 'photo_left', 'photo_right'] as const).map((key) => (
          <Col xs={12} sm={6} key={key}>
            <Card size="small" title={SIDE_LABELS[key]} styles={{ body: { padding: 8 } }}>
              {item[key] ? (
                <Image
                  src={assetUrl(item[key])}
                  alt={SIDE_LABELS[key]}
                  style={{ width: '100%', maxHeight: 140, objectFit: 'cover' }}
                />
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Зураг байхгүй
                </Text>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Title level={5}>Гэрчилгээний зураг</Title>
      <Row style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={8}>
          {item.certificate_image ? (
            <Image src={assetUrl(item.certificate_image)} alt="Гэрчилгээ" style={{ maxHeight: 200 }} />
          ) : (
            <Text type="secondary">Гэрчилгээний зураг байхгүй</Text>
          )}
        </Col>
      </Row>

      {item.notes && (
        <>
          <Title level={5}>Тайлбар</Title>
          <Text style={{ display: 'block', marginBottom: 16 }}>{item.notes}</Text>
        </>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Тос, масло сольсон түүх
        </Title>
        {!readOnly && onAddOil && (
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => onAddOil(item.id)}>
            Сольсон түүх нэмэх
          </Button>
        )}
      </div>
      <Table
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={item.oilChanges ?? []}
        columns={oilColumns}
        locale={{ emptyText: 'Тос сольсон түүх байхгүй' }}
      />
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
      <Tag color="green">Тос: {item.oilChanges?.length ?? 0} удаа</Tag>
    </Space>
  );
}
