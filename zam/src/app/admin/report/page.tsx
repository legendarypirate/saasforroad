'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Space, Select, Tag, Switch, DatePicker,notification} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { CloseOutlined } from '@ant-design/icons';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Option } = Select;
const { RangePicker } = DatePicker;


// ---- Delivery interface ----
interface Delivery {
  id: number;
  phone: string;
  address: string;
  status: number | string;
  price: number;
  comment: string;
  driver: { username: string };
  createdAt: string;
  merchant: { username: string };
  status_name: {
    status: string;
    color: string;
  };
}

// Delivery Table Columns
const deliveryColumns: ColumnsType<Delivery> = [
  {
    title: 'Үүссэн огноо',
    dataIndex: 'createdAt',
    render: (text: string) => dayjs(text).format('YYYY-MM-DD hh:mm A'),
  },
  {
    title: 'Мерчанд нэр',
    dataIndex: ['merchant', 'username'],
    render: (_, record) => record.merchant?.username || '-',
  },
  { title: 'Утас', dataIndex: 'phone' },
  { title: 'Хаяг', dataIndex: 'address' },
  {
    title: 'Төлөв',
    dataIndex: 'status_name',
    render: (status_name: { status: string; color: string }) => (
      <Tag color={status_name.color}>{status_name.status}</Tag>
    ),
  },
  { title: 'Үнэ', dataIndex: 'price' },
  { title: 'Тайлбар', dataIndex: 'comment' },
  {
    title: 'Жолооч нэр',
    dataIndex: ['driver', 'username'],
    render: (_, record) => record.driver?.username || '-',
  },
  {
    title: 'Үйлдэл',
    key: 'actions',
    render: (_: any, record: Delivery) => (
      <Space>
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => alert(`Edit ${record.merchant?.username}`)}
        >
          Edit
        </Button>
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => alert(`Delete ${record.merchant?.username}`)}
        >
          Delete
        </Button>
      </Space>
    ),
  },
];

// ---- Summary interface ----
type SummaryType = {
  key: string;
  driverName: string;
  totalPrice: number;
  forDriver: number;
  account: number;
  numberDelivery?: number;
};

  
const summaryColumns: ColumnsType<SummaryType> = [
  {
    title: 'Жолоочийн нэр',
    dataIndex: 'driverName',
    key: 'driverName',
  },
  {
    title: 'Нийт хүргэлт',
    dataIndex: 'numberDelivery',
    key: 'numberDelivery',
    render: (value?: number) => value?.toLocaleString() ?? '—',
  },
  {
    title: 'Нийт үнэ',
    dataIndex: 'totalPrice',
    key: 'totalPrice',
    render: (value: number) => value.toLocaleString() + ' ₮',
  },
  {
    title: 'Жолоочид олгох',
    dataIndex: 'forDriver',
    key: 'forDriver',
    render: (value: number) => value.toLocaleString() + ' ₮',
  },
  {
    title: 'Зөрүү',
    dataIndex: 'account',
    key: 'account',
    render: (value: number) => value.toLocaleString() + ' ₮',
  },
];

type OptionType = {
  id: string;
  username: string;
};

export default function DeliveryPage() {
  // Delivery states
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  // Summary & filters states
  const [merchantFilter, setMerchantFilter] = useState<string | null>(null);
  const [secondOptions, setSecondOptions] = useState<OptionType[]>([]);
  const [secondValue, setSecondValue] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [isReportMergeMode, setIsReportMergeMode] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [summary, setSummary] = useState<SummaryType | null>(null);
  const [fetchingSummary, setFetchingSummary] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tableData, setTableData] = useState<SummaryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [deliveryList, setDeliveryList] = useState<Delivery[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Delivery[]) => {
      setSelectedRowKeys(selectedKeys);
  
      const totalPrice = selectedRows.reduce((sum, row) => sum + Number(row.price), 0);
      const numberDelivery = selectedRows.length;
      const driverFee = numberDelivery * 5000;
      const account = totalPrice - driverFee;
      const driverName = selectedRows[0]?.driver?.username || '';
  
      setTableData([
        {
          key: 'summary',
          driverName,
          totalPrice,
          forDriver: driverFee,
          account,
          numberDelivery,
        },
      ]);
    },
  };

  const openNotification = (type: 'success' | 'error', messageText: string) => {
    notification.open({
      message: null,
      description: <div style={{ color: 'white' }}>{messageText}</div>,
      duration: 4,
      showProgress:true,
      style: {
        backgroundColor: type === 'success' ? '#52c41a' : '#ff4d4f',
        borderRadius: '4px',
      },
      closeIcon: <CloseOutlined style={{ color: '#fff' }} />,
    });
  };
  
  const handleReportMerge = async () => {
    if (!selectedRowKeys || selectedRowKeys.length === 0) {
      alert("Please select at least one delivery to report.");
      return;
    }
  
    try {
      // Optional: set loading state
      setLoading(true);
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/report/driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_ids: selectedRowKeys, // Send selected delivery IDs
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to report deliveries.');
      }
  
      // Optional: show success message
      alert(result.message || 'Deliveries reported successfully.');
      openNotification('success', 'Тайлан амжилттай нийллээ.');

      setSelectedRowKeys([]);
  
    } catch (error: any) {
      console.error("Error during report merge:", error);
      alert(`Error: ${error.message || 'Something went wrong.'}`);
      openNotification('error', `Алдаа гарлаа: ${error.message || 'Unknown error'}`);

    } finally {
      // Optional: clear loading state
      setLoading(false);
    }
  };
  
  // Fetch options when merchantFilter changes
  useEffect(() => {
    document.title = 'Тайлан нийлэх';

    const fetchOptions = async () => {
      if (!merchantFilter) {
        setSecondOptions([]);
        return;
      }
      setLoadingOptions(true);
      try {
        const url =
          merchantFilter === '1'
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/user/merchant`
            : `${process.env.NEXT_PUBLIC_API_URL}/api/user/drivers`;

        const response = await fetch(url);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setSecondOptions(result.data);
        } else {
          setSecondOptions([]);
        }
      } catch (error) {
        console.error('Fetch error:', error);
        setSecondOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
    setSecondValue(null);
    setSummary(null);
    setTableData([]);
  }, [merchantFilter]);

  // Fetch driver summary function
  const fetchDriverSummary = async (driverId: string, startDate: string, endDate: string) => {
    setFetchingSummary(true);
    setFetchError(null);
  
    try {
     
    
      const deliveryUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/delivery/findAllWithDate?page=1&limit=100&startDate=${startDate}&endDate=${endDate}&driverId=${driverId}`;
      const deliveryRes = await fetch(deliveryUrl);
  
      if (!deliveryRes.ok) throw new Error(`Delivery API error: ${deliveryRes.status}`);
  
      const deliveryData = await deliveryRes.json();
  
      if (deliveryData.success && Array.isArray(deliveryData.data)) {
        setDeliveryList(deliveryData.data);
  
        // ✅ Collect and log delivery IDs
        const deliveryIds = deliveryData.data.map((delivery: any) => delivery.id);
        console.log("Collected delivery IDs:", deliveryIds);
      } else {
        throw new Error('Invalid delivery data format');
      }
  
    } catch (error: any) {
      setFetchError(`Error: ${error.message || error}`);
      setSummary(null);
      setTableData([]);
      setDeliveryList([]);
    } finally {
      setFetchingSummary(false);
    }
  };
  
  // Auto fetch summary on filters change

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Filters & Controls */}
      <div className="flex gap-4 items-center w-full p-4" style={{ flexShrink: 0 }}>
      <Switch
  checked={isReportMergeMode}
  onChange={(checked) => {
    setIsReportMergeMode(checked);
    setDateRange([null, null]);
  }}
  checkedChildren="Тайлан нийлэх"
  unCheckedChildren="Тайлан харах"
  style={{
    backgroundColor: isReportMergeMode ? undefined : '#52c41a',
    color: 'white',
  }}
/>
        <Select
          value={merchantFilter}
          onChange={(value) => {
            setMerchantFilter(value);
            setSummary(null);
            setFetchError(null);
            setTableData([]);
          }}
          placeholder="Сонгох"
          style={{ width: 150 }}
          allowClear
        >
          <Option value="1">Мерчант</Option>
          <Option value="2">Жолооч</Option>
        </Select>

        <Select
          value={secondValue}
          onChange={(value) => {
            setSecondValue(value);
            setSummary(null);
            setFetchError(null);
            setTableData([]);
          }}
          placeholder="Select Option"
          style={{ width: 200 }}
          loading={loadingOptions}
          allowClear
          disabled={!merchantFilter}
          options={secondOptions.map((o) => ({ label: o.username, value: o.id }))}
        />
            <RangePicker
            value={dateRange}
            onChange={(dates) => {
                setDateRange(dates ?? [null, null]);
                if (dates && dates[0] && dates[1] && secondValue) {
                // secondValue is your driverId, make sure it exists
                fetchDriverSummary(
                    secondValue,
                    dates[0].format('YYYY-MM-DD'),
                    dates[1].format('YYYY-MM-DD')
                );
                }
            }}
            format="YYYY-MM-DD"
/>

      </div>
      <div
  style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    background: '#fff',
    padding: '16px 24px',
    borderTop: '1px solid #ddd',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
  }}
>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
    <Space>
      <div>{selectedRowKeys.length} item(s) selected</div>
      <Button
        type="primary"
        onClick={handleReportMerge}
        disabled={selectedRowKeys.length === 0}
      >
        Тайлан нийлэх
      </Button>
    </Space>
    {fetchError && <div style={{ color: 'red' }}>{fetchError}</div>}
  </div>

  <Table
    columns={summaryColumns}
    dataSource={tableData}
    pagination={false}
    loading={fetchingSummary}
    rowKey="key"
    size="small"
    scroll={{ x: 'max-content' }}
    locale={{ emptyText: 'Тайлан байхгүй байна' }}
  />
</div>

      {/* Delivery Data Table */}
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '0 24px 80px 24px' }}>
        <Table
          rowSelection={rowSelection}
          columns={deliveryColumns}
          dataSource={deliveryList}
          loading={loadingDeliveries}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
          }}
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </div>
    </div>
  );
}
