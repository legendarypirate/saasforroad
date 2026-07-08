'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MenuOutlined } from '@ant-design/icons';

const BRAND_GREEN = '#3daf72';

const NAV = [
  { href: '/about', label: 'Бидний тухай' },
  { href: '/technology', label: 'Технологи' },
  { href: '/projects', label: 'Төслүүд' },
  { href: '/hr', label: 'Ажлын байр' },
  { href: '/news', label: 'Мэдээлэл' },
  { href: '/standart', label: 'Стандарт' },
];

export default function PublicSiteHeader({
  companyName,
  activeHref,
}: {
  companyName: string;
  activeHref?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 lg:px-8">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight text-slate-900 md:text-xl">
          {companyName}
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition hover:text-slate-900 ${
                activeHref === item.href ? 'text-slate-900' : 'text-slate-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/#contact"
            className="rounded-md border border-slate-300 px-4 py-2 text-xs font-bold tracking-wide text-slate-700 transition hover:border-slate-400"
          >
            ХОЛБОО БАРИХ
          </Link>
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-xs font-bold tracking-wide text-white transition hover:opacity-90"
            style={{ backgroundColor: BRAND_GREEN }}
          >
            НЭВТРЭХ
          </Link>
        </div>

        <button
          type="button"
          className="text-slate-800 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Цэс"
        >
          <MenuOutlined className="text-xl" />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-slate-100 py-3 text-sm text-slate-700"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block py-3 text-sm font-bold text-emerald-600"
          >
            Нэвтрэх
          </Link>
        </div>
      )}
    </header>
  );
}
