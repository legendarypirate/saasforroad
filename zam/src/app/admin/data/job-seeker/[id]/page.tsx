'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Space,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Tag,
  Avatar,
} from '@/components/admin/primitives';
import {
  ArrowLeftOutlined,
  MailOutlined,
  ReloadOutlined,
} from '@/components/admin/icons';
import { formatDate } from '@/lib/userDates';
import {
  jobSeekerApi,
  EDUCATION_LABELS,
  RELATION_LABELS,
  OFFER_STATUS_COLORS,
  OFFER_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
  type JobSeeker,
} from '@/lib/jobSeeker';

export default function JobSeekerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [seeker, setSeeker] = useState<JobSeeker | null>(null);
  const [loading, setLoading] = useState(true);
  const [offerOpen, setOfferOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offerForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobSeekerApi.get(id);
      setSeeker(data);
      document.title = data.full_name;
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const handleOffer = async () => {
    if (!seeker) return;
    try {
      const values = await offerForm.validateFields();
      setSaving(true);
      await jobSeekerApi.createOffer(seeker.id, {
        job_title: values.job_title,
        message: values.message,
        salary_offer: values.salary_offer ?? null,
        start_date: values.start_date || null,
      });
      message.success('Санал илгээгдлээ');
      setOfferOpen(false);
      load();
    } catch (err) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Ачаалж байна…</div>;
  }
  if (!seeker) {
    return (
      <div className="p-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Буцах
        </Button>
        <p className="mt-4 text-muted-foreground">Ажил горилогч олдсонгүй.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/admin/data/job-seeker')}
        >
          Жагсаалт
        </Button>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
          <Button
            type="primary"
            icon={<MailOutlined />}
            onClick={() => {
              offerForm.resetFields();
              setOfferOpen(true);
            }}
          >
            Санал илгээх
          </Button>
        </Space>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <div className="rounded-xl border bg-card p-5 lg:col-span-1">
          <div className="flex items-center gap-4">
            <Avatar src={seeker.photo || undefined} size={64}>
              {(seeker.full_name || '?').slice(0, 1)}
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{seeker.full_name}</h2>
              <p className="text-sm text-muted-foreground">
                {seeker.desired_role || '—'}
              </p>
              <Tag color={seeker.is_available ? 'green' : 'default'}>
                {seeker.is_available ? 'Ажил хайж буй' : 'Идэвхгүй'}
              </Tag>
            </div>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Утас" value={seeker.phone} />
            <Row label="И-мэйл" value={seeker.email} />
            <Row label="Аймаг / хот" value={seeker.province} />
            <Row label="Байршил" value={seeker.location} />
            <Row
              label="Туршлага"
              value={
                seeker.experience_years
                  ? `${seeker.experience_years} жил`
                  : undefined
              }
            />
            <Row
              label="Боловсрол"
              value={
                seeker.education_level
                  ? EDUCATION_LABELS[seeker.education_level] ||
                    seeker.education_level
                  : undefined
              }
            />
            <Row
              label="Хүлээгдэж буй цалин"
              value={
                seeker.salary_expect
                  ? `${Number(seeker.salary_expect).toLocaleString()}₮`
                  : undefined
              }
            />
          </dl>

          {seeker.skills && seeker.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {seeker.skills.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          )}

          {seeker.about && (
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
              {seeker.about}
            </p>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4 lg:col-span-2">
          <Section title="Төгссөн сургууль">
            {seeker.schools && seeker.schools.length > 0 ? (
              <ul className="space-y-2">
                {seeker.schools.map((s) => (
                  <li key={s.id} className="rounded-lg border p-3">
                    <div className="font-medium">{s.school_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {[
                        s.major,
                        s.degree,
                        s.graduation_year
                          ? `Төгссөн: ${s.graduation_year}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty />
            )}
          </Section>

          <Section title="Гэр бүлийн байдал">
            {seeker.family && seeker.family.length > 0 ? (
              <ul className="space-y-2">
                {seeker.family.map((f) => (
                  <li key={f.id} className="rounded-lg border p-3">
                    <div className="font-medium">{f.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {[
                        f.relation
                          ? RELATION_LABELS[f.relation] || f.relation
                          : null,
                        f.job,
                        f.phone,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty />
            )}
          </Section>

          <Section title="Илгээсэн саналууд">
            {seeker.offers && seeker.offers.length > 0 ? (
              <ul className="space-y-2">
                {seeker.offers.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{o.job_title || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(o.createdAt)}
                        {o.salary_offer
                          ? ` · ${Number(o.salary_offer).toLocaleString()}₮`
                          : ''}
                      </div>
                    </div>
                    <Tag color={OFFER_STATUS_COLORS[o.status] || 'default'}>
                      {OFFER_STATUS_LABELS[o.status] || o.status}
                    </Tag>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="Санал илгээгээгүй байна" />
            )}
          </Section>

          <Section title="Ирсэн хүсэлтүүд">
            {seeker.applications && seeker.applications.length > 0 ? (
              <ul className="space-y-2">
                {seeker.applications.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{a.position || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(a.createdAt)}
                      </div>
                    </div>
                    <Tag
                      color={APPLICATION_STATUS_COLORS[a.status] || 'default'}
                    >
                      {APPLICATION_STATUS_LABELS[a.status] || a.status}
                    </Tag>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="Хүсэлт ирээгүй байна" />
            )}
          </Section>
        </div>
      </div>

      <Drawer
        title={`Санал илгээх — ${seeker.full_name}`}
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        width={440}
        extra={
          <Button type="primary" loading={saving} onClick={handleOffer}>
            Илгээх
          </Button>
        }
      >
        <Form form={offerForm} layout="vertical">
          <Form.Item
            name="job_title"
            label="Ажлын байр"
            rules={[{ required: true, message: 'Ажлын байр оруулна уу' }]}
          >
            <Input placeholder="Жишээ: Экскаваторчин" />
          </Form.Item>
          <Form.Item name="salary_offer" label="Санал болгох цалин (₮)">
            <InputNumber money className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="start_date" label="Эхлэх огноо">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="message" label="Захидал">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text = 'Бүртгэл алга' }: { text?: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
