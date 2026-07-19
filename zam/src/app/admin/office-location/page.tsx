'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  List,
  Popconfirm,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import { DeleteOutlined, EnvironmentOutlined, PlusOutlined } from '@/components/admin/icons';
import {
  OFFICE_API,
  type OfficeLocation,
  type OfficeLocationFormValues,
  type OfficeLocationPayload,
} from '@/lib/officeLocation';
import type { OfficeMapEditPoint } from '@/components/admin/office-location/OfficeLocationMap';

const { Text } = Typography;

const DEFAULT_CENTER = { lat: 47.9189, lng: 106.917 };

const OfficeLocationMap = dynamic(
  () => import('@/components/admin/office-location/OfficeLocationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[400px] flex-1 items-center justify-center rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground">
        Газрын зураг ачаалж байна…
      </div>
    ),
  },
);

export default function OfficeLocationPage() {
  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<OfficeLocation | null>(null);
  const [editPoint, setEditPoint] = useState<OfficeMapEditPoint | null>(null);
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [form] = Form.useForm<OfficeLocationFormValues>();

  const radius = Form.useWatch('radius_meters', form) ?? 100;
  const latitude = Form.useWatch('latitude', form);
  const longitude = Form.useWatch('longitude', form);

  const fetchOffices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(OFFICE_API);
      const json = (await res.json()) as { success?: boolean; data?: OfficeLocation[] };
      if (json.success && Array.isArray(json.data)) setOffices(json.data);
    } catch {
      message.error('Оффисын жагсаалт ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  useEffect(() => {
    document.title = 'Оффисын байршил';
  }, []);

  useEffect(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const radiusMeters = Number(radius) || 100;
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    setEditPoint({ lat, lng, radiusMeters });
  }, [latitude, longitude, radius]);

  useEffect(() => {
    form.setFieldsValue({
      radius_meters: 100,
      is_active: true,
      latitude: DEFAULT_CENTER.lat,
      longitude: DEFAULT_CENTER.lng,
    });
    setEditPoint({
      lat: DEFAULT_CENTER.lat,
      lng: DEFAULT_CENTER.lng,
      radiusMeters: 100,
    });
    setFocus([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);
  }, [form]);

  const selectOffice = useCallback(
    (office: OfficeLocation) => {
      const lat = Number(office.latitude);
      const lng = Number(office.longitude);
      const radiusMeters = office.radius_meters ?? 100;

      setSelected(office);
      form.setFieldsValue({
        name: office.name,
        address: office.address,
        latitude: lat,
        longitude: lng,
        radius_meters: radiusMeters,
        is_active: office.is_active,
      });
      setEditPoint({ lat, lng, radiusMeters });
      setFocus([lat, lng]);
    },
    [form],
  );

  const startNew = useCallback(() => {
    setSelected(null);
    form.resetFields();
    form.setFieldsValue({
      radius_meters: 100,
      is_active: true,
      latitude: DEFAULT_CENTER.lat,
      longitude: DEFAULT_CENTER.lng,
    });
    setEditPoint({
      lat: DEFAULT_CENTER.lat,
      lng: DEFAULT_CENTER.lng,
      radiusMeters: 100,
    });
    setFocus([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);
  }, [form]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      form.setFieldsValue({ latitude: lat, longitude: lng });
      setEditPoint((prev) => ({
        lat,
        lng,
        radiusMeters: prev?.radiusMeters ?? form.getFieldValue('radius_meters') ?? 100,
      }));
    },
    [form],
  );

  const handleEditDrag = useCallback(
    (lat: number, lng: number) => {
      form.setFieldsValue({ latitude: lat, longitude: lng });
      setEditPoint((prev) => ({
        lat,
        lng,
        radiusMeters: prev?.radiusMeters ?? form.getFieldValue('radius_meters') ?? 100,
      }));
    },
    [form],
  );

  const saveOffice = async () => {
    try {
      const values = await form.validateFields();
      const payload: OfficeLocationPayload = {
        name: values.name,
        address: values.address,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        radius_meters: Number(values.radius_meters) || 100,
        is_active: values.is_active !== false,
      };

      const url = selected ? `${OFFICE_API}/${selected.id}` : OFFICE_API;
      const res = await fetch(url, {
        method: selected ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: OfficeLocation;
      };

      if (!json.success) {
        message.error(json.message || 'Хадгалахад алдаа');
        return;
      }

      message.success(selected ? 'Шинэчлэгдлээ' : 'Оффис нэмэгдлээ');
      if (json.data) setSelected(json.data);
      fetchOffices();
    } catch {
      // form validation errors are handled by Form
    }
  };

  const deleteOffice = async (id: number) => {
    const res = await fetch(`${OFFICE_API}/${id}`, { method: 'DELETE' });
    const json = (await res.json()) as { success?: boolean };
    if (json.success) {
      message.success('Устгагдлаа');
      if (selected?.id === id) startNew();
      fetchOffices();
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Text type="secondary">
            Газрын зураг дээр дарж pin тавина. Ажилчин {radius}м радиуст ирц бүртгэнэ.
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={startNew}>
          Шинэ оффис
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, minHeight: 560 }}>
        <Card size="small" title="Оффисууд" styles={{ body: { padding: 0 } }}>
          <List
            loading={loading}
            dataSource={offices}
            locale={{ emptyText: 'Оффис байхгүй' }}
            renderItem={(item: OfficeLocation) => (
              <List.Item
                style={{
                  cursor: 'pointer',
                  background: selected?.id === item.id ? '#e6f4ff' : undefined,
                  padding: '12px 16px',
                }}
                onClick={() => selectOffice(item)}
                actions={[
                  <Popconfirm key="del" title="Устгах уу?" onConfirm={() => deleteOffice(item.id)}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<EnvironmentOutlined style={{ color: '#1890ff', fontSize: 18 }} />}
                  title={
                    <Space>
                      {item.name}
                      {!item.is_active && <Tag>Идэвхгүй</Tag>}
                    </Space>
                  }
                  description={`${item.radius_meters ?? 100}м радиус · ${item.address || '—'}`}
                />
              </List.Item>
            )}
          />
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ flex: 1, minHeight: 400, borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
            <OfficeLocationMap
              offices={offices}
              selectedId={selected?.id ?? null}
              editPoint={editPoint}
              focus={focus}
              onSelectOffice={selectOffice}
              onMapClick={handleMapClick}
              onEditDrag={handleEditDrag}
            />
          </div>

          <Card size="small" title={selected ? 'Оффис засах' : 'Шинэ оффис'}>
            <Form form={form} layout="vertical" onFinish={saveOffice}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item name="name" label="Оффисын нэр" rules={[{ required: true }]}>
                  <Input placeholder="Үндсэн оффис, Салбар 1..." />
                </Form.Item>
                <Form.Item name="address" label="Хаяг">
                  <Input placeholder="Дүүрэг, хороо, гудамж" />
                </Form.Item>
                <Form.Item name="latitude" label="Latitude" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} step={0.000001} />
                </Form.Item>
                <Form.Item name="longitude" label="Longitude" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} step={0.000001} />
                </Form.Item>
                <Form.Item name="radius_meters" label="Ирцийн радиус (метр)">
                  <InputNumber min={50} max={500} style={{ width: '100%' }} addonAfter="м" />
                </Form.Item>
                <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </div>
              <Button type="primary" htmlType="submit">
                Хадгалах
              </Button>
            </Form>
          </Card>
        </div>
      </div>
    </>
  );
}
