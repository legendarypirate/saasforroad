'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
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
      <style>{`
        .project-phase-event {
          min-height: 28px !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          border-radius: 6px !important;
          padding: 4px 8px !important;
          margin-bottom: 2px !important;
        }
        .phases-calendar-wrap .fc-daygrid-event {
          white-space: normal;
        }
        .phase-gantt-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .phase-gantt-label {
          width: 140px;
          flex-shrink: 0;
          font-size: 13px;
          font-weight: 600;
        }
        .phase-gantt-track {
          flex: 1;
          height: 32px;
          background: #f1f5f9;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }
        .phase-gantt-bar {
          position: absolute;
          top: 4px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          padding: 0 10px;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          min-width: 4%;
        }
      `}</style>

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
          <div
            className="phases-calendar-wrap"
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              background: '#fff',
            }}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              Календарь — үе шатууд өнгөт шугамаар
            </Text>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height="auto"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek',
              }}
              events={calendarEvents}
              eventDisplay="block"
              dayMaxEvents={false}
              moreLinkClick="popover"
              eventClick={(info) => {
                const phase = info.event.extendedProps as ProjectPhase;
                if (phase?.id) openEditDrawer(phase);
              }}
            />
          </div>

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
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 20,
        background: '#fafbfc',
      }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Хугацааны шугам — {minDate.format('YYYY-MM-DD')} → {maxDate.format('YYYY-MM-DD')}
      </Text>
      {phases.map((phase) => {
        const startOffset = dayjs(phase.start_date).diff(minDate, 'day');
        const duration = dayjs(phase.end_date).diff(dayjs(phase.start_date), 'day') + 1;
        const leftPct = (startOffset / totalDays) * 100;
        const widthPct = Math.max((duration / totalDays) * 100, 3);

        return (
          <div key={phase.id} className="phase-gantt-row">
            <div className="phase-gantt-label" title={phase.name}>
              {phase.name}
            </div>
            <div className="phase-gantt-track">
              <div
                className="phase-gantt-bar"
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  background: phase.color || '#1890ff',
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
