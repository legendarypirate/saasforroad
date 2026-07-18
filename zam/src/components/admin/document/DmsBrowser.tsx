'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@/components/admin/icons';
import {
  Breadcrumb,
  Button,
  DatePicker,
  Drawer,
  Input,
  Modal,
  Select,
  Tag,
  Tooltip,
  Upload,
  message,
} from '@/components/admin/primitives';
import OrangeFolderIcon from '@/components/admin/document/OrangeFolderIcon';
import FileTypeIcon, { resolveFileKind } from '@/components/admin/document/FileTypeIcon';
import { resolveAssetUrl } from '@/lib/assetUrl';
import {
  DOC_STATUSES,
  DOC_TYPES,
  createDmsApi,
  docStatusMeta,
  docTypeLabel,
  formatFileSize,
  isExpired,
  isExpiringSoon,
  type DmsDocument,
  type DmsFolder,
  type DmsScope,
  type DmsStats,
} from '@/lib/dms';
import { cn } from '@/lib/utils';
import { tenantHeaders } from '@/lib/tenant';

const API = process.env.NEXT_PUBLIC_API_URL || '';

type ProjectOpt = { id: number; name: string };
type ViewMode = 'grid' | 'list';

type UploadForm = {
  name: string;
  doc_type: string;
  doc_number: string;
  status: string;
  project_id: string;
  tags: string;
  issuer: string;
  issue_date: string;
  expiry_date: string;
  description: string;
  notes: string;
};

const emptyUpload = (): UploadForm => ({
  name: '',
  doc_type: 'other',
  doc_number: '',
  status: 'active',
  project_id: '',
  tags: '',
  issuer: '',
  issue_date: '',
  expiry_date: '',
  description: '',
  notes: '',
});

function fileUrl(doc: DmsDocument) {
  return resolveAssetUrl(doc.file_url) || '';
}

function openOrDownload(doc: DmsDocument) {
  const url = fileUrl(doc);
  if (!url) {
    message.error('Файлын холбоос олдсонгүй');
    return;
  }
  const kind = resolveFileKind(doc.name, doc.file_url);
  if (kind === 'pdf' || kind === 'image') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = doc.name;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.click();
}

type DmsBrowserProps = {
  scope?: DmsScope;
  title?: string;
  subtitle?: string;
};

export default function DmsBrowser({
  scope = 'company',
  title = 'Баримт бичиг',
  subtitle = 'Замын компанийн баримтын сан — гэрээ, зураг, зөвшөөрөл, чанар, гүйцэтгэл',
}: DmsBrowserProps) {
  const dmsApi = useMemo(() => createDmsApi(scope), [scope]);
  const [folders, setFolders] = useState<DmsFolder[]>([]);
  const [files, setFiles] = useState<DmsDocument[]>([]);
  const [stats, setStats] = useState<DmsStats | null>(null);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<DmsFolder[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [q, setQ] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterExpiring, setFilterExpiring] = useState(false);

  const [folderModal, setFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDesc, setFolderDesc] = useState('');
  const [editingFolder, setEditingFolder] = useState<DmsFolder | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<UploadForm>(emptyUpload());
  const [uploading, setUploading] = useState(false);

  const [detail, setDetail] = useState<DmsDocument | null>(null);
  const [detailForm, setDetailForm] = useState<UploadForm>(emptyUpload());
  const [savingDetail, setSavingDetail] = useState(false);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);

  const isFiltering = Boolean(q || filterType || filterStatus || filterProject || filterExpiring);

  const loadStats = useCallback(async () => {
    const data = await dmsApi.stats();
    setStats(data);
  }, [dmsApi]);

  const loadFolderContents = useCallback(async () => {
    setLoading(true);
    try {
      const [folderRows, fileRows] = await Promise.all([
        isFiltering ? Promise.resolve([]) : dmsApi.listFolders(currentParentId),
        dmsApi.listDocuments({
          parent_id: isFiltering ? undefined : currentParentId,
          q: q || undefined,
          doc_type: filterType || undefined,
          status: filterStatus || undefined,
          project_id: filterProject || undefined,
          expiring: filterExpiring || undefined,
          search_all: isFiltering,
        }),
      ]);
      setFolders(folderRows);
      setFiles(fileRows);
    } finally {
      setLoading(false);
    }
  }, [dmsApi, currentParentId, q, filterType, filterStatus, filterProject, filterExpiring, isFiltering]);

  useEffect(() => {
    document.title = title;
    loadStats();
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(`${API}/api/project`, {
      headers: tenantHeaders(token ? { Authorization: token } : undefined),
    })
      .then((r) => r.json())
      .then((j) => {
        const rows = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
        setProjects(rows.map((p: ProjectOpt) => ({ id: p.id, name: p.name })));
      })
      .catch(() => undefined);
  }, [loadStats, title]);

  useEffect(() => {
    loadFolderContents();
  }, [loadFolderContents]);

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: String(p.id), label: p.name })),
    [projects],
  );

  const goRoot = () => {
    setBreadcrumb([]);
    setCurrentParentId(null);
    setQ('');
    setFilterType('');
    setFilterStatus('');
    setFilterProject('');
    setFilterExpiring(false);
  };

  const openFolder = (folder: DmsFolder) => {
    setQ('');
    setFilterType('');
    setFilterStatus('');
    setFilterProject('');
    setFilterExpiring(false);
    setBreadcrumb((prev) => [...prev, folder]);
    setCurrentParentId(folder.id);
  };

  const goCrumb = (index: number) => {
    if (index < 0) {
      goRoot();
      return;
    }
    const next = breadcrumb.slice(0, index + 1);
    setBreadcrumb(next);
    setCurrentParentId(next.at(-1)?.id ?? null);
    setQ('');
    setFilterType('');
    setFilterStatus('');
    setFilterProject('');
    setFilterExpiring(false);
  };

  const saveFolder = async () => {
    if (!folderName.trim()) {
      message.warning('Хавтасны нэр оруулна уу');
      return;
    }
    if (editingFolder) {
      const res = await dmsApi.updateFolder(editingFolder.id, {
        name: folderName.trim(),
        description: folderDesc.trim() || undefined,
      });
      if (!res.success) {
        message.error(res.message || 'Засахад алдаа гарлаа');
        return;
      }
      message.success('Хавтас шинэчлэгдлээ');
    } else {
      const res = await dmsApi.createFolder({
        name: folderName.trim(),
        parent_id: currentParentId,
        description: folderDesc.trim() || undefined,
      });
      if (!res.success) {
        message.error(res.message || 'Үүсгэхэд алдаа гарлаа');
        return;
      }
      message.success('Хавтас үүслээ');
    }
    setFolderModal(false);
    setFolderName('');
    setFolderDesc('');
    setEditingFolder(null);
    loadFolderContents();
    loadStats();
  };

  const deleteFolder = (folder: DmsFolder) => {
    Modal.confirm({
      title: `"${folder.name}" хавтсыг устгах уу?`,
      okText: 'Устгах',
      cancelText: 'Болих',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await dmsApi.deleteFolder(folder.id);
        if (!res.success) {
          message.error(res.message || 'Устгахад алдаа гарлаа');
          return;
        }
        message.success('Хавтас устгагдлаа');
        loadFolderContents();
        loadStats();
      },
    });
  };

  const submitUpload = async () => {
    if (!uploadFile || !uploadForm.name.trim()) {
      message.warning('Файл болон нэр шаардлагатай');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('name', uploadForm.name.trim());
      fd.append('parent_id', currentParentId == null ? '' : String(currentParentId));
      fd.append('doc_type', uploadForm.doc_type);
      fd.append('doc_number', uploadForm.doc_number);
      fd.append('status', uploadForm.status);
      fd.append('project_id', uploadForm.project_id);
      fd.append('tags', uploadForm.tags);
      fd.append('issuer', uploadForm.issuer);
      fd.append('issue_date', uploadForm.issue_date);
      fd.append('expiry_date', uploadForm.expiry_date);
      fd.append('description', uploadForm.description);
      fd.append('notes', uploadForm.notes);

      const res = await dmsApi.upload(fd);
      if (!res.success) {
        message.error(res.message || 'Байршуулахад алдаа гарлаа');
        return;
      }
      message.success('Баримт амжилттай байршуулагдлаа');
      setUploadOpen(false);
      setUploadFile(null);
      setUploadForm(emptyUpload());
      loadFolderContents();
      loadStats();
    } finally {
      setUploading(false);
    }
  };

  const openDetail = (doc: DmsDocument) => {
    setDetail(doc);
    setDetailForm({
      name: doc.name || '',
      doc_type: doc.doc_type || 'other',
      doc_number: doc.doc_number || '',
      status: doc.status || 'active',
      project_id: doc.project_id ? String(doc.project_id) : '',
      tags: doc.tags || '',
      issuer: doc.issuer || '',
      issue_date: doc.issue_date || '',
      expiry_date: doc.expiry_date || '',
      description: doc.description || '',
      notes: doc.notes || '',
    });
    setReplaceFile(null);
  };

  const saveDetail = async () => {
    if (!detail) return;
    setSavingDetail(true);
    try {
      if (replaceFile) {
        const fd = new FormData();
        fd.append('file', replaceFile);
        fd.append('name', detailForm.name.trim());
        const res = await dmsApi.replace(detail.id, fd);
        if (!res.success) {
          message.error(res.message || 'Файл солиход алдаа гарлаа');
          return;
        }
      }
      const res = await dmsApi.update(detail.id, {
        name: detailForm.name.trim(),
        doc_type: detailForm.doc_type,
        doc_number: detailForm.doc_number || null,
        status: detailForm.status,
        project_id: detailForm.project_id || null,
        tags: detailForm.tags || null,
        issuer: detailForm.issuer || null,
        issue_date: detailForm.issue_date || null,
        expiry_date: detailForm.expiry_date || null,
        description: detailForm.description || null,
        notes: detailForm.notes || null,
      });
      if (!res.success) {
        message.error(res.message || 'Хадгалахад алдаа гарлаа');
        return;
      }
      message.success('Баримт шинэчлэгдлээ');
      setDetail(null);
      loadFolderContents();
      loadStats();
    } finally {
      setSavingDetail(false);
    }
  };

  const deleteFile = (doc: DmsDocument) => {
    Modal.confirm({
      title: `"${doc.name}" файлыг устгах уу?`,
      okText: 'Устгах',
      cancelText: 'Болих',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await dmsApi.remove(doc.id);
        if (!res.success) {
          message.error(res.message || 'Устгахад алдаа гарлаа');
          return;
        }
        message.success('Файл устгагдлаа');
        if (detail?.id === doc.id) setDetail(null);
        loadFolderContents();
        loadStats();
      },
    });
  };

  const hasItems = folders.length > 0 || files.length > 0;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingFolder(null);
              setFolderName('');
              setFolderDesc('');
              setFolderModal(true);
            }}
          >
            Хавтас
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => {
              setUploadForm(emptyUpload());
              setUploadFile(null);
              setUploadOpen(true);
            }}
          >
            Баримт байршуулах
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Нийт баримт', value: stats.total },
            { label: 'Идэвхтэй', value: stats.active },
            { label: 'Ноорог', value: stats.draft },
            { label: 'Архив', value: stats.archived },
            { label: 'Хавтас', value: stats.folders },
            {
              label: 'Хугацаа ойртож буй',
              value: stats.expiring,
              warn: stats.expiring > 0,
              onClick: () => {
                setFilterExpiring(true);
                setQ('');
                setFilterType('');
                setFilterStatus('');
                setFilterProject('');
              },
            },
          ].map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className={cn(
                'rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors',
                card.onClick && 'hover:border-primary/40 hover:bg-muted/40',
                card.warn && 'border-amber-500/40 bg-amber-500/5',
              )}
            >
              <div className="text-xs text-muted-foreground">{card.label}</div>
              <div className={cn('mt-1 text-2xl font-semibold tabular-nums', card.warn && 'text-amber-700 dark:text-amber-300')}>
                {card.value}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card p-3">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Нэр, дугаар, шошго, гаргагч…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <Select
          allowClear
          placeholder="Төрөл"
          value={filterType || undefined}
          onChange={(v) => setFilterType(v || '')}
          options={DOC_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          className="w-[140px] shrink-0"
        />
        <Select
          allowClear
          placeholder="Төлөв"
          value={filterStatus || undefined}
          onChange={(v) => setFilterStatus(v || '')}
          options={DOC_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          className="w-[130px] shrink-0"
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Төсөл"
          value={filterProject || undefined}
          onChange={(v) => setFilterProject(v || '')}
          options={projectOptions}
          className="w-[180px] shrink-0"
        />
        <Button
          type={filterExpiring ? 'primary' : 'default'}
          className="shrink-0"
          onClick={() => setFilterExpiring((v) => !v)}
        >
          Хугацаа ойртож буй
        </Button>
        {isFiltering && (
          <Button
            className="shrink-0"
            onClick={() => {
              setQ('');
              setFilterType('');
              setFilterStatus('');
              setFilterProject('');
              setFilterExpiring(false);
            }}
          >
            Цэвэрлэх
          </Button>
        )}
        <div className="ml-auto flex shrink-0 gap-1">
          <Button type={viewMode === 'grid' ? 'primary' : 'default'} onClick={() => setViewMode('grid')}>
            Сүлжээ
          </Button>
          <Button type={viewMode === 'list' ? 'primary' : 'default'} onClick={() => setViewMode('list')}>
            Жагсаалт
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          icon={<ArrowLeftOutlined />}
          disabled={!breadcrumb.length || isFiltering}
          onClick={() => goCrumb(breadcrumb.length - 2)}
        >
          Буцах
        </Button>
        <Breadcrumb
          items={[
            {
              title: (
                <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-inherit" onClick={goRoot}>
                  Баримтын сан
                </button>
              ),
            },
            ...breadcrumb.map((b, i) => ({
              title: (
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 text-inherit"
                  onClick={() => goCrumb(i)}
                >
                  {b.name}
                </button>
              ),
            })),
            ...(isFiltering
              ? [{ title: q ? `Хайлт: “${q}”` : 'Шүүлтүүр' }]
              : []),
          ]}
        />
        {loading && <span className="text-xs text-muted-foreground">Ачаалж байна…</span>}
      </div>

      {!hasItems && !loading ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 py-16 text-center text-muted-foreground">
          {isFiltering
            ? 'Шүүлтүүрт тохирох баримт олдсонгүй.'
            : 'Энэ хавтас хоосон байна. Хавтас эсвэл баримт нэмнэ үү.'}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {folders.map((folder) => (
            <div
              key={`f-${folder.id}`}
              className="group relative flex cursor-pointer flex-col items-center rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-orange-400/60 hover:bg-muted/50 hover:shadow-md"
              onDoubleClick={() => openFolder(folder)}
            >
              <Tooltip title={folder.description || 'Давхар дарж нээх'}>
                <div className="mb-2 flex h-[64px] items-center justify-center">
                  <OrangeFolderIcon size={64} />
                </div>
              </Tooltip>
              <div className="w-full truncate text-sm font-medium" title={folder.name}>
                {folder.name}
              </div>
              {folder.is_system && (
                <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Систем</span>
              )}
              <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolder(folder);
                    setFolderName(folder.name);
                    setFolderDesc(folder.description || '');
                    setFolderModal(true);
                  }}
                />
                {!folder.is_system && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFolder(folder);
                    }}
                  />
                )}
              </div>
            </div>
          ))}

          {files.map((doc) => {
            const kind = resolveFileKind(doc.name, doc.file_url);
            const expired = isExpired(doc.expiry_date);
            const soon = isExpiringSoon(doc.expiry_date);
            return (
              <div
                key={`d-${doc.id}`}
                className="group relative flex cursor-pointer flex-col items-center rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-sky-400/60 hover:bg-muted/50 hover:shadow-md"
                onDoubleClick={() => openOrDownload(doc)}
                onClick={() => openDetail(doc)}
              >
                <div className="mb-2 flex h-[64px] items-center justify-center">
                  <FileTypeIcon kind={kind} size={64} />
                </div>
                <div className="w-full truncate text-sm font-medium" title={doc.name}>
                  {doc.name}
                </div>
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  <Tag className="m-0 text-[10px]">{docTypeLabel(doc.doc_type)}</Tag>
                  {expired ? (
                    <Tag color="red" className="m-0 text-[10px]">
                      Дууссан
                    </Tag>
                  ) : soon ? (
                    <Tag color="orange" className="m-0 text-[10px]">
                      Ойртож буй
                    </Tag>
                  ) : null}
                </div>
                <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(doc);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Нэр</th>
                <th className="px-4 py-3 font-medium">Төрөл</th>
                <th className="px-4 py-3 font-medium">Төлөв</th>
                <th className="px-4 py-3 font-medium">Төсөл</th>
                <th className="px-4 py-3 font-medium">Хувилбар</th>
                <th className="px-4 py-3 font-medium">Хугацаа</th>
                <th className="px-4 py-3 font-medium">Хэмжээ</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {folders.map((folder) => (
                <tr
                  key={`lf-${folder.id}`}
                  className="cursor-pointer border-b border-border/70 hover:bg-muted/30"
                  onDoubleClick={() => openFolder(folder)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      <OrangeFolderIcon size={28} />
                      {folder.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">Хавтас</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingFolder(folder);
                        setFolderName(folder.name);
                        setFolderDesc(folder.description || '');
                        setFolderModal(true);
                      }}
                    />
                  </td>
                </tr>
              ))}
              {files.map((doc) => {
                const status = docStatusMeta(doc.status);
                const expired = isExpired(doc.expiry_date);
                const soon = isExpiringSoon(doc.expiry_date);
                return (
                  <tr
                    key={`ld-${doc.id}`}
                    className="cursor-pointer border-b border-border/70 hover:bg-muted/30"
                    onClick={() => openDetail(doc)}
                    onDoubleClick={() => openOrDownload(doc)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileTypeIcon kind={resolveFileKind(doc.name, doc.file_url)} size={28} />
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          {doc.doc_number && (
                            <div className="text-xs text-muted-foreground">{doc.doc_number}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{docTypeLabel(doc.doc_type)}</td>
                    <td className="px-4 py-3">
                      <Tag color={status.color}>{status.label}</Tag>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{doc.project?.name || '—'}</td>
                    <td className="px-4 py-3 tabular-nums">v{doc.version || 1}</td>
                    <td className="px-4 py-3">
                      {doc.expiry_date ? (
                        <span className={cn(expired && 'text-destructive', soon && !expired && 'text-amber-600')}>
                          {doc.expiry_date}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatFileSize(doc.file_size)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="text"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrDownload(doc);
                        }}
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(doc);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={editingFolder ? 'Хавтас засах' : 'Хавтас нэмэх'}
        open={folderModal}
        onCancel={() => {
          setFolderModal(false);
          setEditingFolder(null);
        }}
        onOk={saveFolder}
        okText="Хадгалах"
        cancelText="Болих"
      >
        <div className="space-y-3 pt-2">
          <Input
            placeholder="Хавтасны нэр"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
          <Input
            placeholder="Тайлбар (заавал биш)"
            value={folderDesc}
            onChange={(e) => setFolderDesc(e.target.value)}
          />
        </div>
      </Modal>

      <Drawer
        title="Баримт байршуулах"
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        width={440}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setUploadOpen(false)}>Болих</Button>
            <Button type="primary" loading={uploading} onClick={submitUpload}>
              Байршуулах
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Upload
            beforeUpload={(file) => {
              setUploadFile(file);
              setUploadForm((f) => ({ ...f, name: f.name || file.name }));
              return false;
            }}
            showUploadList={Boolean(uploadFile)}
            maxCount={1}
            onRemove={() => setUploadFile(null)}
          >
            <Button icon={<UploadOutlined />}>Файл сонгох</Button>
          </Upload>
          <MetaFields
            value={uploadForm}
            onChange={setUploadForm}
            projectOptions={projectOptions}
          />
        </div>
      </Drawer>

      <Drawer
        title="Баримтын дэлгэрэнгүй"
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        width={480}
        footer={
          <div className="flex justify-between gap-2">
            <Button danger onClick={() => detail && deleteFile(detail)}>
              Устгах
            </Button>
            <div className="flex gap-2">
              <Button icon={<DownloadOutlined />} onClick={() => detail && openOrDownload(detail)}>
                Нээх / Татах
              </Button>
              <Button type="primary" loading={savingDetail} onClick={saveDetail}>
                Хадгалах
              </Button>
            </div>
          </div>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <FileTypeIcon kind={resolveFileKind(detail.name, detail.file_url)} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{detail.name}</div>
                <div className="text-xs text-muted-foreground">
                  v{detail.version || 1} · {formatFileSize(detail.file_size)}
                  {detail.mime_type ? ` · ${detail.mime_type}` : ''}
                </div>
              </div>
            </div>
            <MetaFields
              value={detailForm}
              onChange={setDetailForm}
              projectOptions={projectOptions}
            />
            <div>
              <div className="mb-2 text-sm font-medium">Шинэ хувилбар байршуулах</div>
              <Upload
                beforeUpload={(file) => {
                  setReplaceFile(file);
                  return false;
                }}
                showUploadList={Boolean(replaceFile)}
                maxCount={1}
                onRemove={() => setReplaceFile(null)}
              >
                <Button icon={<UploadOutlined />}>Файл солих</Button>
              </Upload>
              <p className="mt-1 text-xs text-muted-foreground">
                Файл солиход хувилбарын дугаар автоматаар нэмэгдэнэ.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function MetaFields({
  value,
  onChange,
  projectOptions,
}: {
  value: UploadForm;
  onChange: (next: UploadForm) => void;
  projectOptions: Array<{ value: string; label: string }>;
}) {
  const set = <K extends keyof UploadForm>(key: K, v: UploadForm[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Нэр *</label>
        <Input value={value.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Төрөл</label>
          <Select
            className="w-full"
            value={value.doc_type}
            onChange={(v) => set('doc_type', v)}
            options={DOC_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Төлөв</label>
          <Select
            className="w-full"
            value={value.status}
            onChange={(v) => set('status', v)}
            options={DOC_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Баримтын дугаар</label>
        <Input value={value.doc_number} onChange={(e) => set('doc_number', e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Төсөл</label>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          className="w-full"
          value={value.project_id || undefined}
          onChange={(v) => set('project_id', v || '')}
          options={projectOptions}
          placeholder="Төсөл сонгох"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Гаргасан огноо</label>
          <DatePicker
            className="w-full"
            value={value.issue_date || undefined}
            onChange={(v) =>
              set('issue_date', v ? (typeof v === 'string' ? v : v.format('YYYY-MM-DD')) : '')
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Дуусах огноо</label>
          <DatePicker
            className="w-full"
            value={value.expiry_date || undefined}
            onChange={(v) =>
              set('expiry_date', v ? (typeof v === 'string' ? v : v.format('YYYY-MM-DD')) : '')
            }
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Гаргагч</label>
        <Input value={value.issuer} onChange={(e) => set('issuer', e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Шошго</label>
        <Input
          placeholder="жишээ: гэрээ, км12, 2026"
          value={value.tags}
          onChange={(e) => set('tags', e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Тайлбар</label>
        <Input.TextArea
          rows={2}
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">Тэмдэглэл</label>
        <Input.TextArea
          rows={2}
          value={value.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>
    </div>
  );
}
