'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { AppWindow, Home, LogOut, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import ThemeToggle from '@/components/ThemeToggle';
import ModuleSubNav from '@/components/admin/ModuleSubNav';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { DASHBOARD_PATH } from '@/config/adminNavigation';
import { getUserPermissions, getUserRole, getUsername, loadUserPermissions } from '@/lib/auth';
import { uiToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [userPermissions, setUserPermissions] = useState<string[]>(() => getUserPermissions());
  const [userRole, setUserRole] = useState(() => getUserRole());
  const [username, setUsername] = useState('Admin');
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    uiToast.success('Logged out');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('permissions');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    router.push('/');
  };

  useEffect(() => {
    (async () => {
      setUsername(getUsername());
      setUserRole(getUserRole());
      const perms = await loadUserPermissions();
      setUserPermissions(perms);
      setUserRole(getUserRole());
    })();
  }, []);

  const isDashboard = pathname === DASHBOARD_PATH;
  const isBusy = loading || isPending;

  const goHome = () => {
    setLoading(true);
    startTransition(() => {
      router.push(DASHBOARD_PATH);
      setTimeout(() => setLoading(false), 400);
    });
  };

  return (
    <div className="admin-shell min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center gap-2 text-lg font-semibold text-primary transition-opacity hover:opacity-80 dark:text-[var(--neon-green)] dark:hover:drop-shadow-[0_0_8px_rgba(33,205,168,0.45)]"
          >
            <AppWindow className="size-5" />
            Замын систем
          </button>
          {!isDashboard && (
            <Button variant="ghost" size="sm" onClick={goHome}>
              <Home className="size-4" />
              Модуль сонгох
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-10 cursor-pointer bg-primary dark:shadow-[var(--neon-glow-sm)]">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="size-5" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Таны нэр: {username}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setLogoutOpen(true)}>
              <LogOut className="size-4" />
              Гарах
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </header>

      {!isDashboard && <ModuleSubNav userPermissions={userPermissions} userRole={userRole} />}

      <main className="mx-auto w-full max-w-[100%] px-5 py-4">
        <div className="relative">
          {isBusy && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/70">
              <Spinner className="size-8 text-primary" />
              <span className="text-sm text-muted-foreground">Ачааллаж байна...</span>
            </div>
          )}
          <div
            className={cn(
              'min-h-[360px] rounded-xl border border-border/60 bg-card shadow-sm dark:border-[color:var(--neon-border)]',
              isDashboard ? 'p-8' : 'p-4',
            )}
          >
            {children}
          </div>
        </div>
      </main>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Та гарахдаа итгэлтэй байна уу?</AlertDialogTitle>
            <AlertDialogDescription>
              Системээс гарсны дараа дахин нэвтрэх шаардлагатай.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Үгүй</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Тийм</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
