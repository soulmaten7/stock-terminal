import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '../globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthProvider from '@/components/auth/AuthProvider';
import LayoutShell from '@/components/layout/LayoutShell';
import { Analytics } from '@vercel/analytics/react';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

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
    default: "Trillion — 종목을 보는 눈을, 누구에게나",
    template: "%s | Trillion",
  },
  description:
    "전문가들이 쓰는 검증된 기법으로 종목을 데이터로 봅니다. 예측도 추천도 없이 — 판단은 당신. 시세·뉴스·공시·ETF·공모주까지 한곳에서.",
  keywords: [
    "트릴리언",
    "한국 주식",
    "종목 분석",
    "주식 분석",
    "무료 주식 분석",
    "AI 주식 분석",
    "TR-AI 렌즈",
    "검증된 투자기법",
    "모멘텀 밸류 퀄리티",
    "유사투자자문 조회",
    "TR-AI",
  ],
  authors: [{ name: "Trillion" }],
  openGraph: {
    title: "종목을 보는 눈을, 누구에게나",
    description: "모든 시각을 데이터로. 예측도 추천도 없이, 판단은 당신입니다.",
    siteName: "Trillion",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "종목을 보는 눈을, 누구에게나 — Trillion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "종목을 보는 눈을, 누구에게나 | Trillion",
    description: "모든 시각을 데이터로. 예측도 추천도 없이, 판단은 당신입니다.",
    images: ["/og.png"],
  },
  verification: {
    google: "mSXxPQfJZWeRw6IB1sWgggF53JJBnpXSH1nhdJROkUs",
    other: {
      "naver-site-verification": "7a43691986ac569d41aba6aa7a46d5deec8685ab",
    },
  },
};

// 정적 렌더 유지 — 빌드 시 로케일별로 미리 생성(지금은 ko 하나).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // 이 호출이 있어야 아래 트리가 동적 렌더로 떨어지지 않고 정적으로 남는다.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider>
          <AuthProvider>
            <div className="w-full max-w-[1984px] mx-auto flex-1 flex flex-col">
              <Header />
              <LayoutShell footer={<Footer />}>
                {children}
              </LayoutShell>
            </div>
          </AuthProvider>
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
