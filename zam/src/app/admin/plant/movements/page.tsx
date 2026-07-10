'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  message,
  Modal,
  isFormValidationError,
} from '@/components/admin/primitives';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@/components/admin/icons';
import dayjs from 'dayjs';
import {
  MOVEMENT_TYPES,
  createPlantRecord,
  deletePlantRecord,
  fetchPlantList,
  formatMoney,
  formatQty,
} from '@/lib/plant';

export default function Page() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [plants, setPlants] = useState<Array<{ value: number; label: string }>>([]);
  const [materials, setMaterials] = useState<Array<{ value: number; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mov, sites, mats] = await Promise.all([
        fetchPlantList<Record<string, unknown>>('movements'),
        fetchPlantList<Record<string, unknown>>('sites'),
        fetchPlantList<Record<string, unknown>>('materials'),
      ]);
      setRows(mov);
      setPlants(sites.map((s) => ({ value: Number(s.id), label: String(s.name) })));
      setMaterials(mats.map((m) => ({ value: Number(m.id), label: String(m.name) })));
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Үйлдвэр — Орлого / зарлага';
    load();
  }, [load]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await createPlantRecord('movements', {
        ...values,
        quantity: Number(values.quantity),
        unit_cost: Number(values.unit_cost || 0),
        movement_date: values.movement_date
          ? dayjs(values.movement_date).format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD'),
      });
      message.success('Бүртгэгдлээ');
      setOpen(false);
      load();
    } catch (e) {
      if (isFormValidationError(e) || (e && typeof e === 'object' && 'errorFields' in e)) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <h2 style={{ margin: 0 }}>Түүхий эд — орлого / зарлага</h2>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({
              movement_type: 'in',
              movement_date: dayjs(),
              quantity: 0,
            });
            setOpen(true);
          }}
        >
          Нэмэх
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 15 }}
        scroll={{ x: 900 }}
        columns={[
          { title: 'Огноо', dataIndex: 'movement_date', width: 110 },
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
            title: 'Төрөл',
            dataIndex: 'movement_type',
            render: (v) => {
              const label = MOVEMENT_TYPES.find((t) => t.value === v)?.label || String(v);
              const color = v === 'in' ? 'green' : v === 'out' || v === 'consume' ? 'red' : 'orange';
              return <Tag color={color}>{label}</Tag>;
            },
          },
          {
            title: 'Тоо',
            dataIndex: 'quantity',
            align: 'right',
            render: (v, r) =>
              formatQty(Number(v), (r.material as { unit?: string } | undefined)?.unit || 'тн'),
          },
          {
            title: 'Өртөг',
            dataIndex: 'unit_cost',
            align: 'right',
            render: (v) => formatMoney(Number(v)),
          },
          { title: 'Тэмдэглэл', dataIndex: 'notes', ellipsis: true },
          {
            title: '',
            key: 'actions',
            width: 70,
            render: (_, r) => (
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  Modal.confirm({
                    title: 'Устгах уу? Үлдэгдэл буцаана.',
                    onOk: async () => {
                      await deletePlantRecord('movements', Number(r.id));
                      message.success('Устгагдлаа');
                      load();
                    },
                  })
                }
              />
            ),
          },
        ]}
      />

      <Drawer
        title="Түүхий эдийн хөдөлгөөн"
        open={open}
        onClose={() => setOpen(false)}
        width={480}
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
          <Form.Item name="plant_id" label="Үйлдвэр" rules={[{ required: true }]}>
            <Select options={plants} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="material_id" label="Түүхий эд" rules={[{ required: true }]}>
            <Select options={materials} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="movement_type" label="Төрөл" rules={[{ required: true }]}>
            <Select options={MOVEMENT_TYPES} />
          </Form.Item>
          <Form.Item name="quantity" label="Тоо хэмжээ" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="unit_cost" label="Нэгж өртөг (₮)">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="movement_date" label="Огноо" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Тэмдэглэл">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
