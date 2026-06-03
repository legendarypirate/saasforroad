'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DatePointApi, EventInput, ToolbarInput } from '@fullcalendar/core';
import '@/styles/styled-calendar.css';

export type CalendarLegendItem = { label: string; color: string };

export interface StyledFullCalendarProps {
  events: EventInput[];
  title?: string;
  subtitle?: string;
  legend?: CalendarLegendItem[];
  onEventClick?: (info: EventClickArg) => void;
  onDateClick?: (arg: DatePointApi) => void;
  editable?: boolean;
  selectable?: boolean;
  initialView?: 'dayGridMonth' | 'dayGridWeek';
  className?: string;
  headerToolbar?: ToolbarInput | false;
  initialDate?: string;
  dayMaxEvents?: number | false;
}

export function taskPriorityClass(priority?: string): string {
  const p = (priority || '').toLowerCase();
  if (p === 'urgent') return 'cal-event-urgent';
  if (p === 'high') return 'cal-event-high';
  if (p === 'medium') return 'cal-event-medium';
  if (p === 'low') return 'cal-event-low';
  return 'cal-event-default';
}

export function taskPriorityColor(priority?: string): { bg: string; border: string } {
  const p = (priority || '').toLowerCase();
  if (p === 'urgent') return { bg: '#ef4444', border: '#dc2626' };
  if (p === 'high') return { bg: '#f97316', border: '#ea580c' };
  if (p === 'medium') return { bg: '#3b82f6', border: '#2563eb' };
  if (p === 'low') return { bg: '#22c55e', border: '#16a34a' };
  return { bg: '#64748b', border: '#475569' };
}

export default function StyledFullCalendar({
  events,
  title,
  subtitle,
  legend,
  onEventClick,
  onDateClick,
  editable = false,
  selectable = false,
  initialView = 'dayGridMonth',
  className = '',
  headerToolbar: headerToolbarProp,
  initialDate,
  dayMaxEvents = 4,
}: StyledFullCalendarProps) {
  const headerToolbar: ToolbarInput | false =
    headerToolbarProp === false
      ? false
      : headerToolbarProp ?? {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        };

  return (
    <div className={`styled-calendar-shell ${className}`}>
      {(title || subtitle || (legend && legend.length > 0)) && (
        <div className="styled-calendar-header">
          <div>
            {title && <h4>{title}</h4>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {legend && legend.length > 0 && (
            <div className="styled-calendar-legend">
              {legend.map((item) => (
                <span key={item.label} className="styled-calendar-legend-item">
                  <span
                    className="styled-calendar-legend-dot"
                    style={{ background: item.color }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="styled-calendar-body">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView={initialView}
          initialDate={initialDate}
          height="auto"
          headerToolbar={headerToolbar}
          buttonText={{
            today: 'Өнөөдөр',
            month: 'Сар',
            week: '7 хоног',
          }}
          events={events}
          eventDisplay="block"
          dayMaxEvents={dayMaxEvents}
          moreLinkClick="popover"
          editable={editable}
          selectable={selectable}
          dateClick={onDateClick}
          eventClick={onEventClick}
          firstDay={1}
        />
      </div>
    </div>
  );
}
