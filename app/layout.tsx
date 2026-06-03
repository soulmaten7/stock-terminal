import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import TickerBar from '@/components/layout/TickerBar';
import { MainNav } from '@/components/header/MainNav';
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
  title: {
    default: "운종 — 투자상품에 속지 않게 돕는 곳",
    template: "%s | 운종",
  },
  description:
    "운종 — 정확한 정보 + 솔직한 토론 + 검증된 신뢰로 투자상품에 속지 않게 돕는 곳. " +
    "주식·상품·리딩방을 한곳에서 교차검증하세요.",
  keywords: [
    "운종",
    "한국 주식",
    "주식 커뮤니티",
    "투자상품 평가",
    "리딩방 검증",
    "주식 토론",
    "ETF 평가",
    "신뢰 평가 허브",
  ],
  authors: [{ name: "운종" }],
  openGraph: {
    title: "운종",
    description: "투자상품에 속지 않게 돕는 곳 — 정확한 정보 + 솔직한 토론 + 검증된 신뢰",
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
            <TickerBar />
            <MainNav />
            <LayoutShell footer={<Footer />}>
              {children}
            </LayoutShell>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
