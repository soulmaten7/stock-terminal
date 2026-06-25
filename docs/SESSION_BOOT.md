<!-- 2026-06-25 -->
# Trillion(트릴리언) — 새 세션 부트(BOOT) 파일 🚀

> 🟢 **2026-06-25 (최신) · 완성도 패스 STEP 395~402 + 데이터/인프라 (HEAD `52ebd5f`) — 배포 ✓ onetrillion.app 라이브 — 최신은 이 배너.**
> **한 줄: 흩어진 디테일을 메우는 완성도 패스 8개 STEP(전종목 수익률·country-aware·신선도 가드·P2 묶음) + 배당 복원 + US 링크허브 + 인프라(Supabase 전용 이전·도메인 연결). onetrillion.app 라이브.**
> - **🆕 배포 = `https://onetrillion.app` 라이브** (도메인 연결 완료 — DNS 라이브, 이메일 MX 보존, SSL 자동). 이전 `stock-terminal-delta.vercel.app`도 유효.
> - **🆕 DB = NEW 전용 프로젝트 `ccbwxcszdoyjxvckedfp`("Trillion", ap-northeast-2 서울).** (구 `qxkmwlkchyxfzxbonhtj`/"OT-Marketing"=폐기 예정. POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.)
> - **🆕 최신 STEP = 402.** 커밋: STEP 395~401 = `e21f2cc`, STEP 397~402 최종 = **`52ebd5f`** → onetrillion.app 반영 완료.
> - **완성도 패스(395~402)**: **395 KR 전종목 기간 수익률** — 신규 `app/api/krx/kr-performance/route.ts`(KRX `bydd_trd` 기준일 + 5개 과거날짜 오프셋 7/30/91/182/365일, 휴장일 백워크), `MarketBoard`가 symbol로 r1w~r1y 병합 → **커버 종목 46 → 2,768**(긴 기간 "—" 대폭 해소) / **396 country-aware 탭**(`ToolboxClient` US 선택 시 KR 전용 탭[종목·상품/유튜브/리딩방·검증] 숨김) / **397(P0)** privacy 대표·연락처(장은태 / contact@onetrillion.app)·about 한자 雲從 제거·Header 코인 메뉴 제거(주식만) / **398 no-op(false positive)** — Next 16은 `middleware.ts` 대신 `proxy.ts`를 쓰고 세션 갱신 이미 동작 중(교훈: audit 발견은 코드로 검증 후 STEP화) / **399** 거시경제 "YYYY.MM 기준" 표시(`MacroFeed` `fmtDate`, 신선도 신뢰) / **400** 유튜브 주간 갱신 수집<30이면 throw+기존 보존(`lib/youtube.ts`, 빈 테이블 사고 방지) / **401** 공모주 피드 빈결과·에러 5분 캐시(`app/api/ipo/feed`) / **402(P2 묶음)** 푸터 "주식·상품"(`/`) 링크·마이페이지 닉네임 저장 인라인 피드백·`RoomFavoritesClient` 비로그인 카드 분기 통일.
> - **데이터/인프라(MCP·git 아님)**: **배당 복원** NEW `dividends` 0건 → OLD(`qxkmwlkchyxfzxbonhtj`)에서 top-60 고배당+참조 27종목 복사(공유 DB라 즉시 반영, JB금융지주 9.9%·HD현대 9.61%, `exDate` NULL→"—") · **US 링크허브** 67개/10카테고리(`docs/US_LINK_HUB_CURATION.md`, 2차 레드팀 검수 dead URL 제거) · **Supabase 전용 이전**(OLD→NEW "Trillion") + **onetrillion.app 도메인 연결**.
> - **▶ 다음 후보(보류)**: ① KR 링크 큐레이션 품질 재점검(US 67개처럼 정밀 검수) · ② advisors 검색+플랫폼 동시 필터(`app/api/advisors/route.ts` `else if`라 검색 시 플랫폼 무시 — `AdvisorDirectory` UI가 의도적 either/or[플랫폼 클릭=검색 해제, `!searching` 게이트]라 합치려면 UI 재설계 필요 → 보류) · ③ 뉴스 og:image 스크래핑 경량화(6→3)+빈 fallback · ④ admin 페이지네이션(현 limit 300) · ⑤ 토론/평가 첫 콘텐츠 시딩 · ⑥ 전체 i18n(현 UI 한국어 유지, 추후 언어권별 세팅) · ⑦ "리포트/차트" 탭 라벨-콘텐츠 불일치 정리.
>
> ⬇️ **(아래 🟢 STEP 394 배너는 직전 작업 상태.)**

> 🟢 **2026-06-24 · Supabase 전용 프로젝트 이전 + 배포 + 구글 로그인 LIVE (STEP 394, HEAD `e6afa23`, 빌드 ✓) — 직전 작업 상태.**
> **한 줄: Trillion 데이터를 전용 Supabase로 이사 → Vercel 배포 → 구글 로그인 작동. 새 세션은 아래 식별자부터 외울 것.**
> - **🆕 Supabase = 신규 전용 프로젝트 `ccbwxcszdoyjxvckedfp`("Trillion", ap-northeast-2 서울).** (구 `qxkmwlkchyxfzxbonhtj`/"OT-Marketing"=타 데이터와 섞여 있어 폐기 예정. POTAL ref `zyurflkhiregundhisky`는 여전히 절대 금지.)
> - **🆕 배포 URL = `https://stock-terminal-delta.vercel.app`** (env 5개 새 프로젝트값 교체, SERVICE_ROLE_KEY는 새 형식 `sb_secret_...`=supabase-js 2.101 정식 지원).
> - **🆕 구글 로그인 = LIVE.** Google OAuth 새 콜백 `https://ccbwxcszdoyjxvckedfp.supabase.co/auth/v1/callback` 추가 + Supabase Auth Google 활성화 + Site URL `stock-terminal-delta.vercel.app`. (첫 실패 "Unable to exchange external code"=Client Secret 불일치 → 구글에서 secret 새로 발급해 해결.)
> - **인프라 작업(Cowork MCP 직접)**: pg_dump 직결 차단(IPv6·풀러) → **Supabase MCP introspection으로 완전판 스키마 재구성** 후 NEW에 마이그레이션 5개 적용(`trillion_01_tables`→`02_fk_and_indexes`→`03_rls_policies`→`04_functions_triggers`→`05_views`). 결과 **37테이블+뷰2(advisor_directory·stock_snapshot_v)+함수9+트리거7(회원가입 on_auth_user_created→handle_new_user 포함)+FK34+RLS정책61, RLS 구멍 0**(OLD의 무방비 banner_clicks·chat_reports 제거로 더 안전). 데이터 link_hub100·products10·youtube100 MCP 복사(행수·URL 검증), fss_advisors는 크론 재적재 **1,804건**. 시드더미·테스트행은 의도 제외. 문서 `docs/SUPABASE_MIGRATION.md`·`SUPABASE_MIGRATION_HANDOFF.md`.
> - **STEP 393(`64003e1`)** 로그인 후 죽은 `/kr`→홈(`/`) 리다이렉트 수정(`app/auth/callback/route.ts` `next` 기본값·`app/auth/login/page.tsx` 링크). **STEP 394(`e6afa23`)** 종목 검색박스를 `주식 ETF ETN 리츠` 하위탭과 **같은 줄 우측**으로 이동(`MarketBoard.tsx`, 모바일 w-32/sm+ w-48).
> - **⚠️ 남은 선택**: ① DATABASE_URL 구값(앱 런타임 미사용·무해, `lib/supabase/admin.ts`가 SERVICE_ROLE_KEY만 씀 — 로컬 DB작업 시에만 교체) · ② `middleware.ts` 없음(현재 로그인 정상이나 토큰 만료~1h 후 SSR 세션 갱신 안정성 위해 추후 복구 권장, 필수 아님) · ③ OLD "OT-Marketing"은 며칠 안정 후 정리 판단.
> **▶ 다음 1순위: onetrillion.app 도메인 연결** — 가비아 DNS A/CNAME(이메일 MX 유지) + Vercel 도메인 추가 + Supabase Site URL·구글 OAuth를 onetrillion.app로 갱신(또는 병행).
>
> ⬇️ **(아래 🟢 STEP 392 배너는 직전 작업 상태.)**

> 🟢 **2026-06-24 · 현재 상태 (STEP 392, HEAD `8424e9b`, 빌드 ✓) — 직전 코드 상태.**
> **이번 세션(370~392) = 코드 헬스 → 캐시 → UX → 모바일 반응형 → 종목·상품 고도화(관심종목·페이지네이션·검색·증권사 시트) → 종목 표 마무리 + 전면 코드 감사·정리.**
> - **코드 헬스(370·372)**: 죽은 legacy 라우트 11+컴포넌트 27(370) + 죽은 API 라우트 ~55(372) 삭제(빌드 페이지 144→28, 크론·활성 보존). **371** 지수 티커 영어화.
> - **속도(373·374)**: 탭 데이터 **클라이언트 캐시(stale-while-revalidate, `lib/clientCache.ts`)** + 피드 스켈레톤 → 모든 탭(피드·종목표·리딩방) **재방문 즉시**. 컴포넌트만(새 라우트 아님).
> - **UX 디테일(375)**: 리딩방 미리보기 ⭐ + 링크행 "바로가기🔗" 항상표시(ListRow 한 곳=증권사·뉴스·유튜브 전부) + 유튜브 "N월 N주차 기준"(week_label) + 마이페이지 즐겨찾기 카테고리 섹션 + 푸터 카카오톡 제거.
> - **즐겨찾기 일원화(376)**: 마이페이지 '내 즐겨찾기' 탭 **제거** → 헤더 ⭐ → `/favorites` 단일(중복 해소). 마이페이지 = 프로필+내신고.
> - **📱 모바일 반응형(377~381·385)**: 페이지 패딩 `px-4 sm:px-6`·푸터·게이트웨이(377) / **MarketBoard 표** 모바일 = 기간 6컬럼→**드롭다운 1칸**(381, select 1일~1년) + `#`간격 축소 + min-w 320 / 증권사 바로가기 모바일 **표 아래** 노출(379) / 터치타깃(380) / 종목 클릭 → **증권사 바로가기 시트(모바일 전용 `lg:hidden`)**(385). 마스터 `docs/MOBILE_BUILD_PLAN.md` · 아침 체크리스트 `docs/MOBILE_MORNING_CHECKLIST.md`. ⚠️ 이 환경 Chrome **마우스 CDP 멈춤·resize 미반영** → 검증은 **JavaScript 실행**으로(클릭·API). 실측은 사용자 폰.
> - **⭐ 관심종목 watchlist(382)**: 기존 **`watchlist` 테이블 재사용**(구 죽은코드 잔재) + **`name_ko TEXT` 컬럼을 Cowork이 Supabase MCP로 추가**(RLS·정책 "Users can manage own watchlist" 기존). `/api/watchlist` GET/POST(upsert onConflict user_id,symbol,market) + MarketBoard 행 **맨 오른쪽 ⭐**(stopPropagation) + `/favorites` 관심종목 섹션(`WatchlistClient`). **JS 종단검증 OK**(별→DB저장→/favorites표시→해제).
> - **전체 종목+검색(383)**: KRX ranking cap **200→3000**, MarketBoard 전 종목(~2,600) 로드 → **50/페이지**(이전/다음, 행번호 절대순위 `page*50+i+1`) + **검색**(종목명·코드 전 종목 필터). ⚠️ **현재가·1일=전 종목(KRX), 1주~1년=야후 UNIVERSE 45개만**("—") → 긴 기간 확장은 후속(야후 on-demand/UNIVERSE 확대).
> - **🔑 워크플로우 메모**: STEP 382~385는 **Claude Code(Sonnet)가 자율 작성** → Cowork이 **검토·교정**(별 위치 좌→우, 행번호 절대순위, DB컬럼 추가, 시트 내용 정보링크→증권사). 자율작성은 빠르나 **돌리기 전 Cowork 검토** 권장.
> - **📐 종목 표 마무리(386·392)**: `table-fixed`+칸별 고정폭(정렬·데이터 변해도 컬럼 위치 고정) + **숫자 페이지네이션**(`← 1 2 3 … 52 →`, 리딩방 `pageNumbers()`와 통일). 392: 잘린 종목명 **데스크탑 hover 툴팁 + 모바일 시트 풀네임** + toggleWatch 실패 revert.
> - **🔍 전면 코드 감사·정리(387~391, 3-에이전트 감사)**: **🔴보안 387** 미사용·무인증 `rooms/[id]/verify`(admin 클라 RLS 우회) 삭제 · **🧹388** 죽은 코드 27파일 삭제(미사용 스토어7·컴포넌트7[TopNav·TickerBar 등]·lib8·타입4 + `/api/likes`; `lib/watchlist.ts`=없는 테이블 `watchlists` 조회한 깨진 코드) · **389** 국가 상태 `useCountryStore`로 통합+persist(헤더 플래그↔게이트웨이 동기화) · **390** 등락 색 토큰화(`unjong-up`#F04452/`unjong-down`#3182F6) · **391** non-null 방어·관심종목 effect 가드·로그아웃 캐시 클리어. ⚠️ **감사 오탐 보존**: etf/etn/reit-performance 라우트·room_likes 테이블은 **사용 중**(동적 fetch라 grep 오탐).
> **▶ 다음(사용자 지정 순서)**: ① 모바일 실측 미세조정(`MOBILE_MORNING_CHECKLIST.md`) → ② 모바일 마무리 → ③ **배포(Vercel·onetrillion.app)** → ④ 앱스토어. (긴 기간 데이터 확장·카카오 로그인·i18n은 별도 후속.)
>
> ⬇️ **(아래 🔵 369 배너는 직전 작업.)**

> 🔵 **2026-06-23 · (직전) STEP 369, HEAD `bb04a13`, 빌드 ✓.**
> **출시 로지스틱스 확정**: 도메인 **onetrillion.app**(가비아·.app HTTPS강제) · 이메일 **contact@onetrillion.app**(구글 워크스페이스 Business Starter, 가비아 DNS TXT+MX `1 smtp.google.com.` 검증완료) · 로고 **T 모노그램**(미드나잇#0E1116+민트#2DD4BF, 파비콘·앱아이콘·OG·헤더 적용 STEP369, 프롬프트 `docs/LOGO_PROMPT.md`). ⚠️ **아직 미배포(로컬만)** — 배포는 모든 작업 후 한 번에(Vercel). 사이트주소=`https://onetrillion.app`(metadataBase). 사업자: 원트릴리언·210-39-33812·대표 **장은태**·**제주 서귀포시 동문로 55 2층**.
> **364~369**: 364 파비콘·OG·metadataBase / 365 푸터 이메일 / 366 robots(+admin·mypage·auth 색인차단)·sitemap·404 / 367 푸터 사업자표시 / **368 종목·상품 랜딩 안정화(거래대금순 기본+스켈레톤 — 빈 컬럼"—"·느린 첫인상 해소)** / 369 T모노그램 로고.
> **▶ 다음(사용자 지정 순서)**: ① 사용자가 본 PC 문제 정리→수정 → ② 모바일 반응형 완성 → ③ 플레이스토어·앱스토어 등록(연결제 준비됨, 웹앱 래핑 필요). robots/sitemap·SPF/DKIM은 배포 직전.
>
> ⬇️ **(아래 🔵 346~360 배너는 직전 작업.)**

> 🔵 **(직전) 2026-06-23 · STEP 360까지 (HEAD `7e1d7d3`)**
> **브랜드 = Trillion / 트릴리언**(구 운종/UNJONG · 리브랜드 351). 사업자명 **원트릴리언**, 사업자번호 **210-39-33812**(`docs/LAUNCH_INFO.md`). 포지셔닝 = **"흩어진 금융정보를 한눈에"**(정보 허브). ⚠️ 아래 §1 '운종 정체성'은 이 배너로 갱신됨(브랜드·포지셔닝 우선).
> **이번 세션(346~360) 한 것:**
> - **디자인(352~353)**: **미드나잇 `#0E1116` + 민트 `#2DD4BF`** — 헤더·푸터·지수티커 다크화. 토큰 `--color-accent:#2DD4BF`. 코드 식별자 `unjong-*`·DB명은 대소문자 달라 **유지(안전)**.
> - **즐겨찾기 일원화(348~350·357)**: 헤더 알림→**즐겨찾기**, `/favorites`(HTML5 드래그 순서)+리딩방 즐겨찾기(`room_favorites`). 357 링크 즐겨찾기(`LinkCard`)도 비로그인 별 노출+클릭시 로그인 유도. 서버 전 동작 `401`+RLS.
> - **모바일(354~355)**: `body{min-width:1280px}` **제거**(데스크톱 강제폭 = 모바일 가로스크롤 주범) + 게이트웨이 피드 스택 + 헤더 작은폰 넘침 해소 + 푸터 패딩. 활성 surface 전수 점검 = **이미 반응형**(피드 카드형·표 overflow·리딩방 하단시트). 비반응형 그리드는 legacy 미라우팅. ⚠️ **이 환경 Chrome resize_window는 렌더 뷰포트 미반영**(`innerWidth` 1920 고정) → 모바일 실측은 **사용자 폰**으로.
> - **🔴 리딩방 신뢰 재정비 — 평가 구축→철회→관심순(356~360, 핵심 결정)**: 356 별점·후기(`room_reviews`)+358 신고·관리자숨김 구축·검증했으나 → **사용자 결정**: 리딩방은 텔레그램·카톡 **off-platform = 이용 증빙 불가** → 거짓·악의 리뷰 못 막고 **명예훼손 리스크** → "안 속는 곳"과 충돌. **359 별점·후기·좋아요(♥) 전부 제거 → 즐겨찾기로 일원화.** **360 정렬 = 관심(누적 즐겨찾기)순 기본 + 가나다↑↓**(뷰 `advisor_directory.favorite_count`, `/api/advisors sort=interest`, 행에 관심 수·토글 ±1). 리딩방 = **사실(금감원 등록·신고) + 즐겨찾기 + 바로가기**만.
> - **DB(MCP 직접, git 아님)**: `room_reviews`·`room_review_reports` 테이블 **생성 후 dormant 보존**(앱 미사용·되살리기용) · `advisor_directory` 뷰 **`favorite_count`** 추가(room_favorites 집계, 카운트만 노출) · `room_favorites` position · `room_likes` dormant.
> - **🔑 교훈 유지**: Turbopack은 **API 라우트 변경/삭제를 자동 갱신 안 함** → `pkill -f "next dev"; rm -rf .next; npm run dev` 클린 재시작 필수. 컴포넌트만 = HMR.
> - **▶ 다음 후보(보류·사용자 결정)**: 마이페이지 '내 즐겨찾기' 정비 · 모바일 폰 실측 정밀 · 출시 전 데이터 정리(데모행 sub:1·dormant 테이블·키 rotate) · 이메일/도메인(trillion.* 변형) · 푸터 대표자·주소 채우기 · 언어 i18n(한국판 완성 후).
>
> ⬇️ **(아래 🔴 배너는 이전 이력 — STEP 312~345.)**

> 🔴 **2026-06-22 · 게이트웨이 완성 — 카테고리 탭에 우측 실시간 피드 8종.** 운종 = **검증된 중립 관문(게이트웨이) + 리딩방 검증.** **새 세션은 `docs/PRODUCT_SPEC_V7.md`를 먼저 읽을 것.**
>
> **마지막 코드 = STEP 345 (`c0b3035`), 빌드 ✓.**
> **이번 세션(312~345) 완성한 것:**
> - **종목·상품 탭(게이트웨이 첫 탭)**: 멀티컬럼 수익률 정렬표(주식/ETF/ETN/리츠 하위탭, 현재가·1일~1년, 기간 헤더 클릭 정렬) + 우측 증권사 거래대금 순위(`MarketBoard`·`BrokerRanking`). (323~331, 레이아웃 다회 조정)
> - **🟢 우측 피드 8종** — 각 카테고리 탭 우측에 실시간 콘텐츠:
>   - **뉴스**(334~336): 네이버 뉴스 검색 API, 최신 20개, **대표 기사 og:image**(헤더 위장+네이버 폴백+referrerPolicy), 탭 새로고침 유지(localStorage), `?debug=1`. `/api/news/feed`·`NewsFeed.tsx`.
>   - **공시·신용**(337): 금감원 **DART** API 상장사 최신 전자공시 20건. `/api/dart/feed`·`DartFeed.tsx`.
>   - **거시경제**(338~339): 한국은행 **ECOS 100대 지표** + 미국 **FRED**, 한국/미국 토글 박스. `/api/macro/summary`·`MacroFeed.tsx`.
>   - **기업재무·리포트·ETF**(340): NewsFeed 일반화(`?q=` 쿼리별 캐시) 주제별 뉴스.
>   - **배당**(341): Supabase `dividends` 고배당 TOP20. `/api/dividend/feed`·`DividendFeed.tsx`.
>   - **공모주**(342~345): **38커뮤니케이션 청약일정 스크래핑**(EUC-KR) + 공모주/배당 토글(`OfferingsFeed`). `/api/ipo/feed`·`IpoFeed.tsx`.
> - **🔴 로그인 데드락 해소**(319): `onAuthStateChange` 콜백 안 `await supabase.from()` = auth 락 데드락 → 로그인 상태가 화면에 안 뜸. **콜백 동기 유지 + DB조회 setTimeout(0) 분리**(`AuthProvider.tsx`). **되돌리지 말 것.**
> - **법정 페이지**(322): `/privacy`·`/terms`·`/about` + 푸터 V7 정리. **관리자**(312) 헤더 '관리자' 링크 + **신고 모더레이션**(315~317: 로그인필수·중복방지·대기→검토후공개·admin 확인/기각·마이페이지 '내 신고'+철회). **게이트웨이 정리**(332~333): 증권사 탭 흡수+중복 헤더 제거.
> - **🔑 교훈 — Turbopack이 API 라우트 변경을 자동 갱신 안 함**: dev 서버가 옛 라우트 모듈+모듈레벨 캐시를 물고 안 바뀜(피드 빈값/옛값의 단골 원인). `lsof kill`만으론 옛 서버가 안 죽기도 함 → **`pkill -f "next dev" && rm -rf .next && npm run dev`** 클린 재시작이 확실한 cure. 코드/키는 가정 말고 **MCP(Chrome)·`?debug=1`로 검증**(ECOS placeholder 키도 그렇게 발견).
>
> *(이전 세션 272~311 = V7 대전환·게이트웨이 13탭·유튜브 Top100·리딩방 검증 1,738건·카카오/구글 로그인·자가등록·관리자 `/admin`. 상세 = `docs/CHANGELOG.md`.)*
> **▶ 다음 후보**(보류·사용자 결정):
> - **IPO 안정화**: 38 청약일정을 **cron으로 DB 적재** → UI는 DB 읽기(라이브 스크랩 실패 리스크 제거).
> - **52주 저가 우량주 패널**: `/api/db/52w-lows` 실데이터 있음(삼바·셀트리온·NAVER·기아·KB금융) → '주목 종목' 패널 후보.
> - **본인확인**(휴대폰 실명인증, **사업자등록 후 유료** ~40원/건) → 자가등록 ✅금감원등록확인(대표명==인증자명)의 전제.
> - **모바일 반응형**(현재 데스크톱 폭) · **업체명(운종) 변경 검토 중**(확정 전 사업자등록·도메인·이메일·푸터 법정보 보류 — 기능은 이름 무관 진행 가능). 푸터 V7·개인정보처리방침은 322에서 **완료**.
> ⚠️ **보안**: 유튜브 API키·구글 Client Secret이 스크린샷으로 노출됨 → rotate 권장(미실행). 사용자가 API키 제한은 보류 결정.
> ⚠️ **DB 직접변경(git 아님)**: youtube_channels·room_reports·room_likes·**room_submissions** 테이블, **advisor_directory 뷰(fss∪submissions UNION, platform·info_name·source·intro·valid_to필터)**, link_hub +8. fss_advisors는 기존(매일 크론). **soulmaten7 = role 'admin'**.
> ⚠️ **테스트/데모 데이터 정리 필요(출시 전)**: room_reports 테스트신고('LW주식공부'), room_submissions 데모행('운종 데모 리딩방(테스트)', sub:1).
> ⚠️ 아래 §3~§8은 **V6/STEP271 히스토리(무효 많음)**. 워크플로우(§2)·env(§6)·명령어(§7)는 유효.

---

## ⏱️ 0. 새 세션을 시작하는 법 (복붙 3단계)

1. **Cowork 새 대화**를 연다.
2. 첫 메시지로 아래 한 줄을 붙여넣는다:
   > 운종 프로젝트 이어서 할게. `docs/SESSION_BOOT.md` 읽고 현재 상태·작업 방식 파악한 뒤 오늘 할 일 P0를 제안해줘.
3. Cowork가 이 파일(+필요시 PLAYBOOK)을 읽고 상태를 요약 → 오늘 할 일을 제안 → 결정되면 **STEP 명령서**를 만들어 준다. 너는 그걸 **Claude Code 터미널**에 붙여넣어 실행한다.

> 💡 멈춤(freeze)·"모델 사용 불가" 같은 게 뜨면 새 세션 시작이 제일 빠르다. 코드·문서는 git에 있으니 안전하다.

---

## 🧭 1. 운종이 뭐냐 (정체성 — LOCK, 안 바뀜)

> **운종 = "투자상품에 속지 않게 돕는 곳"** — 정확한 정보 + 솔직한 토론 + 검증된 신뢰. **중심축 = 신뢰.**

- 구조 = 네이버 증권 레이아웃 + 토스 증권 카드 + Trustpilot 평가 모델. 마스터 비전 = `docs/PRODUCT_SPEC_V6.md`.
- **거래 X** (증권사 라이선스 없음 — 정보·대화·허브·신뢰만), **영어판 X**, **코인 X**, **정밀 스크리너 X**, **별점 X**(추천/비추천+신고로 대체).
- 한자 雲從 코드 표기 X — **UNJONG + 운종 한글만**.
- **수익 모델**: MVP 1.0(정보+채팅·토론) → **MVP 2.0(상품·리딩방 평가 디렉토리 = 진짜 차별화)** → Tier 인증 광고(추후, Sponsored↔평가 분리). **광고는 사용자가 지시할 때만.**

---

## 🤝 2. 작업 방식 (가장 중요 — 절대 혼용 금지)

| 역할 | 누구 | 하는 일 |
|------|------|---------|
| **두뇌** | **Cowork (이 챗)** | 대화로 무엇을 만들지 결정, 리서치, 설계, 문서 갱신, **STEP 명령서 작성**. **실행은 안 함.** |
| **손** | **Claude Code (터미널 CLI)** | Cowork가 만든 명령서/코드를 **실제로 실행** — 파일 수정·`npm run build`·git commit/push. |

- 흐름: ① 사용자가 Cowork에 원하는 것 말함 → ② Cowork가 STEP 명령서 작성 → ③ 사용자가 Claude Code에 붙여넣어 실행 → ④ 결과를 Cowork에 공유 → 다음 단계.
- **Claude Code 실행 명령** (기본 = Sonnet, 빠르고 저렴):
  ```bash
  cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
  ```
  그다음 터미널에: `@docs/STEP_N_COMMAND.md 파일 내용대로 실행해줘`
- **Opus는 Cowork가 🔴 표시한 경우만** (원인불명 디버깅·대형 리팩토링): `--model opus`
- 명령서 전달: 3단계+/빌드+커밋 포함 → **파일 방식**(`docs/STEP_N_COMMAND.md`). 1~2파일·디버깅 → **인라인**.
- 사용자는 **코딩 초보자** → 기술 설명 간결하게, 명령어는 복붙 가능하게.

---

## 📍 3. (⚠️ 과거 이력 — 현재 상태는 맨 위 배너 STEP 345 기준) STEP 271 시점

- **(과거 시점) 당시 마지막 코드 = STEP 271 (`8670ba2`).** *(⚠️ 현재는 STEP 345 `c0b3035` — 맨 위 배너 기준.)*
- **이번 세션(265~271)** = 사용자 클릭 QA로 발견한 UX·버그 정리 + **종목 상세 점검**:
  - 265~266 헤더 홈/로고 클릭 시 홈 **완전 리셋**(주식·국내·전체·1일, zustand 리셋 카운터+리마운트) + avatarBg 크래시 가드.
  - 267~270 랭킹 표 UI 통일(순위 줄바꿈·ETF/ETN/리츠 ♡ 추가·종목명 `w-full`로 현재가·대비 우측 고정·미리보기 **hover→행 클릭**).
  - 271 종목 상세 **미국 차트** yahoo 연결(placeholder 제거).
- **종목 상세 점검 결론**: 주식·ETF·ETN·리츠·미국 **5종 전부 정상**. (미국 호가·체결은 국내전용 KIS라 카드 미표시 = 정상 / 미국 정보패널은 `/api/yahoo/quote-detail`로 동작.)
- **데이터 현황**: 주식·ETF·ETN·리츠·미국 = 기간 수익률(1일~1년) ✅. **펀드 = 제거**(무료 수익률 소스 없음 = 유료 데이터 영역).

---

## 🗺️ 4. 페이지·아키텍처

**홈(`/`)** = 지수 티커 → **랭킹 탭** 5개: `stock`(주식)·`etf`·`etn`·`reit`(리츠) ｜ `room`(리딩방 리스트). 탭은 URL `?tab=`로 새로고침 유지. 행 **클릭** 시 우측 미리보기 표시(hover 아님), 미리보기 안 '종목 상세·토론 보기 →'로 상세 이동. 우측 레일 = 실시간채팅 + 관심종목(♡).

**페이지 라우트**:

| 라우트 | 역할 |
|--------|------|
| `/` | 포털형 홈 (`components/home-v6/HomeClientV6`) |
| `/market` | **상품 리스트 = 전 타입 통합 디렉토리**(주식·ETF·리츠·미국·ETN 한 표에서 같은 기간 수익률로 비교, `MarketDirectoryClient`) |
| `/stock/[code]` | 종목 상세 — 좌 `StockInfoPanel`+증권사링크 / 중 탭5(차트·시세/토론/뉴스/공시/인사이트) / 우 실시간채팅. 국내=KIS, 미국=yahoo |
| `/toolbox` | 주식 관련 링크모음(증권사 거래대금 순위 + 카테고리 링크) |
| `/rooms`·`/room/[id]` | 리딩방·채널 디렉토리/평가 |
| `/products`·`/product/[id]` | 상품 디렉토리/평가 |
| `/discussion`·`/news`·`/calendar`·`/global`·`/mypage`·`/auth/login` | 토론·뉴스·캘린더(외부링크)·글로벌·마이·로그인 |
| `/(windows)/kr`·`/us` | (레거시 — `/market`으로 리다이렉트) |

**헤더 메뉴** = 홈 · 상품 리스트(`/market`) · 주식 관련 링크모음(`/toolbox`).

---

## 🔌 5. 데이터 소스 / 주요 API 라우트 (`app/api/...`)

- **KRX 공식 OpenAPI** (`data-dbg.krx.co.kr`, `AUTH_KEY` 헤더, env `KRX_API_KEY`): 국내 랭킹 100·일별.
  - `krx/ranking`(주식 100, 5분 캐시) · `krx/etn`(ETN 1일, 엔드포인트 `/etp/etn_bydd_trd`) · `krx/etn-performance`(ETN 기간 수익률 — 6개 날짜 종가 비교)
- **Yahoo** (`yahoo-finance2`): `yahoo/chart`(차트 일봉) · `yahoo/kr|etf|reit|us-performance`(기간 수익률) · `yahoo/quote-detail`(미국 종목 상세) · `yahoo/indices`·`m7`·`us-movers` 등
- **KIS (국내 전용)**: `kis/price`·`chart`·`orderbook`·`execution`·`investor`·`market-cap` 등 — **미국 종목엔 안 씀**(미국은 yahoo).
- **DART**(국내 공시)·**SEC**(미국 공시)·**RSS 뉴스**(`news/*`)·**ECOS/FRED**(거시).
- **Supabase**: 채팅·토론·평가·관심종목·FSS 신고 원장(1,738건 적재).

---

## 🔐 6. 환경변수 · 보안 (절대 규칙)

- `.env.local` **변수 이름만** (값은 절대 채팅/문서에 평문으로 X): `KRX_API_KEY`, `KIS_APP_KEY`/`KIS_APP_SECRET`/`KIS_*`, `DART_API_KEY`, `SEC_USER_AGENT`, `ECOS_API_KEY`/`FRED_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF`/`DATABASE_URL`, `NEXT_PUBLIC_LOGODEV_TOKEN`, `OPENAI_API_KEY`, `KAKAO_CLIENT_ID`/`KAKAO_CLIENT_SECRET`, `DATA_GO_KR_KEY`, `TOSS_*`.
- **`.env.local` 커밋 절대 금지** (현재 git 미추적 = 정상).
- **Supabase 프로젝트**: 운종 전용 ref **`qxkmwlkchyxfzxbonhtj`** (대시보드 표시명 "OT-Marketing"). ⚠️ POTAL ref **`zyurflkhiregundhisky`**는 **절대 사용 금지**(혼동 주의).
- 키 값이 화면/스크린샷에 노출되면 재발급 권장. Cowork는 키 값을 직접 다루지 않는다(이름만).

---

## 🧰 7. 자주 쓰는 명령어 (복붙용)

```bash
# 개발 서버 (포트 3333)
cd ~/stock-terminal && npm run dev

# 빌드 검증
cd ~/stock-terminal && npm run build

# Claude Code 실행 (STEP 명령서 돌릴 때)
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
#  → 그다음: @docs/STEP_N_COMMAND.md 파일 내용대로 실행해줘

# 커밋·푸시 (작업/문서 저장)
cd ~/stock-terminal && git add -A && git commit -m "메시지" && git push

# 현재 상태 확인
cd ~/stock-terminal && git log --oneline -5 && git status -sb
```

---

## ▶️ 8. 다음 할 일 후보 (전부 보류 — 사용자 결정 필요)

- **리딩방·채널 검증 빌드** — 설계 = `docs/ROOM_VERIFICATION_SPEC.md`. (전체 리스트화 + 신고 **사실** 라벨 + 신고/광고 상위·분리. 데이터 확보·구현은 **플랫폼 완성 후**.)
- **모바일 반응형** (현재 데스크톱 폭 기준).
- **카카오 OAuth 활성화** (사용자 작업) — 추천/비추천 투표 실동작 전제.
- **AI 해설 빌드 여부** — 설계 = `docs/AI_LENS_SPEC.md` (해설만, 추천·단타 X).
- `/market`에 ♡·클릭 미리보기 일관화(홈과 동일하게).
- 평가·검증 MVP 2.0 / (펀드 수익률은 유료 데이터 도입 시) / **광고는 사용자 지시 시에만.**

> ⚖️ 새 기능 판단 필터: **"이거 보려고 운종에 올 이유가 있나?"** 없으면 안 만든다. 리딩방·채널 검증이 진짜 차별점.

---

## ✅ 9. 세션 종료 체크리스트 (Cowork이 매 코드 세션마다)

1. **4개 문서 헤더 날짜를 오늘로**: `CLAUDE.md` · `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md`.
2. `CHANGELOG.md`에 이번 세션 변경 + 커밋 해시 추가.
3. `session-context.md`에 완료 블록 추가(+ TODO 가비지 컬렉션).
4. `docs/NEXT_SESSION_START.md`·`docs/NEXT_SESSION_PLAYBOOK.md`·`docs/SESSION_KICKOFF.md`·**이 BOOT 파일** 최신화(HEAD·STEP·다음 후보).
5. **교차검증**: ①6개 문서 날짜 동일 ②STEP 번호·커밋 해시 git log와 일치 ③옛 상태가 '현재'로 오인될 표기 없는지.
6. Claude Code용 `git add -A && git commit && git push` 명령 제공 → 사용자 실행.
7. 빌드 에러 없는지(`npm run build`).

---

## 📚 10. 더 깊은 문서 (필요할 때만)

| 파일 | 용도 |
|------|------|
| `docs/NEXT_SESSION_PLAYBOOK.md` | 심화 인수인계 — 디자인 시스템·페이지별 컴포넌트 매핑·STEP 이력 |
| `docs/CHANGELOG.md` | 세션별 전체 변경 이력(STEP별 커밋 해시) |
| `session-context.md` | 누적 결정사항 + STEP 블록 + TODO |
| `CLAUDE.md` | Cowork↔Claude Code 워크플로우 원본(절대 규칙) |
| `docs/PRODUCT_SPEC_V6.md` | 운종 마스터 비전(정체성 축 = "안 속는 곳") |
| `docs/ROOM_VERIFICATION_SPEC.md` | 리딩방 검증 설계(법지형 포함) |
| `docs/AI_LENS_SPEC.md` | AI 해설 설계 |

---

> **한 줄 요약**: 운종 = "안 속는 곳". Cowork=설계, Claude Code=실행. 지금 **STEP 345(`c0b3035`)** 빌드 ✓ — 게이트웨이 + 종목·상품 탭 + 우측 피드 8종(뉴스·공시·거시·기업재무·리포트·ETF·배당·공모주). 다음은 사용자가 고른다.
