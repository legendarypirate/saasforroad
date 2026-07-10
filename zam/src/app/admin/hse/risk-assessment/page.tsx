'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';

export default function Page() {
  return (
    <HseEntityPage
      title="Эрсдэлийн үнэлгээ (JSA/JHA)"
      resource="risk-assessments"
      fields={[
        { key: 'activity', label: 'Үйл ажиллагаа', required: true },
        { key: 'hazard', label: 'Аюул', type: 'textarea', required: true },
        { key: 'risk_level', label: 'Эрсдэлийн түвшин' },
        { key: 'likelihood', label: 'Магадлал' },
        { key: 'severity', label: 'Ноцтой байдал' },
        { key: 'control_measures', label: 'Хяналтын арга', type: 'textarea' },
        { key: 'status', label: 'Төлөв', type: 'select', options: [
          { value: 'draft', label: 'Ноорог' }, { value: 'pending', label: 'Хүлээгдэж буй' },
          { value: 'approved', label: 'Баталсан' }, { value: 'rejected', label: 'Татгалзсан' },
        ]},
      ]}
      columns={[
        { title: 'Үйл ажиллагаа', dataIndex: 'activity' },
        { title: 'Эрсдэл', dataIndex: 'risk_level' },
        { title: 'Төлөв', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
      ]}
    />
  );
}
