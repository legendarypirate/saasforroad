'use client';

import { useState } from 'react';
import { Space } from '@/components/admin/primitives';
import RoadEntityPage from '@/components/admin/road/RoadEntityPage';
import { AlignmentSelect, ProjectSelect } from '@/components/admin/road/RoadSelectors';
import { formatStation } from '@/lib/roadEngineering';

export default function HorizontalAlignmentPage() {
  const [projectId, setProjectId] = useState<number>();
  const [alignmentId, setAlignmentId] = useState<number>();

  return (
    <div className="space-y-3">
      <Space wrap>
        <h2 style={{ margin: 0 }}>Хэвтээ тэнхлэг</h2>
        <ProjectSelect value={projectId} onChange={(id) => { setProjectId(id); setAlignmentId(undefined); }} />
        <AlignmentSelect projectId={projectId} value={alignmentId} onChange={setAlignmentId} />
      </Space>
      {alignmentId ? (
        <RoadEntityPage
          title="Horizontal elements"
          resource="horizontal-elements"
          query={{ alignment_id: alignmentId }}
          fields={[
            { key: 'alignment_id', label: 'Alignment ID', type: 'number', required: true },
            {
              key: 'element_type',
              label: 'Төрөл',
              type: 'select',
              required: true,
              options: [
                { value: 'tangent', label: 'Tangent' },
                { value: 'curve', label: 'Circular curve' },
                { value: 'spiral', label: 'Spiral' },
              ],
            },
            { key: 'start_station', label: 'Эхлэх станц', type: 'number', required: true },
            { key: 'end_station', label: 'Төгсөх станц', type: 'number' },
            { key: 'length', label: 'Урт', type: 'number' },
            { key: 'radius', label: 'Радиус', type: 'number' },
            { key: 'spiral_param', label: 'Spiral A', type: 'number' },
            { key: 'bearing', label: 'Bearing', type: 'number' },
            { key: 'azimuth', label: 'Azimuth', type: 'number' },
            { key: 'northing', label: 'Northing', type: 'number' },
            { key: 'easting', label: 'Easting', type: 'number' },
            { key: 'remarks', label: 'Тайлбар' },
            { key: 'sort_order', label: 'Эрэмбэ', type: 'number' },
          ]}
          columns={[
            { title: 'Төрөл', dataIndex: 'element_type' },
            { title: 'Эхлэх', dataIndex: 'start_station', render: (v) => formatStation(Number(v)) },
            { title: 'Төгсөх', dataIndex: 'end_station', render: (v) => formatStation(Number(v)) },
            { title: 'Урт', dataIndex: 'length' },
            { title: 'R', dataIndex: 'radius' },
            { title: 'Bearing', dataIndex: 'bearing' },
            { title: 'Azimuth', dataIndex: 'azimuth' },
          ]}
        />
      ) : (
        <p className="text-muted-foreground">Тэнхлэг сонгоно уу. Мөн Alignments CRUD доорх жагсаалтаас төслийн тэнхлэг үүсгэж болно.</p>
      )}
      <RoadEntityPage
        title="Тэнхлэгүүд (Alignments)"
        resource="alignments"
        query={projectId ? { project_id: projectId } : undefined}
        fields={[
          { key: 'project_id', label: 'Project ID', type: 'number', required: true },
          { key: 'name', label: 'Нэр', required: true },
          {
            key: 'type',
            label: 'Төрөл',
            type: 'select',
            required: true,
            options: [
              { value: 'CENTERLINE', label: 'CENTERLINE' },
              { value: 'LEFT', label: 'LEFT' },
              { value: 'RIGHT', label: 'RIGHT' },
            ],
          },
          { key: 'start_station', label: 'Эхлэх станц', type: 'number' },
          { key: 'end_station', label: 'Төгсөх станц', type: 'number' },
          { key: 'length', label: 'Урт', type: 'number' },
        ]}
        columns={[
          { title: 'Нэр', dataIndex: 'name' },
          { title: 'Төрөл', dataIndex: 'type' },
          { title: 'Урт', dataIndex: 'length' },
          { title: 'Эхлэх', dataIndex: 'start_station', render: (v) => formatStation(Number(v)) },
          { title: 'Төгсөх', dataIndex: 'end_station', render: (v) => formatStation(Number(v)) },
        ]}
      />
    </div>
  );
}
