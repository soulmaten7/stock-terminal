import WatchlistClient from '@/components/favorites/WatchlistClient';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === "en" ? "Favorites" : "즐겨찾기" };
}

// 관심 = 종목만(STEP 767b 필드 대전환) — 링크·리딩방 즐겨찾기 섹션은 정보탭/검증 파킹과 함께 렌더 제거.
// FavoritesClient·RoomFavoritesClient 컴포넌트 코드는 보존(docs/PARKED_FIELD_SURFACES.md 복원 절차 참고).
export default async function FavoritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale); // 정적 렌더 유지
  const t = await getTranslations('Favorites');
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-unjong-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-unjong-muted">{t('desc')}</p>
      </div>

      <section>
        <h2 className="text-base font-bold text-unjong-primary">{t('watchlist')}</h2>
        <p className="mb-2 text-xs text-unjong-muted">{t('watchlistHero')}</p>
        <WatchlistClient />
      </section>
    </main>
  );
}
