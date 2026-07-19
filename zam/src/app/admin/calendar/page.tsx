'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { EventClickArg, EventInput } from '@fullcalendar/core';
import { Card, Modal, Spin, Tag, Typography } from '@/components/admin/primitives';
import { CalendarOutlined } from '@/components/admin/icons';
import StyledFullCalendar, {
  taskPriorityClass,
  taskPriorityColor,
} from '@/components/StyledFullCalendar';

const { Text } = Typography;
const baseUrl = process.env.NEXT_PUBLIC_API_URL;

const PRIORITY_LEGEND = [
  { label: 'Яаралтай', color: '#ef4444' },
  { label: 'Өндөр', color: '#f97316' },
  { label: 'Дунд', color: '#3b82f6' },
  { label: 'Бага', color: '#22c55e' },
];

const CalendarPage = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventClickArg['event'] | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${baseUrl}/api/task`);
        const json = await res.json();

        if (json.success) {
          const transformed = json.data.map((task: {
            id: number;
            name: string;
            createdAt?: string;
            due_date?: string;
            priority?: string;
            status?: string;
            project?: { name?: string };
            milestone?: string;
          }) => {
            const colors = taskPriorityColor(task.priority);
            return {
              id: String(task.id),
              title: task.name,
              start: task.createdAt || task.due_date,
              end: task.due_date,
              backgroundColor: colors.bg,
              borderColor: colors.border,
              textColor: '#fff',
              classNames: [taskPriorityClass(task.priority), 'project-phase-event'],
              extendedProps: {
                status: task.status,
                project: task.project?.name,
                milestone: task.milestone,
                priority: task.priority,
              },
            };
          });
          setEvents(transformed);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const taskCount = events.length;

  const modalContent = useMemo(() => {
    if (!selectedEvent) return null;
    const props = selectedEvent.extendedProps as Record<string, string>;
    const priority = props.priority?.toLowerCase();
    const priorityColor =
      priority === 'urgent'
        ? 'red'
        : priority === 'high'
          ? 'orange'
          : priority === 'medium'
            ? 'blue'
            : 'green';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Text type="secondary">Гарчиг</Text>
          <div>
            <Text strong style={{ fontSize: 16 }}>
              {selectedEvent.title}
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <Text type="secondary">Эхлэх</Text>
            <div>
              <Text>{selectedEvent.startStr || '—'}</Text>
            </div>
          </div>
          <div>
            <Text type="secondary">Дуусах</Text>
            <div>
              <Text>{selectedEvent.endStr || '—'}</Text>
            </div>
          </div>
        </div>
        {props.project && (
          <div>
            <Text type="secondary">Төсөл</Text>
            <div>
              <Tag color="blue">{props.project}</Tag>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {props.status && <Tag>{props.status}</Tag>}
          {props.priority && <Tag color={priorityColor}>{props.priority}</Tag>}
          {props.milestone && props.milestone !== 'No milestone' && (
            <Tag color="purple">{props.milestone}</Tag>
          )}
        </div>
      </div>
    );
  }, [selectedEvent]);

  return (
    <div style={{ padding: 8 }}>
      <Card
        bordered={false}
        style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #d97706 100%)',
          borderRadius: 16,
        }}
        styles={{ body: { padding: '24px 28px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarOutlined style={{ fontSize: 26, color: '#fff' }} />
          </div>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
            {loading ? 'Ачааллаж байна...' : `${taskCount} даалгавар хугацаанд`}
          </Text>
        </div>
      </Card>

      <Spin spinning={loading}>
        <StyledFullCalendar
          events={events}
          legend={PRIORITY_LEGEND}
          subtitle="Даалгавар дээр дарж дэлгэрэнгүй харна"
          onEventClick={(info) => {
            setSelectedEvent(info.event);
            setModalVisible(true);
          }}
        />
      </Spin>

      <Modal
        title="Даалгаврын мэдээлэл"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => setModalVisible(false)}
        okText="Хаах"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={480}
        styles={{
          header: { borderBottom: '1px solid #f0f0f0', paddingBottom: 16 },
          body: { paddingTop: 20 },
        }}
      >
        {modalContent}
      </Modal>
    </div>
  );
};

export default CalendarPage;
