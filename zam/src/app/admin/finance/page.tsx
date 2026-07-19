'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Banknote, FileText, TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { fetchFinanceDashboard, formatMoney, type FinanceDashboard } from '@/lib/finance';

const LINKS = [
  { href: '/admin/finance/accounts', title: 'Касс / Банк', desc: 'Дансны бүртгэл' },
  { href: '/admin/finance/invoices', title: 'Нэхэмжлэх (авлага)', desc: 'Захиалагчийн нэхэмжлэх' },
  { href: '/admin/finance/bills', title: 'Нийлүүлэгчийн нэхэмжлэх', desc: 'Өглөг' },
  { href: '/admin/finance/payments', title: 'Төлбөр', desc: 'Орлого / зарлага' },
  { href: '/admin/finance/contracts', title: 'Гэрээ', desc: 'Санхүүгийн гэрээ' },
  { href: '/admin/finance/budgets', title: 'Төсөв', desc: 'Төсөл / компани' },
  { href: '/admin/finance/expenses', title: 'Зардлын бүртгэл', desc: 'Жижиг зардал' },
  { href: '/admin/finance/vat', title: 'НӨАТ бүртгэл', desc: 'Орлого / зарлагын НӨАТ' },
  { href: '/admin/finance/reports', title: 'Тайлан', desc: 'Aging, төсөв, НӨАТ' },
];

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4" />
          {label}
        </CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

export default function FinanceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<FinanceDashboard | null>(null);

  useEffect(() => {
    document.title = 'Санхүү';
    (async () => {
      try {
        setDash(await fetchFinanceDashboard());
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
          Замын компанийн касс, нэхэмжлэх, төлбөр, төсөв, НӨАТ
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Бэлэн мөнгө / банк" value={formatMoney(dash?.cash_total)} icon={Wallet} />
          <Kpi
            label="Авлага"
            value={formatMoney(dash?.ar_open)}
            hint={`Хугацаа хэтэрсэн: ${dash?.overdue_ar ?? 0}`}
            icon={TrendingUp}
          />
          <Kpi
            label="Өглөг"
            value={formatMoney(dash?.ap_open)}
            hint={`Хугацаа хэтэрсэн: ${dash?.overdue_ap ?? 0}`}
            icon={TrendingDown}
          />
          <Kpi
            label="Энэ сарын цэвэр"
            value={formatMoney(dash?.month_net)}
            hint={`Орлого ${formatMoney(dash?.month_in)} · Зарлага ${formatMoney(dash?.month_out)}`}
            icon={Banknote}
          />
        </div>
      )}

      {!loading && dash?.cash_by_account?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Дансны үлдэгдэл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dash.cash_by_account.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
                <span>
                  <span className="font-medium">{a.name}</span>
                  <span className="ml-2 text-muted-foreground">{a.code}</span>
                </span>
                <span className="tabular-nums font-medium">{formatMoney(a.balance)}</span>
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
              <div className="flex items-center gap-2 font-medium">
                <FileText className="size-4 text-primary" />
                {item.title}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}
