'use client';

import React, { useState } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Form,
  Input,
  Table,
  Space,
  message,
  DatePicker,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@/components/admin/icons';
import { DATE_FORMAT, dateFormItemProps, formatDate } from '@/lib/userDates';
import { tenantHeaders } from '@/lib/tenant';

export interface EmploymentUser {
  responsible_equipment?: string;
  working_conditions?: string;
  job_description?: string;
  employment_start_date?: string;
  employment_order_number?: string;
  labor_contract_number?: string;
  labor_contract_date?: string;
  golden_order?: string;
  probation_period?: string;
  probation_end_date?: string;
  permanent_order_number?: string;
  permanent_date?: string;
}

export interface CareerChangeRow {
  id: number;
  order_number: string;
  position: string;
  effective_date: string;
  contract_end_date: string;
}

export interface ContractTerminationRow {
  id: number;
  termination_order_number: string;
  termination_date: string;
  reason: string;
}

export interface UserAwardRow {
  id: number;
  award_type: 'state' | 'company';
  award_name: string;
  award_date: string;
}

interface EmploymentTabProps {
  userId: number;
  user: EmploymentUser | null;
  careerChanges: CareerChangeRow[];
  contractTerminations: ContractTerminationRow[];
  userAwards: UserAwardRow[];
  loading: boolean;
  onRefresh: () => void;
}

const displayValue = (value?: string | number | null) =>
  value !== undefined && value !== null && String(value).trim() !== '' ? String(value) : '—';

const EMPLOYMENT_LABELS: {
  key: keyof EmploymentUser;
  label: string;
  fullWidth?: boolean;
  type?: 'date';
}[] = [
  { key: 'responsible_equipment', label: 'Хариуцсан техник' },
  { key: 'working_conditions', label: 'Хөдөлмөрийн нөхцөл' },
  { key: 'job_description', label: 'Ажлын байрны тодорхойлолт', fullWidth: true },
  { key: 'employment_start_date', label: 'Ажилд орсон огноо', type: 'date' },
  { key: 'employment_order_number', label: 'Ажилд орсон тушаал дугаар' },
  { key: 'labor_contract_number', label: 'Хөдөлмөрийн гэрээний дугаар' },
  { key: 'labor_contract_date', label: 'Хөдөлмөрийн гэрээ байгуулсан огноо', type: 'date' },
  { key: 'golden_order', label: 'Алтан тушаал' },
  { key: 'probation_period', label: 'Туршилтын хугацаа' },
  { key: 'probation_end_date', label: 'Туршилтын хугацаа дуусах огноо', type: 'date' },
  { key: 'permanent_order_number', label: 'Жинхэлсэн тушаалын дугаар' },
  { key: 'permanent_date', label: 'Жинхэлсэн огноо', type: 'date' },
];

export default function EmploymentTab({
  userId,
  user,
  careerChanges,
  contractTerminations,
  userAwards,
  loading,
  onRefresh,
}: EmploymentTabProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [careerSaving, setCareerSaving] = useState(false);
  const [terminationSaving, setTerminationSaving] = useState(false);
  const [stateAwardSaving, setStateAwardSaving] = useState(false);
  const [companyAwardSaving, setCompanyAwardSaving] = useState(false);

  const [employmentForm] = Form.useForm();
  const [careerForm] = Form.useForm();
  const [terminationForm] = Form.useForm();
  const [stateAwardForm] = Form.useForm();
  const [companyAwardForm] = Form.useForm();

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const populateForm = (data: EmploymentUser) => {
    employmentForm.setFieldsValue({
      responsible_equipment: data.responsible_equipment,
      working_conditions: data.working_conditions,
      job_description: data.job_description,
      employment_start_date: data.employment_start_date,
      employment_order_number: data.employment_order_number,
      labor_contract_number: data.labor_contract_number,
      labor_contract_date: data.labor_contract_date,
      golden_order: data.golden_order,
      probation_period: data.probation_period,
      probation_end_date: data.probation_end_date,
      permanent_order_number: data.permanent_order_number,
      permanent_date: data.permanent_date,
    });
  };

  const startEdit = () => {
    if (user) populateForm(user);
    setEditing(true);
  };

  const cancelEdit = () => {
    if (user) populateForm(user);
    setEditing(false);
  };

  const saveEmployment = async () => {
    const values = await employmentForm.validateFields();
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/user/${userId}`, {
        method: 'PATCH',
        headers: tenantHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Хадгалах үед алдаа');
      message.success('Ажлын мэдээлэл хадгалагдлаа');
      setEditing(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      message.error('Ажлын мэдээлэл хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const addCareerChange = async () => {
    const values = await careerForm.validateFields();
    setCareerSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/career_change`, {
        method: 'POST',
        headers: tenantHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ user_id: userId, ...values }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      careerForm.resetFields();
      message.success('Мэдээлэл нэмэгдлээ');
      onRefresh();
    } catch (err) {
      console.error(err);
      message.error('Нэмэх үед алдаа гарлаа');
    } finally {
      setCareerSaving(false);
    }
  };

  const deleteCareerChange = async (id: number) => {
    try {
      const res = await fetch(`${apiBase}/api/career_change/${id}`, {
        method: 'DELETE',
        headers: tenantHeaders(),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      message.success('Устгагдлаа');
      onRefresh();
    } catch (err) {
      console.error(err);
      message.error('Устгах үед алдаа гарлаа');
    }
  };

  const addTermination = async () => {
    const values = await terminationForm.validateFields();
    setTerminationSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/contract_termination`, {
        method: 'POST',
        headers: tenantHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ user_id: userId, ...values }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      terminationForm.resetFields();
      message.success('Мэдээлэл нэмэгдлээ');
      onRefresh();
    } catch (err) {
      console.error(err);
      message.error('Нэмэх үед алдаа гарлаа');
    } finally {
      setTerminationSaving(false);
    }
  };

  const deleteTermination = async (id: number) => {
    try {
      const res = await fetch(`${apiBase}/api/contract_termination/${id}`, {
        method: 'DELETE',
        headers: tenantHeaders(),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      message.success('Устгагдлаа');
      onRefresh();
    } catch (err) {
      console.error(err);
      message.error('Устгах үед алдаа гарлаа');
    }
  };

  const addAward = async (awardType: 'state' | 'company', form: typeof stateAwardForm) => {
    const values = await form.validateFields();
    const setSavingFn = awardType === 'state' ? setStateAwardSaving : setCompanyAwardSaving;
    setSavingFn(true);
    try {
      const res = await fetch(`${apiBase}/api/user_award`, {
        method: 'POST',
        headers: tenantHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ user_id: userId, award_type: awardType, ...values }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      form.resetFields();
      message.success('Шагнал нэмэгдлээ');
      onRefresh();
    } catch (err) {
      console.error(err);
      message.error('Нэмэх үед алдаа гарлаа');
    } finally {
      setSavingFn(false);
    }
  };

  const deleteAward = async (id: number) => {
    try {
      const res = await fetch(`${apiBase}/api/user_award/${id}`, {
        method: 'DELETE',
        headers: tenantHeaders(),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      message.success('Устгагдлаа');
      onRefresh();
    } catch (err) {
      console.error(err);
      message.error('Устгах үед алдаа гарлаа');
    }
  };

  const careerColumns: ColumnsType<CareerChangeRow> = [
    { title: 'Тушаалын дугаар', dataIndex: 'order_number', render: (v) => v || '—' },
    { title: 'Албан тушаал', dataIndex: 'position', render: (v) => v || '—' },
    { title: 'Огноо', dataIndex: 'effective_date', render: (v) => formatDate(v) },
    { title: 'Гэрээний дуусах огноо', dataIndex: 'contract_end_date', render: (v) => formatDate(v) },
    {
      title: 'Үйлдэл',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => deleteCareerChange(record.id)} />
      ),
    },
  ];

  const terminationColumns: ColumnsType<ContractTerminationRow> = [
    {
      title: 'Хөдөлмөрийн гэрээ дуусгавар болсон тушаалын дугаар',
      dataIndex: 'termination_order_number',
      render: (v) => v || '—',
    },
    {
      title: 'Хөдөлмөрийн гэрээ дуусгавар болсон огноо',
      dataIndex: 'termination_date',
      render: (v) => formatDate(v),
    },
    { title: 'Шалтгаан', dataIndex: 'reason', render: (v) => v || '—' },
    {
      title: 'Үйлдэл',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => deleteTermination(record.id)} />
      ),
    },
  ];

  const stateAwards = userAwards.filter((a) => a.award_type === 'state');
  const companyAwards = userAwards.filter((a) => a.award_type === 'company');

  const awardColumns: ColumnsType<UserAwardRow> = [
    { title: 'Шагналын нэр', dataIndex: 'award_name', render: (v) => v || '—' },
    { title: 'Шагнал авсан огноо', dataIndex: 'award_date', render: (v) => formatDate(v) },
    {
      title: 'Үйлдэл',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => deleteAward(record.id)} />
      ),
    },
  ];

  const descStyle = {
    labelStyle: { width: '32%', fontWeight: 600, background: '#fafafa' } as React.CSSProperties,
    contentStyle: { fontWeight: 500 } as React.CSSProperties,
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        loading={loading}
        title="Ажлын мэдээлэл"
        extra={
          !editing ? (
            <Button type="text" icon={<EditOutlined />} onClick={startEdit} title="Засах" />
          ) : null
        }
      >
        {!editing ? (
          <Descriptions column={2} bordered size="middle" {...descStyle}>
            {EMPLOYMENT_LABELS.map(({ key, label, fullWidth, type }) => (
              <Descriptions.Item key={key} label={label} span={fullWidth ? 2 : 1}>
                {type === 'date' ? formatDate(user?.[key] as string) : displayValue(user?.[key])}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : (
          <Form form={employmentForm} layout="vertical" requiredMark={false}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '0 24px',
              }}
            >
              {EMPLOYMENT_LABELS.map(({ key, label, fullWidth, type }) => (
                <Form.Item
                  key={key}
                  name={key}
                  label={label}
                  style={fullWidth ? { gridColumn: '1 / -1' } : undefined}
                  {...(type === 'date' ? dateFormItemProps() : {})}
                >
                  {type === 'date' ? (
                    <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} placeholder={label} />
                  ) : (
                    <Input placeholder={label} />
                  )}
                </Form.Item>
              ))}
            </div>
            <Space style={{ marginTop: 8 }}>
              <Button type="primary" loading={saving} onClick={saveEmployment}>
                Хадгалах
              </Button>
              <Button onClick={cancelEdit}>Цуцлах</Button>
            </Space>
          </Form>
        )}
      </Card>

      <Card title="Компанид дотоод шилжилт хөдлөлт" size="small">
        <Form form={careerForm} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <Form.Item name="order_number">
            <Input placeholder="Тушаалын дугаар" />
          </Form.Item>
          <Form.Item name="position">
            <Input placeholder="Албан тушаал" />
          </Form.Item>
          <Form.Item name="effective_date" {...dateFormItemProps()}>
            <DatePicker format={DATE_FORMAT} placeholder="Огноо" />
          </Form.Item>
          <Form.Item name="contract_end_date" {...dateFormItemProps()}>
            <DatePicker format={DATE_FORMAT} placeholder="Гэрээний дуусах огноо" />
          </Form.Item>
          <Button type="primary" icon={<PlusOutlined />} loading={careerSaving} onClick={addCareerChange} />
        </Form>
        <Table rowKey="id" columns={careerColumns} dataSource={careerChanges} pagination={false} size="small" />
      </Card>

      <Card title="Хөдөлмөрийн гэрээ дуусгавар" size="small">
        <Form form={terminationForm} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <Form.Item name="termination_order_number">
            <Input placeholder="Дуусгавар болсон тушаалын дугаар" style={{ width: 260 }} />
          </Form.Item>
          <Form.Item name="termination_date" {...dateFormItemProps()}>
            <DatePicker format={DATE_FORMAT} placeholder="Дуусгавар болсон огноо" />
          </Form.Item>
          <Form.Item name="reason">
            <Input placeholder="Шалтгаан" style={{ width: 220 }} />
          </Form.Item>
          <Button type="primary" icon={<PlusOutlined />} loading={terminationSaving} onClick={addTermination} />
        </Form>
        <Table rowKey="id" columns={terminationColumns} dataSource={contractTerminations} pagination={false} size="small" />
      </Card>

      <Card title="Төр, засгийн салбарын шагнал" size="small">
        <Form form={stateAwardForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="award_name">
            <Input placeholder="Шагналын нэр" style={{ width: 320 }} />
          </Form.Item>
          <Form.Item name="award_date" {...dateFormItemProps()}>
            <DatePicker format={DATE_FORMAT} placeholder="Шагнал авсан огноо" />
          </Form.Item>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={stateAwardSaving}
            onClick={() => addAward('state', stateAwardForm)}
          />
        </Form>
        <Table rowKey="id" columns={awardColumns} dataSource={stateAwards} pagination={false} size="small" />
      </Card>

      <Card title="Компанийн шагнал" size="small">
        <Form form={companyAwardForm} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="award_name">
            <Input placeholder="Компанийн шагнал" style={{ width: 320 }} />
          </Form.Item>
          <Form.Item name="award_date" {...dateFormItemProps()}>
            <DatePicker format={DATE_FORMAT} placeholder="Шагнал авсан огноо" />
          </Form.Item>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={companyAwardSaving}
            onClick={() => addAward('company', companyAwardForm)}
          />
        </Form>
        <Table rowKey="id" columns={awardColumns} dataSource={companyAwards} pagination={false} size="small" />
      </Card>
    </Space>
  );
}
