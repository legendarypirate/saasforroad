'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Input, Form, message, Spin } from 'antd';
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
import {
  fetchPublicHomepage,
  resolveImageUrl,
  type HomepageContent,
  type HomepageFeature,
} from '@/lib/homepage';

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  project: <ProjectOutlined className="text-2xl" />,
  safety: <SafetyCertificateOutlined className="text-2xl" />,
  clock: <ClockCircleOutlined className="text-2xl" />,
  team: <TeamOutlined className="text-2xl" />,
};

function featureIcon(feature: HomepageFeature) {
  return FEATURE_ICONS[feature.icon] ?? <ProjectOutlined className="text-2xl" />;
}

function renderHeroTitle(content: HomepageContent) {
  const highlight = content.hero_title_highlight;
  const title = content.hero_title;
  if (!highlight || !title.includes(highlight)) {
    return title;
  }
  const [before, after] = title.split(highlight);
  return (
    <>
      {before}
      <span className="text-orange-400">{highlight}</span>
      {after}
    </>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [content, setContent] = useState<HomepageContent | null>(null);
  const router = useRouter();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPublicHomepage().then((data) => {
      setContent(data);
      setPageLoading(false);
    });
  }, []);

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

  if (pageLoading || !content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spin size="large" />
      </div>
    );
  }

  const logoSrc = resolveImageUrl(content.logo);
  const isRemoteLogo = logoSrc.startsWith('http');

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0c1929]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <button type="button" onClick={() => scrollTo('hero')} className="flex items-center gap-3">
            {isRemoteLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt={content.company_name}
                width={44}
                height={44}
                className="h-11 w-11 rounded-lg object-cover ring-2 ring-orange-500/50"
              />
            ) : (
              <Image
                src={logoSrc}
                alt={content.company_name}
                width={44}
                height={44}
                className="rounded-lg object-cover ring-2 ring-orange-500/50"
              />
            )}
            <div className="text-left">
              <p className="text-sm font-bold leading-tight text-white">{content.company_name}</p>
              <p className="text-xs text-slate-400">{content.company_tagline}</p>
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

      <section
        id="hero"
        className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20"
      >
        <HeroBackground src={resolveImageUrl(content.hero_bg_image)} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1929]/85 via-[#0f4c81]/70 to-[#0c1929]/90" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <span className="mb-4 inline-block rounded-full border border-orange-400/40 bg-orange-500/20 px-4 py-1 text-sm font-semibold text-orange-200">
            {content.hero_badge}
          </span>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
            {renderHeroTitle(content)}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-200 md:text-xl">{content.hero_subtitle}</p>
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
          {content.stats.map((stat) => (
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

      <section id="about" className="bg-white py-20 px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-orange-500">{content.about_label}</p>
            <h2 className="mb-6 text-3xl font-bold text-slate-900 md:text-4xl">{content.about_title}</h2>
            <p className="mb-4 text-lg leading-relaxed text-slate-600">{content.about_text1}</p>
            <p className="text-slate-600">{content.about_text2}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
            <SectionImage src={resolveImageUrl(content.about_image)} alt="Замын ажил" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0f4c81]/40 to-transparent" />
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-100 py-20 px-6">
        <div className="mx-auto max-w-6xl text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#0f4c81]">{content.features_label}</p>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">{content.features_title}</h2>
          <p className="mx-auto mb-12 max-w-2xl text-slate-600">{content.features_subtitle}</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {content.features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0f4c81]/10 text-[#0f4c81]">
                  {featureIcon(f)}
                </div>
                <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="bg-white py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-orange-500">{content.projects_label}</p>
            <h2 className="text-3xl font-bold md:text-4xl">{content.projects_title}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {content.projects.map((project, idx) => (
              <article
                key={`${project.title}-${idx}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <SectionImage
                    src={resolveImageUrl(project.image)}
                    alt={project.title}
                    className="object-cover transition duration-500 group-hover:scale-105"
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

      <section className="border-y border-slate-200 bg-slate-50 py-16 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <h2 className="mb-2 text-2xl font-bold md:text-3xl">{content.app_download_title}</h2>
            <p className="max-w-md text-slate-600">{content.app_download_text}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Image src="/playstore.png" alt="Google Play" width={160} height={48} className="opacity-90 hover:opacity-100" />
            <Image src="/appstore.png" alt="App Store" width={160} height={48} className="opacity-90 hover:opacity-100" />
          </div>
        </div>
      </section>

      <section id="login" className="relative py-24 px-6">
        <LoginBackground src={resolveImageUrl(content.login_bg_image)} />
        <div className="absolute inset-0 bg-[#0c1929]/88" />
        <div className="relative z-10 mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-white">{content.login_title}</h2>
            <p className="text-slate-400">{content.login_subtitle}</p>
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

      <section id="contact" className="bg-white py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold">Холбоо барих</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <PhoneOutlined className="mb-3 text-3xl text-[#0f4c81]" />
              <p className="font-semibold">Утас</p>
              <p className="text-slate-600">{content.phone}</p>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <MailOutlined className="mb-3 text-3xl text-[#0f4c81]" />
              <p className="font-semibold">И-мэйл</p>
              <p className="text-slate-600">{content.email}</p>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <EnvironmentOutlined className="mb-3 text-3xl text-[#0f4c81]" />
              <p className="font-semibold">Хаяг</p>
              <p className="text-slate-600">{content.address}</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#0c1929] py-10 px-6 text-center text-slate-400">
        {isRemoteLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoSrc} alt="Logo" width={48} height={48} className="mx-auto mb-4 rounded-lg" />
        ) : (
          <Image src={logoSrc} alt="Logo" width={48} height={48} className="mx-auto mb-4 rounded-lg" />
        )}
        <p className="font-semibold text-white">{content.company_name}</p>
        <p className="mt-2 text-sm">
          &copy; {new Date().getFullYear()} {content.footer_copyright}
        </p>
        <Link href="/admin" className="mt-4 inline-block text-sm text-orange-400 hover:underline">
          Админ самбар руу →
        </Link>
      </footer>
    </main>
  );
}

function HeroBackground({ src }: { src: string }) {
  if (src.startsWith('http')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="Замын төсөл" className="absolute inset-0 h-full w-full object-cover" />
    );
  }
  return <Image src={src} alt="Замын төсөл" fill priority className="object-cover" sizes="100vw" />;
}

function LoginBackground({ src }: { src: string }) {
  if (src.startsWith('http')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
    );
  }
  return <Image src={src} alt="" fill className="object-cover" sizes="100vw" />;
}

function SectionImage({
  src,
  alt,
  className = 'object-cover',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  if (src.startsWith('http')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`absolute inset-0 h-full w-full ${className}`} />
    );
  }
  return <Image src={src} alt={alt} fill className={className} sizes="(max-width: 768px) 100vw, 50vw" />;
}
