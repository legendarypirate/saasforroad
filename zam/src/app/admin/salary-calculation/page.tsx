'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  MailOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from 'antd';
import {
  fetchSalaryCalculation,
  formatMnt,
  recalcRow,
  saveSalaryAdjustment,
  saveSalaryAdjustmentsBulk,
  sendBulkSalaryEmails,
  sumTotals,
  type SalaryRow,
} from '@/lib/salary';

const { Title, Text } = Typography;

type EditableField = 'deduction' | 'additional_deduction' | 'note';

const cellInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid transparent',
  borderRadius: 4,
  background: '#fffbe6',
};

const cellInputFocusStyle: React.CSSProperties = {
  ...cellInputStyle,
  border: '1px solid #722ed1',
  background: '#fff',
  boxShadow: '0 0 0 2px rgba(114,46,209,0.12)',
};

function MoneyCell({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <span
      style={{
        fontVariantNumeric: 'tabular-nums',
        color: muted ? '#8c8c8c' : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {formatMnt(value)}
    </span>
  );
}

function EditableMoneyCell({
  value,
  onCommit,
  saving,
}: {
  value: number;
  onCommit: (v: number) => void;
  saving?: boolean;
}) {
  const [local, setLocal] = useState<number | null>(value);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocal(value);
  }, [value, focused]);

  const commit = () => {
    const next = Number(local) || 0;
    if (next !== (Number(value) || 0)) onCommit(next);
  };

  return (
    <InputNumber
      value={local}
      min={0}
      controls={false}
      disabled={saving}
      style={focused ? cellInputFocusStyle : cellInputStyle}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onChange={(v) => setLocal(v)}
      onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
    />
  );
}

function EditableNoteCell({
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
      placeholder="Тэмдэглэл..."
      style={focused ? cellInputFocusStyle : { ...cellInputStyle, background: '#f6ffed' }}
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

export default function SalaryCalculationPage() {
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [resendConfigured, setResendConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [savedFlash, setSavedFlash] = useState<Set<number>>(new Set());
  const flashTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const monthStr = month.format('YYYY-MM');
  const totals = useMemo(() => sumTotals(rows), [rows]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSalaryCalculation(monthStr);
      setRows(data.rows);
      setResendConfigured(data.resendConfigured);
      setSelectedIds(data.rows.filter((r) => r.hasEmail).map((r) => r.user_id));
      setDirtyIds(new Set());
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

  useEffect(() => {
    return () => {
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, []);

  const markSaved = (userId: number) => {
    setSavedFlash((prev) => new Set(prev).add(userId));
    if (flashTimers.current[userId]) clearTimeout(flashTimers.current[userId]);
    flashTimers.current[userId] = setTimeout(() => {
      setSavedFlash((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }, 1500);
  };

  const updateLocalField = (userId: number, field: EditableField, value: number | string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.user_id !== userId) return row;
        const next = recalcRow({ ...row, [field]: value } as SalaryRow);
        return next;
      })
    );
    setDirtyIds((prev) => new Set(prev).add(userId));
  };

  const commitField = async (userId: number, field: EditableField, value: number | string) => {
    const row = rows.find((r) => r.user_id === userId);
    if (!row) return;

    const payload = {
      user_id: userId,
      deduction: field === 'deduction' ? Number(value) || 0 : row.deduction,
      additional_deduction:
        field === 'additional_deduction' ? Number(value) || 0 : row.additional_deduction,
      note: field === 'note' ? String(value || '') : row.note,
    };

    updateLocalField(userId, field, value);
    setSavingIds((prev) => new Set(prev).add(userId));

    try {
      const updated = await saveSalaryAdjustment(monthStr, payload);
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

  const saveAllDirty = async () => {
    const dirtyRows = rows.filter((r) => dirtyIds.has(r.user_id));
    if (!dirtyRows.length) {
      message.info('Хадгалах өөрчлөлт байхгүй');
      return;
    }
    setSavingAll(true);
    try {
      const data = await saveSalaryAdjustmentsBulk(
        monthStr,
        dirtyRows.map((r) => ({
          user_id: r.user_id,
          deduction: r.deduction,
          additional_deduction: r.additional_deduction,
          note: r.note,
        }))
      );
      setRows(data.rows);
      setDirtyIds(new Set());
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
            <strong>{ids.length}</strong> ажилтанд <strong>{monthStr}</strong> сарын цалингийн
            задаргаа имэйлээр илгээнэ.
          </p>
          {dirtyIds.size > 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 8 }}
              message={`${dirtyIds.size} мөр хадгалаагүй байна — эхлээд хадгална уу.`}
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
            message.success(`${result.sent} хэрэглэгчид цалингийн задаргаа илгээгдлээ`);
          }
        } catch (e) {
          message.error(e instanceof Error ? e.message : 'Илгээхэд алдаа');
        } finally {
          setSending(false);
        }
      },
    });
  };

  const columns: ColumnsType<SalaryRow> = [
    {
      title: '#',
      width: 48,
      fixed: 'left',
      render: (_v, _r, i) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {i + 1}
        </Text>
      ),
    },
    {
      title: 'Ажилтан',
      dataIndex: 'username',
      fixed: 'left',
      width: 150,
      render: (v, r) => (
        <Space size={4}>
          <Text strong style={{ whiteSpace: 'nowrap' }}>
            {v}
          </Text>
          {savedFlash.has(r.user_id) && (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          )}
          {dirtyIds.has(r.user_id) && !savingIds.has(r.user_id) && (
            <Tag color="gold" style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>
              *
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'И-мэйл',
      dataIndex: 'email',
      width: 180,
      ellipsis: true,
      render: (v) =>
        v ? (
          <Text style={{ fontSize: 12 }}>{v}</Text>
        ) : (
          <Tag>Хаяггүй</Tag>
        ),
    },
    {
      title: 'Суурь цалин',
      dataIndex: 'salary',
      width: 120,
      align: 'right',
      render: (v) => <MoneyCell value={v} />,
    },
    {
      title: 'Ажилласан цаг',
      dataIndex: 'totalWorkedHours',
      width: 110,
      align: 'right',
      render: (v) => (
        <Text style={{ fontVariantNumeric: 'tabular-nums' }}>{v} ц</Text>
      ),
    },
    {
      title: 'Тооцох цаг',
      dataIndex: 'totalBillableHours',
      width: 100,
      align: 'right',
      render: (v) => (
        <Text style={{ fontVariantNumeric: 'tabular-nums' }}>{v} ц</Text>
      ),
    },
    {
      title: 'Илүү цаг',
      dataIndex: 'totalOvertimeHours',
      width: 90,
      align: 'right',
      render: (v) => (
        <Text style={{ fontVariantNumeric: 'tabular-nums' }}>{v} ц</Text>
      ),
    },
    {
      title: 'Цагийн олговол',
      dataIndex: 'workPay',
      width: 120,
      align: 'right',
      render: (v) => <MoneyCell value={v} muted />,
    },
    {
      title: 'Илүү цаг олговол',
      dataIndex: 'overtimePay',
      width: 120,
      align: 'right',
      render: (v) => <MoneyCell value={v} muted />,
    },
    {
      title: 'Тасалсан хасалт',
      dataIndex: 'absentDeduction',
      width: 120,
      align: 'right',
      render: (v) => (
        <Text type="danger" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          -{formatMnt(v)}
        </Text>
      ),
    },
    {
      title: (
        <Tooltip title="НДШ, ХХОАТ гэх мэт — дарж засна">
          <span style={{ color: '#d48806' }}>Суутгал ✎</span>
        </Tooltip>
      ),
      dataIndex: 'deduction',
      width: 130,
      render: (v, r) => (
        <EditableMoneyCell
          value={v}
          saving={savingIds.has(r.user_id)}
          onCommit={(next) => commitField(r.user_id, 'deduction', next)}
        />
      ),
    },
    {
      title: (
        <Tooltip title="Бусад нэмэлт суутгал — дарж засна">
          <span style={{ color: '#d48806' }}>Нэмэлт суутгал ✎</span>
        </Tooltip>
      ),
      dataIndex: 'additional_deduction',
      width: 140,
      render: (v, r) => (
        <EditableMoneyCell
          value={v}
          saving={savingIds.has(r.user_id)}
          onCommit={(next) => commitField(r.user_id, 'additional_deduction', next)}
        />
      ),
    },
    {
      title: (
        <Tooltip title="Нягтлангийн тэмдэглэл">
          <span style={{ color: '#389e0d' }}>Тэмдэглэл ✎</span>
        </Tooltip>
      ),
      dataIndex: 'note',
      width: 160,
      render: (v, r) => (
        <EditableNoteCell
          value={v}
          saving={savingIds.has(r.user_id)}
          onCommit={(next) => commitField(r.user_id, 'note', next)}
        />
      ),
    },
    {
      title: 'Нийт олгох',
      dataIndex: 'netPay',
      fixed: 'right',
      width: 130,
      align: 'right',
      render: (v) => (
        <Text strong style={{ color: '#722ed1', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {formatMnt(v)}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ margin: -16 }}>
      {/* Sticky toolbar */}
      <div
        style={{
          position: 'sticky',
          top: 64,
          zIndex: 20,
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Цалин тооцоолол
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Excel шиг засварлана — шар нүдэд дарж суутгал оруулна, blur/Enter-ээр автоматаар хадгална
          </Text>
        </div>
        <Space wrap>
          <DatePicker
            picker="month"
            value={month}
            onChange={(d) => d && setMonth(d)}
            allowClear={false}
          />
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Шинэчлэх
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={saveAllDirty}
            loading={savingAll}
            disabled={dirtyIds.size === 0}
          >
            Бүгдийг хадгалах{dirtyIds.size > 0 ? ` (${dirtyIds.size})` : ''}
          </Button>
          <Button
            type="primary"
            icon={<MailOutlined />}
            loading={sending}
            disabled={!resendConfigured || emailSelectedCount === 0}
            onClick={handleSendBulk}
          >
            Цалингийн задаргаа илгээх ({emailSelectedCount})
          </Button>
        </Space>
      </div>

      <div style={{ padding: '12px 16px 24px' }}>
        {!resendConfigured && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="Resend тохиргоо хийгдээгүй"
            description="road/.env файлд RESEND_API_KEY болон RESEND_FROM тохируулна уу."
          />
        )}

        {/* Summary strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: 12,
          }}
        >
          {[
            { label: 'Нийт ажилласан цаг', value: `${totals.totalWorkedHours} ц`, color: '#1677ff' },
            { label: 'Нийт тооцох цаг', value: `${totals.totalBillableHours} ц`, color: '#13c2c2' },
            { label: 'Суутгал', value: formatMnt(totals.totalDeduction), color: '#fa8c16' },
            {
              label: 'Нэмэлт суутгал',
              value: formatMnt(totals.totalAdditionalDeduction),
              color: '#fa541c',
            },
            { label: 'Нийт олгох', value: formatMnt(totals.totalNetPay), color: '#722ed1' },
            {
              label: 'И-мэйлтэй',
              value: `${totals.withEmailCount} / ${totals.employeeCount}`,
              color: '#52c41a',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderLeft: `3px solid ${item.color}`,
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>{item.label}</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: item.color,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              background: '#fafafa',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text strong>
              {monthStr} — ажилтнуудын цалингийн хүснэгт
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Шар нүд = засварлах боломжтой · Enter / blur = хадгалах
            </Text>
          </div>

          <Table
            rowKey="user_id"
            columns={columns}
            dataSource={rows}
            loading={loading}
            size="small"
            scroll={{ x: 1800, y: 'calc(100vh - 340px)' }}
            pagination={false}
            bordered
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
                title: record.hasEmail ? undefined : 'И-мэйл байхгүй',
              }),
              columnWidth: 40,
            }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#f9f0ff' }}>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <Text strong>Нийт ({rows.length})</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong>{totals.totalWorkedHours} ц</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    <Text strong>{totals.totalBillableHours} ц</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} colSpan={4} />
                  <Table.Summary.Cell index={11} align="right">
                    <Text strong type="warning">
                      {formatMnt(totals.totalDeduction)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={12} align="right">
                    <Text strong type="danger">
                      {formatMnt(totals.totalAdditionalDeduction)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={13} />
                  <Table.Summary.Cell index={14} align="right">
                    <Text strong style={{ color: '#722ed1' }}>
                      {formatMnt(totals.totalNetPay)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </div>

        <style jsx global>{`
          .salary-row-dirty > td {
            background: #fffbe6 !important;
          }
          .salary-row-saving > td {
            opacity: 0.7;
          }
        `}</style>
      </div>
    </div>
  );
}
