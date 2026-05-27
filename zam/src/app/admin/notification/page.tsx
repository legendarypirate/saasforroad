"use client";
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

interface CategoryData {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

export default function Notification() {
  const [tableData, setTableData] = useState<CategoryData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    fetch(`${baseUrl}/api/notification`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTableData(data.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        message.error("Мэдээлэл татаж чадсангүй");
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/notification/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setTableData((prev) => prev.filter((item) => item.id !== id));
        message.success("Амжилттай устгалаа");
      } else {
        message.error("Устгах үед алдаа гарлаа");
      }
    } catch (err) {
      console.error(err);
      message.error("Сервертэй холбогдож чадсангүй");
    }
  };

  const handleOpen = (record?: CategoryData) => {
    if (record) {
      setIsEditing(true);
      setEditingId(record.id);
      form.setFieldsValue({
        title: record.title,
        description: record.description,
      });
    } else {
      setIsEditing(false);
      setEditingId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const url = isEditing
        ? `${baseUrl}/api/notification/${editingId}`
        : `${baseUrl}/api/notification`;

      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, user_id: 1 }),
      });

      const data = await res.json();

      if (data.success) {
        message.success("Амжилттай хадгалагдлаа");
        fetchData();
        setIsModalOpen(false);
        form.resetFields();
      } else {
        message.error("Хадгалах үед алдаа гарлаа");
      }
    } catch (err) {
      console.error(err);
      message.error("Мэдээлэл баталгаажуулалт амжилтгүй боллоо");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Гарчиг",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Мэдэгдэл",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Огноо",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      title: "Үйлдэл",
      key: "action",
      render: (_: any, record: CategoryData) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="link" onClick={() => handleOpen(record)}>
            Засах
          </Button>
          <Popconfirm
            title="Устгах уу?"
            onConfirm={() => handleDelete(record.id)}
            okText="Тийм"
            cancelText="Үгүй"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Мэдэгдэл</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpen()}
        >
          Мэдэгдэл илгээх
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={tableData}
        bordered
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={isEditing ? "Мэдэгдэл засах" : "Шинэ мэдэгдэл"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        confirmLoading={loading}
        okText="Илгээх"
        cancelText="Цуцлах"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Гарчиг"
            name="title"
            rules={[{ required: true, message: "Гарчиг заавал оруулна уу" }]}
          >
            <Input placeholder="Enter title" />
          </Form.Item>
          <Form.Item
            label="Мэдэгдэл"
            name="description"
            rules={[{ required: true, message: "Мэдэгдэл оруулна уу" }]}
          >
            <Input.TextArea rows={4} placeholder="Enter description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
