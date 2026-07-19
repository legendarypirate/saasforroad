'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Package, Shirt, AlertTriangle, ClipboardList } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { fetchUniformDashboard, type UniformDashboard } from '@/lib/uniform';

const LINKS = [
  { href: '/admin/uniform/items', title: 'Барааны бүртгэл', desc: 'Хувцас, гутал, бээлий...' },
  { href: '/admin/uniform/stock', title: 'Үлдэгдэл', desc: 'Орлого / тохируулга' },
  { href: '/admin/uniform/issues', title: 'Олголтын бүртгэл', desc: 'Хэнд, юу, хэзээ' },
  { href: '/admin/uniform/returns', title: 'Буцаалт', desc: 'Буцаах / гэмтсэн' },
  { href: '/admin/uniform/requests', title: 'Хүсэлт', desc: 'Батлах → олгох' },
  { href: '/admin/uniform/reports', title: 'Тайлан', desc: 'Хүнээр, бараагаар' },
];

export default function UniformDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<UniformDashboard | null>(null);

  useEffect(() => {
    document.title = 'Хувцас хэрэглэл хангамж';
    (async () => {
      try {
        setDash(await fetchUniformDashboard());
      } catch {
        setDash(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Ажилчдад олгосон хувцас, хэрэгслийн бүртгэл — огноо, хүн, бараа, хэмжээ
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="size-4" /> Бараа
              </CardDescription>
              <CardTitle className="text-3xl">{dash?.item_count ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="size-4" /> Бага үлдэгдэл
              </CardDescription>
              <CardTitle className="text-3xl">{dash?.low_stock_count ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Shirt className="size-4" /> Өнөөдөр олгосон
              </CardDescription>
              <CardTitle className="text-3xl">{dash?.issues_today ?? 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Энэ сард: {dash?.issues_month ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ClipboardList className="size-4" /> Нээлттэй олголт
              </CardDescription>
              <CardTitle className="text-3xl">{dash?.open_issues ?? 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Хүсэлт хүлээгдэж: {dash?.pending_requests ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && dash?.low_stock?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Бага үлдэгдэлтэй бараа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dash.low_stock.map((i) => (
              <div key={i.id} className="flex justify-between border-b border-border/60 py-2 text-sm last:border-0">
                <span>{i.name}</span>
                <span className="tabular-nums text-amber-600">
                  {i.stock_qty} / min {i.min_stock}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
          >
            <div>
              <div className="font-medium">{item.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
