'use client';

import { useEffect, useState } from 'react';
import { Button, Select, Space, Table, message } from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DownloadOutlined } from '@/components/admin/icons';
import { ProjectSelect } from '@/components/admin/road/RoadSelectors';
import {
  BUDGET_CATEGORIES,
  BUDGET_STATUSES,
  downloadCsv,
  fetchBudget,
  fetchBudgets,
  formatMnt,
  type RoadBudget,
} from '@/lib/roadEngineering';

export default function BudgetReportsPage() {
  const [projectId, setProjectId] = useState<number>();
  const [budgetId, setBudgetId] = useState<number>();
  const [budgets, setBudgets] = useState<RoadBudget[]>([]);
  const [detail, setDetail] = useState<RoadBudget | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Төсвийн тайлан';
    fetchBudgets(projectId ? { project_id: projectId } : undefined)
      .then((list) => {
        setBudgets(list);
        if (!list.find((b) => b.id === budgetId)) setBudgetId(list[0]?.id);
      })
      .catch(() => setBudgets([]));
  }, [projectId]);

  const load = async () => {
    if (!budgetId) return message.warning('Төсөв сонгоно уу');
    setLoading(true);
    try {
      setDetail(await fetchBudget(budgetId));
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns: ColumnsType<Record<string, unknown>> = [
    {
      title: 'Ангилал',
      dataIndex: 'category',
      render: (v) => BUDGET_CATEGORIES.find((c) => c.value === v)?.label || String(v),
    },
    { title: 'Код', dataIndex: 'code' },
    { title: 'Тайлбар', dataIndex: 'description', ellipsis: true },
    { title: 'Нэгж', dataIndex: 'unit' },
    { title: 'Тоо', dataIndex: 'quantity', render: (v) => Number(v).toLocaleString() },
    { title: 'Үнэ', dataIndex: 'unit_price', render: (v) => formatMnt(Number(v)) },
    { title: 'Дүн', dataIndex: 'amount', render: (v) => formatMnt(Number(v)) },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Төсвийн тайлан</h2>
        <p className="text-sm text-muted-foreground">Дэлгэрэнгүй BOQ, ангиллын товчоо, Excel/PDF экспорт.</p>
      </div>

      <Space wrap>
        <ProjectSelect value={projectId} onChange={(id) => { setProjectId(id); setBudgetId(undefined); }} />
        <Select
          style={{ minWidth: 260 }}
          placeholder="Төсөв"
          value={budgetId}
          onChange={(v) => setBudgetId(Number(v))}
          options={budgets.map((b) => ({
            value: b.id,
            label: `${b.code} · ${BUDGET_STATUSES.find((s) => s.value === b.status)?.label || b.status}`,
          }))}
        />
        <Button type="primary" loading={loading} onClick={load}>
          Тайлан үүсгэх
        </Button>
        <Button
          icon={<DownloadOutlined />}
          disabled={!detail?.items?.length}
          onClick={() =>
            downloadCsv(
              `${detail?.code || 'budget'}-report.csv`,
              (detail?.items || []) as unknown as Record<string, unknown>[],
            )
          }
        >
          Excel
        </Button>
        <Button
          disabled={!detail}
          onClick={() => {
            if (!detail) return;
            const w = window.open('', '_blank');
            if (!w) return;
            w.document.write(`<html><head><title>${detail.code}</title></head><body>
              <h1>${detail.name}</h1>
              <p>Нийт: ${formatMnt(detail.total_amount)} · ${formatMnt(detail.cost_per_km)}/км</p>
              <h3>Ангилал</h3>
              <ul>${(detail.category_summary || [])
                .map((c) => `<li>${c.label}: ${formatMnt(c.amount)}</li>`)
                .join('')}</ul>
              <h3>Мөрүүд</h3>
              <table border="1" cellpadding="5"><tr><th>Код</th><th>Тайлбар</th><th>Тоо</th><th>Дүн</th></tr>
              ${(detail.items || [])
                .map(
                  (i) =>
                    `<tr><td>${i.code || ''}</td><td>${i.description}</td><td>${i.quantity}</td><td>${i.amount}</td></tr>`,
                )
                .join('')}
              </table></body></html>`);
            w.document.close();
            w.print();
          }}
        >
          PDF
        </Button>
      </Space>

      {detail && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Нийт', value: formatMnt(detail.total_amount) },
              { label: 'Үндсэн', value: formatMnt(detail.base_amount) },
              { label: '₮/км', value: formatMnt(detail.cost_per_km) },
              {
                label: 'Статус',
                value: BUDGET_STATUSES.find((s) => s.value === detail.status)?.label || detail.status,
              },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            ))}
          </div>

          <Table
            rowKey="category"
            dataSource={detail.category_summary || []}
            pagination={false}
            columns={[
              { title: 'Ангилал', dataIndex: 'label' },
              { title: 'Мөр', dataIndex: 'count' },
              { title: 'Дүн', dataIndex: 'amount', render: (v) => formatMnt(Number(v)) },
            ]}
          />

          <Table
            rowKey="id"
            loading={loading}
            dataSource={(detail.items || []) as unknown as Record<string, unknown>[]}
            columns={itemColumns}
            pagination={{ pageSize: 25 }}
            scroll={{ x: true }}
          />
        </>
      )}
    </div>
  );
}
