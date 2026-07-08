'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Form, Input, message, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';

const BRAND_GREEN = '#3daf72';
const BRAND_DARK = '#121a26';

const STATS = [
  { value: '400+ км', label: 'Хатуу хучилттай зам' },
  { value: '15+ жил', label: 'Тогтвортой үйл ажиллагаа' },
  { value: 'ISO 9001', label: 'Чанарын менежмент' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    document.title = 'Нэвтрэх | Үлэмжийн зам';
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/admin');
      return;
    }
    setCheckingSession(false);
  }, [router]);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        message.success('Амжилттай нэвтэрлээ!');
        const { token, user } = data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('permissions', JSON.stringify(user.permissions ?? []));
        localStorage.setItem('role', user.role?.toString() ?? '');
        localStorage.setItem('username', user.username);
        router.push('/admin');
      } else {
        message.error(data.message || 'Нэвтрэх нэр эсвэл нууц үг буруу байна!');
      }
    } catch {
      message.error('Сервертэй холбогдож чадсангүй!');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel — arjcapital-style corporate showcase */}
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
              <ArrowLeftOutlined />
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
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-lg font-extrabold text-white md:text-xl">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400 lg:mt-8">
            <span className="inline-flex items-center gap-2">
              <PhoneOutlined />
              (+976) 7777-0000
            </span>
            <span className="inline-flex items-center gap-2">
              <MailOutlined />
              info@ulemjinzam.mn
            </span>
          </div>
        </div>
      </div>

      {/* Login panel */}
      <div className="flex w-full flex-col justify-center bg-white px-6 py-10 md:px-12 lg:w-[480px] lg:shrink-0 lg:px-14 xl:w-[520px]">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <div
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              <SafetyCertificateOutlined />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Системд нэвтрэх</h2>
            <p className="mt-2 text-sm text-slate-500">
              Ажилтны нэвтрэх нэр, нууц үгээ оруулна уу.
            </p>
          </div>

          <Form layout="vertical" onFinish={handleLogin} size="large" requiredMark={false}>
            <Form.Item
              name="username"
              label={<span className="font-semibold text-slate-700">Нэвтрэх нэр</span>}
              rules={[{ required: true, message: 'Нэвтрэх нэр оруулна уу' }]}
            >
              <Input
                prefix={<UserOutlined className="text-slate-400" />}
                placeholder="admin"
                className="!rounded-lg !py-2.5"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="font-semibold text-slate-700">Нууц үг</span>}
              rules={[{ required: true, message: 'Нууц үг оруулна уу' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="••••••••"
                className="!rounded-lg !py-2.5"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item className="!mb-4 !mt-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="!h-12 !rounded-lg !text-base !font-bold !border-0"
                style={{ backgroundColor: BRAND_DARK }}
              >
                Нэвтрэх
              </Button>
            </Form.Item>
          </Form>

          <p className="text-center text-xs text-slate-400">
            Зөвхөн бүртгэлтэй ажилтнууд нэвтрэх эрхтэй.
          </p>
        </div>
      </div>
    </div>
  );
}
