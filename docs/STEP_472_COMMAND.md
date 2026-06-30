<!-- 2026-06-30 -->
# STEP 472 — 세부 탭 5묶음 재정렬 + '거래소·기관' 리네임 + 묶음 구분선

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_472_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
한국 탭 세부 카테고리를 **사용자가 한눈에 구조를 이해**하도록 재정비:
1. **5개 묶음 순서**: 시세(종목·상품·차트·시세) → 정보(뉴스·공시·신용·리포트·기업·재무·거시경제) → 상품(ETF·펀드·공모주·배당) → **거래소·기관** → 사람(커뮤니티·유튜브·리딩방·검증). (거래소를 커뮤니티 앞으로 올림.)
2. **'거래소' → '거래소·기관'** (KRX+예탁원·협회·결제·외환중개 등 유관기관 다 포함이라 직관적).
3. **묶음 사이 얇은 세로 구분선** — 탭바에서 5개 그룹이 시각적으로 갈려 보이게.

## 전제
- 최신 main + 471. 2개 파일 수정: `components/toolbox/ToolboxClient.tsx`(2곳)·`app/page.tsx`(1곳). 클라이언트 HMR + 서버 라벨(자동 재컴파일).

---

## (1) `components/toolbox/ToolboxClient.tsx`

### (1a) TAB_ORDER 재정렬 + 묶음 경계 상수 — 찾기:
```tsx
const TAB_ORDER = ['market', 'chart', 'news', 'disclosure', 'research', 'analysis', 'macro', 'etf', 'ipo', 'community', 'exchange', 'youtube', 'room'];
```
바꾸기:
```tsx
const TAB_ORDER = ['market', 'chart', 'news', 'disclosure', 'research', 'analysis', 'macro', 'etf', 'ipo', 'exchange', 'community', 'youtube', 'room'];
// 탭 묶음 경계 — 각 묶음의 첫 탭 앞에 얇은 구분선(시세 | 정보 | 상품 | 거래소·기관 | 사람)
const CLUSTER_START = new Set(['news', 'etf', 'exchange', 'community']);
```

### (1b) 탭 렌더에 구분선 — 찾기:
```tsx
      <div className="flex gap-1 overflow-x-auto border-b border-unjong-border px-2 py-2 sm:px-3">
        {tabs.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setActiveTab(t.slug)}
            className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors sm:py-1.5 ${
              activeTab === t.slug ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
```
바꾸기:
```tsx
      <div className="flex items-stretch gap-1 overflow-x-auto border-b border-unjong-border px-2 py-2 sm:px-3">
        {tabs.map((t, i) => (
          <Fragment key={t.slug}>
            {i > 0 && CLUSTER_START.has(t.slug) ? (
              <span aria-hidden className="mx-1 my-1 w-px shrink-0 self-stretch bg-unjong-border" />
            ) : null}
            <button
              type="button"
              onClick={() => setActiveTab(t.slug)}
              className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors sm:py-1.5 ${
                activeTab === t.slug ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
              }`}
            >
              {t.label}
            </button>
          </Fragment>
        ))}
      </div>
```
> `Fragment`는 이미 import 되어 있음(STEP 468). 안 되어 있으면 `import { Fragment, useState, useEffect } from 'react';`로.

---

## (2) `app/page.tsx` — 거래소 라벨 리네임 — 찾기:
```tsx
  exchange: "거래소",
};
```
바꾸기:
```tsx
  exchange: "거래소·기관",
};
```

---

## 확인 (HMR — 새로고침, 라벨 안 바뀌면 클린 재시작 `pkill -f "next dev"; rm -rf .next; npm run dev`)
- 탭 순서: 종목·상품 · 차트·시세 ｜ 뉴스 · 공시·신용 · 리포트 · 기업·재무 · 거시경제 ｜ ETF·펀드 · 공모주·배당 ｜ **거래소·기관** ｜ 커뮤니티 · 유튜브 · 리딩방·검증.
- 묶음 5곳 사이(뉴스 앞·ETF 앞·거래소·기관 앞·커뮤니티 앞)에 얇은 세로 구분선.
- 거래소 탭 이름이 **거래소·기관**으로 표시.
- 모바일에서도 가로 스크롤로 구분선 포함 정상.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 확인 후 (이상하면 구분선/순서 되돌릴 수 있음) 묶어서 커밋·배포.
