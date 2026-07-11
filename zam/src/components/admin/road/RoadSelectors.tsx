'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/components/admin/primitives';
import { fetchRoadList, type Alignment, type RoadProject } from '@/lib/roadEngineering';

export function useRoadProjects() {
  const [projects, setProjects] = useState<RoadProject[]>([]);
  useEffect(() => {
    fetchRoadList<RoadProject>('projects').then(setProjects).catch(() => setProjects([]));
  }, []);
  return projects;
}

export function useAlignments(projectId?: number) {
  const [alignments, setAlignments] = useState<Alignment[]>([]);
  useEffect(() => {
    fetchRoadList<Alignment>('alignments', projectId ? { project_id: projectId } : undefined)
      .then(setAlignments)
      .catch(() => setAlignments([]));
  }, [projectId]);
  return alignments;
}

export function ProjectSelect({
  value,
  onChange,
  allowClear = true,
}: {
  value?: number;
  onChange: (id?: number) => void;
  allowClear?: boolean;
}) {
  const projects = useRoadProjects();
  return (
    <Select
      style={{ minWidth: 220 }}
      placeholder="Төсөл сонгох"
      allowClear={allowClear}
      value={value}
      onChange={(v) => onChange(v ? Number(v) : undefined)}
      options={projects.map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }))}
    />
  );
}

export function AlignmentSelect({
  projectId,
  value,
  onChange,
}: {
  projectId?: number;
  value?: number;
  onChange: (id?: number) => void;
}) {
  const alignments = useAlignments(projectId);
  return (
    <Select
      style={{ minWidth: 220 }}
      placeholder="Тэнхлэг сонгох"
      allowClear
      value={value}
      onChange={(v) => onChange(v ? Number(v) : undefined)}
      options={alignments.map((a) => ({ value: a.id, label: `${a.name} (${a.type})` }))}
    />
  );
}
