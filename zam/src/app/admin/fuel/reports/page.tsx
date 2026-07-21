'use client';

import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  DatePicker,
  Select,
  Space,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  downloadCsv,
  downloadExcel,
  fetchFuelList,
  fetchFuelReports,
  FUEL_TYPES,
  fuelTypeLabel,
  printTable,
  type FuelReports,
} from '@/lib/fuel';
import { tenantHeaders } from '@/lib/tenant';

const REPORT_TYPES = [
  { value: 'daily', label: 'Өдрийн тайлан' },
  { value: 'monthly', label: 'Сарын тайлан' },
  { value: 'vehicle', label: 'Машины зарцуулалт' },
  { value: 'driver', label: 'Жолоочийн зарцуулалт' },
  { value: 'purchase', label: 'Худалдан авалтын товч' },
  { value: 'tank', label: 'Савны үлдэгдэл' },
  { value: 'cost_vehicle', label: 'Зардал — техникаар' },
  { value: 'cost_project', label: 'Зардал — төслөөр' },
];

export default function FuelReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FuelReports | null>(null);
  const [type, setType] = useState('daily');
  const [from, setFrom] = useState(dayjs().startOf('month'));
  const [to, setTo] = useState(dayjs());
  const [fuelType, setFuelType] = useState<string | undefined>();
  const [equipmentId, setEquipmentId] = useState<string | undefined>();
  const [driverId, setDriverId] = useState<string | undefined>();
  const [supplierId, setSupplierId] = useState<string | undefined>();

  const [equipment, setEquipment] = useState<Array<{ value: string; label: string }>>([]);
  const [drivers, setDrivers] = useState<Array<{ value: string; label: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ value: string; label: string }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFuelReports({
        type,
        from: from.format('YYYY-MM-DD'),
        to: to.format('YYYY-MM-DD'),
        fuel_type: fuelType,
        equipment_id: equipmentId,
        driver_user_id: driverId,
        supplier_id: supplierId,
      });
      setData(res);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [type, from, to, fuelType, equipmentId, driverId, supplierId]);

  useEffect(() => {
    document.title = 'Шатахууны тайлан';
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const [eqRes, usersRes, sup] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/equipment`, { headers: tenantHeaders() }).then((r) => r.json()),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, { headers: tenantHeaders() }).then((r) => r.json()),
          fetchFuelList<Record<string, unknown>>('suppliers'),
        ]);
        const eqList = eqRes.success ? (Array.isArray(eqRes.data) ? eqRes.data : eqRes.data?.rows || []) : [];
        setEquipment(
          eqList.map((e: { id: number; name: string; registration_number?: string }) => ({
            value: String(e.id),
            label: `${e.name}${e.registration_number ? ` (${e.registration_number})` : ''}`,
          })),
        );
        const userList = usersRes.success
          ? Array.isArray(usersRes.data)
            ? usersRes.data
            : usersRes.data?.rows || []
          : [];
        setDrivers(userList.map((u: { id: number; username: string }) => ({ value: String(u.id), label: u.username })));
        setSuppliers(sup.map((s) => ({ value: String(s.id), label: String(s.name) })));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const exportRows = (): Record<string, unknown>[] => {
    if (!data) return [];
    switch (type) {
      case 'vehicle':
        return data.vehicle_consumption;
      case 'driver':
        return data.driver_consumption;
      case 'purchase':
        return data.purchase_summary;
      case 'tank':
        return data.tank_balance.map((t) => ({
          name: t.name,
          fuel_type: fuelTypeLabel(String(t.fuel_type)),
          stock: t.current_stock,
          capacity: t.capacity,
          available: t.available_capacity,
          utilization: t.utilization_pct,
          status: t.stock_status,
        }));
      case 'cost_vehicle':
        return data.cost_by_vehicle;
      case 'cost_project':
        return data.cost_by_project;
      case 'monthly':
        return [data.monthly];
      default:
        return [
          {
            purchased_qty: (data.daily as { purchased_qty?: number }).purchased_qty,
            purchased_amount: (data.daily as { purchased_amount?: number }).purchased_amount,
            issued_qty: (data.daily as { issued_qty?: number }).issued_qty,
          },
        ];
    }
  };

  const handleExcel = async () => {
    const rows = exportRows();
    if (!rows.length) {
      message.warning('Экспортлох өгөгдөл алга');
      return;
    }
    await downloadExcel(`fuel-report-${type}.xlsx`, rows, REPORT_TYPES.find((t) => t.value === type)?.label || type);
    message.success('Excel татагдлаа');
  };

  const handlePdfPrint = () => {
    printTable(REPORT_TYPES.find((t) => t.value === type)?.label || 'Тайлан');
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" id="fuel-print-area">
      <div>
        <p className="text-sm text-muted-foreground">Шүүлтүүр · Excel · PDF (хэвлэх) · CSV</p>
      </div>

      <Space wrap style={{ marginBottom: 8 }}>
        <Select style={{ minWidth: 200 }} options={REPORT_TYPES} value={type} onChange={setType} />
        <DatePicker value={from} onChange={(d) => d && setFrom(d)} placeholder="Эхлэх" />
        <DatePicker value={to} onChange={(d) => d && setTo(d)} placeholder="Дуусах" />
        <Select
          allowClear
          placeholder="Түлш"
          style={{ minWidth: 120 }}
          options={FUEL_TYPES}
          value={fuelType}
          onChange={setFuelType}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Техник"
          style={{ minWidth: 180 }}
          options={equipment}
          value={equipmentId}
          onChange={setEquipmentId}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Жолооч"
          style={{ minWidth: 160 }}
          options={drivers}
          value={driverId}
          onChange={setDriverId}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Нийлүүлэгч"
          style={{ minWidth: 160 }}
          options={suppliers}
          value={supplierId}
          onChange={setSupplierId}
        />
        <Button type="primary" onClick={load} loading={loading}>
          Шүүх
        </Button>
        <Button onClick={() => downloadCsv(`fuel-report-${type}.csv`, exportRows())}>CSV</Button>
        <Button onClick={handleExcel}>Excel</Button>
        <Button onClick={handlePdfPrint}>PDF / Хэвлэх</Button>
      </Space>

      {(type === 'daily' || type === 'monthly') && data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Худалдаж авсан (л)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">
              {Number(
                type === 'daily'
                  ? (data.daily as { purchased_qty?: number }).purchased_qty
                  : data.monthly.purchased_qty,
              ).toLocaleString()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Олгосон (л)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">
              {Number(
                type === 'daily'
                  ? (data.daily as { issued_qty?: number }).issued_qty
                  : data.monthly.issued_qty,
              ).toLocaleString()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Зардал (₮)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold tabular-nums">
              {Number(
                type === 'daily'
                  ? (data.daily as { purchased_amount?: number }).purchased_amount
                  : data.monthly.purchased_amount,
              ).toLocaleString()}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {type === 'vehicle' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Машины зарцуулалт</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              rowKey="equipment_id"
              dataSource={data?.vehicle_consumption || []}
              pagination={{ pageSize: 15 }}
              columns={[
                { title: 'Техник', dataIndex: 'vehicle' },
                { title: 'Зай (км)', dataIndex: 'distance', align: 'right' },
                { title: 'Шатахуун (л)', dataIndex: 'fuel_used', align: 'right' },
                { title: 'Дундаж Л/100км', dataIndex: 'avg_rate', align: 'right' },
                {
                  title: 'Хэтрэлт',
                  dataIndex: 'high',
                  align: 'right',
                  render: (v) => (v ? <Tag color="orange">{v}</Tag> : '0'),
                },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}

      {type === 'driver' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Жолоочийн зарцуулалт</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              rowKey={(r) => String(r.driver_user_id ?? r.driver)}
              dataSource={data?.driver_consumption || []}
              pagination={{ pageSize: 15 }}
              columns={[
                { title: 'Жолооч', dataIndex: 'driver' },
                { title: 'Зай (км)', dataIndex: 'distance', align: 'right' },
                { title: 'Шатахуун (л)', dataIndex: 'fuel_used', align: 'right' },
                { title: 'Дундаж Л/100км', dataIndex: 'avg_rate', align: 'right' },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}

      {type === 'purchase' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Худалдан авалтын товч</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              rowKey={(r) => String(r.supplier_id ?? r.supplier)}
              dataSource={data?.purchase_summary || []}
              pagination={false}
              columns={[
                { title: 'Нийлүүлэгч', dataIndex: 'supplier' },
                { title: 'Тоо', dataIndex: 'count', align: 'right' },
                { title: 'Литр', dataIndex: 'quantity', align: 'right' },
                {
                  title: 'Дүн',
                  dataIndex: 'amount',
                  align: 'right',
                  render: (v) => `${Number(v).toLocaleString()} ₮`,
                },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}

      {type === 'tank' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Савны үлдэгдэл</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              rowKey="id"
              dataSource={data?.tank_balance || []}
              pagination={false}
              columns={[
                { title: 'Сав', dataIndex: 'name' },
                {
                  title: 'Төрөл',
                  dataIndex: 'fuel_type',
                  render: (v: string) => fuelTypeLabel(v),
                },
                {
                  title: 'Үлдэгдэл',
                  dataIndex: 'current_stock',
                  align: 'right',
                  render: (v, r) => (
                    <span>
                      {Number(v).toLocaleString()} л{' '}
                      {r.stock_status === 'out_of_stock' ? (
                        <Tag color="red">дууссан</Tag>
                      ) : r.stock_status === 'low_stock' ? (
                        <Tag color="orange">бага</Tag>
                      ) : null}
                    </span>
                  ),
                },
                {
                  title: 'Чөлөөт',
                  dataIndex: 'available_capacity',
                  align: 'right',
                  render: (v) => `${Number(v).toLocaleString()} л`,
                },
                {
                  title: 'Ашиглалт',
                  dataIndex: 'utilization_pct',
                  align: 'right',
                  render: (v) => `${v}%`,
                },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}

      {type === 'cost_vehicle' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Зардал — техникаар</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              rowKey="equipment_id"
              dataSource={data?.cost_by_vehicle || []}
              pagination={{ pageSize: 15 }}
              columns={[
                { title: 'Техник', dataIndex: 'vehicle' },
                { title: 'Литр', dataIndex: 'quantity', align: 'right' },
                {
                  title: 'Зардал',
                  dataIndex: 'cost',
                  align: 'right',
                  render: (v) => `${Number(v).toLocaleString()} ₮`,
                },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}

      {type === 'cost_project' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Зардал — төслөөр</CardTitle>
          </CardHeader>
          <CardContent>
            <Table
              rowKey={(r) => String(r.project_id ?? r.project)}
              dataSource={data?.cost_by_project || []}
              pagination={{ pageSize: 15 }}
              columns={[
                { title: 'Төсөл', dataIndex: 'project' },
                { title: 'Литр', dataIndex: 'quantity', align: 'right' },
                {
                  title: 'Зардал',
                  dataIndex: 'cost',
                  align: 'right',
                  render: (v) => `${Number(v).toLocaleString()} ₮`,
                },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}

      {(type === 'daily' || type === 'monthly') && data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Худалдан авалт</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                rowKey="id"
                size="small"
                pagination={{ pageSize: 8 }}
                dataSource={(data.daily as { purchases?: Record<string, unknown>[] }).purchases || []}
                columns={[
                  { title: 'Огноо', dataIndex: 'purchase_date', width: 100 },
                  {
                    title: 'Нийлүүлэгч',
                    render: (_, r) => (r.supplier as { name?: string })?.name || '—',
                  },
                  { title: 'Литр', dataIndex: 'quantity', align: 'right' },
                  {
                    title: 'Дүн',
                    dataIndex: 'total_amount',
                    align: 'right',
                    render: (v) => Number(v).toLocaleString(),
                  },
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Олголт</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                rowKey="id"
                size="small"
                pagination={{ pageSize: 8 }}
                dataSource={(data.daily as { issues?: Record<string, unknown>[] }).issues || []}
                columns={[
                  { title: 'Огноо', dataIndex: 'issue_date', width: 100 },
                  {
                    title: 'Техник',
                    render: (_, r) => (r.equipment as { name?: string })?.name || '—',
                  },
                  { title: 'Литр', dataIndex: 'quantity', align: 'right' },
                  {
                    title: 'Жолооч',
                    render: (_, r) => (r.driver as { username?: string })?.username || '—',
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
