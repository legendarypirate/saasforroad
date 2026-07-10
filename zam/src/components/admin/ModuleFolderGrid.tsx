'use client';

import React from 'react';
import {
  Banknote,
  Beaker,
  Briefcase,
  Building2,
  ClipboardList,
  Factory,
  FileText,
  FolderOpen,
  GraduationCap,
  Home,
  Layers,
  MapPin,
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

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  filterModules,
  filterDataFolders,
  getDefaultModulePath,
  type ModuleConfig,
} from '@/config/adminNavigation';
import { cn } from '@/lib/utils';

const MODULE_ICONS: Record<string, LucideIcon> = {
  operations: Briefcase,
  inventory: Layers,
  hr: Briefcase,
  homepage: Home,
  tender: FileText,
  documents: ClipboardList,
  finance: Banknote,
  gps: MapPin,
  'ai-tender': Sparkles,
  'uniform-supply': Shirt,
  'daily-report': NotebookPen,
  hse: ShieldAlert,
  'data-technique': Wrench,
  'data-brigade': Users,
  'data-laboratory': Beaker,
  'data-job-seeker': UserSearch,
  'data-production': Factory,
  'data-student': GraduationCap,
  'data-road-sign': Signpost,
};

interface ModuleFolderGridProps {
  userPermissions: string[];
  userRole?: string;
}

function ModuleFolder({
  mod,
  userPermissions,
  onOpen,
}: {
  mod: ModuleConfig;
  userPermissions: string[];
  onOpen: (path: string) => void;
}) {
  const itemCount = mod.items.length;
  const isComingSoon = Boolean(mod.comingSoon);
  const Icon = MODULE_ICONS[mod.id] ?? Building2;

  const handleOpen = () => {
    if (isComingSoon) return;
    onOpen(getDefaultModulePath(mod, userPermissions));
  };

  return (
    <Card
      role={isComingSoon ? undefined : 'button'}
      tabIndex={isComingSoon ? undefined : 0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (isComingSoon) return;
        if (e.key === 'Enter' || e.key === ' ') handleOpen();
      }}
      className={cn(
        'relative h-full transition-all duration-200',
        isComingSoon
          ? 'cursor-not-allowed opacity-70'
          : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg dark:hover:border-[color:var(--neon-border)] dark:hover:shadow-[var(--neon-glow-sm)]',
      )}
      style={
        !isComingSoon
          ? ({
              '--module-color': mod.color,
            } as React.CSSProperties)
          : undefined
      }
    >
      {isComingSoon && (
        <Badge variant="secondary" className="absolute right-3 top-3 text-[10px] uppercase tracking-wide">
          Coming soon
        </Badge>
      )}
      <CardContent className="flex h-full flex-col items-center p-6 text-center">
        <div
          className="relative mb-4 flex size-[72px] items-center justify-center rounded-2xl"
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
  );
}

function FolderSection({
  title,
  description,
  folders,
  userPermissions,
  onOpen,
}: {
  title: string;
  description: string;
  folders: ModuleConfig[];
  userPermissions: string[];
  onOpen: (path: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold text-primary dark:text-[var(--neon-green)]">{title}</h2>
      <p className="mb-7 text-muted-foreground">{description}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {folders.map((mod) => (
          <ModuleFolder key={mod.id} mod={mod} userPermissions={userPermissions} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

export default function ModuleFolderGrid({ userPermissions, userRole }: ModuleFolderGridProps) {
  const router = useRouter();
  const modules = filterModules(userPermissions, userRole);
  const dataFolders = filterDataFolders();

  return (
    <div className="space-y-12">
      <FolderSection
        title="Модуль сонгох"
        description="ERP системийн модулуудыг сонгон ажиллана уу"
        folders={modules}
        userPermissions={userPermissions}
        onOpen={(path) => router.push(path)}
      />
      <FolderSection
        title="Дата"
        description="Компанийн мэдээллийн сан, дата модулууд"
        folders={dataFolders}
        userPermissions={userPermissions}
        onOpen={(path) => router.push(path)}
      />
    </div>
  );
}
