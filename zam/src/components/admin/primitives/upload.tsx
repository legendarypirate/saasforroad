'use client';

import React, { useRef } from 'react';

type UploadProps = {
  children?: React.ReactNode;
  beforeUpload?: (file: File) => boolean | void | Promise<boolean | void>;
  showUploadList?: boolean;
  accept?: string;
  multiple?: boolean;
  className?: string;
  maxCount?: number;
  onRemove?: () => void;
  fileList?: unknown[];
  onChange?: (info: { file: File; fileList: File[] }) => void;
  [key: string]: unknown;
};

export function Upload({
  children,
  beforeUpload,
  accept,
  multiple,
  className,
  onChange,
}: UploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const result = await beforeUpload?.(file);
          if (result !== false) {
            onChange?.({ file, fileList: [file] });
          }
          e.target.value = '';
        }}
      />
      <span
        className={className}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        {children}
      </span>
    </>
  );
}
