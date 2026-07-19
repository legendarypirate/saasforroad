'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Table } from '@/components/admin/primitives';
import { fetchFinanceReports, formatMoney, type FinanceReports } from '@/lib/finance';

const AGING_LABELS: Record<string, string> = {
  current: 'Хугацаандаа',
  '1_30': '1–30 хоног',
  '31_60': '31–60',
  '61_90': '61–90',
  '90_plus': '90+',
};

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinanceReports | null>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    document.title = 'Санхүүгийн тайлан';
    (async () => {
      try {
        setData(await fetchFinanceReports(year));
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [year]);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  const agingRows = (aging: Record<string, number> | undefined) =>
    Object.entries(AGING_LABELS).map(([key, label]) => ({
      key,
      label,
      amount: aging?.[key] ?? 0,
    }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Авлага/өглөгийн aging, данс, төсөв ({year}), НӨАТ</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Авлагын aging</CardTitle>
            <CardDescription>Нээлттэй нэхэмжлэх</CardDescription>
          </CardHeader>
          <CardContent>
            <Table
              rowKey="key"
              pagination={false}
              dataSource={agingRows(data?.ar_aging)}
              columns={[
                { title: 'Бүлэг', dataIndex: 'label' },
                {
                  title: 'Дүн',
                  dataIndex: 'amount',
                  align: 'right',
                  render: (v) => formatMoney(v),
                },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Өглөгийн aging</CardTitle>
            <CardDescription>Нийлүүлэгчийн нэхэмжлэх</CardDescription>
          </CardHeader>
          <CardContent>
            <Table
              rowKey="key"
              pagination={false}
              dataSource={agingRows(data?.ap_aging)}
              columns={[
                { title: 'Бүлэг', dataIndex: 'label' },
                {
                  title: 'Дүн',
                  dataIndex: 'amount',
                  align: 'right',
                  render: (v) => formatMoney(v),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Дансны үлдэгдэл</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            rowKey="id"
            pagination={false}
            dataSource={data?.cash_by_account || []}
            columns={[
              { title: 'Код', dataIndex: 'code', width: 100 },
              { title: 'Нэр', dataIndex: 'name' },
              {
                title: 'Үлдэгдэл',
                dataIndex: 'balance',
                align: 'right',
                render: (v) => formatMoney(v),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Төсөв vs бодит ({year})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            rowKey="budget_id"
            pagination={false}
            dataSource={data?.project_cost || []}
            columns={[
              { title: 'Төсөл', dataIndex: 'project_name' },
              { title: 'Ангилал', dataIndex: 'category' },
              {
                title: 'Төлөвлөгөө',
                dataIndex: 'planned',
                align: 'right',
                render: (v) => formatMoney(v),
              },
              {
                title: 'Бодит',
                dataIndex: 'actual',
                align: 'right',
                render: (v) => formatMoney(v),
              },
              {
                title: 'Зөрүү',
                dataIndex: 'variance',
                align: 'right',
                render: (v) => formatMoney(v),
              },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Гарах НӨАТ</CardDescription>
            <CardTitle className="text-xl">{formatMoney(data?.vat_summary?.output)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Орох НӨАТ</CardDescription>
            <CardTitle className="text-xl">{formatMoney(data?.vat_summary?.input)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Төлөх НӨАТ</CardDescription>
            <CardTitle className="text-xl">{formatMoney(data?.vat_summary?.payable)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
