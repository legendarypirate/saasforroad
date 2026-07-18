'use client';

import DmsBrowser from '@/components/admin/document/DmsBrowser';

export default function PersonalDocumentsPage() {
  return (
    <DmsBrowser
      scope="personal"
      title="Хувийн бичиг баримт"
      subtitle="Зөвхөн танд харагдах хувийн файл, хавтас"
    />
  );
}
