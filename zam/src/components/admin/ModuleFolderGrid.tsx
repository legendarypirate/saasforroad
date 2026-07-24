'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Construction,
  Banknote,
  Beaker,
  Bell,
  Briefcase,
  Building2,
  Factory,
  FileText,
  FolderOpen,
  Fuel,
  GraduationCap,
  GripVertical,
  Home,
  Layers,
  MapPin,
  Mountain,
  NotebookPen,
  ShieldAlert,
  Signpost,
  Sparkles,
  Shirt,
  UserSearch,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Badge } from '@/components/ui/badge';
import {
  ADMIN_FOLDER_SECTIONS,
  filterFoldersForSection,
  getDefaultModulePath,
  type ModuleConfig,
} from '@/config/adminNavigation';
import {
  applyFolderOrder,
  getStoredUserId,
  readLocalFolderOrder,
  saveFolderOrderToServer,
  writeLocalFolderOrder,
  type FolderOrderMap,
  type FolderSectionKey,
} from '@/lib/adminFolderOrder';
import { cn } from '@/lib/utils';
import { getEnabledModuleIds } from '@/lib/tenant';

const MODULE_ICONS: Record<string, LucideIcon> = {
  'road-engineering': Construction,
  budget: Calculator,
  material: Layers,
  geodesy: Mountain,
  operations: Briefcase,
  inventory: Layers,
  hr: Briefcase,
  homepage: Home,
  tender: FileText,
  document: FolderOpen,
  notification: Bell,
  finance: Banknote,
  gps: MapPin,
  'ai-tender': Sparkles,
  'uniform-supply': Shirt,
  fleet: Fuel,
  'daily-report': NotebookPen,
  hse: ShieldAlert,
  plant: Factory,
  rental: Wrench,
  equipment: Wrench,
  'system-access': Briefcase,
  'data-technique': Wrench,
  'data-brigade': Users,
  'data-laboratory': Beaker,
  'data-job-seeker': UserSearch,
  'data-factory': Factory,
  'data-student': GraduationCap,
  'data-road-sign': Signpost,
};

interface ModuleFolderGridProps {
  userPermissions: string[];
  userRole?: string;
}

function SortableModuleFolder({
  mod,
  userPermissions,
  userRole,
  onOpen,
}: {
  mod: ModuleConfig;
  userPermissions: string[];
  userRole?: string;
  onOpen: (path: string) => void;
}) {
  const itemCount = mod.items.length;
  const isComingSoon = Boolean(mod.comingSoon);
  const Icon = MODULE_ICONS[mod.id] ?? Building2;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : undefined,
    zIndex: isDragging ? 20 : undefined,
  };

  const handleOpen = () => {
    if (isComingSoon) return;
    onOpen(getDefaultModulePath(mod, userPermissions, userRole));
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full touch-none">
      <div
        role={isComingSoon ? undefined : 'button'}
        tabIndex={isComingSoon ? undefined : 0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (isComingSoon) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={cn(
          'group relative flex h-full min-h-[168px] flex-col rounded-2xl border border-border bg-card transition-all duration-200',
          isDragging && 'shadow-md ring-2 ring-primary/25',
          isComingSoon
            ? 'cursor-not-allowed opacity-65'
            : 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
        )}
      >
        <button
          type="button"
          className="absolute left-2.5 top-2.5 z-10 rounded-md p-1 text-muted-foreground/40 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
          title="Чирж байрлал солих"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>

        {isComingSoon && (
          <Badge
            variant="secondary"
            className="absolute right-3 top-3 px-1.5 py-0 text-[9px] uppercase tracking-wide"
          >
            Soon
          </Badge>
        )}

        <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-8 text-center">
          <div
            className={cn(
              'relative mb-5 flex size-11 items-center justify-center rounded-xl',
              isComingSoon && 'grayscale',
            )}
            style={{
              backgroundColor: `${mod.color}16`,
              color: mod.color,
            }}
          >
            <Icon className="size-5" strokeWidth={2} />
            <FolderOpen
              className="absolute -bottom-0.5 -right-0.5 size-3 rounded-sm bg-card p-px"
              style={{ color: mod.color }}
              strokeWidth={2}
            />
          </div>

          <h3
            className={cn(
              'mb-1.5 text-sm font-semibold leading-snug text-foreground',
              isComingSoon && 'text-muted-foreground',
            )}
          >
            {mod.label}
          </h3>
          <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
            {mod.description}
          </p>
          {!isComingSoon && itemCount > 0 ? (
            <p
              className="mt-4 text-[11px] font-medium tabular-nums"
              style={{ color: mod.color }}
            >
              {itemCount} цэс
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FolderSection({
  sectionKey,
  title,
  description,
  folders,
  userPermissions,
  userRole,
  onOpen,
  onReorder,
}: {
  sectionKey: FolderSectionKey;
  title: string;
  description: string;
  folders: ModuleConfig[];
  userPermissions: string[];
  userRole?: string;
  onOpen: (path: string) => void;
  onReorder: (sectionKey: FolderSectionKey, orderedIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = folders.findIndex((f) => f.id === active.id);
    const newIndex = folders.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(folders, oldIndex, newIndex);
    onReorder(
      sectionKey,
      next.map((f) => f.id),
    );
  };

  if (!folders.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {folders.length}
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={folders.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {folders.map((mod) => (
              <SortableModuleFolder
                key={mod.id}
                mod={mod}
                userPermissions={userPermissions}
                userRole={userRole}
                onOpen={onOpen}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

export default function ModuleFolderGrid({ userPermissions, userRole }: ModuleFolderGridProps) {
  const router = useRouter();
  const enabledModules = useMemo(() => getEnabledModuleIds(), []);

  const [order, setOrder] = useState<FolderOrderMap>({});

  useEffect(() => {
    setOrder(readLocalFolderOrder(getStoredUserId()));

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const serverOrder = user?.ui_preferences?.folderOrder;
      if (serverOrder && typeof serverOrder === 'object') {
        setOrder(serverOrder);
        writeLocalFolderOrder(serverOrder, user?.id);
      }
    } catch {
      // ignore
    }
  }, [userPermissions, userRole]);

  const sections = useMemo(() => {
    return ADMIN_FOLDER_SECTIONS.map((section) => {
      const base = filterFoldersForSection(
        section,
        userPermissions,
        userRole,
        enabledModules,
      );
      return {
        ...section,
        folders: applyFolderOrder(base, order[section.id]),
      };
    }).filter((s) => s.folders.length > 0);
  }, [userPermissions, userRole, enabledModules, order]);

  const handleReorder = (sectionKey: FolderSectionKey, orderedIds: string[]) => {
    setOrder((prev) => {
      const next: FolderOrderMap = { ...prev, [sectionKey]: orderedIds };
      writeLocalFolderOrder(next);
      void saveFolderOrderToServer(next);
      return next;
    });
  };

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <FolderSection
          key={section.id}
          sectionKey={section.id}
          title={section.title}
          description={section.description}
          folders={section.folders}
          userPermissions={userPermissions}
          userRole={userRole}
          onOpen={(path) => router.push(path)}
          onReorder={handleReorder}
        />
      ))}
    </div>
  );
}
