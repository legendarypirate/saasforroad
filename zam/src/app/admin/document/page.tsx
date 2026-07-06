'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  Breadcrumb,
  Button,
  Input,
  Modal,
  Upload,
  message,
  Tooltip,
} from 'antd';
import OrangeFolderIcon from '@/components/admin/document/OrangeFolderIcon';
import FileTypeIcon, { resolveFileKind } from '@/components/admin/document/FileTypeIcon';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

interface FolderData {
  id: number;
  name: string;
  parent_id: number | null;
}

interface DocumentData {
  id: number;
  name: string;
  file_url: string;
  parent_id: number | null;
}

function resolveFileUrl(record: DocumentData): string {
  return record.file_url.startsWith('http')
    ? record.file_url
    : `${baseUrl}/assets/documents/${record.file_url}`;
}

export default function DocumentTable() {
  const [tableData, setTableData] = useState<FolderData[]>([]);
  const [documentData, setDocumentData] = useState<DocumentData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [fileModalVisible, setFileModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<FolderData[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetch(`${baseUrl}/api/category`)
      .then((res) => res.json())
      .then((data) => data.success && setTableData(data.data));
  }, []);

  useEffect(() => {
    fetch(`${baseUrl}/api/document?parent_id=${currentParentId ?? ''}`)
      .then((res) => res.json())
      .then((data) => data.success && setDocumentData(data.data));
  }, [currentParentId]);

  const handleSave = () => {
    if (!newName) return;

    const url = isEditing
      ? `${baseUrl}/api/category/${editingId}`
      : `${baseUrl}/api/category`;
    const method = isEditing ? 'PATCH' : 'POST';
    const body = { name: newName, parent_id: currentParentId };

    const resetForm = () => {
      setNewName('');
      setIsEditing(false);
      setEditingId(null);
    };

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (isEditing) {
            setTableData((prev) =>
              prev.map((item) => (item.id === editingId ? data.data : item))
            );
          } else {
            setTableData([...tableData, data.data]);
          }
          resetForm();
          setModalVisible(false);
        }
      });
  };

  const resetModal = () => {
    setModalVisible(false);
    setNewName('');
    setIsEditing(false);
    setEditingId(null);
  };

  const handleDeleteFolder = (id: number) => {
    Modal.confirm({
      title: 'Хавтас устгах уу?',
      okText: 'Устгах',
      cancelText: 'Болих',
      okButtonProps: { danger: true },
      onOk: () =>
        fetch(`${baseUrl}/api/category/${id}`, { method: 'DELETE' })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setTableData(tableData.filter((f) => f.id !== id));
              message.success('Хавтас устгагдлаа');
            }
          }),
    });
  };

  const handleDeleteFile = (id: number) => {
    Modal.confirm({
      title: 'Файл устгах уу?',
      okText: 'Устгах',
      cancelText: 'Болих',
      okButtonProps: { danger: true },
      onOk: () =>
        fetch(`${baseUrl}/api/document/${id}`, { method: 'DELETE' })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setDocumentData(documentData.filter((doc) => doc.id !== id));
              message.success('Файл устгагдлаа');
            }
          }),
    });
  };

  const handleUpload = () => {
    if (!uploadFile || !newName) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', newName);
    formData.append('parent_id', String(currentParentId ?? ''));

    fetch(`${baseUrl}/api/document`, { method: 'POST', body: formData })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDocumentData([...documentData, data.data]);
          setFileModalVisible(false);
          setNewName('');
          setUploadFile(null);
          message.success('Файл амжилттай байршуулагдлаа');
        }
      });
  };

  const openFolder = (item: FolderData) => {
    setBreadcrumb([...breadcrumb, item]);
    setCurrentParentId(item.id);
  };

  const openFile = (record: DocumentData) => {
    const url = resolveFileUrl(record);
    const kind = resolveFileKind(record.name, record.file_url);
    if (kind === 'pdf' || kind === 'image') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = record.name;
    link.click();
  };

  const currentFolders = tableData.filter((f) => f.parent_id === currentParentId);
  const hasItems = currentFolders.length > 0 || documentData.length > 0;

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          icon={<ArrowLeftOutlined />}
          disabled={!breadcrumb.length}
          onClick={() => {
            const newCrumb = [...breadcrumb];
            newCrumb.pop();
            setBreadcrumb(newCrumb);
            setCurrentParentId(newCrumb.at(-1)?.id ?? null);
          }}
        >
          Буцах
        </Button>

        <Breadcrumb
          items={[
            {
              title: (
                <button
                  type="button"
                  className="border-0 bg-transparent p-0 cursor-pointer text-inherit"
                  onClick={() => {
                    setBreadcrumb([]);
                    setCurrentParentId(null);
                  }}
                >
                  Баримт бичиг
                </button>
              ),
            },
            ...breadcrumb.map((b) => ({ title: b.name })),
          ]}
        />
      </div>

      <div className="mb-4 flex gap-2">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Хавтас нэмэх
        </Button>
        <Button icon={<UploadOutlined />} onClick={() => setFileModalVisible(true)}>
          Файл байршуулах
        </Button>
      </div>

      {!hasItems ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center text-gray-500">
          Энэ хавтас хоосон байна. Хавтас эсвэл файл нэмнэ үү.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {currentFolders.map((item) => (
            <div
              key={`folder-${item.id}`}
              className="group relative flex cursor-pointer flex-col items-center rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-orange-300 hover:bg-orange-50 hover:shadow-lg"
              onDoubleClick={() => openFolder(item)}
            >
              <Tooltip title="Давхар дарж нээх">
                <div className="mb-3 flex h-[72px] items-center justify-center">
                  <OrangeFolderIcon size={72} />
                </div>
              </Tooltip>
              <div className="w-full truncate text-sm font-medium text-gray-800" title={item.name}>
                {item.name}
              </div>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(item.id);
                }}
              />
            </div>
          ))}

          {documentData.map((record) => {
            const kind = resolveFileKind(record.name, record.file_url);
            return (
              <div
                key={`file-${record.id}`}
                className="group relative flex cursor-pointer flex-col items-center rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg"
                onDoubleClick={() => openFile(record)}
              >
                <Tooltip title="Давхар дарж нээх / татах">
                  <div className="mb-3 flex h-[72px] items-center justify-center">
                    <FileTypeIcon kind={kind} size={72} />
                  </div>
                </Tooltip>
                <div className="w-full truncate text-sm font-medium text-gray-800" title={record.name}>
                  {record.name}
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(record.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={isEditing ? 'Хавтас засах' : 'Хавтас нэмэх'}
        open={modalVisible}
        onCancel={resetModal}
        onOk={handleSave}
        okText="Хадгалах"
        cancelText="Болих"
      >
        <Input
          placeholder="Хавтасны нэр"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </Modal>

      <Modal
        title="Файл байршуулах"
        open={fileModalVisible}
        onCancel={() => {
          setFileModalVisible(false);
          setNewName('');
          setUploadFile(null);
        }}
        onOk={handleUpload}
        okText="Байршуулах"
        cancelText="Болих"
      >
        <Input
          placeholder="Файлын нэр"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="mb-3"
        />
        <Upload
          beforeUpload={(file) => {
            setUploadFile(file);
            if (!newName) setNewName(file.name);
            return false;
          }}
          showUploadList={Boolean(uploadFile)}
          maxCount={1}
          onRemove={() => setUploadFile(null)}
        >
          <Button icon={<UploadOutlined />}>Файл сонгох</Button>
        </Upload>
      </Modal>
    </div>
  );
}
