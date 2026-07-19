'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Drawer,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { ReloadOutlined } from '@/components/admin/icons';
import { formatDate } from '@/lib/userDates';
import {
  REQUEST_STATUS_COLORS,
  REQUEST_STATUS_LABELS,
  ROLE_LABELS,
  collabApi,
  type CollabRequest,
  type CollabRequestStatus,
  type TenantCard,
} from '@/lib/collab';

export default function CollabRequestsPage() {
  useEffect(() => {
    document.title = 'Хамтын хүсэлтүүд';
  }, []);

  return (
    <div className="space-y-3 p-4 md:p-6">
      <p className="text-sm text-muted-foreground">
        Ирсэн болон илгээсэн хамтын ажиллагааны хүсэлтүүд
      </p>
      <Tabs
        defaultActiveKey="incoming"
        items={[
          { key: 'incoming', label: 'Ирсэн', children: <IncomingPanel /> },
          { key: 'outgoing', label: 'Илгээсэн', children: <OutgoingPanel /> },
        ]}
      />
    </div>
  );
}

function CompanyDrawer({
  open,
  onClose,
  company,
}: {
  open: boolean;
  onClose: () => void;
  company: TenantCard | null;
}) {
  return (
    <Drawer title="Компанийн профайл" open={open} onClose={onClose} width={360}>
      {!company ? (
        <p className="text-sm text-muted-foreground">Мэдээлэл байхгүй</p>
      ) : (
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Нэр</dt>
            <dd className="font-medium">
              {company.company_name || company.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Домайн</dt>
            <dd>{company.domain || company.slug || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">И-мэйл</dt>
            <dd>{company.contact_email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Утас</dt>
            <dd>{company.contact_phone || '—'}</dd>
          </div>
          {company.active_collaborations != null && (
            <div>
              <dt className="text-xs text-muted-foreground">Идэвхтэй хамтрал</dt>
              <dd>{company.active_collaborations}</dd>
            </div>
          )}
        </dl>
      )}
    </Drawer>
  );
}

function IncomingPanel() {
  const [rows, setRows] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<TenantCard | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await collabApi.incoming());
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openProfile = async (row: CollabRequest) => {
    if (row.from_company) {
      setProfile(row.from_company);
      setProfileOpen(true);
      try {
        const full = await collabApi.tenantProfile(row.from_tenant_id);
        setProfile(full);
      } catch {
        /* keep card */
      }
      return;
    }
    try {
      setProfile(await collabApi.tenantProfile(row.from_tenant_id));
      setProfileOpen(true);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<CollabRequest> = [
    {
      title: 'Компани',
      key: 'company',
      render: (_, row) => (
        <button
          type="button"
          className="text-left text-primary hover:underline"
          onClick={() => openProfile(row)}
        >
          {row.from_company?.company_name ||
            row.from_company?.name ||
            `#${row.from_tenant_id}`}
        </button>
      ),
    },
    {
      title: 'Зар / төсөл',
      key: 'ad',
      render: (_, row) =>
        row.job_ad?.title || row.job_ad?.project_name || `#${row.job_ad_id}`,
    },
    {
      title: 'Үүрэг',
      dataIndex: 'requested_role',
      width: 140,
      render: (v, row) => row.role_label || ROLE_LABELS[v] || v,
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 120,
      render: (s: CollabRequestStatus) => (
        <Tag color={REQUEST_STATUS_COLORS[s]}>
          {REQUEST_STATUS_LABELS[s] || s}
        </Tag>
      ),
    },
    {
      title: 'Огноо',
      dataIndex: 'createdAt',
      width: 110,
      render: (v) => (v ? formatDate(v) : '—'),
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_, row) =>
        row.status === 'pending' ? (
          <Space size="small">
            <Button
              size="small"
              type="primary"
              onClick={async () => {
                try {
                  await collabApi.accept(row.id);
                  message.success('Зөвшөөрлөө');
                  load();
                } catch (e) {
                  message.error(e instanceof Error ? e.message : 'Алдаа');
                }
              }}
            >
              Зөвшөөрөх
            </Button>
            <Button
              size="small"
              danger
              onClick={async () => {
                try {
                  await collabApi.reject(row.id);
                  message.success('Татгалзлаа');
                  load();
                } catch (e) {
                  message.error(e instanceof Error ? e.message : 'Алдаа');
                }
              }}
            >
              Татгалзах
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Шинэчлэх
        </Button>
      </div>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 20 }}
        expandable={{
          expandedRowRender: (row) => (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {row.message || 'Зурвас байхгүй'}
            </p>
          ),
        }}
      />
      <CompanyDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        company={profile}
      />
    </>
  );
}

function OutgoingPanel() {
  const [rows, setRows] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await collabApi.outgoing());
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnsType<CollabRequest> = [
    {
      title: 'Хүлээн авагч',
      key: 'to',
      render: (_, row) =>
        row.to_company?.company_name ||
        row.to_company?.name ||
        `#${row.to_tenant_id}`,
    },
    {
      title: 'Зар',
      key: 'ad',
      render: (_, row) => row.job_ad?.title || `#${row.job_ad_id}`,
    },
    {
      title: 'Үүрэг',
      dataIndex: 'requested_role',
      width: 140,
      render: (v, row) => row.role_label || ROLE_LABELS[v] || v,
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      width: 120,
      render: (s: CollabRequestStatus) => (
        <Tag color={REQUEST_STATUS_COLORS[s]}>
          {REQUEST_STATUS_LABELS[s] || s}
        </Tag>
      ),
    },
    {
      title: 'Огноо',
      dataIndex: 'createdAt',
      width: 110,
      render: (v) => (v ? formatDate(v) : '—'),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, row) =>
        row.status === 'pending' ? (
          <Button
            size="small"
            onClick={async () => {
              try {
                await collabApi.withdraw(row.id);
                message.success('Цуцаллаа');
                load();
              } catch (e) {
                message.error(e instanceof Error ? e.message : 'Алдаа');
              }
            }}
          >
            Цуцлах
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Шинэчлэх
        </Button>
      </div>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 20 }}
      />
    </>
  );
}
