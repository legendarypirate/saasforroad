'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Space, Table, Tag, message, Select } from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { ReloadOutlined } from '@/components/admin/icons';
import { AlignmentSelect, ProjectSelect } from '@/components/admin/road/RoadSelectors';
import {
  calculateEarthwork,
  downloadCsv,
  fetchRoadList,
  formatStation,
} from '@/lib/roadEngineering';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type EwRow = Record<string, unknown>;

export default function EarthworkPage() {
  const [projectId, setProjectId] = useState<number>();
  const [alignmentId, setAlignmentId] = useState<number>();
  const [interval, setInterval] = useState(25);
  const [rows, setRows] = useState<EwRow[]>([]);
  const [summary, setSummary] = useState({
    total_cut: 0,
    total_fill: 0,
    net_volume: 0,
    borrow: 0,
    waste: 0,
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!alignmentId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchRoadList<EwRow>('earthworks', { alignment_id: alignmentId });
      setRows(data);
      const total_cut = data.reduce((s, r) => s + Number(r.cut_volume || 0), 0);
      const total_fill = data.reduce((s, r) => s + Number(r.fill_volume || 0), 0);
      setSummary({
        total_cut: Number(total_cut.toFixed(3)),
        total_fill: Number(total_fill.toFixed(3)),
        net_volume: Number((total_cut - total_fill).toFixed(3)),
        borrow: Number(Math.max(0, total_fill - total_cut).toFixed(3)),
        waste: Number(Math.max(0, total_cut - total_fill).toFixed(3)),
      });
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [alignmentId]);

  useEffect(() => {
    document.title = 'Шорооны ажил';
    load();
  }, [load]);

  const columns: ColumnsType<EwRow> = useMemo(
    () => [
      { title: 'Станц', dataIndex: 'station', render: (v) => formatStation(Number(v)) },
      { title: 'Газар', dataIndex: 'ground_elevation' },
      { title: 'Зураг төсөл', dataIndex: 'design_elevation' },
      {
        title: 'Cut depth',
        dataIndex: 'cut_depth',
        render: (v) => <span className="text-red-500">{Number(v).toFixed(3)}</span>,
      },
      {
        title: 'Fill depth',
        dataIndex: 'fill_depth',
        render: (v) => <span className="text-emerald-500">{Number(v).toFixed(3)}</span>,
      },
      { title: 'Cut area', dataIndex: 'cut_area' },
      { title: 'Fill area', dataIndex: 'fill_area' },
      {
        title: 'Cut м³',
        dataIndex: 'cut_volume',
        render: (v) => <Tag color="red">{Number(v).toFixed(2)}</Tag>,
      },
      {
        title: 'Fill м³',
        dataIndex: 'fill_volume',
        render: (v) => <Tag color="green">{Number(v).toFixed(2)}</Tag>,
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <Space wrap>
        <ProjectSelect value={projectId} onChange={(id) => { setProjectId(id); setAlignmentId(undefined); }} />
        <AlignmentSelect projectId={projectId} value={alignmentId} onChange={setAlignmentId} />
        <Select
          value={interval}
          style={{ width: 120 }}
          onChange={setInterval}
          options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} м` }))}
        />
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button
          type="primary"
          disabled={!alignmentId}
          onClick={async () => {
            if (!alignmentId) return;
            try {
              const result = await calculateEarthwork({
                alignment_id: alignmentId,
                interval,
                road_width: 7.5,
              });
              if (result?.summary) setSummary(result.summary);
              message.success('Шорооны ажил тооцоологдлоо');
              load();
            } catch (e) {
              message.error(e instanceof Error ? e.message : 'Алдаа');
            }
          }}
        >
          Автомат тооцоолол
        </Button>
        <Button onClick={() => downloadCsv('earthwork.csv', rows)}>Export</Button>
      </Space>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Total Cut', value: summary.total_cut, color: 'text-red-500' },
          { label: 'Total Fill', value: summary.total_fill, color: 'text-emerald-500' },
          { label: 'Net Volume', value: summary.net_volume, color: 'text-foreground' },
          { label: 'Borrow', value: summary.borrow, color: 'text-amber-500' },
          { label: 'Waste', value: summary.waste, color: 'text-orange-500' },
        ].map((c) => (
          <Card key={c.label} className="dark:border-[color:var(--neon-border)]">
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-xs text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-bold ${c.color}`}>{c.value.toLocaleString()} м³</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 20 }}
        scroll={{ x: true }}
      />
    </div>
  );
}
