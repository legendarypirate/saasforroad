'use client';

import React, { useEffect, useState } from "react";
import {
  FolderOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Breadcrumb,
  Button,
  Input,
  Modal,
  Table,
  Upload,
  message,
  Row,
} from "antd";

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

export default function DocumentTable() {
  const [tableData, setTableData] = useState<FolderData[]>([]);
  const [documentData, setDocumentData] = useState<DocumentData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [fileModalVisible, setFileModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
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
    fetch(`${baseUrl}/api/document?parent_id=${currentParentId ?? ""}`)
      .then((res) => res.json())
      .then((data) => data.success && setDocumentData(data.data));
  }, [currentParentId]);

  const handleSave = () => {
    if (!newName) return;

    const url = isEditing
      ? `${baseUrl}/api/category/${editingId}`
      : `${baseUrl}/api/category`;
    const method = isEditing ? "PATCH" : "POST";

    const body = { name: newName, parent_id: currentParentId };

    const resetForm = () => {
      setNewName("");
      setIsEditing(false);
      setEditingId(null);
    };

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
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
    setNewName("");
    setIsEditing(false);
    setEditingId(null);
  };

  const handleDeleteFolder = (id: number) => {
    fetch(`${baseUrl}/api/category/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTableData(tableData.filter((f) => f.id !== id));
        }
      });
  };

  const handleDeleteFile = (id: number) => {
    fetch(`${baseUrl}/api/document/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDocumentData(documentData.filter((doc) => doc.id !== id));
        }
      });
  };

  const handleUpload = () => {
    if (!uploadFile || !newName) return;
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("name", newName);
    formData.append("parent_id", String(currentParentId ?? ""));

    fetch(`${baseUrl}/api/document`, { method: "POST", body: formData })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDocumentData([...documentData, data.data]);
          setFileModalVisible(false);
          setNewName("");
          setUploadFile(null);
        }
      });
  };

  const currentFolders = tableData.filter((f) => f.parent_id === currentParentId);

  const baseFileUrl = `${baseUrl}/assets/documents/`;

const renderFileAction = (record: DocumentData) => {
  // Normalize file_url to full URL if it is not already absolute
  const url = record.file_url.startsWith("http")
    ? record.file_url
    : baseFileUrl + record.file_url;

  const fileUrl = url.toLowerCase();
  const isPDF = fileUrl.endsWith(".pdf");
  const isExcel = fileUrl.endsWith(".xls") || fileUrl.endsWith(".xlsx");

  return (
    <div className="flex gap-2 items-center">
      {isPDF ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          View PDF
        </a>
      ) : isExcel ? (
        <a href={url} download>
          Download Excel
        </a>
      ) : (
        <a href={url} download>
          Download
        </a>
      )}

      <Button
        type="link"
        danger
        icon={<DeleteOutlined />}
        onClick={() => handleDeleteFile(record.id)}
      />
    </div>
  );
};

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center gap-3">
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
          Back
        </Button>

        <Breadcrumb>
          {breadcrumb.map((b) => (
            <Breadcrumb.Item key={b.id}>{b.name}</Breadcrumb.Item>
          ))}
        </Breadcrumb>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
          {currentFolders.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-xl transition-all relative cursor-pointer hover:bg-blue-50"
              onDoubleClick={() => {
                setBreadcrumb([...breadcrumb, item]);
                setCurrentParentId(item.id);
              }}
            >
              <FolderOutlined style={{ fontSize: 72, color: "#1890ff" }} />
              <div className="mt-3 font-medium truncate">{item.name}</div>
              <DeleteOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(item.id);
                }}
                style={{
                  color: "red",
                  position: "absolute",
                  top: 10,
                  right: 10,
                  fontSize: 20,
                }}
              />
            </div>
          ))}
        </div>
      </Row>

      <div className="mb-4 flex gap-2">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Add Folder
        </Button>
        <Button icon={<UploadOutlined />} onClick={() => setFileModalVisible(true)}>
          Upload File
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={documentData}
        columns={[
          {
            title: "File Name",
            dataIndex: "name",
          },
          {
            title: "Action",
            render: (_, record) => renderFileAction(record),
          },
        ]}
      />

      <Modal
        title={isEditing ? "Edit Folder" : "Add Folder"}
        open={modalVisible}
        onCancel={resetModal}
        onOk={handleSave}
      >
        <Input
          placeholder="Folder Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </Modal>

      <Modal
        title="Upload File"
        open={fileModalVisible}
        onCancel={() => setFileModalVisible(false)}
        onOk={handleUpload}
      >
        <Input
          placeholder="File Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="mb-3"
        />
        <Upload
          beforeUpload={(file) => {
            setUploadFile(file);
            return false;
          }}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>
      </Modal>
    </div>
  );
}
