'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Select } from '@/components/admin/primitives';

export type InternalWorker = {
  id: number;
  username: string;
  position?: string | null;
  phone?: string | null;
  department_number?: string | null;
};

export function workerOptionLabel(u: InternalWorker) {
  const bits = [u.username];
  if (u.position) bits.push(u.position);
  if (u.department_number) bits.push(`№${u.department_number}`);
  return bits.join(' · ');
}

let cachedWorkers: InternalWorker[] | null = null;
let inflight: Promise<InternalWorker[]> | null = null;

export async function loadInternalWorkers(): Promise<InternalWorker[]> {
  if (cachedWorkers) return cachedWorkers;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`);
    const json = await res.json();
    const list = json.success
      ? Array.isArray(json.data)
        ? json.data
        : json.data?.rows || []
      : [];
    cachedWorkers = list.map((u: InternalWorker) => ({
      id: Number(u.id),
      username: u.username,
      position: u.position,
      phone: u.phone,
      department_number: u.department_number,
    }));
    return cachedWorkers!;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

type WorkerSelectProps = {
  value?: number | null;
  onChange?: (userId: number | null, worker?: InternalWorker | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
};

/** Searchable select of internal HR users (ажилчид). */
export function WorkerSelect({
  value,
  onChange,
  placeholder = 'Ажилтан сонгох',
  allowClear = true,
  style,
  disabled,
}: WorkerSelectProps) {
  const [workers, setWorkers] = useState<InternalWorker[]>(cachedWorkers || []);
  const [loading, setLoading] = useState(!cachedWorkers);

  useEffect(() => {
    let alive = true;
    loadInternalWorkers()
      .then((list) => {
        if (alive) setWorkers(list);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const options = useMemo(
    () =>
      workers.map((u) => ({
        value: u.id,
        label: workerOptionLabel(u),
      })),
    [workers]
  );

  return (
    <Select
      showSearch
      allowClear={allowClear}
      loading={loading}
      disabled={disabled}
      placeholder={placeholder}
      style={{ width: '100%', ...style }}
      value={value ?? undefined}
      optionFilterProp="label"
      options={options}
      onChange={(id) => {
        if (id == null) {
          onChange?.(null, null);
          return;
        }
        const w = workers.find((u) => u.id === Number(id)) || null;
        onChange?.(Number(id), w);
      }}
    />
  );
}
