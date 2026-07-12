"use client"

import { useMemo, useState } from "react"
import {
  Search,
  Truck,
  Car,
  Package,
  Bus,
  ChevronRight,
  Signal,
  Battery,
  Gauge,
} from "lucide-react"
import type { Device, DeviceStatus } from "@/lib/Gps.devices"
import { STATUS_META, formatAgo } from "@/lib/Gps.devices"
import { cn } from "@/lib/utils"

const TYPE_ICON = {
  truck: Truck,
  van: Bus,
  car: Car,
  asset: Package,
}

const FILTERS: { key: DeviceStatus | "all"; label: string }[] = [
  { key: "all", label: "Бүгд" },
  { key: "moving", label: "Хөдөлгөөнд байна" },
  { key: "idle", label: "Зогссон" },
  { key: "alarm", label: "Сануулгатай" },
  { key: "offline", label: "Холбол салсан" },
]

interface Props {
  devices: Device[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function DeviceSidebar({ devices, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<DeviceStatus | "all">("all")

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: devices.length, moving: 0, idle: 0, alarm: 0, offline: 0 }
    devices.forEach((d) => (c[d.status] = (c[d.status] ?? 0) + 1))
    return c
  }, [devices])

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      const matchesFilter = filter === "all" || d.status === filter
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.plate.toLowerCase().includes(q) ||
        d.driver.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [devices, filter, query])

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar">
      <div className="border-b border-sidebar-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Хайлт хийхr..."
            className="w-full rounded-md border border-sidebar-border bg-background/50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
            aria-label="Search devices"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-sidebar-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="rounded-full bg-background/60 px-1.5 text-[10px] tabular-nums">
                {counts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Илэрц олдсонгүй.</p>
        )}
        <ul className="divide-y divide-sidebar-border/60">
          {filtered.map((d) => {
            const Icon = TYPE_ICON[d.type]
            const meta = STATUS_META[d.status]
            const active = d.id === selectedId
            return (
              <li key={d.id}>
                <button
                  onClick={() => onSelect(d.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    active ? "bg-primary/10" : "hover:bg-sidebar-accent/60",
                  )}
                >
                  <div
                    className={cn(
                      "relative flex size-9 shrink-0 items-center justify-center rounded-md border",
                      active ? "border-primary/50 bg-primary/15" : "border-sidebar-border bg-background/40",
                    )}
                  >
                    <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
                    <span
                      className={cn(
                        "absolute -right-1 -top-1 size-2.5 rounded-full ring-2 ring-sidebar",
                        meta.dot,
                      )}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{d.name}</p>
                      <span className={cn("shrink-0 text-[11px] font-medium", meta.color)}>{meta.label}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Gauge className="size-3" />
                        {d.speed} km/h
                      </span>
                      <span className="flex items-center gap-1">
                        <Battery className="size-3" />
                        {d.battery}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Signal className="size-3" />
                        {d.satellites}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                      {d.plate} &middot; {formatAgo(d.lastUpdate)}
                    </p>
                  </div>

                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      active && "translate-x-0.5 text-primary",
                    )}
                  />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
