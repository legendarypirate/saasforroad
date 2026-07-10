'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { uiToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const STATS = [
  { value: '400+ км', label: 'Хатуу хучилттай зам' },
  { value: '15+ жил', label: 'Тогтвортой үйл ажиллагаа' },
  { value: 'ISO 9001', label: 'Чанарын менежмент' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  useEffect(() => {
    document.title = 'Нэвтрэх | Үлэмжийн зам';
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/admin');
      return;
    }
    setCheckingSession(false);
  }, [router]);

  const validate = () => {
    const next: { username?: string; password?: string } = {};
    if (!username.trim()) next.username = 'Нэвтрэх нэр оруулна уу';
    if (!password.trim()) next.password = 'Нууц үг оруулна уу';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        uiToast.success('Амжилттай нэвтэрлээ!');
        const { token, user } = data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('permissions', JSON.stringify(user.permissions ?? []));
        localStorage.setItem('role', user.role?.toString() ?? '');
        localStorage.setItem('username', user.username);
        router.push('/admin');
      } else {
        uiToast.error(data.message || 'Нэвтрэх нэр эсвэл нууц үг буруу байна!');
      }
    } catch {
      uiToast.error('Сервертэй холбогдож чадсангүй!');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex min-h-[280px] flex-1 flex-col justify-between overflow-hidden lg:min-h-screen">
        <Image
          src="/bg.png"
          alt="Замын төсөл"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1219]/95 via-[#0a1219]/85 to-[#0a1219]/70" />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-6 md:p-10 lg:p-12">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              <ArrowLeft className="size-4" />
              Нүүр хуудас
            </Link>
            <p className="mt-8 text-xs font-bold tracking-[0.2em] text-emerald-300">
              ҮЛЭМЖИЙН ЗАМ ХХК
            </p>
            <h1 className="mt-3 max-w-lg text-2xl font-extrabold leading-tight text-white md:text-3xl lg:text-4xl">
              Зам барилгын салбарт найдвартай түнш
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300 md:text-base">
              Монгол Улсын авто замын салбарт тогтвортой ажиллаж буй мэргэжлийн хамт олон.
              Удирдлагын системээр төслийн бүх үе шатыг нэг дороос хянаарай.
            </p>
          </div>

          <div className="mt-8 hidden gap-6 sm:grid sm:grid-cols-3 lg:mt-0">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="text-lg font-extrabold text-white md:text-xl">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400 lg:mt-8">
            <span className="inline-flex items-center gap-2">
              <Phone className="size-4" />
              (+976) 7777-0000
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail className="size-4" />
              info@ulemjinzam.mn
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center bg-white px-6 py-10 md:px-12 lg:w-[480px] lg:shrink-0 lg:px-14 xl:w-[520px]">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--road-accent)] text-white">
              <ShieldCheck className="size-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Системд нэвтрэх</h2>
            <p className="mt-2 text-sm text-slate-500">
              Ажилтны нэвтрэх нэр, нууц үгээ оруулна уу.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-semibold text-slate-700">
                Нэвтрэх нэр
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                  }}
                  placeholder="admin"
                  autoComplete="username"
                  className={cn('h-11 pl-10', errors.username && 'border-destructive')}
                />
              </div>
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-slate-700">
                Нууц үг
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn('h-11 pr-10 pl-10', errors.password && 'border-destructive')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Нууц үг нуух' : 'Нууц үг харуулах'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-lg bg-[var(--road-dark)] text-base font-bold hover:bg-[var(--road-dark)]/90"
            >
              {loading ? <Spinner className="size-5 text-white" /> : 'Нэвтрэх'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Зөвхөн бүртгэлтэй ажилтнууд нэвтрэх эрхтэй.
          </p>
        </div>
      </div>
    </div>
  );
}
