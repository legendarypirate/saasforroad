'use client';

import React from 'react';
import { Avatar, Tooltip } from 'antd';

export interface StaffMember {
  id: number | string;
  name: string;
  role?: string | null;
  email?: string | null;
}

const AVATAR_COLORS = ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2', '#2f54eb', '#a0d911'];

function getInitial(name: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface StaffAvatarGroupProps {
  members: StaffMember[];
  maxCount?: number;
  size?: number;
  showEmpty?: boolean;
}

export function parseStaffText(staff?: string | null): StaffMember[] {
  if (!staff?.trim()) return [];
  return staff
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name, index) => ({ id: `staff-${index}`, name }));
}

export function buildMembersFromProject(data: {
  users?: Array<{
    id: number;
    username?: string;
    email?: string;
    position?: string;
    invite?: { inviteStatus?: string; role?: string };
  }>;
  staff?: string;
  engineer?: string;
}): StaffMember[] {
  const members: StaffMember[] = [];
  const seen = new Set<string>();

  const addMember = (member: StaffMember) => {
    const key = member.name.toLowerCase();
    if (!member.name || seen.has(key)) return;
    seen.add(key);
    members.push(member);
  };

  const linkedUsers = data.users ?? [];
  const accepted = linkedUsers.filter((u) => {
    const invite = (u as { invite?: { inviteStatus?: string } }).invite;
    return invite?.inviteStatus === 'accepted';
  });
  const pool = accepted.length > 0 ? accepted : linkedUsers;

  pool.forEach((u) => {
    const invite = (u as { invite?: { inviteStatus?: string; role?: string } }).invite;
    addMember({
      id: u.id,
      name: u.username || u.email || `Хэрэглэгч #${u.id}`,
      email: u.email,
      role: invite?.role || u.position,
    });
  });

  parseStaffText(data.staff).forEach(addMember);

  if (data.engineer?.trim()) {
    addMember({ id: 'engineer', name: data.engineer.trim(), role: 'Инженер' });
  }

  return members;
}

export function StaffAvatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <Avatar size={size} style={{ backgroundColor: getColor(name), fontWeight: 600 }}>
      {getInitial(name)}
    </Avatar>
  );
}

export default function StaffAvatarGroup({
  members,
  maxCount = 5,
  size = 36,
  showEmpty = false,
}: StaffAvatarGroupProps) {
  if (members.length === 0) {
    if (!showEmpty) return null;
    return (
      <Avatar size={size} style={{ backgroundColor: '#d9d9d9', color: '#8c8c8c' }}>
        ?
      </Avatar>
    );
  }

  return (
    <Avatar.Group max={{ count: maxCount, style: { color: '#f56a00', backgroundColor: '#fde3cf' } }}>
      {members.map((member) => (
        <Tooltip
          key={member.id}
          title={
            <span>
              {member.name}
              {member.role ? ` · ${member.role}` : ''}
            </span>
          }
        >
          <Avatar size={size} style={{ backgroundColor: getColor(member.name), fontWeight: 600 }}>
            {getInitial(member.name)}
          </Avatar>
        </Tooltip>
      ))}
    </Avatar.Group>
  );
}
