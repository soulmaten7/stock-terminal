import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === "en" ? "About" : "서비스 소개" };
}

// 모듈 상수 → 값=ko.json 키(709B 방식). 렌더에서 t()로 해석.
const PILLARS: { t: string; d: string }[] = [
  { t: "pillar.armT", d: "pillar.armD" },
  { t: "pillar.seeT", d: "pillar.seeD" },
  { t: "pillar.ownT", d: "pillar.ownD" },
];

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale); // 정적 렌더 유지
  const t = await getTranslations('About');
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-unjong-primary">{t('title')}</h1>
      <p className="text-base font-semibold text-unjong-accent">{t('slogan')}</p>
      <p className="mt-1 text-sm text-unjong-muted">{t('sub')}</p>
      <p className="mt-8 text-sm leading-relaxed text-unjong-muted">
        {t.rich('intro', { b: (c) => <span className="font-medium text-unjong-primary">{c}</span> })}
      </p>

      <div className="mt-10 space-y-4">
        {PILLARS.map((p) => (
          <section key={p.t} className="rounded-xl border border-unjong-border bg-unjong-surface p-5">
            <h2 className="mb-1 text-base font-bold text-unjong-primary">{t(p.t)}</h2>
            <p className="text-sm leading-relaxed text-unjong-muted">{t(p.d)}</p>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">{t('howTitle')}</h2>
        <ol className="space-y-2.5 text-sm leading-relaxed text-unjong-muted">
          <li><span className="font-medium text-unjong-primary">1.</span> {t('step1')}</li>
          <li><span className="font-medium text-unjong-primary">2.</span> {t('step2')}</li>
          <li><span className="font-medium text-unjong-primary">3.</span> {t('step3')}</li>
        </ol>
      </section>

      <blockquote className="mt-10 border-l-2 border-unjong-accent pl-4 text-sm italic leading-relaxed text-unjong-muted">
        {t('quote')}
        <footer className="mt-1 text-xs not-italic text-unjong-muted/80">{t('quoteAuthor')}</footer>
      </blockquote>

      <p className="mt-10 text-xs leading-relaxed text-unjong-muted">
        {t('disclaimer')}
      </p>
    </div>
  );
}
