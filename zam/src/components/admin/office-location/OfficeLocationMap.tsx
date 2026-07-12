'use client';

import { useEffect, useMemo } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BASE_LAYERS } from '@/lib/Map.layers';
import type { OfficeLocation } from '@/lib/officeLocation';

const DEFAULT_CENTER: [number, number] = [47.9189, 106.917];
const OSM = BASE_LAYERS.find((l) => l.id === 'osm')!;

function officeIcon(active: boolean, selected: boolean) {
  const color = active ? '#1890ff' : '#bfbfbf';
  const size = selected ? 18 : 14;
  return L.divIcon({
    className: 'office-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function editPinIcon() {
  return L.divIcon({
    className: 'office-edit-marker',
    html: `<div style="position:relative;width:26px;height:26px;">
      <div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#1890ff;transform:rotate(-45deg);border:2px solid rgba(255,255,255,.9);box-shadow:0 3px 10px rgba(0,0,0,.4);"></div>
      <div style="position:absolute;top:7px;left:7px;width:10px;height:10px;border-radius:50%;background:#fff;"></div>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 24],
  });
}

function MapController({
  center,
  zoom,
}: {
  center: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    if (!center) return;
    map.flyTo(center, zoom ?? Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [center, zoom, map]);

  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export type OfficeMapEditPoint = {
  lat: number;
  lng: number;
  radiusMeters: number;
};

type Props = {
  offices: OfficeLocation[];
  selectedId: number | null;
  editPoint: OfficeMapEditPoint | null;
  focus: [number, number] | null;
  onSelectOffice: (office: OfficeLocation) => void;
  onMapClick: (lat: number, lng: number) => void;
  onEditDrag: (lat: number, lng: number) => void;
};

export default function OfficeLocationMap({
  offices,
  selectedId,
  editPoint,
  focus,
  onSelectOffice,
  onMapClick,
  onEditDrag,
}: Props) {
  const editIcon = useMemo(() => editPinIcon(), []);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={12}
      zoomControl
      className="h-full w-full rounded-xl"
      style={{ minHeight: 400 }}
    >
      <TileLayer
        url={OSM.url}
        attribution={OSM.attribution}
        maxZoom={19}
      />
      <MapController center={focus} zoom={15} />
      <MapClickHandler onMapClick={onMapClick} />

      {offices.map((office) => {
        const lat = Number(office.latitude);
        const lng = Number(office.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return (
          <Marker
            key={office.id}
            position={[lat, lng]}
            icon={officeIcon(office.is_active, selectedId === office.id)}
            eventHandlers={{
              click: () => onSelectOffice(office),
            }}
          />
        );
      })}

      {editPoint && (
        <>
          <Marker
            position={[editPoint.lat, editPoint.lng]}
            icon={editIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target as L.Marker;
                const pos = marker.getLatLng();
                onEditDrag(pos.lat, pos.lng);
              },
            }}
          />
          <Circle
            center={[editPoint.lat, editPoint.lng]}
            radius={editPoint.radiusMeters}
            pathOptions={{
              color: '#1890ff',
              fillColor: '#1890ff',
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        </>
      )}
    </MapContainer>
  );
}
