'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import { ArrowLeftOutlined, EditOutlined } from '@/components/admin/icons';
import EquipmentFormDrawer from '@/components/EquipmentFormDrawer';
import {
  CertificateTab,
  FinanceTab,
  GeneralTab,
  InspectionTab,
  InsuranceTab,
  OilTab,
  OtherDocsTab,
  PhotosTab,
  ServiceTab,
} from '@/components/equipment/EquipmentProfileTabs';
import {
  EQUIPMENT_API,
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  expiryTone,
  type EquipmentItem,
  type EquipmentStatus,
} from '@/lib/equipment';

const { Title, Text } = Typography;

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [item, setItem] = useState<EquipmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState('general');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${EQUIPMENT_API}/${id}`);
      const json = await res.json();
      if (!json.success) {
        message.error(json.message || 'Олдсонгүй');
        router.replace('/admin/equipment');
        return;
      }
      setItem(json.data);
      document.title = `${json.data.registration_number || json.data.name} | Тоног`;
    } catch {
      message.error('Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !item) {
    return <Spin style={{ display: 'block', margin: '64px auto' }} />;
  }
  if (!item) return null;

  const status = (item.status || 'in_service') as EquipmentStatus;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/admin/equipment">
          <Button type="text" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0 }}>
            Жагсаалт руу
          </Button>
        </Link>
      </div>

      <Card
        bordered={false}
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 70%)',
          borderRadius: 14,
        }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Title level={3} style={{ color: '#fff', margin: '0 0 6px' }}>
              {item.name}
            </Title>
            <Space wrap>
              {item.asset_no && <Tag>{item.asset_no}</Tag>}
              {item.registration_number && <Tag color="blue">{item.registration_number}</Tag>}
              {item.model && <Tag>{item.model}</Tag>}
              <Tag color={EQUIPMENT_STATUS_COLORS[status] || 'default'}>
                {EQUIPMENT_STATUS_LABELS[status] || item.status}
              </Tag>
              <Tag color={expiryTone(item.insurance_expiry)}>
                Даатгал {item.insurance_expiry || '—'}
              </Tag>
              <Tag color={expiryTone(item.certificate_expiry)}>
                Гэрчилгээ {item.certificate_expiry || '—'}
              </Tag>
            </Space>
            {item.site && (
              <Text style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
                Талбай: {item.site}
              </Text>
            )}
          </div>
          <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
            Ерөнхий засах
          </Button>
        </div>
      </Card>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'general',
            label: 'Ерөнхий',
            children: <GeneralTab item={item} onSaved={setItem} />,
          },
          {
            key: 'photos',
            label: 'Зураг',
            children: <PhotosTab item={item} onSaved={setItem} />,
          },
          {
            key: 'service',
            label: 'ТО, Засвар',
            children: <ServiceTab item={item} onRefresh={load} />,
          },
          {
            key: 'insurance',
            label: 'Даатгал',
            children: <InsuranceTab item={item} onSaved={setItem} />,
          },
          {
            key: 'inspection',
            label: 'Оношилгоо',
            children: <InspectionTab item={item} onSaved={setItem} />,
          },
          {
            key: 'oil',
            label: 'Тос масло',
            children: <OilTab item={item} onSaved={setItem} onRefresh={load} />,
          },
          {
            key: 'certificate',
            label: 'Гэрчилгээ',
            children: <CertificateTab item={item} onSaved={setItem} />,
          },
          {
            key: 'other-docs',
            label: 'Бусад баримт',
            children: <OtherDocsTab item={item} onSaved={setItem} onRefresh={load} />,
          },
          {
            key: 'finance',
            label: 'Орлого, Ашиг',
            children: <FinanceTab item={item} onRefresh={load} />,
          },
        ]}
      />

      <EquipmentFormDrawer
        open={editOpen}
        editing={item}
        onClose={() => setEditOpen(false)}
        onSaved={(data) => {
          message.success('Хадгалагдлаа');
          setItem(data);
        }}
      />
    </div>
  );
}
