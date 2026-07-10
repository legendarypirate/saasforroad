'use client';

import React, { useRef } from 'react';

import { cn } from '@/lib/utils';

export type UploadFile = {
  uid: string;
  name: string;
  status?: 'done' | 'uploading' | 'error' | 'removed';
  url?: string;
  originFileObj?: File;
};

type UploadChangeInfo = {
  file: File | UploadFile;
  fileList: UploadFile[];
};

type UploadProps = {
  children?: React.ReactNode;
  /** Return false to skip auto-upload; file is still added to the list (antd-compatible). */
  beforeUpload?: (file: File) => boolean | void | Promise<boolean | void>;
  showUploadList?: boolean;
  accept?: string;
  multiple?: boolean;
  className?: string;
  maxCount?: number;
  listType?: 'text' | 'picture' | 'picture-card';
  fileList?: UploadFile[];
  onRemove?: (file: UploadFile) => void | boolean;
  onChange?: (info: UploadChangeInfo) => void;
  [key: string]: unknown;
};

function toUploadFile(file: File, index = 0): UploadFile {
  return {
    uid: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    name: file.name,
    status: 'done',
    originFileObj: file,
    url: URL.createObjectURL(file),
  };
}

export function Upload({
  children,
  beforeUpload,
  accept,
  multiple,
  className,
  maxCount = 1,
  listType,
  fileList = [],
  onRemove,
  onChange,
}: UploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isCard = listType === 'picture-card';

  const emitFiles = (files: File[]) => {
    const mapped = files.map((f, i) => toUploadFile(f, i));
    const next =
      maxCount === 1 ? mapped.slice(0, 1) : [...fileList, ...mapped].slice(0, maxCount);
    onChange?.({ file: mapped[0], fileList: next });
  };

  return (
    <div className={cn(isCard && 'flex flex-wrap gap-2')}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept || 'image/*'}
        multiple={multiple && maxCount !== 1}
        onChange={async (e) => {
          const picked = Array.from(e.target.files || []);
          e.target.value = '';
          if (!picked.length) return;

          const allowed: File[] = [];
          for (const file of picked) {
            // antd: false = don't auto-upload, but still keep the file in the list
            const result = await beforeUpload?.(file);
            if (result === false || result === undefined || result === true) {
              allowed.push(file);
            }
          }
          if (allowed.length) emitFiles(allowed);
        }}
      />

      {isCard &&
        fileList.map((f) => (
          <div
            key={f.uid}
            className="relative flex size-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30"
          >
            {f.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.url} alt={f.name} className="size-full object-cover" />
            ) : (
              <span className="px-1 text-center text-[10px] text-muted-foreground">{f.name}</span>
            )}
            <button
              type="button"
              className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-[10px] text-white"
              onClick={(ev) => {
                ev.stopPropagation();
                const keep = onRemove?.(f);
                if (keep === false) return;
                onChange?.({
                  file: f,
                  fileList: fileList.filter((x) => x.uid !== f.uid),
                });
              }}
            >
              ×
            </button>
          </div>
        ))}

      {(fileList.length < maxCount || !isCard) && (
        <span
          className={cn(
            className,
            isCard &&
              'flex size-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          {children}
        </span>
      )}
    </div>
  );
}
