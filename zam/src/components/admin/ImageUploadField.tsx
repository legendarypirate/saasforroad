'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { uploadHomepageImage, resolveImageUrl } from '@/lib/homepage';
import { uiToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type ImageUploadFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  className?: string;
  previewClassName?: string;
};

export default function ImageUploadField({
  value,
  onChange,
  label,
  className,
  previewClassName,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      uiToast.error('Зөвхөн зураг файл оруулна уу');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      uiToast.error('Зураг 8MB-аас их байна');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadHomepageImage(file);
      if (url) {
        onChange?.(url);
        uiToast.success('Зураг Cloudinary-д хадгалагдлаа');
      } else {
        uiToast.error('Зураг байршуулахад алдаа гарлаа');
      }
    } catch (err) {
      uiToast.error(err instanceof Error ? err.message : 'Зураг байршуулахад алдаа гарлаа');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!uploading) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors',
          dragOver
            ? 'border-primary bg-primary/5 dark:border-[var(--neon-green)] dark:bg-[var(--neon-green)]/10'
            : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-8 animate-spin text-primary dark:text-[var(--neon-green)]" />
            <p className="text-sm font-medium text-foreground">Cloudinary руу илгээж байна...</p>
          </>
        ) : (
          <>
            <div className="flex size-12 items-center justify-center rounded-full bg-background shadow-sm">
              <ImagePlus className="size-6 text-primary dark:text-[var(--neon-green)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {label ? `${label} сонгох` : 'Зураг сонгох эсвэл чирж оруулах'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP · хамгийн ихдээ 8MB</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-1 pointer-events-none">
              <Upload className="size-4" />
              Файл сонгох
            </Button>
          </>
        )}
      </div>

      {value && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImageUrl(value)}
            alt={label || 'Зураг'}
            className={cn(
              'h-24 w-36 shrink-0 rounded-lg border border-border object-cover',
              previewClassName,
            )}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-xs text-muted-foreground" title={value}>
              {value}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                Солих
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={uploading}
                onClick={() => onChange?.('')}
              >
                <Trash2 className="size-4" />
                Устгах
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
