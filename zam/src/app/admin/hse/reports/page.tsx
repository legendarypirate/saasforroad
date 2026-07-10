'use client';

import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Space, Table } from '@/components/admin/primitives';
import { ReloadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import { fetchHseReport } from '@/lib/hse';

export default function HseReportsPage() {
  const [from, setFrom] = useState(dayjs().startOf('month'));
  const [to, setTo] = useState(dayjs());
  const [daily, setDaily] = useState<Record<string, unknown> | null>(null);
  const [incidents, setIncidents] = useState<Record<string, unknown> | null>(null);
  const [scores, setScores] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const f = from.format('YYYY-MM-DD');
    const t = to.format('YYYY-MM-DD');
    const [d, i, s] = await Promise.all([
      fetchHseReport('daily', f, t),
      fetchHseReport('incidents', f, t),
      fetchHseReport('project-score', f, t),
    ]);
    setDaily(d as Record<string, unknown>);
    setIncidents(i as Record<string, unknown>);
    setScores((s as Array<Record<string, unknown>>) || []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = 'ХАБЭА тайлан';
    load();
  }, []);

  return (
    <div className="space-y-4">
      <Space wrap>
        <h2 style={{ margin: 0 }}>ХАБЭА тайлан</h2>
        <DatePicker value={from} onChange={(d) => d && setFrom(d)} />
        <DatePicker value={to} onChange={(d) => d && setTo(d)} />
        <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>
          Шинэчлэх
        </Button>
      </Space>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Өдрийн тойм" size="small">
          <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(daily, null, 2)}</pre>
        </Card>
        <Card title="Ослын статистик" size="small">
          <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(incidents, null, 2)}</pre>
        </Card>
      </div>

      <Card title="Төслийн аюулгүй байдлын оноо" size="small">
        <Table
          rowKey="project_id"
          dataSource={scores}
          pagination={false}
          columns={[
            { title: 'Төсөл', dataIndex: 'project_name' },
            { title: 'Осол', dataIndex: 'incidents' },
            { title: 'Ажиглалт', dataIndex: 'observations' },
            { title: 'Заавар', dataIndex: 'instruction_acks' },
            { title: 'Оноо', dataIndex: 'safety_score' },
          ]}
        />
      </Card>
    </div>
  );
}
