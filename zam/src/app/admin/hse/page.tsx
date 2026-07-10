'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  FileWarning,
  HardHat,
  ShieldAlert,
  Wrench,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/admin/primitives';
import { fetchHseDashboard, type HseDashboard } from '@/lib/hse';

const MODULES = [
  { href: '/admin/hse/daily-safety', title: 'Өглөөний заавар', desc: 'Өдөр тутмын аюулгүй байдлын заавар' },
  { href: '/admin/hse/toolbox', title: 'Toolbox уулзалт', desc: 'Аюулгүй байдлын уулзалт, ирц' },
  { href: '/admin/hse/observations', title: 'Ажиглалт', desc: 'Аюултай нөхцөл, үйлдэл, сайн туршлага' },
  { href: '/admin/hse/near-miss', title: 'Ослын эрсдэл', desc: 'Near miss бүртгэл' },
  { href: '/admin/hse/incidents', title: 'Осол', desc: 'Ослын мэдээлэл, мөрдөн байцаалт' },
  { href: '/admin/hse/risk-assessment', title: 'Эрсдэлийн үнэлгээ', desc: 'JSA / JHA' },
  { href: '/admin/hse/permits', title: 'Ажилын зөвшөөрөл', desc: 'Permit to Work' },
  { href: '/admin/hse/inspections', title: 'Үзлэг', desc: 'Тоног төхөөрөмж, талбайн үзлэг' },
  { href: '/admin/hse/ppe', title: 'ХАБЭА хувцас', desc: 'PPE хуваарилалт' },
  { href: '/admin/hse/training', title: 'Сургалт', desc: 'Гэрчилгээ, хугацаа дуусах' },
  { href: '/admin/hse/equipment-safety', title: 'Тоног төхөөрөмж', desc: 'Өдөр тутмын үзлэг' },
  { href: '/admin/hse/environment', title: 'Байгаль орчин', desc: 'Тоос, дуу чимээ, хог хаягдал' },
  { href: '/admin/hse/capa', title: 'CAPA', desc: 'Засварлах арга хэмжээ' },
  { href: '/admin/hse/documents', title: 'Баримт бичиг', desc: 'Бодлого, журам, MSDS' },
  { href: '/admin/hse/reports', title: 'Тайлан', desc: 'ХАБЭА тайлангууд' },
  { href: '/admin/accident', title: 'Ослын дуудлага (хуучин)', desc: 'Уламжлалт ослын дуудлага' },
];

export default function HseHubPage() {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<HseDashboard | null>(null);

  useEffect(() => {
    document.title = 'Хөдөлмөрийн аюулгүй байдал';
    (async () => {
      setDash(await fetchHseDashboard());
      setLoading(false);
    })();
  }, []);

  const w = dash?.widgets;
  const di = dash?.daily_instruction;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Хөдөлмөрийн аюулгүй байдал (ХАБЭА)</h1>
        <p className="mt-1 text-sm text-muted-foreground">ISO 45001 — аюулгүй ажиллагааны удирдлагын систем</p>
      </div>

      {loading ? (
        <div className="flex min-h-[160px] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Өнөөдрийн заавар</CardDescription>
                <CardTitle className="text-3xl">{di?.completion_percentage ?? 0}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress percent={di?.completion_percentage ?? 0} />
                <p className="mt-2 text-xs text-muted-foreground">
                  {di?.completed_today ?? 0} / {di?.total_employees ?? 0} баталгаажсан
                </p>
              </CardContent>
            </Card>
            <Widget icon={FileWarning} label="Нээлттэй ажиглалт" value={w?.open_observations ?? 0} color="text-amber-600" />
            <Widget icon={AlertTriangle} label="Near miss" value={w?.near_miss_count ?? 0} color="text-orange-600" />
            <Widget icon={ShieldAlert} label="Нээлттэй осол" value={w?.open_incidents ?? 0} color="text-red-600" />
            <Widget icon={Wrench} label="CAPA хүлээгдэж буй" value={w?.pending_corrective_actions ?? 0} color="text-violet-600" />
            <Widget icon={ClipboardCheck} label="Гэрчилгээ дууссан" value={w?.expired_certificates ?? 0} color="text-rose-600" />
            <Widget icon={HardHat} label="PPE хугацаа дууссан" value={w?.expired_ppe ?? 0} color="text-yellow-600" />
            <Widget icon={ShieldAlert} label="Идэвхтэй зөвшөөрөл" value={w?.active_permits ?? 0} color="text-emerald-600" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ХАБЭА модулиуд</CardTitle>
              <CardDescription>Дэд системүүд</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {MODULES.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3 transition hover:bg-muted/60"
                >
                  <div>
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-sm text-muted-foreground">{m.desc}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Widget({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className={`mb-1 flex size-9 items-center justify-center rounded-lg bg-muted ${color}`}>
          <Icon className="size-4" />
        </div>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
