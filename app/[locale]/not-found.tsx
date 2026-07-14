import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('Common');
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-5xl font-bold text-unjong-primary">404</p>
      <p className="mt-3 text-lg font-semibold text-unjong-primary">{t('notFoundTitle')}</p>
      <p className="mt-2 text-sm leading-relaxed text-unjong-muted">{t.rich('notFoundDesc', { br: () => <br /> })}</p>
      <Link href="/" className="mt-6 rounded-lg bg-unjong-strong px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">{t('goHome')}</Link>
    </div>
  );
}
