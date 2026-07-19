'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Table, Tag } from '@/components/admin/primitives';
import { fetchUniformReports } from '@/lib/uniform';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchUniformReports>>>(null);

  useEffect(() => {
    document.title = 'Хувцас хангамжийн тайлан';
    (async () => {
      try {
        setData(await fetchUniformReports());
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Хүнээр, бараагаар олголт · үлдэгдэл</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ажилтнаар</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              rowKey="username"
              pagination={false}
              dataSource={data?.by_person || []}
              columns={[
                { title: 'Ажилтан', dataIndex: 'username' },
                { title: 'Олголт', dataIndex: 'issues', align: 'right' },
                { title: 'Нийт ширхэг', dataIndex: 'qty', align: 'right' },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Бараагаар</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              rowKey="name"
              pagination={false}
              dataSource={data?.by_item || []}
              columns={[
                { title: 'Бараа', dataIndex: 'name' },
                { title: 'Олгосон', dataIndex: 'qty', align: 'right' },
                { title: 'Буцаасан', dataIndex: 'returned', align: 'right' },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Үлдэгдэл</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            rowKey="id"
            pagination={false}
            dataSource={data?.stock || []}
            columns={[
              { title: 'Код', dataIndex: 'code', width: 90 },
              { title: 'Нэр', dataIndex: 'name' },
              { title: 'Төрөл', dataIndex: 'category' },
              {
                title: 'Үлдэгдэл',
                dataIndex: 'stock_qty',
                align: 'right',
                render: (v, r) => (
                  <span>
                    {v}{' '}
                    {r.low ? <Tag color="orange">бага</Tag> : null}
                  </span>
                ),
              },
              { title: 'Min', dataIndex: 'min_stock', align: 'right' },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
