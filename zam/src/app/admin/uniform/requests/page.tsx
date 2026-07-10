'use client';

import { useEffect, useState } from 'react';
import UniformEntityPage, { Tag } from '@/components/admin/uniform/UniformEntityPage';
import { approveUniformRequest, fetchUniformList } from '@/lib/uniform';
import { Spinner } from '@/components/ui/spinner';
import { Button, Space, message } from '@/components/admin/primitives';

export default function Page() {
  const [ready, setReady] = useState(false);
  const [itemOpts, setItemOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [userOpts, setUserOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [projectOpts, setProjectOpts] = useState<Array<{ value: number; label: string }>>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      const [items, usersRes, projectsRes] = await Promise.all([
        fetchUniformList<Record<string, unknown>>('items'),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`).then((r) => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project`).then((r) => r.json()),
      ]);
      setItemOpts(items.map((i) => ({ value: Number(i.id), label: String(i.name) })));
      const userList = usersRes.success
        ? Array.isArray(usersRes.data)
          ? usersRes.data
          : usersRes.data?.rows || []
        : [];
      setUserOpts(userList.map((u: { id: number; username: string }) => ({ value: u.id, label: u.username })));
      setProjectOpts(
        (projectsRes.success ? projectsRes.data : []).map((p: { id: number; name: string }) => ({
          value: p.id,
          label: p.name,
        })),
      );
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <UniformEntityPage
      key={tick}
      title="Хүсэлт"
      resource="requests"
      defaults={{ status: 'pending', qty: 1 }}
      fields={[
        { key: 'request_date', label: 'Огноо', type: 'date', required: true },
        { key: 'user_id', label: 'Ажилтан', type: 'select', options: userOpts, required: true },
        { key: 'item_id', label: 'Бараа', type: 'select', options: itemOpts, required: true },
        { key: 'size', label: 'Хэмжээ' },
        { key: 'qty', label: 'Тоо', type: 'number', required: true },
        { key: 'project_id', label: 'Төсөл', type: 'select', options: projectOpts },
        { key: 'notes', label: 'Тэмдэглэл', type: 'textarea' },
      ]}
      columns={[
        { title: 'Огноо', dataIndex: 'request_date', width: 110 },
        {
          title: 'Ажилтан',
          render: (_, r) => (r.requester as { username?: string })?.username || '—',
        },
        {
          title: 'Бараа',
          render: (_, r) => {
            const item = r.item as { name?: string };
            return `${item?.name || '—'}${r.size ? ` (${r.size})` : ''} ×${r.qty}`;
          },
        },
        {
          title: 'Төлөв',
          dataIndex: 'status',
          render: (v: string, row) => (
            <Space>
              <Tag color={v === 'approved' ? 'green' : v === 'rejected' ? 'red' : 'blue'}>
                {v === 'pending' ? 'Хүлээгдэж' : v === 'approved' ? 'Батлагдсан' : v === 'rejected' ? 'Татгалзсан' : v}
              </Tag>
              {v === 'pending' && (
                <Button
                  type="link"
                  size="small"
                  onClick={async () => {
                    const userRaw = localStorage.getItem('user');
                    const user = userRaw ? JSON.parse(userRaw) : null;
                    try {
                      await approveUniformRequest(Number(row.id), {
                        status: 'approved',
                        approved_by: user?.id,
                      });
                      message.success('Батлагдлаа');
                      setTick((t) => t + 1);
                    } catch (e) {
                      message.error(e instanceof Error ? e.message : 'Алдаа');
                    }
                  }}
                >
                  Батлах
                </Button>
              )}
            </Space>
          ),
        },
      ]}
    />
  );
}
