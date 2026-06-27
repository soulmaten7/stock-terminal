import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthProvider from '@/components/auth/AuthProvider';
import LayoutShell from '@/components/layout/LayoutShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app"),
  title: {
    default: "Trillion — 흩어진 금융정보를 한눈에",
    template: "%s | Trillion",
  },
  description:
    "흩어진 금융정보를 한곳에 모아 한눈에 — 시세·뉴스·공시·거시지표·ETF·공모주, 그리고 리딩방 검증까지. Trillion.",
  keywords: [
    "트릴리언",
    "한국 주식",
    "주식 커뮤니티",
    "투자상품 평가",
    "리딩방 검증",
    "ETF 평가",
    "신뢰 평가 허브",
  ],
  authors: [{ name: "Trillion" }],
  openGraph: {
    title: "Trillion",
    description: "흩어진 금융정보를 한눈에 — 시세·뉴스·공시·거시·리딩방 검증",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <div className="w-full max-w-[1984px] mx-auto flex-1 flex flex-col">
            <Header />
            <LayoutShell footer={<Footer />}>
              {children}
            </LayoutShell>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
