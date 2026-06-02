'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Input, Form, message } from 'antd';
import {
  SafetyCertificateOutlined,
  ProjectOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  MenuOutlined,
} from '@ant-design/icons';

const PROJECTS = [
  {
    id: 1,
    image: '/p1.png',
    title: 'Улаанбаатар — Дархан чиглэлийн зам',
    desc: '30 км авто замын шинэчлэлт, 2024 онд ашиглалтад орсон.',
    tag: 'Дууссан',
  },
  {
    id: 2,
    image: '/p2.png',
    title: 'Орон нутгийн холболтын зам',
    desc: 'Дэд бүтэц, гүүрийн барилга угсралтын төсөл.',
    tag: 'Явагдаж буй',
  },
  {
    id: 3,
    image: '/p3.png',
    title: 'Хотын дотоод замын сүлжээ',
    desc: 'Замын засвар, арчилгаа, аюулгүй байдлын стандарт.',
    tag: 'Төлөвлөгдсөн',
  },
];

const FEATURES = [
  {
    icon: <ProjectOutlined className="text-2xl" />,
    title: 'Төслийн удирдлага',
    desc: 'Төсөл, даалгавар, явцын нэгдсэн хяналт.',
  },
  {
    icon: <SafetyCertificateOutlined className="text-2xl" />,
    title: 'Аюулгүй байдал',
    desc: 'Ослын мэдээлэл, заавар, бодит цагийн бүртгэл.',
  },
  {
    icon: <ClockCircleOutlined className="text-2xl" />,
    title: 'Ирцийн систем',
    desc: 'Ажилчин өдөр бүр ирсэн, явсан цагаа бүртгэнэ.',
  },
  {
    icon: <TeamOutlined className="text-2xl" />,
    title: 'Хүний нөөц',
    desc: 'Эрх, хэрэглэгч, багийн бүтцийг уян хатан удирдах.',
  },
];

const STATS = [
  { value: '15+', label: 'Жилийн туршлага' },
  { value: '120+', label: 'Гүйцэтгэсэн төсөл' },
  { value: '500+', label: 'Мэргэшсэн ажилтан' },
  { value: '24/7', label: 'Төслийн хяналт' },
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

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
        message.success('Амжилттай нэвтрэлээ!');
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

  const navLinks = [
    { id: 'about', label: 'Бидний тухай' },
    { id: 'projects', label: 'Төслүүд' },
    { id: 'features', label: 'Систем' },
    { id: 'login', label: 'Нэвтрэх' },
    { id: 'contact', label: 'Холбоо барих' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0c1929]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <button type="button" onClick={() => scrollTo('hero')} className="flex items-center gap-3">
            <Image
              src="/logo.jpeg"
              alt="Үлэмжийн зам"
              width={44}
              height={44}
              className="rounded-lg object-cover ring-2 ring-orange-500/50"
            />
            <div className="text-left">
              <p className="text-sm font-bold leading-tight text-white">Үлэмжийн зам LLC</p>
              <p className="text-xs text-slate-400">Замын удирдлагын систем</p>
            </div>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollTo(link.id)}
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                {link.label}
              </button>
            ))}
            <Button
              type="primary"
              size="middle"
              className="!bg-orange-500 !font-semibold hover:!bg-orange-600"
              onClick={() => scrollTo('login')}
            >
              Админ нэвтрэх
            </Button>
          </nav>

          <button
            type="button"
            className="text-white md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Цэс"
          >
            <MenuOutlined className="text-xl" />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#0c1929] px-4 py-4 md:hidden">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollTo(link.id)}
                className="block w-full py-2 text-left text-slate-300"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Hero */}
      <section
        id="hero"
        className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20"
      >
        <Image
          src="/bg.png"
          alt="Замын төсөл"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1929]/85 via-[#0f4c81]/70 to-[#0c1929]/90" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <span className="mb-4 inline-block rounded-full border border-orange-400/40 bg-orange-500/20 px-4 py-1 text-sm font-semibold text-orange-200">
            Зам бүтээдэг хүч — Ирээдүйг бүтээгч бид
          </span>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            Авто зам, гүүр,
            <span className="text-orange-400"> дэд бүтцийн</span> төслүүд
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-200 md:text-xl">
            Бид чанар, аюулгүй байдал, хугацааны стандартыг баримталж үндэсний хэмжээний замын
            төслүүдийг гүйцэтгэдэг.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              className="!h-12 !bg-orange-500 !px-8 !text-base !font-semibold hover:!bg-orange-600"
              onClick={() => scrollTo('login')}
            >
              Системд нэвтрэх
            </Button>
            <Button
              size="large"
              className="!h-12 !border-white/40 !bg-white/10 !px-8 !text-base !font-semibold !text-white hover:!bg-white/20"
              onClick={() => scrollTo('projects')}
            >
              Төслүүд үзэх
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 z-10 mx-auto grid max-w-4xl grid-cols-2 gap-4 px-6 md:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-center backdrop-blur-sm"
            >
              <p className="text-2xl font-bold text-white md:text-3xl">{stat.value}</p>
              <p className="text-xs text-slate-300 md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-white py-20 px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-orange-500">
              Бидний тухай
            </p>
            <h2 className="mb-6 text-3xl font-bold text-slate-900 md:text-4xl">
              Үлэмжийн зам LLC
            </h2>
            <p className="mb-4 text-lg leading-relaxed text-slate-600">
              2008 оноос хойш авто зам, гүүрийн барилга угсралт, засвар арчлалтаар мэргэшсэн
              үндэсний хэмжээний компани. Бид төслийн бүх үе шатыг нэг платформоор удирдана.
            </p>
            <p className="text-slate-600">
              Манай системээр төсөл, ажилтан, материал, ирц, аюулгүй байдлыг нэг дороос
              хянах боломжтой.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
            <Image src="/back.png" alt="Замын ажил" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0f4c81]/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Features / System */}
      <section id="features" className="bg-slate-100 py-20 px-6">
        <div className="mx-auto max-w-6xl text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#0f4c81]">
            Удирдлагын систем
          </p>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Нэг платформ — бүх үйл явдал</h2>
          <p className="mx-auto mb-12 max-w-2xl text-slate-600">
            Замын компанид зориулсан админ болон ажилчны апп — төсөл, ирц, аюулгүй байдал.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0f4c81]/10 text-[#0f4c81]">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="bg-white py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-orange-500">Төслүүд</p>
            <h2 className="text-3xl font-bold md:text-4xl">Гүйцэтгэсэн & явагдаж буй ажлууд</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {PROJECTS.map((project) => (
              <article
                key={project.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <span className="absolute right-3 top-3 rounded-full bg-[#0f4c81] px-3 py-1 text-xs font-semibold text-white">
                    {project.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{project.title}</h3>
                  <p className="text-sm text-slate-600">{project.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* App download */}
      <section className="border-y border-slate-200 bg-slate-50 py-16 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <h2 className="mb-2 text-2xl font-bold md:text-3xl">Ажилчны апп татах</h2>
            <p className="max-w-md text-slate-600">
              Төслийн мэдээ, ирц бүртгэл, аюулгүй байдлын мэдэгдэл — гар утаснаасаа.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Image src="/playstore.png" alt="Google Play" width={160} height={48} className="opacity-90 hover:opacity-100" />
            <Image src="/appstore.png" alt="App Store" width={160} height={48} className="opacity-90 hover:opacity-100" />
          </div>
        </div>
      </section>

      {/* Login */}
      <section id="login" className="relative py-24 px-6">
        <Image src="/zs.png" alt="" fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[#0c1929]/88" />
        <div className="relative z-10 mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-white">Админ нэвтрэх</h2>
            <p className="text-slate-400">Замын удирдлагын системд нэвтэрнэ үү</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
            <Form form={form} layout="vertical" onFinish={handleLogin} size="large">
              <Form.Item
                name="username"
                label={<span className="font-semibold text-slate-700">Нэвтрэх нэр</span>}
                rules={[{ required: true, message: 'Нэвтрэх нэр оруулна уу' }]}
              >
                <Input placeholder="admin" className="!rounded-lg" />
              </Form.Item>
              <Form.Item
                name="password"
                label={<span className="font-semibold text-slate-700">Нууц үг</span>}
                rules={[{ required: true, message: 'Нууц үг оруулна уу' }]}
              >
                <Input.Password placeholder="••••••••" className="!rounded-lg" />
              </Form.Item>
              <Form.Item className="!mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="!h-12 !bg-[#0f4c81] !text-base !font-bold hover:!bg-[#0d3d6a]"
                >
                  Нэвтрэх
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-white py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold">Холбоо барих</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <PhoneOutlined className="mb-3 text-3xl text-[#0f4c81]" />
              <p className="font-semibold">Утас</p>
              <p className="text-slate-600">7000-0000</p>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <MailOutlined className="mb-3 text-3xl text-[#0f4c81]" />
              <p className="font-semibold">И-мэйл</p>
              <p className="text-slate-600">info@ulemjin-zam.mn</p>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <EnvironmentOutlined className="mb-3 text-3xl text-[#0f4c81]" />
              <p className="font-semibold">Хаяг</p>
              <p className="text-slate-600">Улаанбаатар, Сүхбаатар дүүрэг</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0c1929] py-10 px-6 text-center text-slate-400">
        <Image
          src="/logo.jpeg"
          alt="Logo"
          width={48}
          height={48}
          className="mx-auto mb-4 rounded-lg"
        />
        <p className="font-semibold text-white">Үлэмжийн зам LLC</p>
        <p className="mt-2 text-sm">
          &copy; {new Date().getFullYear()} Бүх эрх хуулиар хамгаалагдсан.
        </p>
        <Link href="/admin" className="mt-4 inline-block text-sm text-orange-400 hover:underline">
          Админ самбар руу →
        </Link>
      </footer>
    </main>
  );
}
