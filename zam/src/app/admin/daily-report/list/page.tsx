'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deleteDailyReport,
  fetchDailyReports,
  todayLocalISO,
  type DailyReportRow,
} from '@/lib/dailyReport';
import { uiToast } from '@/lib/toast';

export default function DailyReportListPage() {
  const [date, setDate] = useState('');
  const [rows, setRows] = useState<DailyReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (d?: string) => {
    setLoading(true);
    try {
      const data = await fetchDailyReports(d ? { date: d } : undefined);
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Daily Report — Тайлангууд';
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Энэ тайланг устгах уу?')) return;
    const ok = await deleteDailyReport(id);
    if (ok) {
      uiToast.success('Устгагдлаа');
      load(date || undefined);
    } else {
      uiToast.error('Устгахад алдаа гарлаа');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Төсөл бүрийн өдөр тутмын тайлан</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            className="w-auto"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => load(date || undefined)}>
            Шүүх
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDate('');
              load();
            }}
          >
            Бүгд
          </Button>
          <Link
            href="/admin/daily-report/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-3.5" />
            Шинэ
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Огноо</TableHead>
              <TableHead>Төсөл</TableHead>
              <TableHead>Явц</TableHead>
              <TableHead>Ирц</TableHead>
              <TableHead>ХАБЭА</TableHead>
              <TableHead>Техник</TableHead>
              <TableHead>Материал</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Ачааллаж байна...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Тайлан олдсонгүй. Өнөөдөр ({todayLocalISO()}) шинэ тайлан үүсгэнэ үү.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.report_date}</TableCell>
                  <TableCell className="font-medium">{r.project?.name || `#${r.project_id}`}</TableCell>
                  <TableCell>
                    {r.progress_actual}/{r.progress_planned} {r.progress_unit || ''}
                  </TableCell>
                  <TableCell>
                    {r.labor_present}/{r.labor_planned}
                  </TableCell>
                  <TableCell>
                    {r.safety_incidents}/{r.safety_near_misses}
                  </TableCell>
                  <TableCell>
                    {r.equipment_working} / эвд.{r.equipment_broken}
                  </TableCell>
                  <TableCell>{r.materials_shortages}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
