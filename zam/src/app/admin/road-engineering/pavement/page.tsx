'use client';

import { useState } from 'react';
import { Space } from '@/components/admin/primitives';
import RoadEntityPage from '@/components/admin/road/RoadEntityPage';
import { ProjectSelect } from '@/components/admin/road/RoadSelectors';
import { formatStation } from '@/lib/roadEngineering';

export default function PavementPage() {
  const [projectId, setProjectId] = useState<number>();
  return (
    <div>
      <Space style={{ marginBottom: 12 }}><ProjectSelect value={projectId} onChange={setProjectId} /></Space>
      {projectId ? (
        <RoadEntityPage
          title="Хучилт / Pavement"
          resource="pavements"
          query={{ project_id: projectId }}
          fields={[
            { key: 'project_id', label: 'Project ID', type: 'number', required: true },
            { key: 'layer_name', label: 'Давхарга', required: true },
            { key: 'station_from', label: 'Станц эхлэх', type: 'number' },
            { key: 'station_to', label: 'Станц төгсөх', type: 'number' },
            { key: 'thickness_mm', label: 'Зузаан (мм)', type: 'number' },
            { key: 'material', label: 'Материал' },
            { key: 'width', label: 'Өргөн', type: 'number' },
            { key: 'remarks', label: 'Тайлбар', type: 'textarea' },
          ]}
          columns={[
            { title: 'Давхарга', dataIndex: 'layer_name' },
            { title: 'Эхлэх', dataIndex: 'station_from', render: (v) => formatStation(Number(v)) },
            { title: 'Төгсөх', dataIndex: 'station_to', render: (v) => formatStation(Number(v)) },
            { title: 'мм', dataIndex: 'thickness_mm' },
            { title: 'Материал', dataIndex: 'material' },
            { title: 'Өргөн', dataIndex: 'width' },
          ]}
        />
      ) : <p className="text-muted-foreground">Төсөл сонгоно уу</p>}
    </div>
  );
}
