import React from 'react';

export type FileKind =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'text'
  | 'csv'
  | 'unknown';

interface FileTypeIconProps {
  kind: FileKind;
  size?: number;
}

function extFromName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function resolveFileKind(
  name: string,
  fileUrl?: string,
  mimeType?: string | null,
): FileKind {
  const ext = extFromName(name) || extFromName(fileUrl || '');
  const mime = String(mimeType || '').toLowerCase();

  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext) || mime.includes('wordprocessingml') || mime.includes('msword')) {
    return 'word';
  }
  if (
    ['xls', 'xlsx', 'xlsm', 'ods'].includes(ext) ||
    mime.includes('spreadsheetml') ||
    mime.includes('ms-excel') ||
    mime === 'application/vnd.oasis.opendocument.spreadsheet'
  ) {
    return 'excel';
  }
  if (['ppt', 'pptx', 'odp'].includes(ext) || mime.includes('presentationml')) {
    return 'powerpoint';
  }
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic'].includes(ext)) {
    return 'image';
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || mime.startsWith('video/')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext) || mime.startsWith('audio/')) return 'audio';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (ext === 'csv' || mime === 'text/csv') return 'csv';
  if (['txt', 'md', 'log'].includes(ext) || mime.startsWith('text/')) return 'text';
  return 'unknown';
}


export default function FileTypeIcon({ kind, size = 72 }: FileTypeIconProps) {
  const labelMap: Record<FileKind, { text: string; color: string; sheet: string }> = {
    pdf: { text: 'PDF', color: '#E5252A', sheet: '#FFF5F5' },
    word: { text: 'DOC', color: '#2B579A', sheet: '#F5F8FC' },
    excel: { text: 'XLS', color: '#217346', sheet: '#F4FBF7' },
    powerpoint: { text: 'PPT', color: '#D24726', sheet: '#FFF7F4' },
    image: { text: 'IMG', color: '#7B61FF', sheet: '#F8F8F8' },
    video: { text: 'MP4', color: '#6C5CE7', sheet: '#F8F8F8' },
    audio: { text: 'MP3', color: '#00B894', sheet: '#F8F8F8' },
    archive: { text: 'ZIP', color: '#F39C12', sheet: '#FFFBF2' },
    text: { text: 'TXT', color: '#636E72', sheet: '#F8F8F8' },
    csv: { text: 'CSV', color: '#27AE60', sheet: '#F4FBF7' },
    unknown: { text: 'FILE', color: '#95A5A6', sheet: '#F8F8F8' },
  };

  const { text, color, sheet } = labelMap[kind];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M22 8H48L58 18V68C58 70.2 56.2 72 54 72H22C19.8 72 18 70.2 18 68V12C18 9.8 19.8 8 22 8Z"
        fill={sheet}
        stroke="#D0D5DD"
        strokeWidth="1.5"
      />
      <path d="M48 8V18H58" fill="#E4E7EC" stroke="#D0D5DD" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="24" y="38" width="32" height="20" rx="4" fill={color} />
      <text
        x="40"
        y="52"
        textAnchor="middle"
        fontSize={text.length > 3 ? 9 : 11}
        fontWeight="700"
        fill="#fff"
        fontFamily="system-ui, -apple-system, Segoe UI, sans-serif"
      >
        {text}
      </text>
      {kind === 'excel' && (
        <>
          <line x1="28" y1="24" x2="52" y2="24" stroke="#B7DFC8" strokeWidth="1.5" />
          <line x1="28" y1="30" x2="52" y2="30" stroke="#B7DFC8" strokeWidth="1.5" />
          <line x1="36" y1="20" x2="36" y2="34" stroke="#B7DFC8" strokeWidth="1.5" />
          <line x1="44" y1="20" x2="44" y2="34" stroke="#B7DFC8" strokeWidth="1.5" />
        </>
      )}
      {kind === 'word' && (
        <line x1="28" y1="24" x2="52" y2="24" stroke="#AFC6E8" strokeWidth="2" strokeLinecap="round" />
      )}
      {kind === 'image' && (
        <circle cx="34" cy="28" r="3" fill="#BDC3C7" />
      )}
      {kind === 'image' && (
        <path d="M26 34L32 28L38 34L46 26L52 32" stroke="#BDC3C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
