'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, DatePicker, Drawer, Form, Input, InputNumber, Popconfirm, Select, Space,
  Table, Tabs, Tag, Typography, message,
} from '@/components/admin/primitives';
import { PlusOutlined, StopOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import {
  DOC_TYPES,
  docTypeColor,
  docTypeLabel,
  formatMoney,
  formatQty,
  inventoryApi,
} from '@/lib/inventory';

const { Title, Text } = Typography;

const QUICK_TYPES = [
  'RECEIPT',
  'ISSUE',
  'TRANSFER',
  'PROJECT_TRANSFER',
  'RETURN',
  'ADJUSTMENT',
] as const;

function warehouseLabel(r: any) {
  if (r.doc_type === 'TRANSFER') {
    return `${r.warehouse?.name || '—'} → ${r.toWarehouse?.name || '—'}`;
  }
  if (r.doc_type === 'PROJECT_TRANSFER') {
    if (r.toWarehouse?.name && r.toWarehouse?.id !== r.warehouse?.id) {
      return `${r.warehouse?.name || '—'} → ${r.toWarehouse.name}`;
    }
    return r.warehouse?.name || '—';
  }
  return r.warehouse?.name || '—';
}

function projectLabel(r: any) {
  if (r.doc_type === 'PROJECT_TRANSFER') {
    return `${r.project?.name || '—'} → ${r.toProject?.name || '—'}`;
  }
  return r.project?.name || '—';
}

export default function TransactionPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const watchType = Form.useWatch('doc_type', form);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (docType) params.doc_type = docType;
      const [d, m, mats, wh, proj, sup] = await Promise.all([
        inventoryApi.documents.list(params),
        inventoryApi.movements.list(),
        inventoryApi.materials.list({ is_active: 'true' }),
        inventoryApi.warehouses.list(),
        inventoryApi.projects().catch(() => []),
        inventoryApi.suppliers.list(),
      ]);
      setDocs(d);
      setMovements(m);
      setMaterials(mats);
      setWarehouses(wh);
      setProjects(Array.isArray(proj) ? proj : []);
      setSuppliers(sup);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [docType]);

  useEffect(() => {
    document.title = 'Хөдөлгөөн';
    load();
  }, [load]);

  const openCreate = (type?: string) => {
    form.resetFields();
    form.setFieldsValue({
      doc_type: type || 'RECEIPT',
      doc_date: dayjs(),
      lines: [{ quantity: 1, unit_cost: 0 }],
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      const lines = (values.lines || []).filter((l: any) => l?.material_id && l?.quantity);
      if (!lines.length) {
        message.warning('Барааны мөр нэмнэ үү');
        return;
      }
      await inventoryApi.documents.create({
        doc_type: values.doc_type,
        warehouse_id: values.warehouse_id,
        to_warehouse_id: values.to_warehouse_id,
        project_id: values.project_id,
        to_project_id: values.to_project_id,
        supplier_id: values.supplier_id,
        receiver_name: values.receiver_name,
        doc_date: values.doc_date?.format?.('YYYY-MM-DD') || values.doc_date,
        remarks: values.remarks,
        reason: values.reason,
        lines,
        post_immediately: true,
      });
      message.success('Баримт бүртгэгдэж, үлдэгдэл шинэчлэгдлээ');
      setOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const cancelDoc = async (id: number) => {
    try {
      await inventoryApi.documents.cancel(id, 'Админ цуцлалт');
      message.success('Цуцлагдлаа (урвуу хөдөлгөөн үүссэн)');
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const projectOptions = projects.map((p: any) => ({ value: p.id, label: p.name }));
  const warehouseOptions = warehouses.map((w: any) => ({ value: w.id, label: w.name }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Хөдөлгөөн / Баримт</Title>
          <Text type="secondary">
            Агуулах болон төсөл хоорондын шилжүүлэг багтана. Түүх устгахгүй — зөвхөн цуцлалт.
          </Text>
        </div>
        <Space wrap>
          <Select
            allowClear
            placeholder="Баримтын төрөл"
            style={{ width: 200 }}
            value={docType}
            onChange={setDocType}
            options={DOC_TYPES.map((d) => ({ value: d.value, label: d.label }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
            Баримт бүртгэх
          </Button>
        </Space>
      </div>

      <Space wrap style={{ marginBottom: 12 }}>
        {QUICK_TYPES.map((value) => {
          const d = DOC_TYPES.find((x) => x.value === value)!;
          return (
            <Button key={d.value} size="small" onClick={() => openCreate(d.value)}>
              + {d.label}
            </Button>
          );
        })}
      </Space>

      <Tabs
        items={[
          {
            key: 'docs',
            label: 'Баримтууд',
            children: (
              <Table
                rowKey="id"
                loading={loading}
                dataSource={docs}
                scroll={{ x: 1200 }}
                columns={[
                  { title: 'Дугаар', dataIndex: 'doc_no', width: 150 },
                  {
                    title: 'Төрөл',
                    dataIndex: 'doc_type',
                    width: 150,
                    render: (v) => <Tag color={docTypeColor(v)}>{docTypeLabel(v)}</Tag>,
                  },
                  { title: 'Огноо', dataIndex: 'doc_date', width: 110 },
                  {
                    title: 'Агуулах',
                    width: 180,
                    render: (_, r) => warehouseLabel(r),
                  },
                  {
                    title: 'Төсөл',
                    width: 200,
                    render: (_, r) => projectLabel(r),
                  },
                  {
                    title: 'Дүн',
                    dataIndex: 'total_amount',
                    align: 'right',
                    render: (v) => formatMoney(v),
                  },
                  {
                    title: 'Төлөв',
                    dataIndex: 'status',
                    width: 100,
                    render: (v) =>
                      v === 'POSTED' ? (
                        <Tag color="green">Батлагдсан</Tag>
                      ) : v === 'CANCELLED' ? (
                        <Tag color="red">Цуцлагдсан</Tag>
                      ) : (
                        <Tag>Ноорог</Tag>
                      ),
                  },
                  {
                    title: 'Үйлдэл',
                    width: 90,
                    render: (_, r) =>
                      r.status === 'POSTED' ? (
                        <Popconfirm title="Цуцлах уу? Урвуу хөдөлгөөн үүснэ." onConfirm={() => cancelDoc(r.id)}>
                          <Button type="text" danger size="small" icon={<StopOutlined />} />
                        </Popconfirm>
                      ) : null,
                  },
                ]}
              />
            ),
          },
          {
            key: 'movements',
            label: 'Хөдөлгөөний түүх',
            children: (
              <Table
                rowKey="id"
                loading={loading}
                dataSource={movements}
                scroll={{ x: 1100 }}
                columns={[
                  { title: 'Дугаар', dataIndex: 'movement_no', width: 150 },
                  { title: 'Огноо', dataIndex: 'transaction_date', width: 110 },
                  { title: 'Төрөл', dataIndex: 'movement_type', width: 110 },
                  { title: 'Бараа', dataIndex: ['material', 'name'] },
                  { title: 'Агуулах', dataIndex: ['warehouse', 'name'], width: 120 },
                  {
                    title: 'Төсөл',
                    dataIndex: ['project', 'name'],
                    width: 140,
                    render: (v) => v || '—',
                  },
                  {
                    title: 'Тоо',
                    dataIndex: 'quantity',
                    width: 90,
                    align: 'right',
                    render: (v) => (
                      <Text type={Number(v) < 0 ? 'danger' : 'success'}>{formatQty(v)}</Text>
                    ),
                  },
                  {
                    title: 'Үлдэгдэл',
                    dataIndex: 'balance_after',
                    width: 90,
                    align: 'right',
                    render: (v) => formatQty(v),
                  },
                  {
                    title: 'Баримт',
                    dataIndex: ['document', 'doc_no'],
                    width: 140,
                    render: (v) => v || '—',
                  },
                ]}
              />
            ),
          },
        ]}
      />

      <Drawer
        title="Баримт бүртгэх"
        open={open}
        onClose={() => setOpen(false)}
        width={640}
        extra={<Button type="primary" onClick={save}>Батлах & хадгалах</Button>}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="doc_type" label="Төрөл" rules={[{ required: true }]}>
              <Select options={DOC_TYPES.map((d) => ({ value: d.value, label: d.label }))} />
            </Form.Item>
            <Form.Item name="doc_date" label="Огноо" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="warehouse_id"
              label={
                watchType === 'TRANSFER' || watchType === 'PROJECT_TRANSFER'
                  ? 'Гарах агуулах'
                  : 'Агуулах'
              }
              rules={[{ required: true }]}
            >
              <Select options={warehouseOptions} />
            </Form.Item>

            {watchType === 'TRANSFER' && (
              <Form.Item name="to_warehouse_id" label="Орох агуулах" rules={[{ required: true }]}>
                <Select options={warehouseOptions} />
              </Form.Item>
            )}

            {watchType === 'PROJECT_TRANSFER' && (
              <>
                <Form.Item
                  name="to_warehouse_id"
                  label="Орох агуулах (сонголттой)"
                  extra="Хоосон бол ижил агуулахад төсөл солино"
                >
                  <Select allowClear placeholder="Ижил агуулах" options={warehouseOptions} />
                </Form.Item>
                <Form.Item name="project_id" label="Гарах төсөл" rules={[{ required: true }]}>
                  <Select options={projectOptions} />
                </Form.Item>
                <Form.Item name="to_project_id" label="Орох төсөл" rules={[{ required: true }]}>
                  <Select options={projectOptions} />
                </Form.Item>
              </>
            )}

            {(watchType === 'ISSUE' || watchType === 'CONSUMPTION' || watchType === 'RETURN') && (
              <Form.Item name="project_id" label="Төсөл">
                <Select allowClear options={projectOptions} />
              </Form.Item>
            )}

            {watchType === 'TRANSFER' && (
              <Form.Item name="project_id" label="Төсөл (сонголттой)">
                <Select allowClear options={projectOptions} />
              </Form.Item>
            )}

            {watchType === 'RECEIPT' && (
              <Form.Item name="supplier_id" label="Нийлүүлэгч">
                <Select
                  allowClear
                  options={suppliers.map((s: any) => ({ value: s.id, label: s.name }))}
                />
              </Form.Item>
            )}
            {watchType === 'ISSUE' && (
              <Form.Item name="receiver_name" label="Хүлээн авагч">
                <Input />
              </Form.Item>
            )}
            <Form.Item name="reason" label="Шалтгаан" style={{ gridColumn: '1 / -1' }}>
              <Input placeholder={watchType === 'PROJECT_TRANSFER' ? 'Жишээ: А төслийн илүүдэл → Б төсөл' : undefined} />
            </Form.Item>
            <Form.Item name="remarks" label="Тэмдэглэл" style={{ gridColumn: '1 / -1' }}>
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>

          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong>Барааны мөр</Text>
                  <Button size="small" onClick={() => add({ quantity: 1, unit_cost: 0 })}>
                    + Мөр
                  </Button>
                </div>
                {fields.map((field) => (
                  <div
                    key={field.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr auto',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, 'material_id']}
                      rules={[{ required: true, message: 'Бараа' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Бараа"
                        options={materials.map((m: any) => ({
                          value: m.id,
                          label: `${m.code || ''} ${m.name}`.trim(),
                        }))}
                        onChange={(id) => {
                          const m = materials.find((x: any) => x.id === id);
                          if (m) {
                            const lines = form.getFieldValue('lines') || [];
                            lines[field.name] = {
                              ...lines[field.name],
                              material_id: id,
                              unit_cost: Number(m.average_cost || m.standard_cost || 0),
                            };
                            form.setFieldsValue({ lines });
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'quantity']}
                      rules={[{ required: true }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder={watchType === 'ADJUSTMENT' ? '+/- тоо' : 'Тоо'}
                      />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'unit_cost']} style={{ marginBottom: 0 }}>
                      <InputNumber style={{ width: '100%' }} min={0} placeholder="Үнэ" />
                    </Form.Item>
                    <Button danger type="text" onClick={() => remove(field.name)}>
                      ×
                    </Button>
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </Drawer>
    </div>
  );
}
