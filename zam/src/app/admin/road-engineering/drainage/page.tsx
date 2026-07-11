'use client';

import { useState } from 'react';
import { Space } from '@/components/admin/primitives';
import RoadEntityPage from '@/components/admin/road/RoadEntityPage';
import { ProjectSelect } from '@/components/admin/road/RoadSelectors';
import { DRAINAGE_TYPES, formatStation } from '@/lib/roadEngineering';

export default function DrainagePage() {
  const [projectId, setProjectId] = useState<number>();
  return (
    <div>
      <Space style={{ marginBottom: 12 }}><ProjectSelect value={projectId} onChange={setProjectId} /></Space>
      {projectId ? (
        <RoadEntityPage
          title="Ус зайлуулалт"
          resource="drainages"
          query={{ project_id: projectId }}
          fields={[
            { key: 'project_id', label: 'Project ID', type: 'number', required: true },
            { key: 'type', label: 'Төрөл', type: 'select', required: true, options: DRAINAGE_TYPES },
            { key: 'station', label: 'Станц', type: 'number' },
            { key: 'length', label: 'Урт', type: 'number' },
            { key: 'diameter', label: 'Диаметр', type: 'number' },
            { key: 'material', label: 'Материал' },
            { key: 'remarks', label: 'Тайлбар', type: 'textarea' },
          ]}
          columns={[
            { title: 'Төрөл', dataIndex: 'type', render: (v) => DRAINAGE_TYPES.find((t) => t.value === v)?.label || v },
            { title: 'Станц', dataIndex: 'station', render: (v) => formatStation(Number(v)) },
            { title: 'Урт', dataIndex: 'length' },
            { title: 'Диаметр', dataIndex: 'diameter' },
            { title: 'Материал', dataIndex: 'material' },
          ]}
        />
      ) : <p className="text-muted-foreground">Төсөл сонгоно уу</p>}
    </div>
  );
}
