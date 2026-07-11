'use client';

import { useState } from 'react';
import { Space } from '@/components/admin/primitives';
import RoadEntityPage from '@/components/admin/road/RoadEntityPage';
import { ProjectSelect } from '@/components/admin/road/RoadSelectors';
import { STRUCTURE_TYPES, formatStation } from '@/lib/roadEngineering';

export default function StructuresPage() {
  const [projectId, setProjectId] = useState<number>();
  return (
    <div>
      <Space style={{ marginBottom: 12 }}><ProjectSelect value={projectId} onChange={setProjectId} /></Space>
      {projectId ? (
        <RoadEntityPage
          title="Байгууламж"
          resource="structures"
          query={{ project_id: projectId }}
          fields={[
            { key: 'project_id', label: 'Project ID', type: 'number', required: true },
            { key: 'type', label: 'Төрөл', type: 'select', required: true, options: STRUCTURE_TYPES },
            { key: 'station', label: 'Станц', type: 'number' },
            { key: 'length', label: 'Урт', type: 'number' },
            { key: 'width', label: 'Өргөн', type: 'number' },
            { key: 'remarks', label: 'Тайлбар', type: 'textarea' },
          ]}
          columns={[
            { title: 'Төрөл', dataIndex: 'type', render: (v) => STRUCTURE_TYPES.find((t) => t.value === v)?.label || v },
            { title: 'Станц', dataIndex: 'station', render: (v) => formatStation(Number(v)) },
            { title: 'Урт', dataIndex: 'length' },
            { title: 'Өргөн', dataIndex: 'width' },
            { title: 'Тайлбар', dataIndex: 'remarks', ellipsis: true },
          ]}
        />
      ) : <p className="text-muted-foreground">Төсөл сонгоно уу</p>}
    </div>
  );
}
