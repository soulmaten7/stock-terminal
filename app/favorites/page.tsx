import FavoritesClient from '@/components/favorites/FavoritesClient';
import RoomFavoritesClient from '@/components/favorites/RoomFavoritesClient';

export const metadata = { title: '즐겨찾기' };

export default function FavoritesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-unjong-primary">⭐ 즐겨찾기</h1>
        <p className="mt-1 text-sm text-unjong-muted">별표한 링크·리딩방 모음 — 각 섹션에서 드래그로 순서를 바꿀 수 있어요.</p>
      </div>

      <section className="mb-7">
        <h2 className="mb-2 text-sm font-bold text-unjong-primary">링크</h2>
        <FavoritesClient />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-unjong-primary">리딩방·검증</h2>
        <RoomFavoritesClient />
      </section>
    </main>
  );
}
