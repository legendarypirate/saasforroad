'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Empty,
  Spin,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { ArrowLeftOutlined, ReloadOutlined } from '@/components/admin/icons';
import {
  ROLE_LABELS,
  collabApi,
  type ProjectCollaboratorRow,
} from '@/lib/collab';

export default function ProjectCollaboratorsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params?.projectId);
  const [projectName, setProjectName] = useState('');
  const [rows, setRows] = useState<ProjectCollaboratorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await collabApi.projectCollaborators(projectId);
      setProjectName(
        data.project?.name || data.project?.road_name || `Төсөл #${projectId}`,
      );
      setRows(data.collaborators || []);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Алдаа');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    document.title = 'Төслийн хамтрагчид';
    load();
  }, [load]);

  const columns: ColumnsType<ProjectCollaboratorRow> = [
    {
      title: 'Компани',
      key: 'company',
      render: (_, row) =>
        row.company?.company_name || row.company?.name || '—',
    },
    {
      title: 'Үүрэг',
      dataIndex: 'role',
      render: (v, row) => (
        <Tag color={row.is_owner ? 'gold' : 'blue'}>
          {row.role_label || ROLE_LABELS[v] || v}
        </Tag>
      ),
    },
    {
      title: 'Холбоо',
      key: 'contact',
      render: (_, row) =>
        [row.company?.contact_phone, row.company?.contact_email]
          .filter(Boolean)
          .join(' · ') || '—',
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, row) =>
        !row.is_owner && row.id ? (
          <Button
            size="small"
            danger
            onClick={async () => {
              try {
                await collabApi.removeCollaborator(row.id!);
                message.success('Хаслаа');
                load();
              } catch (e) {
                message.error(e instanceof Error ? e.message : 'Алдаа');
              }
            }}
          >
            Хасах
          </Button>
        ) : null,
    },
  ];

  if (loading && !rows.length) {
    return (
      <div className="flex justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/admin/data/collab/my-ads')}
          />
          <div>
            <p className="text-sm font-medium">{projectName}</p>
            <p className="text-xs text-muted-foreground">
              Үндсэн гүйцэтгэгч + туслан гүйцэтгэгч / түнш
            </p>
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Шинэчлэх
        </Button>
      </div>

      {rows.length === 0 ? (
        <Empty description="Хамтрагч байхгүй" />
      ) : (
        <Table
          rowKey={(r) =>
            r.is_owner ? 'owner' : String(r.id ?? r.collaborator_tenant_id)
          }
          size="small"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={false}
        />
      )}
    </div>
  );
}
