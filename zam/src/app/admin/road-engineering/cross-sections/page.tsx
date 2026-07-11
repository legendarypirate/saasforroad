'use client';

import { useState } from 'react';
import { Button, Select, Space, message } from '@/components/admin/primitives';
import RoadEntityPage from '@/components/admin/road/RoadEntityPage';
import { AlignmentSelect, ProjectSelect } from '@/components/admin/road/RoadSelectors';
import { formatStation, generateCrossSections } from '@/lib/roadEngineering';

export default function CrossSectionsPage() {
  const [projectId, setProjectId] = useState<number>();
  const [alignmentId, setAlignmentId] = useState<number>();
  const [interval, setInterval] = useState(25);

  return (
    <div className="space-y-3">
      <Space wrap>
        <ProjectSelect value={projectId} onChange={(id) => { setProjectId(id); setAlignmentId(undefined); }} />
        <AlignmentSelect projectId={projectId} value={alignmentId} onChange={setAlignmentId} />
        <Select
          value={interval}
          style={{ width: 120 }}
          onChange={setInterval}
          options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} м` }))}
        />
        <Button
          type="primary"
          disabled={!alignmentId}
          onClick={async () => {
            if (!alignmentId) return;
            await generateCrossSections({ alignment_id: alignmentId, interval, road_width: 7.5, lane_count: 2, shoulder_width: 1.5 });
            message.success('Хөндлөн огтлол үүслээ');
            window.location.reload();
          }}
        >
          Generate
        </Button>
      </Space>
      {alignmentId ? (
        <RoadEntityPage
          title="Хөндлөн огтлол"
          resource="cross-sections"
          query={{ alignment_id: alignmentId }}
          fields={[
            { key: 'alignment_id', label: 'Alignment ID', type: 'number', required: true },
            { key: 'station', label: 'Станц', type: 'number', required: true },
            { key: 'road_width', label: 'Замын өргөн', type: 'number' },
            { key: 'lane_count', label: 'Эгнээ', type: 'number' },
            { key: 'shoulder_width', label: 'Shoulder', type: 'number' },
            { key: 'median_width', label: 'Median', type: 'number' },
            { key: 'left_slope', label: 'Зүүн налуу', type: 'number' },
            { key: 'right_slope', label: 'Баруун налуу', type: 'number' },
          ]}
          columns={[
            { title: 'Станц', dataIndex: 'station', render: (v) => formatStation(Number(v)) },
            { title: 'Өргөн', dataIndex: 'road_width' },
            { title: 'Эгнээ', dataIndex: 'lane_count' },
            { title: 'Shoulder', dataIndex: 'shoulder_width' },
            { title: 'Зүүн налуу', dataIndex: 'left_slope' },
            { title: 'Баруун налуу', dataIndex: 'right_slope' },
          ]}
        />
      ) : (
        <p className="text-muted-foreground">Тэнхлэг сонгоно уу</p>
      )}
    </div>
  );
}
