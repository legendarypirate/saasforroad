import { Nunito } from 'next/font/google';
import React from 'react';
import './globals.css';
import Providers from '@/components/Providers';

const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: {
    default: 'Company title',
    template: '%s',
  },
  description: 'Company portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className={nunito.variable} suppressHydrationWarning>
      <body className={`${nunito.className} antialiased`} suppressHydrationWarning>
        {/* FullCalendar v6 injects CSS into this anchor (Next.js client navigation) */}
        <style data-fullcalendar="" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
