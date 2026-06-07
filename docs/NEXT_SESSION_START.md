<!-- 2026-06-07 -->
# 운종(雲從) — 다음 세션 시작 가이드

> **Last updated**: 2026-06-07 (STEP 194 — 토스 실시간차트 A~D 완성 + 로고/차트/등락색 정밀화)
> ⭐ **더 디테일한 마스터 인수인계**: `docs/NEXT_SESSION_PLAYBOOK.md`. **마스터 비전**: `docs/PRODUCT_SPEC_V6.md` (정체성 축 = "안 속는 곳").
>
> **현재 상태**: STEP 194 까지 완료 — **V7(토스증권 오마주)**. 빌드 ✓ (HEAD `f0c38c6`). 홈 = 토스식 대시보드(지수 10개·area fill 스파크라인·수급 + 하단 마퀴) · 단일 헤더(아이콘 우측정렬) · 관심 레일. **실시간차트 탭 토스화 완성**: 라운드스퀘어 필터칩(거래대금/거래량/급상승/급하락)+기간행(실시간만 활성)+투자위험 토글 ｜ 지금 뜨는 카테고리 2열(국내 KIS업종·해외 미국섹터ETF) ｜ 국내 투자자 동향 3열(외국인·기관 실·개인 준비중). 종목 hover 상세(캔들 거래량+월라벨·커뮤니티). **로고 logo.dev**(미국 티커 자동+국내 42, `.env.local` `NEXT_PUBLIC_LOGODEV_TOKEN`). **등락색 한국식**(상승=빨강·하락=파랑). 국내 랭킹 = KIS 30 fallback. **⏳ STEP 162 KRX 공식 OpenAPI = 키 대기**.
> ▶ 다음: **인기토론 홈**(지수 티커 헤더밑 고정 + 인기토론 2열 라이브, 인기순+반론 노출) · 상세 패널 운종 콘텐츠(증권사 상품·단톡방) · STEP 162 키 승인 시 실행.
> **운종 정체성 (V6 — 2026-06-03 확정)**: "투자상품에 속지 않게 돕는 곳" — 정확한 정보 + 솔직한 토론 + 검증된 신뢰 (중심축 = 신뢰). 마스터 비전 `docs/PRODUCT_SPEC_V6.md`.
>
> ✅ **마이그레이션 020·021·022 = 2026-06-04 전부 적용 완료** (운종 DB ref `qxkmwlkchyxfzxbonhtj`, 표시명 "OT-Marketing"). `021` FSS 실데이터 **1,738건 적재 완료** → 리딩방 금감원 신고 검증·뱃지 실동작. 추천/비추천 투표는 **카카오 OAuth 활성화(사용자 작업) 후** 로그인 사용자에게 동작.

---

## 0. 진행 상태 한눈 (2026-06-06 기준 · HEAD `13067c6` STEP 174 · V7 토스 오마주+UI)

### ✅ STEP 137~153 (V6 정체성 → V7 네이버 복제)

| STEP | 영역 | 결과 |
|------|------|------|
| 137 | FSS 유사투자자문업자 인증 시스템 (lib/fss.ts·cron·검증 API·뱃지) | 금감원 신고 자동 검증 (021 적용·1,738건 적재 완료) |
| 138 | 홈 신뢰 축 재배치 (home-v5) — 검증·평가 최상단 + 금감원 1,738개 히어로 + 뉴스 카테고리 탭 | 신뢰 정체성 정렬 |
| 139 | 종목 페이지 네이버급 디테일 (StockInsightsTab·Orderbook·Execution·InfoPanel·lib/format) | 정보 깊이 ④ |
| 140 | 종목 토론 추천/비추천 (DiscussionItem/Board ThumbsUp/Down + voteMap) | 신뢰 신호 통일 (022) |
| 141 | 종목 공시 탭 (StockDisclosuresTab DART/SEC, 주의공시 레드) | 종목 5탭 완성 |
| 142 | 포털형 홈 전면 재구성 (components/home-v6/HomeClientV6 + 섹션 모듈) | 홈 = HomeClientV6 |
| 143 | 홈 빈 섹션·버그 수정 (브리핑 야후 라이브러리·거래량 실값·업종테마 market 키·레터 아바타) | 홈 데이터 복구 |
| 144 | 홈 지수 카드 스파크라인 (HomeIndexBar inline SVG 30일 추세선 + indices API yf.chart()) | 홈 시각 강화 |
| 145 | 브리핑 overnight 안정화 (누락·0·NaN → "—" 중립, 가짜 초록 "+0.00%" 제거) | 신뢰 정렬 |
| 147 | 종목 메타 보강 (StockInfoPanel 외국인 소진율·상장주식수, KIS 한국 전용) | 정보 깊이 |
| 149 | 홈 빈 섹션 CTA 버튼 (HOT토론·평가 참여 유도) | 신뢰 |
| 150 | 브리핑 간밤 지수 실데이터 복구 (라우트 runtime/dynamic 누락) | 데이터 |
| 151 | 네이버식 상단 6메뉴 + 토론·뉴스 shell | V7 진입 |
| 152 | 마켓 페이지 + 국내 랭킹 테이블 (필터·클릭→종목) | V7 마켓 1차 |
| 153 | 마켓 미국 랭킹 (us-movers 확장·국가 분기) | V7 마켓 국내+미국 |
| 154·157 | 마켓 시총 필터(KIS market-cap) · 랭킹 100 확대(KIS 3종+Yahoo US 100) | 랭킹 깊이 |
| 156 | 홈 = 토스식 시장 대시보드 (지수+랭킹 embedded+관심레일) | **토스 오마주 진입** |
| 158·159(+) | 홈·전 페이지 풀폭 통일 (max-w 캡 제거, 앱 프레임 1984 유지) | 토스 폭 |
| 160 | 홈 지수 그리드 10개 (토글 제거·국내+해외+환율+원자재+코인) | 토스 지수 |
| 161 | 국내 랭킹 100 인프라 (`/api/krx/ranking` + KIS 30 fallback) | 랭킹 100 |
| 162 | KRX 공식 OpenAPI 연동 (`stk/ksq_bydd_trd`, `AUTH_KEY`) | ⏳ **키 승인 대기·미실행** |
| 163 | 상단 티커 KRX KOSPI/KOSDAQ 심볼 제거 | 티커 정리 |
| 164 | 지수 카드 전일대비 금액 + 느낌 태그(급등/조정/급락) | 토스 지수 |
| 165·166 | 코스피·코스닥 수급 (KIS `FHPTJ04040000`, 일별) | 토스 수급 |
| 167·168 | 하단 고정 마퀴 티커(토스식)·상단 제거·금액·투자유의사항 라벨 | 토스 티커 |
| 169·171 | 관심 레일 토스화 (헤더까지 풀하이트·레터아바타·♥·세로 아이콘 탭) | 관심 레일 |
| 170 | 헤더 한 줄 통합 (로고+네비+검색+아이콘, MainNav 행 제거) | 단일 헤더 |
| 172·173 | 종목 실로고 (도메인 favicon + 아바타 폴백, `lib/avatar`·`StockLogo`) | 종목 로고 |
| 174 | 종목 hover 상세 3단 [랭킹｜상세｜관심] (토스 UI 셸·운종 확장영역 placeholder) | hover 상세 |

### ✅ 완료된 STEP (88~135)

| 구간 | 영역 | 결과 |
|------|------|------|
| 88~99 | 운종 V4 골격 + 21개 카드 + 디테일 (Layer 0) | V4 완성 (보존 단계) |
| 100~110 | Layer 1-A~E 실데이터 + 채팅·관심종목 + 마커 청소 | V4 → V5 진입 직전 |
| 111 | 검색 활성화 + ContextNav 제거 + V4 헤더 5개 청소 | V5 헤더 |
| 114 | V5 1차 — 컨테이너 1984px + 3창→2창(한국/미국) + 카드 9개 + 종목상세 2탭 + 채팅 1채널 | V5 골격 |
| 115 | 종목 페이지 + 토론 + 종목별 채팅 | 운종 본질 |
| 116 | V3 잔재 1차 청소 (9 페이지 + API 3 + 컴포넌트 2) | 청소 |
| 117 | 새 홈 + dashboard 처분 + V3 12 페이지 + widgets 청소 | 청소 |
| 118 | Layer 3 인증 코드 (카카오 OAuth) — 활성화 사용자 작업 | 인증 |
| 119 | (STEP 119 명령서 — 시크릿 노출 후 마스킹, push X) | 보류 |
| 120 | 종목 페이지 마무리 (좋아요·신고·차트 inline·미장 quote) | 마무리 |
| 122 | 시장 헤드라인 + 종목별 뉴스 (RSS + Yahoo) | 뉴스 |
| 123 | UI 일관성 (LoadingState·EmptyState·ErrorState) | UI |
| 124 | 토론 댓글 (discussion_comments + UI) | 대화 본질 |
| 125 | 미국 주식 상세 (Yahoo quoteSummary) + 검색 ⭐ Watchlist 통합 | 풍부화 |
| 126 | 종목 페이지 핫픽스 (종목명·시총·52주·차트 4 버그) | 핫픽스 |
| 127 | 가독성 리뉴얼 (Pretendard + html 13→16px + text-xs→sm) | 폰트·스케일 |
| 128 | MVP 2.0 1차 — 상품·리딩방 디렉토리 + 평가 시스템 기반 | MVP 2.0 진입 |
| 129~133 | 전면 디자인 리뉴얼 (디자인 시스템 + 토스 카드 + 종목 페이지 탭 + 새 홈 손성기 + MVP2 통일) | 운종 V5 완성 |
| 134 | 모든 문서·로그 3차 교차검수 갱신 | 문서 |
| 135 | 잔여 문서 V5 정렬 패치 (README·BRAND·SPEC_V4 + .env.example + .gitignore) | 문서 마감 |

### ✅ DB 마이그레이션 — 모두 적용 완료

| 마이그레이션 | 내용 | 적용 |
|------------|------|------|
| 005_chat_v2 | 채팅 기본 | ✅ |
| 014_chat_rooms | room/nickname 컬럼 | ✅ |
| **015_chat_unify** | scalper/longterm/us → general 통합 | ✅ |
| **016_users_v5** | V3 결제 컬럼 제거 + tier/bio/oauth_provider + handle_new_user | ✅ |
| **017_discussions** | discussions/likes/reports + chat_messages.symbol | ✅ |
| **018_discussion_comments** | 댓글 테이블 + comment_count 트리거 | ✅ |
| **019_platform_directory** | products/leading_rooms/platform_discussions + 시드 (ETF 10·리딩방 5) | ✅ |
| **020_dislike_votes** | 상품·리딩방 평가 추천/비추천 (vote + dislike_count + 트리거) | ✅ (06-04) |
| **021_fss_advisors** | 금감원 유사투자자문업자 원장 + leading_rooms 인증 컬럼. **FSS 1,738건 적재 완료** | ✅ (06-04) |
| **022_discussion_dislike** | 종목 토론 추천/비추천 (vote + dislike_count + 트리거) | ✅ (06-04) |

→ Cowork (Supabase MCP) 가 020·021·022 까지 **모두 적용 완료** (운종 DB ref `qxkmwlkchyxfzxbonhtj`, 표시명 "OT-Marketing"). **로컬 동작 정상**.

---

## 1. 사용자 직접 작업 (🔴 미완)

### 🔴 카카오 OAuth 활성화 — STEP 118 잔여
1. **카카오 Developers 콘솔** (https://developers.kakao.com):
   - 앱 "운종" 등록 → Web 플랫폼 + 카카오 로그인 ON
   - Redirect URI: `https://qxkmwlkchyxfzxbonhtj.supabase.co/auth/v1/callback`
   - 동의항목: 닉네임·이메일·프로필 사진
   - REST API 키 복사
2. **Supabase Dashboard** → Auth → Providers → **Kakao ON** + REST API 키 입력

→ 전까지 카카오 로그인 시 OAuth 실패 (단 빌드·페이지·비로그인 사용은 정상).

### 🔴 SUPABASE_ACCESS_TOKEN 폐기 권장 — STEP 119 보안 이슈
- `docs/STEP_119_COMMAND.md` 에 한 차례 노출됐던 PAT (`sbp_aedc6b23...`)
- GitHub Push Protection 으로 외부 노출은 차단됐지만, 로컬 디스크에 평문 잔재
- https://supabase.com/dashboard/account/tokens → Revoke + 새 PAT 발급 → `.env.local` 갱신
- 명령서 시크릿은 이미 마스킹 완료

### 🟢 Vercel 배포 + unjong.com 도메인 — 사용자 결정 후
- 사용자 보류 상태 ("도메인 구매 전이니까 보류")
- 결정 시 STEP 119 (재작성·시크릿 마스킹 버전) 실행

---

## 2. 운종 V5 페이지 구조 (최종)

| 라우트 | 역할 | 상태 |
|--------|------|------|
| `/` | 포털형 홈 = `components/home-v6/HomeClientV6` (지수바·브리핑·랭킹·업종테마·ETF·우측레일 + 검증·평가·HOT토론·뉴스 + placeholder shell) | ✅ |
| `/kr` | 한국주식 카드 5개 (Movers·Volume·NetBuy·단타공시·장타공시) | ✅ |
| `/us` | 미국주식 카드 4개 (Indices·M7·UsMovers·시계+시장상태) | ✅ |
| `/stock/[code]` | 종목 페이지 (좌 sticky 정보+차트 / 중 **탭 5종: 차트·시세 / 토론 / 뉴스 / 공시 / 인사이트** + 댓글 / 우 채팅 + 우측 fixed nav 48px) | ✅ |
| `/products` | 상품 디렉토리 (ETF·펀드·랩·리츠·채권 카테고리 필터) | ✅ |
| `/product/[id]` | 상품 평가 (좌 정보 / 중 평가 토론 PlatformDiscussionBoard) | ✅ |
| `/rooms` | 리딩방 디렉토리 (텔레그램·카카오·디스코드·유튜브 + 인증 마크) | ✅ |
| `/room/[id]` | 리딩방 평가 | ✅ |
| `/calendar` | 경제 캘린더 → Investing.com 외부 링크 안내 (허브 정체성) | ✅ |
| `/auth/login` | 카카오 로그인 UI | 🔴 활성화 사용자 작업 |
| `/auth/callback` | OAuth 콜백 | 🔴 |
| `/mypage` | 마이페이지 (V3 잔재 일부) | 🟡 |
| ~~/screener~~ | (STEP 133 제거 — 정체성 충돌) | — |

---

## 3. 운종 정체성 (V6 — 2026-06-03 확정)

> **운종 = "투자상품에 속지 않게 돕는 곳"** — 정확한 정보 + 솔직한 토론 + 검증된 신뢰
> 구조(네이버 레이아웃 + 토스 카드 + Trustpilot 평가)는 V5 계승, 중심축만 편의 → **신뢰**로 재정렬.

### V6 확정 결정 5개 (LOCK)
- **0 정체성 축**: "동선의 출발점(편의)" → "안 속는 곳(신뢰)"
- **① 평가 방식**: 토론 + 추천/비추천 + 사기의심 신고. 별점(star) ❌ (조작·명예훼손 소송 리스크 회피)
- **② 인증 뱃지**: 금융위(금감원) 신고번호 입력 → 자동 검증 → 뱃지. 운영자 임의 부여 ❌
- **③ 코인**: 제외 — 한국 주식으로 먼저 완성·증명 후 재논의
- **④ 정보 깊이 단계화**: 시세·차트·공시·뉴스 먼저 → 재무지표(ROE·부채비율 등 계산) 2단계 → 정밀 스크리너·분석 도구는 외부 링크

### 4박자 (정보·대화·허브·신뢰 — 신뢰가 중심축)
- **정보**: 본질만 (KIS·DART·Yahoo·RSS 9개 정확 카드 + 종목별 정보 핵심) — 디테일은 외부 (허브)
- **대화**: 정제된 채팅·토론·댓글 (모더레이션 + Tier)
- **허브**: /calendar 외부 링크 · 종목별 뉴스 외부 새 탭 · 운영자가 평가 X (사용자 토론)
- **신뢰**: Tier 1·2·3 시스템 + 신고 5건 자동 hidden + 카카오 OAuth 인증

### 운종이 안 하는 것 (의도된 제외)
- 거래 매매 (증권사 라이센스 X)
- 정밀 스크리너 (네이버·키움·FnGuide 영역)
- 영어판 (국가별 별도)
- 호가창·체결·거래원 동향 (전문가용)
- 컨센서스·목표주가·종목분석·리포트 (FnGuide 영역)

### 운종이 진짜 차별화 — MVP 2.0
- 상품·리딩방 **평가 디렉토리** (Trustpilot 금융 버전)
- Tier 인증 광고 (Sponsored ↔ 평가 명확 분리 — 추후)
- 정제된 종목 채팅·토론 (네이버 종토방 욕설·찌라시 대체)

---

## 4. 다음 STEP 후보 (우선순위 순)

| 순위 | 후보 | 의미 |
|------|------|------|
| — | ~~브리핑 overnight 안정화~~ ✅ STEP 145 · ~~지수 카드 스파크라인~~ ✅ STEP 144 | 완료 |
| ▶ | **V7 마켓 페이지 (STEP 152)** — 국내·미국 통합 + 네이버식 랭킹 테이블 · 상세 `docs/SITE_MAP_V7.md` | 네이버 복제 |
| 후 | 홈 레이아웃 비율 미세조정 (V7 후순위 보류) | 포털 완성도 |
| 2 | **인기글 예시 시드** (HotDiscussions·평가글 0건 → 초기 콘텐츠, '예시' 명확 표기) | 빈 섹션 채우기 |
| — | ~~외국인보유율·상장주식수 메타~~ ✅ STEP 147 완료 (외국인 소진율·상장주식수) | 정보 깊이 |
| 4 | **Sponsored 분리 UI** (광고 ↔ 평가 시각 분리) | MVP 2.0 신뢰 |
| 5 | **카카오 OAuth 활성화** (사용자 직접) | 추천/비추천 투표 실동작 전제 |
| 6 | **Vercel 배포 + unjong.com** (사용자 결정) | FSS cron 활성 + 출시 |

---

## 5. 즉시 확인할 파일

| 우선순위 | 파일 | 용도 |
|---------|------|------|
| 1 | `docs/NEXT_SESSION_START.md` (이 파일) | 가장 최신 |
| 2 | `docs/SESSION_KICKOFF.md` | 새 세션 즉시 시작 가이드 |
| 3 | `docs/PRODUCT_SPEC_V4.md` | 운종 V4 비전 (V5 는 본 파일·CHANGELOG 참조) |
| 4 | `docs/BRAND_IDENTITY.md` | 운종 브랜드 정체성 |
| 5 | `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 |
| 6 | `session-context.md` | TODO + 누적 결정사항 |
| 7 | `docs/CHANGELOG.md` | 세션별 변경 이력 |

---

## 6. 절대 잊지 말 것 (운종 결정사항)

- **운종 정체성 (V6)** = "투자상품에 속지 않게 돕는 곳" — 정보 + 대화 + 허브 + 신뢰 (중심축 = 신뢰)
- **거래 X** (증권사 라이센스 X)
- **영어판 X** (국가별 별도)
- **호가창·체결 X** (전문가용, 운종 페르소나 X)
- **스크리너 X** (네이버·키움·FnGuide 영역 — STEP 133 제거)
- **경제 캘린더** = 외부 (Investing.com) 링크 (허브 정체성)
- **종목 정보 디테일** = 본질만 (네이버 따라가지 X)
- **MVP 2.0** = 상품·리딩방 평가 (운종 진짜 사업)
- **한자 雲從 표기 X** (UNJONG + 운종 한글만)
- **5섹션 대시보드 → 제거** (STEP 117 dashboard 통째 삭제)
- **도메인**: 사용자 결정 후 (unjong.com 보류 중)

---

## 7. 운종 V5 디자인 시스템

- **폰트**: Pretendard Variable (CDN, 한국어 친화) + Playfair_Display 보조 (UNJONG 로고)
- **루트 폰트**: 16px (Tailwind 표준)
- **색상**:
  - 운종 brand: `#0F1E3D` primary · `#D4AF37` accent (기존 유지)
  - 토스 보조: `#3182F6` blue · `#F04452` red (하락) · `#1AC267` green (상승) · 회색 그라데이션
- **카드**: rounded-2xl + shadow-soft + p-5 + hover shadow 전환
- **컨테이너 max-w**: 1984px (토스 동일)
- **spacing**: gap-5 카드 그리드 · py-3·px-3 종목 행

---

## 8. 새 세션 시작 시 Cowork 액션

1. **이 파일 (NEXT_SESSION_START.md) 읽기** ← 가장 최신
2. `session-context.md` TODO 확인 (가비지 컬렉션)
3. `docs/CHANGELOG.md` 최근 변경 훑기
4. 사용자에게 오늘 할 P0 작업 제안 (Tier 인증·광고 분리·고아 청소·모바일 등)
5. 결정되면 → STEP 명령서 작성 → Claude Code 실행
