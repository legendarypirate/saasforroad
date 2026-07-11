'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MenuOutlined } from '@/components/admin/icons';
import { resolveImageUrl } from '@/lib/homepage';
import { resolveNavItems, type SiteNavItem } from '@/lib/siteMenu';

const BRAND_GREEN = '#3daf72';

export default function PublicSiteHeader({
  companyName,
  logo,
  activeHref,
  navItems,
  sticky = true,
}: {
  companyName: string;
  logo?: string;
  activeHref?: string;
  navItems?: SiteNavItem[];
  /** Disable sticky when embedded in admin visual preview (avoids covering admin chrome). */
  sticky?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const logoSrc = logo ? resolveImageUrl(logo) : '';
  const NAV = resolveNavItems(navItems).filter((item) => item.visible);

  return (
    <header
      className={
        sticky
          ? 'sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl'
          : 'relative z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl'
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 lg:px-8">
        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2.5">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={companyName}
              className="h-8 w-auto max-w-[120px] object-contain transition group-hover:opacity-90 md:h-9"
            />
          ) : null}
          <span className="truncate text-sm font-extrabold tracking-tight text-slate-900 md:text-[15px]">
            {companyName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {NAV.map((item) => {
            const active = activeHref === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative rounded-md px-3 py-2 text-sm font-medium transition ${
                  active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
                {active ? (
                  <span
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full"
                    style={{ backgroundColor: BRAND_GREEN }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-xs font-bold tracking-wide text-white transition hover:brightness-110"
            style={{ backgroundColor: BRAND_GREEN }}
          >
            Нэвтрэх
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-slate-800 transition hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Цэс"
          aria-expanded={open}
        >
          <MenuOutlined className="text-xl" />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200/80 bg-white px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block border-b border-slate-100 py-3.5 text-sm ${
                activeHref === item.href ? 'font-bold text-slate-900' : 'text-slate-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="py-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block rounded-lg py-2.5 text-center text-sm font-bold text-white"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              Нэвтрэх
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
