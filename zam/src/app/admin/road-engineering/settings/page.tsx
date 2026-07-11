'use client';

import RoadEntityPage from '@/components/admin/road/RoadEntityPage';

export default function RoadSettingsPage() {
  return (
    <RoadEntityPage
      title="Тохиргоо"
      resource="settings"
      fields={[
        { key: 'project_id', label: 'Project ID (хоосон = глобал)', type: 'number' },
        { key: 'setting_key', label: 'Түлхүүр', required: true },
        { key: 'setting_value', label: 'Утга', required: true },
        { key: 'label', label: 'Нэр' },
        { key: 'unit', label: 'Нэгж' },
      ]}
      columns={[
        { title: 'Түлхүүр', dataIndex: 'setting_key' },
        { title: 'Утга', dataIndex: 'setting_value' },
        { title: 'Нэр', dataIndex: 'label' },
        { title: 'Нэгж', dataIndex: 'unit' },
        { title: 'Төсөл', dataIndex: 'project_id' },
      ]}
    />
  );
}
