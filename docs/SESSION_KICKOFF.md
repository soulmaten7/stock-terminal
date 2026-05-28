<!-- 2026-05-28 -->
# 운종(雲從) — 새 세션 즉시 시작 파일

> 이 파일을 처음부터 끝까지 읽으면 바로 작업 시작 가능.
> **Last refreshed**: 2026-05-27 (세션 #25 종료 · Layer 0 + 21개 카드 디테일 완성)
> **실행 환경**: Mac 로컬 `~/stock-terminal` 에서 직접 실행
> 세션이 끝날 때마다 이 파일 섹션 2~5 반드시 업데이트할 것.

---

## 1. 나는 누구고 이건 무슨 프로젝트인가

- **나(Cowork)**: 설계·작성 담당. 코드와 명령어를 만들어서 사용자에게 전달.
- **Claude Code**: 사용자가 터미널에서 실행하는 CLI. 실제 파일 수정·빌드·git push 담당.
- **사용자**: 코딩 초보. Claude Code 터미널에 명령어 붙여넣기만 하면 됨.

**브랜드**: **운종(雲從) · UNJONG**
**의미**: 조선 한양 종로의 옛 이름 운종가(雲從街) — "구름처럼 사람이 모이는 거리"
**한 줄 정의**: 한국 주식 동선의 출발점 — 정보·대화·허브·신뢰 4박자 플랫폼
**거래 X** (증권사 라이선스 X). 정보 + 대화 + 허브 역할만.
**수익 모델**: Partner-Agnostic Lead Gen (인증 광고 시스템 Tier 1·2·3)
**기술 스택**: Next.js 16 + TypeScript + Tailwind v4 + Supabase + Zustand + TradingView + lightweight-charts
**데이터 소스**: KIS · DART · Yahoo Finance · KRX · SEC EDGAR (100% 무료)
**도메인**: `onetrillion.app` (메인, 보유 중) + `unjong.com` 보호 (Layer 6 구매 예정)
**저장소**: https://github.com/soulmaten7/stock-terminal.git

---

## 2. 현재 프로젝트 상태 (2026-05-27 · 세션 #25 종료)

| 항목 | 상태 |
|------|------|
| 최신 커밋 | `8890620` (STEP 98+99 — 미국주식창 4개 + 디테일 페이지 21개) |
| 빌드 | ✅ 클린 · TypeScript 0 오류 |
| Layer 0 | ✅ 100% 완성 (3컬럼 + 21개 카드 + 디테일 페이지) |
| Layer 1 | ⏸️ 시작 예정 (실데이터 + Supabase Realtime 채팅) |
| ESLint | ⚠️ `set-state-in-effect` 63건 비차단 경고 |
| 배포 | ❌ 미배포 (Layer 6) |
| 글로벌 티커 | ✅ TradingView 실시간 위젯 (실데이터) |
| 한투 API | 7개 엔드포인트 검증 완료 |
| DART | corp_codes 3,959건 · financials 576건 |
| AI 분석 | GPT-4o-mini 7일 캐시 |

**DB 시딩 누계 (이미 완료)**:
- `stocks` 2,780건 (KOSPI 949 + KOSDAQ 1,821)
- `link_hub` 56건 (KR/US)
- `financials` 576건 / `stock_prices` 54,899건
- `supply_demand` 3,000건 / `dividends` 790건 / `quant_factors` 200건
- `dart_corp_codes` 3,959건

---

## 3. 운종 화면 구조 (Layer 0 확정)

### 헤더 4단 (sticky top)
```
[1단] UNJONG 운종 · 통합 검색박스 · 🇰🇷 알림 ★ 프로필
[2단] 글로벌 티커 — KOSPI · KOSDAQ · S&P · NASDAQ · USD/KRW · WTI · GOLD · BTC (TradingView 실시간)
[3단] [⚡단타창] [🌳장타창] [🌙미국주식창]   🔍 종목발굴(Screener)   📅 경제캘린더(Calendar)
[4단] ContextNav — 창별 카드 7개 메뉴 자동 변경 (앵커 점프 + 금색 깜박임)
```

### 3컬럼 본문
```
┌──────┬───────────────────────────────┬──────┐
│ 채팅  │ ContextNav (전체 폭)             │      │
│ 좌측  ├───────────────────────────────┼──────┤
│ sticky│ 종목상세 (1행 풀폭)              │ 관심 │
│ 500px│ ⚡ 삼성전자 · [차트][호가][체결][종합] │ 종목 │
│       │                                │ 8개+ │
│ Layer├───────────────────────────────┴──────┤
│ 2    │ 카드 2열 (관심종목 위까지 풀폭 침범)        │
│ 광고 │ Movers · Volume                      │
│ ··· │ VI · NetBuy                          │
│ 빈공간│ 공시 · 테마                          │
│      │ 공매도                                │
└──────┴──────────────────────────────────────┘
```

### 21개 카드 (3창 × 7)

| 창 | 카드 7개 |
|----|---------|
| **단타창** `/scalper` | 🚀 Movers · 🔥 Volume · 🚨 VI · 💰 NetBuy+거래원 · 📄 공시 · 🎯 테마 · ⚠️ 공매도 |
| **장타창** `/longterm` | 📊 공시 · 📅 분기실적 · 💎 저평가 · 💰 배당TOP · 📉 52주신저가 · 🗺️ 섹터 · ⚠️ 관리종목 |
| **미국주식창** `/us` | 🌐 글로벌지수+VIX · 🌅 Pre/After · ⭐ M7 · 🇺🇸 Movers · 💱 환율+시계 · 📰 뉴스+8K · 📅 FOMC |

### 21개 디테일 페이지 (동적 라우트)

- `/scalper/[card]` (Movers·Volume·VI·NetBuy·Disclosure·Theme·Short)
- `/longterm/[card]` (Disclosure·Earnings·Value·Dividend·Lows·Sector·Warning)
- `/us/[card]` (Indices·PrePost·M7·Movers·Forex·News·FOMC)
- 각 카드 헤더의 "더보기 →" 클릭 시 진입
- 디테일 페이지에서 "← {창이름}으로" 뒤로가기

---

## 4. 다음 세션 P0 — Layer 1 시작 (3가지 후보)

### 4-1. Layer 1-A — 카드 실데이터 연결 ★ 추천
- 21개 카드 더미 → 실 API 연결
- KIS API (Movers · Volume · VI · NetBuy · 호가창)
- DART API (공시 · 분기실적 · 배당)
- Yahoo Finance (글로벌 지수 · M7 · Pre/After · 미국 Movers)
- KRX (공매도 · 관리종목)
- 자체 필터 (저평가 · 52주신저가 · 테마)
- 예상 작업: 5~7일

### 4-2. Layer 1-B — Supabase Realtime 채팅 실시간
- 좌측 채팅창 더미 → 실시간 메시지 송수신
- 닉네임 시스템 (Layer 4 점수제는 별도)
- 채팅 메시지 영구 저장
- 모든 창에서 채팅 공유 (단타·장타·미장)
- 예상 작업: 3~4일

### 4-3. Layer 1-C — 글로벌 티커 강화 + 카드 → 패널 연결
- 이미 TradingView 위젯 실데이터 → 추가 종목 큐레이션
- 21개 카드 모두 종목 클릭 시 `setSelectedSymbol` 호출
- 우측 종목 상세 자동 업데이트
- 예상 작업: 1~2일

→ **추천 순서: 4-3 → 4-1 → 4-2** (가벼운 것부터)

---

## 5. Layer 2 이후 로드맵

| Layer | 내용 | 예상 시점 |
|-------|------|---------|
| **Layer 2** | 광고 허브 + 사이트 모아보기 + 헤더 메뉴 | Layer 1 후 |
| **Layer 3** | 인증 시스템 (Tier 1·2·3) + 운영자 어드민 + 광고주 신청 | Layer 2 후 |
| **Layer 4** | 모더레이션 + 신고 + 닉네임 점수제 | 베타 직전 |
| **Layer 5** | 통합 종목 검색 + AI 봇 (@운종AI) | 차별화 강화 |
| **Layer 6** | unjong.com 도메인 + Vercel 배포 + 광고주 영업 | 출시 |

---

## 6. 핵심 파일 위치

| 파일 | 경로 | 용도 |
|------|------|------|
| 이 파일 | `docs/SESSION_KICKOFF.md` | 새 세션 즉시 시작용 |
| 다음 세션 가이드 | `docs/NEXT_SESSION_START.md` | 최신 상태 + 다음 할 일 |
| Claude 지침 | `CLAUDE.md` | 역할 분담 + 절대 규칙 |
| **운종 V4 스펙** | `docs/PRODUCT_SPEC_V4.md` | V4 비전·구조·레이어 |
| **브랜드 정체성** | `docs/BRAND_IDENTITY.md` | 운종 이름·색·도메인 |
| V3 스펙 (보존) | `docs/PRODUCT_SPEC_V3.md` | V3 히스토리 |
| 비즈니스 전략 | `docs/BUSINESS_STRATEGY.md` | Partner-Agnostic Lead Gen |
| 시스템 설계 | `docs/SYSTEM_DESIGN.md` | 아키텍처, API |
| 프로젝트 맥락 | `session-context.md` | TODO, 히스토리, 핵심 수치 |
| 변경 이력 | `docs/CHANGELOG.md` | 세션별 변경 |
| DB 스키마 | `supabase/migrations/001_initial_schema.sql` | Supabase 테이블 |
| 환경변수 | `.env.local` | API 키 (git push 금지) |
| 한투 API 유틸 | `lib/kis.ts` | rate limiter, 토큰 캐싱 |

---

## 7. 운종 컴포넌트 구조 (Layer 0 완성)

### 헤더
- `components/header/Header.tsx` (V3 골격, UNJONG 운종으로 변경)
- `components/header/TickerBar.tsx` (TradingView 실시간 위젯)
- `components/header/MainNav.tsx` (3창 + 종목발굴 + 경제캘린더)
- `components/header/ContextNav.tsx` (창별 카드 메뉴 자동 변경)

### 좌측 사이드
- `components/sidebar/ChatPanel.tsx` (창별 더미 메시지 + 입력박스)
- `components/sidebar/WatchlistPanel.tsx` (관심종목, h-full + rounded-lg)
- `components/sidebar/UnjongSidebar.tsx` (deprecated, 보존)

### 메인 영역
- `components/sidepanel/StockDetailPanel.tsx` (inline 모드 — 메인 1행 풀폭)
- `components/cards/CardContainer.tsx` (공통 wrapper + detailHref)
- `components/cards/ScalperCards.tsx` (단타창 7개)
- `components/cards/LongtermCards.tsx` (장타창 7개)
- `components/cards/UsCards.tsx` (미국주식창 7개)
- `components/cards/CardDetail.tsx` (디테일 페이지 공통)

### 상태 관리
- `stores/unjongSelectedSymbolStore.ts` (Zustand persist)

### 라우트
- `app/(windows)/layout.tsx` (3컬럼 공통 레이아웃)
- `app/(windows)/scalper/page.tsx` · `longterm/page.tsx` · `us/page.tsx`
- `app/(windows)/scalper/[card]/page.tsx` · `longterm/[card]/page.tsx` · `us/[card]/page.tsx` (디테일 동적)
- `app/page.tsx` (`/` → `/scalper` 리다이렉트)
- `app/dashboard/page.tsx` (V3 5섹션 보존)

---

## 8. 한투 API 엔드포인트 (7개 검증 완료)

| 엔드포인트 | TR ID | 용도 |
|-----------|-------|------|
| /api/kis/price | FHKST01010100 | 종목 현재가 |
| /api/kis/investor | FHKST01010900 | 외국인/기관 수급 |
| /api/kis/orderbook | FHKST01010200 | 10호가 |
| /api/kis/execution | FHKST01010300 | 체결 내역 |
| /api/kis/investor-rank | FHPTJ04400000 | 외국인/기관 TOP10 |
| /api/kis/volume-rank | FHPST01710000 | 거래량 급등 TOP |
| /api/kis/chart | FHKST03010100 | 150일 일봉 |
| /api/kis/movers | /ranking/fluctuation | 등락률 TOP |

---

## 9. 수익 모델 (Partner-Agnostic Lead Gen)

### Tier 3단계 인증 시스템 (Layer 3 예정)
| Tier | 대상 | 마크 |
|------|------|------|
| **Tier 1** | 증권사·은행·자산운용사 | 🏛️ 금융위 인증 |
| **Tier 2** | 유튜브·텔레그램·전문가·강의 | ▶️ ✅ 운종 검증 |
| **Tier 3** | 일반 광고 | AD 라벨 (회색) |

### 광고 영역
- 좌측 채팅 아래 Layer 2 placeholder → 광고·텔레그램 링크
- 메인 영역 카드 하단 → 증권사·전문가 광고

### 수익원
- 증권사 계좌 개설 (₩30,000~80,000/건)
- 텔레그램방 입장 (₩500~2,000/건)
- 강의 수강 (₩10,000~30,000/건)
- 광고 클릭 (₩50~500/클릭)

**제외**: 구독 · 매매 수수료 · AI 리포트 판매 · CSV 판매 (V4 영구 제외)

---

## 10. 세션 시작 루틴 (Cowork 체크리스트)

새 세션 시작 시 반드시 이 순서로:

- [ ] 이 파일 (`docs/SESSION_KICKOFF.md`) 읽기 ← **여기부터**
- [ ] `docs/PRODUCT_SPEC_V4.md` 확인 (운종 비전)
- [ ] `docs/NEXT_SESSION_START.md` 확인 (Layer 1 가이드)
- [ ] `session-context.md` 확인 (TODO 가비지 컬렉션)
- [ ] 사용자에게 오늘 작업 P0 제안 (Layer 1-A / B / C)
- [ ] 확인 받으면 → 코드/명령어 작성 → Claude Code용 복붙 명령어 제공
- [ ] 작업 완료 후 → 4개 문서 날짜 갱신 + 로그 추가
- [ ] Claude Code용 git push 명령어 제공

---

## 11. 세션 종료 루틴 (반드시 지킬 것)

- [ ] `CLAUDE.md` 헤더 날짜 오늘로
- [ ] `docs/CHANGELOG.md` 헤더 날짜 + 이번 세션 항목 추가
- [ ] `session-context.md` 헤더 날짜 + 세션 히스토리 블록 추가 + TODO 갱신
- [ ] `docs/NEXT_SESSION_START.md` 최신 상태로 전면 갱신
- [ ] **`docs/SESSION_KICKOFF.md` (이 파일) 섹션 2~5 업데이트** ← 과거 누락 반복 주의
- [ ] `docs/PRODUCT_SPEC_V4.md` 진행 상태 갱신 (Layer 표시)
- [ ] Claude Code용 git push 명령어 제공:
  ```bash
  rm -f .git/index.lock
  git add -A
  git commit -m "docs: STEP N 완료 + 문서 4종 갱신"
  git push
  ```

---

## 12. 알아야 할 기술 이슈

### Tailwind v4 색상 (`unjong-*` 네임스페이스)
- STEP 88 에서 정의됨 (`app/globals.css` 의 `--color-unjong-*`)
- `bg-unjong-primary`, `text-unjong-muted`, `border-unjong-border` 등
- opacity 클래스 (`bg-unjong-success/10`) 미작동 시 → 표준 폴백 (`bg-emerald-50`)

### Next.js 15+ 동적 라우트
- `params` 는 Promise → `await params` 필수
- 예: `app/(windows)/scalper/[card]/page.tsx`

### Tailwind 비율 고정 + 스크롤
- `flex-1 + min-h-0 + overflow-y-auto` 조합 필수 (Flex 안 스크롤)
- 좌측 사이드 채팅 `h-[500px]` 고정 + sticky top
- 관심종목 `h-full` (부모 items-stretch 따라감) + 자체 overflow

### Next.js 16 Turbopack 캐시 손상 복구
```bash
rm -rf .next node_modules/.cache && lsof -ti :3333 | xargs kill -9 && npm run dev
```

### yahoo-finance2 v3
- `new YahooFinance()` 인스턴스화 필수

---

## 13. 세션 #25 핵심 커밋 (Layer 0 완성)

| STEP | 커밋 | 내용 |
|------|------|------|
| 88 | `892c662` | 운종 브랜드 적용 |
| 89 | `e8bc870` | 3창 라우트 |
| 90 | `052c439` | 헤더 고정 |
| 91 | `13ae6c4` | 좌측 사이드 |
| 92 | `ef1bf4d` | 메인 카드 3개씩 |
| 93 | `7026306` | 우측 사이드패널 |
| 94 | `954e59f` | V3 → /dashboard 강등 |
| 96 | `c0bbff0` | 단타창 4개 추가 |
| 97 | `c08696d` | 장타창 4개 추가 |
| 95-A revert | `9b1676f` | 잘못된 V3 제거 롤백 |
| 95-C | `8441316` | 헤더 통합 + ContextNav |
| 95-D | `03fd1ed` | 미세조정 7개 |
| 95-E | `ea52558` | 3컬럼 구조 |
| 95-E1 | `8c7dc6a` | 차트 핫픽스 |
| 95-F | `cf5835e` | 카드 풀폭 |
| 98+99 | `8890620` | 미국주식창 4개 + 디테일 21개 |

---

> **요약**: 운종(雲從) = 한국 주식 동선의 출발점. Layer 0 시각 골격 100% 완성. 다음은 Layer 1 (실데이터 + 채팅 실시간).
