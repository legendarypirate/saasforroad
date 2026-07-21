'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Drawer,
  Modal,
  Select,
  Space,
  Table,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import {
  createFuelRecord,
  deleteFuelRecord,
  downloadCsv,
  fetchFuelList,
  fuelTypeLabel,
  FUEL_TYPES,
  printTable,
  updateFuelRecord,
} from '@/lib/fuel';
import { tenantHeaders } from '@/lib/tenant';

type EqOption = { value: number; label: string; operator_user_id?: number };
type UserOption = { value: number; label: string };
type TankOption = { value: number; label: string; fuel_type?: string; stock?: number };
type ProjectOption = { value: number; label: string };

export default function FuelIssuesPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [equipment, setEquipment] = useState<EqOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [tanks, setTanks] = useState<TankOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [q, setQ] = useState('');
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [issues, tanksList, eqRes, usersRes, projectsRes] = await Promise.all([
        fetchFuelList<Record<string, unknown>>('issues', { q: q || undefined }),
        fetchFuelList<Record<string, unknown>>('tanks', { status: 'active' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/equipment`, { headers: tenantHeaders() }).then((r) => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, { headers: tenantHeaders() }).then((r) => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`, { headers: tenantHeaders() }).then((r) => r.json()),
      ]);
      setRows(issues);
      setTanks(
        tanksList.map((t) => ({
          value: Number(t.id),
          label: `${t.name} — ${Number(t.current_stock).toLocaleString()} л`,
          fuel_type: String(t.fuel_type || 'diesel'),
          stock: Number(t.current_stock),
        })),
      );
      const eqList = eqRes.success ? (Array.isArray(eqRes.data) ? eqRes.data : eqRes.data?.rows || []) : [];
      setEquipment(
        eqList.map((e: Record<string, unknown>) => ({
          value: Number(e.id),
          label: `${e.name}${e.registration_number ? ` (${e.registration_number})` : ''}`,
          operator_user_id: e.operator_user_id ? Number(e.operator_user_id) : undefined,
        })),
      );
      const userList = usersRes.success
        ? Array.isArray(usersRes.data)
          ? usersRes.data
          : usersRes.data?.rows || []
        : [];
      setUsers(userList.map((u: { id: number; username: string }) => ({ value: u.id, label: u.username })));
      setProjects(
        (projectsRes.success ? projectsRes.data : []).map((p: { id: number; name: string }) => ({
          value: p.id,
          label: p.name,
        })),
      );
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    document.title = 'Шатахуун олголт';
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ issue_date: dayjs(), fuel_type: 'diesel', quantity: 0 });
    setOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    form.setFieldsValue({
      issue_date: row.issue_date ? dayjs(String(row.issue_date)) : dayjs(),
      equipment_id: row.equipment_id,
      driver_user_id: row.driver_user_id,
      project_id: row.project_id,
      tank_id: row.tank_id,
      fuel_type: row.fuel_type,
      quantity: row.quantity,
      odometer: row.odometer,
      engine_hours: row.engine_hours,
      notes: row.notes,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const qty = Number(values.quantity);
      if (!(qty > 0)) {
        message.error('Тоо хэмжээ > 0 байх ёстой');
        return;
      }
      const tank = tanks.find((t) => t.value === values.tank_id);
      if (!editing && tank && qty > (tank.stock || 0)) {
        message.error(`Үлдэгдэл хүрэлцэхгүй (боломжтой: ${tank.stock} л)`);
        return;
      }
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const body = {
        ...values,
        issue_date: dayjs(values.issue_date).format('YYYY-MM-DD'),
        quantity: qty,
        odometer: values.odometer != null && values.odometer !== '' ? Number(values.odometer) : null,
        engine_hours: values.engine_hours != null && values.engine_hours !== '' ? Number(values.engine_hours) : null,
        issued_by: user?.id,
        created_by: user?.id,
      };
      if (editing) await updateFuelRecord('issues', Number(editing.id), body);
      else await createFuelRecord('issues', body);
      message.success(editing ? 'Шинэчлэгдлээ' : 'Олголт бүртгэгдлээ');
      setOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<Record<string, unknown>> = [
    { title: 'Дугаар', dataIndex: 'number', width: 130 },
    { title: 'Огноо', dataIndex: 'issue_date', width: 110 },
    {
      title: 'Техник',
      render: (_, r) => {
        const eq = r.equipment as { name?: string; registration_number?: string } | undefined;
        if (!eq) return '—';
        return eq.registration_number ? `${eq.name} (${eq.registration_number})` : eq.name;
      },
    },
    {
      title: 'Жолооч',
      render: (_, r) => (r.driver as { username?: string })?.username || '—',
    },
    {
      title: 'Сав',
      render: (_, r) => (r.tank as { name?: string })?.name || '—',
    },
    {
      title: 'Төрөл',
      dataIndex: 'fuel_type',
      render: (v: string) => fuelTypeLabel(v),
    },
    {
      title: 'Литр',
      dataIndex: 'quantity',
      align: 'right',
      render: (v) => Number(v).toLocaleString(),
    },
    {
      title: 'Одометр',
      dataIndex: 'odometer',
      align: 'right',
      render: (v) => (v != null ? Number(v).toLocaleString() : '—'),
    },
    {
      title: 'Төсөл',
      render: (_, r) => (r.project as { name?: string })?.name || '—',
    },
    {
      title: 'Олгосон',
      render: (_, r) => (r.issuer as { username?: string })?.username || '—',
    },
    {
      title: 'Баталгаажилт',
      width: 190,
      render: (_, r) => {
        const status = String(r.status || 'verified');
        if (status === 'pending') {
          return <span style={{ color: '#d48806', fontWeight: 600 }}>QR хүлээгдэж буй</span>;
        }
        const verifier = (r.verifier as { username?: string })?.username;
        const at = r.verified_at ? dayjs(String(r.verified_at)).format('YYYY-MM-DD HH:mm') : null;
        return (
          <span style={{ color: '#389e0d', fontWeight: 600 }}>
            ✓ Баталгаажсан
            {verifier ? <span style={{ display: 'block', color: '#888', fontWeight: 400, fontSize: 12 }}>{verifier}{at ? ` · ${at}` : ''}</span> : null}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search allowClear placeholder="Дугаар / тэмдэглэл…" style={{ width: 220 }} onSearch={setQ} />
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button
          onClick={() =>
            downloadCsv(
              'fuel-issues.csv',
              rows.map((r) => ({
                number: r.number,
                date: r.issue_date,
                vehicle: (r.equipment as { name?: string })?.name,
                driver: (r.driver as { username?: string })?.username,
                quantity: r.quantity,
                odometer: r.odometer,
                fuel_type: r.fuel_type,
              })),
            )
          }
        >
          CSV
        </Button>
        <Button onClick={() => printTable('Шатахуун олголт')}>Хэвлэх</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Олголт нэмэх
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          ...columns,
          {
            title: 'Үйлдэл',
            fixed: 'right',
            width: 140,
            render: (_, row) => (
              <Space>
                <Button type="link" onClick={() => openEdit(row)}>
                  Засах
                </Button>
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    Modal.confirm({
                      title: 'Устгах уу? Үлдэгдэл буцаана.',
                      onOk: async () => {
                        try {
                          await deleteFuelRecord('issues', Number(row.id));
                          message.success('Устгагдлаа');
                          load();
                        } catch (e) {
                          message.error(e instanceof Error ? e.message : 'Алдаа');
                        }
                      },
                    })
                  }
                />
              </Space>
            ),
          },
        ]}
        pagination={{ pageSize: 15, showSizeChanger: true }}
        scroll={{ x: 1200 }}
      />

      <Drawer
        title={editing ? 'Олголт засах' : 'Шинэ олголт'}
        open={open}
        onClose={() => setOpen(false)}
        width={560}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setOpen(false)}>Болих</Button>
            <Button type="primary" onClick={handleSave}>
              Хадгалах
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="issue_date" label="Огноо" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="quantity" label="Тоо хэмжээ (л)" rules={[{ required: true }]}>
              <InputNumber min={0.001} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="equipment_id" label="Техник / машин" rules={[{ required: true }]} style={{ gridColumn: '1 / -1' }}>
              <Select
                showSearch
                optionFilterProp="label"
                options={equipment}
                onChange={(id) => {
                  const eq = equipment.find((e) => e.value === id);
                  if (eq?.operator_user_id) form.setFieldsValue({ driver_user_id: eq.operator_user_id });
                }}
              />
            </Form.Item>
            <Form.Item name="driver_user_id" label="Жолооч">
              <Select allowClear showSearch optionFilterProp="label" options={users} />
            </Form.Item>
            <Form.Item name="project_id" label="Төсөл / аялал (заавал биш)">
              <Select allowClear showSearch optionFilterProp="label" options={projects} />
            </Form.Item>
            <Form.Item name="tank_id" label="Сав" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={tanks}
                onChange={(id) => {
                  const tank = tanks.find((t) => t.value === id);
                  if (tank?.fuel_type) form.setFieldsValue({ fuel_type: tank.fuel_type });
                }}
              />
            </Form.Item>
            <Form.Item name="fuel_type" label="Түлшний төрөл" rules={[{ required: true }]}>
              <Select options={FUEL_TYPES} />
            </Form.Item>
            <Form.Item name="odometer" label="Одометр (км)">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="engine_hours" label="Моторын цаг">
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Тэмдэглэл">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
