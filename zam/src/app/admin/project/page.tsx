'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Typography,
  Tag,
  Dropdown,
  message,
  Form,
  Input,
  InputNumber,
  Select,
  Drawer,
  Progress,
  DatePicker,
  Modal,
} from '@/components/admin/primitives';
import {
  PlusOutlined,
  EllipsisOutlined,
  CopyOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  EnvironmentOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@/components/admin/icons';
import StaffAvatarGroup, { buildMembersFromProject } from '@/components/StaffAvatarGroup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import {
  FIDIC_CONTRACT_TYPES,
  PROJECT_STAGES,
  PROJECT_STATUS_META,
  ROAD_CLASSES,
  CURRENCIES,
  archiveProject,
  contractTypeLabel,
  createProject,
  deleteProject,
  duplicateProject,
  fetchPortfolio,
  fetchProjects,
  formatBudget,
  formatKmRange,
  normalizeProjectStatus,
  stageLabel,
  updateProject,
  type PortfolioStats,
  type ProjectRecord,
} from '@/lib/project';

const { Title, Text } = Typography;
const { Option } = Select;

function statusTag(status: number) {
  const meta = PROJECT_STATUS_META[normalizeProjectStatus(status)];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

const DATE_KEYS = [
  'planned_start',
  'planned_end',
  'actual_start',
  'actual_end',
  'baseline_start',
  'baseline_end',
  'contract_date',
] as const;

function serializeDates(values: Record<string, unknown>) {
  const payload = { ...values };
  DATE_KEYS.forEach((k) => {
    const v = payload[k];
    payload[k] = v && dayjs.isDayjs(v) ? v.format('YYYY-MM-DD') : v || null;
  });
  return payload;
}

export default function ProjectPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioStats | null>(null);
  const [formDrawerVisible, setFormDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, port] = await Promise.all([
        fetchProjects({
          q: search.trim() || undefined,
          status: statusFilter,
          stage: stageFilter === 'all' ? undefined : stageFilter,
          contract_type: contractFilter === 'all' ? undefined : contractFilter,
        }),
        fetchPortfolio(),
      ]);
      setProjects(list);
      setPortfolio(port);
    } catch (err) {
      console.error(err);
      message.error('Төсөл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, stageFilter, contractFilter]);

  useEffect(() => {
    document.title = 'Төслүүд — FIDIC PM';
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const openAddDrawer = () => {
    setIsEditMode(false);
    setEditingProjectId(null);
    form.resetFields();
    form.setFieldsValue({
      status: 1,
      stage: 'mobilization',
      budget: 0,
      progress_percent: 0,
      progress_unit: '%',
      contract_type: 'Domestic',
      currency: 'MNT',
      retention_pct: 5,
      contingency_pct: 10,
    });
    setFormDrawerVisible(true);
  };

  const openEditDrawer = (project: ProjectRecord) => {
    setIsEditMode(true);
    setEditingProjectId(project.id ?? null);
    const dates: Record<string, unknown> = {};
    DATE_KEYS.forEach((k) => {
      dates[k] = project[k] ? dayjs(project[k] as string) : null;
    });
    form.setFieldsValue({
      ...project,
      ...dates,
      status: normalizeProjectStatus(project.status),
      employer_name: project.employer_name || project.client_name,
    });
    setFormDrawerVisible(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = serializeDates(values) as Partial<ProjectRecord>;
      if (payload.employer_name && !payload.client_name) {
        payload.client_name = payload.employer_name;
      }
      if (isEditMode && editingProjectId) {
        await updateProject(editingProjectId, payload);
        message.success('Төсөл шинэчлэгдлээ');
      } else {
        await createProject({ ...payload, seed_phases: true } as ProjectRecord & {
          seed_phases?: boolean;
        });
        message.success('Төсөл нэмэгдлээ (7 үе шат үүслээ)');
      }
      setFormDrawerVisible(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) {
        message.error('Формийн утга буруу байна.');
        return;
      }
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const runAction = async (key: string, project: ProjectRecord) => {
    if (!project.id) return;
    if (key === 'view') {
      router.push(`/admin/project/${project.id}`);
      return;
    }
    if (key === 'edit') {
      openEditDrawer(project);
      return;
    }
    try {
      if (key === 'duplicate') {
        await duplicateProject(project.id);
        message.success('Хуулбар үүслээ');
        load();
        return;
      }
      if (key === 'archive') {
        await archiveProject(project.id);
        message.success('Архивлагдлаа');
        load();
        return;
      }
      if (key === 'delete') {
        Modal.confirm({
          title: `"${project.name}" устгах уу?`,
          content: 'Энэ үйлдлийг буцаах боломжгүй.',
          okType: 'danger',
          onOk: async () => {
            await deleteProject(project.id!);
            message.success('Устгагдлаа');
            load();
          },
        });
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const cards = portfolio?.cards;
  const chips = [
    { key: 'all', label: 'Бүгд', value: cards?.total ?? 0 },
    { key: '2', label: 'Явагдаж буй', value: cards?.active ?? 0 },
    { key: '1', label: 'Төлөвлөсөн', value: cards?.planned ?? 0 },
    { key: '3', label: 'Дууссан', value: cards?.done ?? 0 },
    { key: '4', label: 'Архив', value: cards?.archived ?? 0 },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <Title level={4} className="!mb-1">
              Төслийн багц / Portfolio
            </Title>
            <Text type="secondary">
              Зам барилга — FIDIC гэрээ, км хэсэг, үе шат, earned value, эрсдэл
            </Text>
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setStatusFilter(chip.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition',
                  statusFilter === chip.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80',
                )}
              >
                <span className="opacity-80">{chip.label}</span>
                <span className="tabular-nums font-semibold">{chip.value}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button icon={<ReloadOutlined />} onClick={load}>
            Шинэчлэх
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
            Шинэ төсөл
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Явагдаж буй', value: cards?.active ?? 0 },
          { label: 'Хоцорсон', value: cards?.delayed ?? 0, warn: true },
          { label: 'Өндөр эрсдэл', value: cards?.at_risk ?? 0, warn: true },
          { label: 'Нийт төсөв', value: formatBudget(cards?.total_budget) },
          { label: 'Дундаж ахиц', value: `${cards?.avg_progress ?? 0}%` },
        ].map((c) => (
          <Card key={c.label} className="dark:border-[color:var(--neon-border)]">
            <CardHeader className="pb-1 pt-3">
              <CardTitle className="text-xs text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  'text-lg font-bold',
                  c.warn && Number(c.value) > 0 ? 'text-amber-600' : 'text-foreground',
                )}
              >
                {c.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <SearchOutlined className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Код, нэр, захиалагч, гэрээ, аймаг..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>
        <Select
          style={{ minWidth: 180 }}
          value={stageFilter}
          onChange={setStageFilter}
          options={[{ value: 'all', label: 'Бүх үе шат' }, ...PROJECT_STAGES]}
        />
        <Select
          style={{ minWidth: 200 }}
          value={contractFilter}
          onChange={setContractFilter}
          options={[{ value: 'all', label: 'Бүх гэрээ' }, ...FIDIC_CONTRACT_TYPES]}
        />
      </div>

      {loading && projects.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">Ачааллаж байна...</div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <Text type="secondary" className="mb-4 block">
            Төсөл олдсонгүй
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
            Эхний төсөл нэмэх
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {projects.map((project) => {
            const percent = Number(project.effective_progress ?? project.progress_percent ?? 0);
            const progressColor =
              percent >= 80 ? '#22c55e' : percent >= 40 ? '#f59e0b' : '#38bdf8';
            const members = buildMembersFromProject(project);
            const status = normalizeProjectStatus(project.status);
            const meta = PROJECT_STATUS_META[status];
            const km = formatKmRange(project.km_from, project.km_to);
            const spi = project.earned_value?.SPI;

            return (
              <article
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/admin/project/${project.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/admin/project/${project.id}`);
                  }
                }}
                className={cn(
                  'group flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 shadow-sm',
                  'transition-all duration-200 hover:border-primary/40 hover:shadow-md',
                  status === 4 && 'opacity-70',
                  project.delayed && 'border-amber-500/40',
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={cn('size-1.5 rounded-full', meta.dot)} />
                      {statusTag(status)}
                      {project.code ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                          {project.code}
                        </span>
                      ) : null}
                      {project.delayed ? <Tag color="orange">Хоцорсон</Tag> : null}
                      {project.at_risk ? <Tag color="red">Эрсдэл</Tag> : null}
                    </div>
                    <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary">
                      {project.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <EnvironmentOutlined className="size-3.5 shrink-0 opacity-70" />
                      <span className="truncate">
                        {[project.road_name, project.province || project.location, km]
                          .filter(Boolean)
                          .join(' · ') || 'Байршил тодорхойгүй'}
                      </span>
                    </p>
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'view', label: 'Дэлгэрэнгүй', onClick: () => runAction('view', project) },
                        {
                          key: 'edit',
                          label: 'Засах',
                          icon: <EditOutlined className="size-3.5" />,
                          onClick: () => runAction('edit', project),
                        },
                        {
                          key: 'duplicate',
                          label: 'Хувилах',
                          icon: <CopyOutlined className="size-3.5" />,
                          onClick: () => runAction('duplicate', project),
                        },
                        {
                          key: 'archive',
                          label: 'Архивлах',
                          icon: <InboxOutlined className="size-3.5" />,
                          onClick: () => runAction('archive', project),
                        },
                        {
                          key: 'delete',
                          label: 'Устгах',
                          icon: <DeleteOutlined className="size-3.5" />,
                          danger: true,
                          onClick: () => runAction('delete', project),
                        },
                      ],
                    }}
                  >
                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EllipsisOutlined className="size-4" />
                    </button>
                  </Dropdown>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                    {stageLabel(project.stage).split(' / ')[0]}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                    {contractTypeLabel(project.contract_type).replace('FIDIC ', '')}
                  </span>
                  {project.road_class ? (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                      Анги {project.road_class}
                    </span>
                  ) : null}
                  {spi != null ? (
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 font-medium',
                        spi >= 1 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700',
                      )}
                    >
                      SPI {spi.toFixed(2)}
                    </span>
                  ) : null}
                </div>

                {(project.employer_name || project.client_name || project.engineer) && (
                  <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                    {(project.employer_name || project.client_name) && (
                      <p>
                        <span className="opacity-70">Захиалагч: </span>
                        <span className="text-foreground/90">
                          {project.employer_name || project.client_name}
                        </span>
                      </p>
                    )}
                    {project.engineer ? (
                      <p className="flex items-center gap-1">
                        <UserOutlined className="size-3 opacity-70" />
                        {project.engineer}
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="mb-4 flex items-center gap-4 rounded-xl bg-muted/40 px-3 py-3">
                  <Progress
                    type="circle"
                    percent={percent}
                    size={56}
                    strokeWidth={7}
                    strokeColor={progressColor}
                    trailColor="color-mix(in oklab, var(--muted-foreground) 25%, transparent)"
                    format={(p) => (
                      <span className="text-xs font-semibold tabular-nums text-foreground">{p}%</span>
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Физик ахиц
                    </p>
                    {(project.planned_start || project.planned_end) && (
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {project.planned_start || '—'} → {project.planned_end || '—'}
                      </p>
                    )}
                    {project.finance?.spent != null ? (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Зарцуулсан {formatBudget(project.finance.spent)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/70 pt-4">
                  <div>
                    <p className="mb-1.5 text-[11px] text-muted-foreground">Баг</p>
                    <StaffAvatarGroup members={members} maxCount={4} size={28} showEmpty />
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 text-[11px] text-muted-foreground">Төсөв</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatBudget(Number(project.budget))}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Drawer
        title={isEditMode ? 'Төслийг засах' : 'Шинэ төсөл нэмэх'}
        width={640}
        onClose={() => setFormDrawerVisible(false)}
        open={formDrawerVisible}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setFormDrawerVisible(false)}>Болих</Button>
            <Button onClick={handleFormSubmit} type="primary">
              {isEditMode ? 'Хадгалах' : 'Нэмэх'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" className="space-y-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            1. Үндсэн
          </p>
          <Form.Item label="Нэр" name="name" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
            <Input placeholder="Жишээ: УБ — Дархан авто зам" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Код" name="code">
              <Input placeholder="Авто (PRJ-YYYY-###)" />
            </Form.Item>
            <Form.Item label="Төлөв" name="status" rules={[{ required: true }]}>
              <Select>
                <Option value={1}>Төлөвлөсөн</Option>
                <Option value={2}>Явагдаж буй</Option>
                <Option value={3}>Дууссан</Option>
                <Option value={4}>Архив</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="Үе шат" name="stage">
            <Select options={[...PROJECT_STAGES]} />
          </Form.Item>
          <Form.Item label="Зорилго" name="purpose">
            <Input.TextArea rows={2} />
          </Form.Item>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            2. Байршил / chainage
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Замын нэр" name="road_name">
              <Input placeholder="УБ–Дархан" />
            </Form.Item>
            <Form.Item label="Анги" name="road_class">
              <Select allowClear options={[...ROAD_CLASSES]} />
            </Form.Item>
            <Form.Item label="Аймаг / бүс" name="province">
              <Input />
            </Form.Item>
            <Form.Item label="Сум / байршил" name="aimag_soum">
              <Input />
            </Form.Item>
            <Form.Item label="Байршил" name="location">
              <Input />
            </Form.Item>
            <Form.Item label="Урт (км)" name="length_km">
              <InputNumber className="w-full" step={0.1} />
            </Form.Item>
            <Form.Item label="Эхлэх км" name="km_from">
              <InputNumber className="w-full" step={0.1} />
            </Form.Item>
            <Form.Item label="Дуусах км" name="km_to">
              <InputNumber className="w-full" step={0.1} />
            </Form.Item>
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            3. Гэрээ
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Гэрээний дугаар" name="contract_number">
              <Input />
            </Form.Item>
            <Form.Item label="Хэлбэр" name="contract_type">
              <Select options={[...FIDIC_CONTRACT_TYPES]} />
            </Form.Item>
            <Form.Item label="Гэрээний огноо" name="contract_date">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Валют" name="currency">
              <Select options={[...CURRENCIES]} />
            </Form.Item>
            <Form.Item label="Төсөв" name="budget" rules={[{ required: true, type: 'number', min: 0 }]}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label="Хадгалалт %" name="retention_pct">
              <InputNumber className="w-full" min={0} max={100} />
            </Form.Item>
            <Form.Item label="Санхүүжилт" name="funding_source" className="col-span-2">
              <Input />
            </Form.Item>
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            4. Талууд
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Захиалагч / Employer" name="employer_name">
              <Input />
            </Form.Item>
            <Form.Item label="Гүйцэтгэгч" name="contractor_name">
              <Input />
            </Form.Item>
            <Form.Item label="Инженер (байгууллага)" name="engineer_org">
              <Input />
            </Form.Item>
            <Form.Item label="Хариуцсан инженер" name="engineer">
              <Input />
            </Form.Item>
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            5. Хуваарь / ахиц
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Төлөвлөсөн эхлэл" name="planned_start">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Төлөвлөсөн төгсгөл" name="planned_end">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Baseline эхлэл" name="baseline_start">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Baseline төгсгөл" name="baseline_end">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="Гүйцэтгэл %" name="progress_percent">
              <InputNumber className="w-full" min={0} max={100} />
            </Form.Item>
            <Form.Item label="Улирлын тэмдэглэл" name="season_note">
              <Input placeholder="5–10 сар" />
            </Form.Item>
          </div>
          <Form.Item label="Тэмдэглэл" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
