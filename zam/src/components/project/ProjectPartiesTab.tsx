'use client';

import { useState } from 'react';
import { Button, Form, Input, Space, message } from '@/components/admin/primitives';
import { type ProjectRecord, updateProject } from '@/lib/project';

type Props = {
  project: ProjectRecord;
  onSaved: () => void;
  brigadeSlot?: React.ReactNode;
};

export default function ProjectPartiesTab({ project, onSaved, brigadeSlot }: Props) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await updateProject(project.id!, {
        ...v,
        client_name: v.employer_name || v.client_name,
      });
      message.success('Талуудын мэдээлэл хадгалагдлаа');
      onSaved();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm text-muted-foreground">
          FIDIC талууд: Employer (Захиалагч) · Engineer · Contractor.
        </p>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            employer_name: project.employer_name || project.client_name,
            employer_rep: project.employer_rep,
            engineer_org: project.engineer_org || project.engineer,
            engineer: project.engineer,
            contractor_name: project.contractor_name,
            contractor_rep: project.contractor_rep,
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Form.Item name="employer_name" label="Захиалагч / Employer">
              <Input />
            </Form.Item>
            <Form.Item name="employer_rep" label="Захиалагчийн төлөөлөгч">
              <Input />
            </Form.Item>
            <Form.Item name="engineer_org" label="Инженерийн байгууллага / Engineer">
              <Input />
            </Form.Item>
            <Form.Item name="engineer" label="Хариуцсан инженер">
              <Input />
            </Form.Item>
            <Form.Item name="contractor_name" label="Гүйцэтгэгч / Contractor">
              <Input />
            </Form.Item>
            <Form.Item name="contractor_rep" label="Гүйцэтгэгчийн төлөөлөгч">
              <Input />
            </Form.Item>
          </div>
          <Space>
            <Button type="primary" loading={saving} onClick={save}>
              Хадгалах
            </Button>
          </Space>
        </Form>
      </div>
      {brigadeSlot ? (
        <div>
          <h3 className="mb-3 text-base font-semibold">Бригад / талбайгийн баг</h3>
          {brigadeSlot}
        </div>
      ) : null}
    </div>
  );
}
