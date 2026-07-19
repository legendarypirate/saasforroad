'use client';

import { useState } from 'react';
import { Button, Select, Space, Table, message } from '@/components/admin/primitives';
import { ProjectSelect, AlignmentSelect } from '@/components/admin/road/RoadSelectors';
import { downloadCsv, fetchReport } from '@/lib/roadEngineering';

const REPORTS = [
  { value: 'road-summary', label: 'Замын товч' },
  { value: 'earthwork-summary', label: 'Шорооны товч' },
  { value: 'alignment', label: 'Тэнхлэгийн тайлан' },
  { value: 'pi', label: 'PI тайлан' },
  { value: 'cross-section', label: 'Хөндлөн огтлол' },
  { value: 'drainage', label: 'Ус зайлуулалт' },
  { value: 'structure', label: 'Байгууламж' },
  { value: 'boq', label: 'BOQ' },
];

export default function RoadReportsPage() {
  const [type, setType] = useState('road-summary');
  const [projectId, setProjectId] = useState<number>();
  const [alignmentId, setAlignmentId] = useState<number>();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [extra, setExtra] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchReport(type, {
        project_id: projectId,
        alignment_id: alignmentId,
      });
      if (Array.isArray(data)) {
        setRows(data as Record<string, unknown>[]);
        setExtra('');
      } else if (data && typeof data === 'object' && 'rows' in (data as object)) {
        const payload = data as { rows: Record<string, unknown>[]; summary?: unknown; total?: number };
        setRows(payload.rows || []);
        setExtra(
          payload.summary
            ? JSON.stringify(payload.summary, null, 2)
            : payload.total != null
              ? `Нийт дүн: ${payload.total.toLocaleString()}`
              : '',
        );
      } else {
        setRows([]);
        setExtra(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  };

  const columns =
    rows[0]
      ? Object.keys(rows[0])
          .filter((k) => k !== 'createdAt' && k !== 'updatedAt')
          .slice(0, 10)
          .map((k) => ({
            title: k,
            dataIndex: k,
            ellipsis: true,
            render: (v: unknown) =>
              v != null && typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—'),
          }))
      : [{ title: 'Мэдээлэл', dataIndex: 'id' }];

  return (
    <div className="space-y-4">
      <Space wrap>
        <Select
          style={{ minWidth: 200 }}
          value={type}
          onChange={setType}
          options={REPORTS}
        />
        <ProjectSelect value={projectId} onChange={(id) => { setProjectId(id); setAlignmentId(undefined); }} />
        <AlignmentSelect projectId={projectId} value={alignmentId} onChange={setAlignmentId} />
        <Button type="primary" loading={loading} onClick={load}>
          Үүсгэх
        </Button>
        <Button disabled={!rows.length} onClick={() => downloadCsv(`road-report-${type}.csv`, rows)}>
          Excel / CSV
        </Button>
        <Button
          disabled={!rows.length && !extra}
          onClick={() => {
            const w = window.open('', '_blank');
            if (!w) return;
            w.document.write(`<html><head><title>${type}</title></head><body><h1>${type}</h1><pre>${extra}</pre><table border="1" cellpadding="4"><tr>${(columns as Array<{ title: string }>).map((c) => `<th>${c.title}</th>`).join('')}</tr>${rows.map((r) => `<tr>${(columns as Array<{ dataIndex: string }>).map((c) => `<td>${String(r[c.dataIndex] ?? '')}</td>`).join('')}</tr>`).join('')}</table></body></html>`);
            w.document.close();
            w.print();
          }}
        >
          PDF
        </Button>
      </Space>

      {extra && (
        <pre className="overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground">
          {extra}
        </pre>
      )}

      <Table
        rowKey={(r) => String(r.id ?? JSON.stringify(r).slice(0, 40))}
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 20 }}
        scroll={{ x: true }}
      />
    </div>
  );
}
