import { tenantHeaders } from '@/lib/tenant';

export const ORG_API = `${process.env.NEXT_PUBLIC_API_URL}/api/org_structure`;

export interface OrgUser {
  id: number;
  username: string;
  position?: string;
  profile_image?: string;
  phone?: string;
  email?: string;
  role?: string;
  roleRecord?: { id: number; name: string };
}

export interface OrgNode {
  id: number;
  parent_id: number | null;
  name: string;
  node_type: 'department' | 'user';
  user_id?: number | null;
  position_title?: string | null;
  sort_order: number;
  user?: OrgUser | null;
  children?: OrgNode[];
}

export interface OrgTreeResponse {
  tree: OrgNode[];
  unassigned: OrgUser[];
}

export const DEPTH_COLORS = [
  '#fa8c16',
  '#1890ff',
  '#52c41a',
  '#722ed1',
  '#eb2f96',
  '#13c2c2',
  '#fa541c',
  '#2f54eb',
];

export function depthColor(depth: number) {
  return DEPTH_COLORS[depth % DEPTH_COLORS.length];
}

export function depthLabel(depth: number) {
  return `Түвшин ${depth + 1}`;
}

export async function fetchOrgTree(): Promise<OrgTreeResponse> {
  const res = await fetch(`${ORG_API}/tree`, { headers: tenantHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Ачаалахад алдаа');
  return json.data;
}

export async function createDepartment(name: string, parentId?: number | null) {
  const res = await fetch(`${ORG_API}/department`, {
    method: 'POST',
    headers: tenantHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name, parent_id: parentId ?? null }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data as OrgNode;
}

export async function assignUser(
  userId: number,
  parentId: number,
  positionTitle?: string
) {
  const res = await fetch(`${ORG_API}/assign`, {
    method: 'POST',
    headers: tenantHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      user_id: userId,
      parent_id: parentId,
      position_title: positionTitle,
    }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data as OrgNode;
}

export async function moveNode(
  nodeId: number,
  parentId: number | null,
  sortOrder?: number
) {
  const res = await fetch(`${ORG_API}/move`, {
    method: 'PUT',
    headers: tenantHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      node_id: nodeId,
      parent_id: parentId,
      sort_order: sortOrder,
    }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data as OrgNode;
}

export async function updateNode(
  id: number,
  data: { name?: string; position_title?: string }
) {
  const res = await fetch(`${ORG_API}/${id}`, {
    method: 'PATCH',
    headers: tenantHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data as OrgNode;
}

export async function deleteNode(id: number) {
  const res = await fetch(`${ORG_API}/${id}`, { method: 'DELETE', headers: tenantHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
}

export async function unassignUser(nodeId: number) {
  const res = await fetch(`${ORG_API}/user-node/${nodeId}`, { method: 'DELETE', headers: tenantHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
}

export function poolId(userId: number) {
  return `pool-${userId}`;
}

export function nodeId(id: number) {
  return `node-${id}`;
}

export type DragTarget =
  | { type: 'pool'; userId: number }
  | { type: 'node'; nodeId: number };

export function parseDragId(id: string): DragTarget | null {
  if (id.startsWith('pool-')) {
    return { type: 'pool', userId: Number(id.slice(5)) };
  }
  if (id.startsWith('node-')) {
    return { type: 'node', nodeId: Number(id.slice(5)) };
  }
  return null;
}

export function splitChildren(node: OrgNode) {
  const children = node.children ?? [];
  return {
    users: children.filter((c) => c.node_type === 'user'),
    departments: children.filter((c) => c.node_type === 'department'),
  };
}

export function findNodeInTree(nodes: OrgNode[], id: number): OrgNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findNodeInTree(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findUserDepthInTree(nodes: OrgNode[], nodeId: number): number {
  function walkUserBranch(node: OrgNode, depth: number): number | null {
    if (node.id === nodeId) return depth;
    for (const child of node.children ?? []) {
      if (child.node_type === 'user') {
        const found = walkUserBranch(child, depth + 1);
        if (found !== null) return found;
      }
    }
    return null;
  }

  function walk(nodes: OrgNode[]): number | null {
    for (const n of nodes) {
      if (n.node_type === 'user') {
        const found = walkUserBranch(n, 0);
        if (found !== null) return found;
      }
      if (n.node_type === 'department') {
        for (const child of n.children ?? []) {
          if (child.node_type === 'user') {
            const found = walkUserBranch(child, 0);
            if (found !== null) return found;
          }
          if (child.node_type === 'department') {
            const found = walk([child]);
            if (found !== null) return found;
          }
        }
      }
    }
    return null;
  }

  return walk(nodes) ?? 0;
}
