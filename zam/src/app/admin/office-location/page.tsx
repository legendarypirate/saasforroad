'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
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
} from 'antd';
import { DeleteOutlined, EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';
import { OFFICE_API, type OfficeLocation } from '@/lib/officeLocation';

const { Title, Text } = Typography;

const DEFAULT_CENTER = { lat: 47.9189, lng: 106.917 };
const MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyA8GWeisB2WJgvOOVfKeG6VitUq1yxuXUo';

declare global {
  interface Window {
    google: any;
    initOfficeMap: () => void;
  }
}

export default function OfficeLocationPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<OfficeLocation | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [form] = Form.useForm();

  const radius = Form.useWatch('radius_meters', form) ?? 100;

  const fetchOffices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(OFFICE_API);
      const json = await res.json();
      if (json.success) setOffices(json.data);
    } catch {
      message.error('Оффисын жагсаалт ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  const selectOfficeRef = useRef<(office: OfficeLocation) => void>(() => {});

  const updateEditMarker = useCallback((lat: number, lng: number, radiusM: number) => {
    if (!mapInstance.current || !window.google) return;

    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        map: mapInstance.current,
        draggable: true,
      });
      markerRef.current.addListener('dragend', () => {
        const pos = markerRef.current?.getPosition();
        if (pos) {
          form.setFieldsValue({ latitude: pos.lat(), longitude: pos.lng() });
          updateEditMarker(pos.lat(), pos.lng(), form.getFieldValue('radius_meters') ?? 100);
        }
      });
    }

    markerRef.current.setPosition({ lat, lng });

    if (circleRef.current) circleRef.current.setMap(null);
    circleRef.current = new window.google.maps.Circle({
      map: mapInstance.current,
      center: { lat, lng },
      radius: radiusM,
      fillColor: '#1890ff',
      fillOpacity: 0.15,
      strokeColor: '#1890ff',
      strokeOpacity: 0.8,
      strokeWeight: 2,
    });
  }, [form]);

  const selectOffice = useCallback((office: OfficeLocation) => {
    setSelected(office);
    form.setFieldsValue({
      name: office.name,
      address: office.address,
      latitude: Number(office.latitude),
      longitude: Number(office.longitude),
      radius_meters: office.radius_meters ?? 100,
      is_active: office.is_active,
    });
    if (mapsReady && mapInstance.current && window.google) {
      const lat = Number(office.latitude);
      const lng = Number(office.longitude);
      updateEditMarker(lat, lng, office.radius_meters ?? 100);
      mapInstance.current.panTo({ lat, lng });
      mapInstance.current.setZoom(15);
    }
  }, [form, mapsReady, updateEditMarker]);

  useEffect(() => {
    selectOfficeRef.current = selectOffice;
  }, [selectOffice]);

  const renderOfficeMarkers = useCallback((items: OfficeLocation[]) => {
    if (!mapInstance.current || !window.google) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = items.map((office) => {
      const lat = Number(office.latitude);
      const lng = Number(office.longitude);
      const marker = new window.google.maps.Marker({
        map: mapInstance.current!,
        position: { lat, lng },
        title: office.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: office.is_active ? '#1890ff' : '#bfbfbf',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#fff',
        },
      });
      marker.addListener('click', () => selectOfficeRef.current(office));
      return marker;
    });
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps || mapInstance.current) return;

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
    });

    mapInstance.current.addListener('click', (e: any) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      form.setFieldsValue({ latitude: lat, longitude: lng });
      updateEditMarker(lat, lng, form.getFieldValue('radius_meters') ?? 100);
    });

    setMapsReady(true);
  }, [form, updateEditMarker]);

  useEffect(() => {
    window.initOfficeMap = initMap;
    initMap();

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapInstance.current = null;
      mapFormInitialized.current = false;
      setMapsReady(false);
    };
  }, [initMap]);

  useEffect(() => {
    if (mapsReady) renderOfficeMarkers(offices);
  }, [mapsReady, offices, renderOfficeMarkers]);

  useEffect(() => {
    if (!mapsReady || !selected) return;
    const lat = Number(form.getFieldValue('latitude'));
    const lng = Number(form.getFieldValue('longitude'));
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      updateEditMarker(lat, lng, radius);
      mapInstance.current?.panTo({ lat, lng });
    }
  }, [mapsReady, selected, radius, form, updateEditMarker]);

  const startNew = useCallback(() => {
    setSelected(null);
    form.resetFields();
    form.setFieldsValue({
      radius_meters: 100,
      is_active: true,
      latitude: DEFAULT_CENTER.lat,
      longitude: DEFAULT_CENTER.lng,
    });
    if (mapsReady) {
      updateEditMarker(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, 100);
      mapInstance.current?.panTo(DEFAULT_CENTER);
    }
  }, [form, mapsReady, updateEditMarker]);

  const saveOffice = async () => {
    const values = await form.validateFields();
    const payload = {
      name: values.name,
      address: values.address,
      latitude: values.latitude,
      longitude: values.longitude,
      radius_meters: values.radius_meters ?? 100,
      is_active: values.is_active !== false,
    };

    const url = selected ? `${OFFICE_API}/${selected.id}` : OFFICE_API;
    const res = await fetch(url, {
      method: selected ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) {
      message.error(json.message || 'Хадгалахад алдаа');
      return;
    }
    message.success(selected ? 'Шинэчлэгдлээ' : 'Оффис нэмэгдлээ');
    setSelected(json.data);
    fetchOffices();
  };

  const deleteOffice = async (id: number) => {
    const res = await fetch(`${OFFICE_API}/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      message.success('Устгагдлаа');
      if (selected?.id === id) startNew();
      fetchOffices();
    }
  };

  const mapFormInitialized = useRef(false);

  useEffect(() => {
    document.title = 'Оффисын байршил';
  }, []);

  useEffect(() => {
    if (mapsReady && !mapFormInitialized.current) {
      mapFormInitialized.current = true;
      startNew();
    }
  }, [mapsReady, startNew]);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&callback=initOfficeMap`}
        strategy="afterInteractive"
        onLoad={initMap}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Оффисын байршил</Title>
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
            renderItem={(item) => (
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
          <div
            ref={mapRef}
            style={{ flex: 1, minHeight: 400, borderRadius: 12, border: '1px solid #f0f0f0' }}
          />

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
