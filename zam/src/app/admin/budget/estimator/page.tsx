'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Form, Input, Space, message } from '@/components/admin/primitives';
import { ThunderboltOutlined } from '@/components/admin/icons';
import { ProjectSelect } from '@/components/admin/road/RoadSelectors';
import {
  createBudget,
  estimateBudget,
  fetchProjects,
  formatMnt,
  type RoadProject,
} from '@/lib/roadEngineering';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function BudgetEstimatorPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState<number>();
  const [project, setProject] = useState<RoadProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    budgetId: number;
    lines: number;
    total: number;
    costPerKm: number;
    cut: number;
    fill: number;
  } | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = 'Төсвийн тооцоолуур';
  }, []);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }
    fetchProjects().then((list) => {
      setProject(list.find((p) => p.id === projectId) || null);
    });
  }, [projectId]);

  const run = async () => {
    if (!projectId) {
      message.warning('Замын төсөл сонгоно уу');
      return;
    }
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const budget = await createBudget({
        project_id: projectId,
        name: values.name || `${project?.name || 'Төсөл'} — Автомат төсөв`,
        contingency_pct: Number(values.contingency_pct ?? 10),
        overhead_pct: Number(values.overhead_pct ?? 8),
        profit_pct: Number(values.profit_pct ?? 5),
        vat_pct: Number(values.vat_pct ?? 10),
        prepared_by: values.prepared_by || 'Замын инженер',
        estimate_method: 'hybrid',
      });
      if (!budget?.id) throw new Error('Төсөв үүсгэхэд алдаа');
      const est = await estimateBudget(budget.id);
      setResult({
        budgetId: budget.id,
        lines: est?.generated_lines || 0,
        total: est?.summary.total || 0,
        costPerKm: est?.summary.cost_per_km || 0,
        cut: est?.summary.cut || 0,
        fill: est?.summary.fill || 0,
      });
      setStep(2);
      message.success('Төсөв тооцоологдлоо');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Төсөл', 'Параметр', 'Үр дүн'];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Замын инженерийн өгөгдлөөс (шороо, хучилт, culvert/гүүр, BOQ) нэгж үнээр автомат төсөв гаргана.
        </p>
      </div>

      <div className="flex gap-2">
        {stepLabels.map((label, i) => (
          <div
            key={label}
            className={cn(
              'flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium',
              i === step
                ? 'border-primary bg-primary/10 text-foreground'
                : i < step
                  ? 'border-emerald-500/40 text-emerald-600'
                  : 'border-border text-muted-foreground',
            )}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card className="dark:border-[color:var(--neon-border)]">
          <CardHeader>
            <CardTitle className="text-base">1. Замын төсөл сонгох</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProjectSelect value={projectId} onChange={setProjectId} allowClear={false} />
            {project && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p>
                  <b>{project.code}</b> — {project.name}
                </p>
                <p className="text-muted-foreground">
                  Урт: {Number(project.length || 0).toLocaleString()} м · Анги: {project.road_class || '—'} ·{' '}
                  {project.province || ''}
                </p>
              </div>
            )}
            <Button type="primary" disabled={!projectId} onClick={() => setStep(1)}>
              Үргэлжлүүлэх
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="dark:border-[color:var(--neon-border)]">
          <CardHeader>
            <CardTitle className="text-base">2. Төсвийн параметр</CardTitle>
          </CardHeader>
          <CardContent>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                contingency_pct: 10,
                overhead_pct: 8,
                profit_pct: 5,
                vat_pct: 10,
                prepared_by: 'Замын инженер',
              }}
            >
              <Form.Item name="name" label="Төсвийн нэр">
                <Input placeholder="Bid / Анхны төсөв" />
              </Form.Item>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Form.Item name="contingency_pct" label="Нөөц %">
                  <Input type="number" />
                </Form.Item>
                <Form.Item name="overhead_pct" label="Нэмэлт %">
                  <Input type="number" />
                </Form.Item>
                <Form.Item name="profit_pct" label="Ашиг %">
                  <Input type="number" />
                </Form.Item>
                <Form.Item name="vat_pct" label="НӨАТ %">
                  <Input type="number" />
                </Form.Item>
              </div>
              <Form.Item name="prepared_by" label="Бэлтгэсэн">
                <Input />
              </Form.Item>
              <Space>
                <Button onClick={() => setStep(0)}>Буцах</Button>
                <Button type="primary" icon={<ThunderboltOutlined />} loading={loading} onClick={run}>
                  Тооцоолох
                </Button>
              </Space>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 2 && result && (
        <Card className="dark:border-[color:var(--neon-border)]">
          <CardHeader>
            <CardTitle className="text-base">3. Үр дүн</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Нийт төсөв', value: formatMnt(result.total) },
                { label: 'Зардал / км', value: formatMnt(result.costPerKm) },
                { label: 'Мөрийн тоо', value: String(result.lines) },
                {
                  label: 'Ухалт / Дүүргэлт',
                  value: `${result.cut.toLocaleString()} / ${result.fill.toLocaleString()} м³`,
                },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-lg font-bold">{c.value}</p>
                </div>
              ))}
            </div>
            <Space>
              <Button type="primary" onClick={() => router.push(`/admin/budget/${result.budgetId}`)}>
                Төсөв нээх
              </Button>
              <Button
                onClick={() => {
                  setResult(null);
                  setStep(0);
                }}
              >
                Шинээр тооцох
              </Button>
            </Space>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
