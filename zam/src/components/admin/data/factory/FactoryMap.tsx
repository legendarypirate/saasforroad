'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BASE_LAYERS } from '@/lib/Map.layers';

const MONGOLIA_CENTER: [number, number] = [46.8625, 103.8467];
const OSM = BASE_LAYERS.find((l) => l.id === 'osm')!;

export type FactoryMapSite = {
  id: number;
  name: string;
  plant_type: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export type FactoryEditPin = {
  lat: number;
  lng: number;
};

export const TYPE_COLORS: Record<string, string> = {
  asphalt: '#b45309',
  cement: '#64748b',
  crushing: '#0d9488',
  emulsion: '#7c3aed',
  ctb: '#2563eb',
  other: '#78716c',
};

function plantMarkerSvg(fill = '#b45309', size = 44) {
  return `
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
}

function plantIcon(fill: string, size = 44) {
  return L.divIcon({
    className: 'factory-plant-marker',
    html: `<div style="width:${size}px;height:${size}px;line-height:0">${plantMarkerSvg(fill, size)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function hasCoords(site: FactoryMapSite) {
  const lat = Number(site.latitude);
  const lng = Number(site.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function MapController({
  focus,
  zoom,
}: {
  focus: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    if (!focus) return;
    map.flyTo(focus, zoom ?? Math.max(map.getZoom(), 10), { duration: 0.6 });
  }, [focus, zoom, map]);

  return null;
}

function MapClickHandler({
  placing,
  onMapClick,
}: {
  placing: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!placing) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  sites: FactoryMapSite[];
  selectedId: number | null;
  placing: boolean;
  editPin: FactoryEditPin | null;
  focus: [number, number] | null;
  focusZoom?: number;
  onSelectSite: (site: FactoryMapSite) => void;
  onMapClick: (lat: number, lng: number) => void;
  onEditDrag: (lat: number, lng: number) => void;
};

export default function FactoryMap({
  sites,
  selectedId,
  placing,
  editPin,
  focus,
  focusZoom = 10,
  onSelectSite,
  onMapClick,
  onEditDrag,
}: Props) {
  const editIcon = useMemo(() => plantIcon('#dc2626', 48), []);
  const siteIcons = useMemo(() => {
    const cache: Record<string, L.DivIcon> = {};
    for (const [type, color] of Object.entries(TYPE_COLORS)) {
      cache[type] = plantIcon(color, 44);
    }
    return cache;
  }, []);

  return (
    <MapContainer
      center={MONGOLIA_CENTER}
      zoom={5.6}
      zoomControl
      className="absolute inset-0 h-full w-full"
      style={{ minHeight: 420 }}
    >
      <TileLayer url={OSM.url} attribution={OSM.attribution} maxZoom={19} />
      <MapController focus={focus} zoom={focusZoom} />
      <MapClickHandler placing={placing} onMapClick={onMapClick} />

      {sites.filter(hasCoords).map((site) => {
        const lat = Number(site.latitude);
        const lng = Number(site.longitude);
        const colorKey = site.plant_type in siteIcons ? site.plant_type : 'other';
        return (
          <Marker
            key={site.id}
            position={[lat, lng]}
            icon={siteIcons[colorKey]}
            opacity={selectedId == null || selectedId === site.id ? 1 : 0.75}
            eventHandlers={{
              click: () => {
                if (placing) return;
                onSelectSite(site);
              },
            }}
          />
        );
      })}

      {placing && editPin && (
        <Marker
          position={[editPin.lat, editPin.lng]}
          icon={editIcon}
          draggable
          zIndexOffset={1000}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target as L.Marker;
              const pos = marker.getLatLng();
              onEditDrag(pos.lat, pos.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
