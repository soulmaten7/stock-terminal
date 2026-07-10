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
    default: "Trillion — 전문가 시각의 무료 주식 분석",
    template: "%s | Trillion",
  },
  description:
    "전문가 시각의 분석을 TR-AI가 무료로. 시세·뉴스·공시·거시·ETF·공모주부터 리딩방 검증까지 — 가치 판단은 당신 몫.",
  keywords: [
    "트릴리언",
    "한국 주식",
    "주식 커뮤니티",
    "투자상품 평가",
    "리딩방 검증",
    "ETF 평가",
    "신뢰 평가 허브",
    "주식 분석",
    "무료 주식 분석",
    "AI 주식 분석",
    "TR-AI",
  ],
  authors: [{ name: "Trillion" }],
  openGraph: {
    title: "전문가 시각으로, TR-AI가 무료로 분석해 드립니다",
    description: "가격은 시장이 붙이고, 가치는 당신이 매깁니다. 우린 그 가치를 볼 수 있게 거들 뿐 — 판단은 당신 몫입니다.",
    siteName: "Trillion",
    type: "website",
    locale: "ko_KR",
  },
  verification: {
    google: "mSXxPQfJZWeRw6IB1sWgggF53JJBnpXSH1nhdJROkUs",
    other: {
      "naver-site-verification": "7a43691986ac569d41aba6aa7a46d5deec8685ab",
    },
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
