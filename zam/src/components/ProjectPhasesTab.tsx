'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { EventInput } from '@fullcalendar/core';
import {
  Button,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Progress,
  Row,
  Slider,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import StyledFullCalendar from '@/components/StyledFullCalendar';

const { Title, Text } = Typography;
const baseUrl = process.env.NEXT_PUBLIC_API_URL;

export interface ProjectPhase {
  id: number;
  project_id: number;
  name: string;
  start_date: string;
  end_date: string;
  completion_percent: number;
  color?: string;
  sort_order?: number;
}

interface ProjectPhasesTabProps {
  projectId: string;
  initialPhases?: ProjectPhase[];
  onPhasesChange?: () => void;
}

function addExclusiveEnd(endDate: string): string {
  return dayjs(endDate).add(1, 'day').format('YYYY-MM-DD');
}

export default function ProjectPhasesTab({
  projectId,
  initialPhases = [],
  onPhasesChange,
}: ProjectPhasesTabProps) {
  const [phases, setPhases] = useState<ProjectPhase[]>(initialPhases);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchPhases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/project_phase?project_id=${projectId}`);
      const result = await res.json();
      if (result.success) {
        setPhases(result.data);
      }
    } catch {
      message.error('Үе шатууд ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  useEffect(() => {
    if (initialPhases && initialPhases.length > 0) {
      setPhases(initialPhases);
    }
  }, [initialPhases]);

  const phaseLegend = useMemo(
    () => phases.map((p) => ({ label: p.name, color: p.color || '#1890ff' })),
    [phases]
  );

  const calendarEvents: EventInput[] = useMemo(
    () =>
      phases.map((phase) => ({
        id: String(phase.id),
        title: `${phase.name} · ${phase.completion_percent}%`,
        start: phase.start_date,
        end: addExclusiveEnd(phase.end_date),
        backgroundColor: phase.color || '#1890ff',
        borderColor: phase.color || '#1890ff',
        textColor: '#fff',
        display: 'block',
        classNames: ['project-phase-event'],
        extendedProps: phase,
      })),
    [phases]
  );

  const openAddDrawer = () => {
    setEditingPhase(null);
    form.resetFields();
    form.setFieldsValue({ completion_percent: 0 });
    setDrawerOpen(true);
  };

  const openEditDrawer = (phase: ProjectPhase) => {
    setEditingPhase(phase);
    form.setFieldsValue({
      name: phase.name,
      dates: [dayjs(phase.start_date), dayjs(phase.end_date)],
      completion_percent: phase.completion_percent,
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const [start, end] = values.dates as [Dayjs, Dayjs];
      const payload = {
        project_id: Number(projectId),
        name: values.name,
        start_date: start.format('YYYY-MM-DD'),
        end_date: end.format('YYYY-MM-DD'),
        completion_percent: values.completion_percent ?? 0,
      };

      setSaving(true);
      const url = editingPhase
        ? `${baseUrl}/api/project_phase/${editingPhase.id}`
        : `${baseUrl}/api/project_phase`;
      const method = editingPhase ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        message.success(editingPhase ? 'Үе шат шинэчлэгдлээ' : 'Үе шат нэмэгдлээ');
        setDrawerOpen(false);
        form.resetFields();
        fetchPhases();
        onPhasesChange?.();
      } else {
        message.error(result.message || 'Алдаа гарлаа');
      }
    } catch {
      message.error('Форм бөглөнө үү');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${baseUrl}/api/project_phase/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        message.success('Үе шат устгагдлаа');
        fetchPhases();
        onPhasesChange?.();
      } else {
        message.error('Устгахад алдаа гарлаа');
      }
    } catch {
      message.error('Устгахад алдаа гарлаа');
    }
  };

  const avgCompletion =
    phases.length > 0
      ? Math.round(phases.reduce((s, p) => s + p.completion_percent, 0) / phases.length)
      : 0;

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>
            Зам барилгын үе шатууд
          </Title>
          <Text type="secondary">
            {phases.length} үе шат · Дундаж гүйцэтгэл {avgCompletion}%
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
          Үе шат нэмэх
        </Button>
      </div>

      {phases.length > 0 && (
        <>
          <StyledFullCalendar
            events={calendarEvents}
            title="Календарь"
            subtitle="Үе шатууд өнгөт шугамаар — дарж засварлана"
            legend={phaseLegend}
            onEventClick={(info) => {
              const phase = info.event.extendedProps as ProjectPhase;
              if (phase?.id) openEditDrawer(phase);
            }}
          />

          <GanttTimeline phases={phases} />
        </>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: phases.length > 0 ? 24 : 0 }}>
        {phases.length === 0 ? (
          <Col span={24}>
            <div
              style={{
                border: '1px dashed #d9d9d9',
                borderRadius: 12,
                padding: 48,
                textAlign: 'center',
              }}
            >
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                Үе шат бүртгэгдээгүй байна. Нэг нэгээр нь нэмнэ үү.
              </Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={openAddDrawer}>
                Эхний үе шат нэмэх
              </Button>
            </div>
          </Col>
        ) : (
          phases.map((phase) => (
            <Col xs={24} md={12} key={phase.id}>
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 16,
                  borderLeft: `4px solid ${phase.color || '#1890ff'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Space wrap style={{ marginBottom: 8 }}>
                      <Tag color={phase.color}>{phase.name}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(phase.start_date).format('YYYY-MM-DD')} — {dayjs(phase.end_date).format('YYYY-MM-DD')}
                      </Text>
                    </Space>
                    <Progress
                      percent={phase.completion_percent}
                      strokeColor={phase.color}
                      size="small"
                    />
                  </div>
                  <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => openEditDrawer(phase)} />
                    <Popconfirm title="Устгах уу?" onConfirm={() => handleDelete(phase.id)}>
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            </Col>
          ))
        )}
      </Row>

      <Drawer
        title={editingPhase ? 'Үе шат засах' : 'Шинэ үе шат нэмэх'}
        width={440}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)} style={{ marginRight: 8 }}>
              Болих
            </Button>
            <Button type="primary" onClick={handleSave} loading={saving}>
              Хадгалах
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Үе шатын нэр"
            name="name"
            rules={[{ required: true, message: 'Нэр оруулна уу' }]}
          >
            <Input placeholder="Жишээ: Хөөх ажил" />
          </Form.Item>
          <Form.Item
            label="Эхлэх — Дуусах огноо"
            name="dates"
            rules={[{ required: true, message: 'Огноо сонгоно уу' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="Гүйцэтгэл (%)" name="completion_percent" initialValue={0}>
            <Slider min={0} max={100} marks={{ 0: '0%', 50: '50%', 100: '100%' }} />
          </Form.Item>
        </Form>
      </Drawer>
    </Spin>
  );
}

function GanttTimeline({ phases }: { phases: ProjectPhase[] }) {
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (phases.length === 0) {
      return { minDate: dayjs(), maxDate: dayjs(), totalDays: 1 };
    }
    let min = dayjs(phases[0].start_date);
    let max = dayjs(phases[0].end_date);
    phases.forEach((p) => {
      const s = dayjs(p.start_date);
      const e = dayjs(p.end_date);
      if (s.isBefore(min)) min = s;
      if (e.isAfter(max)) max = e;
    });
    const days = Math.max(1, max.diff(min, 'day') + 1);
    return { minDate: min, maxDate: max, totalDays: days };
  }, [phases]);

  return (
    <div className="styled-gantt-shell" style={{ marginTop: 24 }}>
      <div className="gantt-title">
        Хугацааны шугам · {minDate.format('YYYY-MM-DD')} → {maxDate.format('YYYY-MM-DD')}
      </div>
      {phases.map((phase) => {
        const startOffset = dayjs(phase.start_date).diff(minDate, 'day');
        const duration = dayjs(phase.end_date).diff(dayjs(phase.start_date), 'day') + 1;
        const leftPct = (startOffset / totalDays) * 100;
        const widthPct = Math.max((duration / totalDays) * 100, 3);
        const color = phase.color || '#1890ff';

        return (
          <div key={phase.id} className="styled-gantt-row">
            <div className="styled-gantt-label" title={phase.name}>
              {phase.name}
            </div>
            <div className="styled-gantt-track">
              <div
                className="styled-gantt-bar"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                }}
              >
                {phase.completion_percent}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
