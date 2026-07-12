"use client";

import {
  DRAW_COLORS,
  formatMeters,
  lineLength,
  polygonAreaKm2,
  type DrawMode,
  type Shape,
} from "@/lib/Geo.helper";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  Circle as CircleIcon,
  Hexagon,
  MapPin,
  MousePointer2,
  PencilRuler,
  Spline,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

const TOOLS: { mode: DrawMode; icon: typeof CircleIcon; label: string }[] = [
  { mode: "none", icon: MousePointer2, label: "Select / pan" },
  { mode: "circle", icon: CircleIcon, label: "Circle geofence" },
  { mode: "polygon", icon: Hexagon, label: "Polygon geofence" },
  { mode: "line", icon: Spline, label: "Custom line" },
  { mode: "marker", icon: MapPin, label: "Point marker" },
];

interface Props {
  mode: DrawMode;
  color: string;
  draftCount: number;
  shapes: Shape[];
  onModeChange: (m: DrawMode) => void;
  onColorChange: (c: string) => void;
  onFinish: () => void;
  onCancel: () => void;
  onDeleteShape: (id: string) => void;
  onClearAll: () => void;
  onFocusShape: (s: Shape) => void;
}

function shapeMeasure(s: Shape): string {
  if (s.type === "circle" && s.radius) return `r ${formatMeters(s.radius)}`;
  if (s.type === "polygon")
    return `${polygonAreaKm2(s.positions).toFixed(1)} km²`;
  if (s.type === "line") return formatMeters(lineLength(s.positions));
  if (s.type === "marker")
    return `${s.positions[0]?.[0].toFixed(3)}, ${s.positions[0]?.[1].toFixed(3)}`;
  return "";
}

export function DrawToolbar({
  mode,
  color,
  draftCount,
  shapes,
  onModeChange,
  onColorChange,
  onFinish,
  onCancel,
  onDeleteShape,
  onClearAll,
  onFocusShape,
}: Props) {
  const [open, setOpen] = useState(false);
  const drawing = mode !== "none";
  const canFinish =
    (mode === "line" && draftCount >= 2) ||
    (mode === "polygon" && draftCount >= 3);

  return (
    <div className="pointer-events-auto absolute left-3 top-16 z-500 w-56 overflow-hidden rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur md:top-3">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <PencilRuler className="size-3.5 text-primary" /> Бүсчлэл
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            !open && "-rotate-90",
          )}
        />
      </button>

      {open && (
        <div className="p-2.5">
          {/* Tools */}
          <div className="grid grid-cols-5 gap-1">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              const active = mode === t.mode;
              return (
                <button
                  key={t.mode}
                  onClick={() => onModeChange(t.mode)}
                  title={t.label}
                  aria-label={t.label}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md border transition-colors",
                    active
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>

          {/* Color picker */}
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
              Color
            </p>
            <div className="flex items-center gap-1.5">
              {DRAW_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  aria-label={`Color ${c}`}
                  className={cn(
                    "size-6 rounded-full border-2 transition-transform hover:scale-110",
                    color === c ? "border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label
                className="relative size-6 cursor-pointer overflow-hidden rounded-full border border-border"
                title="Custom color"
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <span
                  className="block size-full"
                  style={{
                    background:
                      "conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)",
                  }}
                />
              </label>
            </div>
          </div>

          {/* Drawing hint / actions */}
          {drawing && (
            <div className="mt-3 rounded-lg border border-border bg-background/50 p-2">
              <p className="text-[11px] text-muted-foreground">
                {mode === "circle" &&
                  "Click center, then click edge to set radius."}
                {mode === "polygon" &&
                  "Click to add points. Finish to close the area."}
                {mode === "line" && "Click to add points along the line."}
                {mode === "marker" && "Click on the map to drop a marker."}
              </p>
              {(mode === "line" || mode === "polygon") && (
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    onClick={onFinish}
                    disabled={!canFinish}
                    className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground disabled:opacity-40"
                  >
                    <Check className="size-3.5" /> Finish
                  </button>
                  <button
                    onClick={onCancel}
                    className="flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" /> Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Shape list */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted-foreground">
              Layers ({shapes.length})
            </p>
            {shapes.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-muted-foreground transition-colors hover:text-destructive"
              >
                Clear all
              </button>
            )}
          </div>
          {shapes.length === 0 ? (
            <p className="mt-1 text-[11px] text-muted-foreground/70">
              No shapes drawn yet.
            </p>
          ) : (
            <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto">
              {shapes.map((s) => (
                <li
                  key={s.id}
                  className="group flex items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-1.5"
                >
                  <button
                    onClick={() => onFocusShape(s)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium">
                        {s.name}
                      </span>
                      <span className="block text-[10px] text-muted-foreground tabular-nums">
                        {shapeMeasure(s)}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => onDeleteShape(s.id)}
                    className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
