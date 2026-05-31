<!-- 2026-05-29 -->
# STEP 114 — 운종 V5 1차 리뉴얼 (구조 통합)

🔴 **Opus 권장** (대규모 리팩토링 — 5개 영역 동시 변경)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `17a2154` (TickerBar 높이·차트 TV 로고 핫픽스)
- 운종 V4 (단타/장타/미장 3창 + 카드 21개) 작동 중
- 사용자 결정 사항 (대화 종합):
  - "단타/장타/미장 분리는 인위적, 사용자는 종목 자체로 봄" → **2창 통합**
  - "카드 21개 중 정확도 보장되는 9개만 본질" → **21개 → 9개**
  - "호가창·체결은 전문가용, 운종 페르소나 아님" → **제거**
  - "토스 컨테이너 1984px 와 운종 1536px 차이로 화면 좁아 보임" → **1984px**
  - "운종 = 오르내림 + 대화. 정보 + 신뢰 + 허브" → 정체성 재확인
  - 토론 게시판 + 종목별 채팅 + 인증은 **STEP 115** (다음 STEP)

## 목표 (5가지 변경)

| # | 변경 | 영향 |
|---|------|------|
| 1 | 컨테이너 max-width: 1536px → **1984px** | 토스 수준 화면 사용 |
| 2 | 3창 (scalper/longterm/us) → **2창 (kr/us)** | 메뉴·라우트·폴더 통합 |
| 3 | 카드 21개 → **9개 정확 카드만** (5 한국 + 4 미국) | 자체 분류·시드 12개 제거 |
| 4 | 종목 상세 4탭 → **2탭 (차트·종합만)** | 호가창·체결 제거 (전문가용) |
| 5 | 채팅 3채널 → **1채널 (시장 전체)** | DB room 컬럼 단순화 (종목별은 STEP 115) |

## 9개 정확 카드 (이게 유일한 본질)

### 한국주식창 (`/kr`) — 5개 카드
1. **🚀 Movers · 등락률 TOP** (KIS ranking) — 기존 ScalperCards 의 MoversCard
2. **🔥 Volume · 거래량 폭증** (KIS volume-rank) — 기존 VolumeCard
3. **💰 NetBuy · 외인/기관 순매수** (KIS investor-rank) — 기존 NetBuyBrokerCard (거래원 TOP3 제거됨)
4. **📄 단타 공시 (당일)** (DART) — 기존 DisclosureCard
5. **📄 장타 공시 (실적·배당·증자)** (DART 필터링) — 기존 LongtermCards 의 DisclosuresFilterCard

### 미국주식창 (`/us`) — 4개 카드
6. **📊 미국 지수** (S&P/Nasdaq/Dow/Russell/VIX, Yahoo) — 기존 IndicesCard
7. **🚀 M7** (Yahoo batch quote) — 기존 M7Card
8. **🚀 미국 Movers** (Yahoo day-gainers) — 기존 UsMoversCard
9. **🕐 미국 시계 + 시장 상태** (ForexClockCard, USD/KRW 제거됨) — 기존

### 제거 대상 카드 (12개)
- 단타: VI(자체 분류), 테마(자체 매핑 10개), 공매도(시드)
- 장타: 실적 캘린더(시드), 저평가 quant_factors, 배당TOP DB, 52주 신저가 DB, 섹터 히트맵(자체), 관리종목(시드)
- 미장: Pre/After(일부 종목만), 미국 뉴스(소스 차이), FOMC 캘린더(시드)

→ 12개 카드 컴포넌트는 **삭제** (`ScalperCards.tsx`, `LongtermCards.tsx`, `UsCards.tsx` 안에서 해당 export 제거)

---

## 작업 디테일

### [1] 컨테이너 너비 — `app/layout.tsx`

기존 (line 61):
```tsx
<div className="w-full max-w-screen-2xl mx-auto flex-1 flex flex-col">
```

변경:
```tsx
<div className="w-full max-w-[1984px] mx-auto flex-1 flex flex-col">
```

### [2] 3창 → 2창 통합

#### 2-A. 새 라우트 폴더 생성 — `app/(windows)/kr/`

기존 `app/(windows)/scalper/`, `app/(windows)/longterm/` 두 폴더를 **하나로 통합** → `app/(windows)/kr/`.

신규 파일: `app/(windows)/kr/page.tsx`

```tsx
import { KrCards } from "@/components/cards/KrCards";

export const metadata = { title: "한국주식 — 운종" };

export default function KrPage() {
  return <KrCards />;
}
```

#### 2-B. 카드 디테일 동적 라우트 — `app/(windows)/kr/[card]/page.tsx`

기존 `app/(windows)/scalper/[card]/page.tsx` + `longterm/[card]/page.tsx` 통합. 기존 코드 그대로 복사하고 카드 키 통합 (movers/volume/netbuy/disclosure/longterm-disclosure).

#### 2-C. 미국주식 유지 + 라벨

`app/(windows)/us/` 폴더는 그대로. 메타데이터만 변경: `title: "미국주식 — 운종"`.

#### 2-D. /scalper, /longterm 리다이렉트

`app/(windows)/scalper/page.tsx` 와 `app/(windows)/longterm/page.tsx`:

```tsx
import { redirect } from "next/navigation";
export default function Page() { redirect("/kr"); }
```

또는 `next.config.ts` 에 redirect 규칙 추가:

```ts
async redirects() {
  return [
    { source: "/scalper", destination: "/kr", permanent: true },
    { source: "/scalper/:path*", destination: "/kr/:path*", permanent: true },
    { source: "/longterm", destination: "/kr", permanent: true },
    { source: "/longterm/:path*", destination: "/kr/:path*", permanent: true },
  ];
}
```

→ **next.config.ts 방식 추천** (페이지 파일 둘 다 삭제, redirect 자동).

#### 2-E. 홈 페이지 redirect 변경 — `app/page.tsx`

기존:
```tsx
import { redirect } from "next/navigation";
export default function Page() { redirect("/scalper"); }
```

변경:
```tsx
import { redirect } from "next/navigation";
export default function Page() { redirect("/kr"); }
```

### [3] 메뉴 라벨 변경 — `components/header/MainNav.tsx`

기존:
```tsx
const PRIMARY_WINDOWS = [
  { href: "/scalper", label: "단타창", emoji: "⚡" },
  { href: "/longterm", label: "장타창", emoji: "🌳" },
  { href: "/us", label: "미국주식창", emoji: "🌙" },
] as const;
```

변경 (2창):
```tsx
const PRIMARY_WINDOWS = [
  { href: "/kr", label: "한국주식", emoji: "🇰🇷" },
  { href: "/us", label: "미국주식", emoji: "🇺🇸" },
] as const;
```

(SECONDARY_LINKS — 종목발굴/캘린더 — 그대로 유지)

### [4] 카드 통합 + 정리

#### 4-A. 신규 파일 — `components/cards/KrCards.tsx`

기존 `ScalperCards.tsx` 와 `LongtermCards.tsx` 에서 **5개 카드만** 가져와서 통합:

```tsx
"use client";

import { MoversCard, VolumeCard, NetBuyBrokerCard, DisclosureCard } from "./ScalperCards";
import { DisclosuresFilterCard } from "./LongtermCards";

export function KrCards() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <MoversCard />
      <VolumeCard />
      <NetBuyBrokerCard />
      <DisclosureCard />
      <DisclosuresFilterCard />
    </div>
  );
}
```

#### 4-B. `components/cards/ScalperCards.tsx` 정리

다음 카드만 유지 (export):
- MoversCard
- VolumeCard
- NetBuyBrokerCard
- DisclosureCard

다음 카드 **삭제** (컴포넌트 함수·import·관련 type 다 정리):
- ViCard
- ThemeCard
- ShortCard

#### 4-C. `components/cards/LongtermCards.tsx` 정리

다음 카드만 유지:
- DisclosuresFilterCard (실적·배당·증자 공시)

다음 카드 **삭제**:
- EarningsCalendarCard
- ValueStockCard (저평가)
- DividendTopCard
- LowsCard (52주 신저가)
- SectorCard
- WarningCard (관리종목)

#### 4-D. `components/cards/UsCards.tsx` 정리

다음 카드만 유지:
- IndicesCard
- M7Card
- UsMoversCard
- ForexClockCard (USD/KRW 제거됨, 시계+시장상태만)

다음 카드 **삭제**:
- PrePostCard
- NewsCard (미국 뉴스)
- FomcCard

### [5] 종목 상세 패널 정리 — `components/sidepanel/StockDetailPanel.tsx`

탭 4개 → **2개로 축소**:
- ✅ 차트 (ChartTab) — 유지
- ❌ 호가창 (OrderBookTab) — **삭제**
- ❌ 체결 (TickTab) — **삭제**
- ✅ 종합 (OverviewTab) — 유지

수정:
```tsx
// 기존 (line ~50)
type Tab = "chart" | "orderbook" | "tick" | "overview";

const TABS: Array<{ id: Tab; label: string; emoji: string }> = [
  { id: "chart", label: "차트", emoji: "📈" },
  { id: "orderbook", label: "호가창", emoji: "📊" },
  { id: "tick", label: "체결", emoji: "⚡" },
  { id: "overview", label: "종합", emoji: "📋" },
];

// 변경
type Tab = "chart" | "overview";

const TABS: Array<{ id: Tab; label: string; emoji: string }> = [
  { id: "chart", label: "차트", emoji: "📈" },
  { id: "overview", label: "종합", emoji: "📋" },
];
```

그리고 탭 컨텐츠 렌더링 부분 (inline 모드 + 사이드 모드 둘 다):

```tsx
{activeTab === "chart" && <ChartTab symbol={selectedSymbol.code} />}
{activeTab === "overview" && <OverviewTab symbol={selectedSymbol.code} />}
```

(`orderbook`, `tick` 렌더링 코드 통째로 삭제)

OrderBookTab, TickTab 함수도 **삭제** (사용 안 됨).

### [6] 채팅 3채널 → 1채널 — `components/sidebar/ChatPanel.tsx`

기존:
```tsx
const ROOM_META: Record<string, { window: string; emoji: string }> = {
  scalper:  { window: "단타창",      emoji: "⚡" },
  longterm: { window: "장타창",      emoji: "🌳" },
  us:       { window: "미국주식창",  emoji: "🌙" },
};

function getRoomKey(pathname: string | null): "scalper" | "longterm" | "us" {
  if (pathname?.startsWith("/longterm")) return "longterm";
  if (pathname?.startsWith("/us")) return "us";
  return "scalper";
}
```

변경 (단일 채널 `general`):
```tsx
const ROOM_META: Record<string, { window: string; emoji: string }> = {
  general: { window: "운종 전체 채팅", emoji: "💬" },
};

function getRoomKey(): "general" {
  return "general";
}
```

`room` state 와 useEffect dependency 도 함께 정리:
```tsx
const room: "general" = "general";  // 고정
```

#### 6-B. DB 마이그레이션 — `supabase/migrations/015_chat_unify.sql` 신규

```sql
-- 015: 채팅 room 통합 (scalper/longterm/us → general)
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_room_check;

UPDATE public.chat_messages
  SET room = 'general'
  WHERE room IN ('scalper', 'longterm', 'us');

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_room_check
  CHECK (room IN ('general'));

-- 디폴트 변경
ALTER TABLE public.chat_messages
  ALTER COLUMN room SET DEFAULT 'general';
```

⚠️ **이 마이그레이션은 Claude Code 가 직접 적용 X (DB 접근 X). Cowork 가 별도로 Supabase MCP 로 적용**.

#### 6-C. ContextNav 영구 삭제 (이미 layout 에서 분리됐지만 파일도 정리)

`components/header/ContextNav.tsx` 자체는 보존 (사용자 결정).

### [7] 미사용 컴포넌트·페이지 정리

다음 파일들은 카드 삭제 후 import 되지 않으므로 grep 으로 확인 후 정리:

```bash
# 사용 X 카드 컴포넌트 grep
grep -rn "ViCard\|ThemeCard\|ShortCard\|EarningsCalendarCard\|ValueStockCard\|DividendTopCard\|LowsCard\|SectorCard\|WarningCard\|PrePostCard\|NewsCard\|FomcCard" --include="*.tsx" --include="*.ts"
```

import 되는 곳이 있으면 정리. 단 카드 디테일 페이지 (`/scalper/[card]/page.tsx` 등) 는 라우트 redirect 로 처리되므로 신경 안 써도 됨.

### [8] 빌드 검증

```bash
npm run build 2>&1 | tail -30
```

체크:
- TypeScript 에러 없음
- ESLint 미사용 import 경고 정리
- 라우트 redirect 정상 (npm run start 후 /scalper 접속 → /kr 자동 이동)

### [9] 커밋 + 푸시

```bash
git add -A
git commit -m "refactor: 운종 V5 1차 리뉴얼 — 구조 통합

5가지 큰 변경:

1. 컨테이너 1984px (max-w-screen-2xl=1536 → max-w-[1984px])
   - 토스 증권 동일 수준, 1920px 모니터에서 화면 거의 풀폭 활용

2. 3창 → 2창 통합 (단타/장타/미장 → 한국주식/미국주식)
   - app/(windows)/scalper, longterm → app/(windows)/kr 통합
   - app/(windows)/us 유지
   - /scalper, /longterm 라우트 → /kr 영구 redirect (next.config.ts)
   - 홈 / redirect 도 /kr 로 변경
   - 메뉴 라벨: ⚡단타창/🌳장타창/🌙미국주식창 → 🇰🇷한국주식/🇺🇸미국주식

3. 카드 21개 → 정확 9개만 (다른 플랫폼과 동일한 결과 보장되는 것만)
   - 한국 5개: Movers·Volume·NetBuy·단타공시·장타공시(필터)
   - 미국 4개: Indices·M7·UsMovers·시계+시장상태
   - 삭제 12개: VI(자체분류)·테마(자체매핑)·공매도(시드)·실적캘린더(시드)·저평가·배당TOP·52주신저가·섹터히트맵(자체)·관리종목(시드)·Pre/After·미국뉴스·FOMC(시드)

4. 종목 상세 4탭 → 2탭 (호가창·체결 제거, 전문가용이라 운종 페르소나 X)
   - 유지: 차트, 종합
   - 삭제: 호가창, 체결

5. 채팅 3채널 → 1채널 (단타/장타/미장 → general 통합)
   - 사용자: '같은 종목인데 채널 분리는 인위적' (희석 효과 해소)
   - 종목별 채팅은 STEP 115 에서 별도 구현
   - DB 마이그레이션 015_chat_unify.sql 동봉 (Cowork MCP 로 적용)

배경: 운종 V4 (단타/장타/미장 + 21카드) 사용자 피드백
- '단타/장타 구분은 사용자 선택. 분리는 인위적'
- '21개 중 정확도 보장 9개만 운종이 직접 표시할 가치'
- '나머지는 네이버/키움/FnGuide가 더 잘함 → 그쪽으로 보내는 허브'

다음 STEP 115: 토론 게시판 + 종목별 채팅 + 인증 시스템 (Layer 3)"
git push
```

## 검증 (사용자 안내용)

푸시 후 브라우저 하드 리프레시:

1. **컨테이너 너비** — 1920px 모니터에서 좌우 여백 거의 사라짐 (1984px 까지 확장)
2. **메뉴** — Row 3 좌측: 🇰🇷한국주식 🇺🇸미국주식 (2개)
3. **/scalper 접속** → /kr 로 자동 이동 (메뉴도 한국주식 활성)
4. **/longterm 접속** → /kr 로 자동 이동
5. **한국주식 페이지** → 카드 5개 (Movers·Volume·NetBuy·단타공시·장타공시)
6. **미국주식 페이지** → 카드 4개 (Indices·M7·UsMovers·시계)
7. **삼성전자 클릭** → 종목 상세 패널: 차트·종합 2개 탭만
8. **좌측 채팅** → "💬 운종 전체 채팅" (단타/장타/미장 분리 X)

## 완료 후 보고

- ✅/❌ 빌드 결과 + TypeScript 에러 0
- ✅/❌ grep 결과 (삭제한 12개 카드 컴포넌트 import 0건)
- ✅/❌ 커밋 해시 + 푸시
- ✅/❌ /scalper 접속 시 /kr 자동 이동 확인
- DB 마이그레이션 015 는 Cowork 가 별도 적용 안내 (Claude Code 는 적용 X)

## 잠재 이슈 + 대응

| 이슈 | 대응 |
|------|------|
| 카드 디테일 페이지 (scalper/[card]) 가 redirect 후 작동 | next.config.ts redirect 가 자동 처리 |
| ChatPanel `room` 상태가 useEffect dependency 라 무한 루프 가능 | `room` 을 const 로 고정 |
| 삭제 카드의 API endpoint (예: /api/krx/short-interest) 가 안 쓰임 | API 파일 자체는 보존 (추후 활용 가능) |
| 카드 21개 중 일부가 시드 데이터로 동작 중 → DB 영향 X | 컴포넌트만 삭제, DB 그대로 |
| 종목 상세 호가창·체결 탭 사용자가 좋아했을 수 있음 | 사용자 결정대로 진행, 피드백 받아 부활 가능 |

## 후속 STEP

- **STEP 115** — 종목 페이지 신규 (/stock/[code]) + 토론 게시판 + 종목별 채팅 + 인증
- **STEP 116** — V3 잔재 페이지 26개 정리 (현재 task #32 STEP 112 → 116 으로 번호 조정)
- **STEP 117** — 새 홈 페이지 (/ = 시장 지표 + 관심 + 핫 이슈 + HOT 토론·채팅)
- **STEP 118** — Vercel 배포
