'use client';

import Link from 'next/link';
import { resolveImageUrl, type HomepageContent } from '@/lib/homepage';
import { cn } from '@/lib/utils';

const BRAND_DARK = '#121a26';
const BRAND_GREEN = '#3daf72';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.174 2.097 15.943 2 14.643 2 11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.903L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  );
}

const SOCIAL = [
  { key: 'facebook', label: 'Facebook', href: 'https://facebook.com', Icon: FacebookIcon },
  { key: 'x', label: 'X', href: 'https://x.com', Icon: XIcon },
  { key: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com', Icon: LinkedInIcon },
  {
    key: 'mail',
    label: 'И-мэйл',
    href: (email: string) => `mailto:${email}`,
    Icon: MailIcon,
  },
] as const;

export default function PublicSiteFooter({ content }: { content: HomepageContent }) {
  const logoSrc = content.logo ? resolveImageUrl(content.logo) : '';

  return (
    <footer id="contact" style={{ backgroundColor: BRAND_DARK }} className="text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-4 lg:gap-10 lg:px-8">
        <div className="lg:pr-6">
          <div className="mb-4 flex items-center gap-2.5">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt={content.company_name}
                className="h-8 w-auto max-w-[100px] object-contain"
              />
            ) : null}
            <p className="text-sm font-extrabold tracking-tight text-white md:text-[15px]">
              {content.company_name}
            </p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-slate-400">{content.company_tagline}</p>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-bold tracking-[0.2em] text-slate-500">ҮЙЛЧИЛГЭЭ</p>
          <ul className="space-y-2.5 text-sm">
            {content.footer_services.map((service) => (
              <li key={service} className="transition hover:text-slate-200">
                {service}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-bold tracking-[0.2em] text-slate-500">ХОЛБОО БАРИХ</p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href={`tel:${content.phone}`} className="transition hover:text-white">
                {content.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${content.email}`} className="transition hover:text-white">
                {content.email}
              </a>
            </li>
            <li className="leading-relaxed">{content.address}</li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-bold tracking-[0.2em] text-slate-500">СОШИАЛ</p>
          <div className="flex gap-2">
            {SOCIAL.map(({ key, label, href, Icon }) => {
              const url = typeof href === 'function' ? href(content.email || '') : href;
              return (
                <a
                  key={key}
                  href={url}
                  target={key === 'mail' ? undefined : '_blank'}
                  rel={key === 'mail' ? undefined : 'noopener noreferrer'}
                  aria-label={label}
                  className={cn(
                    'inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition',
                    'hover:border-white/20 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
          </div>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition hover:text-white"
            style={{ color: BRAND_GREEN }}
          >
            Системд нэвтрэх →
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} {content.footer_copyright || content.company_name}. Бүх эрх
          хуулиар хамгаалагдсан.
        </p>
      </div>
    </footer>
  );
}
