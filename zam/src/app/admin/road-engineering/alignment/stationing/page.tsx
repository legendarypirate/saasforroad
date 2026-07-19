'use client';

import { useEffect, useMemo, useState } from 'react';
import { Space, Table } from '@/components/admin/primitives';
import { AlignmentSelect, ProjectSelect } from '@/components/admin/road/RoadSelectors';
import { fetchRoadList, formatStation } from '@/lib/roadEngineering';

type StationRow = {
  id: number;
  station: number;
  label: string;
  element: string;
  bearing: string | number;
  radius: string | number;
};

export default function StationingPage() {
  const [projectId, setProjectId] = useState<number>();
  const [alignmentId, setAlignmentId] = useState<number>();
  const [elements, setElements] = useState<Record<string, unknown>[]>([]);
  const [interval, setInterval] = useState(100);

  useEffect(() => {
    document.title = 'Станцлал';
    if (!alignmentId) {
      setElements([]);
      return;
    }
    fetchRoadList<Record<string, unknown>>('horizontal-elements', { alignment_id: alignmentId })
      .then(setElements)
      .catch(() => setElements([]));
  }, [alignmentId]);

  const stations = useMemo(() => {
    if (!elements.length) return [] as StationRow[];
    const start = Math.min(...elements.map((e) => Number(e.start_station || 0)));
    const end = Math.max(...elements.map((e) => Number(e.end_station || e.start_station || 0)));
    const rows: StationRow[] = [];
    for (let s = start; s <= end + 0.001; s += interval) {
      const el = elements.find(
        (e) => s >= Number(e.start_station) && s <= Number(e.end_station ?? e.start_station),
      );
      rows.push({
        id: s,
        station: s,
        label: formatStation(s),
        element: String(el?.element_type || '—'),
        bearing: (el?.bearing as number | string) ?? '—',
        radius: (el?.radius as number | string) ?? '—',
      });
    }
    return rows;
  }, [elements, interval]);

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <ProjectSelect value={projectId} onChange={(id) => { setProjectId(id); setAlignmentId(undefined); }} />
        <AlignmentSelect projectId={projectId} value={alignmentId} onChange={setAlignmentId} />
        <select
          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
        >
          {[50, 100, 200, 500].map((n) => (
            <option key={n} value={n}>{n} м</option>
          ))}
        </select>
      </Space>
      <Table
        rowKey="id"
        dataSource={stations}
        columns={[
          { title: 'Станц', dataIndex: 'label' },
          { title: 'Элемент', dataIndex: 'element' },
          { title: 'Bearing', dataIndex: 'bearing' },
          { title: 'Radius', dataIndex: 'radius' },
        ]}
        pagination={{ pageSize: 25 }}
      />
    </div>
  );
}
