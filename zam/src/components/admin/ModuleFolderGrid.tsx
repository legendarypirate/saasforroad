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
import { Card, CardContent } from '@/components/ui/card';
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
    disabled: false,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : undefined,
    zIndex: isDragging ? 20 : undefined,
  };

  const handleOpen = () => {
    if (isComingSoon) return;
    onOpen(getDefaultModulePath(mod, userPermissions, userRole));
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full touch-none">
      <Card
        role={isComingSoon ? undefined : 'button'}
        tabIndex={isComingSoon ? undefined : 0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (isComingSoon) return;
          if (e.key === 'Enter' || e.key === ' ') handleOpen();
        }}
        className={cn(
          'relative h-full transition-all duration-200 dark:bg-[oklch(0.26_0_0)] dark:ring-white/12',
          isDragging && 'shadow-lg ring-2 ring-primary/30',
          isComingSoon
            ? 'cursor-not-allowed opacity-70'
            : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg dark:hover:bg-[oklch(0.29_0_0)] dark:hover:border-[color:var(--neon-border)] dark:hover:shadow-[var(--neon-glow-sm)]',
        )}
        style={
          !isComingSoon
            ? ({
                '--module-color': mod.color,
              } as React.CSSProperties)
            : undefined
        }
      >
        <button
          type="button"
          className="absolute left-2 top-2 z-10 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Чирж байрлал солих"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        {isComingSoon && (
          <Badge
            variant="secondary"
            className="absolute right-3 top-3 text-[10px] uppercase tracking-wide"
          >
            Coming soon
          </Badge>
        )}
        <CardContent className="flex h-full flex-col items-center p-6 text-center">
          <div
            className="relative mb-4 flex size-[72px] items-center justify-center rounded-2xl ring-1 ring-inset ring-black/5 dark:ring-white/10"
            style={{
              backgroundColor: `${mod.color}18`,
              color: mod.color,
            }}
          >
            <Icon className={cn('size-9', isComingSoon && 'grayscale')} />
            <FolderOpen
              className="absolute -bottom-1 -right-1 size-5 rounded bg-background p-0.5"
              style={{ color: mod.color }}
            />
          </div>
          <h3 className={cn('mb-2 text-lg font-semibold', isComingSoon && 'text-muted-foreground')}>
            {mod.label}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{mod.description}</p>
          {!isComingSoon && (
            <p className="mt-3 text-xs font-medium" style={{ color: mod.color }}>
              {itemCount} дэд цэс
            </p>
          )}
        </CardContent>
      </Card>
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
      <h2 className="mb-2 text-2xl font-semibold text-primary dark:text-[var(--neon-green)]">
        {title}
      </h2>
      <p className="mb-2 text-muted-foreground">{description}</p>
      <p className="mb-7 text-xs text-muted-foreground">
        Зүүн дээд ▤ бариулаас чирж байрлал солино — дараагийн нэвтрэлтэд хадгалагдана
      </p>
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
    <div className="space-y-12">
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
