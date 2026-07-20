import TodayClient from '@/components/today/TodayClient';
import { setRequestLocale } from 'next-intl/server';

export const dynamic = "force-dynamic"; // SYSTEM_MAP §[locale] 캐시 함정 — 정적 캐시 고착 방지

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Today" : "오늘",
    description: locale === "en"
      ? "Yesterday to today's lens state changes for your watchlist and the market, deterministic facts only."
      : "관심종목·시장의 어제→오늘 렌즈 상태 변화, 결정론 사실만.",
    robots: { index: true, follow: true },
  };
}

export default async function TodayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TodayClient />;
}
