'use client';


import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import { Modal } from 'antd';

type CalendarEvent = {
  id: string;
  title: string;
  start?: string;
  end?: string;
  date?: string;
  extendedProps?: {
    status?: string;
    project?: string;
    milestone?: string;
    priority?: string;
  }
};

const CalendarPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);  // <--- энд type-ыг тодорхойллоо
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task`);
        const json = await res.json();

        if (json.success) {
          const transformed = json.data.map((task: any) => ({
            id: String(task.id),
            title: task.name,
            start: task.createdAt,
            end: task.due_date,
            extendedProps: {
              status: task.status,
              project: task.project?.name,
              milestone: task.milestone,
              priority: task.priority,
            }
          }));
          setEvents(transformed);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);

  const handleDateClick = (arg: DateClickArg) => {
    const newEvent: CalendarEvent = {
      id: String(events.length + 1),
      title: 'Шинэ үүрэг',
      date: arg.dateStr,
    };
    setEvents([...events, newEvent]);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event);
    setModalVisible(true);
  };

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
      />

      <Modal
        title="Үүргийн мэдээлэл"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => setModalVisible(false)}
      >
        {selectedEvent && (
          <>
            <p><strong>Гарчиг:</strong> {selectedEvent.title}</p>
            <p><strong>Эхлэх огноо:</strong> {selectedEvent.startStr}</p>
            <p><strong>Дуусах огноо:</strong> {selectedEvent.endStr}</p>
            <p><strong>Төслийн нэр:</strong> {selectedEvent.extendedProps.project}</p>
            <p><strong>Шат:</strong> {selectedEvent.extendedProps.milestone}</p>
            <p><strong>Төлөв:</strong> {selectedEvent.extendedProps.status}</p>
            <p><strong>Зэрэглэл:</strong> {selectedEvent.extendedProps.priority}</p>
          </>
        )}
      </Modal>
    </>
  );
};

export default CalendarPage;
