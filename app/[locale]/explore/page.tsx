import { Suspense } from 'react';
import ExploreClient from '@/components/explore/ExploreClient';
import { setRequestLocale } from 'next-intl/server';

export const dynamic = "force-dynamic"; // SYSTEM_MAP §[locale] 캐시 함정 — 정적 캐시 고착 방지

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Explore" : "탐색",
    description: locale === "en"
      ? "Search any stock and see which ones the TR-AI lens reads as strong today, deterministic facts only."
      : "종목 검색과 TR-AI 렌즈가 오늘 강점으로 읽는 종목, 결정론 사실만.",
    robots: { index: true, follow: true },
  };
}

export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={null}>
      <ExploreClient />
    </Suspense>
  );
}
