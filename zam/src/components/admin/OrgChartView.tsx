'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Dropdown, Tag, Typography } from '@/components/admin/primitives';
import {
  ApartmentOutlined,
  CompressOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  UserOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@/components/admin/icons';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  depthColor,
  depthLabel,
  nodeId,
  poolId,
  splitChildren,
  type OrgNode,
  type OrgUser,
} from '@/lib/orgStructure';
import '@/styles/org-chart.css';

const { Text } = Typography;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function UserAvatar({ user, size = 48 }: { user: OrgUser; size?: number }) {
  if (user.profile_image) {
    return <Avatar src={user.profile_image} size={size} />;
  }
  return (
    <Avatar size={size} style={{ background: '#722ed1', fontSize: size * 0.4 }}>
      {user.username?.charAt(0)?.toUpperCase() || '?'}
    </Avatar>
  );
}

export function DraggablePoolUser({ user }: { user: OrgUser }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: poolId(user.id),
    data: { type: 'pool', user },
  });

  return (
    <div
      ref={setNodeRef}
      className={`org-pool-user${isDragging ? ' is-dragging' : ''}`}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      }}
      {...listeners}
      {...attributes}
    >
      <UserAvatar user={user} size={28} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <Text strong ellipsis style={{ display: 'block', fontSize: 13 }}>
          {user.username}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
          {user.position || '—'}
        </Text>
      </div>
    </div>
  );
}

function PersonCard({
  node,
  depth,
  onEdit,
  onRemove,
}: {
  node: OrgNode;
  depth: number;
  onEdit: (node: OrgNode) => void;
  onRemove: (node: OrgNode) => void;
}) {
  const router = useRouter();
  const user = node.user;
  const color = depthColor(depth);

  const { setNodeRef, isOver } = useDroppable({
    id: nodeId(node.id),
    data: { type: 'node', node },
  });

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: nodeId(node.id),
    data: { type: 'node', node },
  });

  const menuItems = [
    { key: 'edit', icon: <EditOutlined />, label: 'Засах', onClick: () => onEdit(node) },
    ...(user
      ? [{ key: 'profile', label: 'Профайл', onClick: () => router.push(`/admin/user/${user.id}`) }]
      : []),
    {
      key: 'remove',
      icon: <DeleteOutlined />,
      label: 'Бүтцээс хасах',
      danger: true,
      onClick: () => onRemove(node),
    },
  ];

  return (
    <div
      ref={(el) => {
        setDragRef(el);
        setNodeRef(el);
      }}
      className={['org-person-card', isDragging ? 'is-dragging' : '', isOver ? 'is-over' : ''].join(' ')}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        borderColor: color,
        boxShadow: isOver ? `0 0 0 2px ${color}55` : undefined,
      }}
      {...listeners}
      {...attributes}
    >
      <div className="org-card-actions">
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>

      {user ? <UserAvatar user={user} /> : <Avatar size={48} icon={<UserOutlined />} />}
      <Text strong style={{ fontSize: 13, marginTop: 8, lineHeight: 1.3 }}>
        {user?.username || node.name}
      </Text>
      <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.2 }}>
        {node.position_title || user?.position || '—'}
      </Text>
      <span className="org-level-badge" style={{ background: `${color}18`, color, borderColor: `${color}55` }}>
        {depthLabel(depth)}
      </span>
    </div>
  );
}

function UserBranch({
  node,
  depth,
  onEdit,
  onRemove,
}: {
  node: OrgNode;
  depth: number;
  onEdit: (node: OrgNode) => void;
  onRemove: (node: OrgNode) => void;
}) {
  const { users } = splitChildren(node);

  return (
    <li>
      <PersonCard node={node} depth={depth} onEdit={onEdit} onRemove={onRemove} />
      {users.length > 0 && (
        <ul>
          {users.map((child) => (
            <UserBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function DepartmentNode({
  node,
  isRoot,
  userDepthStart,
  onEdit,
  onRemove,
  onAddChild,
}: {
  node: OrgNode;
  isRoot?: boolean;
  userDepthStart: number;
  onEdit: (node: OrgNode) => void;
  onRemove: (node: OrgNode) => void;
  onAddChild: (parentId: number) => void;
}) {
  const { users, departments } = splitChildren(node);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: nodeId(node.id),
    data: { type: 'node', node },
  });

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: nodeId(node.id),
    data: { type: 'node', node },
  });

  const deptMenu = [
    { key: 'add', icon: <PlusOutlined />, label: 'Дэд хэлтэс', onClick: () => onAddChild(node.id) },
    { key: 'edit', icon: <EditOutlined />, label: 'Засах', onClick: () => onEdit(node) },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Устгах', danger: true, onClick: () => onRemove(node) },
  ];

  return (
    <div
      className="org-dept-block"
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      }}
    >
      <div
        ref={(el) => {
          setDropRef(el);
          setDragRef(el);
        }}
        className={`org-dept-header${isRoot ? ' is-root' : ''}${isOver ? ' is-over' : ''}`}
        {...listeners}
        {...attributes}
      >
        <ApartmentOutlined style={{ marginRight: 8 }} />
        {node.name}
        {isRoot && (
          <Tag color="gold" style={{ marginLeft: 8, border: 'none' }}>
            Үндсэн
          </Tag>
        )}
        <Dropdown menu={{ items: deptMenu }} trigger={['click']}>
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            style={{ color: '#fff', marginLeft: 8 }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>

      {users.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 12, padding: '8px 0', display: 'block' }}>
          Ажилтан чирж хэлтэс дээр байрлуулна уу
        </Text>
      ) : (
        <ul className="org-tree">
          {users.map((userNode) => (
            <UserBranch
              key={userNode.id}
              node={userNode}
              depth={userDepthStart}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}

      {departments.length > 0 && (
        <div className="org-sub-depts">
          <div className="org-tier-label">ДЭД ХЭЛТЭС</div>
          <ul className="org-tree">
            {departments.map((dept) => (
              <li key={dept.id}>
                <DepartmentNode
                  node={dept}
                  userDepthStart={0}
                  onEdit={onEdit}
                  onRemove={onRemove}
                  onAddChild={onAddChild}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ZoomToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
}) {
  return (
    <div className="org-zoom-toolbar">
      <Button size="small" icon={<ZoomOutOutlined />} onClick={onZoomOut} />
      <Text style={{ minWidth: 48, textAlign: 'center', fontSize: 12 }}>
        {Math.round(zoom * 100)}%
      </Text>
      <Button size="small" icon={<ZoomInOutlined />} onClick={onZoomIn} />
      <Button size="small" onClick={onReset}>
        100%
      </Button>
      <Button size="small" icon={<CompressOutlined />} onClick={onFit}>
        Багасгах
      </Button>
      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
        Ctrl + гүйлгэх = zoom
      </Text>
    </div>
  );
}

export function OrgChartTree({
  tree,
  onEdit,
  onRemove,
  onAddChild,
}: {
  tree: OrgNode[];
  onEdit: (node: OrgNode) => void;
  onRemove: (node: OrgNode) => void;
  onAddChild: (parentId: number) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);

  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP)), []);
  const resetZoom = useCallback(() => setZoom(1), []);
  const fitZoom = useCallback(() => setZoom(0.6), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => clampZoom(z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
  }, []);

  return (
    <div className="org-chart-panel">
      <ZoomToolbar
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoom}
        onFit={fitZoom}
      />

      <div className="org-legend">
        <div className="org-legend-item">
          <span className="org-legend-dot" style={{ background: '#722ed1' }} />
          <span>Хэлтэс</span>
        </div>
        {['Түвшин 1', 'Түвшин 2', 'Түвшин 3', 'Түвшин 4+'].map((label, i) => (
          <div key={label} className="org-legend-item">
            <span className="org-legend-dot" style={{ background: depthColor(i) }} />
            <span>{label}</span>
          </div>
        ))}
        <Text type="secondary" style={{ fontSize: 11 }}>
          Хязгааргүй түвшин — ажилтны доор ажилтан байрлуулж болно
        </Text>
      </div>

      <div ref={viewportRef} className="org-zoom-viewport" onWheel={handleWheel}>
        <div
          className="org-zoom-content"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          <ul className="org-tree org-tree-root">
            {tree.map((node) => (
              <li key={node.id}>
                <DepartmentNode
                  node={node}
                  isRoot={node.parent_id === null}
                  userDepthStart={0}
                  onEdit={onEdit}
                  onRemove={onRemove}
                  onAddChild={onAddChild}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function DragPreviewCard({
  label,
  sub,
  depth,
}: {
  label: string;
  sub?: string;
  depth?: number;
}) {
  const color = depth !== undefined ? depthColor(depth) : '#722ed1';
  return (
    <div
      className="org-person-card"
      style={{
        borderColor: color,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        cursor: 'grabbing',
      }}
    >
      <Text strong>{label}</Text>
      {sub && (
        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
          {sub}
        </Text>
      )}
      {depth !== undefined && (
        <span className="org-level-badge" style={{ background: `${color}18`, color, borderColor: `${color}55` }}>
          {depthLabel(depth)}
        </span>
      )}
    </div>
  );
}
