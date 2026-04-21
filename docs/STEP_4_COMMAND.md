<!-- 2026-04-21 -->
# Stock Terminal V3 Dashboard V1.1 — Step 4 명령서

**대상**: Claude Code (🔴 Opus 권장)
**실행 명령어**: `cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model opus`

---

## 목표

4행 3열 그리드 → **3행 3열 그리드 + 채팅을 R3C3 grid cell로 편입**.

- 행 높이 +33% 확보 (210px → 280px) → 호가 10단 + 체결 5건 여유롭게 들어감
- 우측 고정 채팅 사이드바 폐기 → R3C3 셀로 편입 (빈 공간 낭비 제거)
- 12 위젯 → 11 위젯(home) + 2 위젯(detail pages)
- 탭 통합으로 "거래량+상승하락", "상승테마+DART공시" 2쌍 병합

## 전제

- 현재 상태: 4행 3열 + 우측 고정 채팅 사이드바 (commit `56b8114`)
- 이 명령 실행 후 기대 상태: 3행 3열 + 셀 내 채팅 + 2개 탭 위젯

---

## 작업 1. `components/widgets/ChatWidget.tsx` 신규 생성

`components/layout/ChatSidebar.tsx` 내용 참조하되:

- `<aside>` 태그와 `fixed right-0 top-[112px] bottom-0 w-[280px]` 전부 제거
- `WidgetCard`로 래핑 (다른 위젯과 일관성) — `title="마켓 채팅"`, `subtitle="Supabase Realtime"`
- 컨테이너: `h-full flex flex-col`
- Supabase Realtime 채널 기존 로직 그대로 복붙 (채널명 `'chat-sidebar'` 유지 OK)
- Header에 Live 인디케이터 (빨간 점 + "Live")
- Message list: `flex-1 overflow-y-auto`
- Input: 하단 `sticky` + `border-t`

---

## 작업 2. 4개 위젯에 `inline` prop 추가

대상 파일:

- `components/widgets/VolumeTop10Widget.tsx`
- `components/widgets/MoversTop10Widget.tsx`
- `components/widgets/TrendingThemesWidget.tsx`
- `components/widgets/DartFilingsWidget.tsx`

각 파일 Read 후 패턴 적용:

```tsx
interface Props { inline?: boolean }

export default function XxxWidget({ inline = false }: Props = {}) {
  // 기존 state, fetch, useEffect 등 그대로

  const content = (
    /* 기존 렌더 중 리스트·테이블 본문 부분만 */
  );

  if (inline) {
    return <div className="h-full overflow-hidden">{content}</div>;
  }

  return (
    <WidgetCard title="..." subtitle="..." href="...">
      {content}
    </WidgetCard>
  );
}
```

- `inline=true` → `WidgetCard` 없이 본문만 렌더
- 기본값 `false` → 기존 동작 유지 (상세 페이지에서 그대로 재사용)

---

## 작업 3. 탭 통합 위젯 2개 신규 생성

### 3-1. `components/widgets/VolumeMoversTabWidget.tsx`

```tsx
'use client';

import { useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';
import VolumeTop10Widget from './VolumeTop10Widget';
import MoversTop10Widget from './MoversTop10Widget';

export default function VolumeMoversTabWidget() {
  const [tab, setTab] = useState<'volume' | 'movers'>('volume');

  const tabs = [
    { id: 'volume' as const, label: '거래량 TOP' },
    { id: 'movers' as const, label: '상승/하락' },
  ];

  return (
    <WidgetCard title="시장 활성도" subtitle="KIS API · 분 단위">
      <div className="h-full flex flex-col">
        <div className="flex border-b border-[#E5E7EB] shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-1.5 text-[11px] font-bold transition-colors ${
                tab === t.id
                  ? 'text-black border-b-2 border-[#0ABAB5] bg-white'
                  : 'text-[#999] hover:text-[#555]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          {tab === 'volume' ? <VolumeTop10Widget inline /> : <MoversTop10Widget inline />}
        </div>
      </div>
    </WidgetCard>
  );
}
```

### 3-2. `components/widgets/ThemesDartTabWidget.tsx`

동일 패턴. 탭: `"상승 테마"` / `"DART 공시"`. 본문: `<TrendingThemesWidget inline />` / `<DartFilingsWidget inline />`. WidgetCard title은 `"발견 피드"` 또는 `"테마·공시"`.

---

## 작업 4. `components/home/HomeClient.tsx` 재작성

### Imports

**제거**:
- `InvestorFlowWidget`
- `NewsFeedWidget`
- `VolumeTop10Widget` (단독 import)
- `MoversTop10Widget` (단독 import)
- `TrendingThemesWidget` (단독 import)
- `DartFilingsWidget` (단독 import)

**추가**:
- `VolumeMoversTabWidget`
- `ThemesDartTabWidget`
- `ChatWidget` (from `@/components/widgets/ChatWidget`)

**유지**: `WatchlistWidget`, `ChartWidget`, `GlobalIndicesWidget`, `NetBuyTopWidget`, `OrderBookWidget`, `TickWidget`

### Grid 설정

```tsx
style={{
  display: 'grid',
  gridTemplateColumns: 'minmax(300px,3fr) minmax(600px,6fr) minmax(300px,3fr)',
  gridTemplateRows: 'repeat(3, calc((100vh - 152px) / 3))',
  gap: 8,
}}
```

### 배치

| Cell | 위젯 | gridRow | gridColumn |
|------|------|---------|-----------|
| R1C1 | `WatchlistWidget` | 1 | 1 |
| R1-2C2 | `ChartWidget` | `'1 / 3'` | 2 |
| R1C3 | `GlobalIndicesWidget` | 1 | 3 |
| R2C1 | `VolumeMoversTabWidget` | 2 | 1 |
| R2C3 | `NetBuyTopWidget` | 2 | 3 |
| R3C1 | `ThemesDartTabWidget` | 3 | 1 |
| R3C2 | `OrderBook + Tick` subgrid (기존 유지) | 3 | 2 |
| R3C3 | `ChatWidget` | 3 | 3 |

### 상단 주석 블록 업데이트

```
//  Row\Col │    Col 1 (3fr)              │    Col 2 (6fr)           │    Col 3 (3fr)
// ─────────┼──────────────────────────────┼─────────────────────────┼──────────────────────
//  Row 1   │  관심종목                    │  차트 (span 2)            │  글로벌 지수
//  Row 2   │  거래량+상승하락 탭          │  ↑                       │  실시간 수급 TOP
//  Row 3   │  상승테마+DART공시 탭        │  호가창 + 체결창          │  마켓 채팅
```

---

## 작업 5. `app/layout.tsx` 정리

- `import ChatSidebar from '@/components/layout/ChatSidebar'` **제거**
- `<ChatSidebar />` 전역 마운트 **제거**
- children wrapper의 `md:pr-[280px]` 클래스 **제거** (이제 채팅이 grid 내부에 있으므로 여백 불필요)

---

## 작업 6. `components/layout/ChatSidebar.tsx` 삭제

Import 잔존 여부 확인:

```bash
grep -rE "ChatSidebar" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v ".next" | grep -v "ChatSidebar.tsx"
```

결과 0개면:

```bash
rm components/layout/ChatSidebar.tsx
```

1개 이상이면 중단하고 어디서 쓰는지 보고.

---

## 작업 7. 상세 페이지 추가

### 7-1. `app/analytics/page.tsx` 신규

```tsx
import InvestorFlowWidget from '@/components/widgets/InvestorFlowWidget';

export default function AnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">투자자별 매매동향</h1>
      <div className="h-[600px]">
        <InvestorFlowWidget />
      </div>
    </div>
  );
}
```

### 7-2. `app/news/page.tsx` 확인

기존 존재 여부 체크:

```bash
ls app/news/page.tsx 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

없으면 `/analytics`와 동일 패턴으로 생성 (`NewsFeedWidget` 마운트). 이미 있으면 NewsFeedWidget import 되어 있는지 열어서 확인, 없으면 추가.

### 7-3. `components/layout/VerticalNav.tsx` 네비 아이콘 추가

기존 `/briefing`, `/calendar`, `/news`, `/filings` 아래에 1개 추가:

- 📊 **분석** → `href="/analytics"`

기존 아이콘들과 동일한 스타일(Tailwind 클래스·사이즈·hover 패턴) 적용.

---

## 작업 8. 빌드 + 런타임 검증

### 빌드

```bash
rm -rf .next
npm run build
```

빌드 에러 → **중단**하고 스택 트레이스 전체 보고.

### dev 서버 + HTTP 체크

```bash
pkill -f "next dev" || true
sleep 2
npm run dev > /tmp/next-dev.log 2>&1 &

for i in 1 2 3 4 5 6 7 8 9 10; do
  if grep -q "Ready" /tmp/next-dev.log 2>/dev/null; then
    echo "✅ dev 서버 ready"
    break
  fi
  sleep 2
done

curl -s -o /dev/null -w "HTTP / = %{http_code}\n" http://localhost:3333/
curl -s -o /dev/null -w "HTTP /analytics = %{http_code}\n" http://localhost:3333/analytics
curl -s -o /dev/null -w "HTTP /news = %{http_code}\n" http://localhost:3333/news
echo "===== 비-Yahoo 에러만 체크 ====="
tail -n 80 /tmp/next-dev.log | grep -iE "error" | grep -v "Yahoo Finance" || echo "✅ No non-Yahoo errors"
```

**기대**: `/`, `/analytics`, `/news` 모두 HTTP 200. Yahoo Finance 401은 기존 이슈라 무시 가능.

---

## 작업 9. Git commit + push

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
refactor: 3-row grid + chat as grid cell + tab consolidation (Step 4)

- HomeClient: 4 rows -> 3 rows grid (row height +33%, 210px -> 280px)
- ChatWidget new: replaces fixed ChatSidebar, placed at R3C3
- VolumeMoversTabWidget new: Volume + Movers tab merged at R2C1
- ThemesDartTabWidget new: Themes + DART tab merged at R3C1
- Add inline prop to Volume/Movers/Themes/Dart for tab reuse
- InvestorFlow -> /analytics page (new)
- NewsFeed -> /news page (verify existing mount)
- Remove ChatSidebar.tsx + layout.tsx md:pr-[280px] wrapper
- Add 분석 nav icon to VerticalNav

Result: 호가+체결 171px -> 280px (호가 10단 + 체결 5건 여유), chart 420px -> 560px
EOF
)"

git push origin main
```

---

## 완료 후 필수 보고

1. 신규 파일 3개 경로 (ChatWidget, VolumeMoversTabWidget, ThemesDartTabWidget)
2. `inline` prop 추가된 위젯 4개 이름 확인
3. ChatSidebar.tsx 삭제 여부 (import 0개였는지)
4. `/news` 페이지 신규 생성 여부 또는 기존 존재 + NewsFeedWidget import 상태
5. `/analytics` 페이지 생성 확인
6. VerticalNav에 추가한 아이콘 위치 + 총 아이콘 개수
7. 빌드 결과 (성공/실패, 경고 개수)
8. curl HTTP 코드 3개 (/, /analytics, /news)
9. 커밋 해시
10. (가능하면) localhost:3333 스크린샷 — 3행 그리드 + R3C3 채팅 + R2C1/R3C1 탭 확인

---

## 실패 시 롤백

빌드 깨지고 원인 불명이면:

```bash
git reset --hard 56b8114
rm -rf .next
npm run dev
```

그 상태 그대로 Cowork에게 보고 (어디서 깨졌는지 + 에러 메시지).
