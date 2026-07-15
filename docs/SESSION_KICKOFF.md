<!-- 2026-07-15 -->
# Trillion(트릴리언) — 새 세션 즉시 시작 파일

> ⭐ **더 디테일한 마스터 인수인계**: `docs/NEXT_SESSION_PLAYBOOK.md` (이 파일은 그 단축본)
>
> 이 파일을 처음부터 끝까지 읽으면 바로 작업 시작 가능.
> **Last refreshed**: 2026-07-12 (3) — 🛡️ 하드닝·📈 모니터링 마감[DEFINER 뷰 정리·미사용 ai-analysis 제거·Vercel Analytics·Sentry 라이브 에러캡처 검증·🐞 Vercel 빌드캐시 함정 교훈]; 이전 2026-07-12 — 🔒 1차 출시 QA 관문 통과[RLS 4개 테이블 보안 마감·법무 정확화·태그라인 새 슬로건]·CI 초록·라이브 검증; 이전 2026-07-11 (2) — 🔵 브랜드 외부 슬로건 확정["종목을 보는 눈을, 누구에게나"]+🖼️ OG/링크 미리보기[실제 로고]+📖 문서 마스터 인덱스[`docs/INDEX.md`] 신설; 이전 STEP 692~699 — 🐞 미리보기 수익률 단일소스+🧪 개발 안전망 vitest·CI+🔭 밸류 렌즈 KR 활성화+⚡ ETF/ETN 크론 스냅샷+UI 일관성 감사; 673~690 — 🔴 브랜드 대개편[3기둥 무기·직시·자립·멍거 목소리]+탭 14→3[종목·정보·검증]+ETF "상품 구성")
> **실행 환경**: Mac 로컬 `~/stock-terminal` 에서 직접 실행 (앱 배포 ✓ onetrillion.app)
> **현재 커밋**: `5c0c348` (🎉 Tier 3: LLM 생성물 영어화 완결 → `/en` 100% 영어 — 브리핑 R2·news-brief R3·공시요약 R1[6개국] 영어화[**720** `*_en` 컬럼 마이그(MCP)·**721** `/api/brief`·**722** `/api/news-brief`(한국어 강제 후처리 `ko` 게이팅)·**723** `/api/events/summary` US·**724** 5개국]. 캐시 **컬럼 분리**(`*_en`)로 충돌 차단·on-demand·KR byte 동일. 🐞 교훈=`*_ko` NOT NULL이 en-first INSERT 실패경로·swallowed upsert=조용한 유료 LLM 누수→DROP NOT NULL+로깅[`LENS_DEV_PLAYBOOK` #31]. 결과=`/en` 로고 외 한국어 0·US 영어 시장 제품 완성. 이전 `3cb73ab` 🌐 영어 데이터 레이어 i18n[Tier 1+2 결정론]+브랜드 록업 — `/en`의 렌즈명·판정·grade·detail·note·8-K·F-Score 이중언어화. **715** 렌즈 `&lang` 배선[카피 이미 이중언어]+h1 `info.en`+뱃지 · **716** 8-K·F-Score·ETF+events lang캐시 · **717** detail 키 stable화[lookup 키라 key/label 분리] · **718** note 6개 영어+short/long · **719** `/en` 한글 워드마크 "트릴리언" 숨김. KR byte 동일=charac+SHA 증명. 결과=`/en` 결정론 데이터 100% 영어, 남은=LLM 생성물=Tier 3[`docs/TIER3_LLM_I18N_DESIGN.md`·`*_en` 컬럼·on-demand·720~723]. 교훈 `LENS_DEV_PLAYBOOK` #30. 이전 `d122cac` 🐛 캐시 stale 버그 3-STEP 완결 — `[locale]` 페이지가 캐시 지시자 없어 **무한 정적 캐시**로 옛 콘텐츠[옛 브랜드·법무 정확화 전] 봇에 서빙되던 것 수정. **712** 종목상세·**713** 정적 8개 `force-dynamic`·**714** 클라 3개[mypage·auth/login·admin/login]는 `'use client'`라 서버 `layout.tsx` 래퍼로 강제 동적[로그인 불변]. 교훈=`[locale]` 페이지 캐시 지시자 명시·빌드가 dev `.next` 밟으면 클린 재시작. 남은 검증=구글 로그인 왕복. 이전 `f647b08` 🔎 US 풀뎁스 P0 — 종목상세 영어 SEO[STEP 711·`app/[locale]/stock/[symbol]/page.tsx` `generateMetadata`·JSON-LD locale 인지화·`/en/stock` 영어 title·OG en_US·hreflang·영어 breadcrumb·ko byte 동일·VN 분기 보존·🔑 Opus가 en은 info.en 영문명 주로 교정]. US 감사=US는 이미 KR 동급/더 깊음[link_hub 139·렌즈 백분위·공시 심각도]·잔여는 선택[통화기호·IPO·ETN]. 이전 `14c1813` 🌍 2차 i18n 완성 — next-intl `[locale]` 라우팅+영어(en)+언어 스위처+en→US 시장 디폴트. 문자열 이관 709~709F[`ko.json`·admin·약관 의도적 제외]→710A 라우팅 구조[ko 단일·as-needed·🐞 matcher 점규칙이 종목코드 404낼 뻔→확장자 화이트리스트]→710B `en.json`[414키·`messages.test.ts` 패리티]→710C 스위처+`@/i18n/navigation` 링크 스왑→710D `homeMarketFor`·`generateMetadata`/hreflang·youtube 로케일 숫자. 🅿️ OAuth 로케일 보류[redirectTo에 `?next=` 붙이면 Supabase 허용목록 거부→로그인 죽음·파트4 롤백·`docs/PARKED_OAUTH_LOCALE_ACTIVATION.md`]. tsc 0·vitest 34/34. 최신 상세는 `docs/SESSION_BOOT.md`. 이전 `09f1174` 🛡️ 하드닝·📈 모니터링 마감 — DEFINER 뷰 정리[`stock_snapshot_v` invoker·`advisor_directory`는 공개 리딩방 디렉토리 서빙에 DEFINER 필수라 유지·라이브 1,553행 검증]+미사용 `/api/ai-analysis` 제거[비인증 OpenAI 과금 구멍]+Vercel Analytics[⚠️대시보드 Enable 1클릭 남음]+Sentry[`@sentry/nextjs` v10·라이브 에러 캡처 검증]. 🐞 Vercel `NEXT_PUBLIC_*` 빌드캐시 함정→'캐시 없이 재배포'로 해결. 이전 `4ea75a1` 🔒 1차 출시 QA 관문 통과 — RLS 4개 테이블 보안 마감[공개 anon 키로 KR 보드 삭제·위조 가능하던 구멍→RLS on+anon REVOKE·`supabase/migrations/20260712_enable_rls_public_data_tables.sql`·읽기 전부 service-role→앱 영향 0·라이브 검증]+법무 정확화[구글만·개인정보 §11 권익침해 구제]+태그라인 새 슬로건[푸터·로그인·소개 "종목을 보는 눈을, 누구에게나."]·CI 초록. STEP 700~702=렌즈 독립배선·KOSPI/KOSDAQ 토글·상하한 배지·1차 폴리시. 이전 `ba3ce68` 🔵 브랜드 외부 슬로건 확정·🖼️ OG/링크 미리보기 실제 로고. `5cd234d` STEP 699 — 한국탭 완성도 심화: 🔭 밸류 렌즈 KR 활성화[재무로 PER/PBR 직접 산출]·⚡ ETF/ETN 크론 스냅샷화[`kr_etp_snapshot`]·미리보기 수익률 단일소스·🧪 개발 안전망 vitest+CI. `f21fa07` STEP 690 — 🔴 브랜드 대개편+탭 3개[종목·정보·검증]+ETF "상품 구성"). ▶ **다음 P0 = 1·2·3차 출시 로드맵 확정**(각 차수 기능 범위+광고 활성화 시점·기존 STEP③=1차 후보 재배치).
> **🔗 링크 허브**: KR `link_hub` **138**·US 67 (⚠️ MCP 직접 insert·마이그레이션 아님, US 미충전). **📱 모바일 패스=이번 세션 완료.**
> ⚠️ **최신 상태는 `docs/SESSION_BOOT.md` 기준** (이 파일 본문 §1~는 V6/271 히스토리). 🔑 라우트 수정 후 재시작은 `pkill -f "next dev" && rm -rf .next && npm run dev`.
> 세션이 끝날 때마다 이 파일과 NEXT_SESSION_START.md 반드시 업데이트할 것.

---

## 1. 운종 한 줄 정체성 (V6 — 2026-06-03 · [이력·폐기])

> ⚠️ **폐기 — 현행 아님.** 현행 정체성 = `docs/BRAND_IDENTITY.md`(3기둥 무기·직시·자립 · "종목을 보는 눈을, 누구에게나."). 아래 §1~ 본문(V5 페이지·STEP 88~153 등)은 V6/V7 스냅샷 보존용(상단 헤더 노트도 참조).
> **운종 = "투자상품에 속지 않게 돕는 곳"** — 정확한 정보 + 솔직한 토론 + 검증된 신뢰
>
> 구조 = 네이버 페이 증권 레이아웃 + 토스 증권 카드 디자인 + Trustpilot 평가 모델 (V5 계승, 중심축만 편의 → **신뢰**). 마스터 비전 `docs/PRODUCT_SPEC_V6.md`.

거래 X · 영어판 X · 깊은 분석 X (외부 정확한 곳으로 동선 안내 = 허브) · 코인 제외(한국 주식 먼저)

## 2. 운종 V5 페이지 13개

| 라우트 | 역할 |
|--------|------|
| `/` | 포털형 홈 = `components/home-v6/HomeClientV6` (지수바·브리핑·랭킹·업종테마·ETF·우측레일 + 검증·평가·HOT토론·뉴스) |
| `/kr` | 한국주식 카드 5개 |
| `/us` | 미국주식 카드 4개 |
| `/stock/[code]` | 종목 페이지 (좌 정보·차트 / 중 탭 5종: 차트·시세 / 토론 / 뉴스 / 공시 / 인사이트 + 댓글 / 우 채팅) |
| `/products` | 상품 디렉토리 (ETF·펀드·랩·리츠·채권) |
| `/product/[id]` | 상품 평가 |
| `/rooms` | 리딩방 디렉토리 (텔레그램·카카오·디스코드·유튜브) |
| `/room/[id]` | 리딩방 평가 |
| `/calendar` | Investing.com 외부 링크 안내 |
| `/auth/login`·`/auth/callback` | 카카오 OAuth (활성화 미완) |
| `/mypage` | 마이페이지 |

## 3. 현재 진행 상태 (STEP 88~153 · V7)

### ✅ STEP 137~151 (V6 정체성 → V7 네이버 복제 진입)
- **137** FSS 유사투자자문업자 인증 (lib/fss.ts·cron·검증 API·뱃지) — 금감원 신고 자동 검증, **1,738건 적재 완료**
- **138** 홈 신뢰 축 재배치 — 검증·평가 최상단 + 금감원 1,738개 히어로 + 뉴스 카테고리 탭
- **139** 종목 페이지 네이버급 디테일 — StockInsightsTab·Orderbook·Execution·InfoPanel·lib/format
- **140** 종목 토론 추천/비추천 통일 (ThumbsUp/Down + voteMap)
- **141** 종목 공시 탭 (StockDisclosuresTab DART/SEC, 주의공시 레드) → 종목 5탭 완성
- **142** 포털형 홈 전면 재구성 → 홈 = `components/home-v6/HomeClientV6`
- **143** 홈 빈 섹션·버그 수정 (브리핑 야후 라이브러리·거래량 실값·업종테마 market 키·레터 아바타)
- **144** 홈 지수 카드 스파크라인 — HomeIndexBar inline SVG 30일 추세선 + indices API yf.chart()
- **145** 브리핑 overnight 안정화 — 누락·0·NaN → "—"(중립), 가짜 초록 "+0.00%" 제거 (신뢰 정렬)
- **147** 종목 메타 보강 — StockInfoPanel 외국인 소진율·상장주식수 (KIS 한국 전용)
- **149** 홈 빈 섹션 CTA 버튼 — HOT토론·평가 참여 유도 링크
- **150** 브리핑 간밤 지수 실데이터 복구 — 라우트 runtime/dynamic 누락 수정
- **151** 네이버식 상단 6메뉴 + /discussion·/news shell — **V7 진입** (네이버 복제, 마스터 `docs/SITE_MAP_V7.md`)
- **152** 마켓 페이지 + 국내 랭킹 테이블 — /market (거래대금·거래량·상승·하락 필터·클릭→종목)
- **153** 마켓 미국 랭킹 — us-movers 확장 + MarketClient 국가 분기 (미국 상승/하락, $가격)

### ✅ MVP 1.0 + 2.0 (이전 누적)
- 정보: 9개 정확 카드 + 종목 5탭 디테일 / 대화: 토론·댓글·채팅(Realtime) / 검색 + Watchlist
- 상품·리딩방 평가 디렉토리 (platform_discussions 추천/비추천 + 금감원 인증 뱃지)
- 디자인 시스템 (Pretendard + 토스 색상 + rounded-2xl + shadow-soft)

### 🔴 사용자 직접 작업 (미완)
- **카카오 OAuth 활성화** (카카오 콘솔 + Supabase Dashboard) — 추천/비추천 투표 실동작 전제
- **Vercel 배포 + unjong.com 도메인** (도메인 결정 후) — FSS cron 활성 전제
- **SUPABASE_ACCESS_TOKEN 폐기** (보안 권장)

## 4. 다음 STEP 후보 (우선순위)

1. ~~브리핑 overnight 안정화~~ ✅ STEP 145 · ~~지수 카드 스파크라인~~ ✅ STEP 144
2. **홈 레이아웃 비율 미세조정** (메인/우측레일 균형)
3. **인기글 예시 시드** (HotDiscussions·평가글 초기 콘텐츠 — '예시' 명확 표기)
4. ~~외국인보유율·상장주식수 메타~~ ✅ STEP 147 완료
5. **Sponsored 분리 UI** (광고 ↔ 평가 시각 분리)
6. **카카오 OAuth 활성화** (사용자) / **Vercel 배포 + unjong.com** (사용자)

## 5. DB 마이그레이션 — 020·021·022 까지 모두 적용 완료

005 → 014 → 015 → 016 → 017 → 018 → 019 → **020 → 021 → 022** (Cowork Supabase MCP, 운종 DB ref `qxkmwlkchyxfzxbonhtj` = 표시명 "OT-Marketing")
- 005 채팅 기본 / 014 room·nickname / 015 채팅 통합 / 016 users V5 / 017 discussions / 018 댓글 / 019 platform 디렉토리 + 시드
- **020 dislike_votes** — 상품·리딩방 평가 추천/비추천 ✅ (06-04)
- **021 fss_advisors** — 금감원 원장 + 인증 컬럼, **FSS 1,738건 적재** ✅ (06-04)
- **022 discussion_dislike** — 종목 토론 추천/비추천 ✅ (06-04)
- ⚠️ POTAL ref `zyurflkhiregundhisky` 절대 사용 금지 (혼동 주의)

## 6. 핵심 참조 파일

| 파일 | 용도 |
|------|------|
| `docs/NEXT_SESSION_START.md` | **가장 최신 상태** (이 파일과 같이 읽기) |
| `docs/CHANGELOG.md` | 세션별 변경 이력 |
| `session-context.md` | TODO + 누적 결정사항 |
| `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 |
| `docs/PRODUCT_SPEC_V4.md` | V4 비전 (V5 는 NEXT_SESSION_START 참조) |
| `docs/BRAND_IDENTITY.md` | 운종 브랜드 정체성 + V5 디자인 시스템 |

## 7. 세션 시작 시 Cowork 액션

1. **이 파일 + NEXT_SESSION_START.md 읽기**
2. `session-context.md` TODO 가비지 컬렉션
3. 사용자에게 다음 STEP 제안 → 결정 후 명령서 작성
4. 명령서 작성 시 보안: `.env.local` 값 절대 평문 X (마스킹·`.env.example` 형식)
