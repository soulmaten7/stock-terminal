import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = "force-dynamic";
export const metadata = { title: "코인 — 트릴리언 (준비 중)" };

export default async function CoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale); // 정적 렌더 유지
  const t = await getTranslations('Common');
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
      <p className="mb-2 text-2xl">🪙</p>
      <p className="text-lg font-bold text-unjong-primary">{t('coinTitle')}</p>
      <p className="mt-1 text-sm text-unjong-muted">{t('coinDesc')}</p>
    </div>
  );
}
