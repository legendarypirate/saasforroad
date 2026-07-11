'use client';

import { useState } from 'react';
import { Button, Form, Input, InputNumber, Select, Space, message } from '@/components/admin/primitives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PROJECT_STAGES,
  formatBudget,
  type EarnedValue,
  type ProjectRecord,
  updateProject,
} from '@/lib/project';

type Props = {
  project: ProjectRecord;
  earnedValue?: EarnedValue | null;
  onSaved: () => void;
};

export default function ProjectProgressTab({ project, earnedValue, onSaved }: Props) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const ev = earnedValue || project.earned_value;

  const save = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await updateProject(project.id!, v);
      message.success('Ахиц хадгалагдлаа');
      onSaved();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'PV (төлөвлөсөн)', value: formatBudget(ev?.PV) },
          { label: 'EV (олсон)', value: formatBudget(ev?.EV) },
          { label: 'AC (зарцуулсан)', value: formatBudget(ev?.AC) },
          {
            label: 'SPI',
            value: ev?.SPI != null ? ev.SPI.toFixed(2) : '—',
            hint: ev?.SPI != null ? (ev.SPI >= 1 ? 'Хуваарь OK' : 'Хоцорч буй') : '',
          },
          {
            label: 'CPI',
            value: ev?.CPI != null ? ev.CPI.toFixed(2) : '—',
            hint: ev?.CPI != null ? (ev.CPI >= 1 ? 'Зардал OK' : 'Илүү зардал') : '',
          },
        ].map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-xs text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{c.value}</p>
              {'hint' in c && c.hint ? (
                <p className="text-[11px] text-muted-foreground">{c.hint}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Form
        form={form}
        layout="vertical"
        className="max-w-2xl"
        initialValues={{
          stage: project.stage || 'mobilization',
          progress_percent: project.progress_percent || project.effective_progress || 0,
          progress_unit: project.progress_unit || '%',
          progress_planned: project.progress_planned,
          progress_actual: project.progress_actual,
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Form.Item name="stage" label="Одоогийн үе шат">
            <Select options={[...PROJECT_STAGES]} />
          </Form.Item>
          <Form.Item name="progress_percent" label="Физик ахиц %">
            <InputNumber className="w-full" min={0} max={100} />
          </Form.Item>
          <Form.Item name="progress_unit" label="Хэмжих нэгж">
            <Input placeholder="% / км / м³" />
          </Form.Item>
          <Form.Item name="progress_planned" label="Төлөвлөсөн хэмжээ">
            <InputNumber className="w-full" min={0} step={0.1} />
          </Form.Item>
          <Form.Item name="progress_actual" label="Бодит хэмжээ">
            <InputNumber className="w-full" min={0} step={0.1} />
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
