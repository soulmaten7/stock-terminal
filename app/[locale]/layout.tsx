import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '../globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthProvider from '@/components/auth/AuthProvider';
import LayoutShell from '@/components/layout/LayoutShell';
import { Analytics } from '@vercel/analytics/react';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
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

// OG 표준 로케일 코드(og:locale은 언어코드가 아니라 language_TERRITORY).
export const OG_LOCALE: Record<string, string> = { ko: 'ko_KR', en: 'en_US' };

// PWA 테마색(STEP 777 §3) — 로케일 무관 고정값이라 static viewport(generateViewport 아님, next 문서 권장).
export const viewport: Viewport = {
  themeColor: '#0A0A0A',
};

// 로케일별 메타. locale을 명시적으로 넘겨야 정적 렌더 자격이 유지된다(next-intl 문서).
// hreflang(alternate)은 여기 두지 않는다 — 레이아웃은 자기 pathname을 모르므로 여기에 넣으면
// 모든 하위 페이지가 '/'를 가리키는 틀린 hreflang을 물려받는다.
//   · 사이트 전역 hreflang = next-intl 미들웨어(proxy.ts)가 경로별 Link 헤더로 자동 발행(x-default 포함).
//   · 홈은 경로가 확정이라 app/[locale]/page.tsx에서 HTML alternates까지 추가로 박는다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app"),
    title: {
      default: t('title'),
      template: "%s | EarthTicker",
    },
    description: t('description'),
    keywords: t('keywords').split(',').map((k) => k.trim()),
    authors: [{ name: "EarthTicker" }],
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      siteName: "EarthTicker",
      type: "website",
      locale: OG_LOCALE[locale] ?? OG_LOCALE.ko,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: t('ogImageAlt') }],
    },
    twitter: {
      card: "summary_large_image",
      title: t('twitterTitle'),
      description: t('ogDescription'),
      images: ["/og.png"],
    },
    verification: {
      google: "mSXxPQfJZWeRw6IB1sWgggF53JJBnpXSH1nhdJROkUs",
      other: {
        "naver-site-verification": "7a43691986ac569d41aba6aa7a46d5deec8685ab",
      },
    },
  };
}

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
