<!-- 2026-06-15 -->
# 운종(雲從) · UNJONG — 다음 세션 PLAYBOOK

> **이 파일은 무엇인가**: 다음 세션을 처음부터 끝까지 이해하고 진행하기 위한 마스터 인수인계 파일. 다른 어떤 문서를 안 봐도 이 파일만으로 작업 시작 가능.
>
> **시점 스냅샷**: 2026-06-15 STEP 246 종료 (홈 UI 재설계 → 기간 수익률 실데이터 → /market 전 타입 통합 디렉토리)
> **HEAD 커밋**: `bfa7d97` (STEP 246 코드) — 본 문서 커밋이 그 위 docs 커밋 (다음 세션 `git log` 로 최신 확인)
> 데이터: 주식·ETF·리츠·미국 yahoo 기간 수익률 ✅ / ETN(KRX)·펀드(KOFIA) 보류. 다음: US /market 합류 · 종목→증권사 바로가기.
> **마지막 코드 변경**: `2a3c895` (STEP 227 · 링크모음 국가 필터 한국 우선). 이번 세션 큰 줄기: **162 KRX 공식 OpenAPI 100**(키 발급+이용신청 완료) · **219 로고 100+ETF 배지** · **215~217 홈 시장시간바·옛 홈 잔재 제거·헤더 개편** · **218·220~227 주식 관련 링크모음(toolbox)**(증권사 거래대금 순위 우측 레일·박스 탭·한 줄 리스트·2:1). 이번 세션 DB 변경 0
> 🆕 **V7 재정렬 (2026-06-06)**: 네이버 복제 → **토스증권 오마주**. 홈 = 토스식 시장 대시보드(주요지수 10개·전일대비·느낌태그·코스피/코스닥 수급) + 하단 마퀴 티커 + 전 페이지 풀폭. 분석 `docs/TOSS_ANALYSIS_AND_IA.md`. **✅ STEP 162 KRX 공식 OpenAPI = 완료**(키 발급+이용신청 7종, 국내 100 공식·일별 `KRX_API_KEY`). 다음 = 링크모음 큐레이션·잔재 정리.
> **빌드 상태**: ✓ exit 0
> **다음 세션 시작 시 첫 번째로 읽는 파일**: 이 파일 + `session-context.md` (TODO GC)
>
> 🔑 **DB 함정 메모**: 운종 전용 Supabase = 표시명 "OT-Marketing", ref **`qxkmwlkchyxfzxbonhtj`**. 절대 쓰면 안 되는 POTAL = ref **`zyurflkhiregundhisky`**. 마이그레이션·쿼리는 반드시 운종 ref 로.

---

## 1. 운종 한 줄 정체성 (V6 — 2026-06-03 확정)

> **운종 = "투자상품에 속지 않게 돕는 곳"** — 정확한 정보 + 솔직한 토론 + 검증된 신뢰
> 구조 = 네이버 페이 증권 레이아웃 + 토스 증권 카드 디자인 + Trustpilot 평가 모델 (V5 계승, 중심축만 편의 → **신뢰**). 마스터 비전 `docs/PRODUCT_SPEC_V6.md`.

조선 한양 종로의 옛 이름 **운종가(雲從街)** — "구름처럼 사람이 모이는 거리" — 에서 가져온 이름.

### V6 확정 결정 5개 (LOCK — 2026-06-03)
- **0 정체성 축**: "동선의 출발점(편의)" → "안 속는 곳(신뢰)"
- **① 평가 방식**: 토론 + 추천/비추천 + 사기의심 신고. 별점(star) ❌ — 조작·명예훼손 소송 리스크 회피
- **② 인증 뱃지**: 금융위(금감원) 신고번호 입력 → 자동 검증 → 뱃지. 운영자 임의 부여 ❌ (법적 방패)
- **③ 코인**: 제외 — 한국 주식으로 먼저 완성·증명 후 재논의
- **④ 정보 깊이 단계화**: 시세·차트·공시·뉴스 먼저(캐시) → 재무지표(ROE·부채비율 등 계산) 2단계 → 정밀 스크리너·비교 필터는 외부 링크

## 2. 4박자 핵심 정체성 (신뢰가 중심축)

| 영역 | 내용 |
|------|------|
| **정보** | 한국 5개·미국 4개 정확 카드 + 종목 5탭(차트·시세/토론/뉴스/공시/인사이트) 디테일 |
| **대화** | 종목별 채팅 + 토론·댓글 (Realtime + 추천/비추천 + 신고 5건 자동 hidden) |
| **허브** | 한국 금융 사이트 외부 동선 (네이버·키움·FnGuide·Investing.com) |
| **신뢰 (중심축)** | 상품·리딩방 평가 디렉토리 + **금감원 신고 자동 검증 뱃지** + Tier 1·2·3 인증 |

## 3. 안 하는 것 (정체성 경계)

- **거래 X** — 증권사 라이선스 X (네이버·키움·삼성증권 영역)
- **영어판 X** — 국가별 별도 페이지 (일본·미국 진출은 Layer 7+)
- **코인 X** — V6 결정 ③: 한국 주식으로 먼저 완성·증명 후 재논의
- **별점(star rating) X** — V6 결정 ①: 추천/비추천 + 사기의심 신고로 대체
- **정밀 스크리너 X** — FnGuide·키움 영역. 운종은 외부 동선 안내만
- **깊은 분석 X** — 정밀 분석 도구는 외부 링크 (V6 결정 ④)
- **한자 雲從 코드 표기 X** — UNJONG + 운종 한글만
- **OTMarketing CPA 작업 X** — 별도 저장소 `~/OTMarketing/` (상세: `docs/CROSS_REFERENCE.md`)

## 4. 수익 모델

- **MVP 1.0 (완료)** — 기본 정보 + 정제된 채팅·토론 (트래픽 확보)
- **MVP 2.0 (진행)** — 상품·리딩방 평가 디렉토리 + 금감원 인증 뱃지 (Trustpilot 금융 버전) — 운종 진짜 차별화
- **광고 (예정)** — Tier 1·2·3 인증 광고 시스템 (Sponsored ↔ 평가 명확 분리)

## 5. 페이지 13개 라우트 + 핵심 컴포넌트 매핑

| 라우트 | 역할 | 핵심 컴포넌트 |
|--------|------|---------------|
| `/` | **포털형 홈** (STEP 142~143) = 지수바·브리핑·랭킹·업종테마·ETF·우측레일 + 검증·평가·HOT토론·뉴스 + placeholder shell | `components/home-v6/HomeClientV6` · `HomeIndexBar`·`HomeBriefing`·`HomeGlobalRanking`·`HomeSectorTheme`·`HomeEtfPicks`·`HomeRightRail` (home-v5 모듈 재사용) |
| `/kr` | 한국주식 카드 5개 | `MoversCard`·`VolumeCard`·`NetBuyCard`·`DisclosureCard`·`SectorCard` |
| `/us` | 미국주식 카드 4개 | `GlobalIndicesCard`·`M7Card`·`USPreAfterCard`·`USNewsCard` |
| `/stock/[code]` | 종목 페이지 (좌 정보·차트 / 중 **탭 5종: 차트·시세 / 토론 / 뉴스 / 공시 / 인사이트** + 댓글 / 우 채팅) | `StockTabs`·`StockChartSection`·`StockOrderbookCard`·`StockExecutionCard`·`StockDisclosuresTab`·`StockInsightsTab`·`StockInfoPanel`·`RightFixedNav` |
| `/products` | 상품 디렉토리 (ETF·펀드·랩·리츠·채권) | `ProductDirectoryClient` |
| `/product/[id]` | 상품 평가 | `ProductDetailClient`·`PlatformReviewSection` |
| `/rooms` | 리딩방 디렉토리 (텔레그램·카카오·디스코드·유튜브) | `RoomDirectoryClient` |
| `/room/[id]` | 리딩방 평가 | `RoomDetailClient`·`PlatformReviewSection` |
| `/calendar` | Investing.com 외부 링크 안내 페이지 | `CalendarExternalNotice` |
| `/auth/login` · `/auth/callback` | 카카오 OAuth (활성화 미완) | `KakaoLoginButton` |
| `/mypage` | 마이페이지 | `MyPageClient` |

## 6. 디자인 시스템 (V5 — 2026-06-01)

### 폰트
- **본문**: Pretendard Variable (CDN `@import` — 한국어 친화)
- **보조**: `Playfair_Display` (UNJONG 로고 영문용)
- **루트 폰트 크기**: 16px (STEP 127 에서 13→16 상향)

### 색상
| 용도 | HEX | 클래스 |
|------|-----|--------|
| Primary (운종 brand) | `#0F1E3D` | `text-unjong-primary` |
| Accent (운종 gold) | `#D4AF37` | `text-unjong-accent` |
| 상승 (토스 그린) | `#1AC267` | `text-[#1AC267]` |
| 하락 (토스 레드) | `#F04452` | `text-[#F04452]` |
| 차분한 회색 (배경) | `#F9FAFB`·`#F2F4F6` | `bg-unjong-bg` |
| 본문 회색 | `#4E5968`·`#191F28` | `text-unjong-text` |
| 카카오 (auth) | `#FEE500` | (로그인 버튼만) |

### Spacing & Layout
- 컨테이너 max-w: **1984px** (토스 동일)
- 카드 padding: **p-5** (20px)
- 카드 그리드 gap: **gap-5**
- 카드 안 행 padding: `py-3 px-3`
- 카드 border-radius: **rounded-2xl** (16px)

### 그림자
- `.shadow-soft`: `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)` (카드 기본)
- `.shadow-soft-hover`: `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)` (hover)

### 타이포그래피
- 헤더: `text-base ~ text-lg` (16~18px) + `font-bold`
- 본문: `text-sm` (14px) + `font-medium/semibold`
- 보조: `text-xs` (12px)
- 종목 코드: `font-mono` + `text-unjong-muted`

### 카드 패턴 (운종 V5)
```tsx
<section className="
  bg-unjong-surface rounded-2xl border border-unjong-border
  shadow-soft hover:shadow-soft-hover transition-shadow duration-200
  p-5
">
```

### 등락 표시 (운종 V5)
```tsx
<span className={isUp ? "text-[#1AC267]" : "text-[#F04452]"}>
  {isUp ? "+" : ""}{changePct.toFixed(2)}%
</span>
```

### 레이아웃 패턴
- 종목 페이지: `grid-cols-[320px_1fr_380px]` (좌 sticky 정보 / 중 탭 시스템 / 우 sticky 채팅)
- 새 홈: `grid-cols-[320px_1fr_320px]` (좌 채팅 / 중 모듈 순서 / 우 관심종목)
- 우측 fixed nav: `48px @ right-0 top-1/2 -translate-y-1/2`

## 7. 기술 스택

| 영역 | 라이브러리 |
|------|-----------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 (`@theme` 토큰) |
| 상태 | Zustand (persist middleware) |
| 차트 | `lightweight-charts` (Apache 2.0, `attributionLogo: false`) |
| DB | Supabase (PostgreSQL + Realtime + Auth) |
| Yahoo Finance | `yahoo-finance2` package (quote·quoteSummary·search) |
| RSS 파싱 | 정규식 (외부 의존성 X) |
| 폰트 | Pretendard Variable (CDN) |
| 배포 | Vercel + Supabase Cloud (예정) |

## 8. 데이터 소스 (100% 무료)

| 소스 | 용도 |
|------|------|
| KIS Developer | 한국 가격·차트·호가·체결·랭킹 |
| DART Open API | 한국 공시 |
| Yahoo Finance | 미국 주식 + quoteSummary |
| KRX | 한국 보조 데이터 |
| SEC EDGAR | 미국 8-K·10-K |
| RSS 5개 | 한경·매경·머니투데이·이데일리·연합 |
| ECOS (선택) | 한국은행 경제지표 |
| FRED (선택) | 미국 경제지표 |

## 9. DB 마이그레이션 — 모두 적용 완료

| # | 파일 | 내용 |
|---|------|------|
| 005 | `005_chat_v2.sql` | 채팅 기본 |
| 014 | `014_chat_rooms.sql` | room/nickname 컬럼 |
| 015 | `015_chat_unify.sql` | scalper/longterm/us → general 통합 |
| 016 | `016_users_v5.sql` | users V5 (tier·bio·oauth + `handle_new_user`) |
| 017 | `017_discussions.sql` | discussions + chat_messages.symbol |
| 018 | `018_discussion_comments.sql` | 토론 댓글 |
| 019 | `019_platform_directory.sql` | products + leading_rooms + platform_discussions + 시드 |
| **020** | `020_dislike_votes.sql` | 상품·리딩방 평가 추천/비추천 (vote SMALLINT + dislike_count + 트리거) — ✅ 06-04 |
| **021** | `021_fss_advisors.sql` | 금감원 유사투자자문업자 원장 + leading_rooms 인증 컬럼. **FSS 1,738건 적재 완료** — ✅ 06-04 |
| **022** | `022_discussion_dislike.sql` | 종목 토론 추천/비추천 (vote + dislike_count + 트리거) — ✅ 06-04 |

**적용 방법**: Supabase MCP (Cowork) — 운종 DB ref `qxkmwlkchyxfzxbonhtj` (표시명 "OT-Marketing"). 다음 세션에서 새 마이그레이션 시 동일 방식. ⚠️ POTAL ref `zyurflkhiregundhisky` 절대 사용 금지.
**FSS 데이터 적재**: `npx tsx scripts/import-fss-advisors.ts` (수동 1회) 또는 `/api/cron/fss-advisors` (Vercel Cron — 배포 후 활성, KST 04:00).

## 10. STEP 88~143 진행 이력 (구간별 요약)

| 구간 | 영역 | 상태 |
|------|------|------|
| 88~99 | V4 골격 + 21개 카드 + 디테일 (Layer 0) | ✅ V4 완성 (보존) |
| 100~110 | Layer 1-A~E 실데이터 + 채팅·관심종목 + 마커 청소 | ✅ V4→V5 진입 직전 |
| 111 | 검색 활성화 + ContextNav 제거 + V4 헤더 5개 청소 | ✅ V5 헤더 |
| 113 | Watchlist 시스템 통합 (STEP 125 검색 ⭐ 토글로 완료) | ✅ |
| 114 | V5 1차 — 1984px + 3창→2창(한국/미국) + 카드 9개 + 종목상세 2탭 + 채팅 1채널 | ✅ V5 골격 |
| 115 | 종목 페이지 + 토론 게시판 + 종목별 채팅 | ✅ 운종 본질 |
| 116 | V3 잔재 1차 청소 (9 페이지 + API 3 + 컴포넌트 2) | ✅ 청소 |
| 117 | 새 홈 + dashboard 처분 + V3 12 페이지 + widgets 청소 | ✅ 청소 |
| 118 | Layer 3 인증 코드 (카카오 OAuth) — 활성화 사용자 작업 | ✅ 코드 |
| 119 | (Vercel 배포 + unjong.com 도메인 + 환경변수) | 🟡 **보류** — 도메인 결정 후 |
| 120 | 종목 페이지 마무리 (좋아요·신고·차트 inline·미장 quote) | ✅ |
| 122 | 시장 헤드라인 + 종목별 뉴스 (RSS + Yahoo) | ✅ |
| 123 | UI 일관성 (LoadingState·EmptyState·ErrorState) | ✅ |
| 124 | 토론 댓글 (discussion_comments + UI) | ✅ |
| 125 | 미국 주식 상세 (Yahoo quoteSummary) + 검색 ⭐ Watchlist 통합 | ✅ |
| 126 | 종목 페이지 핫픽스 (종목명·시총·52주·차트 4 버그) | ✅ |
| 127 | 가독성 리뉴얼 (Pretendard + html 13→16px + text-xs→sm) | ✅ |
| 128 | MVP 2.0 1차 — 상품·리딩방 디렉토리 + 평가 시스템 기반 | ✅ MVP 2.0 진입 |
| 129~133 | 전면 디자인 리뉴얼 (디자인 시스템 + 토스 카드 + 종목 페이지 탭 + 새 홈 손성기 + MVP2 통일) | ✅ V5 완성 |
| 134 | 모든 문서·로그 3차 교차검수 갱신 | ✅ |
| 135 | 잔여 문서 V5 정렬 패치 (README·BRAND·SPEC_V4 + .env.example) | ✅ |
| — | **정체성 V6 전환** + PRODUCT_SPEC_V6 생성 + Phase 1 (카피 전환·추천/비추천 020·KIS 캐시) | ✅ "안 속는 곳"으로 |
| 137 | FSS 유사투자자문업자 인증 (lib/fss.ts·cron·검증 API·뱃지, 마이그레이션 021) | ✅ 1,738건 적재 |
| 138 | 홈 신뢰 축 재배치 (검증·평가 최상단 + 금감원 1,738개 히어로 + 뉴스 탭) | ✅ |
| 139 | 종목 페이지 네이버급 디테일 (InsightsTab·Orderbook·Execution·InfoPanel·lib/format) | ✅ 정보깊이 ④ |
| 140 | 종목 토론 추천/비추천 통일 (ThumbsUp/Down + voteMap, 마이그레이션 022) | ✅ |
| 141 | 종목 공시 탭 (StockDisclosuresTab DART/SEC, 주의공시 레드) → 종목 5탭 완성 | ✅ |
| 142 | 포털형 홈 전면 재구성 (components/home-v6/HomeClientV6 + 섹션 모듈) | ✅ 홈=HomeClientV6 |
| 143 | 홈 빈 섹션·버그 수정 (브리핑 야후 라이브러리·거래량 실값·업종테마 market 키·레터 아바타) | ✅ |
| 144 | 홈 지수 카드 스파크라인 (HomeIndexBar inline SVG 30일 추세선 + indices API yf.chart()) | ✅ |
| 145 | 브리핑 overnight 안정화 (누락·0·NaN → "—" 중립, 가짜 초록 "+0.00%" 제거) | ✅ 신뢰 정렬 |
| 147 | 종목 메타 보강 (StockInfoPanel 외국인 소진율·상장주식수, KIS lstn_stcn·hts_frgn_ehrt 한국 전용) | ✅ 정보 깊이 |
| 149 | 홈 빈 섹션 CTA 버튼 (HOT토론·평가 EmptyState 참여 유도 링크) | ✅ |
| 150 | 브리핑 간밤 지수 실데이터 복구 (라우트 runtime/dynamic 누락 수정) | ✅ |
| 151 | 네이버식 상단 6메뉴 + 토론·뉴스 페이지 shell | ✅ V7 진입 |
| 152 | 마켓 페이지 + 국내 랭킹 테이블 (volume-rank·movers, 필터·클릭→종목) | ✅ V7 마켓 1차 |
| 153 | 마켓 미국 랭킹 (us-movers 확장 + MarketClient 국가 분기) | ✅ V7 마켓 국내+미국 |

## 11. 다음 STEP 후보 (우선순위 — STEP 154 부터)

### 🆕 V7 — 네이버 증권 구조 복제 (현재 메인 방향 · 상세 `docs/SITE_MAP_V7.md`)
- ~~STEP 152 마켓 국내 랭킹 / 153 미국 랭킹~~ ✅ 완료 (`33e72f7`)
- **STEP 154 — 마켓 필터 확장**: 시총·52주·인기 (⚠️ KIS 신규 랭킹 엔드포인트 작업 필요)
- **STEP 155 — 업종 히트맵** (트리맵 — 신규 viz, kis/sector·home/sectors 데이터)
- **토론 허브 상세** (`/discussion`): 오늘의 종목 토론 둘러보기(필터) + 업종·테마별 토론
- **뉴스 상세** (`/news`): 속보·많이 본·토픽(카테고리)
- **마켓 > 시장지표**: 환율·국채금리·기준금리·에너지·금속
- (후순위 보류) 홈 레이아웃 미세조정 · 인기글 예시 시드

### 🥈 P1 — 정보 깊이·신뢰 강화
- ~~외국인보유율·상장주식수 메타~~ ✅ STEP 147 완료 (외국인 소진율·상장주식수 — 한국 전용)
- **Sponsored 분리 UI** — 광고 ↔ 평가 시각 분리 (운종 신뢰 기반, V6 결정 ②와 일관)

### 🔐 P2 — 사용자 직접 작업
- **카카오 OAuth 활성화 (사용자)** — 카카오 디벨로퍼스 REST API 키·Secret → Supabase Auth Providers → `/auth/login` 테스트. **추천/비추천 투표 실동작 전제** (마이그레이션은 적용 완료)
- **Vercel 배포 + unjong.com 도메인 (사용자)** — Vercel 환경변수 전체 등록(+`CRON_SECRET`). **FSS cron 활성 전제**. ⚠️ STEP 119 시크릿 노출 이력 → `SUPABASE_ACCESS_TOKEN` rotate 권장

## 12. 사용자 직접 작업 (미완)

| 항목 | 위치 | 위급도 |
|------|------|--------|
| 카카오 OAuth 활성화 | 카카오 콘솔 + Supabase Dashboard | 🟡 인증 시점 |
| Vercel 배포 + unjong.com 도메인 | Vercel + Cloudflare | 🟡 도메인 결정 후 |
| `SUPABASE_ACCESS_TOKEN` rotate | Supabase Dashboard | 🔴 STEP 119 시크릿 노출 이력 — 보안 |
| `.env.local` 절대 commit 금지 | git status 확인 | 🔴 항시 |

## 13. Cowork ↔ Claude Code 역할 분담

| 역할 | 담당 |
|------|------|
| **Cowork (이 채팅)** | 사용자와 대화·설계·결정·코드 작성·문서 갱신·로그 기록·명령어 작성 |
| **Claude Code (터미널 CLI)** | Cowork 이 만든 명령어·코드를 **실제로 실행** (파일 수정·npm·git·서버) |
| **사용자** | Cowork 결정 확인 + Claude Code 터미널에 명령어 붙여넣기 |

> **한 줄 요약**: Cowork = 두뇌(설계·작성), Claude Code = 손(실행·빌드)

## 14. Claude Code 모델 선택 규칙

### 기본값: Sonnet
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
- 파일 수정·빌드·git push·npm run — Sonnet 으로 충분
- 속도 빠르고 요금 저렴 (Opus 의 약 1/5)

### 🔴 Opus 권장 (Cowork 이 명령어 줄 때 명시)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```
- 🔴 원인 불명 빌드/런타임 에러 디버깅
- 🔴 대규모 리팩토링·아키텍처 변경
- 🔴 복잡한 알고리즘 구현
- 🔴 레거시 코드 해독 후 수정

표기: 명령어 블록 상단에 🔴 **Opus 권장** 표시 있을 때만 Opus.

## 15. 명령어 전달 방식 (파일 vs 인라인)

### 📄 파일 방식 — `docs/STEP_N_COMMAND.md`
사용자 호출법: `@docs/STEP_N_COMMAND.md 파일 내용대로 실행해줘`

**트리거**:
- 3단계 이상 작업 (여러 파일 수정)
- 빌드 검증 + git commit/push 포함
- 리팩토링·아키텍처 변경
- 커밋 메시지까지 명시해야 하는 작업

**파일명 규칙**: `docs/STEP_{번호}_COMMAND.md` (번호 연속)
**필수 명시**: 상단에 실행 명령어(Sonnet/Opus) + 목표 + 전제 상태(이전 커밋 해시)
**실행 후 파일은 유지** — 프로젝트 아카이브 역할

### 💬 인라인 방식 — 채팅 내 코드 블록
**트리거**:
- 단순 1~2파일 수정
- 디버깅·탐색 (grep, log 확인)
- 긴급 핫픽스
- 명령어가 10줄 이내

**판단 기준**: "이 명령어를 한 달 뒤에 다시 봐야 할 가치가 있나?" → Yes 면 파일, No 면 인라인.

## 16. 세션 시작 루틴 (Cowork)

1. **이 PLAYBOOK + `session-context.md` 읽기**
2. `session-context.md` TODO 섹션 가비지 컬렉션 (완료된 항목 제거·1주일 이상 묵은 항목 갱신)
3. `git status` + `git log --oneline -5` 로 현재 상태 확인
4. 사용자에게 다음 STEP 제안 → 결정 후 명령서 작성

## 17. 세션 종료 체크리스트 (Cowork)

- [ ] 4개 필수 문서 헤더 날짜 오늘로 갱신
  - `CLAUDE.md`
  - `docs/CHANGELOG.md`
  - `session-context.md`
  - `docs/NEXT_SESSION_START.md`
- [ ] `docs/CHANGELOG.md` 에 이번 세션 변경사항 블록 추가
- [ ] `session-context.md` 에 이번 세션 완료 블록 추가 (`Last GC: YYYY-MM-DD`)
- [ ] `docs/NEXT_SESSION_START.md` 최신 상태로 갱신 (HEAD 해시·STEP 번호)
- [ ] `docs/SESSION_KICKOFF.md` `현재 커밋` 표기 갱신
- [ ] **이 PLAYBOOK (`docs/NEXT_SESSION_PLAYBOOK.md`) 갱신** — 다음 세션이 이 파일을 첫 번째로 읽음
- [ ] git push (Claude Code 가 실행)
- [ ] 빌드 에러 없는지 확인 (`npm run build`)

## 18. 절대 규칙

- 🔴 **빌드 깨진 코드 push 금지**
- 🔴 **`console.log` 남긴 채 커밋 금지**
- 🔴 **`.env.local` 절대 git push 금지** (`.gitignore` 처리됨 — 확인은 `git status`)
- 🔴 **운종 전용 Supabase 만 사용** — 기존 POTAL Supabase URL/Key 절대 사용 X
- 🔴 한 번에 하나의 작업만 — 멀티태스킹 금지
- 🔴 `session-context.md` 에 없는 숫자 만들기 금지 — 근거 없는 수치 X
- 🔴 코드/기술 용어는 영어, 소통은 한국어
- 🔴 코딩 초보자 대상 — 기술 설명 간결하게, 명령어는 복붙 가능하게
- 🔴 한자 `雲從` 코드 표기 X — UNJONG + 운종 한글만
- 🔴 OTMarketing CPA 작업은 이 저장소에서 X → `~/OTMarketing/`
- 🔴 광고주 DB 수집·정산 로직은 본 프로젝트 영역 아님 — 투자 정보·차트·시그널·트레이딩 도구만

## 19. 핵심 참조 파일 표

| 파일 | 용도 | 갱신 빈도 |
|------|------|----------|
| `docs/NEXT_SESSION_PLAYBOOK.md` | **이 파일** — 다음 세션 마스터 인수인계 | 매 세션 종료 |
| `docs/NEXT_SESSION_START.md` | 비전·구조·다음 STEP 요약 | 매 세션 종료 |
| `docs/SESSION_KICKOFF.md` | 새 세션 즉시 시작 가이드 (간략) | 매 세션 종료 |
| `docs/CHANGELOG.md` | 세션별 변경 이력 | 매 세션 종료 |
| `session-context.md` | TODO + 누적 결정사항 + GC 시점 | 매 세션 종료 |
| `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 (지침서) | 변경 시 |
| `docs/PRODUCT_SPEC_V6.md` | **마스터 비전 (V6 — 정체성 축 "안 속는 곳" + 확정 결정 5개)** | 비전 변경 시 |
| `docs/NAVER_STOCK_PAGE_ANALYSIS.md` | 네이버 종목 페이지 분석 (정보 깊이 ④ 근거) | 참조 |
| `docs/BRAND_IDENTITY.md` | 운종 브랜드 + V5 디자인 시스템 (V6 계승) | 디자인 변경 시 |
| `docs/PRODUCT_SPEC_V4.md` | V4 비전 (이력 보존) | 보존 — 갱신 X |
| `docs/PRODUCT_SPEC_V3.md` | V3 히스토리 (보존) | 보존 — 갱신 X |
| `docs/SYSTEM_DESIGN.md` | V3 시스템 설계 (이력 보존) | 보존 — 갱신 X |
| `docs/BUSINESS_STRATEGY.md` | V3 비즈니스 전략 (이력 보존) | 보존 — 갱신 X |
| `CLAUDE_CODE_INSTRUCTIONS.md` | Layer 0 전체 개발 명령서 (V3·V4 명세) | 보존 — 갱신 X |
| `README.md` | 프로젝트 소개 + 빠른 시작 | 큰 변경 시 |
| `.env.example` | 21개 환경변수 템플릿 | 새 키 추가 시 |
| `supabase/migrations/` | DB 스키마 마이그레이션 | 새 마이그레이션 시 |
| `docs/STEP_N_COMMAND.md` | 각 STEP 실행 명령서 (아카이브) | 작성 후 유지 |
| `AGENTS.md` | Next.js 에이전트 룰 (운종 무관) | 외부 룰 — 갱신 X |
| `docs/CROSS_REFERENCE.md` | OTMarketing 별도 저장소 안내 | 변경 시 |

## 20. 폴더 구조

```
/
├── app/                    # Next.js App Router 페이지
│   ├── (home)/             # 새 홈
│   ├── kr/                 # 한국주식
│   ├── us/                 # 미국주식
│   ├── stock/[code]/       # 종목 페이지 (V5 핵심)
│   ├── products/           # 상품 디렉토리
│   ├── product/[id]/       # 상품 평가
│   ├── rooms/              # 리딩방 디렉토리
│   ├── room/[id]/          # 리딩방 평가
│   ├── calendar/           # Investing.com 외부 안내
│   ├── auth/               # 카카오 OAuth
│   ├── mypage/             # 마이페이지
│   └── api/                # API routes (KIS·DART·Yahoo·RSS)
├── components/             # React 컴포넌트
│   ├── home-v6/            # 포털형 홈 (HomeClientV6 + 섹션 모듈, STEP 142~143)
│   ├── home-v5/            # 홈 모듈 (검증·평가·뉴스·HOT토론 — home-v6 가 재사용)
│   ├── stock/              # 종목 페이지 탭 5종 시스템
│   ├── chat/               # Realtime 채팅
│   ├── discussion/         # 토론 + 댓글
│   ├── platform/           # MVP 2.0 평가 시스템
│   ├── layout/             # MainNav·RightFixedNav·헤더
│   └── ui/                 # LoadingState·EmptyState·ErrorState
├── lib/                    # 유틸리티 (yahoo·dart·kis·rss·supabase)
├── stores/                 # Zustand (watchlist·chat)
├── types/                  # TypeScript 정의
├── supabase/migrations/    # 005·014·015·016·017·018·019·020·021·022 (전부 적용)
├── public/                 # 정적 파일
├── docs/                   # 모든 문서 + STEP 명령서 아카이브
├── .claude/hooks/          # 세션 종료 검증 hook
├── CLAUDE.md               # 지침서
├── CLAUDE_CODE_INSTRUCTIONS.md
├── session-context.md
├── README.md
└── .env.example
```

## 21. 자주 쓰는 명령어 (Claude Code)

### 개발
```bash
cd ~/stock-terminal && npm run dev   # http://localhost:3333
cd ~/stock-terminal && npm run build # 빌드 검증
cd ~/stock-terminal && npm run start # 프로덕션 모드
```

### git
```bash
cd ~/stock-terminal && git status --short
cd ~/stock-terminal && git log --oneline -10
cd ~/stock-terminal && git add <files> && git commit -m "<msg>" && git push
```

### Supabase 마이그레이션 (Cowork → Supabase MCP)
```
Cowork 가 Supabase MCP 의 apply_migration 으로 직접 실행
사용자는 봐야 할 것 없음
```

### 환경변수 셋업 (신규 환경)
```bash
cd ~/stock-terminal && cp .env.example .env.local
# 그 후 실제 값 채우기
```

### .git/index.lock 충돌 시
```bash
cd ~/stock-terminal && rm -f .git/index.lock
```

## 22. 알려진 이슈·주의사항

| 이슈 | 대처 |
|------|------|
| `.git/index.lock` 가끔 충돌 | `rm -f .git/index.lock` |
| Supabase MCP CLI 토큰 보안 | `SUPABASE_ACCESS_TOKEN` 비워두기 — Cowork MCP 가 자체 인증 |
| GitHub Push Protection | 시크릿 노출 차단 → 마스킹 후 재시도 |
| Tailwind v4 `@theme` 토큰 | `--font-sans`·`--color-toss-*` 등 globals.css 에 정의 |
| Pretendard CDN 로딩 | `@import url("https://cdn.jsdelivr.net/.../pretendard.min.css")` |
| lightweight-charts attributionLogo | `attributionLogo: false` 명시 (Apache 2.0 라이선스) |
| SSR Hydration mismatch | `suppressHydrationWarning` + `mounted` pattern |
| Next 16 App Router | Server Component 기본, Client Component 는 `"use client"` |
| `dashboard` URL 접근 | 410 또는 / 로 redirect (STEP 117 삭제됨) |
| `/screener` URL 접근 | 404 (STEP 133 삭제됨) |

## 23. 환경변수 21개 (.env.example 참조)

| 그룹 | 키 |
|------|-----|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`·`SUPABASE_SERVICE_ROLE_KEY`·`SUPABASE_PROJECT_REF`·`DATABASE_URL` |
| Supabase MCP (선택) | `SUPABASE_ACCESS_TOKEN` (rotate 권장) |
| KIS | `KIS_APP_KEY`·`KIS_APP_SECRET`·`KIS_ACCOUNT_NO`·`KIS_ACCOUNT_PROD`·`KIS_BASE_URL`·`KIS_RATE_LIMIT_MS` |
| 한국 데이터 | `DART_API_KEY`·`ECOS_API_KEY` |
| 미국 데이터 | `SEC_USER_AGENT`·`FRED_API_KEY` |
| 카카오 OAuth | `KAKAO_CLIENT_ID`·`KAKAO_CLIENT_SECRET` |
| 토스페이먼츠 | `TOSS_CLIENT_KEY`·`TOSS_SECRET_KEY` |
| Cron (FSS) | `CRON_SECRET` — `/api/cron/fss-advisors` Vercel Cron 인증용 (STEP 137 추가) |
| AI 보조 (선택) | `OPENAI_API_KEY` |

## 24. 도메인 전략

- **메인**: `onetrillion.app` (보유 중) — 비전 명시
- **보호용** (구매 검토 중): `unjong.com` + `unjong.app` ($21)
- 운종 검색 → unjong.com → onetrillion.app 자동 전환

## 25. 글로벌 전략

- **영어판 만들지 않음** — 국가별 별도 페이지 (Layer 7+, 일본·미국 진출 시)
- 한국 시장 전력 집중

## 26. 다음 세션 즉시 시작 시퀀스 (이 순서로)

1. **이 PLAYBOOK 읽기** (1회 — 5분)
2. `session-context.md` 마지막 GC 일자 확인 → 1주일 넘었으면 TODO GC
3. `git log --oneline -5` 로 마지막 커밋 확인 — 이 PLAYBOOK 의 HEAD 해시와 일치하는지
4. 사용자에게 인사 + 다음 STEP 후보 1~7 중 1개 제안 (P0 추천)
5. 사용자 결정 → 파일 방식(`STEP_136_COMMAND.md`) 또는 인라인 명령어 작성
6. Claude Code 실행 → 결과 확인 → 4개 필수 문서 갱신 → 이 PLAYBOOK 갱신 → git push

---

> **PLAYBOOK 사용법**: 매 세션 종료 시 이 파일을 갱신하라. 다음 세션 Cowork 이 이 파일만 읽어도 100% 동기화 가능하도록.
>
> **이 PLAYBOOK 마지막 갱신**: 2026-06-04 STEP 153 종료 (V7 — 마켓 국내+미국 랭킹) + 문서 갱신 시점 · 마지막 코드 `33e72f7`
