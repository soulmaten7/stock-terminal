<!-- 2026-06-20 -->
# STEP 287 — [V7 ②-c] 탭 순서 재정렬 + 라벨 개선 + 기본탭 일치

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_287_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 286(`64f8c2f`). 빌드 ✓.
- (참고: 그 사이 link_hub 카테고리 보강 8건은 DB 직접 반영 — git 변경 아님.)

---

## 🎯 목표

게이트웨이 카테고리 탭을 정리:

1. **순서 재정렬** — 뉴스·증권사·유튜브를 앞으로, 리딩방은 끝:
   `뉴스 · 증권사 · 유튜브 · 차트·시세 · 기업·재무 · 리포트 · 공시·신용 · ETF·펀드 · 공모주·배당 · 거시경제 · 거래소 · 커뮤니티 · 리딩방·검증`
2. **라벨 개선** — 헷갈리거나 안 맞는 이름 교체:
   - 차트·분석 → **차트·시세**
   - 재무·분석 → **기업·재무**
   - 공시·규제 → **공시·신용**
   - 리서치·리포트 → **리포트**
   - 리딩방 → **리딩방·검증**
3. **기본 선택 탭 = 첫 탭(뉴스)** 로 일치 (지금은 첫 탭은 유튜브인데 기본 선택은 뉴스라 어긋남).

> 슬러그(내부 식별자)는 그대로, 화면 라벨·순서만 변경. 콘텐츠 렌더 로직 영향 없음.

---

## 📄 파일 1 — `app/page.tsx` (카테고리 라벨 4개 교체)

**찾기:**
```tsx
const CATEGORY_LABELS: Record<string, string> = {
  news: "뉴스",
  chart: "차트·분석",
  analysis: "재무·분석",
  disclosure: "공시·규제",
  research: "리서치·리포트",
  etf: "ETF·펀드",
  ipo: "공모주·배당",
  macro: "거시경제",
  community: "커뮤니티",
  exchange: "거래소",
};
```
**바꾸기:**
```tsx
const CATEGORY_LABELS: Record<string, string> = {
  news: "뉴스",
  chart: "차트·시세",
  analysis: "기업·재무",
  disclosure: "공시·신용",
  research: "리포트",
  etf: "ETF·펀드",
  ipo: "공모주·배당",
  macro: "거시경제",
  community: "커뮤니티",
  exchange: "거래소",
};
```

---

## 📄 파일 2 — `components/toolbox/ToolboxClient.tsx` (순서·기본탭)

### (2-A) 모듈 상수 추가 — `COUNTRIES` 바로 밑에 `TAB_ORDER` / `SPECIAL_LABELS` 삽입

**찾기:**
```tsx
const COUNTRIES = [
  { code: 'KR', label: '🇰🇷 한국' },
  { code: 'US', label: '🇺🇸 미국' },
];
```
**바꾸기:**
```tsx
const COUNTRIES = [
  { code: 'KR', label: '🇰🇷 한국' },
  { code: 'US', label: '🇺🇸 미국' },
];

// 탭 표시 순서 (V7 재정렬): 뉴스·증권사·유튜브 앞으로, 리딩방 끝
const TAB_ORDER = ['news', 'broker', 'youtube', 'chart', 'analysis', 'research', 'disclosure', 'etf', 'ipo', 'macro', 'exchange', 'community', 'room'];
// link_hub 카테고리가 아닌 특수 탭의 라벨
const SPECIAL_LABELS: Record<string, string> = { youtube: '유튜브', broker: '증권사', room: '리딩방·검증' };
```

### (2-B) 기본 선택 탭 = 첫 탭(뉴스)

**찾기:**
```tsx
  const [activeTab, setActiveTab] = useState(initialCategories[0]?.slug ?? 'youtube');
```
**바꾸기:**
```tsx
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0]);
```

### (2-C) 탭 배열을 TAB_ORDER 기준으로 생성

**찾기:**
```tsx
  // 탭 순서: 유튜브 → (link_hub 카테고리) → 증권사 → 리딩방
  const tabs = [
    { slug: 'youtube', label: '유튜브' },
    ...categories.map((c) => ({ slug: c.slug, label: c.label })),
    { slug: 'broker', label: '증권사' },
    { slug: 'room', label: '리딩방' },
  ];
```
**바꾸기:**
```tsx
  // 탭 = TAB_ORDER 순서대로. 특수탭(유튜브·증권사·리딩방)은 항상, 카테고리는 데이터 있을 때만.
  const tabs = TAB_ORDER.map((slug) => {
    const special = SPECIAL_LABELS[slug];
    if (special) return { slug, label: special };
    const c = categories.find((cat) => cat.slug === slug);
    return c ? { slug, label: c.label } : null;
  }).filter((t): t is { slug: string; label: string } => t !== null);
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (TS 타입가드 `t is {...}` 포함).

개발 서버(`npm run dev`, 포트 3333):
1. 홈 → 탭이 **뉴스 · 증권사 · 유튜브 · 차트·시세 · 기업·재무 · 리포트 · 공시·신용 · ETF·펀드 · 공모주·배당 · 거시경제 · 거래소 · 커뮤니티 · 리딩방·검증** 순.
2. 홈 열자마자 **'뉴스' 탭이 선택**돼 있는지(첫 탭과 일치).
3. **증권사** 탭이 2번째에서 BrokerRanking 잘 뜨는지.
4. **유튜브** 탭 Top100 그대로, **리딩방·검증** 탭 "준비 중" 그대로.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 탭 순서 재정렬(뉴스·증권사·유튜브 앞) + 라벨 개선(차트·시세/기업·재무/공시·신용/리포트/리딩방·검증) + 기본탭 일치 (STEP 287)" && git push
```

---

> **한 줄 요약**: 탭을 뉴스·증권사·유튜브 우선 순서로 재정렬, 헷갈리던 라벨(차트·분석/재무·분석/공시·규제/리서치·리포트) 정리, 기본 선택 탭을 첫 탭(뉴스)과 일치.
