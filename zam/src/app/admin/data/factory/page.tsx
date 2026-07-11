'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PlusOutlined,
} from '@/components/admin/icons';
import {
  Button,
  Input,
  InputNumber,
  Select,
  Tag,
  message,
} from '@/components/admin/primitives';
import {
  PLANT_STATUSES,
  PLANT_TYPES,
  PRODUCT_TYPES,
  createPlantRecord,
  deletePlantRecord,
  fetchPlantList,
  plantTypeLabel,
} from '@/lib/plant';
import { cn } from '@/lib/utils';

const MONGOLIA_CENTER = { lat: 46.8625, lng: 103.8467 };
const MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyA8GWeisB2WJgvOOVfKeG6VitUq1yxuXUo';

const TYPE_COLORS: Record<string, string> = {
  asphalt: '#b45309',
  cement: '#64748b',
  crushing: '#0d9488',
  emulsion: '#7c3aed',
  ctb: '#2563eb',
  other: '#78716c',
};

/** Factory / plant pin icon as SVG data URL for Google Maps markers. */
function plantMarkerIcon(fill = '#b45309', size = 44) {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 56">
  <path d="M24 54c0 0-16-15.2-16-28a16 16 0 1 1 32 0c0 12.8-16 28-16 28z" fill="${fill}" stroke="#fff" stroke-width="2.5"/>
  <g fill="#fff" transform="translate(12,10)">
    <rect x="2" y="12" width="20" height="14" rx="1"/>
    <rect x="4" y="4" width="5" height="10" rx="0.5"/>
    <rect x="11" y="7" width="4" height="7" rx="0.5"/>
    <rect x="17" y="2" width="4" height="12" rx="0.5"/>
    <rect x="4.5" y="1" width="2" height="3" rx="0.5"/>
    <rect x="17.5" y="0" width="2" height="2" rx="0.5"/>
    <rect x="6" y="16" width="3" height="4" fill="${fill}" opacity="0.85"/>
    <rect x="11" y="16" width="3" height="4" fill="${fill}" opacity="0.85"/>
    <rect x="16" y="16" width="3" height="4" fill="${fill}" opacity="0.85"/>
  </g>
</svg>`.trim();

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: size, height: size },
    anchor: { x: size / 2, y: size },
  };
}

declare global {
  interface Window {
    google: any;
    initFactoryMap: () => void;
  }
}

type ProductDraft = {
  key: string;
  name: string;
  product_type: string;
  grade: string;
  unit: string;
  unit_price_default: number | string;
};

type FactorySite = {
  id: number;
  code?: string | null;
  name: string;
  plant_type: string;
  location?: string | null;
  aimag?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  capacity_per_hour?: number | string | null;
  capacity_unit?: string | null;
  status: string;
  manager_name?: string | null;
  phone?: string | null;
  notes?: string | null;
  products?: Array<{
    id: number;
    name: string;
    product_type: string;
    grade?: string | null;
    unit?: string | null;
    unit_price_default?: number | string | null;
  }>;
};

type FormState = {
  code: string;
  name: string;
  plant_type: string;
  location: string;
  aimag: string;
  latitude: number | null;
  longitude: number | null;
  capacity_per_hour: string;
  capacity_unit: string;
  status: string;
  manager_name: string;
  phone: string;
  notes: string;
  products: ProductDraft[];
};

type PanelMode = 'list' | 'detail' | 'create';

const emptyForm = (): FormState => ({
  code: '',
  name: '',
  plant_type: 'asphalt',
  location: '',
  aimag: '',
  latitude: null,
  longitude: null,
  capacity_per_hour: '',
  capacity_unit: 'тн',
  status: 'active',
  manager_name: '',
  phone: '',
  notes: '',
  products: [],
});

function newProductDraft(): ProductDraft {
  return {
    key: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    product_type: 'asphalt_mix',
    grade: '',
    unit: 'тн',
    unit_price_default: 0,
  };
}

function hasCoords(site: FactorySite) {
  const lat = Number(site.latitude);
  const lng = Number(site.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function statusLabel(v?: string) {
  return PLANT_STATUSES.find((s) => s.value === v)?.label || v || '—';
}

function productTypeLabel(v?: string) {
  return PRODUCT_TYPES.find((t) => t.value === v)?.label || v || '—';
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === '') return null;
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="min-w-0 break-words text-foreground">{value}</div>
    </div>
  );
}

export default function FactoryMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const pinRef = useRef<any>(null);
  const selectRef = useRef<(site: FactorySite) => void>(() => {});
  const placingRef = useRef(false);

  const [sites, setSites] = useState<FactorySite[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<PanelMode>('list');
  const [selected, setSelected] = useState<FactorySite | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [q, setQ] = useState('');
  const [filterType, setFilterType] = useState('');

  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlantList<FactorySite>('sites');
      setSites(data);
      setSelected((prev) => (prev ? data.find((s) => s.id === prev.id) || null : null));
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Үйлдвэр татахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Үйлдвэр — Газрын зураг';
    loadSites();
  }, [loadSites]);

  const filtered = useMemo(() => {
    return sites.filter((s) => {
      if (filterType && s.plant_type !== filterType) return false;
      if (!q.trim()) return true;
      const hay = `${s.name} ${s.code || ''} ${s.aimag || ''} ${s.location || ''}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [sites, q, filterType]);

  const setPin = useCallback((lat: number, lng: number) => {
    if (!mapInstance.current || !window.google) return;
    const icon = plantMarkerIcon('#dc2626', 48);
    if (!pinRef.current) {
      pinRef.current = new window.google.maps.Marker({
        map: mapInstance.current,
        draggable: true,
        zIndex: 999,
        title: 'Шинэ байршил',
        animation: window.google.maps.Animation?.DROP,
        icon: {
          url: icon.url,
          scaledSize: new window.google.maps.Size(icon.scaledSize.width, icon.scaledSize.height),
          anchor: new window.google.maps.Point(icon.anchor.x, icon.anchor.y),
        },
      });
      pinRef.current.addListener('dragend', () => {
        const pos = pinRef.current?.getPosition();
        if (!pos) return;
        setForm((f) => ({ ...f, latitude: pos.lat(), longitude: pos.lng() }));
      });
    } else {
      pinRef.current.setIcon({
        url: icon.url,
        scaledSize: new window.google.maps.Size(icon.scaledSize.width, icon.scaledSize.height),
        anchor: new window.google.maps.Point(icon.anchor.x, icon.anchor.y),
      });
    }
    pinRef.current.setPosition({ lat, lng });
    pinRef.current.setMap(mapInstance.current);
    pinRef.current.setDraggable(true);
  }, []);

  const clearPin = useCallback(() => {
    if (pinRef.current) pinRef.current.setMap(null);
  }, []);

  const backToList = useCallback(() => {
    placingRef.current = false;
    clearPin();
    setMode('list');
    setSelected(null);
    setForm(emptyForm());
  }, [clearPin]);

  const selectSite = useCallback(
    (site: FactorySite) => {
      placingRef.current = false;
      clearPin();
      setSelected(site);
      setMode('detail');
      if (hasCoords(site) && mapInstance.current) {
        const lat = Number(site.latitude);
        const lng = Number(site.longitude);
        mapInstance.current.panTo({ lat, lng });
        mapInstance.current.setZoom(Math.max(mapInstance.current.getZoom() || 6, 10));
      }
    },
    [clearPin],
  );

  useEffect(() => {
    selectRef.current = selectSite;
  }, [selectSite]);

  const openCreate = useCallback(() => {
    setSelected(null);
    setForm({
      ...emptyForm(),
      latitude: null,
      longitude: null,
      products: [newProductDraft()],
    });
    placingRef.current = true;
    clearPin();
    setMode('create');
    mapInstance.current?.panTo(MONGOLIA_CENTER);
    mapInstance.current?.setZoom(5.6);
    message.info('Газрын зураг дээр дарж байршил сонгоно уу');
  }, [clearPin]);

  const renderMarkers = useCallback((items: FactorySite[]) => {
    if (!mapInstance.current || !window.google) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = items.filter(hasCoords).map((site) => {
      const lat = Number(site.latitude);
      const lng = Number(site.longitude);
      const color = TYPE_COLORS[site.plant_type] || TYPE_COLORS.other;
      const icon = plantMarkerIcon(color, 44);
      const marker = new window.google.maps.Marker({
        map: mapInstance.current!,
        position: { lat, lng },
        title: site.name,
        icon: {
          url: icon.url,
          scaledSize: new window.google.maps.Size(icon.scaledSize.width, icon.scaledSize.height),
          anchor: new window.google.maps.Point(icon.anchor.x, icon.anchor.y),
        },
      });
      marker.addListener('click', () => {
        if (placingRef.current) return;
        selectRef.current(site);
      });
      return marker;
    });
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps || mapInstance.current) return;

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: MONGOLIA_CENTER,
      zoom: 5.6,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: 'greedy',
    });

    mapInstance.current.addListener('click', (e: any) => {
      if (!placingRef.current || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
      setPin(lat, lng);
    });

    setMapsReady(true);
  }, [setPin]);

  useEffect(() => {
    window.initFactoryMap = initMap;
    if (window.google?.maps) initMap();
    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (pinRef.current) {
        pinRef.current.setMap(null);
        pinRef.current = null;
      }
      mapInstance.current = null;
      setMapsReady(false);
    };
  }, [initMap]);

  useEffect(() => {
    if (mapsReady) renderMarkers(filtered);
  }, [mapsReady, filtered, renderMarkers]);

  const save = async () => {
    if (!form.name.trim()) {
      message.warning('Үйлдвэрийн нэр оруулна уу');
      return;
    }
    if (form.latitude == null || form.longitude == null) {
      message.warning('Газрын зураг дээр дарж байршил сонгоно уу');
      return;
    }

    const products = form.products
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        product_type: p.product_type,
        grade: p.grade || null,
        unit: p.unit || 'тн',
        unit_price_default: Number(p.unit_price_default) || 0,
      }));

    const body = {
      code: form.code.trim() || null,
      name: form.name.trim(),
      plant_type: form.plant_type,
      location: form.location.trim() || null,
      aimag: form.aimag.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
      capacity_per_hour: form.capacity_per_hour ? Number(form.capacity_per_hour) : null,
      capacity_unit: form.capacity_unit || 'тн',
      status: form.status,
      manager_name: form.manager_name.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
      products,
    };

    setSaving(true);
    try {
      const created = await createPlantRecord('sites', body);
      message.success('Үйлдвэр нэмэгдлээ');
      placingRef.current = false;
      clearPin();
      setForm(emptyForm());
      await loadSites();
      if (created && typeof created === 'object' && 'id' in created) {
        selectSite(created as FactorySite);
      } else {
        setMode('list');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Хадгалахад алдаа');
    } finally {
      setSaving(false);
    }
  };

  const remove = (site: FactorySite) => {
    if (!window.confirm(`"${site.name}" үйлдвэрийг устгах уу?`)) return;
    deletePlantRecord('sites', site.id)
      .then(() => {
        message.success('Устгагдлаа');
        backToList();
        loadSites();
      })
      .catch((err) => message.error(err instanceof Error ? err.message : 'Устгахад алдаа'));
  };

  const mappedCount = sites.filter(hasCoords).length;
  const pinReady = form.latitude != null && form.longitude != null;

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[560px] flex-col gap-3 p-4 sm:p-6">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&callback=initFactoryMap`}
        strategy="afterInteractive"
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Үйлдвэр — Газрын зураг</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Бүртгэлтэй үйлдвэр дээр дарж мэдээлэл харна · нэмэхэд зураг дээр дарж байршил сонгоно
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <EnvironmentOutlined />
          <span>
            {mappedCount}/{sites.length} байршилтай
          </span>
          {mode !== 'create' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Үйлдвэр нэмэх
            </Button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[360px_1fr]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          {mode === 'create' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-border p-3">
                <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={backToList}>
                  Болих
                </Button>
                <span className="text-sm font-semibold">Шинэ үйлдвэр</span>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                <div
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs',
                    pinReady
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
                  )}
                >
                  {pinReady
                    ? `Байршил: ${form.latitude!.toFixed(5)}, ${form.longitude!.toFixed(5)} — чирж засна`
                    : 'Газрын зураг дээр дарж байршил сонгоно уу'}
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Нэр *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Жишээ: Дархан асфальт үйлдвэр"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Код</label>
                    <Input
                      value={form.code}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Төрөл</label>
                    <Select
                      className="w-full"
                      value={form.plant_type}
                      onChange={(v) => setForm((f) => ({ ...f, plant_type: v }))}
                      options={PLANT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Аймаг / хот</label>
                    <Input
                      value={form.aimag}
                      onChange={(e) => setForm((f) => ({ ...f, aimag: e.target.value }))}
                      placeholder="Дархан-Уул"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Төлөв</label>
                    <Select
                      className="w-full"
                      value={form.status}
                      onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                      options={PLANT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Хаяг</label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Чадал / цаг</label>
                    <Input
                      value={form.capacity_per_hour}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, capacity_per_hour: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Нэгж</label>
                    <Input
                      value={form.capacity_unit}
                      onChange={(e) => setForm((f) => ({ ...f, capacity_unit: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Менежер</label>
                    <Input
                      value={form.manager_name}
                      onChange={(e) => setForm((f) => ({ ...f, manager_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Утас</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Тэмдэглэл</label>
                  <Input.TextArea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                <div className="border-t border-border pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Бүтээгдэхүүн</h3>
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          products: [...f.products, newProductDraft()],
                        }))
                      }
                    >
                      Нэмэх
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {form.products.map((p, idx) => (
                      <div key={p.key} className="rounded-lg border border-border p-2.5">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                products: f.products.filter((x) => x.key !== p.key),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Нэр"
                            value={p.name}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                products: f.products.map((x) =>
                                  x.key === p.key ? { ...x, name: e.target.value } : x,
                                ),
                              }))
                            }
                          />
                          <Select
                            className="w-full"
                            value={p.product_type}
                            onChange={(v) =>
                              setForm((f) => ({
                                ...f,
                                products: f.products.map((x) =>
                                  x.key === p.key ? { ...x, product_type: v } : x,
                                ),
                              }))
                            }
                            options={PRODUCT_TYPES.map((t) => ({
                              value: t.value,
                              label: t.label,
                            }))}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Зэрэг"
                              value={p.grade}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  products: f.products.map((x) =>
                                    x.key === p.key ? { ...x, grade: e.target.value } : x,
                                  ),
                                }))
                              }
                            />
                            <InputNumber
                              className="w-full"
                              placeholder="Үнэ"
                              value={p.unit_price_default}
                              onChange={(v) =>
                                setForm((f) => ({
                                  ...f,
                                  products: f.products.map((x) =>
                                    x.key === p.key
                                      ? { ...x, unit_price_default: v ?? 0 }
                                      : x,
                                  ),
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border p-3">
                <Button type="primary" block loading={saving} onClick={save}>
                  Хадгалах
                </Button>
              </div>
            </div>
          ) : mode === 'detail' && selected ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-border p-3">
                <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={backToList}>
                  Жагсаалт
                </Button>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold leading-snug">{selected.name}</h2>
                    <span
                      className="mt-1.5 size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: TYPE_COLORS[selected.plant_type] || TYPE_COLORS.other,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Tag color="blue">{plantTypeLabel(selected.plant_type)}</Tag>
                    <Tag>{statusLabel(selected.status)}</Tag>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <DetailRow label="Код" value={selected.code} />
                  <DetailRow label="Аймаг" value={selected.aimag} />
                  <DetailRow label="Хаяг" value={selected.location} />
                  <DetailRow
                    label="Чадал"
                    value={
                      selected.capacity_per_hour
                        ? `${selected.capacity_per_hour} ${selected.capacity_unit || 'тн'}/цаг`
                        : null
                    }
                  />
                  <DetailRow label="Менежер" value={selected.manager_name} />
                  <DetailRow label="Утас" value={selected.phone} />
                  <DetailRow
                    label="Байршил"
                    value={
                      hasCoords(selected)
                        ? `${Number(selected.latitude).toFixed(5)}, ${Number(selected.longitude).toFixed(5)}`
                        : 'Байршилгүй'
                    }
                  />
                  <DetailRow label="Тэмдэглэл" value={selected.notes} />
                </div>

                <div className="border-t border-border pt-3">
                  <h3 className="mb-2 text-sm font-semibold">
                    Бүтээгдэхүүн ({(selected.products || []).length})
                  </h3>
                  {(selected.products || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Бүтээгдэхүүн бүртгэгдээгүй</p>
                  ) : (
                    <div className="space-y-2">
                      {(selected.products || []).map((p) => (
                        <div
                          key={p.id}
                          className="rounded-lg border border-border bg-muted/20 px-3 py-2"
                        >
                          <div className="font-medium">{p.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {productTypeLabel(p.product_type)}
                            {p.grade ? ` · ${p.grade}` : ''}
                            {p.unit ? ` · ${p.unit}` : ''}
                            {p.unit_price_default
                              ? ` · ${Number(p.unit_price_default).toLocaleString('mn-MN')}₮`
                              : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-border p-3">
                <Button danger block icon={<DeleteOutlined />} onClick={() => remove(selected)}>
                  Устгах
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 border-b border-border p-3">
                <Input
                  allowClear
                  placeholder="Хайх…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Select
                  allowClear
                  placeholder="Төрөл"
                  className="w-full"
                  value={filterType || undefined}
                  onChange={(v) => setFilterType(v || '')}
                  options={PLANT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {loading && (
                  <p className="p-3 text-sm text-muted-foreground">Ачаалж байна…</p>
                )}
                {!loading && filtered.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">
                    Үйлдвэр байхгүй. «Үйлдвэр нэмэх» товчоор бүртгэнэ үү.
                  </p>
                )}
                {filtered.map((site) => {
                  const color = TYPE_COLORS[site.plant_type] || TYPE_COLORS.other;
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => selectSite(site)}
                      className="mb-1 w-full rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{site.name}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Tag color="blue" className="m-0 text-[10px]">
                              {plantTypeLabel(site.plant_type)}
                            </Tag>
                            {site.aimag && (
                              <Tag className="m-0 text-[10px]">{site.aimag}</Tag>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {(site.products || []).length} бүтээгдэхүүн
                            {!hasCoords(site) && ' · байршилгүй'}
                          </div>
                        </div>
                        <span
                          className="mt-1 size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </aside>

        <div className="relative min-h-[420px] overflow-hidden rounded-xl border border-border bg-muted/30">
          <div ref={mapRef} className="absolute inset-0" />
          {!mapsReady && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Газрын зураг ачаалж байна…
            </div>
          )}
          <div
            className={cn(
              'pointer-events-none absolute bottom-3 left-3 rounded-lg px-3 py-2 text-xs shadow-sm backdrop-blur',
              mode === 'create'
                ? 'bg-amber-500/95 text-white'
                : 'bg-background/90 text-foreground',
            )}
          >
            {mode === 'create'
              ? 'Зураг дээр дарж байршил сонгоно · тэмдэглэгээг чирж засна'
              : 'Тэмдэглэгээ дээр дарж үйлдвэрийн мэдээлэл харна'}
          </div>
        </div>
      </div>
    </div>
  );
}
