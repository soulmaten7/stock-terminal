<!-- 2026-07-18 -->
# 🗺️ Trillion(트릴리언) — SYSTEM MAP (아키텍처·파이프라인 지도)

> **아키텍처가 바뀔 때만 수정**(세션마다 아님). 현재상태=`STATE.md` · 이력=`CHANGELOG.md`.
> 이 지도는 **라이브 시스템 실측**(vercel.json 크론·Supabase 테이블·`data/*` 시드·`.env.local` 변수)으로 작성 — 낡은 문서 아님. (2026-07-17 실측)

## 1. 스택
- **Next.js 16 App Router**(Turbopack · dev 포트 3333) · **Tailwind v4**(`@theme` in `app/globals.css`) · **Zustand**(`countryStore`·`authStore`) · **next-intl**(`[locale]` · ko 무프리픽스 · en=`/en` · `as-needed`).
- **Supabase** `@supabase/ssr` — server/browser client + admin client(SERVICE_ROLE · RLS 우회). 마이그레이션 = Cowork가 MCP로 적용, Claude Code가 `.sql` 아카이브.
- **Vercel** 배포 · 크론(§4) · Analytics · Sentry(@sentry/nextjs v10).

## 2. ⚠️ DB 프로젝트 (footgun 주의)
- **정답 = "Trillion" `ccbwxcszdoyjxvckedfp`** (ap-northeast-2). 앱 런타임 `NEXT_PUBLIC_SUPABASE_URL` = 이거 ✅(라이브 실측). 마이그레이션·MCP도 전부 이 ref.
- ⛔ **금지 ref**: POTAL `zyurflkhiregundhisky` · 구 "OT-Marketing" `qxkmwlkchyxfzxbonhtj`.
- 🐞 **잔존 footgun(2026-07-17 발견 · 정리 대상)**:
  - `supabase/.temp/linked-project.json` = **CLI가 OT-Marketing(`qxkmwlkchyxfzxbonhtj`)에 링크됨** → **`supabase db push` 등 CLI DB 명령 절대 금지**(옛 프로젝트 침). 쓰려면 `ccbwxcszdoyjxvckedfp`로 재링크 먼저.
  - `.env.local`의 `DATABASE_URL` = 옛 ref(앱 코드 미사용 = 무해하나 정리 권장).
  - docs 13개에 옛 ref 잔존(통합·아카이브로 정리 중).

## 3. 🌍 6개국 데이터 파이프라인 (핵심 — 유니버스 자동 vs 시드)
| 국가 | 유니버스 소스 | 자동/시드 | 가격 파이프라인 | 크론(UTC) | 종목명 |
|------|--------------|-----------|-----------------|-----------|--------|
| 🇰🇷 KR | **KRX 전종목 일일피드**(`stk_bydd_trd`·`ksq_bydd_trd`) | **자동**(신규상장 다음날 편입) | `lib/krSnapshot.ts`(전시장 1콜) → `kr_stock_snapshot`(2,772) | `kr-perf` 10:00 · `kr-etp` 10:15 · `kr-lens-scores` 10:30 | 한글(KRX) **+ `name_en`**(야후 백필 2766/2772 · **자동채움 ✅** `kr-perf` 크론이 null만 증분·STEP 746) |
| 🇺🇸 US | `data/us_symbols.json`(주식 5,964+ETF 815) | **매일 자동 재생성**(Nasdaq Trader 심볼 디렉토리 → GitHub Action `refresh-us-symbols` 매일 09:00 UTC 자동 커밋 → 22:00 us-perf가 시세 채움 = **신규 상장 익일 편입·KR 동급**·STEP 754/754b/755·주식만·ETF 큐레이션 보존) | `lib/usPerf.ts`(종목별 야후·**하드닝**: 콜별 5s 타임아웃+신선도역순+예산 260s·755) → `us_stock_perf` | `us-perf` 22:00 · `lens-scores` 20:00(US 렌즈) | 영어(원본·SEC 실명·title-case) |
| 🇯🇵 JP | `data/jp_symbols.json`(4,268) | **시드** | `lib/jpPerf.ts` → `jp_stock_perf` | `jp-perf` 08:00 · `jp-disclosures` 16:00 | 일본어(`jp_names`) · **영문명 미완** |
| 🇨🇳 CN | `data/cn_symbols.json`(7,098) | **시드** | `lib/cnPerf.ts` → `cn_stock_perf` — HK=야후 · **A주=텐센트 ifzq kline 1차**(东方财富는 폴백 — Vercel IP 소프트차단·07-18) · 전체+신선도역순+예산 260s·콜별 5s 타임아웃(STEP 750b~752) | `cn-perf` 08:00 | 중국어(`cn_names`) · **영문명 미완**(시드 name은 영문·title-case만 필요 — §6c) |
| 🇻🇳 VN | `data/vn_symbols.json`(403 · HOSE+HNX) | **시드** | `lib/vnPerf.ts`(야후) → `vn_stock_perf` | `vn-perf` 08:00 | 베트남어(`vn_names`) · **영문명 미완** |
| 🇬🇧 GB | `data/gb_symbols.json`(349 · FTSE350) | **시드** | `lib/gbPerf.ts` → `gb_stock_perf` | `gb-perf` 08:00 | 영어(원본) |

- ⚠️ **프레시니스 격차(07-18 갱신)**: **KR·US = 유니버스 자동**(KR=KRX 일일피드·US=심볼 디렉토리 일일 Action). **JP·CN·VN·GB 시드는 정적** = 신규 상장 미편입 — US 패턴(스크립트+Action) 재사용으로 후속.
- 🛡️ **Perf 하드닝(750b~755 · 6개국 전부)**: 외부 콜별 5s 타임아웃(`withTimeout`) + 신선도 역순(오래된 것 먼저) + 시간 예산 260s — hang 소스가 하루를 통째 날리지 못하고, 부분 실패는 다음날 자연 만회. (KR은 KRX 전시장 1콜 구조라 해당 없음.)
- **렌즈 선계산**: `lens_scores`(US ~1,028 + KR ~489) — `kr-lens-scores`/`lens-scores` 크론. 밖의 종목은 live `/api/lens`(야후 계산·결정론·무료).

## 4. 크론 (vercel.json · 전체 13개)
`fss-advisors` 19:00(유사투자자문 신고 갱신) · `youtube-refresh` 월요일(주간) · `us-perf` 22:00 · `kr-perf` 10:00(+name_en null 증분·STEP 746) · `kr-etp` 10:15 · `kr-lens-scores` 10:30 · `jp-perf`·`cn-perf`·`vn-perf`·`gb-perf` 08:00 · `lens-scores` 20:00(US 렌즈) · `jp-disclosures` 16:00 · **`health` 12:00(신선도 감시·stale→Sentry·STEP 749)**. (VN HNX 실시간 크론은 클라우드 IP 차단으로 보류 · `PARKED_HNX_VCI_ACTIVATION.md`.)
- ⚠️ **Vercel Hobby 플랜 = 크론 일 1회 한도.** 더 촘촘한 스케줄(`*/3` 등)을 넣으면 **배포 전체가 조용히 거부**됨(07-18 실증 — 4커밋 미반영·webhook 정상인데 신규 배포 0). 스케줄 설계 전 플랜 제약 확인.

## 5. DB 테이블 (62개 · 그룹)
- **시세/성과**: `kr_stock_snapshot` · `{us,jp,cn,vn,gb}_stock_perf` · `kr_etp_snapshot` · `stock_prices` · `stocks`
- **렌즈/재무**: `lens_scores` · `quant_factors` · `financials` · `dividends` · `short_credit` · `supply_demand` · `insider_trades`
- **종목명**: `cn_names` · `gb_names` · `jp_names` · `vn_names` (KR·US는 스냅샷/시드에 내장)
- **AI 캐시(로케일 컬럼 `*_ko`/`*_en`)**: `stock_briefings`(R2) · `news_briefs`(R3) · `filing_summaries`(R1) · `translation_cache` · `ai_view_cache` · `ai_analysis`
- **공시/뉴스**: `disclosures` · `jp_disclosures` · `news` · `dart_corp_codes` · `macro_indicators`
- **링크/큐레이션**: `link_hub`(KR 140·US 139) · `link_hub_clicks` · `link_hub_favorites` · `link_previews`
- **유사투자자문/리딩방**: `fss_advisors`(1,847) · `leading_rooms` · `leading_room_votes` · `room_*`(favorites·likes·reports·reviews·submissions)
- **광고/업체**: `ad_inquiries` · `business_*`(claims·links·listing·members) · `brokers` · `products` · `banned_words`
- **유저/UGC**: `users` · `watchlist` · `feedback` · `youtube_channels` · `discussions`·`discussion_*` · `platform_discussions`·`platform_discussion_*`
- ⚠️ **git에 없는 테이블 주의**: `link_hub`·`fss_advisors` 등 일부는 MCP 직접 insert라 마이그레이션/git에 없음 → **DB 백업/이전 시 별도 export 필수.**

## 6. API 라우트 (`app/api/`)
- **크론**: `cron/{fss-advisors,youtube-refresh,us-perf,kr-perf,kr-etp,kr-lens-scores,jp-perf,cn-perf,vn-perf,gb-perf,lens-scores,jp-disclosures}`
- **보드/시세**: `krx/ranking` · `yahoo/{us,jp,cn,vn,gb}-list` · `yahoo/indices`(지수바·심볼별 try/catch 격리) · `yahoo/us-etn-performance` · `krx/kr-performance` · `watchlist/quotes`
- **렌즈/AI**: `lens` · `brief`(R2) · `news-brief`(R3) · `events/summary`·`{kr,jp,cn,gb,vn}-events/summary`(R1) · `etf-holdings`
- **피드/기타**: `news/feed`(lang 파라미터) · `ipo/us-feed` · `brokers` · `advisors` · `link-preview` · `feedback` · `watchlist` · `business/manage` · `rooms/favorite` · `toolbox/favorite`

## 7. env 변수 (이름만 · 값은 `.env.local`/Vercel)
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `CRON_SECRET`
- **데이터 소스**: `KRX_API_KEY` · `DART_API_KEY` · `EDINET_API_KEY` · `KIS_*`(APP_KEY·SECRET·BASE_URL·TTL·RATE) · `NAVER_CLIENT_ID`/`SECRET` · `FRED_API_KEY` · `ECOS_API_KEY` · `DATA_GO_KR_KEY` · `SEC_USER_AGENT` · `YOUTUBE_API_KEY` · `FSS_FETCH_DELAY_MS`
- **AI/결제/기타**: `OPENAI_API_KEY` · `TOSS_CLIENT_KEY`/`NEXT_PUBLIC_TOSS_CLIENT_KEY`(결제 stub) · `NEXT_PUBLIC_LOGODEV_TOKEN` · `NEXT_PUBLIC_SITE_URL`
- ⚠️ 비밀은 사용자 → `.env.local`(로컬)/Vercel(prod) → 코드는 `process.env.X` 참조만. Cowork는 값 취급 불가. **Vercel `NEXT_PUBLIC_*` 늦게 추가 시 빌드캐시 끄고 재배포**(안 그러면 미인라인).

## 8. 다크 테마 토큰 (`app/globals.css`)
- 배경 `#0A0A0A` · surface `#17181C` · border `#2A2C31` · **primary(글자)** `#E9EAEC` · **strong(배경전용)** `#2C303A` · muted `#9CA3AF`(AAA) · **accent/민트** `#2DD4BF` · 헤더/티커 바 `#0E1116`. (⛔ 옛 문서의 라이트색 `#0F1E3D`/`#D4AF37`는 폐기 — 참고하지 말 것.)

## 9. 폴더
`app/`(라우트·API) · `components/` · `lib/`(파이프라인·유틸·API) · `stores/`(Zustand) · `i18n/`·`messages/`(next-intl) · `data/`(시드 심볼·로고 도메인) · `supabase/`(마이그레이션) · `scripts/`(백테스트·enrich·시드) · `public/` · `types/` · `docs/` · `research/`.

**핵심 파일 맵**:
- 홈/게이트웨이: `app/page.tsx`(`CATEGORY_LABELS`·`force-dynamic`) · `components/toolbox/ToolboxClient.tsx`(`TAB_ORDER`·국가가드·피드맵)
- 종목보드: `components/toolbox/{MarketBoard,UsMarketBoard,JpMarketBoard,CnMarketBoard,VnMarketBoard,GbMarketBoard}.tsx` + 공유 `LensPreview.tsx`·`BoardTopLensCard.tsx`
- 종목상세: `app/[locale]/stock/[symbol]/page.tsx` → `StockLensClient.tsx`(+`EtfLensClient.tsx`) · 이름 `lib/stockName.ts`
- 렌즈 엔진: `lib/lensCompute.ts`·`lib/lenses.ts`·`lib/lensCopy.ts`(이중언어) · 선계산 `lib/lensPrecompute.ts`
- 파이프라인: `lib/{krSnapshot,usPerf,jpPerf,cnPerf,vnPerf,gbPerf,krEtpSnapshot}.ts`
- 관심목록/기타: `components/favorites/WatchlistClient.tsx` · 유사투자자문 `components/toolbox/AdvisorDirectory.tsx` · 헤더 `components/layout/Header.tsx`
- i18n: `i18n/{routing,navigation,request}.ts` · `messages/{ko,en}.json` · `lib/authRedirect.ts`(OAuth 로케일 쿠키)

## 10. 🐞 함정 (반복 확인 · 상세 = LENS_DEV_PLAYBOOK / COUNTRY_TAB_PLAYBOOK)
- **Turbopack**: API 라우트·서버 컴포넌트 변경 자동갱신 안 함 → `pkill -f "next dev"; rm -rf .next && npm run dev`. (클라 컴포넌트는 HMR 즉시.)
- **`[locale]` 캐시**: 페이지에 캐시 지시자 없으면 무한 정적 캐시로 굳음 → `force-dynamic`(클라 컴포넌트는 서버 `layout.tsx` 래퍼로 강제).
- **`Promise.all` 하나 실패 = 전체 reject** → 부분 허용은 심볼별 `try/catch` 격리(+`_lastGood` fallback). (지수 티커 소실 원인.)
- **PostgREST 기본 1000행 캡** → 전종목 처리 시 `.range(from, from+999)` 페이지네이션(안 하면 조용히 누락 · name_en 버그 원인).
- **PostgREST `.in()` 대량 심볼 = URL 길이 초과 400인데 조용히 실패**(`data:null`·2,000개부터 실측 실패) → **1,000개 청크**로 나눠 호출(STEP 757 · 6개 리스트 라우트 적용).
- **클라 빈 응답 무비판 반영 금지** — 데이터 있을 때만 갱신 + 재시도.
- **Supabase CLI가 옛 프로젝트에 링크됨**(§2) → CLI DB 명령 금지.
- **시간 예산 가드는 '새 작업 픽'만 막는다** — 진행 중 await는 못 끊음 → hang 콜 하나가 레인을 잠가 하드리밋행. **모든 외부 콜에 개별 타임아웃 필수**(AbortSignal/withTimeout · STEP 750b).
- **크론이 죽어도 화면은 안 깨진다**(스냅샷 서빙) → 조용히 낡음. 감시 = `health` 크론(§4) + 배포 반영 확인은 라이브 sentry-release 대조(캐시버스터).

## 11. 참조 (상세 문서)
- 국가탭 표준틀·DoD = `COUNTRY_TAB_PLAYBOOK.md` · 렌즈 개발·교훈 로그 = `LENS_DEV_PLAYBOOK.md` · 데이터소스 런북 = `LOCALE_SOURCE_PLAYBOOK.md` · 수익화 = `AD_MONETIZATION_PLAYBOOK.md` · 로드맵 = `ROADMAP.md` · 브랜드 = `BRAND_IDENTITY.md` · 문서 카탈로그 = `INDEX.md`.
