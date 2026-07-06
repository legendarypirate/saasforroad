'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
  Button,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import StyledFullCalendar from '@/components/StyledFullCalendar';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

interface UserOption {
  id: number;
  username: string;
}

interface DayReport {
  date: string;
  isWorkDay: boolean;
  isRestDay: boolean;
  expectedHours: number;
  workedHours: number;
  billableHours: number;
  overtimeHours: number;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string;
  statusLabel: string;
  scheduleLabel: string;
  dayType: string;
  cycleDay?: number | null;
  override?: string;
  overrideLabel?: string;
}

interface ScheduleExceptionRow {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  override_type: 'skip_rest' | 'force_rest';
  reason?: string;
}

interface CalendarResponse {
  user: {
    id: number;
    username: string;
    work_schedule_type: string;
    scheduleLabel: string;
    cycle_start_date: string | null;
    cycle_work_days: number;
    cycle_rest_days: number;
    daily_work_hours: number;
    extended_cycle: boolean;
  };
  month: string;
  days: DayReport[];
  summary: {
    scheduledWorkDays: number;
    presentDays: number;
    absentDays: number;
    restDays: number;
    totalWorkedHours: number;
    totalBillableHours: number;
    totalOvertimeHours: number;
    attendanceRate: number;
    unscheduledWorkDays: number;
  };
  exceptions: ScheduleExceptionRow[];
}

interface PayrollRow {
  user_id: number;
  username: string;
  scheduleLabel: string;
  scheduledWorkDays: number;
  presentDays: number;
  absentDays: number;
  totalBillableHours: number;
  totalOvertimeHours: number;
  attendanceRate: number;
}

const SCHEDULE_OPTIONS = [
  { value: 'office_8h', label: 'Энгийн — Даваа–Баасан' },
  { value: 'rotation', label: 'Ээлжийн — ажил/амралт хоногоор' },
];

const ROTATION_PRESETS = [
  { label: '22/8', work: 22, rest: 8, hours: 8 },
  { label: '21/7', work: 21, rest: 7, hours: 8 },
  { label: '22/8 (12ц)', work: 22, rest: 8, hours: 11 },
  { label: '21/7 (12ц)', work: 21, rest: 7, hours: 11 },
];

const OVERRIDE_OPTIONS = [
  { value: 'skip_rest', label: 'Амралт алгассан (ажилласан)' },
  { value: 'force_rest', label: 'Нэмэлт амралт' },
];

function isRotationSchedule(type?: string) {
  return type === 'rotation' || type === 'rotation_22_8' || type === 'field_12h';
}

function statusColor(status: string) {
  switch (status) {
    case 'complete':
      return '#52c41a';
    case 'absent':
      return '#ff4d4f';
    case 'partial':
    case 'under':
      return '#faad14';
    case 'in_progress':
      return '#1677ff';
    case 'unscheduled_work':
      return '#722ed1';
    case 'leave_paid':
      return '#1677ff';
    case 'leave_unpaid':
      return '#8c8c8c';
    case 'rest':
    default:
      return '#d9d9d9';
  }
}

function formatTime(value: string | null) {
  if (!value) return '—';
  return dayjs(value).format('HH:mm');
}

export default function AttendanceCalculationPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [payrollRows, setPayrollRows] = useState<PayrollRow[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [exceptionSaving, setExceptionSaving] = useState(false);
  const [scheduleForm] = Form.useForm();
  const [exceptionForm] = Form.useForm();
  const scheduleType = Form.useWatch('work_schedule_type', scheduleForm);

  const monthStr = selectedMonth.format('YYYY-MM');
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    document.title = 'Ирц тооцоолол';
    fetch(`${apiBase}/api/user`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.length) {
          setUsers(json.data);
          setSelectedUserId(json.data[0].id);
        }
      })
      .catch(console.error);
  }, [apiBase]);

  const fetchCalendar = useCallback(async () => {
    if (!selectedUserId) return;
    setLoadingCalendar(true);
    try {
      const res = await fetch(
        `${apiBase}/api/attendance/calendar?user_id=${selectedUserId}&month=${monthStr}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      setCalendarData(json.data);
      const u = json.data.user;
      const normalizedType = isRotationSchedule(u.work_schedule_type) ? 'rotation' : 'office_8h';
      scheduleForm.setFieldsValue({
        work_schedule_type: normalizedType,
        cycle_start_date: u.cycle_start_date ? dayjs(u.cycle_start_date) : null,
        cycle_work_days: u.cycle_work_days ?? 22,
        cycle_rest_days: u.cycle_rest_days ?? 8,
        daily_work_hours: u.daily_work_hours ?? (u.work_schedule_type === 'field_12h' ? 11 : 8),
      });
    } catch (err) {
      console.error(err);
      message.error('Календар ачаалахад алдаа гарлаа');
    } finally {
      setLoadingCalendar(false);
    }
  }, [apiBase, selectedUserId, monthStr, scheduleForm]);

  const fetchPayroll = useCallback(async () => {
    setLoadingPayroll(true);
    try {
      const res = await fetch(`${apiBase}/api/attendance/payroll-summary?month=${monthStr}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      setPayrollRows(json.data.rows || []);
    } catch (err) {
      console.error(err);
      message.error('Сарын тооцоолол ачаалахад алдаа гарлаа');
    } finally {
      setLoadingPayroll(false);
    }
  }, [apiBase, monthStr]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const saveSchedule = async () => {
    if (!selectedUserId) return;
    const values = await scheduleForm.validateFields();
    setSavingSchedule(true);
    try {
      const res = await fetch(`${apiBase}/api/attendance/schedule/${selectedUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_schedule_type: values.work_schedule_type,
          cycle_start_date: values.cycle_start_date
            ? values.cycle_start_date.format('YYYY-MM-DD')
            : null,
          cycle_work_days: values.cycle_work_days,
          cycle_rest_days: values.cycle_rest_days,
          daily_work_hours: values.daily_work_hours,
          extended_cycle: false,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      message.success('Ээлжийн горим хадгалагдлаа');
      fetchCalendar();
      fetchPayroll();
    } catch (err) {
      console.error(err);
      message.error('Хадгалахад алдаа гарлаа');
    } finally {
      setSavingSchedule(false);
    }
  };

  const addException = async () => {
    if (!selectedUserId) return;
    const values = await exceptionForm.validateFields();
    const [start, end] = values.date_range as [Dayjs, Dayjs];
    setExceptionSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/schedule_exception`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          start_date: start.format('YYYY-MM-DD'),
          end_date: end.format('YYYY-MM-DD'),
          override_type: values.override_type,
          reason: values.reason,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      exceptionForm.resetFields();
      message.success('Exception нэмэгдлээ');
      fetchCalendar();
      fetchPayroll();
    } catch (err) {
      console.error(err);
      message.error('Exception нэмэхэд алдаа гарлаа');
    } finally {
      setExceptionSaving(false);
    }
  };

  const deleteException = async (id: number) => {
    try {
      const res = await fetch(`${apiBase}/api/schedule_exception/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Алдаа');
      message.success('Устгагдлаа');
      fetchCalendar();
      fetchPayroll();
    } catch (err) {
      console.error(err);
      message.error('Устгах үед алдаа гарлаа');
    }
  };

  const applyPreset = (preset: (typeof ROTATION_PRESETS)[number]) => {
    scheduleForm.setFieldsValue({
      work_schedule_type: 'rotation',
      cycle_work_days: preset.work,
      cycle_rest_days: preset.rest,
      daily_work_hours: preset.hours,
    });
  };

  const calendarEvents = useMemo(
    () =>
      (calendarData?.days || []).map((d) => ({
        start: d.date,
        display: 'background' as const,
        backgroundColor: statusColor(d.status),
        title: d.isWorkDay
          ? `${d.workedHours}/${d.expectedHours}ц`
          : d.status === 'unscheduled_work'
            ? `${d.workedHours}ц`
            : 'Амралт',
      })),
    [calendarData]
  );

  const dailyColumns: ColumnsType<DayReport> = [
    { title: 'Огноо', dataIndex: 'date', width: 110 },
    {
      title: 'Төрөл',
      render: (_, r) =>
        r.isWorkDay ? <Tag color="blue">Ажлын өдөр</Tag> : <Tag>Амралт</Tag>,
    },
    {
      title: 'Ээлж',
      render: (_, r) => (r.cycleDay ? `${r.cycleDay}-р өдөр` : '—'),
    },
    {
      title: 'Ирсэн',
      dataIndex: 'check_in_at',
      render: (v) => formatTime(v),
    },
    {
      title: 'Явсан',
      dataIndex: 'check_out_at',
      render: (v) => formatTime(v),
    },
    {
      title: 'Ажилласан',
      dataIndex: 'workedHours',
      render: (v, r) => `${v} / ${r.expectedHours || 0} ц`,
    },
    {
      title: 'Төлөв',
      dataIndex: 'statusLabel',
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <Tag color={statusColor(r.status)}>{v}</Tag>
          {r.override === 'skip_rest' && <Text type="warning" style={{ fontSize: 12 }}>Exception</Text>}
        </Space>
      ),
    },
  ];

  const exceptionColumns: ColumnsType<ScheduleExceptionRow> = [
    { title: 'Эхлэх', dataIndex: 'start_date' },
    { title: 'Дуусах', dataIndex: 'end_date' },
    {
      title: 'Төрөл',
      dataIndex: 'override_type',
      render: (v) => OVERRIDE_OPTIONS.find((o) => o.value === v)?.label || v,
    },
    { title: 'Шалтгаан', dataIndex: 'reason', render: (v) => v || '—' },
    {
      title: 'Үйлдэл',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => deleteException(record.id)} />
      ),
    },
  ];

  const payrollColumns: ColumnsType<PayrollRow> = [
    { title: 'Ажилтан', dataIndex: 'username' },
    { title: 'Ээлжийн горим', dataIndex: 'scheduleLabel' },
    { title: 'Ажлын өдөр', dataIndex: 'scheduledWorkDays' },
    { title: 'Ирсэн', dataIndex: 'presentDays' },
    {
      title: 'Тасалсан',
      dataIndex: 'absentDays',
      render: (v) => <Text type={v > 0 ? 'danger' : undefined}>{v}</Text>,
    },
    { title: 'Тооцох цаг', dataIndex: 'totalBillableHours', render: (v) => `${v} ц` },
    { title: 'Илүү цаг', dataIndex: 'totalOvertimeHours', render: (v) => `${v} ц` },
    {
      title: 'Ирц %',
      dataIndex: 'attendanceRate',
      render: (v) => `${v}%`,
    },
  ];

  const summary = calendarData?.summary;

  return (
    <div>
      <Title level={4} style={{ marginBottom: 8 }}>
        Ирц тооцоолол
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Ирцийн хяналт — бодит ирсэн/явсан цаг. Энд ээлжийн горимоор ажлын өдөр, амралт, цалингийн
        суурь цагийг тооцно.
      </Text>

      <Space style={{ marginBottom: 24 }} wrap>
        <span>Сар:</span>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(d) => d && setSelectedMonth(d)}
          allowClear={false}
        />
      </Space>

      <Tabs
        items={[
          {
            key: 'calendar',
            label: 'Ажилтны календар',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card size="small" title="Ажилтан сонгох">
                  <Space wrap>
                    <Select
                      style={{ width: 260 }}
                      placeholder="Ажилтан"
                      value={selectedUserId ?? undefined}
                      onChange={setSelectedUserId}
                      options={users.map((u) => ({ value: u.id, label: u.username }))}
                    />
                    {calendarData?.user && (
                      <Tag color="processing">{calendarData.user.scheduleLabel}</Tag>
                    )}
                  </Space>
                </Card>

                <Card size="small" title="Ээлжийн горим тохируулах">
                  <Form form={scheduleForm} layout="vertical" requiredMark={false}>
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item name="work_schedule_type" label="Горим">
                          <Select options={SCHEDULE_OPTIONS} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item name="daily_work_hours" label="Өдрийн тооцох цаг">
                          <InputNumber min={1} max={24} step={0.5} style={{ width: '100%' }} addonAfter="ц" />
                        </Form.Item>
                      </Col>
                      {scheduleType === 'office_8h' ? (
                        <Col xs={24} md={8}>
                          <Text type="secondary" style={{ display: 'block', paddingTop: 30 }}>
                            Даваа–Баасан ажлын өдөр
                          </Text>
                        </Col>
                      ) : (
                        <>
                          <Col xs={12} md={4}>
                            <Form.Item name="cycle_work_days" label="Ажиллах хоног">
                              <InputNumber min={1} max={60} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col xs={12} md={4}>
                            <Form.Item name="cycle_rest_days" label="Амрах хоног">
                              <InputNumber min={0} max={30} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item name="cycle_start_date" label="Ээлж эхэлсэн огноо">
                              <DatePicker style={{ width: '100%' }} placeholder="Эхлэх огноо" />
                            </Form.Item>
                          </Col>
                        </>
                      )}
                    </Row>

                    {isRotationSchedule(scheduleType) && (
                      <Space wrap style={{ marginBottom: 16 }}>
                        <Text type="secondary">Тemplate:</Text>
                        {ROTATION_PRESETS.map((p) => (
                          <Button key={p.label} size="small" onClick={() => applyPreset(p)}>
                            {p.label}
                          </Button>
                        ))}
                      </Space>
                    )}

                    <Button type="primary" loading={savingSchedule} onClick={saveSchedule}>
                      Хадгалах
                    </Button>
                  </Form>
                  {isRotationSchedule(scheduleType) && (
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      Жишээ: 22/8, 21/7 гэх мэт ажил/амралтын хоногийг өөрөө тохируулна. Орон
                      нутагт 12 цаг (1 цай) → тооцох цаг 11.
                    </Text>
                  )}
                </Card>

                {isRotationSchedule(scheduleType) && (
                  <Card size="small" title="Нэг удаагийн exception (амралт алгасах / нэмэлт амралт)">
                    <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                      Зөвхөн тухайн хугацаанд л хүчинтэй. Бусад ээлжид хэвийн 22/8, 21/7 горим
                      үргэлжилнэ — нэг удаа дундаа амралтгүй ажилласан тохиолдолд энд бүртгэнэ.
                    </Text>
                    <Form form={exceptionForm} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                      <Form.Item
                        name="date_range"
                        rules={[{ required: true, message: 'Огноо' }]}
                      >
                        <DatePicker.RangePicker placeholder={['Эхлэх', 'Дуусах']} />
                      </Form.Item>
                      <Form.Item
                        name="override_type"
                        initialValue="skip_rest"
                        rules={[{ required: true }]}
                      >
                        <Select style={{ width: 240 }} options={OVERRIDE_OPTIONS} />
                      </Form.Item>
                      <Form.Item name="reason">
                        <Input placeholder="Шалтгаан (мөнгөний хэрэгцээ гэх мэт)" style={{ width: 220 }} />
                      </Form.Item>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        loading={exceptionSaving}
                        onClick={addException}
                      />
                    </Form>
                    <Table
                      rowKey="id"
                      size="small"
                      columns={exceptionColumns}
                      dataSource={calendarData?.exceptions || []}
                      pagination={false}
                    />
                  </Card>
                )}

                {summary && (
                  <Row gutter={16}>
                    <Col xs={12} md={6}>
                      <Card><Statistic title="Ажлын өдөр" value={summary.scheduledWorkDays} /></Card>
                    </Col>
                    <Col xs={12} md={6}>
                      <Card><Statistic title="Ирсэн" value={summary.presentDays} valueStyle={{ color: '#3f8600' }} /></Card>
                    </Col>
                    <Col xs={12} md={6}>
                      <Card><Statistic title="Тасалсан" value={summary.absentDays} valueStyle={{ color: '#cf1322' }} /></Card>
                    </Col>
                    <Col xs={12} md={6}>
                      <Card><Statistic title="Тооцох цаг" value={summary.totalBillableHours} suffix="ц" /></Card>
                    </Col>
                  </Row>
                )}

                <Card loading={loadingCalendar} title={`${monthStr} — ирцийн календар`}>
                  <StyledFullCalendar
                    events={calendarEvents}
                    initialDate={selectedMonth.format('YYYY-MM-DD')}
                    headerToolbar={{ left: '', center: 'title', right: '' }}
                    dayMaxEvents={false}
                    legend={[
                      { label: 'Бүрэн ирц', color: '#52c41a' },
                      { label: 'Тасалсан', color: '#ff4d4f' },
                      { label: 'Дутуу', color: '#faad14' },
                      { label: 'Ажиллаж буй', color: '#1890ff' },
                      { label: 'Амралт', color: '#d9d9d9' },
                      { label: 'Амралтын өдөр ажилласан', color: '#722ed1' },
                    ]}
                    subtitle="Өдөр бүрийн ирцийн төлөв"
                  />
                </Card>

                <Card title="Өдрийн дэлгэрэнгүй">
                  <Table
                    rowKey="date"
                    size="small"
                    columns={dailyColumns}
                    dataSource={calendarData?.days || []}
                    pagination={{ pageSize: 10 }}
                    loading={loadingCalendar}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: 'payroll',
            label: 'Сарын тооцоолол',
            children: (
              <Card title={`${monthStr} — бүх ажилтны нэгдсэн тооцоо`}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  Цалин бодох суурь: тооцох цаг, илүү цаг, тасалсан өдөр. Цалингийн модуль холбогдох
                  боломжтой.
                </Text>
                <Table
                  rowKey="user_id"
                  columns={payrollColumns}
                  dataSource={payrollRows}
                  loading={loadingPayroll}
                  pagination={{ pageSize: 20 }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
