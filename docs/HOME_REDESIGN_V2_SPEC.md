<!-- 2026-04-17 -->
# Home Redesign V2 — Multi-Expert Spec (세션 #9)

> **목적**: 홈 화면을 "완성된 전업투자자 데이터 터미널"로 느껴지게 재설계한다.
> **전제**: 광고주 영업 전, 구독 전환 전, 딱 하나 보여줄 게 있다면 홈이다. 홈에서 1초 안에 "이거 진짜다" 판정이 나야 한다.
> **이 문서의 용도**: Claude Code가 읽고 그대로 실행할 수 있도록, 색/폰트/여백/컴포넌트 위치까지 모든 결정을 박아두었다.

---

## 0. 실행 원칙 (Ground Rules)

1. **한국 주식 색상 법칙 불변**: 상승 = 빨강 `#FF3B30`, 하락 = 파랑 `#007AFF`. 절대 바꾸지 않는다.
2. **Ad 영역은 숨기기만** (DB/컴포넌트 코드는 남긴다). 광고주 붙으면 다시 켤 것.
3. **한 번에 한 Phase만 실행**. Phase 1 빌드 OK 후 Phase 2 진행.
4. **max-width = 2400px**, 내부는 CSS Grid로 100% 채움. 4K/울트라와이드 가독성 확보.
5. **핵심 앵커 3개 = Watchlist + Breaking + Chat**. 이 3개는 어느 해상도에서도 반드시 보여야 한다.
6. **모든 실시간 컴포넌트에 "last updated" 타임스탬프**를 표기한다. "진짜 데이터다" 신호.
7. **코드/기술 용어는 영어, UI 카피는 한국어**.

---

## 1. 전문가 패널 의견 (각도별 관점)

### 🎯 UX Director (Don Norman / NN Group 관점)
- **인지 부하 최소화**: 첫 화면에 17개 위젯이 있어도 시선 흐름이 "좌→우→하"로 선형이면 뇌는 부담 안 받음.
- **F-pattern vs Z-pattern**: 터미널 제품은 F-pattern (좌상단이 가장 중요). 좌상단에 Watchlist 고정.
- **Fitts' Law**: 자주 쓰는 요소(종목 검색, 채팅 입력)는 크고 접근성 높은 위치에.
- **Hick's Law**: 탭/필터 선택지 ≤ 7개. 현재 "오늘의 시장" 5개 카드는 OK, 더 늘리면 안 됨.
- **Feedback immediacy**: 가격 변동 시 <150ms 이내 플래시 (현재 600ms — 너무 느림, 300ms로).

### 📊 Fintech Product Designer (Bloomberg Terminal / Refinitiv Eikon 경험)
- **정보 밀도 = 가치 증빙**. 여백 많으면 "블로그"처럼 보임. 터미널은 조밀해야 함.
- **행간**: 1.3 (현재 1.5 → 너무 넓음). 숫자 표 행간은 1.2.
- **카드 경계**: 3px 민트 보더는 "버튼처럼" 보임. 1px 짙은 회색 + 내부 섹션 구분선이 프로페셔널.
- **Heading → 데이터 gap**: 현재 mb-6 (24px) → 8~12px로 타이트하게.
- **실시간 표시자**: 각 라이브 블록 좌상단에 🟢 점 (pulse 애니메이션). "켜져 있다" 신호.

### 🎨 Visual Designer (Apple HIG / Material 관점)
- **Typographic scale** (modular, 1.125 ratio): 10/11/12/13/14/16/18/20/24/32/40. 바깥 스케일 금지.
- **Font stack**:
  - Sans: `Pretendard, -apple-system, sans-serif`
  - Mono (숫자): `'JetBrains Mono', 'SF Mono', monospace`
  - 숫자는 **항상 mono + tabular-nums**. 변동 시 칸 흔들림 방지.
- **Color tokens**: hex 하드코딩 대신 CSS variable로 관리.
- **Border radius**: 0 (터미널 느낌) or 2px (미세). 절대 8px+ 금지 (블로그 느낌).
- **Shadow**: 최소. `0 1px 2px rgba(0,0,0,0.04)` 정도만.

### 🔧 Frontend Engineer (Next.js 16 + Tailwind 관점)
- **CSS Grid > Flexbox**: 2D 레이아웃은 Grid가 더 안정적 (현재는 flex 중첩 → 브레이크 취약).
- **Container Query** 사용 가능. 각 카드가 자기 폭에 반응하게.
- **Sticky positioning**: `position: sticky; top: 80px;` — header 높이 고려.
- **Hydration safe**: `mounted` 플래그 패턴 유지. 초기 렌더에 skeleton 표시.
- **실시간 폴링 조율**: Watchlist 10s / Flow 60s / Chat realtime / News 30s. 전부 동시에 돌면 네트워크 혼잡. 각 컴포넌트의 interval을 stagger (0s, 3s, 6s, ...).

### 📈 Data Visualization Specialist (Edward Tufte 관점)
- **Data-ink ratio 최대화**: 장식 제거, 데이터 강조.
- **숫자 포맷**:
  - 가격: `72,400` (3자리 쉼표, 단위 생략)
  - 변동률: `+1.68%` 또는 `-0.33%` (+/- 명시, 소수 2자리)
  - 시가총액: `431조` `4,510억` `95억` (한국식 축약)
  - 거래량: `15.2M` `4,521K` (K/M 축약)
- **Sparkline**: WatchlistLive 각 행에 24px 높이 sparkline 추가하면 "살아있음" 배가.
- **색상 대비**: 상승/하락 색만으로 구분하지 말고, 등락률 텍스트 앞에 ▲/▼ 기호 추가 (색맹 대응).

### 🇰🇷 Korean Retail Investor UX (HTS/MTS 경험)
- **관심종목이 홈 최좌상단이어야 함**: HTS는 전부 그 구조. 투자자는 열자마자 "내 종목" 확인.
- **수급 정보 노출 필수**: 외국인/기관 매수 TOP10은 한국 개인투자자의 "선행지표". 홈에 반드시.
- **종목코드 6자리 표시**: `삼성전자 005930` — 종목명 옆에 6자리 코드. 한국 투자자 습관.
- **지수 배지**: 상단 ticker bar에 KOSPI / KOSDAQ / KOSPI200 / 원달러 / WTI 금 순서.
- **저녁 시간대 고려**: 장 마감 후 (15:30~)는 "오늘의 결과 리포트" 느낌. 장중과 같은 깜빡임은 오히려 피로.

### ⚡ Motion Designer (라이브스코어 철학)
- **Flash 지속시간**: 가격 변동 플래시 = 300ms (부드러운 fade).
- **Pulse for realtime indicator**: `@keyframes pulse { 0%,100% {opacity:1} 50% {opacity:0.4} }` 2s 무한.
- **채팅 신규 메시지**: slide-in 200ms + 살짝의 subtle highlight 500ms.
- **과도한 애니메이션 금지**: hover 확대, transform scale, bounce 등은 터미널에 안 어울림.

### ✍️ Copywriter (한국 투자자 언어)
- **헤더 카피**: "오늘의 시장" → "실시간 시장 현황" (더 능동적).
- **에러 카피**: "데이터를 불러오지 못했습니다" → "데이터 갱신 실패 · 재시도 중…" (계속 시도 중임을 알림).
- **빈 상태 카피**:
  - 채팅: "먼저 의견을 남겨보세요" (현재 "아직 메시지가 없습니다" → 수동적).
  - 관심종목: "관심종목을 추가하세요" + CTA 버튼.
- **데이터 라벨**: "외국인 순매수 TOP10" (O), "외국인" (X — 모호).
- **실시간 표시**: "LIVE · 10초 간격" 형식으로 명시.

---

## 2. 디자인 시스템 (공식 토큰)

### 2.1 Color Tokens (app/globals.css에 CSS variables로 주입)

```css
:root {
  /* Brand */
  --color-primary: #0ABAB5;          /* 민트 — 강조, 링크 */
  --color-primary-hover: #088F8C;
  --color-accent-gold: #C9A96E;       /* 프리미엄 배지 */

  /* Stock (한국식, 절대 불변) */
  --color-up: #FF3B30;                /* 상승 */
  --color-down: #007AFF;              /* 하락 */
  --color-flat: #8E8E93;              /* 보합 */

  /* Grayscale */
  --color-black: #0D1117;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-border: #E5E7EB;
  --color-border-strong: #D1D5DB;
  --color-bg-white: #FFFFFF;
  --color-bg-gray-50: #FAFAFA;
  --color-bg-gray-100: #F5F5F5;
  --color-bg-gray-200: #F0F0F0;

  /* Dark (for dark header strips) */
  --color-dark-bg: #0D1117;
  --color-dark-hover: #161B22;
  --color-dark-border: #2D3748;

  /* Status */
  --color-live: #10B981;              /* 실시간 Live 점 */
  --color-warning: #F59E0B;
  --color-error: #EF4444;
}
```

### 2.2 Typography Scale

| Token | Size | Usage |
|-------|------|-------|
| text-2xs | 10px | Micro labels, timestamps |
| text-xs | 11px | Secondary meta, table headers |
| text-sm | 12px | Default table cells, chat |
| text-base | 13px | Default body |
| text-md | 14px | Card body |
| text-lg | 16px | Card titles |
| text-xl | 18px | Section titles |
| text-2xl | 20px | Row headers |
| text-3xl | 24px | Page H1 |
| text-4xl | 32px | Hero only |

Line-heights: body 1.45 / headings 1.2 / numbers 1.1.

Font-weight: 400 (regular) / 500 (medium) / 700 (bold) — **600 금지** (한국어에서 어중간).

### 2.3 Spacing (8pt grid)

Tailwind 기본 그대로: `p-1(4)` / `p-2(8)` / `p-3(12)` / `p-4(16)` / `p-6(24)` / `p-8(32)`.
카드 내부 패딩 표준: `p-4` (16px).
카드 간 gap 표준: `gap-3` (12px).

### 2.4 Border & Shadow

- 카드 기본 보더: `border border-[color:var(--color-border)]` (1px).
- 하이라이트 카드 (Watchlist/Chat): 좌측 3px `border-l-[3px] border-l-[color:var(--color-primary)]` — 민트 세로줄만 강조 (전체 보더 아님).
- Shadow 사용 금지 (터미널은 평면).
- Border radius: 전체 0.

### 2.5 Motion

```css
--duration-flash: 300ms;
--duration-hover: 120ms;
--duration-slide: 200ms;
--easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 3. 홈 새 레이아웃 (Grid Blueprint)

### 3.1 전체 컨테이너
```
max-width: 2400px
padding: 0 16px (min), 0 24px (≥1024px)
display: grid
grid-template-rows: auto auto auto auto
row-gap: 12px
```

### 3.2 Row 구조 (데스크탑 ≥1280px)

```
┌─────────────────────────────────────────────────────────────────┐
│ ROW 0 — Global Ticker Bar (높이 44px, 전체폭)                    │
│ KOSPI | KOSDAQ | KOSPI200 | USD/KRW | WTI | GOLD (horizontal)    │
└─────────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────────┬────────────────────┐
│ ROW 1        │ 관심종목 + 속보 + 채팅                             │
│ grid:        │                                                  │
│ 300px 1fr 340px                                                  │
├──────────────┼──────────────────────────────┼────────────────────┤
│ WatchlistLive│ BreakingFeed (News | Disc)   │ SidebarChat        │
│ (300px wide) │ (2-col 내부 분할)             │ (340px, sticky)    │
│              │                              │                    │
└──────────────┴──────────────────────────────┴────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ ROW 2 — InstitutionalFlow (외국인/기관 TOP10, 전체폭, 2-col 내부) │
└─────────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────┬──────────────┬─────────────────────┐
│ ROW 3 — 4-col 카드 (VolumeSpike / ProgramTrading / WarningStocks / MarketMiniCharts) │
└──────────────┴──────────────┴──────────────┴─────────────────────┘
┌──────────────┬──────────────┬──────────────────────────────────┐
│ ROW 4 — 주요 일정 3-col (EconomicCalendar / IpoSchedule / EarningsCalendar) │
└──────────────┴──────────────┴──────────────────────────────────┘
```

### 3.3 반응형 Breakpoint

| 폭 | 레이아웃 |
|-----|---------|
| ≥1600px | Row1 = [300px, 1fr, 340px] |
| 1280~1599px | Row1 = [280px, 1fr, 320px], Row3 4-col 유지 |
| 1024~1279px | Row1 = [1fr, 320px] (Chat은 우측 남김, Watchlist는 Row1 상단 전체폭) |
| 768~1023px | 단일 컬럼, Chat은 floating 버튼 (우하단 fixed) |
| <768px | 모바일 스택, Chat은 floating |

### 3.4 Sticky 정책
- Header: 0 (기존 유지).
- Ticker Bar: top 48px (Header 바로 아래).
- SidebarChat: top 92px (Header + Ticker Bar).
- 스크롤해도 Chat은 항상 시야 내.

---

## 4. 섹션별 상세 스펙

### 4.1 🆕 Row 0 — GlobalTickerBar (신규)

**파일**: `components/home/GlobalTickerBar.tsx`

**구조**: 수평 flex, 각 항목 `gap-6`, 전체 `h-11 bg-[var(--color-dark-bg)] text-white`.

**표시 항목 (순서 고정)**:
1. KOSPI · 값 · 전일대비 ▲/▼ %
2. KOSDAQ · 값 · 전일대비
3. KOSPI200 · 값 · 전일대비
4. USD/KRW · 값 · 변동
5. WTI · 값
6. Gold · 값

**데이터 출처**: KIS `/api/kis/price?symbol=0001` (KOSPI), `0002` (KOSDAQ) 등. 환율/원자재는 추후 FRED/KRX 연동, Phase 1에서는 **정적 placeholder + "LIVE 연동 예정" 뱃지**.

**폰트**: 종목명 `text-xs font-bold` / 값 `text-sm font-mono tabular-nums font-bold` / 변동 상승 `text-[var(--color-up)]` / 하락 `text-[var(--color-down)]`.

**Polling**: 30초 (KIS 외 데이터는 Phase 2에서).

---

### 4.2 🔧 Row 1 Left — WatchlistLive (수정)

**파일**: `components/home/WatchlistLive.tsx`

**변경사항**:
- 폭 300px 고정 (grid cell).
- 각 행 높이 36px → 32px (조밀).
- 종목명 아래 6자리 코드 표시 (`text-2xs text-[var(--color-text-tertiary)]`).
- 가격 mono + tabular-nums.
- 플래시 지속 `300ms` (기존 600ms).
- 헤더에 🟢 pulse 점 + "LIVE · 10초" 라벨.
- 빈 상태 CTA: "+ 관심종목 추가" 버튼 (기존 10개 하드코딩은 유지, 단 Phase 3에서 DB 연동).
- 각 행 hover 시 `bg-[#FAFAFA]`, 종목명 색 `var(--color-primary)`.
- 등락률 앞에 ▲/▼ 기호 추가.

---

### 4.3 🔧 Row 1 Center — BreakingFeed (수정, 내부 2-column 분할)

**파일**: `components/home/BreakingFeed.tsx`

**변경사항**:
- 카드 내부를 `grid grid-cols-2 gap-4`로 분할.
- 좌: 📰 실시간 뉴스 (제목 + 출처 + 시간).
- 우: 📋 공시 (기업명 + 공시제목 + 시간).
- 각 리스트 스크롤 영역 `h-[320px] overflow-y-auto`.
- 헤더에 탭 대신 "뉴스 20건 / 공시 15건" 카운트 뱃지.
- Pulse dot + "LIVE · 30초".
- hover 시 제목 밑줄, 클릭 시 외부 새 탭.

---

### 4.4 🔧 Row 1 Right — SidebarChat (수정)

**파일**: `components/home/SidebarChat.tsx`

**변경사항**:
- 폭 340px, 높이 `calc(100vh - 140px)`, `sticky top-[92px]`.
- 헤더 색상 강조: `bg-[var(--color-dark-bg)] text-white`. (기존 흰색 → 더 눈에 띔).
- Pulse dot + "실시간 · N명 접속 중".
- 메시지 UI:
  - 닉네임 `text-xs font-bold text-[var(--color-primary)]`.
  - 시간 `text-2xs text-[var(--color-text-tertiary)]`.
  - 본문 `text-sm text-[var(--color-text-primary)] leading-[1.45]`.
  - 각 메시지 `py-1.5`, hover 시 `bg-[#FAFAFA]`.
- 입력창 하단 고정, Enter로 전송.
- 신규 메시지 slide-in (200ms).
- 빈 상태 카피: "먼저 의견을 남겨보세요".
- 1024px 이하에서는 `hidden`, `<FloatingChatButton />` 컴포넌트로 대체 (신규).

---

### 4.5 🆕 FloatingChatButton (신규)

**파일**: `components/home/FloatingChatButton.tsx`

- `fixed bottom-6 right-6 z-50 lg:hidden`.
- 원형 56x56px, `bg-[var(--color-primary)]` hover `bg-[var(--color-primary-hover)]`.
- MessageCircle 아이콘 + 미확인 카운트 뱃지.
- 클릭 시 전체화면 채팅 오버레이 (SidebarChat 재사용).

---

### 4.6 🔧 Row 2 — InstitutionalFlow (수정, 2-column 분할)

**파일**: `components/home/InstitutionalFlow.tsx`

**변경사항**:
- 카드 내부 `grid grid-cols-2 gap-6`.
- 좌: "외국인 순매수 TOP10" 테이블.
- 우: "기관 순매수 TOP10" 테이블.
- 각 테이블 10행 고정, 순위 / 종목명 / 순매수금액(억) / 현재가 / 등락률.
- 헤더 우측: "기준 4/17 · LIVE 60초".
- 숫자는 mono + tabular-nums.
- 순위 1~3위는 `text-[var(--color-accent-gold)] font-bold`.

---

### 4.7 🔧 Row 3 — Market Cards 4-column (수정)

카드 4개: `VolumeSpike` / `ProgramTrading` / `WarningStocks` / `MarketMiniCharts`.

**공통 스타일**:
- `bg-white border border-[var(--color-border)] p-4 min-h-[260px]`.
- 헤더: `flex justify-between items-center mb-3 pb-2 border-b border-[var(--color-border)]`.
- 헤더 좌: `text-sm font-bold` 타이틀.
- 헤더 우: pulse dot + 갱신 간격 라벨.
- 본문: `space-y-1.5 text-xs`.

**VolumeSpike (유지, 데이터 교체)**: 거래량 급등 TOP10 (KIS `/api/kis/volume-rank`).
**ProgramTrading (더미)**: Phase 2에서 FDR 연동. 지금은 "다음 업데이트에서 제공" 상태 표시.
**WarningStocks (더미)**: 동일하게 "준비 중" 표시.
**MarketMiniCharts (유지)**: 코스피/코스닥/환율 미니 sparkline.

---

### 4.8 🔧 Row 4 — 주요 일정 3-column (수정)

카드 3개 공통 스타일은 Row 3과 동일.

**EconomicCalendar / IpoSchedule / EarningsCalendar**: 모두 "준비 중" 상태로 두되, **더미 데이터는 제거**하고 skeleton + "다음 업데이트에서 제공" 안내로 교체. 차라리 비어있는 게 "가짜 데이터"보다 신뢰도 높음.

---

## 5. 제거 대상

### 5.1 광고 영역 (Phase 1 즉시)
- `HomeClient.tsx`에서 `<AdColumn />` 두 개 import & 렌더링 제거.
- `BannerSection.tsx` 홈에서 렌더링 제거 (있다면).
- **코드 파일은 남기고 import만 제거**. 광고주 붙으면 복원.

### 5.2 max-width 1920 제약
- 2400px로 상향.
- 내부 grid로 꽉 채움.

### 5.3 더미 달력/일정 하드코딩
- ProgramTrading / WarningStocks / EconomicCalendar / IpoSchedule / EarningsCalendar의 더미 데이터 배열 삭제.
- "다음 업데이트에서 제공" 안내 화면으로 교체.

---

## 6. Phase 실행 계획

### 🔵 Phase 1 — Layout Surgery (오늘, 약 1시간)

**작업**:
1. `app/globals.css`에 CSS variables 블록 추가 (Section 2.1).
2. `components/home/HomeClient.tsx` 전체 재작성 (Section 3의 Grid 구조).
3. `components/home/GlobalTickerBar.tsx` 신규 생성 (정적 placeholder 버전).
4. `components/home/FloatingChatButton.tsx` 신규 생성.
5. `AdColumn` import 및 렌더링 제거 (파일은 유지).
6. 기존 컴포넌트들은 **스타일 수정 없이** 새 Grid에 그대로 배치.
7. 빌드 검증.
8. Commit (메시지: "feat: home layout surgery — grid-based, remove ads, add ticker bar (session #9 phase 1)").

**완료 기준**:
- 1920px / 1440px / 1024px / 768px 네 해상도에서 깨짐 없음.
- 빌드 에러 없음.
- 광고 영역 없어진 상태 확인.
- 채팅이 1024px+에서는 우측 sticky, 그 이하에서는 floating button.

### 🟢 Phase 2 — Component Polish (다음 세션, 약 1.5시간)

**작업**:
1. WatchlistLive: 조밀화, sparkline, 플래시 300ms, 6자리 코드 표시.
2. BreakingFeed: 내부 2-column (뉴스/공시 분할).
3. SidebarChat: 헤더 다크, 메시지 slide-in, pulse dot.
4. InstitutionalFlow: 2-column (외국인/기관 TOP10 분리).
5. Row 3, 4 카드 공통 스타일 적용.
6. Copy 리라이트 (Section 1 "Copywriter" 반영).

### 🟣 Phase 3 — Data Density Boost (다다음 세션, 약 2시간)

**작업**:
1. GlobalTickerBar 실제 데이터 연동 (KIS 지수 + 환율/원자재 API).
2. VolumeSpike 실데이터 (`/api/kis/volume-rank`).
3. 더미 5개 카드 (ProgramTrading / WarningStocks / EconomicCalendar / IpoSchedule / EarningsCalendar) 실데이터 연동.
4. Sparkline 구현 (Recharts mini).
5. Polling stagger (0s, 3s, 6s, ...) 적용.

---

## 7. Claude Code 실행 지시 (Phase 1만)

### Step 1. `app/globals.css` 수정

파일 최상단에 아래 블록 추가 (기존 내용은 보존):

```css
:root {
  /* Brand */
  --color-primary: #0ABAB5;
  --color-primary-hover: #088F8C;
  --color-accent-gold: #C9A96E;

  /* Stock */
  --color-up: #FF3B30;
  --color-down: #007AFF;
  --color-flat: #8E8E93;

  /* Grayscale */
  --color-black: #0D1117;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-border: #E5E7EB;
  --color-border-strong: #D1D5DB;
  --color-bg-white: #FFFFFF;
  --color-bg-gray-50: #FAFAFA;
  --color-bg-gray-100: #F5F5F5;
  --color-bg-gray-200: #F0F0F0;

  /* Dark */
  --color-dark-bg: #0D1117;
  --color-dark-hover: #161B22;
  --color-dark-border: #2D3748;

  /* Status */
  --color-live: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
}

@keyframes pulse-live {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.pulse-live {
  animation: pulse-live 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

### Step 2. `components/home/GlobalTickerBar.tsx` 신규 생성

```tsx
'use client';

import { useEffect, useState } from 'react';

interface TickerItem {
  label: string;
  value: string;
  change: number;
  loading?: boolean;
}

// Phase 1: 정적 placeholder. Phase 3에서 실데이터 연동.
const INITIAL: TickerItem[] = [
  { label: 'KOSPI', value: '2,718.45', change: 0.42 },
  { label: 'KOSDAQ', value: '852.31', change: -0.18 },
  { label: 'KOSPI200', value: '362.18', change: 0.35 },
  { label: 'USD/KRW', value: '1,382.50', change: -0.12 },
  { label: 'WTI', value: '78.42', change: 1.20 },
  { label: 'Gold', value: '2,385.10', change: 0.08 },
];

export default function GlobalTickerBar() {
  const [items, setItems] = useState<TickerItem[]>(INITIAL);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="h-11 bg-[var(--color-dark-bg)]" />;
  }

  return (
    <div className="h-11 bg-[var(--color-dark-bg)] text-white flex items-center px-4 gap-6 overflow-x-auto sticky top-12 z-40 border-b border-[var(--color-dark-border)]">
      <div className="flex items-center gap-1 shrink-0">
        <span className="w-1.5 h-1.5 bg-[var(--color-live)] rounded-full pulse-live" />
        <span className="text-[10px] font-bold tracking-wider">LIVE</span>
      </div>
      {items.map((it) => {
        const isUp = it.change >= 0;
        const color = isUp ? 'var(--color-up)' : 'var(--color-down)';
        return (
          <div key={it.label} className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-[#CBD5E0]">{it.label}</span>
            <span className="text-sm font-bold font-mono tabular-nums">{it.value}</span>
            <span className="text-xs font-bold tabular-nums" style={{ color }}>
              {isUp ? '▲' : '▼'} {Math.abs(it.change).toFixed(2)}%
            </span>
          </div>
        );
      })}
      <span className="text-[10px] text-[#666] ml-auto shrink-0">Phase 3에서 실데이터 연동</span>
    </div>
  );
}
```

### Step 3. `components/home/FloatingChatButton.tsx` 신규 생성

```tsx
'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import SidebarChat from './SidebarChat';

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 lg:hidden w-14 h-14 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white flex items-center justify-center shadow-lg transition-colors"
        aria-label="실시간 채팅"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
      {open && (
        <div className="fixed inset-4 z-40 lg:hidden bg-white border border-[var(--color-border)]">
          <SidebarChat />
        </div>
      )}
    </>
  );
}
```

### Step 4. `components/home/HomeClient.tsx` 전체 교체

```tsx
'use client';

import { useEffect } from 'react';
import GlobalTickerBar from './GlobalTickerBar';
import SidebarChat from './SidebarChat';
import FloatingChatButton from './FloatingChatButton';
import WatchlistLive from './WatchlistLive';
import InstitutionalFlow from './InstitutionalFlow';
import BreakingFeed from './BreakingFeed';
import VolumeSpike from './VolumeSpike';
import ProgramTrading from './ProgramTrading';
import WarningStocks from './WarningStocks';
import MarketMiniCharts from './MarketMiniCharts';
import EconomicCalendar from './EconomicCalendar';
import IpoSchedule from './IpoSchedule';
import EarningsCalendar from './EarningsCalendar';

export default function HomeClient() {
  useEffect(() => {
    const scrollTop = () => window.scrollTo(0, 0);
    scrollTop();
    const timers = [50, 150, 300, 600, 1000].map((ms) => setTimeout(scrollTop, ms));
    requestAnimationFrame(scrollTop);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      <GlobalTickerBar />

      <div className="mx-auto px-4 lg:px-6 py-4" style={{ maxWidth: 2400 }}>
        {/* ROW 1 — Watchlist | Breaking | Chat */}
        <div
          className="grid gap-3 mb-3"
          style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}
        >
          <style>{`
            @media (min-width: 1024px) {
              .home-row-1 { grid-template-columns: minmax(0, 1fr) 320px !important; }
            }
            @media (min-width: 1280px) {
              .home-row-1 { grid-template-columns: 280px minmax(0, 1fr) 320px !important; }
            }
            @media (min-width: 1600px) {
              .home-row-1 { grid-template-columns: 300px minmax(0, 1fr) 340px !important; }
            }
          `}</style>
          <div
            className="home-row-1 grid gap-3"
            style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}
          >
            {/* Watchlist (1280px+에서만 보임, 그 이하는 Row 아래로 stack) */}
            <div className="hidden xl:block">
              <WatchlistLive />
            </div>
            {/* Breaking */}
            <div className="min-w-0">
              <BreakingFeed />
            </div>
            {/* Chat (1024px+에서만 보임, 그 이하는 floating) */}
            <div className="hidden lg:block">
              <div className="sticky top-[92px]" style={{ height: 'calc(100vh - 120px)' }}>
                <SidebarChat />
              </div>
            </div>
          </div>
        </div>

        {/* Watchlist (1280px 이하 화면에서만 보임 — 모바일/태블릿) */}
        <div className="xl:hidden mb-3">
          <WatchlistLive />
        </div>

        {/* ROW 2 — InstitutionalFlow 전체폭 */}
        <div className="mb-3">
          <InstitutionalFlow />
        </div>

        {/* ROW 3 — Market Cards 4-col */}
        <section className="mb-3">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">실시간 시장 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <VolumeSpike />
            <ProgramTrading />
            <WarningStocks />
            <MarketMiniCharts />
          </div>
        </section>

        {/* ROW 4 — 주요 일정 3-col */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">주요 일정</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <EconomicCalendar />
            <IpoSchedule />
            <EarningsCalendar />
          </div>
        </section>
      </div>

      <FloatingChatButton />
    </>
  );
}
```

### Step 5. 빌드 검증

```
npm run build
```

에러 있으면 에러 메시지 그대로 보고하고 멈춤.

### Step 6. 빌드 성공 시 commit (push는 검증 후)

```
git add app/globals.css components/home/HomeClient.tsx components/home/GlobalTickerBar.tsx components/home/FloatingChatButton.tsx
git commit -m "feat: home layout surgery — grid-based, remove ads, add ticker bar, floating chat (session #9 phase 1)"
```

### Step 7. 보고

- 빌드 성공 여부
- commit hash
- 변경/신규 파일 4개 listing

---

## 8. 브라우저 검증 체크리스트 (사용자가 수행)

Phase 1 실행 완료 후 `http://localhost:3333/` 접속하고 아래 확인:

| # | 항목 | 기대 동작 |
|---|------|----------|
| 1 | 광고 영역 | 완전히 사라졌는지 (좌/우 Ad 컬럼 없음) |
| 2 | 상단 Ticker Bar | KOSPI/KOSDAQ/환율 등 6개 항목 LIVE 점과 함께 표시 |
| 3 | Row 1 (1920px 기준) | 좌 관심종목(300px) / 중앙 속보 / 우 채팅(340px) 3컬럼 |
| 4 | 창 크기 1280px로 줄여도 | Row 1이 280px / 1fr / 320px로 재배치, 깨짐 없음 |
| 5 | 1024px로 줄이면 | 관심종목이 사라지고 [속보 / 채팅] 2컬럼 (관심종목은 아래 전체폭으로 이동) |
| 6 | 768px로 줄이면 | 전부 single column + 우하단 민트색 floating chat 버튼 등장 |
| 7 | Floating 버튼 클릭 | 채팅창이 전체화면 오버레이로 열림 |
| 8 | max-width | 4K 모니터에서 2400px 제한 (양옆 여백) |
| 9 | 콘솔 | F12 에러 없음, /api/kis/price 호출 200 |
| 10 | 채팅 sticky | 스크롤해도 Chat이 우측 상단에 계속 보임 |

전부 ✅면 push 진행, 하나라도 ❌면 스크린샷 보고.

---

## 9. 절대 하지 말 것 (경계선)

- ❌ AdColumn 파일 삭제 금지 (import만 제거).
- ❌ 기존 컴포넌트(WatchlistLive 등) 내부 로직 수정 금지 (Phase 1 한정).
- ❌ Tailwind config 수정 금지 (CSS variables로 충분).
- ❌ max-width를 2400 이상으로 늘리지 말 것 (가독성 붕괴).
- ❌ 한국 상승/하락 색 반대로 적용 금지.
- ❌ border-radius 추가 금지.

---

## 10. Phase 2 & 3 프리뷰 (참고용)

### Phase 2 예정 변경
- WatchlistLive 내부 스타일: 조밀화, sparkline, 6자리 코드.
- BreakingFeed 내부 스타일: 2-column 분할.
- SidebarChat 헤더 다크 톤.
- InstitutionalFlow 2-column (외국인/기관 분리).
- Copy 리라이트.

### Phase 3 예정 변경
- GlobalTickerBar 실데이터 연동.
- 더미 카드 5개 실데이터 연동 (FDR + KIS + KRX).
- Polling stagger.

---

## 11. 세션 종료 체크리스트

Phase 1 완료 시:
- [ ] 4개 문서 헤더 날짜 오늘로 업데이트 (CLAUDE.md, CHANGELOG.md, session-context.md, NEXT_SESSION_START.md)
- [ ] CHANGELOG.md에 세션 #9 Phase 1 블록 추가
- [ ] session-context.md에 세션 #9 Phase 1 블록 추가
- [ ] NEXT_SESSION_START.md에 Phase 2 예정 작업 기록
- [ ] 브라우저 검증 10개 항목 통과
- [ ] git push

---

**이 문서의 목적**: Claude Code가 읽고 **Step 1~7만 정확히 수행**하면 된다. 자유도 없이 그대로 실행. 의문 있으면 실행 전 사용자에게 질문.
