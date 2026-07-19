'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Space, Table, message } from '@/components/admin/primitives';
import { ReloadOutlined } from '@/components/admin/icons';
import { fetchPlantList, formatQty } from '@/lib/plant';

export default function Page() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchPlantList('stocks'));
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Үйлдвэр — Үлдэгдэл';
    load();
  }, [load]);

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 20 }}
        columns={[
          {
            title: 'Үйлдвэр',
            key: 'plant',
            render: (_, r) => (r.plant as { name?: string } | undefined)?.name || '—',
          },
          {
            title: 'Түүхий эд',
            key: 'material',
            render: (_, r) => (r.material as { name?: string } | undefined)?.name || '—',
          },
          {
            title: 'Үлдэгдэл',
            dataIndex: 'quantity',
            align: 'right',
            render: (v, r) =>
              formatQty(Number(v), (r.material as { unit?: string } | undefined)?.unit || 'тн'),
          },
        ]}
      />
    </div>
  );
}
