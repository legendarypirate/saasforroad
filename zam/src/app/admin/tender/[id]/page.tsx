'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Upload,
  Select,
  Input,
  Table,
  Tag,
  message,
  Space,
  Alert,
  Spin,
  Collapse,
} from 'antd';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import {
  DOC_TYPE_OPTIONS,
  STATUS_LABELS,
  fetchTender,
  getDocxDownloadUrl,
  processAllDocuments,
  uploadTenderDocument,
  type TenderDocument,
  type TenderPackage,
} from '@/lib/tender';

export default function TenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [pkg, setPkg] = useState<TenderPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('engineer_certificate');
  const [engineerName, setEngineerName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchTender(id);
    setPkg(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (file: File) => {
    if (!engineerName.trim()) {
      message.warning('Инженерийн нэр оруулна уу');
      return false;
    }
    setUploading(true);
    const ok = await uploadTenderDocument(Number(id), file, docType, engineerName.trim());
    setUploading(false);
    if (ok) {
      message.success('Баримт амжилттай хадгалагдлаа');
      load();
    } else {
      message.error('Upload амжилтгүй');
    }
    return false;
  };

  const handleProcessAll = async () => {
    setProcessing(true);
    try {
      const result = await processAllDocuments(Number(id));
      if (result) {
        setPkg(result);
        const errors = (result.documents || []).filter((d) => d.status === 'error');
        if (errors.length) {
          message.warning(`${errors.length} баримт боловсруулахад алдаа гарлаа`);
        } else {
          message.success('Бүх баримт амжилттай боловсруулагдлаа');
        }
      } else {
        message.error('Боловсруулалт амжилтгүй');
      }
    } catch {
      message.error('Алдаа гарлаа');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !pkg) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  const processedCount = (pkg.documents || []).filter((d) => d.status === 'processed').length;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/admin/tender')}>
          Буцах
        </Button>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Шинэчлэх
        </Button>
      </Space>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
        message="AI боловсруулалт"
        description={
          <>
            Ард нь <strong>OpenAI GPT-4o</strong> (vision) ашиглана — зураг/PDF-ээс мэдээлэл уншиж,
            DOCX тендерийн материал үүсгэнэ. <code>road/.env</code> файлд{' '}
            <code>OPENAI_API_KEY=sk-...</code> тохируулна уу.
          </>
        }
      />

      <Card title={pkg.title} style={{ marginBottom: 20 }}>
        <Descriptions column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="Тендерийн дугаар">{pkg.tender_number || '—'}</Descriptions.Item>
          <Descriptions.Item label="Төсөл">{pkg.project_name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Захиалагч">{pkg.client_name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Төлөв">
            <Tag>{STATUS_LABELS[pkg.status] || pkg.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Боловсруулсан">{processedCount} / {pkg.documents?.length ?? 0}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Баримт upload" style={{ marginBottom: 20 }}>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="Инженерийн овог нэр"
            value={engineerName}
            onChange={(e) => setEngineerName(e.target.value)}
            style={{ width: 220 }}
          />
          <Select
            value={docType}
            onChange={setDocType}
            options={DOC_TYPE_OPTIONS}
            style={{ width: 240 }}
          />
          <Upload beforeUpload={handleUpload} showUploadList={false} accept=".jpg,.jpeg,.png,.pdf">
            <Button icon={<UploadOutlined />} loading={uploading}>
              Баримт нэмэх
            </Button>
          </Upload>
        </Space>
        <p style={{ color: '#888', margin: 0 }}>
          Дэмжигдэх файл: JPG, PNG, PDF (үнэмжлэх, и-монгол лавлагаа, иргэний үнэмлэх)
        </p>
      </Card>

      <Card
        title="Боловсруулсан баримтууд"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={processing}
              disabled={!pkg.documents?.length}
              onClick={handleProcessAll}
            >
              AI-р боловсруулах
            </Button>
            <Button
              icon={<DownloadOutlined />}
              href={getDocxDownloadUrl(pkg.id)}
              disabled={processedCount === 0}
            >
              DOCX татах
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={pkg.documents || []}
          pagination={false}
          columns={[
            { title: 'Инженер', dataIndex: 'engineer_name' },
            {
              title: 'Төрөл',
              dataIndex: 'doc_type',
              render: (v: string) => DOC_TYPE_OPTIONS.find((o) => o.value === v)?.label || v,
            },
            { title: 'Файл', dataIndex: 'original_filename' },
            {
              title: 'Төлөв',
              dataIndex: 'status',
              render: (s: string, row: TenderDocument) => (
                <Space direction="vertical" size={0}>
                  <Tag color={s === 'processed' ? 'success' : s === 'error' ? 'error' : 'default'}>
                    {STATUS_LABELS[s] || s}
                  </Tag>
                  {row.extraction_error && (
                    <span style={{ color: '#cf1322', fontSize: 12 }}>{row.extraction_error}</span>
                  )}
                </Space>
              ),
            },
            {
              title: 'Задласан мэдээлэл',
              render: (_, row: TenderDocument) =>
                row.extracted_data && Object.keys(row.extracted_data).length > 0 ? (
                  <Collapse
                    size="small"
                    items={[
                      {
                        key: '1',
                        label: 'Харах',
                        children: (
                          <pre style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(row.extracted_data, null, 2)}
                          </pre>
                        ),
                      },
                    ]}
                  />
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
