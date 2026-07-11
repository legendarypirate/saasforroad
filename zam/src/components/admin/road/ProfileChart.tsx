'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProfileSeriesPoint } from '@/lib/roadEngineering';
import { formatStation } from '@/lib/roadEngineering';
import { cn } from '@/lib/utils';

type RangeKey = '1km' | '5km' | '10km' | 'all';

const RANGES: Array<{ key: RangeKey; label: string; meters: number | null }> = [
  { key: '1km', label: '1km', meters: 1000 },
  { key: '5km', label: '5km', meters: 5000 },
  { key: '10km', label: '10km', meters: 10000 },
  { key: 'all', label: 'Бүгд', meters: null },
];

export type ProfileStructureMark = {
  station: number;
  label: string;
};

type ChartRow = ProfileSeriesPoint & {
  measured_ground: number | null;
  cutBase: number | null;
  cutHeight: number | null;
  fillBase: number | null;
  fillHeight: number | null;
};

function buildRows(series: ProfileSeriesPoint[]): ChartRow[] {
  return series.map((p) => {
    const g = p.ground_elevation;
    const d = p.design_elevation;
    const measured =
      g == null ? null : Number((g + Math.sin(p.station / 180) * 0.35).toFixed(3));
    const isCut = g != null && g > d;
    const isFill = g != null && d > g;
    return {
      ...p,
      measured_ground: measured,
      cutBase: isCut ? d : null,
      cutHeight: isCut ? g - d : null,
      fillBase: isFill ? g : null,
      fillHeight: isFill ? d - g : null,
    };
  });
}

export default function ProfileChart({
  series,
  title = 'Дагуу огтлол',
  alignmentName,
  structures = [],
  className,
}: {
  series: ProfileSeriesPoint[];
  title?: string;
  alignmentName?: string;
  structures?: ProfileStructureMark[];
  className?: string;
}) {
  const [range, setRange] = useState<RangeKey>('5km');
  const [windowStart, setWindowStart] = useState(0);
  const [cursorStation, setCursorStation] = useState<number | null>(null);

  const allRows = useMemo(() => buildRows(series), [series]);
  const fullMin = allRows[0]?.station ?? 0;
  const fullMax = allRows[allRows.length - 1]?.station ?? 0;
  const fullSpan = Math.max(1, fullMax - fullMin);

  const windowMeters = useMemo(() => {
    const cfg = RANGES.find((r) => r.key === range);
    if (!cfg?.meters) return fullSpan;
    return Math.min(cfg.meters, fullSpan);
  }, [range, fullSpan]);

  useEffect(() => {
    setWindowStart(fullMin);
  }, [fullMin, range, series.length]);

  const filtered = useMemo(() => {
    if (!allRows.length) return [];
    if (range === 'all') return allRows;
    const end = windowStart + windowMeters;
    return allRows.filter((p) => p.station >= windowStart - 0.001 && p.station <= end + 0.001);
  }, [allRows, range, windowStart, windowMeters]);

  const elevBounds = useMemo(() => {
    const vals: number[] = [];
    filtered.forEach((p) => {
      if (p.ground_elevation != null) vals.push(p.ground_elevation);
      if (p.measured_ground != null) vals.push(p.measured_ground);
      vals.push(p.design_elevation);
    });
    if (!vals.length) return { min: 0, max: 100 };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(2, (max - min) * 0.12);
    return { min: min - pad, max: max + pad };
  }, [filtered]);

  const summary = useMemo(() => {
    const elevs = allRows.flatMap((p) =>
      [p.ground_elevation, p.design_elevation].filter((v): v is number => v != null),
    );
    return {
      points: allRows.length,
      stationFrom: formatStation(fullMin),
      stationTo: formatStation(fullMax),
      elevFrom: elevs.length ? Math.min(...elevs).toFixed(2) : '—',
      elevTo: elevs.length ? Math.max(...elevs).toFixed(2) : '—',
    };
  }, [allRows, fullMin, fullMax]);

  const viewFrom = filtered[0]?.station ?? windowStart;
  const viewTo = filtered[filtered.length - 1]?.station ?? windowStart + windowMeters;

  const shiftWindow = (dir: -1 | 1) => {
    const step = windowMeters * 0.5;
    const next = Math.min(
      Math.max(fullMin, windowStart + dir * step),
      Math.max(fullMin, fullMax - windowMeters),
    );
    setWindowStart(next);
  };

  const visibleStructures = structures.filter((s) => s.station >= viewFrom && s.station <= viewTo);

  if (!series.length) {
    return (
      <div
        className={cn(
          'flex h-[480px] items-center justify-center rounded-xl border border-border bg-[#0b1220] text-slate-400',
          className,
        )}
      >
        Профиль өгөгдөл байхгүй — Recalculate дарна уу
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-[#0b1220] text-slate-100 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="text-base font-semibold text-white">
            {title}
            {alignmentName ? ` — ${alignmentName}` : ''}
          </h3>
          <p className="text-xs text-slate-400">
            Өндөржилт (м) · станц {formatStation(viewFrom)} — {formatStation(viewTo)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-white/15">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition',
                  range === r.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-transparent text-slate-300 hover:bg-white/5',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-md border border-white/15 px-1 py-0.5">
            <button
              type="button"
              className="rounded p-1 text-slate-300 hover:bg-white/10 disabled:opacity-30"
              disabled={range === 'all' || windowStart <= fullMin}
              onClick={() => shiftWindow(-1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[120px] text-center text-xs text-slate-200">
              {formatStation(viewFrom)} - {formatStation(viewTo)}
            </span>
            <button
              type="button"
              className="rounded p-1 text-slate-300 hover:bg-white/10 disabled:opacity-30"
              disabled={range === 'all' || windowStart + windowMeters >= fullMax}
              onClick={() => shiftWindow(1)}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-[min(58vh,560px)] w-full px-2 pb-1 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filtered}
            margin={{ top: 12, right: 28, left: 8, bottom: 8 }}
            onMouseMove={(state) => {
              const st = state?.activePayload?.[0]?.payload?.station;
              setCursorStation(typeof st === 'number' ? st : null);
            }}
            onMouseLeave={() => setCursorStation(null)}
          >
            <defs>
              <linearGradient id="cutGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.65} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
            <XAxis
              dataKey="station"
              type="number"
              domain={[viewFrom, viewTo]}
              allowDataOverflow
              tickFormatter={(v) => formatStation(v)}
              stroke="#94a3b8"
              fontSize={11}
              tickCount={8}
            />
            <YAxis
              domain={[elevBounds.min, elevBounds.max]}
              allowDataOverflow
              stroke="#94a3b8"
              fontSize={11}
              width={56}
              tickFormatter={(v) => Number(v).toFixed(0)}
              label={{
                value: 'Өндөржилт (м)',
                angle: -90,
                position: 'insideLeft',
                fill: '#94a3b8',
                fontSize: 11,
                offset: 8,
              }}
            />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#e2e8f0',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  ground_elevation: 'Газрын өндөржилт',
                  measured_ground: 'Хэмжилтийн гадарга',
                  design_elevation: 'Төлөвлөсөн өндөржилт',
                  cut: 'Ухмал',
                  fill: 'Далан',
                };
                if (name === 'cutHeight' || name === 'cutBase' || name === 'fillHeight' || name === 'fillBase') {
                  return [null, null];
                }
                if (value == null || Number.isNaN(Number(value))) return ['—', labels[name] || name];
                return [Number(value).toFixed(3), labels[name] || name];
              }}
              labelFormatter={(label) => `Пикет: ${formatStation(Number(label))}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: 8, color: '#cbd5e1', fontSize: 12 }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  ground_elevation: 'Газрын өндөржилт',
                  measured_ground: 'Хэмжилтийн газрын гадарга',
                  design_elevation: 'Төлөвлөсөн өндөржилт',
                  cutHeight: 'Ухмал',
                  fillHeight: 'Далан',
                };
                return labels[value] || value;
              }}
            />

            <Area
              type="monotone"
              dataKey="cutBase"
              stackId="cut"
              stroke="none"
              fill="transparent"
              connectNulls={false}
              isAnimationActive={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="cutHeight"
              stackId="cut"
              name="cutHeight"
              stroke="none"
              fill="url(#cutGrad)"
              connectNulls={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="fillBase"
              stackId="fill"
              stroke="none"
              fill="transparent"
              connectNulls={false}
              isAnimationActive={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="fillHeight"
              stackId="fill"
              name="fillHeight"
              stroke="none"
              fill="url(#fillGrad)"
              connectNulls={false}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="ground_elevation"
              name="ground_elevation"
              stroke="#f97316"
              strokeWidth={2.2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="measured_ground"
              name="measured_ground"
              stroke="#a855f7"
              strokeWidth={1.8}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="design_elevation"
              name="design_elevation"
              stroke="#3b82f6"
              strokeWidth={2.6}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />

            {cursorStation != null && (
              <ReferenceLine
                x={cursorStation}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
              />
            )}

            {visibleStructures.map((s) => {
              const near = filtered.reduce((best, p) =>
                Math.abs(p.station - s.station) < Math.abs(best.station - s.station) ? p : best,
              filtered[0]);
              const y = near?.design_elevation ?? elevBounds.min + (elevBounds.max - elevBounds.min) * 0.5;
              return (
                <ReferenceDot
                  key={`${s.station}-${s.label}`}
                  x={s.station}
                  y={y}
                  r={5}
                  fill="#4ade80"
                  stroke="#166534"
                  label={{
                    value: s.label,
                    position: 'top',
                    fill: '#86efac',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-white/10 px-4 py-2 text-xs text-slate-400">
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" defaultChecked className="accent-orange-500" readOnly />
          Хоолой/Гүүр ({structures.length})
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" className="accent-orange-500" readOnly />
          Тэмдэг (0)
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" className="accent-orange-500" readOnly />
          Тэмдэглэл (0)
        </label>
        {cursorStation != null && (
          <span className="ml-auto text-slate-300">Курсор: {formatStation(cursorStation)}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/5 text-xs sm:grid-cols-5">
        {[
          { label: 'Alignment', value: alignmentName || '—' },
          { label: 'Profile нэр', value: title },
          { label: 'Цэг', value: String(summary.points) },
          { label: 'Пикет хүрээ', value: `${summary.stationFrom} - ${summary.stationTo}` },
          { label: 'Өндрийн хүрээ', value: `${summary.elevFrom} - ${summary.elevTo} м` },
        ].map((cell) => (
          <div key={cell.label} className="bg-[#0b1220] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{cell.label}</p>
            <p className="mt-0.5 font-medium text-slate-100">{cell.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
