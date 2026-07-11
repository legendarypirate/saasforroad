'use client';

import { useState } from 'react';
import { Space } from '@/components/admin/primitives';
import RoadEntityPage from '@/components/admin/road/RoadEntityPage';
import { ProjectSelect } from '@/components/admin/road/RoadSelectors';

export default function TypicalSectionsPage() {
  const [projectId, setProjectId] = useState<number>();
  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <ProjectSelect value={projectId} onChange={setProjectId} />
      </Space>
      {projectId ? (
        <RoadEntityPage
          title="Ердийн огтлол"
          resource="typical-sections"
          query={{ project_id: projectId }}
          fields={[
            { key: 'project_id', label: 'Project ID', type: 'number', required: true },
            { key: 'name', label: 'Нэр', required: true },
            {
              key: 'template_key',
              label: 'Загвар',
              type: 'select',
              options: [
                { value: '2lane', label: '2 эгнээ' },
                { value: '4lane', label: '4 эгнээ' },
                { value: 'mountain', label: 'Уулын зам' },
                { value: 'expressway', label: 'Хурдны зам' },
                { value: 'custom', label: 'Custom' },
              ],
            },
            { key: 'road_width', label: 'Замын өргөн', type: 'number' },
            { key: 'lane_width', label: 'Эгнээний өргөн', type: 'number' },
            { key: 'lane_count', label: 'Эгнээний тоо', type: 'number' },
            { key: 'shoulder_width', label: 'Shoulder', type: 'number' },
            { key: 'side_slope', label: 'Хажуу налуу', type: 'number' },
            { key: 'ditch_width', label: 'Шуудууны өргөн', type: 'number' },
            { key: 'remarks', label: 'Тайлбар', type: 'textarea' },
          ]}
          columns={[
            { title: 'Нэр', dataIndex: 'name' },
            { title: 'Загвар', dataIndex: 'template_key' },
            { title: 'Өргөн', dataIndex: 'road_width' },
            { title: 'Эгнээ', dataIndex: 'lane_count' },
            { title: 'Shoulder', dataIndex: 'shoulder_width' },
          ]}
        />
      ) : (
        <p className="text-muted-foreground">Төсөл сонгоно уу</p>
      )}
    </div>
  );
}
