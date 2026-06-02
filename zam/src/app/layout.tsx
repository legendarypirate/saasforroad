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
  title: 'Үлэмжийн зам LLC — Замын удирдлагын систем',
  description: 'Авто зам, гүүр, дэд бүтцийн төслүүдийн удирдлага',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className={nunito.variable}>
      <body className={`${nunito.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
