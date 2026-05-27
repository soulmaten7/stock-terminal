import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/auth/AuthProvider';

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
    default: "운종(雲從) — 한국 주식 동선의 출발점",
    template: "%s | 운종",
  },
  description:
    "운종(雲從) — 정보·대화·허브·신뢰 4박자 플랫폼. 단타·장타·미국주식 3창 분리. " +
    "모든 자산이 운집(雲集)하는 곳.",
  keywords: [
    "운종",
    "雲從",
    "한국 주식",
    "주식 채팅",
    "단타",
    "장기투자",
    "미국주식",
    "주식 커뮤니티",
    "운종가",
  ],
  authors: [{ name: "운종" }],
  openGraph: {
    title: "운종(雲從)",
    description: "한국 주식 동선의 출발점 — 정보·대화·허브·신뢰",
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
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
