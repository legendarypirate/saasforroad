'use client';

import { useState } from 'react';
import { Space, message, Button } from '@/components/admin/primitives';
import RoadEntityPage from '@/components/admin/road/RoadEntityPage';
import { ProjectSelect } from '@/components/admin/road/RoadSelectors';
import { createRoadRecord } from '@/lib/roadEngineering';

const TYPES = [
  { value: 'longitudinal_profile', label: 'Уртрагийн профиль' },
  { value: 'cross_section', label: 'Хөндлөн огтлол' },
  { value: 'earthwork', label: 'Шорооны ажил' },
  { value: 'typical_section', label: 'Ердийн огтлол' },
];

export default function DrawingsPage() {
  const [projectId, setProjectId] = useState<number>();
  return (
    <div>
      <Space style={{ marginBottom: 12 }} wrap>
        <ProjectSelect value={projectId} onChange={setProjectId} />
        <Button
          disabled={!projectId}
          onClick={async () => {
            if (!projectId) return;
            for (const t of TYPES) {
              await createRoadRecord('drawings', {
                project_id: projectId,
                drawing_type: t.value,
                title: t.label,
                sheet_no: t.value.slice(0, 2).toUpperCase() + '-GEN',
                status: 'draft',
              });
            }
            message.success('Зураг төслүүд үүслээ (PDF/DWG placeholder)');
            window.location.reload();
          }}
        >
          Generate багц
        </Button>
        <Button onClick={() => message.info('DWG export — placeholder (ирээдүйд CAD API)')}>DWG Export</Button>
      </Space>
      {projectId ? (
        <RoadEntityPage
          title="Зураг төсөл / Drawings"
          resource="drawings"
          query={{ project_id: projectId }}
          fields={[
            { key: 'project_id', label: 'Project ID', type: 'number', required: true },
            { key: 'drawing_type', label: 'Төрөл', type: 'select', required: true, options: TYPES },
            { key: 'title', label: 'Гарчиг', required: true },
            { key: 'sheet_no', label: 'Хуудас №' },
            {
              key: 'status',
              label: 'Статус',
              type: 'select',
              options: [
                { value: 'draft', label: 'Ноорог' },
                { value: 'review', label: 'Хяналт' },
                { value: 'approved', label: 'Батлагдсан' },
              ],
            },
            { key: 'file_url', label: 'Файл URL' },
            { key: 'remarks', label: 'Тайлбар', type: 'textarea' },
          ]}
          columns={[
            { title: 'Төрөл', dataIndex: 'drawing_type' },
            { title: 'Гарчиг', dataIndex: 'title' },
            { title: 'Хуудас', dataIndex: 'sheet_no' },
            { title: 'Статус', dataIndex: 'status' },
          ]}
        />
      ) : <p className="text-muted-foreground">Төсөл сонгоно уу</p>}
    </div>
  );
}
