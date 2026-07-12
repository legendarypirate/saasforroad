'use client';

import { List, PanelRight, PanelRightOpen, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALERTS, DEVICES, type Device } from '@/lib/Gps.devices';
import { haversine, type DrawMode, type Shape } from '@/lib/Geo.helper';
import { BASE_LAYERS, type BaseLayerId } from '@/lib/Map.layers';
import { MapActions, PlaybackBar, ToolbarButton } from '@/components/admin/gps/live/Controls';
import { DrawToolbar } from '@/components/admin/gps/live/GeoFence.toolbar';
import { DeviceSidebar } from '@/components/admin/gps/live/Left.panel';
import { StatusCards } from '@/components/admin/gps/live/Status.card';
import { TelemetryPanel } from '@/components/admin/gps/live/Telemetry.panel';
import { WeatherCard } from '@/components/admin/gps/live/Weather.card';

const LiveMap = dynamic(() => import('@/components/admin/gps/live/Live.map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs">Газрын зураг ачаалж байна…</span>
      </div>
    </div>
  ),
});

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function GpsLivePage() {
  const [devices, setDevices] = useState<Device[]>(DEVICES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [fitAllSignal, setFitAllSignal] = useState(0);
  const [showTrails, setShowTrails] = useState(false);
  const [baseLayer, setBaseLayer] = useState<BaseLayerId>('osm');

  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileList, setMobileList] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(false);

  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [drawColor, setDrawColor] = useState('#f5a623');
  const [draft, setDraft] = useState<[number, number][]>([]);
  const draftRef = useRef<[number, number][]>([]);
  const [hoverPoint, setHoverPoint] = useState<[number, number] | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const shapeSeq = useRef(0);

  const updateDraft = useCallback((next: [number, number][]) => {
    draftRef.current = next;
    setDraft(next);
  }, []);

  const [pbActive, setPbActive] = useState(false);
  const [pbPlaying, setPbPlaying] = useState(false);
  const [pbIndex, setPbIndex] = useState(0);

  const selected = useMemo(
    () => devices.find((d) => d.id === selectedId) ?? null,
    [devices, selectedId],
  );
  const selectedAlerts = useMemo(
    () => ALERTS.filter((a) => a.deviceId === selectedId),
    [selectedId],
  );

  useEffect(() => {
    const id = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.status !== 'moving') return { ...d, lastUpdate: d.lastUpdate + 2 };
          const headingRad = (d.heading * Math.PI) / 180;
          const stepDeg = (d.speed / 111000) * 2 * 3;
          const lat = d.lat + Math.cos(headingRad) * stepDeg;
          const lng = d.lng + Math.sin(headingRad) * stepDeg;
          const heading = (d.heading + (Math.random() - 0.5) * 18 + 360) % 360;
          const speed = Math.max(
            15,
            Math.min(105, d.speed + Math.round((Math.random() - 0.5) * 10)),
          );
          return {
            ...d,
            lat,
            lng,
            heading,
            speed,
            satellites: Math.max(
              5,
              Math.min(
                12,
                d.satellites + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0),
              ),
            ),
            battery: Math.max(20, d.battery - (Math.random() > 0.85 ? 1 : 0)),
            odometer: d.odometer + speed / 1800,
            lastUpdate: Math.max(1, Math.round(Math.random() * 6)),
          };
        }),
      );
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!pbActive || !pbPlaying || !selected) return;
    const id = setInterval(() => {
      setPbIndex((i) => {
        if (i >= selected.track.length - 1) {
          setPbPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 400);
    return () => clearInterval(id);
  }, [pbActive, pbPlaying, selected]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    const d = DEVICES.find((x) => x.id === id);
    setDevices((prev) => {
      const dev = prev.find((x) => x.id === id);
      if (dev) setFocus({ lat: dev.lat, lng: dev.lng });
      return prev;
    });
    if (d) setFocus({ lat: d.lat, lng: d.lng });
    setMobileList(false);
    setMobilePanel(true);
    setPanelOpen(true);
    setPbActive(false);
    setPbPlaying(false);
    setPbIndex(0);
  }, []);

  const commitShape = useCallback((partial: Omit<Shape, 'id' | 'name'>) => {
    shapeSeq.current += 1;
    const labels: Record<Shape['type'], string> = {
      circle: 'Дугуй бүс',
      polygon: 'Олон өнцөгт бүс',
      line: 'Маршрут',
      marker: 'Тэмдэглэгээ',
    };
    setShapes((prev) => [
      ...prev,
      {
        ...partial,
        id: `shape-${shapeSeq.current}`,
        name: `${labels[partial.type]} ${shapeSeq.current}`,
      },
    ]);
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (drawMode === 'none') return;
      if (drawMode === 'marker') {
        commitShape({ type: 'marker', color: drawColor, positions: [[lat, lng]] });
        return;
      }
      if (drawMode === 'circle') {
        const cur = draftRef.current;
        if (cur.length === 0) {
          updateDraft([[lat, lng]]);
        } else {
          const center = cur[0];
          const radius = haversine(center, [lat, lng]);
          commitShape({ type: 'circle', color: drawColor, center, radius, positions: [] });
          updateDraft([]);
          setHoverPoint(null);
        }
        return;
      }
      updateDraft([...draftRef.current, [lat, lng]]);
    },
    [drawMode, drawColor, commitShape, updateDraft],
  );

  const finishDraft = useCallback(() => {
    const cur = draftRef.current;
    if (drawMode === 'line' && cur.length >= 2) {
      commitShape({ type: 'line', color: drawColor, positions: cur });
    } else if (drawMode === 'polygon' && cur.length >= 3) {
      commitShape({ type: 'polygon', color: drawColor, positions: cur });
    }
    updateDraft([]);
    setHoverPoint(null);
  }, [drawMode, drawColor, commitShape, updateDraft]);

  const cancelDraft = useCallback(() => {
    updateDraft([]);
    setHoverPoint(null);
  }, [updateDraft]);

  const handleModeChange = useCallback(
    (m: DrawMode) => {
      setDrawMode(m);
      updateDraft([]);
      setHoverPoint(null);
    },
    [updateDraft],
  );

  const focusShape = useCallback((s: Shape) => {
    const pt = s.center ?? s.positions[0];
    if (pt) setFocus({ lat: pt[0], lng: pt[1] });
  }, []);

  const startPlayback = useCallback(() => {
    if (!selected) return;
    setPbActive(true);
    setPbPlaying(true);
    setPbIndex(0);
    setShowTrails(true);
  }, [selected]);

  const playbackPoint = useMemo(() => {
    if (!pbActive || !selected) return null;
    const p = selected.track[pbIndex];
    return p ? { lat: p.lat, lng: p.lng } : null;
  }, [pbActive, selected, pbIndex]);

  const lastFocusIndex = useRef(-1);
  useEffect(() => {
    if (pbActive && playbackPoint && pbIndex !== lastFocusIndex.current) {
      lastFocusIndex.current = pbIndex;
      setFocus({ lat: playbackPoint.lat, lng: playbackPoint.lng });
    }
  }, [pbActive, playbackPoint, pbIndex]);

  const trackLen = selected?.track.length ?? 1;
  const progress = pbActive ? (pbIndex / Math.max(1, trackLen - 1)) * 100 : 0;
  const totalSecs = selected ? (selected.track[selected.track.length - 1]?.t ?? 0) : 0;
  const curSecs = selected ? (selected.track[pbIndex]?.t ?? 0) : 0;

  return (
    <div className="-m-4 flex h-[calc(100dvh-9rem)] flex-col overflow-hidden bg-background md:h-[calc(100dvh-10rem)]">
      <div className="shrink-0 border-b border-border px-3 py-2.5 md:px-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
          <div className="min-w-0 flex-1">
            <StatusCards devices={devices} />
          </div>
          <div className="w-full shrink-0 lg:w-64">
            <WeatherCard />
          </div>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div className="hidden w-80 shrink-0 border-r border-border md:block">
          <DeviceSidebar devices={devices} selectedId={selectedId} onSelect={handleSelect} />
        </div>

        <div className="relative min-w-0 flex-1">
          <LiveMap
            devices={devices}
            selectedId={selectedId}
            onSelect={handleSelect}
            focus={focus}
            fitAllSignal={fitAllSignal}
            panelOpen={panelOpen}
            baseLayer={baseLayer}
            playbackPoint={playbackPoint}
            showTrails={showTrails}
            drawMode={drawMode}
            drawColor={drawColor}
            draft={draft}
            hoverPoint={hoverPoint}
            shapes={shapes}
            onMapClick={handleMapClick}
            onMapDblClick={finishDraft}
            onMapMove={(lat, lng) => setHoverPoint([lat, lng])}
          />

          <DrawToolbar
            mode={drawMode}
            color={drawColor}
            draftCount={draft.length}
            shapes={shapes}
            onModeChange={handleModeChange}
            onColorChange={setDrawColor}
            onFinish={finishDraft}
            onCancel={cancelDraft}
            onDeleteShape={(id) => setShapes((prev) => prev.filter((s) => s.id !== id))}
            onClearAll={() => setShapes([])}
            onFocusShape={focusShape}
          />

          <div className="pointer-events-auto absolute left-3 top-3 z-500 flex gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileList(true)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card/95 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur"
            >
              <List className="size-4" /> Төхөөрөмж
            </button>
            <button
              type="button"
              onClick={() => setMobilePanel(true)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card/95 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur"
            >
              <PanelRight className="size-4" /> Дэлгэрэнгүй
            </button>
          </div>

          <MapActions
            onFitAll={() => setFitAllSignal((n) => n + 1)}
            showTrails={showTrails}
            onToggleTrails={() => setShowTrails((s) => !s)}
            onStartPlayback={startPlayback}
            canPlayback={!!selected && selected.track.length > 1}
            baseLayers={BASE_LAYERS}
            baseLayer={baseLayer}
            onBaseLayerChange={setBaseLayer}
          />

          <PlaybackBar
            active={pbActive}
            playing={pbPlaying}
            progress={progress}
            onTogglePlay={() => setPbPlaying((p) => !p)}
            onSeek={(v) => {
              const idx = Math.round((v / 100) * (trackLen - 1));
              setPbIndex(idx);
              setPbPlaying(false);
            }}
            onStep={(dir) => {
              setPbPlaying(false);
              setPbIndex((i) => Math.max(0, Math.min(trackLen - 1, i + dir)));
            }}
            onExit={() => {
              setPbActive(false);
              setPbPlaying(false);
            }}
            deviceName={selected?.name ?? ''}
            timeLabel={`${fmtTime(curSecs)} / ${fmtTime(totalSecs)}`}
          />

          {!panelOpen && (
            <div className="pointer-events-auto absolute right-3 top-52 z-500 hidden lg:block">
              <ToolbarButton
                icon={PanelRightOpen}
                onClick={() => setPanelOpen(true)}
                title="Телеметр самбар нээх"
              />
            </div>
          )}
        </div>

        {panelOpen && (
          <div className="hidden w-80 shrink-0 border-l border-border bg-card lg:block">
            <TelemetryPanel
              device={selected}
              alerts={selectedAlerts}
              onClose={() => setPanelOpen(false)}
            />
          </div>
        )}

        {mobileList && (
          <div className="absolute inset-0 z-1000 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileList(false)} />
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-sidebar shadow-2xl">
              <DrawerHeader title="Төхөөрөмж" onClose={() => setMobileList(false)} />
              <div className="h-[calc(100%-3rem)]">
                <DeviceSidebar devices={devices} selectedId={selectedId} onSelect={handleSelect} />
              </div>
            </div>
          </div>
        )}

        {mobilePanel && (
          <div className="absolute inset-0 z-1000 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobilePanel(false)} />
            <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-card shadow-2xl">
              <DrawerHeader title="Телеметр" onClose={() => setMobilePanel(false)} />
              <div className="h-[calc(100%-3rem)]">
                <TelemetryPanel device={selected} alerts={selectedAlerts} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex h-12 items-center justify-between border-b border-border px-4">
      <span className="text-sm font-semibold">{title}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Хаах"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
