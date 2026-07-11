'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  message,
  Upload,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { PlusOutlined, ReloadOutlined, UploadOutlined } from '@/components/admin/icons';
import RoadEntityPage from '@/components/admin/road/RoadEntityPage';
import { AlignmentSelect, ProjectSelect } from '@/components/admin/road/RoadSelectors';
import {
  createRoadRecord,
  downloadCsv,
  fetchRoadList,
  formatStation,
  importSurveyPoints,
} from '@/lib/roadEngineering';

type SurveyPoint = Record<string, unknown>;

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(/[,;\t]/);
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i]?.trim();
    });
    return {
      station: Number(row.station ?? row.chainage ?? row.st),
      offset: Number(row.offset ?? 0),
      northing: row.northing != null ? Number(row.northing) : row.y != null ? Number(row.y) : null,
      easting: row.easting != null ? Number(row.easting) : row.x != null ? Number(row.x) : null,
      elevation: row.elevation != null ? Number(row.elevation) : row.z != null ? Number(row.z) : null,
      point_code: row.point_code || row.code || null,
      description: row.description || row.desc || null,
    };
  });
}

export default function SurveyPage() {
  const [projectId, setProjectId] = useState<number>();
  const [alignmentId, setAlignmentId] = useState<number>();
  const [rows, setRows] = useState<SurveyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsOpen, setGpsOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    if (!alignmentId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      setRows(await fetchRoadList('survey-points', { alignment_id: alignmentId }));
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [alignmentId]);

  useEffect(() => {
    document.title = 'Хэмжилт / Survey';
    load();
  }, [load]);

  const columns: ColumnsType<SurveyPoint> = useMemo(
    () => [
      { title: 'Станц', dataIndex: 'station', render: (v) => formatStation(Number(v)) },
      { title: 'Offset', dataIndex: 'offset' },
      { title: 'Northing', dataIndex: 'northing' },
      { title: 'Easting', dataIndex: 'easting' },
      { title: 'Elevation', dataIndex: 'elevation' },
      { title: 'Код', dataIndex: 'point_code' },
      { title: 'Тайлбар', dataIndex: 'description', ellipsis: true },
    ],
    [],
  );

  const handleImportFile = async (file: File) => {
    if (!alignmentId) {
      message.warning('Эхлээд тэнхлэг сонгоно уу');
      return false;
    }
    const text = await file.text();
    const points = parseCsv(text);
    try {
      const result = await importSurveyPoints(alignmentId, points);
      message.success(
        `Оруулсан: ${result?.inserted ?? 0}, давхардсан: ${result?.duplicates ?? 0}, алдаатай: ${result?.invalid ?? 0}`,
      );
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Импорт амжилтгүй');
    }
    return false;
  };

  const saveGps = async () => {
    try {
      const v = await form.validateFields();
      if (!alignmentId) return message.warning('Тэнхлэг сонгоно уу');
      await createRoadRecord('survey-points', {
        alignment_id: alignmentId,
        station: Number(v.station),
        offset: Number(v.offset || 0),
        northing: Number(v.northing),
        easting: Number(v.easting),
        elevation: Number(v.elevation),
        point_code: v.point_code,
        description: v.description || 'GPS',
      });
      message.success('GPS цэг нэмэгдлээ');
      setGpsOpen(false);
      load();
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const mapPoints = rows.filter((r) => r.easting != null && r.northing != null);

  return (
    <Tabs
      items={[
        {
          key: 'browser',
          label: 'Цэгийн жагсаалт',
          children: (
            <div>
              <Space style={{ marginBottom: 16 }} wrap>
                <ProjectSelect value={projectId} onChange={(id) => { setProjectId(id); setAlignmentId(undefined); }} />
                <AlignmentSelect projectId={projectId} value={alignmentId} onChange={setAlignmentId} />
                <Button icon={<ReloadOutlined />} onClick={load}>
                  Шинэчлэх
                </Button>
                <Upload beforeUpload={handleImportFile} showUploadList={false} accept=".csv,.txt,.xlsx">
                  <Button icon={<UploadOutlined />}>CSV / Excel импорт</Button>
                </Upload>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setGpsOpen(true); }}>
                  GPS оруулах
                </Button>
                <Button onClick={() => downloadCsv('survey-points.csv', rows)}>Экспорт</Button>
              </Space>
              <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={{ pageSize: 20 }} scroll={{ x: true }} />
              <Modal title="GPS координат" open={gpsOpen} onCancel={() => setGpsOpen(false)} onOk={saveGps} okText="Хадгалах">
                <Form form={form} layout="vertical">
                  <Form.Item name="station" label="Станц" rules={[{ required: true }]}>
                    <Input type="number" />
                  </Form.Item>
                  <Form.Item name="easting" label="Easting (X)" rules={[{ required: true }]}>
                    <Input type="number" step="any" />
                  </Form.Item>
                  <Form.Item name="northing" label="Northing (Y)" rules={[{ required: true }]}>
                    <Input type="number" step="any" />
                  </Form.Item>
                  <Form.Item name="elevation" label="Elevation (Z)" rules={[{ required: true }]}>
                    <Input type="number" step="any" />
                  </Form.Item>
                  <Form.Item name="offset" label="Offset">
                    <Input type="number" step="any" />
                  </Form.Item>
                  <Form.Item name="point_code" label="Цэгийн код">
                    <Input />
                  </Form.Item>
                  <Form.Item name="description" label="Тайлбар">
                    <Input />
                  </Form.Item>
                </Form>
              </Modal>
            </div>
          ),
        },
        {
          key: 'map',
          label: 'Газрын зураг',
          children: (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="mb-3 text-sm text-muted-foreground">
                Easting / Northing цэгүүдийн схемийн харагдац ({mapPoints.length} цэг)
              </p>
              <svg viewBox="0 0 800 420" className="h-[420px] w-full rounded-lg bg-[#0b1220]">
                {(() => {
                  if (!mapPoints.length) {
                    return <text x="40" y="40" fill="#94a3b8">Цэг байхгүй</text>;
                  }
                  const xs = mapPoints.map((p) => Number(p.easting));
                  const ys = mapPoints.map((p) => Number(p.northing));
                  const minX = Math.min(...xs);
                  const maxX = Math.max(...xs);
                  const minY = Math.min(...ys);
                  const maxY = Math.max(...ys);
                  const sx = (x: number) => 40 + ((x - minX) / Math.max(1, maxX - minX)) * 720;
                  const sy = (y: number) => 380 - ((y - minY) / Math.max(1, maxY - minY)) * 340;
                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#21cda8"
                        strokeWidth="2"
                        points={mapPoints
                          .map((p) => `${sx(Number(p.easting))},${sy(Number(p.northing))}`)
                          .join(' ')}
                      />
                      {mapPoints.map((p, i) => (
                        <circle
                          key={String(p.id ?? i)}
                          cx={sx(Number(p.easting))}
                          cy={sy(Number(p.northing))}
                          r={3.5}
                          fill="#a855f7"
                        >
                          <title>
                            {formatStation(Number(p.station))} · Z={String(p.elevation)}
                          </title>
                        </circle>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          ),
        },
        {
          key: 'manual',
          label: 'Гараар нэмэх',
          children: alignmentId ? (
            <RoadEntityPage
              title="Хэмжилтийн цэг"
              resource="survey-points"
              query={{ alignment_id: alignmentId }}
              fields={[
                { key: 'alignment_id', label: 'Alignment ID', type: 'number', required: true },
                { key: 'station', label: 'Станц', type: 'number', required: true },
                { key: 'offset', label: 'Offset', type: 'number' },
                { key: 'northing', label: 'Northing', type: 'number' },
                { key: 'easting', label: 'Easting', type: 'number' },
                { key: 'elevation', label: 'Elevation', type: 'number' },
                { key: 'point_code', label: 'Код' },
                { key: 'description', label: 'Тайлбар' },
              ]}
              columns={columns}
            />
          ) : (
            <p className="text-muted-foreground">Тэнхлэг сонгоно уу</p>
          ),
        },
      ]}
    />
  );
}
