'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, Card, Col, Row, Select, Space, Statistic, Switch, Table, Tag, Typography, message,
} from '@/components/admin/primitives';
import { ReloadOutlined, WarningOutlined } from '@/components/admin/icons';
import { formatMoney, formatQty, inventoryApi } from '@/lib/inventory';

const { Text } = Typography;

export default function StockPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [dashboard, setDashboard] = useState<any>({});
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | undefined>();
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (warehouseId) params.warehouse_id = String(warehouseId);
      if (lowOnly) params.low_stock = '1';
      const [stockRes, dash, wh] = await Promise.all([
        inventoryApi.stocks.list(params),
        inventoryApi.dashboard(),
        inventoryApi.warehouses.list(),
      ]);
      setRows(stockRes.data || []);
      setTotals(stockRes.totals || {});
      setDashboard(dash);
      setWarehouses(wh);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [warehouseId, lowOnly]);

  useEffect(() => {
    document.title = 'Үлдэгдэл';
    load();
  }, [load]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Text type="secondary">
            Үлдэгдэл зөвхөн баримтаар өөрчлөгдөнө (орлого/зарлага/шилжүүлэг/тохируулга)
          </Text>
        </div>
        <Space wrap>
          <Select
            allowClear
            placeholder="Агуулах"
            style={{ width: 200 }}
            value={warehouseId}
            onChange={setWarehouseId}
            options={warehouses.map((w: any) => ({ value: w.id, label: w.name }))}
          />
          <Space>
            <Text>Дутуу үлдэгдэл</Text>
            <Switch checked={lowOnly} onChange={setLowOnly} />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Шинэчлэх
          </Button>
        </Space>
      </div>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Нийт үнэлгээ" value={dashboard.inventoryValue || totals.totalValue || 0} suffix="₮" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="SKU" value={totals.skuCount || 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Дутуу үлдэгдэл"
              value={totals.lowStockCount || dashboard.lowStock || 0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Дууссан"
              value={totals.outOfStockCount || dashboard.outOfStock || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        scroll={{ x: 1000 }}
        columns={[
          { title: 'Код', dataIndex: ['material', 'code'], width: 100 },
          { title: 'Бараа', dataIndex: ['material', 'name'] },
          { title: 'Агуулах', dataIndex: ['warehouse', 'name'], width: 140 },
          { title: 'Нэгж', dataIndex: ['material', 'unit'], width: 70 },
          {
            title: 'Үлдэгдэл',
            dataIndex: 'quantity',
            width: 100,
            align: 'right',
            render: (v) => formatQty(v),
          },
          {
            title: 'Боломжтой',
            dataIndex: 'available_quantity',
            width: 100,
            align: 'right',
            render: (v) => formatQty(v),
          },
          {
            title: 'Захиалга',
            dataIndex: ['material', 'reorder_level'],
            width: 90,
            align: 'right',
          },
          {
            title: 'Дундаж үнэ',
            dataIndex: 'average_cost',
            width: 110,
            align: 'right',
            render: (v, r) => formatMoney(v || r.material?.average_cost),
          },
          {
            title: 'Үнэлгээ',
            dataIndex: 'stock_value',
            width: 120,
            align: 'right',
            render: (v) => formatMoney(v),
          },
          {
            title: 'Төлөв',
            width: 110,
            render: (_, r) =>
              r.is_out ? (
                <Tag color="red">Дууссан</Tag>
              ) : r.is_low ? (
                <Tag color="orange">Дутуу</Tag>
              ) : (
                <Tag color="green">Хэвийн</Tag>
              ),
          },
        ]}
      />
    </div>
  );
}
