'use client';

import { useState } from 'react';
import { Button, Form, Input, InputNumber, Select, Space, message } from '@/components/admin/primitives';
import {
  CURRENCIES,
  FIDIC_CONTRACT_TYPES,
  type ProjectRecord,
  updateProject,
} from '@/lib/project';

type Props = {
  project: ProjectRecord;
  onSaved: () => void;
};

export default function ProjectContractTab({ project, onSaved }: Props) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await updateProject(project.id!, {
        ...v,
        contract_date: v.contract_date || null,
      });
      message.success('Гэрээний мэдээлэл хадгалагдлаа');
      onSaved();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">
        FIDIC / дотоодын гэрээний нөхцөл — хадгалалт, LD, санхүүжилт.
      </p>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          contract_number: project.contract_number,
          contract_type: project.contract_type || 'Domestic',
          contract_date: project.contract_date,
          currency: project.currency || 'MNT',
          retention_pct: Number(project.retention_pct ?? 5),
          liquidated_damages_per_day: Number(project.liquidated_damages_per_day || 0) || undefined,
          funding_source: project.funding_source,
          tender_ref: project.tender_ref,
          contingency_pct: Number(project.contingency_pct ?? 10),
          committed_amount: Number(project.committed_amount || 0) || undefined,
          budget: Number(project.budget || 0),
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="contract_number" label="Гэрээний дугаар">
            <Input />
          </Form.Item>
          <Form.Item name="contract_type" label="Гэрээний хэлбэр">
            <Select options={[...FIDIC_CONTRACT_TYPES]} />
          </Form.Item>
          <Form.Item name="contract_date" label="Гэрээний огноо">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="tender_ref" label="Тендерийн лавлагаа">
            <Input />
          </Form.Item>
          <Form.Item name="currency" label="Валют">
            <Select options={[...CURRENCIES]} />
          </Form.Item>
          <Form.Item name="budget" label="Гэрээний дүн">
            <InputNumber money className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="retention_pct" label="Хадгалалт %">
            <InputNumber className="w-full" min={0} max={100} step={0.5} />
          </Form.Item>
          <Form.Item name="liquidated_damages_per_day" label="LD / өдөр">
            <InputNumber money className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="contingency_pct" label="Нөөц %">
            <InputNumber className="w-full" min={0} max={100} />
          </Form.Item>
          <Form.Item name="committed_amount" label="Амласан зардал">
            <InputNumber money className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="funding_source" label="Санхүүжилтын эх үүсвэр" className="sm:col-span-2">
            <Input placeholder="Жишээ: АХБ / Улсын төсөв / PPP" />
          </Form.Item>
        </div>
        <Space>
          <Button type="primary" loading={saving} onClick={save}>
            Хадгалах
          </Button>
        </Space>
      </Form>
    </div>
  );
}
