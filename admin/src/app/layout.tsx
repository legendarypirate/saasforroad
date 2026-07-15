import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RCOS Platform Admin",
  description: "Tenant registration and control for Road SaaS",
};

const themeBoot = `(function(){try{var t=localStorage.getItem('rcos-admin-theme');if(t!=='light')t='dark';document.documentElement.dataset.theme=t;document.documentElement.classList.add(t);}catch(e){document.documentElement.dataset.theme='dark';document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className={`${nunito.variable} ${nunito.className}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
