'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveDailyReport, todayLocalISO } from '@/lib/dailyReport';
import { uiToast } from '@/lib/toast';

type Project = { id: number; name: string };

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <Input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
  );
}

export default function NewDailyReportPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    report_date: todayLocalISO(),
    project_id: '',
    weather_note: '',
    progress_planned: 100,
    progress_actual: 0,
    progress_unit: '%',
    progress_note: '',
    safety_incidents: 0,
    safety_near_misses: 0,
    safety_note: '',
    labor_planned: 0,
    labor_present: 0,
    labor_absent: 0,
    labor_overtime: 0,
    labor_note: '',
    equipment_working: 0,
    equipment_idle: 0,
    equipment_broken: 0,
    equipment_note: '',
    materials_shortages: 0,
    materials_note: '',
    attention_needed: '',
    notes: '',
  });

  useEffect(() => {
    document.title = 'Шинэ Daily Report';
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`);
        const json = await res.json();
        if (json.success) setProjects(json.data || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id) {
      uiToast.error('Төсөл сонгоно уу');
      return;
    }
    setSaving(true);
    try {
      let created_by: number | null = null;
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        created_by = user.id || null;
      } catch {
        created_by = null;
      }

      const result = await saveDailyReport({
        ...form,
        project_id: Number(form.project_id),
        created_by,
        status: 'submitted',
      });
      if (result.ok) {
        uiToast.success(result.data ? 'Тайлан хадгалагдлаа' : 'Амжилттай');
        router.push('/admin/daily-report');
      } else {
        uiToast.error(result.message || 'Хадгалахад алдаа гарлаа');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Шинэ өдрийн тайлан</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Төслийн менежер бөглөнө — захирал зөвхөн товч хардаг
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Үндсэн</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Огноо">
            <Input
              type="date"
              value={form.report_date}
              onChange={(e) => set('report_date', e.target.value)}
              required
            />
          </Field>
          <Field label="Төсөл">
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={form.project_id}
              onChange={(e) => set('project_id', e.target.value)}
              required
            >
              <option value="">Сонгох...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Цаг агаар / нөхцөл (1 мөр)">
              <Input
                value={form.weather_note}
                onChange={(e) => set('weather_note', e.target.value)}
                placeholder="Ж: бороо, хүйтэн, хэвийн"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Явц</CardTitle>
          <CardDescription>Төлөвлөсөн vs гүйцэтгэсэн</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Төлөвлөсөн">
            <NumInput value={form.progress_planned} onChange={(n) => set('progress_planned', n)} />
          </Field>
          <Field label="Гүйцэтгэсэн">
            <NumInput value={form.progress_actual} onChange={(n) => set('progress_actual', n)} />
          </Field>
          <Field label="Нэгж">
            <Input value={form.progress_unit} onChange={(e) => set('progress_unit', e.target.value)} />
          </Field>
          <div className="sm:col-span-3">
            <Field label="Тэмдэглэл">
              <Input value={form.progress_note} onChange={(e) => set('progress_note', e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ХАБЭА</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Осол">
            <NumInput value={form.safety_incidents} onChange={(n) => set('safety_incidents', n)} />
          </Field>
          <Field label="Осолд дөхсөн">
            <NumInput
              value={form.safety_near_misses}
              onChange={(n) => set('safety_near_misses', n)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Тайлбар">
              <Input value={form.safety_note} onChange={(e) => set('safety_note', e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ажилтны ирц</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Төлөвлөсөн">
            <NumInput value={form.labor_planned} onChange={(n) => set('labor_planned', n)} />
          </Field>
          <Field label="Ирсэн">
            <NumInput value={form.labor_present} onChange={(n) => set('labor_present', n)} />
          </Field>
          <Field label="Тасалсан">
            <NumInput value={form.labor_absent} onChange={(n) => set('labor_absent', n)} />
          </Field>
          <Field label="Илүү цаг (хүн)">
            <NumInput value={form.labor_overtime} onChange={(n) => set('labor_overtime', n)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Техник</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Ажиллаж буй">
            <NumInput value={form.equipment_working} onChange={(n) => set('equipment_working', n)} />
          </Field>
          <Field label="Зогссон">
            <NumInput value={form.equipment_idle} onChange={(n) => set('equipment_idle', n)} />
          </Field>
          <Field label="Эвдэрсэн">
            <NumInput value={form.equipment_broken} onChange={(n) => set('equipment_broken', n)} />
          </Field>
          <div className="sm:col-span-3">
            <Field label="Тэмдэглэл">
              <Input
                value={form.equipment_note}
                onChange={(e) => set('equipment_note', e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Бараа материал</CardTitle>
          <CardDescription>Зөвхөн чухал дутагдлын тоо + товч тайлбар</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Чухал дутагдал (тоо)">
            <NumInput
              value={form.materials_shortages}
              onChange={(n) => set('materials_shortages', n)}
            />
          </Field>
          <Field label="Тайлбар">
            <Input
              value={form.materials_note}
              onChange={(e) => set('materials_note', e.target.value)}
              placeholder="Ж: битум, цемент"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Захиралд анхааруулах</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Анхаарах зүйл (1–2 өгүүлбэр)">
            <Textarea
              rows={2}
              value={form.attention_needed}
              onChange={(e) => set('attention_needed', e.target.value)}
              placeholder="Шийдвэр хэрэгтэй зүйл байвал энд"
            />
          </Field>
          <Field label="Нэмэлт тэмдэглэл">
            <Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-8">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/daily-report')}>
          Болих
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Хадгалж байна...' : 'Илгээх'}
        </Button>
      </div>
    </form>
  );
}
