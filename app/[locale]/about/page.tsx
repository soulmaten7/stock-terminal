import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { title: locale === "en" ? "About" : "서비스 소개" };
}

const PILLARS: { t: string; d: string }[] = [
  { t: "pillar.armT", d: "pillar.armD" },
  { t: "pillar.seeT", d: "pillar.seeD" },
  { t: "pillar.ownT", d: "pillar.ownD" },
];
const LENSES = ["lens.momentum", "lens.value", "lens.quality", "lens.fscore", "lens.lowvol", "lens.extra"];

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('About');

  // 렌즈 줄: 첫 " — "에서 이름/설명 분리(이름 볼드). 설명 내부의 "—"(RSI — 와일더)는 보존.
  const splitLens = (s: string): [string, string] => {
    const i = s.indexOf(" — ");
    return i < 0 ? [s, ""] : [s.slice(0, i), s.slice(i + 3)];
  };

  // STEP 796 §3: 좌측 선을 셸(1040)과 맞추되 읽기 폭은 유지 — 바깥 1040(좌측 144)·안쪽 리딩 컬럼(lg 680).
  return (
    <div className="mx-auto max-w-[1040px] px-4 py-12 sm:px-6">
      <div className="max-w-3xl lg:max-w-[680px]">
      {/* 히어로 */}
      <h1 className="mb-2 text-2xl font-bold text-unjong-primary">{t('title')}</h1>
      <p className="text-base font-semibold text-unjong-accent">{t('slogan')}</p>
      <p className="mt-1 text-sm text-unjong-muted">{t('sub')}</p>

      {/* §1 문제 */}
      <section className="mt-10">
        <h2 className="mb-2 text-base font-bold text-unjong-primary">{t('problemTitle')}</h2>
        <p className="text-sm leading-relaxed text-unjong-muted">{t('problemBody')}</p>
      </section>

      {/* §2 3기둥 */}
      <div className="mt-10 space-y-4">
        {PILLARS.map((p) => (
          <section key={p.t} className="rounded-xl border border-unjong-border bg-unjong-surface p-5">
            <h2 className="mb-1 text-base font-bold text-unjong-primary">{t(p.t)}</h2>
            <p className="text-sm leading-relaxed text-unjong-muted">{t(p.d)}</p>
          </section>
        ))}
      </div>

      {/* §3 렌즈 방법 (핵심) */}
      <section className="mt-12">
        <h2 className="mb-2 text-base font-bold text-unjong-primary">{t('lensTitle')}</h2>
        <p className="mb-4 text-sm leading-relaxed text-unjong-muted">{t('lensIntro')}</p>
        <ul className="space-y-2 rounded-xl border border-unjong-border bg-unjong-surface p-5">
          {LENSES.map((k) => {
            const [name, desc] = splitLens(t(k));
            return (
              <li key={k} className="text-sm leading-relaxed text-unjong-muted">
                <span className="font-semibold text-unjong-primary">{name}</span>
                {desc ? <> — {desc}</> : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-unjong-muted">{t('lensClose')}</p>
      </section>

      {/* §4 비추천 (강조) */}
      <section className="mt-12 rounded-xl border-l-2 border-unjong-accent bg-unjong-surface p-5">
        <h2 className="mb-1 text-base font-bold text-unjong-primary">{t('noRecTitle')}</h2>
        <p className="text-sm leading-relaxed text-unjong-muted">{t('noRecBody')}</p>
      </section>

      {/* §5 커버리지 */}
      <section className="mt-12">
        <h2 className="mb-2 text-base font-bold text-unjong-primary">{t('coverageTitle')}</h2>
        <p className="text-sm leading-relaxed text-unjong-muted">{t('coverageBody')}</p>
      </section>

      {/* §6 사용법 */}
      <section className="mt-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">{t('howTitle')}</h2>
        <ol className="space-y-2.5 text-sm leading-relaxed text-unjong-muted">
          <li><span className="font-medium text-unjong-primary">1.</span> {t('step1')}</li>
          <li><span className="font-medium text-unjong-primary">2.</span> {t('step2')}</li>
          <li><span className="font-medium text-unjong-primary">3.</span> {t('step3')}</li>
        </ol>
      </section>

      {/* 인용 + 면책 */}
      <blockquote className="mt-12 border-l-2 border-unjong-accent pl-4 text-sm italic leading-relaxed text-unjong-muted">
        {t('quote')}
        <footer className="mt-1 text-xs not-italic text-unjong-muted/80">{t('quoteAuthor')}</footer>
      </blockquote>
      <p className="mt-10 text-xs leading-relaxed text-unjong-muted">{t('disclaimer')}</p>
      </div>
    </div>
  );
}
