"use client";

import type { Device } from "../../../../lib/Gps.devices";
import { STATUS_META } from "../../../../lib/Gps.devices";
import { cn } from "@/lib/utils";
import { Grid2x2 } from "lucide-react";

interface Props {
  devices: Device[];
}

const RING: Record<string, string> = {
  moving: "border-success/40 bg-success/15 text-success",
  idle: "border-warning/40 bg-warning/15 text-warning",
  alarm: "border-destructive/40 bg-destructive/15 text-destructive",
  offline: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
  total: "border-primary/40 bg-primary/10 text-primary",
};

export function StatusCards({ devices }: Props) {
  const total = devices.length;
  const counts = {
    moving: devices.filter((d) => d.status === "moving").length,
    idle: devices.filter((d) => d.status === "idle").length,
    alarm: devices.filter((d) => d.status === "alarm").length,
    offline: devices.filter((d) => d.status === "offline").length,
  };

  const cards = [
    {
      key: "total",
      label: "Нийт тээврийн хэрэгсэл",
      value: total,
      ring: RING.total,
      icon: true,
    },
    {
      key: "moving",
      label: STATUS_META.moving.label,
      value: counts.moving,
      ring: RING.moving,
    },
    {
      key: "idle",
      label: STATUS_META.idle.label,
      value: counts.idle,
      ring: RING.idle,
    },
    {
      key: "alarm",
      label: STATUS_META.alarm.label,
      value: counts.alarm,
      ring: RING.alarm,
    },
    {
      key: "offline",
      label: STATUS_META.offline.label,
      value: counts.offline,
      ring: RING.offline,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.key}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
        >
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold tabular-nums",
              c.ring,
            )}
          >
            {"icon" in c && c.icon ? (
              <Grid2x2 className="size-5" />
            ) : (
              c.value
            )}
          </div>
          <div className="min-w-0">
            {"icon" in c && c.icon ? (
              <p className="text-lg font-semibold leading-none tabular-nums">
                {c.value}
              </p>
            ) : null}
            <p className="truncate text-xs text-muted-foreground">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
