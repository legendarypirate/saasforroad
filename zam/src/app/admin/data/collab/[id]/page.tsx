'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Select,
  Spin,
  Tag,
  message,
} from '@/components/admin/primitives';
import { ArrowLeftOutlined } from '@/components/admin/icons';
import {
  ROLE_LABELS,
  collabApi,
  type JobAd,
  type TenantCard,
} from '@/lib/collab';

export default function CollabAdDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [ad, setAd] = useState<JobAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TenantCard | null>(null);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await collabApi.marketplaceAd(id);
      setAd(data);
      if (data.company) setProfile(data.company);
      else if (data.tenant_id) {
        const p = await collabApi.tenantProfile(data.tenant_id);
        setProfile(p);
      }
    } catch (err) {
      console.error(err);
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
      setAd(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    document.title = 'Зар дэлгэрэнгүй';
    load();
  }, [load]);

  const submitApply = async () => {
    if (!ad) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      await collabApi.apply(ad.id, {
        message: values.message,
        requested_role: values.requested_role,
      });
      message.success('Хүсэлт илгээгдлээ');
      setApplyOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(err instanceof Error ? err.message : 'Алдаа');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spin size="large" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="p-6">
        <Empty description="Зар олдсонгүй" />
        <div className="mt-4 text-center">
          <Button onClick={() => router.push('/admin/data/collab')}>Буцах</Button>
        </div>
      </div>
    );
  }

  const company = profile || ad.company;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/admin/data/collab')}
      >
        Зах зээл
      </Button>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold">{ad.title}</h2>
          <Tag color="blue">
            {ad.role_label || ROLE_LABELS[ad.role_sought] || ad.role_sought}
          </Tag>
        </div>
        <p className="mb-3 text-sm text-muted-foreground whitespace-pre-wrap">
          {ad.description || 'Тайлбар байхгүй'}
        </p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Компани</dt>
            <dd>{ad.company_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Төсөл</dt>
            <dd>{ad.project_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Байршил</dt>
            <dd>
              {[ad.province, ad.location].filter(Boolean).join(' · ') || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Төсөв</dt>
            <dd>{ad.budget_note || '—'}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          {!ad.is_own && (
            <Button
              type="primary"
              disabled={ad.already_applied}
              onClick={() => {
                form.setFieldsValue({
                  requested_role: ad.role_sought,
                  message: '',
                });
                setApplyOpen(true);
              }}
            >
              {ad.already_applied
                ? 'Хүсэлт илгээсэн'
                : 'Хамтрах хүсэлт илгээх'}
            </Button>
          )}
          {ad.is_own && (
            <Button onClick={() => router.push('/admin/data/collab/my-ads')}>
              Миний зарууд руу
            </Button>
          )}
        </div>
      </div>

      {company && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Компанийн мэдээлэл</h3>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Нэр</dt>
              <dd>{company.company_name || company.name}</dd>
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
          </dl>
        </div>
      )}

      <Drawer
        title="Хамтрах хүсэлт"
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        width={400}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setApplyOpen(false)}>Болих</Button>
            <Button type="primary" loading={saving} onClick={submitApply}>
              Илгээх
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="requested_role"
            label="Үүрэг"
            rules={[{ required: true, message: 'Үүрэг сонгоно уу' }]}
          >
            <Select
              options={[
                { value: 'subcontractor', label: ROLE_LABELS.subcontractor },
                { value: 'partner', label: ROLE_LABELS.partner },
                { value: 'specialist', label: ROLE_LABELS.specialist },
              ]}
            />
          </Form.Item>
          <Form.Item name="message" label="Зурвас">
            <Input.TextArea rows={4} placeholder="Танилцуулга, санал…" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
