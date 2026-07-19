'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import {
  CheckCircleOutlined,
  MailOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@/components/admin/icons';
import { Pencil } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import {
  fetchSalaryCalculation,
  formatMnt,
  recalcRow,
  recalcRowWithAutoTax,
  rowToPayload,
  saveMonthExpectedHours,
  saveSalaryAdjustment,
  saveSalaryAdjustmentsBulk,
  sendBulkSalaryEmails,
  sumTotals,
  type SalaryRow,
} from '@/lib/salary';

const { Text } = Typography;

type EditableField =
  | 'totalWorkedHours'
  | 'totalBillableHours'
  | 'totalOvertimeHours'
  | 'absentHours'
  | 'ndsh'
  | 'hhoat'
  | 'deduction'
  | 'additional_deduction'
  | 'note';

const HOUR_FIELDS = new Set<EditableField>([
  'totalWorkedHours',
  'totalBillableHours',
  'totalOvertimeHours',
  'absentHours',
]);

const cellBase: React.CSSProperties = {
  width: '100%',
  fontSize: 11,
  padding: '0 6px',
  lineHeight: '24px',
  height: 26,
  borderRadius: 4,
  border: '1px solid var(--border)',
  background: 'var(--muted)',
  color: 'var(--foreground)',
};

const cellFocus: React.CSSProperties = {
  ...cellBase,
  border: '1px solid var(--primary)',
  background: 'var(--card)',
  boxShadow: '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)',
};

function CellNum({
  value,
  onCommit,
  saving,
  step = 1,
  danger,
  money,
}: {
  value: number;
  onCommit: (v: number) => void;
  saving?: boolean;
  step?: number;
  danger?: boolean;
  money?: boolean;
}) {
  const [local, setLocal] = useState<number | null>(value);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocal(value);
  }, [value, focused]);

  return (
    <InputNumber
      money={money}
      value={local}
      min={0}
      step={step}
      controls={false}
      disabled={saving}
      size="small"
      style={{
        ...(focused ? cellFocus : cellBase),
        color: danger ? '#cf1322' : undefined,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const next = Number(local) || 0;
        if (next !== (Number(value) || 0)) onCommit(next);
      }}
      onChange={(v) => setLocal(v)}
      onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
    />
  );
}

function CellNote({
  value,
  onCommit,
  saving,
}: {
  value: string;
  onCommit: (v: string) => void;
  saving?: boolean;
}) {
  const [local, setLocal] = useState(value || '');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocal(value || '');
  }, [value, focused]);

  return (
    <Input
      value={local}
      disabled={saving}
      size="small"
      placeholder="..."
      style={{
        ...(focused ? cellFocus : { ...cellBase, background: 'color-mix(in srgb, var(--primary) 8%, var(--muted))' }),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        if ((local || '') !== (value || '')) onCommit(local);
      }}
      onChange={(e) => setLocal(e.target.value)}
      onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
    />
  );
}

function Money({ value, strong, color }: { value: number; strong?: boolean; color?: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: strong ? 600 : 400,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {formatMnt(value)}
    </span>
  );
}

export default function SalaryCalculationPage() {
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [expectedHours, setExpectedHours] = useState(176);
  const [expectedDraft, setExpectedDraft] = useState(176);
  const [resendConfigured, setResendConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savingExpected, setSavingExpected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [savedFlash, setSavedFlash] = useState<Set<number>>(new Set());
  const flashTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const monthStr = month.format('YYYY-MM');
  const totals = useMemo(() => sumTotals(rows), [rows]);

  const applyData = (data: {
    rows: SalaryRow[];
    expectedHours: number;
    resendConfigured: boolean;
  }) => {
    setRows(data.rows);
    setExpectedHours(data.expectedHours);
    setExpectedDraft(data.expectedHours);
    setResendConfigured(data.resendConfigured);
    setSelectedIds(data.rows.filter((r) => r.hasEmail).map((r) => r.user_id));
    setDirtyIds(new Set());
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      applyData(await fetchSalaryCalculation(monthStr));
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    document.title = 'Цалин тооцоолол';
    load();
  }, [load]);

  useEffect(
    () => () => Object.values(flashTimers.current).forEach(clearTimeout),
    []
  );

  const markSaved = (userId: number) => {
    setSavedFlash((prev) => new Set(prev).add(userId));
    if (flashTimers.current[userId]) clearTimeout(flashTimers.current[userId]);
    flashTimers.current[userId] = setTimeout(() => {
      setSavedFlash((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }, 1200);
  };

  const applyField = (row: SalaryRow, field: EditableField, value: number | string) => {
    const patched = { ...row, [field]: value } as SalaryRow;
    return HOUR_FIELDS.has(field)
      ? recalcRowWithAutoTax(patched, expectedHours)
      : recalcRow(patched, expectedHours);
  };

  const commitField = async (userId: number, field: EditableField, value: number | string) => {
    const row = rows.find((r) => r.user_id === userId);
    if (!row) return;

    const nextRow = applyField(row, field, value);
    setRows((prev) => prev.map((r) => (r.user_id === userId ? nextRow : r)));
    setDirtyIds((prev) => new Set(prev).add(userId));
    setSavingIds((prev) => new Set(prev).add(userId));

    try {
      const updated = await saveSalaryAdjustment(monthStr, rowToPayload(nextRow));
      setRows((prev) => prev.map((r) => (r.user_id === userId ? updated : r)));
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      markSaved(userId);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Хадгалахад алдаа');
      load();
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const commitExpectedHours = async (hours: number) => {
    if (hours === expectedHours) return;
    setSavingExpected(true);
    try {
      applyData(await saveMonthExpectedHours(monthStr, hours));
      message.success('Ажиллавал зохих цаг хадгалагдлаа');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Хадгалахад алдаа');
    } finally {
      setSavingExpected(false);
    }
  };

  const saveAllDirty = async () => {
    const dirtyRows = rows.filter((r) => dirtyIds.has(r.user_id));
    if (!dirtyRows.length) {
      message.info('Хадгалах өөрчлөлт байхгүй');
      return;
    }
    setSavingAll(true);
    try {
      applyData(
        await saveSalaryAdjustmentsBulk(
          monthStr,
          dirtyRows.map((r) => rowToPayload(r))
        )
      );
      message.success(`${dirtyRows.length} мөр хадгалагдлаа`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Хадгалахад алдаа');
    } finally {
      setSavingAll(false);
    }
  };

  const emailSelectedCount = useMemo(
    () => rows.filter((r) => selectedIds.includes(r.user_id) && r.hasEmail).length,
    [rows, selectedIds]
  );

  const handleSendBulk = () => {
    const ids = rows
      .filter((r) => selectedIds.includes(r.user_id) && r.hasEmail)
      .map((r) => r.user_id);
    if (!ids.length) {
      message.warning('И-мэйл хаягтай хэрэглэгч сонгоно уу');
      return;
    }

    Modal.confirm({
      title: 'Цалингийн задаргаа илгээх үү?',
      content: (
        <div>
          <p>
            <strong>{ids.length}</strong> ажилтанд <strong>{monthStr}</strong> сарын задаргаа
            илгээнэ.
          </p>
          {dirtyIds.size > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${dirtyIds.size} мөр хадгалаагүй — эхлээд хадгална уу.`}
            />
          )}
        </div>
      ),
      okText: 'Илгээх',
      cancelText: 'Болих',
      okButtonProps: { disabled: dirtyIds.size > 0 },
      onOk: async () => {
        setSending(true);
        try {
          const result = await sendBulkSalaryEmails(monthStr, ids);
          if (result.failed > 0) {
            message.warning(`${result.sent} амжилттай, ${result.failed} алдаатай`);
          } else {
            message.success(`${result.sent} имэйл илгээгдлээ`);
          }
        } catch (e) {
          message.error(e instanceof Error ? e.message : 'Илгээхэд алдаа');
        } finally {
          setSending(false);
        }
      },
    });
  };

  const th = (label: string, tip?: string, edit?: boolean) => (
    <Tooltip title={tip || label}>
      <span
        className="inline-flex items-center gap-1 text-[11px] font-semibold leading-none"
        style={{ color: edit ? '#b45309' : undefined }}
      >
        {label}
        {edit && <Pencil className="size-3 opacity-70" />}
      </span>
    </Tooltip>
  );

  const columns: ColumnsType<SalaryRow> = [
    {
      title: '#',
      width: 32,
      fixed: 'left',
      align: 'center',
      render: (_v, _r, i) => <Text style={{ fontSize: 10 }} type="secondary">{i + 1}</Text>,
    },
    {
      title: th('Ажилтан'),
      dataIndex: 'username',
      fixed: 'left',
      width: 100,
      ellipsis: true,
      render: (v, r) => (
        <Space size={2}>
          <Text style={{ fontSize: 11 }} strong ellipsis>
            {v}
          </Text>
          {savedFlash.has(r.user_id) && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 10 }} />}
          {dirtyIds.has(r.user_id) && !savingIds.has(r.user_id) && (
            <Tag color="gold" style={{ margin: 0, fontSize: 9, lineHeight: '14px', padding: '0 3px' }}>
              *
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: th('Цалин'),
      dataIndex: 'salary',
      width: 78,
      align: 'right',
      render: (v) => <Money value={v} />,
    },
    {
      title: th('Ажилласан', 'Ажилласан цаг', true),
      dataIndex: 'totalWorkedHours',
      width: 72,
      align: 'right',
      render: (v, r) => (
        <CellNum
          value={v}
          step={0.5}
          saving={savingIds.has(r.user_id)}
          onCommit={(n) => commitField(r.user_id, 'totalWorkedHours', n)}
        />
      ),
    },
    {
      title: th('Тооцох', 'Тооцох цаг', true),
      dataIndex: 'totalBillableHours',
      width: 72,
      align: 'right',
      render: (v, r) => (
        <CellNum
          value={v}
          step={0.5}
          saving={savingIds.has(r.user_id)}
          onCommit={(n) => commitField(r.user_id, 'totalBillableHours', n)}
        />
      ),
    },
    {
      title: th('Илүү цаг', 'Илүү цаг', true),
      dataIndex: 'totalOvertimeHours',
      width: 68,
      align: 'right',
      render: (v, r) => (
        <CellNum
          value={v}
          step={0.5}
          saving={savingIds.has(r.user_id)}
          onCommit={(n) => commitField(r.user_id, 'totalOvertimeHours', n)}
        />
      ),
    },
    {
      title: th('Олговол', 'Цагийн олговол'),
      dataIndex: 'workPay',
      width: 88,
      align: 'right',
      render: (v) => <Money value={v} color="#595959" />,
    },
    {
      title: th('Илүү олговол', 'Илүү цагийн олговол'),
      dataIndex: 'overtimePay',
      width: 88,
      align: 'right',
      render: (v) => <Money value={v} color="#595959" />,
    },
    {
      title: th('Нийт олговол', 'Нийт олговол (gross)'),
      dataIndex: 'grossPay',
      width: 96,
      align: 'right',
      render: (v) => <Money value={v} strong />,
    },
    {
      title: th('Тасалсан', 'Тасалсан цаг — хасалт = цагийн хөлс × цаг', true),
      dataIndex: 'absentHours',
      width: 72,
      align: 'right',
      render: (v, r) => (
        <CellNum
          value={v}
          step={0.5}
          danger
          saving={savingIds.has(r.user_id)}
          onCommit={(n) => commitField(r.user_id, 'absentHours', n)}
        />
      ),
    },
    {
      title: th('НДШ', 'НДШ 11.5% — засварлах боломжтой', true),
      dataIndex: 'ndsh',
      width: 80,
      align: 'right',
      render: (v, r) => (
        <CellNum
          money
          value={v}
          step={100}
          danger
          saving={savingIds.has(r.user_id)}
          onCommit={(n) => commitField(r.user_id, 'ndsh', n)}
        />
      ),
    },
    {
      title: th('ХХОАТ', 'ХХОАТ 10% — засварлах боломжтой', true),
      dataIndex: 'hhoat',
      width: 80,
      align: 'right',
      render: (v, r) => (
        <CellNum
          money
          value={v}
          step={100}
          danger
          saving={savingIds.has(r.user_id)}
          onCommit={(n) => commitField(r.user_id, 'hhoat', n)}
        />
      ),
    },
    {
      title: th('Суутгал', 'Бусад суутгал', true),
      dataIndex: 'deduction',
      width: 80,
      align: 'right',
      render: (v, r) => (
        <CellNum
          money
          value={v}
          step={1000}
          danger
          saving={savingIds.has(r.user_id)}
          onCommit={(n) => commitField(r.user_id, 'deduction', n)}
        />
      ),
    },
    {
      title: th('Нэмэлт', 'Нэмэлт суутгал', true),
      dataIndex: 'additional_deduction',
      width: 80,
      align: 'right',
      render: (v, r) => (
        <CellNum
          money
          value={v}
          step={1000}
          danger
          saving={savingIds.has(r.user_id)}
          onCommit={(n) => commitField(r.user_id, 'additional_deduction', n)}
        />
      ),
    },
    {
      title: th('Тэмдэглэл', undefined, true),
      dataIndex: 'note',
      width: 110,
      render: (v, r) => (
        <CellNote
          value={v}
          saving={savingIds.has(r.user_id)}
          onCommit={(n) => commitField(r.user_id, 'note', n)}
        />
      ),
    },
    {
      title: th('Цэвэр олгох'),
      dataIndex: 'netPay',
      fixed: 'right',
      width: 96,
      align: 'right',
      render: (v) => <Money value={v} strong color="#0f4c81" />,
    },
  ];

  return (
    <div className="-m-4 space-y-4">
      <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-background px-1 pb-4">
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Тасалсан = цаг (хасалт = цагийн хөлс × цаг) · НДШ 11.5% · ХХОАТ 10% · шар талбар = засварлана
          </Text>
        </div>
        <Space wrap size={8}>
          <DatePicker
            picker="month"
            format="YYYY-MM"
            size="small"
            value={month}
            onChange={(d) => d && setMonth(d)}
            allowClear={false}
          />
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5">
            <Text style={{ fontSize: 11, whiteSpace: 'nowrap' }} strong>
              Ажиллавал зохих цаг
            </Text>
            <InputNumber
              size="small"
              min={0}
              step={1}
              value={expectedDraft}
              disabled={savingExpected || loading}
              addonAfter="ц"
              style={{ width: 100 }}
              onChange={(v) => setExpectedDraft(Number(v) || 0)}
              onBlur={() => commitExpectedHours(expectedDraft)}
              onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
          <Button size="small" icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Шинэчлэх
          </Button>
          <Button
            size="small"
            icon={<SaveOutlined />}
            onClick={saveAllDirty}
            loading={savingAll}
            disabled={dirtyIds.size === 0}
          >
            Хадгалах{dirtyIds.size > 0 ? ` (${dirtyIds.size})` : ''}
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<MailOutlined />}
            loading={sending}
            disabled={!resendConfigured || emailSelectedCount === 0}
            onClick={handleSendBulk}
          >
            Имэйл ({emailSelectedCount})
          </Button>
        </Space>
      </div>

      <div className="space-y-4">
        {!resendConfigured && (
          <Alert
            type="warning"
            showIcon
            style={{ fontSize: 12 }}
            message="Resend тохиргоо хийгдээгүй (RESEND_API_KEY, RESEND_FROM)"
          />
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {[
            { label: 'Зохих цаг', value: `${expectedHours} ц`, color: '#0f4c81' },
            { label: 'Ажилласан', value: `${totals.totalWorkedHours} ц`, color: '#1677ff' },
            { label: 'Тооцох', value: `${totals.totalBillableHours} ц`, color: '#0891b2' },
            { label: 'Нийт олговол', value: formatMnt(totals.totalGrossPay), color: '#1d4ed8' },
            { label: 'НДШ', value: formatMnt(totals.totalNdsh), color: '#ea580c' },
            { label: 'ХХОАТ', value: formatMnt(totals.totalHhoat), color: '#c2410c' },
            { label: 'Цэвэр олгох', value: formatMnt(totals.totalNetPay), color: '#0f4c81' },
            {
              label: 'И-мэйл',
              value: `${totals.withEmailCount}/${totals.employeeCount}`,
              color: '#16a34a',
            },
          ].map((item) => (
            <div key={item.label} className="salary-stat-card">
              <div className="salary-stat-card-accent" style={{ background: item.color }} />
              <div className="salary-stat-card-body">
                <div className="salary-stat-card-label">{item.label}</div>
                <div className="salary-stat-card-value" style={{ color: item.color }}>
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table
            rowKey="user_id"
            columns={columns}
            dataSource={rows}
            loading={loading}
            size="small"
            scroll={{ x: 1500, y: 'calc(100vh - 340px)' }}
            pagination={false}
            bordered
            className="salary-excel-table"
            rowClassName={(r) =>
              [
                dirtyIds.has(r.user_id) ? 'salary-row-dirty' : '',
                savingIds.has(r.user_id) ? 'salary-row-saving' : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
            rowSelection={{
              selectedRowKeys: selectedIds,
              onChange: (keys) => setSelectedIds(keys as number[]),
              getCheckboxProps: (record) => ({
                disabled: !record.hasEmail,
              }),
              columnWidth: 36,
            }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} />
                  <Table.Summary.Cell index={1} colSpan={3}>
                    <Text strong style={{ fontSize: 11 }}>
                      Нийт ({rows.length})
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text style={{ fontSize: 11 }} strong>
                      {totals.totalWorkedHours}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text style={{ fontSize: 11 }} strong>
                      {totals.totalBillableHours}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <Text style={{ fontSize: 11 }} strong>
                      {totals.totalOvertimeHours}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} colSpan={2} />
                  <Table.Summary.Cell index={9} align="right">
                    <Money value={totals.totalGrossPay} strong />
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={10} />
                  <Table.Summary.Cell index={11} align="right">
                    <Money value={totals.totalNdsh} color="#cf1322" />
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={12} align="right">
                    <Money value={totals.totalHhoat} color="#cf1322" />
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={13} align="right">
                    <Money value={totals.totalDeduction} color="#cf1322" />
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={14} align="right">
                    <Money value={totals.totalAdditionalDeduction} color="#cf1322" />
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={15} />
                  <Table.Summary.Cell index={16} align="right">
                    <Money value={totals.totalNetPay} strong color="#0f4c81" />
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>
      </div>
    </div>
  );
}
