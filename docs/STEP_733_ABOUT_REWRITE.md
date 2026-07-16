<!-- 2026-07-15 -->
# STEP 733 — /about 개선 (얇은 소개 → 방법 투명화 골격 · ko+en)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(정확한 카피 제공·다파일. Sonnet. `/clear` 후.)

**목표:** 소개글을 유료 플랫폼 표준 골격으로: 히어로 → **①문제** → ②3기둥(유지) → **③TR-AI 렌즈 방법(핵심 신설)** → **④비추천(헤드라인 승격)** → **⑤커버리지** → ⑥사용법(심화) → 인용·면책. 승인된 초안(`docs/ABOUT_REWRITE_DRAFT.md`) 기반. 멍거 건조 톤·과장 0.

**전제:** 732(`33f24d2`) 이후. 렌즈 7개·계보는 `lib/lensCopy.ts` 실제 값과 정합(허위 렌즈 금지).

**대상:** `messages/ko.json`·`messages/en.json`(About 네임스페이스 교체) + `app/[locale]/about/page.tsx`(렌더 재작성).

---

## 파일 1 — `messages/ko.json` : `"About"` 블록 **전체 교체**
```json
  "About": {
    "pillar": {
      "armT": "기관급 분석",
      "armD": "기관이 쓰는 분석의 눈을 개인 손에. TR-AI 렌즈가 모멘텀·밸류·퀄리티 등 검증된 기법으로 종목을 읽어드려요.",
      "seeT": "정직한 데이터",
      "seeD": "시세·뉴스·공시를 1차 재료 그대로. 데이터가 없으면 지어내지 않고 “데이터 부족”이라 말합니다.",
      "ownT": "당신의 판단",
      "ownD": "사고팔 신호는 없습니다. 검증된 시각을 나란히 놓아드릴 뿐, 결정은 당신 몫이에요."
    },
    "title": "트릴리언 소개",
    "slogan": "종목을 보는 눈을, 누구에게나.",
    "sub": "모든 시각을 데이터로 — 판단은 당신입니다.",
    "problemTitle": "왜 트릴리언인가",
    "problemBody": "투자 정보는 흩어져 있고, 시장은 예측과 추천으로 시끄럽습니다. 리딩방은 “오를 종목”을 팔고, 유료 툴은 방법을 블랙박스에 숨깁니다. 그 사이에서 개인은 결국 남의 말에 기대게 됩니다. 문제는 정보가 부족한 게 아닙니다. 정보를 제 눈으로 읽을 도구가 없다는 것입니다. 누군가 종목을 확신하며 팔 때, 먼저 봐야 할 건 그 확신이 아니라 그의 인센티브입니다.",
    "lensTitle": "TR-AI 렌즈 — 어떤 눈으로 읽나",
    "lensIntro": "한 종목을, 검증된 기법 여러 개로 각각 읽습니다. 각 렌즈는 딱 한 가지 질문에만 정직하게 답하고, 무슨 지표로 누구의 이론에 기대 보는지 화면에 그대로 적어둡니다.",
    "lens": {
      "momentum": "모멘텀 — 추세가 이어지고 있나. (추세 지속 효과)",
      "value": "밸류(가치) — 이익·자산 대비 싼가. (벤저민 그레이엄의 가치투자 · 파마-프렌치가 데이터로 밝힌 밸류 프리미엄)",
      "quality": "퀄리티 — 자산을 이익으로 잘 바꾸나. (노비-마르크스 2013 · 총이익÷자산)",
      "fscore": "F-스코어 — 재무가 부실하지 않나. (피오트로스키 2000 · 9점 재무건전성 체크리스트)",
      "lowvol": "저변동성 — 흔들림 대비 꾸준한가. (저변동성 이상현상)",
      "extra": "자산성장 · 기술 — 과잉 투자·과열 신호. (RSI — 와일더 1978 · 이동평균)"
    },
    "lensClose": "숨기지 않습니다. 블랙박스가 아니라, 열어 보이는 렌즈입니다. 렌즈마다 근거 수치를 함께 보여주고, 데이터가 없으면 그 렌즈는 “데이터 부족”이라 말합니다.",
    "noRecTitle": "예측도, 추천도 하지 않습니다",
    "noRecBody": "“이 종목 사라”는 신호는 여기 없습니다. 렌즈는 확신이 아니라 근거를, 결론이 아니라 재료를 드립니다. 검증된 시각 여럿을 나란히 놓아드릴 뿐, 사고팔 결정은 온전히 당신 몫입니다. 좋은 도구는 대신 판단해 주지 않습니다. 더 나은 판단을 도울 뿐입니다.",
    "coverageTitle": "어디까지 보나",
    "coverageBody": "한국 · 미국 · 일본 · 중국 · 베트남 · 영국 — 6개 시장. 각 시장의 시세·뉴스·공시 같은 1차 재료를 공개된 출처에서 받아 그대로 보여줍니다. 우리가 값을 지어내지 않습니다. 받은 그대로가 이상해 보여도, 우리 짐작으로 지우지 않습니다.",
    "howTitle": "이렇게 씁니다",
    "step1": "종목을 고르고, 렌즈를 봅니다. 한 종목이 모멘텀·밸류·퀄리티·재무건전성 등 여러 렌즈에서 각각 어떻게 읽히는지 한눈에.",
    "step2": "엇갈림을 읽습니다. 렌즈끼리 다르게 말할 때가 가장 중요한 신호입니다 — 싸지만 부실한가, 비싸지만 튼튼한가.",
    "step3": "당신이 판단합니다. 재료를 모았으니, 결론은 당신 몫입니다. 우리는 대신 눌러주지 않습니다.",
    "quote": "“사람이 할 수 있는 가장 좋은 일은, 다른 사람이 더 많이 알도록 돕는 것이다.”",
    "quoteAuthor": "— 찰리 멍거",
    "disclaimer": "트릴리언은 금융상품의 매매·중개·투자자문을 제공하지 않으며, 어떠한 거래도 중개하지 않습니다. 트릴리언이 제공하는 정보는 참고용이며, 투자 권유나 자문이 아닙니다."
  },
```
> **변경 요지:** `intro` 제거(문제·비추천으로 흡수) · `problem*`·`lens*`·`noRec*`·`coverage*` 신설 · `step1~3` 심화 · 나머지(pillar·title·slogan·sub·quote·disclaimer) 유지.

## 파일 2 — `messages/en.json` : `"About"` 블록 **전체 교체** (ko와 키 1:1 패리티)
```json
  "About": {
    "pillar": {
      "armT": "Institutional-grade analysis",
      "armD": "The analytical eye institutions use, in individual hands. The TR-AI Lens reads stocks through proven methods — momentum, value, quality, and more.",
      "seeT": "Honest data",
      "seeD": "Prices, news, and filings as primary material. When data is missing, we do not invent it — we say \"insufficient data.\"",
      "ownT": "Your judgment",
      "ownD": "No buy or sell signals. We lay proven lenses side by side; the decision is yours."
    },
    "title": "About Trillion",
    "slogan": "An eye for stocks — for everyone.",
    "sub": "Every lens, as data — the judgment is yours.",
    "problemTitle": "Why Trillion",
    "problemBody": "Investment information is scattered, and the market is loud with predictions and tips. Chat rooms sell you \"the stock that will go up\"; paid tools hide their method inside a black box. In between, individuals end up leaning on someone else's word. The problem isn't too little information — it's the lack of a tool to read it with your own eyes. When someone sells you a stock with great confidence, the first thing to look at isn't the confidence — it's their incentive.",
    "lensTitle": "The TR-AI Lens — how we read a stock",
    "lensIntro": "We read one stock through several proven methods, each on its own. Every lens answers just one honest question, and writes down — right on the screen — which metrics it uses and whose research it leans on.",
    "lens": {
      "momentum": "Momentum — is the trend continuing? (trend persistence)",
      "value": "Value — is it cheap against earnings and assets? (Benjamin Graham's value investing · the value premium Fama & French established in the data)",
      "quality": "Quality — how well does it turn assets into profit? (Novy-Marx 2013 · gross profits ÷ assets)",
      "fscore": "F-Score — is the balance sheet weak? (Piotroski 2000 · a 9-point financial-health checklist)",
      "lowvol": "Low Volatility — steady per unit of risk? (the low-volatility anomaly)",
      "extra": "Asset Growth · Technical — over-investment and overheating signals. (RSI — Wilder 1978 · moving averages)"
    },
    "lensClose": "Nothing is hidden. Not a black box — a lens we open. Each lens shows the numbers behind it, and when the data isn't there, that lens simply says \"insufficient data.\"",
    "noRecTitle": "We don't predict, and we don't recommend",
    "noRecBody": "There is no \"buy this stock\" signal here. A lens hands you evidence, not certainty; material, not a conclusion. We set several proven viewpoints side by side — the decision to buy or sell is entirely yours. A good tool doesn't make the call for you. It only helps you make a better one.",
    "coverageTitle": "How far we look",
    "coverageBody": "Korea · United States · Japan · China · Vietnam · United Kingdom — six markets. For each, we take first-hand material — prices, news, filings — from public sources and show it as it is. We don't invent values. And when the data looks odd, we don't erase it on a hunch.",
    "howTitle": "How to use it",
    "step1": "Pick a stock, read the lenses. See at a glance how one stock reads through momentum, value, quality, financial health, and more — each on its own.",
    "step2": "Read the disagreement. When the lenses disagree is the most important signal — cheap but weak, or pricey but sturdy?",
    "step3": "You make the call. The material is gathered; the conclusion is yours. We don't press the button for you.",
    "quote": "“The best thing a human being can do is to help another human being know more.”",
    "quoteAuthor": "— Charlie Munger",
    "disclaimer": "Trillion does not trade, broker, or advise on financial products, and does not intermediate any transaction. The information Trillion provides is for reference only and is not a solicitation or advice to invest."
  },
```

## 파일 3 — `app/[locale]/about/page.tsx` : 렌더 **전체 교체**
```tsx
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
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
  );
}
```
> `intro` 렌더(기존 `t.rich('intro'...)`) 제거됨 — 키도 양쪽 json에서 삭제(위 블록에 없음). `t.rich`/`<b>` 미사용이라 import 불변.

## ⚠️ 주의
- **렌즈 7개·계보를 `lib/lensCopy.ts`와 대조**: momentum·lowvol·valuation·quality·assetgrowth·technical·fscore 실제 존재·설명 정합. 실제와 다르면 카피를 실제에 맞춤(허위·과장 금지). 계보(그레이엄·파마-프렌치·노비-마르크스 2013·피오트로스키 2000·와일더 1978)는 lensCopy `about` 필드 근거라 사실.
- **ko/en 키 1:1**(`messages.test.ts` 패리티) — `intro` 양쪽 제거·신규 키 양쪽 추가. `lens.*` 6키 양쪽.
- 멍거 톤·과장 0 유지. pillar 카드 제목 3개는 **직관형 유지**(STEP 81 결정·되돌리지 않음).
- 읽기폭 `max-w-3xl` 유지·다크 토큰(`unjong-*`) 사용.

## 검증
1. `npx tsc --noEmit` → 0.
2. `NEXT_DIST_DIR=.next-verify npm run build` → 성공. 끝나면 삭제.
3. `npx vitest run` → **전체 통과**(`messages.test.ts` About ko/en 패리티 — 신규 키·intro 제거 양쪽 일치).
4. dev: `/about`(ko) — 문제·3기둥·렌즈방법(7렌즈 계보)·비추천·커버리지·사용법·멍거 순서로 렌더·한글. `/en/about` — 동일 구조 영어("Why Trillion"·"The TR-AI Lens"·"Momentum — is the trend continuing?"…). 렌즈 이름 볼드·설명 정상 분리(RSI — Wilder 줄도 안 깨짐).
5. `IntlError`/MISSING 0.

## 커밋
```bash
git add -A && git commit -m "feat(733): /about 개선 — 문제·TR-AI 렌즈 방법 투명화(7렌즈+계보)·비추천 헤드라인·커버리지 신설(ko/en 패리티·멍거 톤·lensCopy 정합·intro 흡수)" && git push
```

## 다음
- 배포 후 Cowork 라이브 실측(/about·/en/about 새 섹션·렌즈 계보·영어).
- **link_hub 영어화 STEP**(description_en) — /en 한글 설명 잔재 제거.
