<!-- 2026-06-26 -->
# STEP 413 — 피드 국가맵 리팩터 + 거시(macro) US 노출

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_413_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
툴박스 우측 피드의 국가 게이팅을 **단일 `country === 'KR'` 가드** → **피드별 지원국가 맵**으로 리팩터하고, 이번 STEP에서는 **거시(macro) 피드만 US에 개방**한다.
- `/api/macro/summary`는 이미 KR(ECOS) + US(FRED)를 **둘 다** 반환하고, `MacroFeed`에는 🇰🇷/🇺🇸 내부 토글이 이미 있다 → macro는 **막혀만 있던** 상태라 가드만 풀면 끝.
- 동시에 macro 탭이 US에서도 **보이게**(큐레이션 링크 없어도) 하고, `MacroFeed`의 기본 뷰를 현재 시장에 맞춘다(`defaultView` prop 신설).
- 뉴스·공시·공모주 등 나머지 피드는 **KR 그대로** — 후속 STEP(414~)에서 점진 개방.

## 전제
- 최신 main. 배포 X(배치) — 이 STEP은 **로컬 빌드 + 로컬 커밋만**(push·vercel 없음).
- KR 동작은 **byte 단위 동일** 유지가 목표. 이 STEP은 **macro만** US 개방.
- 변경 파일 2개: `components/toolbox/ToolboxClient.tsx`, `components/toolbox/MacroFeed.tsx`.
- 확인된 현재 상태(읽기 완료):
  - `ToolboxClient.tsx` L29 `FEED_TABS`, L30~41 `feedFor`(country 접근 없음, L179에서 `feedFor(activeTab)` 호출), L84~86 카테고리 탭 가시성(`hasLinks`), L162 단일 가드.
  - `MacroFeed.tsx` L43 `export default function MacroFeed()`(props 없음), L48 `const [view, setView] = useState<'kr' | 'us'>('kr');` → 뷰 타입은 **`'kr' | 'us'`**.
  - `app/api/macro/summary/route.ts` → `{ kr, us }` 반환(변경 없음, 확인만).

---

## 1단계 — `components/toolbox/ToolboxClient.tsx` (4곳)

### (A) 피드별 지원국가 맵 추가 — 단일 'KR' 가드 대체
찾기:
```ts
// 우측 피드가 붙는 탭(한국 전용) + 탭별 피드 컴포넌트
const FEED_TABS = ['news', 'disclosure', 'macro', 'analysis', 'research', 'etf', 'ipo'];
function feedFor(tab: string) {
  switch (tab) {
    case 'news': return <NewsFeed />;
    case 'disclosure': return <DartFeed />;
    case 'macro': return <MacroFeed />;
    case 'analysis': return <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
    case 'research': return <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
    case 'etf': return <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
    case 'ipo': return <OfferingsFeed />;
    default: return null;
  }
}
```
바꾸기:
```ts
// 우측 피드가 붙는 탭 + 탭별 피드 컴포넌트
const FEED_TABS = ['news', 'disclosure', 'macro', 'analysis', 'research', 'etf', 'ipo'];

// 피드별 지원 국가 — 단일 'KR' 가드 대체. 점진 확장(뉴스·공시는 후속 STEP에서 US 추가).
// 현재 macro만 US 개방(/api/macro/summary가 ECOS+FRED 둘 다 반환). 나머지는 KR 전용 유지.
const FEED_COUNTRY_SUPPORT: Record<string, ('KR' | 'US')[]> = {
  news: ['KR'], disclosure: ['KR'], macro: ['KR', 'US'],
  analysis: ['KR'], research: ['KR'], etf: ['KR'], ipo: ['KR'],
};
function feedSupports(tab: string, c: 'KR' | 'US') { return FEED_COUNTRY_SUPPORT[tab]?.includes(c) ?? false; }

function feedFor(tab: string, country: 'KR' | 'US') {
  switch (tab) {
    case 'news': return <NewsFeed />;
    case 'disclosure': return <DartFeed />;
    case 'macro': return <MacroFeed defaultView={country === 'US' ? 'us' : 'kr'} />;
    case 'analysis': return <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
    case 'research': return <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
    case 'etf': return <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
    case 'ipo': return <OfferingsFeed />;
    default: return null;
  }
}
```
> 비고: `feedFor`는 원래 `country` 접근권이 없어 시그니처를 `feedFor(tab, country)`로 확장. 호출부는 (D)에서 같이 수정.

### (B) 카테고리 탭 가시성 — `feedSupports`도 OR 조건 추가
찾기:
```ts
    const c = categories.find((cat) => cat.slug === slug);
    const hasLinks = !!c && c.links.some((l) => l.country === country);
    return hasLinks ? { slug, label: c!.label } : null;
```
바꾸기:
```ts
    const c = categories.find((cat) => cat.slug === slug);
    const hasLinks = !!c && c.links.some((l) => l.country === country);
    // 피드 지원국가면 큐레이션 링크가 없어도 탭 노출(예: US 거시는 FRED 라이브) → KR 동작은 동일.
    const show = hasLinks || feedSupports(slug, country);
    return show && c ? { slug, label: c.label } : null;
```
> 라벨은 `link_hub` 카테고리에서 가져오므로 `c`(해당 slug의 카테고리)는 존재해야 표시. macro 카테고리가 `categories`에 KR/US 공통으로 존재함을 전제(KR과 동일 라벨 사용). KR에서는 `hasLinks`가 이미 true라 결과 동일 → byte-identical.

### (C) 단일 가드 → `feedSupports`로 교체
찾기:
```ts
        ) : FEED_TABS.includes(activeTab) && country === 'KR' ? (
```
바꾸기:
```ts
        ) : FEED_TABS.includes(activeTab) && feedSupports(activeTab, country) ? (
```

### (D) `feedFor` 호출부 — country 전달
찾기:
```ts
            <aside className="w-full shrink-0 lg:w-96">
              {feedFor(activeTab)}
            </aside>
```
바꾸기:
```ts
            <aside className="w-full shrink-0 lg:w-96">
              {feedFor(activeTab, country)}
            </aside>
```

---

## 2단계 — `components/toolbox/MacroFeed.tsx` (`defaultView` prop 신설)

### (A) 시그니처에 옵셔널 prop 추가
찾기:
```ts
export default function MacroFeed() {
```
바꾸기:
```ts
export default function MacroFeed({ defaultView = 'kr' }: { defaultView?: 'kr' | 'us' } = {}) {
```

### (B) 뷰 상태 초기값을 `defaultView`로
찾기:
```ts
  const [view, setView] = useState<'kr' | 'us'>('kr');
```
바꾸기:
```ts
  const [view, setView] = useState<'kr' | 'us'>(defaultView);
```
> 🇰🇷/🇺🇸 내부 토글(`setView`)은 그대로 → 사용자가 여전히 직접 전환 가능. 기본 뷰만 현재 시장에 맞춰 진입.

---

## 3단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add components/toolbox/ToolboxClient.tsx components/toolbox/MacroFeed.tsx
git commit -m "feat(STEP 413): 피드 국가맵 리팩터 + 거시 US 노출(FRED 이미 완성)"
```

## 확인
- 빌드 통과(타입).
- **US 토글 → 거시(macro) 탭이 노출**되고, 클릭 시 `MacroFeed`가 **미국 지표(FRED: 미국 기준금리·10년물·실업률·CPI)** 를 기본으로 표시. 내부 🇰🇷/🇺🇸 토글로 KR↔US 전환도 정상.
- **KR 영향 없음**: KR 토글에서 거시/뉴스/공시 등 모든 피드 탭이 기존과 동일하게 보이고, 거시 기본 뷰는 🇰🇷.
- 회귀 체크: 뉴스·공시·리포트·ETF·공모주 탭은 US에서 **여전히 미노출**(KR 전용 유지).

## 스킵/보류
- 뉴스·공시·공모주(IPO)의 US 개방은 이 STEP 범위 아님 → **STEP 414~** 에서 각 데이터소스(뉴스 API·SEC EDGAR 등) 준비 후 `FEED_COUNTRY_SUPPORT`에 `'US'` 추가로 점진 개방.
- `macro` 카테고리가 `link_hub`에 US 행으로 없으면 라벨 표시를 위해 (B)의 `c` 존재 전제가 무너질 수 있음 → 그 경우 후속 STEP에서 라벨 폴백(`SPECIAL_LABELS` 유사) 처리. 현재는 KR/US 공통 카테고리 존재 전제.
