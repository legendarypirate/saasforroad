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

export async function fetchOrgTree(): Promise<OrgTreeResponse> {
  const res = await fetch(`${ORG_API}/tree`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Ачаалахад алдаа');
  return json.data;
}

export async function createDepartment(name: string, parentId?: number | null) {
  const res = await fetch(`${ORG_API}/department`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parent_id: parentId ?? null }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data as OrgNode;
}

export async function assignUser(userId: number, parentId?: number | null, positionTitle?: string) {
  const res = await fetch(`${ORG_API}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      parent_id: parentId ?? null,
      position_title: positionTitle,
    }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data as OrgNode;
}

export async function moveNode(nodeId: number, parentId?: number | null, sortOrder?: number) {
  const res = await fetch(`${ORG_API}/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      node_id: nodeId,
      parent_id: parentId ?? null,
      sort_order: sortOrder,
    }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data as OrgNode;
}

export async function updateNode(id: number, data: { name?: string; position_title?: string }) {
  const res = await fetch(`${ORG_API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data as OrgNode;
}

export async function deleteNode(id: number) {
  const res = await fetch(`${ORG_API}/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
}

export async function unassignUser(nodeId: number) {
  const res = await fetch(`${ORG_API}/user-node/${nodeId}`, { method: 'DELETE' });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
}

export function poolId(userId: number) {
  return `pool-${userId}`;
}

export function nodeId(id: number) {
  return `node-${id}`;
}

export function parseDragId(id: string) {
  if (id.startsWith('pool-')) {
    return { type: 'pool' as const, userId: Number(id.slice(5)) };
  }
  if (id.startsWith('node-')) {
    return { type: 'node' as const, nodeId: Number(id.slice(5)) };
  }
  return null;
}
