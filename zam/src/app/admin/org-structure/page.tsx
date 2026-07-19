'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from '@/components/admin/primitives';
import { PlusOutlined, UserOutlined } from '@/components/admin/icons';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  OrgChartTree,
  DragPreviewCard,
  DraggablePoolUser,
} from '@/components/admin/OrgChartView';
import {
  assignUser,
  createDepartment,
  deleteNode,
  fetchOrgTree,
  findNodeInTree,
  findUserDepthInTree,
  moveNode,
  parseDragId,
  unassignUser,
  updateNode,
  type OrgNode,
  type OrgUser,
} from '@/lib/orgStructure';

const { Text } = Typography;

export default function OrgStructurePage() {
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [unassigned, setUnassigned] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDrag, setActiveDrag] = useState<{
    label: string;
    sub?: string;
    depth?: number;
  } | null>(null);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptParentId, setDeptParentId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [deptForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrgTree();
      setTree(data.tree);
      setUnassigned(data.unassigned);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ачаалахад алдаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Байгууллагын бүтэц';
    load();
  }, [load]);

  const rootId = tree[0]?.node_type === 'department' ? tree[0].id : null;

  const handleDragStart = (event: DragStartEvent) => {
    const parsed = parseDragId(String(event.active.id));
    if (!parsed) return;

    if (parsed.type === 'pool') {
      const user = unassigned.find((u) => u.id === parsed.userId);
      if (user) setActiveDrag({ label: user.username, sub: user.position, depth: 0 });
      return;
    }

    const node = findNodeInTree(tree, parsed.nodeId);
    if (!node) return;

    if (node.node_type === 'department') {
      setActiveDrag({ label: node.name, sub: 'Хэлтэс' });
    } else {
      setActiveDrag({
        label: node.user?.username || node.name,
        sub: node.position_title || undefined,
        depth: findUserDepthInTree(tree, node.id),
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeParsed = parseDragId(String(active.id));
    const overParsed = parseDragId(String(over.id));
    if (!activeParsed || !overParsed || overParsed.type !== 'node') return;

    const target = findNodeInTree(tree, overParsed.nodeId);
    if (!target) return;

    try {
      if (activeParsed.type === 'pool') {
        if (target.node_type === 'department' || target.node_type === 'user') {
          await assignUser(activeParsed.userId, target.id);
          message.success('Ажилтан нэмэгдлээ');
        }
      } else if (activeParsed.type === 'node') {
        if (activeParsed.nodeId === overParsed.nodeId) return;
        const moving = findNodeInTree(tree, activeParsed.nodeId);
        if (!moving) return;

        if (target.node_type === 'department' || target.node_type === 'user') {
          await moveNode(activeParsed.nodeId, target.id);
          message.success('Шилжүүлэгдлээ');
        }
      }
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const openAddDepartment = (parentId: number | null = rootId) => {
    setDeptParentId(parentId);
    deptForm.resetFields();
    setDeptModalOpen(true);
  };

  const submitDepartment = async () => {
    const values = await deptForm.validateFields();
    try {
      await createDepartment(values.name, deptParentId);
      message.success('Хэлтэс нэмэгдлээ');
      setDeptModalOpen(false);
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const handleEdit = (node: OrgNode) => {
    setEditingNode(node);
    editForm.setFieldsValue({
      name: node.node_type === 'department' ? node.name : undefined,
      position_title: node.position_title || node.user?.position || '',
    });
    setEditModalOpen(true);
  };

  const handleRemove = async (node: OrgNode) => {
    try {
      if (node.node_type === 'user') {
        await unassignUser(node.id);
      } else {
        await deleteNode(node.id);
      }
      message.success('Амжилттай');
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const submitEdit = async () => {
    if (!editingNode) return;
    const values = await editForm.validateFields();
    try {
      await updateNode(editingNode.id, {
        name: editingNode.node_type === 'department' ? values.name : undefined,
        position_title: values.position_title,
      });
      message.success('Хадгалагдлаа');
      setEditModalOpen(false);
      await load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Text type="secondary">
            Хязгааргүй түвшний мод бүтэц. Ажилтны доор ажилтан чирж байрлуулна. Zoom: +/- товч эсвэл Ctrl+гүйлгэх.
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openAddDepartment(rootId)}>
          Хэлтэс нэмэх
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Spin size="large" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
            <Card
              size="small"
              title={
                <Space>
                  <UserOutlined />
                  Бүртгэлтэй
                  <Tag>{unassigned.length}</Tag>
                </Space>
              }
              styles={{ body: { maxHeight: 640, overflowY: 'auto' } }}
            >
              {unassigned.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Бүгд байрласан" />
              ) : (
                unassigned.map((user) => <DraggablePoolUser key={user.id} user={user} />)
              )}
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
                Хэлтэс эсвэл аливаа ажилтан дээр чирнэ — түвшин автоматаар тооцогдоно
              </Text>
            </Card>

            <div>
              {tree.length === 0 ? (
                <Empty description="Бүтэц байхгүй">
                  <Button type="primary" onClick={() => openAddDepartment(null)}>
                    Эхлэх
                  </Button>
                </Empty>
              ) : (
                <OrgChartTree
                  tree={tree}
                  onEdit={handleEdit}
                  onRemove={handleRemove}
                  onAddChild={(id) => openAddDepartment(id)}
                />
              )}
            </div>
          </div>

          <DragOverlay>
            {activeDrag ? (
              <DragPreviewCard
                label={activeDrag.label}
                sub={activeDrag.sub}
                depth={activeDrag.depth}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Modal
        title="Шинэ хэлтэс"
        open={deptModalOpen}
        onCancel={() => setDeptModalOpen(false)}
        onOk={submitDepartment}
        okText="Хадгалах"
        cancelText="Болих"
      >
        <Form form={deptForm} layout="vertical">
          <Form.Item name="name" label="Хэлтсийн нэр" rules={[{ required: true }]}>
            <Input placeholder="Жишээ: Техникийн хэлтэс" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingNode?.node_type === 'department' ? 'Хэлтэс засах' : 'Ажилтан засах'}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={submitEdit}
        okText="Хадгалах"
        cancelText="Болих"
      >
        <Form form={editForm} layout="vertical">
          {editingNode?.node_type === 'department' && (
            <Form.Item name="name" label="Хэлтсийн нэр" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          )}
          {editingNode?.node_type === 'user' && (
            <Form.Item name="position_title" label="Албан тушаал">
              <Input placeholder="Жишээ: Ахлах инженер" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
