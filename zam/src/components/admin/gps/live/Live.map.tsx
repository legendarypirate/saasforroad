"use client"

import { useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Circle, CircleMarker, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Device } from "@/lib/Gps.devices"
import { haversine, type DrawMode, type Shape } from "@/lib/Geo.helper"
import { BASE_LAYERS, type BaseLayerId } from "@/lib/Map.layers"

const STATUS_HEX: Record<string, string> = {
  moving: "#3ddc84",
  idle: "#e8c34a",
  offline: "#8b93a7",
  alarm: "#f0553f",
}

function vehicleIcon(device: Device, selected: boolean) {
  const color = STATUS_HEX[device.status]
  const size = selected ? 34 : 26
  const pulse =
    device.status === "alarm"
      ? `<span style="position:absolute;inset:-8px;border-radius:9999px;border:2px solid ${color};opacity:.5;animation:ping 1.2s cubic-bezier(0,0,.2,1) infinite;"></span>`
      : ""
  return L.divIcon({
    className: "vehicle-marker",
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${pulse}
        <div style="
          width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
          background:${color};transform:rotate(${device.heading - 45}deg);
          box-shadow:0 4px 14px rgba(0,0,0,.5);
          border:2px solid rgba(255,255,255,.85);
        "></div>
        <div style="position:absolute;width:${size * 0.42}px;height:${size * 0.42}px;border-radius:50%;background:rgba(20,24,34,.92);display:flex;align-items:center;justify-content:center;">
          <div style="width:6px;height:6px;border-radius:50%;background:${color};"></div>
        </div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function MapController({
  focus,
  fitAll,
  devices,
}: {
  focus: { lat: number; lng: number } | null
  fitAll: number
  devices: Device[]
}) {
  const map = useMap()
  const didInit = useRef(false)

  useEffect(() => {
    if (focus) {
      map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 14), { duration: 0.8 })
    }
  }, [focus, map])

  useEffect(() => {
    if (devices.length === 0) return
    const bounds = L.latLngBounds(devices.map((d) => [d.lat, d.lng]))
    map.fitBounds(bounds, { padding: [70, 70] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitAll])

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    if (devices.length) {
      const bounds = L.latLngBounds(devices.map((d) => [d.lat, d.lng]))
      map.fitBounds(bounds, { padding: [70, 70] })
    }
    setTimeout(() => map.invalidateSize(), 200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function markerPinIcon(color: string) {
  return L.divIcon({
    className: "geo-marker",
    html: `<div style="position:relative;width:26px;height:26px;">
      <div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid rgba(255,255,255,.85);box-shadow:0 3px 10px rgba(0,0,0,.5);"></div>
      <div style="position:absolute;top:7px;left:7px;width:10px;height:10px;border-radius:50%;background:rgba(20,24,34,.92);"></div>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 24],
  })
}

function DrawEvents({
  mode,
  onMapClick,
  onMapDblClick,
  onMapMove,
}: {
  mode: DrawMode
  onMapClick: (lat: number, lng: number) => void
  onMapDblClick: () => void
  onMapMove: (lat: number, lng: number) => void
}) {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    container.style.cursor = mode === "none" ? "" : "crosshair"
    if (mode === "none") map.doubleClickZoom.enable()
    else map.doubleClickZoom.disable()
    return () => {
      container.style.cursor = ""
      map.doubleClickZoom.enable()
    }
  }, [mode, map])

  useMapEvents({
    click(e) {
      if (mode !== "none") onMapClick(e.latlng.lat, e.latlng.lng)
    },
    dblclick() {
      if (mode === "line" || mode === "polygon") onMapDblClick()
    },
    mousemove(e) {
      if (mode !== "none") onMapMove(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Container хэмжээ өөрчлөгдөхөд leaflet-д мэдэгдэж, зургийг дахин тооцуулна */
function ResizeInvalidator({ dep }: { dep: unknown }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 260)
    return () => clearTimeout(t)
  }, [dep, map])
  return null
}

interface LiveMapProps {
  devices: Device[]
  selectedId: string | null
  onSelect: (id: string) => void
  focus: { lat: number; lng: number } | null
  fitAllSignal: number
  panelOpen: boolean
  baseLayer: BaseLayerId
  playbackPoint: { lat: number; lng: number } | null
  showTrails: boolean
  drawMode: DrawMode
  drawColor: string
  draft: [number, number][]
  hoverPoint: [number, number] | null
  shapes: Shape[]
  onMapClick: (lat: number, lng: number) => void
  onMapDblClick: () => void
  onMapMove: (lat: number, lng: number) => void
}

export default function LiveMap({
  devices,
  selectedId,
  onSelect,
  focus,
  fitAllSignal,
  panelOpen,
  baseLayer,
  playbackPoint,
  showTrails,
  drawMode,
  drawColor,
  draft,
  hoverPoint,
  shapes,
  onMapClick,
  onMapDblClick,
  onMapMove,
}: LiveMapProps) {
  const selected = devices.find((d) => d.id === selectedId) ?? null
  const layer = BASE_LAYERS.find((l) => l.id === baseLayer) ?? BASE_LAYERS[0]

  const trailPositions = useMemo(
    () => (selected ? selected.track.map((p) => [p.lat, p.lng] as [number, number]) : []),
    [selected],
  )

  // live draft preview
  const draftCircleRadius =
    drawMode === "circle" && draft.length === 1 && hoverPoint ? haversine(draft[0], hoverPoint) : 0
  const draftLine: [number, number][] =
    (drawMode === "line" || drawMode === "polygon") && draft.length > 0 && hoverPoint
      ? [...draft, hoverPoint]
      : draft

  return (
    <MapContainer
      center={[43.34, 105.78]}
      zoom={9}
      zoomControl={false}
      className="h-full w-full"
      preferCanvas
    >
      <TileLayer
        key={layer.id}
        url={layer.url}
        attribution={layer.attribution}
        maxZoom={19}
        className={layer.raw ? "raw-tiles" : undefined}
      />

      <MapController focus={focus} fitAll={fitAllSignal} devices={devices} />
      <ResizeInvalidator dep={panelOpen} />
      <DrawEvents mode={drawMode} onMapClick={onMapClick} onMapDblClick={onMapDblClick} onMapMove={onMapMove} />

      {/* Committed geofences / shapes */}
      {shapes.map((s) => {
        if (s.type === "circle" && s.center && s.radius) {
          return (
            <Circle
              key={s.id}
              center={s.center}
              radius={s.radius}
              pathOptions={{ color: s.color, fillColor: s.color, fillOpacity: 0.12, weight: 2 }}
            />
          )
        }
        if (s.type === "polygon") {
          return (
            <Polygon
              key={s.id}
              positions={s.positions}
              pathOptions={{ color: s.color, fillColor: s.color, fillOpacity: 0.12, weight: 2 }}
            />
          )
        }
        if (s.type === "line") {
          return <Polyline key={s.id} positions={s.positions} pathOptions={{ color: s.color, weight: 3 }} />
        }
        if (s.type === "marker" && s.positions[0]) {
          return <Marker key={s.id} position={s.positions[0]} icon={markerPinIcon(s.color)} />
        }
        return null
      })}

      {/* Draft preview */}
      {draftCircleRadius > 0 && draft[0] && (
        <Circle
          center={draft[0]}
          radius={draftCircleRadius}
          pathOptions={{ color: drawColor, fillColor: drawColor, fillOpacity: 0.1, weight: 2, dashArray: "6 6" }}
        />
      )}
      {(drawMode === "line" || drawMode === "polygon") && draftLine.length > 1 && (
        <Polyline positions={draftLine} pathOptions={{ color: drawColor, weight: 2, dashArray: "6 6" }} />
      )}
      {drawMode !== "none" &&
        draft.map((p, i) => (
          <CircleMarker
            key={i}
            center={p}
            radius={4}
            pathOptions={{ color: drawColor, fillColor: "#0b0e14", fillOpacity: 1, weight: 2 }}
          />
        ))}

      {showTrails && selected && trailPositions.length > 1 && (
        <>
          <Polyline positions={trailPositions} pathOptions={{ color: "#f5a623", weight: 3, opacity: 0.85 }} />
          <Circle
            center={trailPositions[0]}
            radius={40}
            pathOptions={{ color: "#3ddc84", fillColor: "#3ddc84", fillOpacity: 0.6 }}
          />
        </>
      )}

      {playbackPoint && (
        <Circle
          center={[playbackPoint.lat, playbackPoint.lng]}
          radius={30}
          pathOptions={{ color: "#f0553f", fillColor: "#f0553f", fillOpacity: 0.8, weight: 2 }}
        />
      )}

      {devices.map((d) => (
        <Marker
          key={d.id}
          position={[d.lat, d.lng]}
          icon={vehicleIcon(d, d.id === selectedId)}
          eventHandlers={{ click: () => onSelect(d.id) }}
        />
      ))}
    </MapContainer>
  )
}
