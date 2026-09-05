import { getTranslations, setRequestLocale } from 'next-intl/server';
import { REPORT_COUNTRIES } from '@/lib/constants/reportCountries';

// 🔴 2026-09-05(ORDER_트릴리언모델잔재정리_0905 §20): 커버리지 문구 소스를 구 모델트랙 게이트
// (ACTIVE_MARKETS)에서 채널 리포트 국가 목록(REPORT_COUNTRIES)으로 교체 — 하드코딩 금지 원칙은 유지.
const MARKET_NAME: Record<string, { ko: string; en: string }> = {
  KR: { ko: '한국', en: 'Korea' }, US: { ko: '미국', en: 'United States' },
  JP: { ko: '일본', en: 'Japan' }, CN: { ko: '중국', en: 'China' },
  VN: { ko: '베트남', en: 'Vietnam' }, GB: { ko: '영국', en: 'United Kingdom' },
};

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

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('About');

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

      {/* §3 렌즈 방법 섹션 — 2026-09-05(ORDER_트릴리언모델잔재정리_0905 §19) 통째 제거.
          리포트 기준 재작성은 리브랜딩 때 새 브랜드로 할 일이라 지금 임시 문구로 채우지 않는다. */}

      {/* §4 비추천 (강조) */}
      <section className="mt-12 rounded-xl border-l-2 border-unjong-accent bg-unjong-surface p-5">
        <h2 className="mb-1 text-base font-bold text-unjong-primary">{t('noRecTitle')}</h2>
        <p className="text-sm leading-relaxed text-unjong-muted">{t('noRecBody')}</p>
      </section>

      {/* §5 커버리지 */}
      <section className="mt-12">
        <h2 className="mb-2 text-base font-bold text-unjong-primary">{t('coverageTitle')}</h2>
        <p className="text-sm leading-relaxed text-unjong-muted">{t('coverageBody', {
          markets: REPORT_COUNTRIES.map((rc) => MARKET_NAME[rc.code]?.[locale === 'en' ? 'en' : 'ko'] ?? rc.code).join(' · '),
          count: REPORT_COUNTRIES.length,
        })}</p>
      </section>

      {/* §6 사용법 섹션 — 2026-09-05(ORDER_트릴리언모델잔재정리_0905) 제거. 기존 3단계 중 2단계("렌즈끼리
          엇갈릴 때가 신호")가 렌즈 비교 UI 전제라 리포트 열람 흐름엔 대응 개념이 없다 — §3과 같은 이유로
          임시 문구를 짓지 않고 통째로 비워둔다(리브랜딩 때 새로 설계). */}

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
