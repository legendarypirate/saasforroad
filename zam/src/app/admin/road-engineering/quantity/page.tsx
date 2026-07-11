'use client';

import { useState } from 'react';
import { Space } from '@/components/admin/primitives';
import RoadEntityPage from '@/components/admin/road/RoadEntityPage';
import { ProjectSelect } from '@/components/admin/road/RoadSelectors';

export default function QuantityPage() {
  const [projectId, setProjectId] = useState<number>();
  return (
    <div>
      <Space style={{ marginBottom: 12 }}><ProjectSelect value={projectId} onChange={setProjectId} /></Space>
      {projectId ? (
        <RoadEntityPage
          title="Хэмжээ тооцоо / BOQ"
          resource="quantity-items"
          query={{ project_id: projectId }}
          fields={[
            { key: 'project_id', label: 'Project ID', type: 'number', required: true },
            { key: 'code', label: 'Код' },
            { key: 'description', label: 'Тайлбар', required: true },
            { key: 'unit', label: 'Нэгж' },
            { key: 'quantity', label: 'Тоо хэмжээ', type: 'number' },
            { key: 'unit_price', label: 'Нэгж үнэ', type: 'number' },
            { key: 'category', label: 'Ангилал' },
            { key: 'remarks', label: 'Тэмдэглэл', type: 'textarea' },
          ]}
          columns={[
            { title: 'Код', dataIndex: 'code' },
            { title: 'Тайлбар', dataIndex: 'description' },
            { title: 'Нэгж', dataIndex: 'unit' },
            { title: 'Тоо', dataIndex: 'quantity' },
            { title: 'Үнэ', dataIndex: 'unit_price' },
            {
              title: 'Дүн',
              key: 'amount',
              render: (_, r) => (Number(r.quantity || 0) * Number(r.unit_price || 0)).toLocaleString(),
            },
          ]}
        />
      ) : <p className="text-muted-foreground">Төсөл сонгоно уу</p>}
    </div>
  );
}
