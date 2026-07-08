'use client';

import Link from 'next/link';
import {
  FacebookOutlined,
  LinkedinOutlined,
  MailOutlined,
  TwitterOutlined,
} from '@ant-design/icons';
import type { HomepageContent } from '@/lib/homepage';

const BRAND_DARK = '#121a26';

export default function PublicSiteFooter({ content }: { content: HomepageContent }) {
  return (
    <footer id="contact" style={{ backgroundColor: BRAND_DARK }} className="text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="mb-3 text-lg font-extrabold text-white">{content.company_name}</p>
          <p className="text-sm leading-relaxed">{content.company_tagline}</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold tracking-widest text-slate-500">ҮЙЛЧИЛГЭЭ</p>
          <ul className="space-y-2 text-sm">
            {content.footer_services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold tracking-widest text-slate-500">ХОЛБОО БАРИХ</p>
          <ul className="space-y-2 text-sm">
            <li>{content.phone}</li>
            <li>{content.email}</li>
            <li>{content.address}</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold tracking-widest text-slate-500">СОШИАЛ</p>
          <div className="flex gap-3 text-lg text-slate-300">
            <FacebookOutlined />
            <TwitterOutlined />
            <LinkedinOutlined />
            <MailOutlined />
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs">
        <p>
          &copy; {new Date().getFullYear()} {content.footer_copyright || content.company_name}. Бүх эрх
          хуулиар хамгаалагдсан.
        </p>
        <Link href="/login" className="mt-2 inline-block hover:text-white">
          Системд нэвтрэх →
        </Link>
      </div>
    </footer>
  );
}
