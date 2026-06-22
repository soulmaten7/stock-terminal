import FavoritesClient from '@/components/favorites/FavoritesClient';

export const metadata = { title: '즐겨찾기' };

export default function FavoritesPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-unjong-primary">⭐ 즐겨찾기</h1>
        <p className="mt-1 text-sm text-unjong-muted">카테고리에서 별표한 링크 모음 — 드래그로 순서를 바꿀 수 있어요.</p>
      </div>
      <FavoritesClient />
    </main>
  );
}
