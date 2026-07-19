'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  Popconfirm,
  Switch,
  Table,
  Tag,
  message,
} from '@/components/admin/primitives';
import type { ColumnsType } from '@/components/admin/primitives';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@/components/admin/icons';
import {
  EQUIPMENT_CATEGORIES_API,
  fetchEquipmentCategories,
  type EquipmentCategory,
} from '@/lib/equipment';

export default function EquipmentCategoriesPage() {
  const [rows, setRows] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentCategory | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchEquipmentCategories(false));
    } catch {
      message.error('Ангилал татахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Техник — Ангилал';
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCode('');
    setDescription('');
    setSortOrder(String((rows.at(-1)?.sort_order || 0) + 1));
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (row: EquipmentCategory) => {
    setEditing(row);
    setName(row.name);
    setCode(row.code || '');
    setDescription(row.description || '');
    setSortOrder(String(row.sort_order ?? 0));
    setIsActive(row.is_active !== false);
    setModalOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      message.warning('Нэр оруулна уу');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        code: code.trim() || null,
        description: description.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      };
      const url = editing
        ? `${EQUIPMENT_CATEGORIES_API}/${editing.id}`
        : EQUIPMENT_CATEGORIES_API;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        message.error(json.message || 'Хадгалахад алдаа');
        return;
      }
      message.success(editing ? 'Шинэчлэгдлээ' : 'Нэмэгдлээ');
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: EquipmentCategory) => {
    const res = await fetch(`${EQUIPMENT_CATEGORIES_API}/${row.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) {
      message.error(json.message || 'Устгахад алдаа');
      return;
    }
    message.success('Устгагдлаа');
    load();
  };

  const columns: ColumnsType<EquipmentCategory> = [
    { title: 'Эрэмбэ', dataIndex: 'sort_order', width: 90 },
    { title: 'Нэр', dataIndex: 'name' },
    { title: 'Код', dataIndex: 'code', width: 140, render: (v) => v || '—' },
    {
      title: 'Тайлбар',
      dataIndex: 'description',
      render: (v) => v || '—',
    },
    {
      title: 'Төлөв',
      dataIndex: 'is_active',
      width: 110,
      render: (v) => (
        <Tag color={v ? 'green' : 'default'}>{v ? 'Идэвхтэй' : 'Идэвхгүй'}</Tag>
      ),
    },
    {
      title: 'Үйлдэл',
      key: 'actions',
      width: 140,
      render: (_, row) => (
        <div className="flex gap-1">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm title="Устгах уу?" onConfirm={() => remove(row)} okText="Тийм" cancelText="Үгүй">
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Экскаватор, Дэвсэгч гэх мэт ангиллыг энд бүртгэж, техникийн формд сонгоно
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Ангилал нэмэх
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={false}
        />
      </div>

      <Modal
        title={editing ? 'Ангилал засах' : 'Ангилал нэмэх'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={save}
        confirmLoading={saving}
        okText="Хадгалах"
        cancelText="Болих"
      >
        <div className="space-y-3 pt-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Нэр *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Жишээ: Экскаватор"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Код</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="excavator"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Тайлбар</label>
            <Input.TextArea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Эрэмбэ</label>
            <Input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Идэвхтэй</span>
            <Switch checked={isActive} onChange={setIsActive} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
