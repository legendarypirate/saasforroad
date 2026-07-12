"use client"

import { Button } from "@/components/ui/button";
import type { AlertEvent, Device } from "../../../../lib/Gps.devices";
import { STATUS_META, formatAgo } from "../../../../lib/Gps.devices";
import { cn } from "@/lib/utils";
import {
    Activity,
    Battery,
    BatteryLow,
    Fuel,
    Gauge,
    IdCard,
    MapPin,
    Navigation,
    Power,
    Route as RouteIcon,
    ShieldAlert,
    Siren,
    TriangleAlert,
    User,
    WifiOff,
    X
} from "lucide-react";

const ALERT_ICON = {
  overspeed: Gauge,
  geofence: ShieldAlert,
  sos: Siren,
  lowbattery: BatteryLow,
  harshbrake: TriangleAlert,
  offline: WifiOff,
  ignition: Power,
}

const SEVERITY = {
  critical: "text-destructive border-destructive/40 bg-destructive/10",
  warning: "text-warning border-warning/40 bg-warning/10",
  info: "text-muted-foreground border-border bg-background/40",
}

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Gauge
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className={cn("mt-1.5 text-lg font-bold tabular-nums", accent)}>{value}</p>
    </div>
  )
}

function Bar({ value, className }: { value: number; className: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
      <div className={cn("h-full rounded-full transition-all", className)} style={{ width: `${value}%` }} />
    </div>
  )
}

interface Props {
  device: Device | null
  alerts: AlertEvent[]
  onClose?: () => void
}

export function TelemetryPanel({ device, alerts, onClose }: Props) {
  if (!device) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border border-border bg-background/40">
          <Navigation className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Тээврийн хэрэгсэл сонгоно уу</p>
      </div>
    )
  }

  const meta = STATUS_META[device.status]

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between gap-2">
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="hidden text-muted-foreground transition-colors hover:text-foreground lg:block"
              aria-label="Телеметрийн самбар нуух"
              title="Самбар нуух"
            >
              <X className="size-4" />
            </Button>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">{device.name}</h2>
            <p className="text-xs text-muted-foreground">
              {device.id} &middot; {device.group}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                meta.color,
                "border-current/30",
              )}
            >
              <span className={cn("size-2 rounded-full", meta.dot)} />
              {meta.label}
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-xs">
          <p className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <span className="text-foreground">{device.address}</span>
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <User className="size-3.5 shrink-0" /> {device.driver}
            <IdCard className="ml-2 size-3.5 shrink-0" /> {device.plate}
          </p>
          <p className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            IMEI {device.imei}
          </p>
        </div>
      </div>

      {/* Live metrics */}
      <div className="space-y-3 border-b border-border p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Тээврийн хяналт</p>
        <div className="grid grid-cols-2 gap-2">
          <Metric
            icon={Gauge}
            label="Хурд"
            value={`${device.speed} км/ц`}
            accent={device.speed > 90 ? "text-destructive" : device.speed > 0 ? "text-success" : undefined}
          />
          <Metric icon={Navigation} label="Чиглэл" value={`${Math.round(device.heading)}\u00b0`} />
        </div>

        <div className="space-y-2.5 rounded-lg border border-border bg-background/40 p-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Battery className="size-3.5" /> Цэнэг
              </span>
              <span className="font-semibold tabular-nums">{device.battery}%</span>
            </div>
            <Bar value={device.battery} className={device.battery < 25 ? "bg-destructive" : "bg-success"} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Fuel className="size-3.5" /> Шатахуун
              </span>
              <span className="font-semibold tabular-nums">{device.fuel}%</span>
            </div>
            <Bar value={device.fuel} className={device.fuel < 20 ? "bg-warning" : "bg-primary"} />
          </div>
        </div>
      </div>

      {/* Trip */}
      <div className="grid grid-cols-2 gap-2 border-b border-border p-4">
        <div className="col-span-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <RouteIcon className="size-3.5" /> Хураангуй
        </div>
        <Metric icon={RouteIcon} label="Туулсан зам" value={`${device.odometer.toLocaleString()} км`} />
        <Metric icon={Activity} label="Сүүлд шинэчлэгдсэн" value={formatAgo(device.lastUpdate)} />
      </div>

      {/* Alerts */}
      <div className="p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Сүүлийн сэрэмжлүүлэг
        </p>
        {alerts.length === 0 ? (
          <p className="rounded-lg border border-border bg-background/40 px-3 py-4 text-center text-xs text-muted-foreground">
            Энэ төхөөрөмжид сэрэмжлүүлэг алга.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => {
              const Icon = ALERT_ICON[a.type]
              return (
                <li
                  key={a.id}
                  className={cn("flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs", SEVERITY[a.severity])}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{a.message}</p>
                    <p className="text-[11px] text-muted-foreground">{formatAgo(a.time)}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
