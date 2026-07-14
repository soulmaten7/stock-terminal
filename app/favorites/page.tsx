import FavoritesClient from '@/components/favorites/FavoritesClient';
import RoomFavoritesClient from '@/components/favorites/RoomFavoritesClient';
import WatchlistClient from '@/components/favorites/WatchlistClient';
import { getTranslations } from 'next-intl/server';

export const metadata = { title: '즐겨찾기' };

export default async function FavoritesPage() {
  const t = await getTranslations('Favorites');
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-unjong-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-unjong-muted">{t('desc')}</p>
      </div>

      <section className="mb-7">
        <h2 className="mb-2 text-sm font-bold text-unjong-primary">{t('watchlist')}</h2>
        <WatchlistClient />
      </section>

      <section className="mb-7">
        <h2 className="mb-2 text-sm font-bold text-unjong-primary">{t('links')}</h2>
        <FavoritesClient />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-unjong-primary">{t('rooms')}</h2>
        <RoomFavoritesClient />
      </section>
    </main>
  );
}
