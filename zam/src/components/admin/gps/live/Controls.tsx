"use client"

import { useState } from "react"
import { Play, Pause, SkipBack, SkipForward, Maximize, Route, Waypoints, Layers, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BaseLayer, BaseLayerId } from "../../../../lib/Map.layers"

/** Газрын зураг дээрх бүх toolbar-т ашиглах нэгдсэн товч */
export function ToolbarButton({
  icon: Icon,
  onClick,
  active = false,
  disabled = false,
  title,
  ariaLabel,
}: {
  icon: LucideIcon
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  title?: string
  ariaLabel?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? title}
      title={title}
      className={cn(
        "flex size-9 items-center justify-center rounded-md border bg-card/95 shadow-lg backdrop-blur transition-colors disabled:opacity-40",
        active
          ? "border-primary text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

/** Суурь давхарга сонгогч — ToolbarButton + жижиг цэс (загвар нь бусад toolbar-тай ижил) */
export function LayerSwitcher({
  layers,
  value,
  onChange,
}: {
  layers: BaseLayer[]
  value: BaseLayerId
  onChange: (id: BaseLayerId) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <ToolbarButton
        icon={Layers}
        active={open}
        title="Газрын давхарга"
        ariaLabel="Газрын давхарга"
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-499" onClick={() => setOpen(false)} />
          <div className="absolute right-full top-0 z-501 mr-2 w-44 overflow-hidden rounded-md border border-border bg-card/95 shadow-lg backdrop-blur">
            {layers.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  onChange(l.id)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
                  value === l.id ? "font-medium text-primary" : "text-muted-foreground",
                )}
              >
                <Layers className="size-3.5 shrink-0" />
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface PlaybackProps {
  active: boolean
  playing: boolean
  progress: number // 0-100
  onTogglePlay: () => void
  onSeek: (v: number) => void
  onStep: (dir: -1 | 1) => void
  onExit: () => void
  deviceName: string
  timeLabel: string
}

export function PlaybackBar({
  active,
  playing,
  progress,
  onTogglePlay,
  onSeek,
  onStep,
  onExit,
  deviceName,
  timeLabel,
}: PlaybackProps) {
  if (!active) return null
  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-500 rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Route className="size-4 text-primary" />
          <span className="font-semibold">Тээврийн маршрут</span>
          <span className="text-muted-foreground">&middot; {deviceName}</span>
        </div>
        <button
          onClick={onExit}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Гарах
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onStep(-1)}
          className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          aria-label="Step back"
        >
          <SkipBack className="size-4" />
        </button>
        <button
          onClick={onTogglePlay}
          className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-0.5" />}
        </button>
        <button
          onClick={() => onStep(1)}
          className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          aria-label="Step forward"
        >
          <SkipForward className="size-4" />
        </button>

        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
          aria-label=""
        />
        <span className="w-24 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
          {timeLabel}
        </span>
      </div>
    </div>
  )
}

interface MapActionsProps {
  onFitAll: () => void
  showTrails: boolean
  onToggleTrails: () => void
  onStartPlayback: () => void
  canPlayback: boolean
  baseLayers: BaseLayer[]
  baseLayer: BaseLayerId
  onBaseLayerChange: (id: BaseLayerId) => void
}

export function MapActions({
  onFitAll,
  showTrails,
  onToggleTrails,
  onStartPlayback,
  canPlayback,
  baseLayers,
  baseLayer,
  onBaseLayerChange,
}: MapActionsProps) {
  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-500 flex flex-col gap-2">
      <LayerSwitcher layers={baseLayers} value={baseLayer} onChange={onBaseLayerChange} />
      <ToolbarButton icon={Maximize} onClick={onFitAll} title="Бүх төхөөрөмж багтаах" />
      <ToolbarButton
        icon={Waypoints}
        onClick={onToggleTrails}
        active={showTrails}
        title="Замын мөр"
      />
      <ToolbarButton
        icon={Route}
        onClick={onStartPlayback}
        disabled={!canPlayback}
        title="Маршрут тоглуулах"
      />
    </div>
  )
}
