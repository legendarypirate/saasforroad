'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Select,
  Space,
  Table,
  message,
  Modal,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  DeleteOutlined,
  PlusOutlined,
  RedoOutlined,
  ReloadOutlined,
  UndoOutlined,
} from '@/components/admin/icons';
import ProfileChart, { type ProfileStructureMark } from '@/components/admin/road/ProfileChart';
import { AlignmentSelect, ProjectSelect } from '@/components/admin/road/RoadSelectors';
import {
  createRoadRecord,
  deleteRoadRecord,
  fetchProfileChart,
  fetchRoadList,
  formatStation,
  recalculateVertical,
  updateRoadRecord,
  type Alignment,
  type ProfileSeriesPoint,
  type VerticalAlignment,
  type VerticalPi,
} from '@/lib/roadEngineering';

export default function VerticalAlignmentPage() {
  const [projectId, setProjectId] = useState<number>();
  const [alignmentId, setAlignmentId] = useState<number>();
  const [alignmentName, setAlignmentName] = useState('Alignment');
  const [vas, setVas] = useState<VerticalAlignment[]>([]);
  const [vaId, setVaId] = useState<number>();
  const [pis, setPis] = useState<VerticalPi[]>([]);
  const [series, setSeries] = useState<ProfileSeriesPoint[]>([]);
  const [structures, setStructures] = useState<ProfileStructureMark[]>([]);
  const [selectedPi, setSelectedPi] = useState<VerticalPi | null>(null);
  const [history, setHistory] = useState<VerticalPi[][]>([]);
  const [future, setFuture] = useState<VerticalPi[][]>([]);
  const [propForm] = Form.useForm();
  const [vaForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const loadVas = useCallback(async (preferredId?: number) => {
    if (!alignmentId) {
      setVas([]);
      if (!preferredId) setVaId(undefined);
      return;
    }
    const list = await fetchRoadList<VerticalAlignment>('vertical-alignments', {
      alignment_id: alignmentId,
    });
    setVas(list);
    setVaId((current) => {
      if (preferredId && list.some((v) => v.id === preferredId)) return preferredId;
      if (current && list.some((v) => v.id === current)) return current;
      return list[0]?.id;
    });
  }, [alignmentId]);

  const loadChart = useCallback(async () => {
    if (!vaId) {
      setPis([]);
      setSeries([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchProfileChart(vaId);
      setPis(data?.pis ?? []);
      setSeries(data?.series ?? []);
      if (data?.pis?.length) setSelectedPi(data.pis[0]);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Профиль ачааллахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [vaId]);

  // Auto-select first project with a vertical alignment so seed data shows immediately
  useEffect(() => {
    document.title = 'Босоо тэнхлэг';
    let cancelled = false;
    (async () => {
      try {
        const allVas = await fetchRoadList<VerticalAlignment & { alignment?: { id: number; project_id: number } }>(
          'vertical-alignments',
        );
        if (cancelled || !allVas.length) {
          setBootstrapped(true);
          return;
        }
        const first = allVas[0];
        const alId = first.alignment_id || first.alignment?.id;
        const projId = first.alignment?.project_id;
        if (projId) setProjectId(projId);
        if (alId) {
          setAlignmentId(alId);
          if (first.alignment?.name) setAlignmentName(first.alignment.name);
          else {
            const als = await fetchRoadList<Alignment>('alignments', { project_id: projId });
            const match = als.find((a) => a.id === alId);
            if (match) setAlignmentName(match.name);
          }
        }
        if (projId) {
          const structs = await fetchRoadList<Record<string, unknown>>('structures', {
            project_id: projId,
          });
          setStructures(
            structs
              .filter((s) => s.station != null)
              .map((s) => ({
                station: Number(s.station),
                label:
                  s.type === 'bridge'
                    ? `@гүүр`
                    : s.type === 'box_culvert'
                      ? `@1.5x2`
                      : s.type === 'underpass'
                        ? `@1.0`
                        : `@${String(s.type || 'байг').slice(0, 6)}`,
              })),
          );
        }
        setVas(allVas.filter((v) => v.alignment_id === alId));
        setVaId(first.id);
      } catch {
        // ignore — user can pick manually
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bootstrapped || !alignmentId) return;
    loadVas().catch(() => undefined);
  }, [bootstrapped, alignmentId, loadVas]);

  useEffect(() => {
    if (!bootstrapped) return;
    loadChart();
  }, [bootstrapped, loadChart]);

  useEffect(() => {
    if (selectedPi) {
      propForm.setFieldsValue(selectedPi);
    } else {
      propForm.resetFields();
    }
  }, [selectedPi, propForm]);

  const pushHistory = (next: VerticalPi[]) => {
    setHistory((h) => [...h, pis]);
    setFuture([]);
    setPis(next);
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture((f) => [pis, ...f]);
    setHistory((h) => h.slice(0, -1));
    setPis(prev);
  };

  const redo = () => {
    if (!future.length) return;
    const [next, ...rest] = future;
    setHistory((h) => [...h, pis]);
    setFuture(rest);
    setPis(next);
  };

  const savePi = async () => {
    try {
      const values = await propForm.validateFields();
      const body = {
        vertical_alignment_id: vaId,
        station: Number(values.station),
        elevation: Number(values.elevation),
        curve_type: values.curve_type || 'parabola',
        curve_length: Number(values.curve_length || 0),
        curve_radius: values.curve_radius != null ? Number(values.curve_radius) : null,
        grade_in: values.grade_in != null ? Number(values.grade_in) : null,
        grade_out: values.grade_out != null ? Number(values.grade_out) : null,
      };
      if (selectedPi?.id) {
        const updated = await updateRoadRecord<VerticalPi>('vertical-pis', selectedPi.id, body);
        pushHistory(pis.map((p) => (p.id === selectedPi.id ? (updated as VerticalPi) : p)));
      } else {
        const created = await createRoadRecord<VerticalPi>('vertical-pis', body);
        pushHistory([...pis, created as VerticalPi].sort((a, b) => Number(a.station) - Number(b.station)));
      }
      message.success('PI хадгалагдлаа');
      await recalculateVertical(vaId!, 25);
      await loadChart();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const deleteSelected = () => {
    if (!selectedPi?.id) return;
    Modal.confirm({
      title: 'PI устгах уу?',
      onOk: async () => {
        await deleteRoadRecord('vertical-pis', selectedPi.id);
        pushHistory(pis.filter((p) => p.id !== selectedPi.id));
        setSelectedPi(null);
        await recalculateVertical(vaId!, 25);
        await loadChart();
      },
    });
  };

  const createVa = async () => {
    try {
      const v = await vaForm.validateFields();
      if (!alignmentId) return message.warning('Тэнхлэг сонгоно уу');
      const created = await createRoadRecord<VerticalAlignment>('vertical-alignments', {
        alignment_id: alignmentId,
        name: v.name,
        design_speed: Number(v.design_speed || 80),
        min_grade: Number(v.min_grade || -0.05),
        max_grade: Number(v.max_grade || 0.05),
      });
      message.success('Босоо тэнхлэг үүслээ');
      await loadVas();
      setVaId(created?.id);
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const columns: ColumnsType<VerticalPi> = [
    { title: 'Станц', dataIndex: 'station', render: (v) => formatStation(Number(v)) },
    { title: 'Өндөр', dataIndex: 'elevation', render: (v) => Number(v).toFixed(3) },
    { title: 'Curve L', dataIndex: 'curve_length' },
    { title: 'Radius', dataIndex: 'curve_radius' },
    {
      title: 'Grade In',
      dataIndex: 'grade_in',
      render: (v) => (v == null ? '—' : `${(Number(v) * 100).toFixed(2)}%`),
    },
    {
      title: 'Grade Out',
      dataIndex: 'grade_out',
      render: (v) => (v == null ? '—' : `${(Number(v) * 100).toFixed(2)}%`),
    },
  ];

  const selectedVa = useMemo(() => vas.find((v) => v.id === vaId), [vas, vaId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-2">
          <h2 className="text-lg font-semibold">Дагуу огтлол / Босоо тэнхлэг</h2>
          <p className="text-xs text-muted-foreground">
            Газар · хэмжилт · төлөвлөсөн өндөржилт · ухмал/далан
          </p>
        </div>
        <ProjectSelect
          value={projectId}
          onChange={(id) => {
            setProjectId(id);
            setAlignmentId(undefined);
            setSeries([]);
          }}
        />
        <AlignmentSelect
          projectId={projectId}
          value={alignmentId}
          onChange={(id) => {
            setAlignmentId(id);
            if (id) {
              fetchRoadList<Alignment>('alignments', { project_id: projectId }).then((als) => {
                const match = als.find((a) => a.id === id);
                if (match) setAlignmentName(match.name);
              });
            }
          }}
        />
        <Select
          style={{ minWidth: 200 }}
          placeholder="VA сонгох"
          value={vaId}
          onChange={(v) => setVaId(Number(v))}
          options={vas.map((v) => ({ value: v.id, label: v.name }))}
        />
        <Button icon={<UndoOutlined />} onClick={undo} disabled={!history.length}>
          Undo
        </Button>
        <Button icon={<RedoOutlined />} onClick={redo} disabled={!future.length}>
          Redo
        </Button>
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={async () => {
            if (!vaId) return;
            await recalculateVertical(vaId, 25);
            message.success('Дахин тооцооллоо');
            loadChart();
          }}
        >
          Recalculate
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedPi(null);
            propForm.resetFields();
            propForm.setFieldsValue({
              vertical_alignment_id: vaId,
              curve_type: 'parabola',
              curve_length: 100,
            });
          }}
        >
          New PI
        </Button>
        <Button danger icon={<DeleteOutlined />} disabled={!selectedPi} onClick={deleteSelected}>
          Delete PI
        </Button>
      </div>

      {!series.length && bootstrapped && !loading && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Профиль хараахан ачаалагдаагүй. Төсөл/тэнхлэг сонгоод <b>Recalculate</b> дарна уу.
        </div>
      )}

      <ProfileChart
        series={series}
        title={selectedVa?.name || 'Дагуу огтлол'}
        alignmentName={alignmentName}
        structures={structures}
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="mb-2 text-sm font-semibold">PI жагсаалт</p>
          <Table
            size="small"
            rowKey="id"
            dataSource={pis}
            columns={columns}
            pagination={false}
            scroll={{ y: 320 }}
            onRow={(row) => ({
              onClick: () => setSelectedPi(row),
              className: selectedPi?.id === row.id ? 'bg-muted/60' : undefined,
            })}
          />
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="mb-2 text-sm font-semibold">Шинэ VA</p>
            <Form form={vaForm} layout="vertical" size="small">
              <Form.Item name="name" label="Нэр" rules={[{ required: true }]}>
                <Input placeholder="VA-Main" />
              </Form.Item>
              <Form.Item name="design_speed" label="Хурд (км/ц)">
                <Input type="number" />
              </Form.Item>
              <Button type="primary" block onClick={createVa}>
                Үүсгэх
              </Button>
            </Form>
          </div>

          <div className="rounded-xl border border-border bg-card p-3">
            <p className="mb-2 text-sm font-semibold">
              Properties {selectedVa ? `· ${selectedVa.name}` : ''}
            </p>
            {!!series.length && (
              <p className="mb-2 text-xs text-muted-foreground">
                {pis.length} PI · {series.length} профиль цэг
              </p>
            )}
            <Form form={propForm} layout="vertical" size="small">
              <Form.Item name="station" label="Station" rules={[{ required: true }]}>
                <Input type="number" step="any" />
              </Form.Item>
              <Form.Item name="elevation" label="Elevation" rules={[{ required: true }]}>
                <Input type="number" step="any" />
              </Form.Item>
              <Form.Item name="curve_length" label="Curve Length">
                <Input type="number" step="any" />
              </Form.Item>
              <Form.Item name="curve_radius" label="Curve Radius">
                <Input type="number" step="any" />
              </Form.Item>
              <Form.Item name="curve_type" label="Curve Type">
                <Select
                  options={[
                    { value: 'parabola', label: 'Parabola' },
                    { value: 'circular', label: 'Circular' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="grade_in" label="Grade In (decimal)">
                <Input type="number" step="any" />
              </Form.Item>
              <Form.Item name="grade_out" label="Grade Out (decimal)">
                <Input type="number" step="any" />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={savePi} disabled={!vaId}>
                  Хадгалах
                </Button>
                <Button onClick={loadChart}>Preview</Button>
              </Space>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
