<!-- 2026-07-17 -->
# Trillion(트릴리언) — Claude Code 지침서

> 🔵 **2026-06-23 리브랜드**: 운종/UNJONG → **Trillion / 트릴리언**(사업자명 원트릴리언, 사업자번호 210-39-33812). 포지셔닝 = **"흩어진 금융정보를 한눈에"**(정보 허브 · **주: 이 포지셔닝은 07-11 폐기 → 현행 "종목을 보는 눈을, 누구에게나" · §0**). 디자인 = 미드나잇 `#0E1116` + 민트 `#2DD4BF`. 코드 식별자 `unjong-*`·DB명은 대소문자 달라 **유지**. 리딩방은 미검증 평가(별점·후기·♥) 제거 → 사실(금감원 등록·신고)+관심(누적 즐겨찾기)순. 🟢 **2026-07-10 갱신**: 정체성 = 3기둥(무기 Arm·직시 See·자립 Compete·`docs/BRAND_IDENTITY.md` 재작성)·멍거 목소리(건조·인센티브·"덜 멍청하게")·엔진명 **TR-AI 렌즈**·상단 탭 **3개(종목·정보·검증)**·ETF는 **"상품 구성"** 뷰. 근간 = "예언·추천 안 함, 불을 건넨다". 🟣 **2026-07-11 갱신**: 외부 슬로건 확정 **"종목을 보는 눈을, 누구에게나."**(서브 "모든 시각을 데이터로 — 판단은 당신입니다." · 각인 = 멍거 원문 "The best thing a human being can do is to help another human being know more.") — 포지셔닝 문구 **"흩어진 금융정보를 한눈에"는 폐기**(편의 프레임·차별 실패, `docs/BRAND_IDENTITY.md` §0). OG/링크 미리보기(로고 박힌 `public/og.png` 1200×630·`app/layout.tsx` 메타·`app/page.tsx` JSON-LD) 완료. 개발 안전망(vitest 유닛 + GitHub Actions CI) 가동. 🟠 **2026-07-12 갱신**: 1·2·3차 로드맵 확정(`docs/RELEASE_ROADMAP.md`) + 렌즈 독립배선 아키텍처(STEP 700·기법당 AI 교체 자리) + KOSPI/KOSDAQ 토글·상하한 배지(701) + 1차 폴리시(702: JP TOPIX 숨김·CN 홍콩만·VN 공시→뉴스). **🔒 1차 출시 QA 관문 통과**(`4ea75a1`): RLS 4개 테이블(`kr_stock_snapshot`·`brokers`·`jp_stock_perf`·`translation_cache`) 보안 마감 — 공개 anon 키로 KR 보드 삭제·위조 가능하던 구멍을 RLS on + anon REVOKE로 봉인(`supabase/migrations/20260712_enable_rls_public_data_tables.sql`, 읽기 전부 service-role이라 앱 영향 0·라이브 검증) + 법무 정확화(구글만·개인정보 §11 권익침해 구제) + 태그라인 새 슬로건 반영(푸터·로그인·소개). CI 초록불·라이브(/api/brokers·/api/krx/ranking·/about) 검증 완료. **HEAD `4ea75a1`.** 🟢 **2026-07-12(3) 갱신**: 통신판매업신고 = **현재 비대상**(무거래 정보서비스 확정·`docs/LAUNCH_INFO.md`) + 하드닝·모니터링 마감 — DEFINER 뷰 정리(`stock_snapshot_v` invoker·`advisor_directory`는 로그아웃 방문자에 공개 리딩방 디렉토리 서빙하는 통로라 DEFINER 유지·라이브 1,553행 검증·`supabase/migrations/20260712_harden_definer_views_grants.sql`) + **미사용 `/api/ai-analysis` 제거**(비인증 OpenAI 과금 구멍·레거시) + **Vercel Analytics**·**Sentry**(@sentry/nextjs v10·서버/엣지/클라+instrumentation+전역 에러바운더리·라이브 에러 캡처 검증) 배선. 🐞 **Vercel NEXT_PUBLIC 빌드캐시 함정**: env 늦게 추가 시 캐시 재사용으로 `NEXT_PUBLIC_*` 미인라인(무동작) → **'Use existing Build Cache' 끄고 재배포**해야 해결(Sentry 무동작 원인). **HEAD `09f1174`.** 다음 = Vercel Analytics 대시보드 Enable(1클릭) + (후속) 공개 POST(inquiry·click) rate-limit(Vercel KV)·Sentry 소스맵 AUTH_TOKEN(선택). 🟢 **2026-07-14 갱신**: 유사투자자문사 정합 + 온보딩(자기설명) + /about 폭 + **🌑 다크 테마 3단계 완결**. 유사투자자문 조회 패널 제목 추가·라벨 '유사투자자문 조회'→**'유사투자자문사'**(금감원 등록업체 목록 성격)·목록 정렬 상호명 접두어((주)·㈜·(브랜드)) 무시 가나다(`/api/advisors` 전체로드→JS정렬→슬라이스·3뷰 공통)·정보 하위탭 증권사→유사투자자문사 순 + 메타 keywords 새 정체성(리딩방검증·신뢰평가허브 제거→종목분석·TR-AI렌즈·검증된투자기법). **온보딩 KR(Option A·자기설명 중심)** = 헤더 로고밑 태그라인(lg+)+상단 '소개' 링크(→/about)+LensPreview 문구 또렷("사고팔 신호 아니라 판단할 재료")+/about '이렇게 봅니다' 3스텝(**배너·팝업 없음**). /about 폭 앱 기본(max-w-7xl)에 정합. **🌑 다크 테마(라이트→다크·안 깨지게 3단계)**: (1/3 `f029d91`) 토큰화 — 배경전용 `unjong-strong` 신설·`bg-unjong-primary`→strong(글자/배경 역할분리)·`bg-white`→surface(겉모습 변화 0). (2/3 `07fc4bf`) 플립 — `app/globals.css` 토큰 값만 다크로(background #0A0A0A·surface #17181C·border #2A2C31·`color-scheme:dark`·스크롤바)·앱 전체 다크·**라이브 검증**. (3/3 `3c2fc8b`·🔴Opus) 폴리시 — 앰버 배지·게이지 fill·상태색 다크대비 + 구글 로그인버튼·StockLogo 실로고원 라이트 유지(정석)·레터아바타 이니셜 `text-unjong-strong`. 근거 = 브랜드가 미드나잇+민트·헤더 이미 다크·데이터밀도 금융툴은 다크가 정석(**개선이지 전환 아님**). **HEAD `3c2fc8b`.** 🌍 **2026-07-14(2) 갱신**: **2차 i18n(다국어) 완성** — next-intl `[locale]` 라우팅 + 영어(en) + 언어 스위처 + en→US 시장 디폴트. 문자열 이관(709~709F·`ko.json`·서버 getTranslations/클라 useTranslations·DB로 가는 값·admin·약관 의도적 제외) → **710A** 라우팅 구조(ko 단일·`as-needed`·화면 0·🐞 matcher 점(.)규칙이 종목코드 `7203.T`류 404낼 뻔→확장자 화이트리스트) → **710B** `en.json`(414키 1:1·브랜드 보이스 잠금·영어 축약형 배제로 ICU 아포스트로피 회피·`messages.test.ts` 패리티 영구테스트·`Login.brandKo`=로고라 번역금지) → **710C** 스위처+내부 링크 `@/i18n/navigation` 스왑(useSearchParams·외부링크 제외·🐞 useSearchParams는 SSG de-opt라 window.location.search로 우회) → **710D** `homeMarketFor(locale)`·`generateMetadata`/hreflang·youtube 조회수 로케일 숫자. **🅿️ OAuth 로케일은 보류**(redirectTo에 `?next=` 붙이면 Supabase 리다이렉트 허용목록 거부→로그인 죽음·파트4 롤백·쿠키 수정안 `docs/PARKED_OAUTH_LOCALE_ACTIVATION.md`). tsc 0·vitest 34/34·양쪽 로케일 전수 검증. **HEAD `14c1813`.** 🔎 **2026-07-14(3) 갱신**: **US 풀뎁스 P0 — 종목상세 영어 SEO.** US 파리티 감사(서브에이전트+DB 실측) = **US는 이미 KR 동급/더 깊음**(레퍼런스 구현·렌즈 백분위·공시 심각도·`link_hub` 139·brokers 17), 유일 실질 갭이 종목상세 영어 SEO였음 → **STEP 711**(`app/[locale]/stock/[symbol]/page.tsx` `generateMetadata`·JSON-LD locale 인지화 → `/en/stock/{sym}` 영어 title·OG `en_US`·hreflang(ko·en·x-default)·영어 breadcrumb·**ko byte 동일**·VN 분기 보존·🔑 Opus가 en은 `${name}`(서학개미 한글명) 대신 `info.en` 영문명 주로 교정=한글명 영어SEO 방지). KR 전용(갭 아님)=코스피코스닥·상하한·유사투자자문사·유튜브. **HEAD `f647b08`.** 🐛 **2026-07-14(4) 갱신**: **캐시 stale 버그 3-STEP 완결.** STEP 711 배포 확인(web_fetch) 중 발견 — **`[locale]` 페이지가 캐시 지시자 없으면 무한 정적 캐시로 굳어 배포해도 안 갈아엎어짐** → bare URL이 봇·방문자에 옛 콘텐츠 서빙(`/stock/{종목}`=옛 브랜딩, `/about`=**개편 이전 정체성**[속지 않도록·흩어진 금융정보], `/terms`·`/privacy`=**법무 정확화 전**·SEO·규제 리스크). 원인=`app/[locale]/layout.tsx` 정적렌더 자격(setRequestLocale+generateStaticParams)+페이지 지시자 누락. **712**(종목상세)·**713**(정적 8개 about·terms·privacy·toolbox·coin·favorites·feedback·advertise) `force-dynamic`·**714**(클라 3개 mypage·auth/login·admin/login은 `'use client'`라 page dynamic 무시 → **서버 `layout.tsx` 래퍼**로 강제 동적·로그인 로직 불변). 라이브 검증(/about 새 3기둥·/terms·/privacy 법무·/en). 🐞 교훈=`[locale]` 페이지 캐시 지시자 명시(`'use client'`=서버 layout 래퍼)·`npm run build`가 실행 중 dev `.next` 밟아 500→클린 재시작. **HEAD `d122cac`.** 🌐 **2026-07-14(5) 갱신**: **영어 데이터 레이어 i18n(Tier 1+2 결정론) + 브랜드 록업.** #86 감사로 `/en` 정적 UI는 영어인데 데이터/AI 레이어(렌즈명·판정·grade·브리핑·공시·h1)가 한국어인 것 발견 → 원인=(A)클라가 `&lang` 안 보냄[`lensCopy.ts` 카피는 이미 이중언어] (B)일부 하드코딩. **715**(`a393940`) 렌즈 `&lang` 배선[한 줄로 이름·판정·스펙트럼·전망 영어]+grade 이중언어 맵+h1 `info.en`+AiLensBadge lang · **716**(`36dbed9`) 8-K·F-Score·ETF 이중언어+`/api/events` lang캐시 · **717**(`a9d9ad7`) `lenses.ts` detail 키 stable화[한국어가 `L.detail['200일선대비%']` lookup 키라 key/label 분리]+DETAIL_LABELS/headline · **718**(`72d4f32`) note 6개 영어[t값·STEP번호 수치 보존]+short/long 이중언어[계산모듈 언어중립 state] · **719**(`3cb73ab`) `/en` 한글 워드마크 "트릴리언" 숨김. **KR byte 동일**(charac red-diff+live SHA 증명·vitest 43/43). 결과=`/en` 결정론 데이터 100% 영어, 남은 한국어=LLM 생성물(브리핑·공시요약)=**Tier 3**(설계 `docs/TIER3_LLM_I18N_DESIGN.md`·스키마 A `*_en` 컬럼·on-demand·720~723). 교훈=`docs/LENS_DEV_PLAYBOOK.md` #30. **HEAD `3cb73ab`.** 🎉 **2026-07-15 갱신**: **Tier 3(LLM 생성물 영어화) 완결 → `/en` 100% 영어.** 브리핑 R2·news-brief R3·공시요약 R1(6개국)을 영어화 — **720** `*_en` 컬럼 마이그(MCP·`stock_briefings.brief_en`·`news_briefs.summary_en`/`tags_en`·`filing_summaries.summary_en`) · **721** `/api/brief` · **722** `/api/news-brief`[한국어 강제 후처리 `ko` 게이팅] · **723** `/api/events/summary` US · **724** `kr/jp/cn/gb/vn-events/summary`. 캐시 **컬럼 분리**(`*_en`)로 언어 교차 오염 차단·on-demand(영어 트래픽만 과금)·KR byte 동일. 🐞 교훈(`docs/LENS_DEV_PLAYBOOK.md` #31)=additive `*_en` 컬럼만으론 로케일 독립 안 됨(`*_ko` NOT NULL이 en-first INSERT 실패경로·swallowed upsert=**조용한 유료 LLM 누수**)→`*_ko` DROP NOT NULL+upsert 에러 로깅. **결과: `/en`=로고 외 한국어 0**(정적 UI+결정론+LLM 전부 영어·US 영어 시장 제품 완성). 설계 `docs/TIER3_LLM_I18N_DESIGN.md`. **HEAD `5c0c348`.** 🟢 **2026-07-15(2) 갱신**: **US 폴리시(725·726) + OAuth 로케일 쿠키(710E) → 🎉 i18n 100% 완결.** 725(`3cef637`) 종목상세 현재가 `formatPrice` 통화기호(6개국·보드 일관) · 726(`713084c`) US 종목명 올대문자→스마트 title-case(약어 IBM·3M·camelcase JPMorgan·eBay 보존·`/[a-z]/` 가드로 mixed-case 무영향) · **710E**(`6bccc45`) **OAuth 로케일 쿠키** — `/en` 로그인이 `/en`(영어)로 복귀하도록 로케일을 **쿠키(`post_login_locale`·SameSite=Lax)로 왕복**(redirectTo/Supabase 허용목록 **byte 불손상** — 710D 로그인 사망 회피). 순수 헬퍼 `lib/authRedirect.ts`(`safeNextPath`=오픈리다이렉트 가드·`localizePath`=as-needed 프리픽스)+유닛테스트(vitest 49/49), 콜백이 쿠키 읽어 프리픽스+소비 삭제. **라이브 실측 성공**(실제 구글 로그인 `soulmaten7`·`/en` 복귀·세션 활성·JWT 발급 직후). **결과: i18n 100% = 정적 UI + 결정론 데이터 + LLM 산출물 + 로그인 왕복 전부 로케일 정합.** 교훈: next-intl `NEXT_LOCALE` 쿠키도 로케일 독립 구동(둘 다 Lax·실사용 일치) — `post_login_locale`은 콜백 **자체 리다이렉트**를 옳게 만들어 미들웨어 재프리픽스 비의존·더 견고. **HEAD `6bccc45`.** 🇺🇸 **2026-07-15(3) 갱신**: **라이브 QA 스윕 + 727 메타타이틀 + 다크 폴리시 D + US 구조화 IPO 피드(729).** i18n 100% 후 라이브 QA(브라우저 8페이지 전수) → 잔재 마지막(정적 페이지 6종 `/en` 메타 타이틀 한글) 발견·수정 — **727**(`d15dbed`) `about`·`advertise`·`feedback`·`favorites`·`business`·`coin` 메타타이틀 `generateMetadata` 로케일화(en 영어·ko byte 동일·711 패턴·robots 보존·terms/privacy/admin 제외) → **i18n 잔재 0**. **다크 D**(`1f661e3`) 미사용 `.shadow-soft`/`.shadow-soft-hover` 죽은 CSS 제거(전 .tsx 미사용·다크 불가시) → 폴리시 백로그 소진. **🇺🇸 729**(`9d977f0`) **US 구조화 IPO 피드** — US IPO 탭이 뉴스검색뿐이던 것을 KR `IpoFeed`급 구조화 캘린더로: Nasdaq 공개 API(무키·헤더로 403 회피·STEP 728 프로브 검증)→신규 `/api/ipo/us-feed`(이번+지난달 병합·예정 upcoming + 최근상장 priced)+`UsIpoFeed`(2섹션 카드: 회사명·티커·거래소·공모가·날짜·딜규모·priced→내부 종목상세 TR-AI 렌즈)+Toolbox US 분기만 교체(JP/CN/VN/GB 뉴스·KR OfferingsFeed 불변)+i18n(ko "상장 예정"/"최근 상장"·en "Upcoming"/"Recently priced" 패리티). **✅ 라이브 실측**: Vercel `/api/ipo/us-feed` 200·실데이터 30건(예정 6·상장 24·MetaOptics/MOT·Csquare/CSQR·EWAVU·STDN)·**Vercel 403 없음**·`/en`·`/ko` 양쪽 구조화 카드 렌더. **US 시장 KR급 IPO 뎁스 획득.** 🐞 교훈=`export const metadata` 정적 export도 i18n 시 `generateMetadata`로 전환 필요·Nasdaq IPO 공개 API(무키·헤더 UA/Origin/Referer·`data.{upcoming,priced,filed}`·다음달 쿼리 0건→이번+지난달 병합·Vercel 서버리스 403 없음). **HEAD `9d977f0`.** 🌐 **2026-07-15(4) 갱신**: **US 뎁스 완결(배당·ETN) + /about 개선 + /en 완전 영어화(link_hub·뉴스).** **US 뎁스**: 731(`d2ff68d`) US 배당→`UsOfferingsFeed`(IPO+배당 토글·KR 완전 동급·Nasdaq `calendar/dividends` 일단위 14일 병합) · 732(`33f24d2`) US ETN 보드 서브탭(주식/ETF/REITs/**ETN**·`/api/yahoo/us-etn-performance`·Yahoo quote 실명+live 필터·18 live·VXX r1y −53.8%·BULZ +104.7% 극단값 정직 노출)→**US=KR급(IPO·배당·ETF·REITs·ETN)**. **/about 개선**(`b0fee55`): 얇던 소개→유료 플랫폼 표준 골격(문제·3기둥·**TR-AI 렌즈 방법 투명화**[모멘텀·저변동성·밸류·퀄리티·자산성장·기술·F-스코어 7렌즈 + 학술 계보 그레이엄·파마-프렌치·노비-마르크스 2013·피오트로스키 2000·와일더 1978·`lensCopy.ts` 실제값 정합·과장0]·비추천 헤드라인·커버리지·사용법)·경쟁사 8곳(Stockopedia·Danelfin·Morningstar 등) About 조사 근거·ko/en 패리티·멍거 톤. **🌐 /en 완전 영어화**(사용자가 IPO탭 한글 지적→감사가 놓친 편집·제3자 데이터): 734(`971e237`) link_hub `description_en`(490건 gpt-4o-mini 1회 번역)·735(`868c8a5`) `site_name_en`(139건·기관 공식 영문명 FSS·KRX·DART)·736(`3ecadaa`) 뉴스 피드 `/api/news/feed` **`lang` 파라미터**(무조건-ko 번역이던 것→로케일별·en=KR/JP/CN/VN→영어·US/GB 그대로·**기존 무료 키리스 구글번역+`translation_cache` 재사용→비용≈0**·ko 현행 100% 보존). **결과: `/en`=로고 워드마크 외 한국어 0**(정적 UI+결정론+LLM+메타+link_hub 설명/사이트명+뉴스 헤드라인 전부 영어·라이브 KR 시장 뉴스 탭 한글 163→0 실측). 마이그(MCP 라이브)=link_hub `description_en`·`site_name_en`. 🐞 교훈: i18n은 "레이어" — UI·결정론·LLM 넘어 **큐레이션 데이터(link_hub)·제3자 피드(뉴스)**도 각각 스코프. 뉴스는 이미 무조건-ko 번역이라 `lang` 파라미터화만으로 해결(무료 구글번역이라 비용0·OpenAI 가정은 오판이었음→코드 확인이 정답). **HEAD `3ecadaa`.** 다음(선택) = 클로즈드 베타 초대 · GB 뉴스 ko 번역(소소) · site_name 번역 품질 스팟수정. 🎨 **2026-07-17 갱신**: **베타 준비 UX·가독성 폴리시 + 지수 티커 이중방어 + 광고문의 언어권 차등.** (1) **코인 탭 숨김**(`4135463`·데이터 준비 전 노출 제거·라우트/코드 보존). (2) **다크 가독성 2건**: muted 토큰 `#8A8D93→#9CA3AF`(`6b2ce97`·소형 보조텍스트 대비 AA턱걸이 5.95→AAA 7.8:1·토큰 전역) + 헤더/티커 `#0E1116` 바 위 하드코딩 흰색(토큰 아님) `white/40~55→/65~70`(`ed425f4`·태그라인 3.8→8.2:1·크기 무변·위계 유지). (3) **모바일 홈보드 풀블리드**(`659b0e2`·`ToolboxClient` 박스 `border-y sm:rounded-2xl sm:border`+페이지 `px-0 sm:px-6`=모바일 화면끝까지·좌우 3중여백 제거로 폭 ~14% 회복·데스크톱 카드 유지) + 티커↔보드 빈공간 제거(`155da9e`·모바일 `pt-0 pb-4`·측정으로 간격=컨테이너 패딩뿐 확인). 근거=반응형은 **일관성이지 동일함 아님**(웹서치 3회: 모바일 풀블리드+데스크톱 max-width 카드 표준·CNN·Paystack·Robinhood). (4) 🐞 **지수 티커 사라짐 이중방어**: 근본원인=`/api/yahoo/indices`가 21심볼을 `Promise.all`로 조회하다 **하나만 야후 순간 실패해도 전체 reject→catch→빈 응답(200)**, 게다가 클라 `HomeIndexStrip`이 `setItems(j.items||[])`로 빈 응답이 기존 티커 덮어씀 → 60초 재조회로 간헐 ~20% 소실(API 5회 중 1회 0개 실측). **클라**(`fa8a201`·데이터 있을 때만 갱신+빈/실패 시 5초 재시도) + **서버 STEP 737**(`d391c0c`·심볼별 try/catch 격리=하나 실패해도 20개 반환·`_lastGood` fallback) 이중 방어. 라이브 16회 연속 빈 0(min 20=격리 작동). (5) **헤더 로고 반응형 확대**(`0431d06`·22px→`h-6 w-6 lg:h-8 lg:w-8`=모바일24/데스크톱32px·2줄 텍스트 높이 정합+Trillion `leading-none`·태그라인 `mt-1→mt-0.5`로 간격 ≈9→2px). (6) **광고문의 언어권 차등 STEP 738**(`8c7c7a8`·리딩방=한국 특유→en(US·국제)에서 room 슬롯·rule2·폼옵션·note·phCompany 제거·ko 100% 유지·server `getLocale`+client `useLocale`·라이브 en 2슬롯3규칙/ko 3슬롯4규칙). 🐞 교훈=Vercel 배포 큐 간헐 지연(2회)→빈 커밋 재트리거·`Promise.all` 하나 실패=전체 실패(부분허용=심볼별 try/catch)·클라 빈응답 무비판 반영 금지·`resize_window`가 최대화 창엔 뷰포트 무반영(모바일 실측은 DOM 클래스/computed+사용자 폰). (후속) 🧹 **/en 푸터 정리**: 유사투자자문 disclaimer2 en 숨김(`bba2ec0`·KR 전용·disclaimer1 범용은 양쪽 유지·ko 불변) + 사업자 주소 제거(`21c6649`·무거래 정보서비스=전자상거래법 제10조 주소표시 비대상·상호/대표자/사업자번호 유지·법인 전환 시 법인주소 재추가) → `/en` KR 전용 잔재 0(라이브 en/ko 실측). **HEAD `21c6649`.** 🔎 **2026-07-17(2) 갱신**: **베타 준비도 평가 + 관심목록 렌즈 개편(②a) + /en 종목명 갭 발견.** 경쟁 3중 조사 → **"클로즈드 베타엔 충분·네이버/토스/초이스스탁 정면 공개경쟁엔 아직"**(차별점=비추천 에토스·방법 투명성·6개국·유사투자자문 / 갭=스크리너 UI·재방문훅·비미국 종목명). **⭐ ②a 관심목록 개편**: 739(`9464f0e`) 배치 시세 `/api/watchlist/quotes`(관심 심볼→국가별 스냅샷 `.in`) · 740(`e4571e7`) `WatchlistClient` 재설계(시세 즉시 + **행별 지연 렌즈 요약** 강점/주의/보통·점7·`/api/lens` `verdict.tone`·fscore≥7/≤3·동시성4·반응형 2줄) · 741(`0fe6971`) 관심종목 hero + 리딩방 `/en` 숨김 · 742(`44fa289`) 데스크톱 현재가 세로정렬(이름 `flex-1`·렌즈 `sm:w-64`)+설명 종목화. 라이브 실측(가격 x=1269 정렬·삼성전자 강점2주의2보통3·en 리딩방 숨김). 🔑 `lens_scores`(선계산)=**US 1000종목만** → KR 관심목록 렌즈는 **live `/api/lens` 지연**(005930→.KS 실시간)으로 해결·②b(KR 렌즈 선계산 크론)이 즉시화 후속. 🔍 발견=**①** 비미국 종목명 `/en` 한글(`name_en` 없음·이전 i18n이 US SEC명만 커버)→영문명 소싱(야후 `longName`) 필요 · **④** 종목페이지 렌즈헤더+보드 상단 자동 미리보기(목업 확정·미구현·"거래상위 예시" 중립·스플래시 반대→인라인). **HEAD `44fa289`.** 다음 순서=④ → ①(비미국 종목명) → ②b(KR 렌즈 선계산). 🔬 **2026-07-17(3) 갱신**: **렌즈 주인공화 — ④ 완결 + ②b-1 KR 선계산 착수.** **④A**(`dcb1bf6`) 종목 페이지 상단 압축 렌즈 헤더(점7+강점/주의/보통+"판단은 당신"·`LensSummary` 재사용·상세 카드 위·ETF 제외·라이브 삼성전자 2·2·3). **④B** 보드 상단 자동 미리보기(클릭 전에도 거래 상위 종목 렌즈)=744(`be7407d`·KR: `LensPreview` example 라벨+`BoardTopLensCard` 모바일 인라인+aside `selectedStock ?? sorted[0]` 표시만 폴백·URL 복원 비충돌)+745(`9998c7b`·US·JP·CN·VN·GB 미러·CN `.cur` 보존)·라이브 SK하이닉스·Micron "거래 상위 예시". **②b-1 KR 렌즈 선계산**(`fe02a41`+RPC 마이그): `computeLensScores`→`computeLensScoresFor(universe,market)` 파라미터화(US 보존)+KR 유니버스(`kr_stock_snapshot` 거래대금 상위·admin)+`/api/cron/kr-lens-scores`(Vercel cron `30 10 * * *`)+백분위 RPC 시장필터(`041_...sql`). **KR 489행**·MCP 검증(삼성전자 states=live 일치·백분위 시장격리·US 무오염). 🔑 발견=`lens_scores.name` KR 값이 야후 영어("SamsungElec")→①에 야후 `longName` 활용 가능. **HEAD `fe02a41`.** 다음=**②b-2**(관심목록/보드가 `lens_scores` 배치로 읽어 "읽는 중…" 없이 즉시화)→**①**(비미국 종목명 영어화). 📖 **전체 문서 인덱스 = `docs/INDEX.md`.** **최신 상태 = `docs/SESSION_BOOT.md`.** 아래 본문의 '운종'·정체성 서술은 이 배너로 갱신됨.

@AGENTS.md

## 프로젝트 개요
**Trillion(트릴리언)** — **"종목을 보는 눈을, 누구에게나."** 기관이 쓰는 검증된 분석 기법(TR-AI 렌즈)을 개인 손에. 예측·추천은 하지 않고, 1차 재료(시세·뉴스·공시)를 정직하게 **데이터로 보여주고 판단은 사용자**에게 맡긴다. 거래 X(매매·중개·자문 없음 · 통신판매업신고 비대상 = 무거래 정보서비스). 사업자 원트릴리언(210-39-33812). 코드 식별자 `unjong-*`·DB명은 대소문자 이유로 유지(구 이름 잔재).

**정체성 3기둥** (권위 = `docs/BRAND_IDENTITY.md`):
- **무기(Arm)** — AI 렌즈·분석 = 개인 손에 쥐어주는 기관급 명료함.
- **직시(See)** — 정직한 1차 재료. 데이터 없으면 "데이터 부족"이라 말한다. 비예측.
- **자립(Compete)** — 추천 안 함. 분석은 우리가, 판단은 당신이.

목소리 = **멍거 톤**(건조·직설·인센티브·"덜 멍청하게"). 따뜻한 마케팅 카피 금지. 엔진명 = **TR-AI 렌즈**("AI 렌즈"=기능, "TR-AI"=엔진 브랜드).

**수익 모델** (권위 = `docs/AD_MONETIZATION_PLAYBOOK.md`):
- 종목 리스트 인리스트 광고(증권사 슬롯) + 콘텐츠 피드 슬롯 — '광고' 라벨 상시.
- 유사투자자문 조회 디렉토리 — 금감원 등록·신고 **사실** + 누적 즐겨찾기 **관심**순(미검증 평가=별점·후기 제거). 상단 '검증' 탭 → '정보' 하위 **'유사투자자문사'**(KR).
- 원칙: **능력을 팔되 의존을 팔지 않는다** — 리딩방 광고 = 철학적으로 독(`BRAND_IDENTITY` §4).

> ⚠️ **폐기된 구 정체성**: 운종(雲從)·"투자상품에 속지 않게"·"안 속는 곳"·신뢰=중심축·정보/대화/허브/신뢰 4박자·"흩어진 금융정보를 한눈에"·`PRODUCT_SPEC_V6` "마스터 비전". 히스토리는 `docs/PRODUCT_SPEC_V6/V4/V3.md`에 [이력] 보존. **현행 권위 = `docs/BRAND_IDENTITY.md` + `docs/SESSION_BOOT.md`.**

## 역할 분담 — 핵심 워크플로우

### Cowork (Claude AI 어시스턴트)
- 사용자와 대화하며 **무엇을 만들지** 결정
- 구체적인 명령어, 코드, 설정을 **직접 작성해서 전달**
- 문서 업데이트, 로그 기록, 다음 할 일 정리
- **실행은 하지 않음** — 명령어를 만들어서 Claude Code에게 넘기거나, 사용자에게 붙여넣기 안내

### Claude Code (터미널 CLI 에이전트)
- Cowork이 만든 명령어/코드를 **실제로 실행**
- 파일 수정, npm 실행, git commit/push, 서버 재시작
- 빌드 에러 확인, 테스트 실행

### 작업 방식
1. 사용자가 Cowork에게 원하는 것 말하기
2. Cowork이 → 명령어/코드/지시문 작성
3. 사용자가 → Claude Code 터미널에 붙여넣어 실행
4. 결과를 Cowork에게 공유 → 다음 단계 안내

> **한 줄 요약**: Cowork = 두뇌(설계·작성), Claude Code = 손(실행·빌드)

### Claude Code 모델 선택 규칙

**기본값: Sonnet 사용**
- 파일 수정, 빌드, git push, npm run 같은 "손" 작업은 Sonnet으로 충분
- 속도 빠르고 요금 저렴 (Opus의 약 1/5)

**실행 명령어 (기본 — Sonnet):**
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

**Opus가 필요한 경우** — Cowork이 명령어 줄 때 **🔴 Opus 권장** 배지를 명시:
- 🔴 원인 불명 빌드/런타임 에러 디버깅 (스택 트레이스로도 추적 어려울 때)
- 🔴 대규모 리팩토링·아키텍처 변경 (여러 파일 간 영향도 판단 필요)
- 🔴 복잡한 알고리즘 구현 (Cowork이 설계 못 한 부분)
- 🔴 레거시 코드 해독 후 수정 (의도 파악이 어려울 때)

**Opus 실행 명령어 (Cowork이 🔴 표시한 경우만):**
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

**표기 규칙:**
- Cowork이 제공하는 명령어 블록에 별도 표기 없음 → Sonnet 실행
- 명령어 블록 상단에 🔴 **Opus 권장** 표시가 있을 때만 Opus 실행

### 명령어 전달 방식 (파일 vs 인라인)

Cowork이 Claude Code에게 지시를 전달하는 2가지 방식. 상황에 따라 선택.

**📄 파일 방식** — `docs/STEP_N_COMMAND.md` 생성 후 참조

Cowork이 명령어 Markdown을 파일로 저장하고, 사용자는 Claude Code에서 `@docs/STEP_N_COMMAND.md 파일 내용대로 실행해줘`로 호출.

- 트리거:
  - 3단계 이상 작업 (여러 파일 수정)
  - 빌드 검증 + git commit/push 포함
  - 리팩토링·아키텍처 변경
  - 커밋 메시지까지 명시해야 하는 작업
- 장점: 긴 지시문 스크롤 없음, 재실행/롤백 용이, 설계 의도 파일로 보존, Git 히스토리와 별도로 "왜 이렇게 바꿨는가" 기록
- 파일명 규칙: `docs/STEP_{번호}_COMMAND.md` (번호는 연속)
- 파일 상단에 **실행 명령어** (Sonnet/Opus) + **목표** + **전제 상태(이전 커밋 해시)** 필수 명시
- 실행 후 파일은 그대로 유지 — 삭제하지 말 것. 프로젝트 아카이브 역할.

**💬 인라인 방식** — 채팅 내 코드 블록

- 트리거:
  - 단순 1~2파일 수정
  - 디버깅·탐색 (grep, log 확인)
  - 긴급 핫픽스
  - 명령어가 10줄 이내
- 장점: 즉시 대화로 수정 가능, 파일 생성 오버헤드 없음

**판단 기준**: "이 명령어를 한 달 뒤에 다시 봐야 할 가치가 있나?" → Yes면 파일, No면 인라인.

---

## 절대 규칙
- 빌드 깨진 코드 push 금지
- console.log 남긴 채 커밋 금지
- 한 번에 하나의 작업만 — 멀티태스킹 금지
- session-context.md에 없는 숫자 만들기 금지
- 기존 POTAL Supabase 프로젝트 URL/Key 절대 사용 금지 — 반드시 운종 전용 Supabase 프로젝트 (구 stock-platform 명) 사용
- 코드/기술 용어는 영어, 소통은 한국어
- 코딩 초보자 대상 — 기술 설명 간결하게, 명령어는 복붙 가능하게 만들어줄 것
- **OTMarketing CPA 작업은 여기서 하지 않는다** → `~/OTMarketing/` 별도 저장소 (2026-04-23 분리 완료, 상세: `docs/CROSS_REFERENCE.md`)
- 광고주 DB 수집·정산 로직은 본 프로젝트 영역 아님 — 투자 정보·차트·시그널·트레이딩 도구만 다룸
- 🔴 **새 국가탭·언어권 착수 전 반드시 `docs/COUNTRY_TAB_PLAYBOOK.md`를 먼저 (재)읽고 시작** — 매번. (Cowork이 계속 까먹어서 지침으로 못박음. §0 대원칙·§3 DoD 전 항목 확인 후 착수.)
- 🔴 **완전성 = MVP는 "축소"가 아니다.** 국가탭은 DoD 전 항목(배관·종목보드·link_hub·모아보기·**지수바·매매처(brokers)**·모바일·AI R1~R3)을 **빠짐없이** 넣는다. "나중/선택/후속"으로 임의 제외 금지. 데이터 소스 막히면 대체 소스 찾아서라도 채운다. "하나씩"은 순서일 뿐 범위 축소가 아님.
- 🔴 **실측 데이터가 "말도 안 되는 값"이어도 내(LLM) 지식(과거 시세)으로 오염 단정 금지.** 현재가·지수 등 present-day 수치는 훈련지식(~2025.5) 밖 → 반드시 `WebSearch`로 독립 검증 **먼저**. 받은 숫자가 맞는지는 우리 DB를 다시 봐도 검증 안 됨(순환) → 독립 출처로만. **하드코딩 이상치 가드(시총 상한·전일대비 ±X%·수익률 밴드) 절대 금지 — 대세 상승장에서 진짜 데이터를 지운다.** 내부정합 '증거'(예 "삼성+하이닉스 시총 > 코스피 전체")도 baseline이 낡으면 무효(시장이 3배 커지면 참이 됨). 현재가는 매일 받아 화면에 그대로 쓰는 신뢰 데이터 — 파생값(r1y 등)이 커도 현재가부터 의심하지 말 것. (실사례 2026-07-11: 2026 반도체 랠리로 삼성 61k→285k·r1y +355%를 '오염'으로 오진 → 실측 전부 진짜. 상세 `docs/LENS_DEV_PLAYBOOK.md` #28.)

## 폴더 구조
```
/
├── app/                    # Next.js App Router 페이지
├── components/             # React 컴포넌트
├── lib/                    # 유틸리티, API, 상수
├── stores/                 # Zustand 상태관리
├── types/                  # TypeScript 타입 정의
├── supabase/               # DB 스키마 마이그레이션
├── public/                 # 정적 파일
├── docs/                   # 프로젝트 문서 (CHANGELOG, NEXT_SESSION_START)
├── .claude/hooks/          # 세션 종료 검증 hook
├── CLAUDE.md               # 이 파일 — Claude Code 지침서
├── CLAUDE_CODE_INSTRUCTIONS.md  # 전체 개발 명령서
└── session-context.md      # 프로젝트 맥락 + TODO
```

## 문서 업데이트 규칙
코드 작업 완료 시 반드시 아래 4개 파일의 헤더 날짜를 오늘로 업데이트:
1. `CLAUDE.md` — 첫 줄 날짜
2. `docs/CHANGELOG.md` — 첫 줄 날짜
3. `session-context.md` — 첫 줄 날짜
4. `docs/NEXT_SESSION_START.md` — 첫 줄 날짜

## 🔴 기법 렌즈 개발 로그 규칙 (그때그때 — Cowork 필수)
**AI 렌즈(기법) 관련 STEP 결과를 받을 때마다**, 문제·원인·해결·교훈이 생겼으면 **즉시** `docs/LENS_DEV_PLAYBOOK.md`의 "문제해결 로그"에 한 행 추가한다.
- **몰아서 하지 말 것** — STEP 결과를 보는 그 자리에서 기록(빠뜨림·왜곡 방지).
- 새 기법 착수 전 이 플레이북을 **먼저 훑는다**(같은 함정 회피).
- 문제가 잘 안 풀리면 로그를 **되짚어 추론**한다.
- 원칙(예측 아님·데이터 먼저·엔진=검증 일치·하나씩 완전히)은 이 플레이북 §0을 따른다.
- 교훈은 **조건부**로 기록 — "무조건 맞다" 금지. 한 기법에서 통한 이론·처리가 다른 기법엔 다르게 적용될 수 있음(§0-7). "어느 기법/조건에서"인지 맥락을 함께 남긴다.

## 세션 종료 체크리스트
- [ ] 4개 문서 헤더 날짜 오늘로 업데이트
- [ ] CHANGELOG.md에 이번 세션 변경사항 추가
- [ ] session-context.md에 이번 세션 완료 블록 추가
- [ ] NEXT_SESSION_START.md 최신 상태로 업데이트
- [ ] **`docs/NEXT_SESSION_PLAYBOOK.md` 갱신** (다음 세션 마스터 인수인계 — HEAD 해시·STEP 번호·다음 STEP 후보·디자인 변경 등 반영)
- [ ] **`docs/SESSION_BOOT.md` 갱신** (HEAD·STEP·현재 상태·다음 후보 — 새 세션 최우선 파일)
- [ ] SESSION_KICKOFF.md `현재 커밋` 표기 갱신
- [ ] 🅿️ **보류 기능(parked) 있으면 배선 보존 + `docs/PARKED_*_ACTIVATION.md` + `LOCALE_SOURCE_PLAYBOOK` 원장 기록** (막힌 소스를 가짜로 채우지 말고, 작동하는 코드는 남기고 스위치만 OFF — §보류 기능 프로토콜)
- [ ] git push
- [ ] 빌드 에러 없는지 확인 (`npm run build`)

## 참조 파일 경로 테이블

| 파일 | 경로 | 용도 |
|------|------|------|
| 📖 전체 문서 인덱스 | `docs/INDEX.md` | **전체 문서 마스터 인덱스(언제든 여기부터)** — 카테고리별 카탈로그 · 각 문서 용도 · "언제 읽나" |
| 🚀 새 세션 부트 | `docs/SESSION_BOOT.md` | **세션 시작 시 최우선** — 정체성·현재 상태·워크플로우·아키텍처·env·명령어·다음 후보 |
| 개발 명령서 | `CLAUDE_CODE_INSTRUCTIONS.md` | 전체 기능 명세, DB 스키마, 페이지별 상세 |
| 비즈니스 전략 | `docs/BUSINESS_STRATEGY.md` | 사업 전략, 투자심사 Q&A, AI전략, 수익모델, 확장계획, 핵심 결정 기록 |
| 시스템 설계 | `docs/SYSTEM_DESIGN.md` | 아키텍처, 페이지별 기능명세, API현황, 채팅설계, 인증/권한, 자동화, 배포체크리스트 |
| 프로젝트 맥락 | `session-context.md` | TODO, 히스토리, 핵심 수치 |
| 변경 이력 | `docs/CHANGELOG.md` | 세션별 변경사항 |
| 다음 세션 가이드 | `docs/NEXT_SESSION_START.md` | 최신 상태 요약 + 다음 할 일 |
| 🌍 언어권 소스 지침 | `docs/LOCALE_SOURCE_PLAYBOOK.md` | 새 언어권 데이터소스 발견·검증·기록 런북(의미우선 스키마·검증게이트·실패원장). 새 locale·데이터소스 착수 전 필독 |
| DB 스키마 | `supabase/migrations/001_initial_schema.sql` | Supabase 테이블 정의 |
| 환경변수 | `.env.local` | API 키 (반드시 운종 전용 Supabase, 구 stock-platform 명) |

## 🔒 하네스 규칙 (자동 강제 — 부탁이 아닌 시스템)

### 세션 종료 시 자동 검증
- Hook이 4개 문서 헤더 날짜를 자동 검증
- 오늘 날짜가 아니면 ❌ → 반드시 업데이트 후 push

### 가비지 컬렉션 (세션 시작 시 필수)
- 매 세션 시작 시 session-context.md의 TODO 섹션 점검
- 완료된 항목이 TODO에 남아있으면 즉시 제거
- 1주일 이상 지난 "대기 중" 항목은 날짜 갱신 필요 여부 확인

### 문서 4개 날짜 일치 규칙
- 코드 작업이 있는 세션에서는 4개 문서 헤더 날짜가 반드시 오늘이어야 함
- CLAUDE.md, docs/CHANGELOG.md, session-context.md, docs/NEXT_SESSION_START.md

## 세션 루틴

### 세션 시작 시 (Cowork이 처리)
1. **`docs/SESSION_BOOT.md` 읽기** ← **항상 이것부터** (새 세션 부트 — 정체성·현재 상태·워크플로우·아키텍처·env·명령어·다음 후보 전부 한 파일, 매 세션 최신 유지)
2. `docs/NEXT_SESSION_PLAYBOOK.md` 심화 확인 (디자인 시스템·페이지별 컴포넌트 매핑·STEP 이력 — 필요할 때)
3. `docs/SESSION_KICKOFF.md` 보조 / `session-context.md` TODO 가비지 컬렉션
4. 사용자에게 오늘 할 P0 작업 제안 → 확인 후 명령어 작성

### 작업 중 (역할 분담)
- **Cowork**: 코드 작성, 명령어 생성, 설계 결정
- **Claude Code**: Cowork이 만든 명령어 실행, 빌드 확인, git push
- 사용자는 Claude Code 터미널에 명령어 붙여넣기만 하면 됨

### 세션 종료 시 (Cowork이 처리)
1. 4개 문서 헤더 날짜 오늘로 업데이트
2. CHANGELOG.md에 이번 세션 변경사항 추가
3. session-context.md에 이번 세션 완료 블록 추가
4. NEXT_SESSION_START.md 최신 상태로 업데이트
5. Claude Code용 git push 명령어 제공 → 사용자가 실행

## 핵심 원칙
- "로그 없으면 미완료" — 빌드 성공해도, 테스트 통과해도, 기록 없으면 미완료
- "session-context.md에 없는 숫자 만들기 금지" — 근거 없는 수치 사용 금지
- "한 번에 하나의 작업만" — 멀티태스킹 금지
- "Cowork은 설계·작성, Claude Code는 실행" — 역할 절대 혼용 금지
- "명령어는 복붙 가능하게" — 사용자가 바로 Claude Code 터미널에 붙여넣을 수 있는 형태로 제공
