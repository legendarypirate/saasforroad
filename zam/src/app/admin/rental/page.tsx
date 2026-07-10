'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import { ReloadOutlined } from '@/components/admin/icons';
import {
  ASSET_CATEGORY_LABELS,
  ASSET_STATUS_LABELS,
  EQUIPMENT_API,
  RENTAL_API,
  RENTAL_STATUS_COLORS,
  RENTAL_STATUS_LABELS,
  formatMnt,
  type AssetCategory,
  type EquipmentRental,
  type RentalStats,
} from '@/lib/equipmentRental';
import type { EquipmentItem } from '@/lib/equipment';

const { Title, Text } = Typography;

export default function RentalDashboardPage() {
  const [stats, setStats] = useState<RentalStats | null>(null);
  const [assets, setAssets] = useState<EquipmentItem[]>([]);
  const [rentals, setRentals] = useState<EquipmentRental[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, aRes, rRes] = await Promise.all([
        fetch(`${RENTAL_API}/stats`),
        fetch(`${EQUIPMENT_API}?is_rentable=true`),
        fetch(`${RENTAL_API}?status=active`),
      ]);
      const [sJson, aJson, rJson] = await Promise.all([sRes.json(), aRes.json(), rRes.json()]);
      if (sJson.success) setStats(sJson.data);
      if (aJson.success) setAssets(aJson.data);
      if (rJson.success) setRentals(rJson.data);
    } catch {
      message.error('Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Түрээс';
    load();
  }, [load]);

  const byCategory = (cat: AssetCategory) => assets.filter((a) => (a.category || 'machine') === cat).length;
  const endingSoon = rentals
    .filter((r) => {
      const end = new Date(`${r.end_date}T12:00:00`);
      const days = (end.getTime() - Date.now()) / 86400000;
      return days >= 0 && days <= 14;
    })
    .slice(0, 8);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Түрээсийн самбар</Title>
          <Text type="secondary">
            Машин тоног, барилгын хэрэгсэл (шон, хүрз, арматур…) — өдрийн үнэ → сарын төлбөр
          </Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={load}>Шинэчлэх</Button>
          <Link href="/admin/rental/assets"><Button>Тоног бүртгэл</Button></Link>
          <Link href="/admin/rental/contracts"><Button type="primary">Гэрээ нэмэх</Button></Link>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small"><Statistic title="Идэвхтэй гэрээ" value={stats?.activeRentals ?? 0} loading={loading} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small"><Statistic title="Сарын орлого (~)" value={formatMnt(stats?.monthlyRevenue)} loading={loading} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small"><Statistic title="Хугацаа хэтэрсэн" value={formatMnt(stats?.overdueAmount)} loading={loading} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small"><Statistic title="Энэ сард төлсөн" value={formatMnt(stats?.paidThisMonth)} loading={loading} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Card size="small" title="Бүртгэлтэй хөрөнгө">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text>Машин / тоног: <b>{byCategory('machine')}</b></Text>
              <Text>Барилгын хэрэгсэл: <b>{byCategory('tool')}</b></Text>
              <Text>Түрээсийн материал: <b>{byCategory('material')}</b></Text>
              <Text type="secondary">Нийт түрээслэх боломжтой: {assets.length}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card size="small" title="14 хоногт дуусах гэрээ">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={endingSoon}
              locale={{ emptyText: 'Ойрын хугацаанд дуусах гэрээ байхгүй' }}
              columns={[
                { title: 'Гэрээ', dataIndex: 'contract_number', width: 120 },
                { title: 'Хөрөнгө', render: (_, r) => r.equipment?.name || '—' },
                { title: 'Компани', dataIndex: 'client_company' },
                { title: 'Дуусах', dataIndex: 'end_date', width: 110 },
                {
                  title: 'Төлөв',
                  dataIndex: 'status',
                  width: 100,
                  render: (v) => <Tag color={RENTAL_STATUS_COLORS[v as keyof typeof RENTAL_STATUS_COLORS]}>{RENTAL_STATUS_LABELS[v as keyof typeof RENTAL_STATUS_LABELS]}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Text type="secondary">
          Тооцоолол: өдрийн үнэ оруулахад сарын төлбөр = өдөр × тухайн сарын түрээсийн хоног (хуваарь автоматаар үүснэ).
          Жишээ: 50,000₮/өдөр × 30 өдөр ≈ 1,500,000₮/сар.
        </Text>
      </Card>
    </div>
  );
}
