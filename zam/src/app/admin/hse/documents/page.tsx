'use client';

import HseEntityPage, { Tag } from '@/components/admin/hse/HseEntityPage';

export default function Page() {
  return (
    <HseEntityPage
      title="ХАБЭА баримт бичиг"
      resource="documents"
      fields={[
        { key: 'title', label: 'Гарчиг', required: true },
        { key: 'category', label: 'Ангилал', type: 'select', options: [
          { value: 'policy', label: 'Бодлого' }, { value: 'procedure', label: 'Журам' },
          { value: 'emergency', label: 'Яаралтай төлөвлөгөө' }, { value: 'msds', label: 'MSDS' },
          { value: 'instruction', label: 'Заавар' },
        ], required: true },
        { key: 'version', label: 'Хувилбар', type: 'number' },
        { key: 'file_url', label: 'Файл URL' },
        { key: 'effective_date', label: 'Хүчин төгөлдөр', type: 'date' },
        { key: 'review_date', label: 'Хяналт', type: 'date' },
        { key: 'status', label: 'Төлөв', type: 'select', options: [
          { value: 'draft', label: 'Ноорог' }, { value: 'active', label: 'Идэвхтэй' }, { value: 'archived', label: 'Архив' },
        ]},
      ]}
      columns={[
        { title: 'Гарчиг', dataIndex: 'title' },
        { title: 'Ангилал', dataIndex: 'category' },
        { title: 'Хувилбар', dataIndex: 'version' },
        { title: 'Төлөв', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
      ]}
    />
  );
}
