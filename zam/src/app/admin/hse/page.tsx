'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

type AccidentRow = {
  id: number;
  status?: number | string;
  location?: string;
  description?: string;
  createdAt?: string;
};

export default function HseHubPage() {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    document.title = 'Хөдөлмөрийн аюулгүй байдал';
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accident`);
        const json = await res.json();
        const rows: AccidentRow[] = json.success ? json.data || [] : [];
        setTotal(rows.length);
        setOpen(rows.filter((r) => Number(r.status) !== 2).length);
      } catch {
        setTotal(0);
        setOpen(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Хөдөлмөрийн аюулгүй байдал</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ХАБЭА — осол, эрсдэл, аюулгүй ажиллагааны бүртгэл
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                <ShieldAlert className="size-5" />
              </div>
              <CardTitle className="text-base">Нийт осол</CardTitle>
              <CardDescription>Бүртгэгдсэн дуудлага</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <AlertTriangle className="size-5" />
              </div>
              <CardTitle className="text-base">Нээлттэй</CardTitle>
              <CardDescription>Шийдэгдээгүй дуудлага</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{open}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Модулиуд</CardTitle>
          <CardDescription>ХАБЭА-н дэд цэс</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/admin/accident"
            className="flex items-center justify-between rounded-xl border border-border px-4 py-3 transition hover:bg-muted/60"
          >
            <div>
              <p className="font-semibold">Ослын дуудлага</p>
              <p className="text-sm text-muted-foreground">Осол, дуудлагын бүртгэл, шийдвэрлэлт</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
