# STEP 49 — 위젯 네비게이션 정합성 정리 · 중복 제거

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표**
홈 위젯 13개의 `href` 연결 감사 결과, 대부분 이미 `WidgetCard`의 `href` prop으로 평범한 페이지 이동이 연결되어 있음. 실제 수정이 필요한 항목 4가지만 처리:

1. 사이드바 '시장 지도' 라벨이 잘못된 페이지(`/analytics`, 투자자매매동향 중복)로 연결되어 있던 것을 진짜 시장 지도 콘텐츠(`/analysis` — SectorHeatmap/ThemeGroups/MarketFlow/EconomicDashboard)로 수정
2. `/analytics` 디렉토리 삭제 (`/investor-flow` 와 기능 중복)
3. `WidgetShell.tsx` 삭제 (STEP 47 잔재, 아무 위젯도 사용 안 함, `WidgetCard` 와 기능 중복)
4. `ScreenerMiniWidget` 우상단에 ↗ 아이콘 추가 (다른 위젯과 일관된 [더보기] UX)

**전제 상태 (이전 커밋)**
- STEP 48 완료 커밋: `8ee3c69`
- `WidgetShell.tsx` 존재하나 미사용
- VerticalNav의 '시장 지도' href = `/analytics`
- `app/analytics/page.tsx` 존재 (InvestorFlowWidget 만 렌더)
- `app/investor-flow/page.tsx` 존재 (동일 기능)
- `/analysis` 페이지 존재 (SectorHeatmap + ThemeGroups + MarketFlow + EconomicDashboard)
- `TrendingThemesWidget` 의 `href="/analysis"` 는 이미 올바름

**감사 결과 (수정 불필요, 참고용)**

| 위젯 | 현재 href | 타겟 페이지 | 상태 |
|------|----------|------------|------|
| WatchlistWidget | `/watchlist` | ✓ | OK |
| ChartWidget | `/chart` | ✓ | OK |
| OrderBookWidget | `/orderbook` | ✓ | OK (사이드바에 없지만 위젯에서 직접 진입) |
| TickWidget | `/ticks` | ✓ | OK |
| NewsFeedWidget | `/news` | ✓ | OK |
| DartFilingsWidget | `/disclosures` | ✓ | OK |
| EconCalendarMini | `/calendar` | ✓ | OK |
| MoversTop10Widget | `/movers/price` | ✓ | OK |
| VolumeTop10Widget | `/movers/volume` | ✓ | OK |
| NetBuyTopWidget | `/net-buy` | ✓ | OK |
| GlobalIndicesWidget | `/global` | ✓ | OK |
| TrendingThemesWidget | `/analysis` | ✓ | OK (진짜 시장지도 페이지) |
| ChatWidget | (없음) | — | OK (홈 전용, 상세 페이지 불필요) |
| ScreenerMiniWidget | 폼 submit | /screener | ↗ 버튼 추가 (Part D) |

---

## Part A. VerticalNav '시장 지도' href 수정

**파일**: `components/layout/VerticalNav.tsx`

32줄쯤 아래와 같은 항목을 찾아:
```tsx
{ icon: PieChart,   label: '시장 지도',     href: '/analytics' },
```

`/analytics` 를 `/analysis` 로 변경:
```tsx
{ icon: PieChart,   label: '시장 지도',     href: '/analysis' },
```

변경 후 확인:
```bash
grep -n "시장 지도" components/layout/VerticalNav.tsx
# 출력에 /analysis 가 보여야 함
```

## Part B. `app/analytics/` 디렉토리 삭제

`/analytics` 페이지는 InvestorFlowWidget 하나만 렌더하는데, 이 기능은 이미 `/investor-flow` 페이지가 동일하게 제공. 중복 제거.

```bash
rm -rf app/analytics
```

확인:
```bash
ls app/ | grep -E "analysis|analytics|investor"
# 출력:
# analysis
# investor-flow
# (analytics 는 없어야 함)
```

`/analytics` 참조 흔적 검색 (있으면 제거):
```bash
grep -rn "/analytics" --include="*.tsx" --include="*.ts" app/ components/ lib/ 2>/dev/null | grep -v node_modules || echo "No /analytics references"
```

결과가 있으면 해당 파일 열어서 `/analytics` 를 `/analysis` 로 교체하거나 맥락에 맞게 수정. 없으면 스킵.

## Part C. `WidgetShell.tsx` 삭제

STEP 47에서 만들었지만 어떤 위젯도 사용 안 함. `WidgetCard` 가 이미 동일 기능 (`href` prop + 우상단 ↗ 아이콘) 제공.

```bash
rm components/common/WidgetShell.tsx
```

확인:
```bash
ls components/common/
# WidgetShell.tsx 없어야 함
# WidgetCard.tsx, DisclaimerBanner.tsx 등은 유지
```

import 흔적 검색:
```bash
grep -rn "WidgetShell" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "docs/" || echo "No WidgetShell references"
```

결과 있으면 해당 import 제거. 없으면 스킵 (docs 폴더의 STEP_47 명령서 언급은 남겨둬도 됨 — 히스토리).

## Part D. ScreenerMiniWidget 우상단에 ↗ 버튼 추가

**파일**: `components/widgets/ScreenerMiniWidget.tsx`

현재 구조는 폼만 있음. 다른 위젯처럼 우상단 `ArrowUpRight` 아이콘을 추가해서 키워드 없이도 `/screener` 로 바로 진입 가능하게 만듦.

**수정 전 (1~5줄):**
```tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
```

**수정 후 (1~6줄):**
```tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';
```

변경점: `Link` import 추가, `ArrowUpRight` 아이콘 추가.

---

**수정 전 (22줄):**
```tsx
    <div className="h-full bg-white border border-[#E5E7EB] p-3 flex flex-col justify-center">
```

**수정 후 (22줄):**
```tsx
    <div className="h-full bg-white border border-[#E5E7EB] p-3 flex flex-col justify-center relative">
```

변경점: `relative` 추가 (absolute 자식 positioning용).

---

**수정 전 (23줄 — `<form` 바로 위):**
```tsx
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
```

**수정 후 (이 줄 직전에 Link 삽입):**
```tsx
      <Link
        href="/screener"
        className="absolute top-1 right-1 text-[#BBBBBB] hover:text-[#0ABAB5] transition-colors"
        title="종목 발굴 상세 페이지"
        aria-label="종목 발굴 상세 페이지로 이동"
      >
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
```

변경점: form 태그 바로 위에 `<Link>` 블록 추가. `absolute top-1 right-1` 으로 우상단 구석에 아이콘 배치.

## Part E. 빌드 검증

```bash
npm run build
```

- 성공해야 함
- `/analytics` 참조 에러 없어야 함
- `WidgetShell` 참조 에러 없어야 함
- TypeScript 에러 없어야 함

실패 시 중단하고 보고.

## Part F. 4개 문서 헤더 날짜 오늘로 업데이트

1. `CLAUDE.md` 첫 줄 날짜
2. `docs/CHANGELOG.md` 첫 줄 날짜
3. `session-context.md` 첫 줄 날짜
4. `docs/NEXT_SESSION_START.md` 첫 줄 날짜

## Part G. CHANGELOG.md 에 이번 세션 블록 추가

`docs/CHANGELOG.md` 상단(헤더 날짜 다음)에 아래 블록 추가:

```markdown
## STEP 49 — 위젯 네비게이션 정합성 정리

### 배경
홈 위젯 13개의 `href` 연결 감사 결과, 대부분 이미 `WidgetCard.href` prop 을 통해 평범한 페이지 이동이 연결되어 있었음. STEP 47에서 추가한 `WidgetShell.tsx` 는 중복 컴포넌트(WidgetCard와 기능 동일)로 판명. 그러나 사이드바 '시장 지도' 항목이 중복 페이지(`/analytics` — InvestorFlowWidget 하나만 렌더)를 가리키는 매핑 오류 발견.

### 수정
- `components/layout/VerticalNav.tsx`: '시장 지도' href `/analytics` → `/analysis` (SectorHeatmap + ThemeGroups + MarketFlow + EconomicDashboard 가 있는 실제 시장 지도 페이지)
- `app/analytics/` 디렉토리 삭제 (`/investor-flow` 와 중복 기능)
- `components/common/WidgetShell.tsx` 삭제 (미사용, `WidgetCard` 와 중복)
- `components/widgets/ScreenerMiniWidget.tsx`: 우상단 `ArrowUpRight` 아이콘 링크 추가 (다른 위젯과 일관된 [더보기] UX)

### 유지 (이미 올바른 매핑)
- 11개 위젯 `href` 는 이미 정확함 — Watchlist, Chart, OrderBook, Tick, News, DART, EconCal, Movers, Volume, NetBuy, Global
- TrendingThemesWidget.`href="/analysis"` 는 정답이었음 (시장지도/섹터히트맵 페이지 가리킴)
- ChatWidget 은 홈 전용, 상세 페이지 불필요하므로 href 없음 유지
```

## Part H. session-context.md 완료 블록 추가

`session-context.md` 의 TODO 섹션 근처에 추가:

```markdown
### 2026-04-22 STEP 49 완료
- [x] 홈 위젯 13개 href 감사 — 11개 이미 정확
- [x] VerticalNav '시장 지도' `/analytics` → `/analysis` 수정
- [x] `app/analytics/` 디렉토리 삭제 (중복)
- [x] `WidgetShell.tsx` 삭제 (미사용)
- [x] ScreenerMini 우상단 ↗ 아이콘 추가
- [x] 빌드 검증 통과
```

## Part I. NEXT_SESSION_START.md 업데이트

`docs/NEXT_SESSION_START.md` 현재 상태 기준으로 업데이트:

- 현재 상태: 모든 홈 위젯이 WidgetCard `href` prop 으로 평범한 페이지 이동 연결됨. 사이드바 14항목과 페이지 매핑 정합성 확보. 중복 페이지/컴포넌트 정리 완료.
- 다음 할 일 후보 (STEP 50):
  - (A) **[P0] 레퍼런스 플랫폼 매핑 테이블 작성** — 홈 위젯 13개 + 페이지 14개가 각각 어느 플랫폼(토스증권/키움/네이버증권/Koyfin 등) UI 를 벤치마킹하는지 정리. 수급·상승/하락·거래량급등 위젯의 내부 레이아웃 디테일도 어느 플랫폼 따라갈지 결정
  - (B) 사이드바 14항목 5그룹 카테고리 재구성 (아이콘 바 → 라벨 그룹)

## Part J. Git commit + push

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
STEP 49: Clean up widget navigation mapping

- Fix '시장 지도' sidebar link: /analytics → /analysis
  (/analytics only had InvestorFlowWidget, duplicate of /investor-flow;
   real market-map content SectorHeatmap+ThemeGroups+MarketFlow+EconDashboard
   lives at /analysis)
- Delete app/analytics/ (duplicate)
- Delete components/common/WidgetShell.tsx (unused, WidgetCard has same features)
- Add ArrowUpRight icon link to ScreenerMiniWidget (consistent widget UX)

Audit result: 11/13 home widgets already had correct href via WidgetCard.
Only sidebar '시장 지도' was mismapped; TrendingThemes.href=/analysis was right all along.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

## Part K. 최종 확인

```bash
git log --oneline -5
```

최신 커밋이 "STEP 49" 이어야 함. 종료.

---

## 체크리스트 요약 (Claude Code 용)

- [ ] Part A: VerticalNav '시장 지도' href 수정
- [ ] Part B: `app/analytics/` 삭제 + 참조 흔적 검색
- [ ] Part C: `WidgetShell.tsx` 삭제 + 참조 흔적 검색
- [ ] Part D: ScreenerMini 우상단 ↗ 아이콘 추가 (import 2건 + relative + Link 블록)
- [ ] Part E: `npm run build` 성공
- [ ] Part F: 4개 문서 헤더 날짜 오늘로
- [ ] Part G: CHANGELOG 블록 추가
- [ ] Part H: session-context.md 완료 블록 추가
- [ ] Part I: NEXT_SESSION_START.md 업데이트
- [ ] Part J: git commit + push
- [ ] Part K: 최종 커밋 로그 확인
