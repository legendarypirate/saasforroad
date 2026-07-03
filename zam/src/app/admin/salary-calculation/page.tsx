'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MailOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import {
  fetchSalaryCalculation,
  formatMnt,
  sendBulkSalaryEmails,
  type SalaryRow,
} from '@/lib/salary';

const { Title, Text } = Typography;

export default function SalaryCalculationPage() {
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [totals, setTotals] = useState({
    totalWorkedHours: 0,
    totalBillableHours: 0,
    totalNetPay: 0,
    employeeCount: 0,
    withEmailCount: 0,
  });
  const [resendConfigured, setResendConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const monthStr = month.format('YYYY-MM');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSalaryCalculation(monthStr);
      setRows(data.rows);
      setTotals(data.totals);
      setResendConfigured(data.resendConfigured);
      setSelectedIds(data.rows.filter((r) => r.hasEmail).map((r) => r.user_id));
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

  const emailSelectedCount = useMemo(
    () => rows.filter((r) => selectedIds.includes(r.user_id) && r.hasEmail).length,
    [rows, selectedIds]
  );

  const handleSendBulk = async () => {
    const ids = rows
      .filter((r) => selectedIds.includes(r.user_id) && r.hasEmail)
      .map((r) => r.user_id);

    if (!ids.length) {
      message.warning('И-мэйл хаягтай хэрэглэгч сонгоно уу');
      return;
    }

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
  };

  const columns: ColumnsType<SalaryRow> = [
    { title: 'Ажилтан', dataIndex: 'username', fixed: 'left', width: 140 },
    {
      title: 'И-мэйл',
      dataIndex: 'email',
      width: 200,
      render: (v, r) =>
        v ? (
          <Text copyable={{ text: v }} style={{ fontSize: 12 }}>
            {v}
          </Text>
        ) : (
          <Tag>Хаяггүй</Tag>
        ),
    },
    {
      title: 'Суурь цалин',
      dataIndex: 'salary',
      width: 120,
      render: (v) => formatMnt(v),
    },
    {
      title: 'Ажилласан цаг',
      dataIndex: 'totalWorkedHours',
      width: 110,
      render: (v) => `${v} ц`,
    },
    {
      title: 'Тооцох цаг',
      dataIndex: 'totalBillableHours',
      width: 100,
      render: (v) => `${v} ц`,
    },
    {
      title: 'Илүү цаг',
      dataIndex: 'totalOvertimeHours',
      width: 90,
      render: (v) => `${v} ц`,
    },
    {
      title: 'Тасалсан',
      dataIndex: 'absentDays',
      width: 80,
      render: (v) => <Text type={v > 0 ? 'danger' : undefined}>{v}</Text>,
    },
    {
      title: 'Цагийн олговол',
      dataIndex: 'workPay',
      width: 120,
      render: (v) => formatMnt(v),
    },
    {
      title: 'Илүү цаг',
      dataIndex: 'overtimePay',
      width: 110,
      render: (v) => formatMnt(v),
    },
    {
      title: 'Хасалт',
      dataIndex: 'absentDeduction',
      width: 100,
      render: (v) => <Text type="danger">-{formatMnt(v)}</Text>,
    },
    {
      title: 'Нийт олгох',
      dataIndex: 'netPay',
      fixed: 'right',
      width: 120,
      render: (v) => <Text strong style={{ color: '#722ed1' }}>{formatMnt(v)}</Text>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Цалин тооцоолол
          </Title>
          <Text type="secondary">
            Ирцийн цагийн дагуу цалин бодож, Resend-ээр цалингийн задаргаа имэйл илгээнэ
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

      {!resendConfigured && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Resend тохиргоо хийгдээгүй"
          description="road/.env файлд RESEND_API_KEY болон RESEND_FROM (баталгаажсан домэйн) тохируулна уу."
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Нийт ажилласан цаг" value={totals.totalWorkedHours} suffix="ц" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Нийт тооцох цаг" value={totals.totalBillableHours} suffix="ц" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Нийт олгох цалин"
              value={totals.totalNetPay}
              suffix="₮"
              formatter={(v) => Number(v).toLocaleString('mn-MN')}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="И-мэйлтэй"
              value={totals.withEmailCount}
              suffix={`/ ${totals.employeeCount}`}
            />
          </Card>
        </Col>
      </Row>

      <Card title={`${monthStr} — ажилтнуудын цалин`}>
        <Table
          rowKey="user_id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 20 }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as number[]),
            getCheckboxProps: (record) => ({
              disabled: !record.hasEmail,
              title: record.hasEmail ? undefined : 'И-мэйл байхгүй',
            }),
          }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Зөвхөн и-мэйл хаягтай хэрэглэгчийг сонгож bulk илгээнэ. Суурь цалинг хэрэглэгчийн профайл дээр тохируулна.
        </Text>
      </Card>
    </div>
  );
}
