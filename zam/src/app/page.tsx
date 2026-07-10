'use client';

import { useEffect, useState } from 'react';
import PublicSiteHeader from '@/components/public/PublicSiteHeader';
import PublicSiteFooter from '@/components/public/PublicSiteFooter';
import {
  HomeAboutSection,
  HomeAwardsSection,
  HomeHeroSection,
  HomePartnersSection,
  HomeProjectsSection,
} from '@/components/public/homeSections';
import {
  fetchPublicHomepage,
  getDefaultHomepageContent,
  type HomepageContent,
} from '@/lib/homepage';

export default function Home() {
  const [content, setContent] = useState<HomepageContent>(getDefaultHomepageContent());

  useEffect(() => {
    fetchPublicHomepage().then(setContent);
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased selection:bg-[#3daf72]/25 selection:text-slate-900">
      <PublicSiteHeader
        companyName={content.company_name || 'Үлэмжийн зам'}
        logo={content.logo}
        navItems={content.nav_menu}
      />
      <HomeHeroSection content={content} priority />
      <HomeAboutSection content={content} />
      <HomeProjectsSection content={content} />
      <HomeAwardsSection content={content} />
      <HomePartnersSection content={content} />
      <PublicSiteFooter content={content} />
    </main>
  );
}
