'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  assignUser,
  createDepartment,
  deleteNode,
  fetchOrgTree,
  moveNode,
  nodeId,
  parseDragId,
  poolId,
  unassignUser,
  updateNode,
  type OrgNode,
  type OrgUser,
} from '@/lib/orgStructure';

const { Title, Text } = Typography;

function UserAvatar({ user, size = 32 }: { user: OrgUser; size?: number }) {
  if (user.profile_image) {
    return <Avatar src={user.profile_image} size={size} />;
  }
  return (
    <Avatar size={size} style={{ background: '#722ed1' }}>
      {user.username?.charAt(0)?.toUpperCase() || '?'}
    </Avatar>
  );
}

function DraggablePoolUser({ user }: { user: OrgUser }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: poolId(user.id),
    data: { type: 'pool', user },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #f0f0f0',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <UserAvatar user={user} size={28} />
      <div style={{ minWidth: 0 }}>
        <Text strong ellipsis style={{ display: 'block' }}>
          {user.username}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
          {user.position || user.roleRecord?.name || '—'}
        </Text>
      </div>
    </div>
  );
}

function DragPreview({ label, sub }: { label: string; sub?: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        border: '1px solid #d9d9d9',
        minWidth: 160,
      }}
    >
      <Text strong>{label}</Text>
      {sub && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {sub}
          </Text>
        </div>
      )}
    </div>
  );
}

function OrgTreeNode({
  node,
  depth,
  onRefresh,
  onAddChild,
  onEdit,
}: {
  node: OrgNode;
  depth: number;
  onRefresh: () => void;
  onAddChild: (parentId: number) => void;
  onEdit: (node: OrgNode) => void;
}) {
  const router = useRouter();
  const isDept = node.node_type === 'department';
  const dropId = nodeId(node.id);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: { type: 'department', nodeId: node.id },
    disabled: !isDept,
  });

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: dropId,
    data: { type: 'node', node },
  });

  const handleRemove = async () => {
    try {
      if (node.node_type === 'user') {
        await unassignUser(node.id);
      } else {
        await deleteNode(node.id);
      }
      message.success('Амжилттай');
      onRefresh();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Алдаа');
    }
  };

  const cardStyle: React.CSSProperties = {
    marginBottom: 8,
    marginLeft: depth * 24,
    padding: '10px 12px',
    borderRadius: 10,
    border: isOver ? '2px solid #722ed1' : '1px solid #f0f0f0',
    background: isDept ? '#faf5ff' : '#fff',
    opacity: isDragging ? 0.45 : 1,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    cursor: isDept ? 'grab' : 'default',
  };

  return (
    <div>
      <div
        ref={(el) => {
          if (isDept) setDropRef(el);
          setDragRef(el);
        }}
        style={cardStyle}
        {...listeners}
        {...attributes}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Space>
            {isDept ? (
              <ApartmentOutlined style={{ color: '#722ed1', fontSize: 18 }} />
            ) : node.user ? (
              <UserAvatar user={node.user} />
            ) : (
              <Avatar icon={<UserOutlined />} />
            )}
            <div>
              <Text strong>{isDept ? node.name : node.user?.username || node.name}</Text>
              {!isDept && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {node.position_title || node.user?.position || '—'}
                  </Text>
                </div>
              )}
              {isDept && node.parent_id === null && <Tag color="purple">Үндсэн</Tag>}
            </div>
          </Space>

          <Space size={4}>
            {isDept && (
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.id);
                }}
              />
            )}
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node);
              }}
            />
            {!isDept && node.user && (
              <Button
                type="text"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/admin/user/${node.user!.id}`);
                }}
              >
                Профайл
              </Button>
            )}
            <Popconfirm
              title={isDept ? 'Хэлтэс болон дэд бүтцийг устгах уу?' : 'Бүтцээс хасах уу?'}
              onConfirm={handleRemove}
              okText="Тийм"
              cancelText="Үгүй"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        </div>
      </div>

      {node.children?.map((child) => (
        <OrgTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          onRefresh={onRefresh}
          onAddChild={onAddChild}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default function OrgStructurePage() {
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [unassigned, setUnassigned] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDrag, setActiveDrag] = useState<{ label: string; sub?: string } | null>(null);
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

  const findNode = (nodes: OrgNode[], id: number): OrgNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children?.length) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const parsed = parseDragId(String(event.active.id));
    if (!parsed) return;

    if (parsed.type === 'pool') {
      const user = unassigned.find((u) => u.id === parsed.userId);
      if (user) setActiveDrag({ label: user.username, sub: user.position });
      return;
    }

    const node = findNode(tree, parsed.nodeId);
    if (!node) return;
    setActiveDrag({
      label: node.node_type === 'department' ? node.name : node.user?.username || node.name,
      sub: node.node_type === 'user' ? node.position_title || undefined : 'Хэлтэс',
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeParsed = parseDragId(String(active.id));
    const overParsed = parseDragId(String(over.id));
    if (!activeParsed || !overParsed || overParsed.type !== 'node') return;

    const targetNode = findNode(tree, overParsed.nodeId);
    if (!targetNode || targetNode.node_type !== 'department') {
      message.warning('Зөвхөн хэлтэс дээр байрлуулна');
      return;
    }

    const targetParentId = overParsed.nodeId;

    try {
      if (activeParsed.type === 'pool') {
        await assignUser(activeParsed.userId, targetParentId);
        message.success('Ажилтан нэмэгдлээ');
      } else if (activeParsed.type === 'node') {
        if (activeParsed.nodeId === targetParentId) return;
        await moveNode(activeParsed.nodeId, targetParentId);
        message.success('Шилжүүлэгдлээ');
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

  const openEdit = (node: OrgNode) => {
    setEditingNode(node);
    editForm.setFieldsValue({
      name: node.node_type === 'department' ? node.name : undefined,
      position_title: node.position_title || node.user?.position || '',
    });
    setEditModalOpen(true);
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
          <Title level={4} style={{ margin: 0 }}>
            Байгууллагын бүтэц
          </Title>
          <Text type="secondary">
            Хэлтэс үүсгэж, бүртгэлтэй хэрэглэгчийг чирж байрлуулна
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
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, minHeight: 520 }}>
            <Card
              size="small"
              title={
                <Space>
                  <UserOutlined />
                  Бүтэцэд ороогүй
                  <Tag>{unassigned.length}</Tag>
                </Space>
              }
              styles={{ body: { maxHeight: 560, overflowY: 'auto' } }}
            >
              {unassigned.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Бүх хэрэглэгч байрласан"
                />
              ) : (
                unassigned.map((user) => <DraggablePoolUser key={user.id} user={user} />)
              )}
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Хэрэглэгчийг баруун талын хэлтэс дээр чирнэ үү
              </Text>
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <ApartmentOutlined />
                  Бүтэц
                </Space>
              }
              styles={{ body: { maxHeight: 560, overflowY: 'auto' } }}
            >
              {tree.length === 0 ? (
                <Empty description="Бүтэц байхгүй">
                  <Button type="primary" onClick={() => openAddDepartment(null)}>
                    Эхлэх
                  </Button>
                </Empty>
              ) : (
                tree.map((node) => (
                  <OrgTreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    onRefresh={load}
                    onAddChild={(id) => openAddDepartment(id)}
                    onEdit={openEdit}
                  />
                ))
              )}
            </Card>
          </div>

          <DragOverlay>
            {activeDrag ? <DragPreview label={activeDrag.label} sub={activeDrag.sub} /> : null}
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
          <Form.Item name="name" label="Хэлтсийн нэр" rules={[{ required: true, message: 'Нэр оруулна уу' }]}>
            <Input placeholder="Жишээ: Техникийн хэлтэс" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingNode?.node_type === 'department' ? 'Хэлтэс засах' : 'Албан тушаал засах'}
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
