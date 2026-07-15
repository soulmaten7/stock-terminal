<!-- 2026-07-15 -->
# Trillion(트릴리언) — 다음 세션 PLAYBOOK

> **이 파일은 무엇인가**: 다음 세션을 처음부터 끝까지 이해하고 진행하기 위한 마스터 인수인계 파일. 다른 어떤 문서를 안 봐도 이 파일만으로 작업 시작 가능.
>
> 🎉 **2026-07-15 (최신) 스냅샷 — HEAD `5c0c348` · Tier 3: LLM 생성물 영어화 완결 → /en 100% 영어.** `/en`의 마지막 한국어(LLM 생성물=브리핑 R2·news-brief R3·공시요약 R1)를 영어화. 설계 `docs/TIER3_LLM_I18N_DESIGN.md`(스키마 A `*_en` 컬럼·on-demand). **720**(`2645cf9`) `*_en` 컬럼 마이그(MCP) · **721**(`e34fee3`) `/api/brief` R2[🐞 `brief_ko` NOT NULL→en-first INSERT 조용한 LLM 누수 될 뻔·DROP NOT NULL+에러로깅] · **722**(`60d5d8b`) `/api/news-brief` R3[+`tags_en`·한국어 강제 후처리 `ko` 게이팅] · **723**(`9329993`) `/api/events/summary` R1 US · **724**(`5c0c348`) `kr/jp/cn/gb/vn-events/summary` R1[723 복제]. 캐시 컬럼 분리(`*_en`)로 언어 교차 오염 차단·on-demand 과금·KR byte 동일(라이브 삼성 공시 ko/en 독립·vitest 43/43). 결과=`/en` 로고 빼고 한국어 0(US 영어 시장 제품 완성). 교훈 `LENS_DEV_PLAYBOOK` #31. ▶ 다음(선택)=US 통화기호·빈뉴스 UX·OAuth 로케일 쿠키·다크 폴리시 D·클로즈드 베타. (아래 스냅샷들은 히스토리.)
>
> 🌐 **2026-07-14 (5) 스냅샷 — HEAD `3cb73ab` · 영어 데이터 레이어 i18n(Tier 1+2 결정론) + 브랜드 록업.** #86 감사: `/en` 정적 UI 영어인데 데이터/AI 레이어(렌즈명·판정·grade·브리핑·공시·h1) 한국어. 원인=(A)클라 `&lang` 안 보냄[카피 이미 이중언어] (B)일부 하드코딩. **715**(`a393940`) 렌즈 `&lang` 배선[한 줄로 이름·판정·스펙트럼 영어]+grade 맵+h1 `info.en`+뱃지 lang · **716**(`36dbed9`) 8-K·F-Score(우량/중립/부실→Strong/Neutral/Weak)·ETF 이중언어+events lang캐시 · **717**(`a9d9ad7`) detail 키 stable화[한국어가 `L.detail[…]` lookup 키라 key/label 분리]+DETAIL_LABELS/headline·조회 3곳 · **718**(`72d4f32`) note 6개 영어[수치 보존]+short/long 이중언어[계산모듈 언어중립 state] · **719**(`3cb73ab`) `/en` 한글 워드마크 "트릴리언" 숨김. KR byte 동일=charac red-diff+live SHA(vitest 43/43). 결과=`/en` 결정론 데이터 100% 영어, 남은=LLM 생성물(브리핑·공시요약)=Tier 3(`docs/TIER3_LLM_I18N_DESIGN.md`·`*_en` 컬럼·on-demand·720~723). 교훈 `LENS_DEV_PLAYBOOK` #30. ▶ 다음=Tier 3(720 마이그레이션) or US 잔여·OAuth 로케일 쿠키·다크 폴리시 D·클로즈드 베타. (아래 스냅샷들은 히스토리.)
>
> 🐛 **2026-07-14 (4) 스냅샷 — HEAD `d122cac` · 캐시 stale 버그 3-STEP 완결: 모든 [locale] 페이지 신선화.** STEP 711 배포 확인 중 발견 = `[locale]` 페이지가 캐시 지시자 없으면 **무한 정적 캐시**로 굳어 배포해도 안 갈아엎어짐 → bare URL이 봇에 옛 콘텐츠(`/stock/{종목}`=옛 브랜딩·`/about`=개편 이전 정체성["속지 않도록"·"흩어진 금융정보"]·`/terms`·`/privacy`=법무 정확화 전). 코드는 현재값·라이브만 stale(SEO·규제). 원인=layout 정적렌더 자격(setRequestLocale+generateStaticParams)+페이지 캐시 지시자 누락. **712**(`2cd926d`) 종목상세·**713**(`9c4d619`) 정적 8개(about·terms·privacy·toolbox·coin·favorites·feedback·advertise)·**714**(`d122cac`) 클라 3개(mypage·auth/login·admin/login은 `'use client'`라 page dynamic 무시 → **서버 `layout.tsx` 래퍼**·로그인 로직 불변) 전부 `force-dynamic`. 🐞 교훈=`[locale]` 페이지 캐시 지시자 명시(`'use client'`=서버 layout 래퍼)·`npm run build`가 dev `.next` 밟아 500→클린 재시작. tsc 0·vitest 34/34·전 라우트 200·신선 확인. 남은 검증=구글 로그인 왕복(브라우저). ▶ 다음=로그인 왕복 확인·US 잔여(통화기호·IPO·ETN)·OAuth 로케일 쿠키·다크 폴리시 D·클로즈드 베타. (아래 스냅샷들은 히스토리.)
>
> 🔎 **2026-07-14 (3) 스냅샷 — HEAD `f647b08` · US 풀뎁스 P0: 종목상세 영어 SEO + US 파리티 감사.** **📋 감사(서브에이전트+DB 실측)**: US는 이미 KR 동급/더 깊음(레퍼런스 구현) — 배관·보드·피드 7탭·**link_hub 139**(KR 138·옛 'US 67 미충전'은 낡음)·brokers 17·렌즈 백분위(US 전용)·공시 심각도 분류(material/routine)·서학개미 한글명. KR 전용(갭 아님·의도)=코스피코스닥·상하한·유사투자자문사·유튜브. **유일 실질 갭=종목상세 영어 SEO.** **🔎 STEP 711**(`f647b08`·`app/[locale]/stock/[symbol]/page.tsx` 단일): `generateMetadata`·JSON-LD locale 인지화 → `/en/stock/{sym}` 영어 title(Stock Price · TR-AI Lens · News · Filings)·desc·keywords·OG `en_US`·hreflang(ko·en·x-default)·breadcrumb(Home/Stocks)·ko **byte 동일**(무회귀·curl 대조)·VN 뉴스분기 보존. **🔑 Opus 스펙교정**: en 페이지에 `${name}`(서학개미 한글명 오버라이드) 쓰면 한글명 영어SEO라 목적 붕괴 → en 분기는 `info.en`(영문명) 주·한글명 보조(ko 무영향). tsc 0·vitest 34/34. ▶ 다음 US(선택)=P1 통화기호`$`·P2 US IPO 구조화·ETN·(보류) 인라인 증권사 광고=수익화. 그 외=OAuth 로케일 쿠키·다크 폴리시 D·클로즈드 베타. (아래 스냅샷들은 히스토리.)
>
> 🌍 **2026-07-14 (2) 스냅샷 — HEAD `14c1813` · 2차 i18n(다국어) 완성: next-intl `[locale]` 라우팅 + 영어(en) + 언어 스위처 + en→US 시장 디폴트.** 3단계 = 기반(708) → **문자열 이관(709~709F)**(Chrome·Toolbox·렌즈·6보드[Board dedup]·AdvisorDirectory·피드·사용자페이지 → `messages/ko.json`·서버 `getTranslations`/클라 `useTranslations`·값 동일·화면 0·제외=props·API·데이터·DB로 가는 값[label만 번역]·**admin·약관/개인정보 의도적 제외**) → **710A** 라우팅 구조(`70328e8`·ko 단일·`as-needed`·화면 0·`routing/navigation/request/proxy`[Supabase 세션 합성]+`app/[locale]/*` 이동+generateStaticParams·**🐞 matcher 점(.)규칙이 종목코드 `7203.T`류 404낼 뻔→확장자 화이트리스트**) → **710B** `en.json`(`c8a69b5`·414키 1:1·브랜드 보이스 잠금·영어 축약형 배제로 ICU 아포스트로피 회피·`messages.test.ts` 패리티 영구 vitest·`Login.brandKo`=로고 워드마크라 번역금지) → **710C** 스위처+내부 링크 `@/i18n/navigation` 스왑(`bacacf7`·`useSearchParams`/외부링크 제외·**🐞 useSearchParams는 전역 헤더에 Suspense 강제→SSG de-opt→window.location.search로 우회**) → **710D** `homeMarketFor(locale)`[en→US·ko→KR 홈시장 맨앞·첫방문만·STEP 703 무손상]·`generateMetadata`/hreflang[미들웨어 Link헤더+홈 HTML alternates]·youtube 조회수 로케일 나눗셈[만/억↔K/M]. **🅿️ OAuth 로케일 보류**(redirectTo에 `?next=` 붙이면 Supabase 허용목록 거부→로그인 죽음·파트4 롤백 `14c1813`·쿠키 수정안 `docs/PARKED_OAUTH_LOCALE_ACTIVATION.md`). tsc 0·vitest 34/34·양쪽 전수 검증. ▶ 다음 = OAuth 쿠키 수정 · 라이브 6보드·/en 클라뷰 육안 · **US 탭 풀뎁스(2차 본목표)** · 다크 폴리시 D · 클로즈드 베타 초대. (아래 스냅샷들은 히스토리.)
>
> 🟢 **2026-07-14 (1) 스냅샷 — HEAD `3c2fc8b` · 🌑 다크 테마 3단계 완결 + 🧭 유사투자자문사 정합(라벨·정렬·위치) + 🎓 온보딩(자기설명) + 🖥️ /about 폭.** ① **유사투자자문 조회 정합**: `48e9802` AdvisorDirectory 패널 '유사투자자문 조회' 제목+문서 [이력·폐기] 배너 마무리 · `e199328` 라벨 '유사투자자문 조회'→**'유사투자자문사'**(금감원 등록업체 목록) · `828e97c` 정렬 상호명 접두어((주)·㈜·(브랜드)) 무시 가나다(`/api/advisors` 전체로드→JS정렬→슬라이스·3뷰 공통) · `f66d77f` 하위탭 증권사→유사투자자문사 순 · `551d5e1` 메타 keywords 새 정체성(리딩방검증·신뢰평가허브 제거→종목분석·TR-AI렌즈·검증된투자기법). ② **🎓 온보딩 KR(Option A·자기설명 중심)**(`de58fca`): 헤더 태그라인(lg+)+상단 '소개' 링크(→/about)+LensPreview 문구 또렷("사고팔 신호 아니라 판단할 재료")+/about '이렇게 봅니다' 3스텝·**배너·팝업 없음** · **/about 폭**(`e5c4a97`) 앱 기본(max-w-7xl) 정합. ③ **🌑 다크 테마(라이트→다크·안 깨지게 3단계)**: 1/3(`f029d91`) 토큰화(배경전용 `unjong-strong` 신설·`bg-unjong-primary`→strong·`bg-white`→surface·겉모습 변화 0) · 2/3(`07fc4bf`) 플립(`app/globals.css` 토큰 값만 다크·background #0A0A0A·surface #17181C·border #2A2C31·`color-scheme:dark`·스크롤바·앱 전체 다크·**라이브 검증**) · 3/3(`3c2fc8b`·🔴Opus) 폴리시(앰버 배지·게이지 fill·상태색 다크 대비+구글 로그인버튼·StockLogo 실로고원 라이트 유지·레터아바타 이니셜 `text-unjong-strong`). 근거=미드나잇+민트 브랜드·헤더 이미 다크·데이터밀도 금융툴 다크 정석·**개선이지 전환 아님**. ▶ 다음 = 다크 폴리시 D 후속(accent 틴트·shadow-soft·라이브 눈으로) · /about 3기둥 이름 직관화(목업 승인·미적용) · 클로즈드 베타 초대(`docs/BETA_INVITE.md` 준비됨) · 2차 i18n 스캐폴드(next-intl)→US 풀뎁스 · Vercel Analytics Enable(1클릭). (아래 스냅샷들은 히스토리.)
>
> 🟢 **2026-07-13 스냅샷 — HEAD `c0d3b80` · 🎯 종목보드 UX 마감 + 🔵 브랜드 정체성 인앱 정합 + 🧭 nav 2탭 + 🧪 베타 피드백 + 📚 지침 정체성 정리.** ① **종목보드 UX**: 🐞 거래대금 정렬 방향 버그(`(b-a)*dir`→`(a-b)*dir`·6보드·거래대금 최저 잡주가 상단 뜨던 US/JP/CN/VN/GB) · **STEP 703** 뷰 복원(`lib/boardMemory.ts`·렌즈 상세 왕복 시 하위탭·정렬·페이지 유지, 국가전환/새로고침 시 초기화) · PC 우측 TR-AI 렌즈 패널 **sticky** 고정 · 컨트롤 힌트·색범례 제거 · KR 코스피/코스닥 토글 **별도 줄**(모바일 잘림 해소). ② **TR-AI 렌즈 정직 표시**: "준비 중"→이유 명시("데이터 부족(상장·거래 이력 짧음)"/네트워크 오류 분리) · 재무 없는 종목은 퀄리티·자산성장을 숨기지 않고 "재무 데이터 없음" 행. ③ **🔵 브랜드 인앱 정합**(`e1550f9`): `/about`·`/advertise` 멍거 톤·3기둥·시장중립 카피 + `BRAND_IDENTITY §6` 옛 태그라인 [이력·폐기] + `CLAUDE.md` 개요 재작성. ④ **🧭 nav 2탭**(`c0d3b80`·`ToolboxClient.tsx`): 상단 '검증'→'정보' 하위탭 **'유사투자자문 조회'**(KR 전용) → 상단=종목·정보 2탭. ⑤ **🧪 `/feedback`**(`b39406f`): FeedbackForm+`/api/feedback`(서버 삽입·입력 캡)+supabase `feedback`(RLS on·anon REVOKE)·설문 5+별점+연락처·noindex·e2e 검증. ⑥ **📚 지침 정체성 정리(1차)**: 라이브 문서 옛 프레임("속지 않게"·"안 속는 곳"·신뢰=중심축·4박자·"흩어진 금융정보를 한눈에"·Trustpilot 핵심차별화)→현행 3기둥(핸드오프·플레이북·로드맵·README·수익화 런북 등), `PRODUCT_SPEC_V6/V7`엔 [이력·폐기] 배너. **통신판매업신고=비대상**(무거래 정보서비스·재확인). ▶ 다음 = 지침 잔여분 마무리 검수 · AdvisorDirectory 패널 헤딩을 '유사투자자문 조회'와 정합 · 공개 POST(inquiry·feedback·click) rate-limit(Vercel KV) · Sentry 소스맵 AUTH_TOKEN(선택) · Vercel Analytics Enable(1클릭) · 1차 출시=클로즈드 베타 초대 발송. (아래 스냅샷들은 히스토리.)
>
> 🟢 **2026-07-12 (최신) 스냅샷 — HEAD `09f1174` · 🛡️ 하드닝 마감(DEFINER 뷰·ai-analysis) + 📈 모니터링(Vercel Analytics·Sentry).** ① **DEFINER 뷰 정리**: 라이브 조사=악용 구멍 아님(UNION/LATERAL 복합뷰라 쓰기불가·노출은 공개데이터). `advisor_directory`=로그아웃 방문자에 공개 리딩방 디렉토리 서빙하는 필수 통로라 DEFINER 유지(security_invoker 켜면 빈 화면·라이브 1,553행 검증)·`stock_snapshot_v`(앱 미사용)만 invoker+권한회수(`supabase/migrations/20260712_harden_definer_views_grants.sql`). ② **미사용 `/api/ai-analysis` 제거**(비인증 OpenAI gpt-4o-mini 과금 구멍·레거시 TRAI 스텁·나머지 공개 POST=401 보호). ③ **Vercel Analytics**(`@vercel/analytics`·⚠️대시보드 Enable 1클릭 남음) **+ Sentry**(`@sentry/nextjs` v10·서버/엣지/클라+instrumentation(onRequestError)+전역 에러바운더리+next.config 조건부 래핑·**라이브 에러 캡처 검증 완료**). 🐞 **교훈**: Vercel `NEXT_PUBLIC_*`는 빌드캐시 재사용 시 미인라인→**'Use existing Build Cache' 해제하고 재배포**해야 박힘(Sentry 무동작 유일 원인·`__SENTRY__` 부재로 진단). ▶ 다음 = Vercel Analytics Enable(1클릭)+(후속) 공개 POST rate-limit(Vercel KV)·Sentry 소스맵 AUTH_TOKEN. (아래 스냅샷들은 히스토리.)
>
> 🟢 **2026-07-12 (2) 스냅샷 — HEAD `4ea75a1` · 🔒 1차 출시 QA 관문 통과 — RLS 보안 마감 + ⚖️ 법무 정확화 + 🔵 태그라인 새 슬로건.** STEP 700~702(렌즈 독립배선 아키텍처[기법당 AI 교체 자리]·KOSPI/KOSDAQ 세그먼트 토글·상하한 배지·1차 폴리시[JP TOPIX 숨김·CN 홍콩만·VN 공시→뉴스]) 위에 출시 게이트 마감. ① **QA 스윕(LAUNCH_PLAYBOOK §2)**: 법무·robots/sitemap/OG·API 인증(401)·service-role 키 미노출·env·XSS 전부 출시급 통과·블로커 1개 발견. ② **🔴 RLS 4개 테이블 보안 마감**(`supabase/migrations/20260712_enable_rls_public_data_tables.sql`): `kr_stock_snapshot`·`brokers`·`jp_stock_perf`·`translation_cache`가 RLS off + anon에 `DELETE·TRUNCATE·UPDATE` 부여 → 공개 anon 키로 KR 보드 삭제·위조 가능하던 구멍을 RLS on+anon REVOKE로 봉인(읽기 9곳 전부 service-role이라 앱 영향 0·라이브 apply_migration 선반영·재검증·`/api/brokers`·`/api/krx/ranking` 정상 서빙 확인). ③ **⚖️ 법무 정확화**(구글만·개인정보 §11 권익침해 구제·시행일 2026-07-11) · ④ **🔵 태그라인 새 슬로건**(푸터·로그인·소개 "종목을 보는 눈을, 누구에게나."·라이브 `/about`·OG 확인). 커밋 `4ea75a1`·CI 최근 3개 초록·tsc 0. ▶ **다음 P0 = 통신판매업신고 대상 확인**(무거래→비대상 유력) **+ 선택 하드닝**(모니터링 Sentry/Analytics·공개 POST rate-limit·DEFINER 뷰 security_invoker). 진짜 출시 블로커 없음. (아래 스냅샷들은 히스토리.)
>
> 🟢 **2026-07-11 (2) 최신 스냅샷 — HEAD `ba3ce68` · 🔵 브랜드 외부 슬로건 확정 + 🖼️ OG/링크 미리보기(실제 로고) + 📖 문서 인덱스 신설.** ① **브랜드 외부 슬로건 확정**(`docs/BRAND_IDENTITY.md` §0·`a2d552a`): **"종목을 보는 눈을, 누구에게나."** · 서브 "모든 시각을 데이터로 — 판단은 당신입니다." · 각인 멍거 원문("The best thing a human being can do is to help another human being know more.") · 경쟁 백스페이스(남들은 "이기게" ↔ 우리는 "제대로 보게, 판단은 당신") · 이전 **"흩어진 금융정보를 한눈에" 폐기**. ② **OG/링크 미리보기 완료**(`336d08c`·`ba3ce68`): `app/layout.tsx` title·description·openGraph·twitter+images · `app/page.tsx` JSON-LD · `public/og.png`(로고 마크 박힌 1200×630). ③ **📖 전체 문서 마스터 인덱스** `docs/INDEX.md` 신설(비-STEP 문서 67개 카테고리별 카탈로그 + "언제 읽나"·CLAUDE.md 참조 테이블 맨 위 연결). ▶ **다음 P0 = 1·2·3차 출시 로드맵 확정**(각 차수 기능 범위 + 광고 활성화 시점) — 기존 **STEP③**(종목보드 코스피/코스닥 세그먼트 토글 + 상한/하한 배지[`|changePercent|≥29.5`])는 폐기 아님, 이 로드맵의 **1차 범위 후보**로 재배치. (아래 스냅샷들은 히스토리.)
>
> 🟢 **2026-07-11 최신 스냅샷 — HEAD `5cd234d` · STEP 699 · 한국탭 완성도 심화(밸류 렌즈 KR·ETF/ETN 크론 스냅샷·개발 안전망).** 오늘 아크 = ① **미리보기 기간수익률 단일 소스화**(694·ranking에 r1w..r1y 통합, kr-performance 병합 제거 → 병합 실패로 '—' 되던 버그 해소) · ② **🧪 개발 안전망 1차**(695·`lib/returns.ts` 순수 pct 추출 + vitest 유닛테스트 + `.github/workflows/ci.yml` 매 푸시 tsc→test→lint) · ③ **🔭 밸류(가치) 렌즈 KR 활성화**(696=STEP① · 야후 .KS PER/PBR 미제공 → 재무 순이익·자기자본·주식수로 직접 산출 · `lib/returns.ts` perFrom·pbrFrom·`lib/fscore.ts` stockholdersEquity·`lib/lensCompute.ts` · LENS_DEV #29) · ④ **⚡ ETF/ETN 성과 크론 스냅샷화**(697→698→699=STEP② · `kr_etp_snapshot`+`lib/krEtpSnapshot.ts`+`app/api/cron/kr-etp`+스냅샷 우선+vercel.json 크론; 698=거래일 판정 버그[주말 빈 종가→유효 종가 있는 날만], 699=Vercel↔KRX keep-alive 순차 재조회 실패→`Promise.all` 동시조회 · ✅ 라이브 전 기간 채워짐) · ⑤ **UI 일관성**(692·693 ETF/ETN 상세 너비·뒤로가기 통일·검증탭 행 클릭·앱 전체 3중 감사). **신규 문서** `docs/LAUNCH_PLAYBOOK.md`(한국탭 공개 로드맵+검수 체크리스트)·`LENS_DEV_PLAYBOOK` #28~29. **한국탭 완성도 ~90%.** ▶ 다음 = **STEP③**(종목보드 코스피/코스닥 분리 세그먼트 토글[데이터·API 준비됨·`MarketBoard`가 `market=all`만 호출]+상한/하한 배지[`|changePercent|≥29.5`]) → 폴리시(렌즈 KR종목명 영문·지수바 TOPIX 빈값·오래된 주석). (아래 시점 스냅샷들은 히스토리.)
>
> 🟢 **2026-07-10 스냅샷 — HEAD `f21fa07` · STEP 690 · 🔴 브랜드 대개편 + 탭 3개 + ETF "상품 구성".** 오늘 아크 = ① **브랜드 정체성 대개편**(`docs/BRAND_IDENTITY.md` 재작성): 3기둥 **무기**(Arm·TR-AI 렌즈)·**직시**(See·1차 재료)·**자립**(Compete·판단은 당신)·뿌리 프로메테우스·칸트·그레이엄·멍거·**목소리 멍거 톤**("덜 멍청하게")·근간 "예언·추천 안 함, 불을 건넨다"·슬로건 "전문가 시각으로, TR-AI가 무료로 분석해 드립니다 / 가격은 시장이 붙이고, 가치는 당신이 매깁니다 — 판단은 당신 몫". ② **"AI 렌즈"→"TR-AI 렌즈"** 명칭 통일(682·중앙 `AiLensBadge.lensLabel()`). ③ **탭 14→3 재구조**(680·685·`ToolboxClient.tsx`): 상단=종목·정보·검증·나머지 12개=정보 하위탭·증권사=정보 하위·검증=상단(KR 게이팅). ④ **광고 수익화**(`docs/AD_MONETIZATION_PLAYBOOK.md`·`lib/ads.ts`·KR=자본시장법상 퍼블리셔 어필리에이트 없음→직접 광고·진짜 파이=AI구독+증권사 성과형)·미리보기 광고 완전 제거→리스트 10개마다·태그라인 3곳 새 문구·증권사 20곳 중립 사실 note·인리스트 데모 광고(대신증권). ⑤ **ETF "상품 구성"**(686~690·`docs/ETF_LENS_PLAN.md`): `/stock/{ETF}`가 기업재무 렌즈 대신 상위보유·섹터·보수율·운용사·추종지수(US=Yahoo topHoldings·KR=네이버 `etfAnalysis`·`lib/instrumentType.ts`·`api/etf-holdings`·`EtfLensClient.tsx`·영숫자 KRX 코드 0193T0 버그 수정·라벨="상품 구성" AI 아님). **3중 검수 통과.** ▶ 다음 = ETF 증권사 거래연결(수익화)·ETN 정제·JP/CN/VN/GB ETF 구성·AI 구독(Phase 5)·오늘 개편 모바일 QA. (아래 시점 스냅샷들은 히스토리.)
>
> **시점 스냅샷**: **2026-06-27 STEP 421 종료** — (412 이후) **US 시장 완전체(거시·뉴스·공시 4기둥) 세션 413~421**: 413 피드 국가맵 리팩터(`ToolboxClient` 단일 `country==='KR'` 가드 → `FEED_COUNTRY_SUPPORT` 맵)+거시(macro) US 노출(FRED 이미 완성)+`MacroFeed` `defaultView` · 414 **US 뉴스 피드**(`/api/news/feed?market=US` = Yahoo `^GSPC` RSS 키리스, `NewsFeed` `country` prop) · **415(flagship) US 공시 피드**(`/api/sec/feed` = SEC EDGAR `getcurrent` 8-K Atom, UA=`SEC_USER_AGENT` + 새 `SecFeed`[DartFeed 미러] + disclosure US 개방 — **DART의 미국 짝**) · 416 모바일 US 종목명 `truncate` 클램프 · **417 종목표 정렬 재설계(KR·US 동일)**(종목명·현재가·기간 헤더 클릭 정렬+▲/▼ 항상 표시, 기본 현재가↓ 탭 전환 시 리셋, `#`=번호만, 거래대금 정렬 제거) · 418 죽은 라우트 삭제(`us-quote`·`us-performance` -368줄; 옛 `/api/sec`는 `lib/api/sec.ts`가 써서 유지) · 419 모바일 3종(표 아래 증권사 중복 제거·`ListRow` 우측정렬·종목 시트 현재가+1일~1년 수익률) · 420 기간 **커스텀 드롭다운**(네이티브 `<select>` 교체) · 421 기간 라벨 **"전" 표기**(1일전~1년전)+드롭다운 버튼·목록 폭 일치. **→ US = 종목·상품 + 거시(FRED)·뉴스(Yahoo)·공시(SEC EDGAR) 4기둥, KR↔US UI 통일.** **🔵 결정: 거래소 분리 안 함(검색·정렬로 충분 + US 데이터 태그 없음 → 주식 탭 통합 유지).** **배포 ✓ onetrillion.app 라이브(STEP 413~421).** **📌 370~421 세부는 `docs/SESSION_BOOT.md` 최상단 배너가 최신·정본**(이 PLAYBOOK 본문 §은 312~369 히스토리 보존).
>
> ⬇️ **(직전) 2026-06-26 STEP 412 종료** — (402 이후) **US 종목 탭 KR-parity 세션 405~412**: 405 US 종목 탭 신설(`app/api/yahoo/us-performance` 193 + `components/toolbox/UsMarketBoard.tsx`) · 406 KR 구조 통일(하위탭·기간 드롭다운·증권사 사이드바) · 407 US ETF(73, `us-etf-performance`)+하위탭 **`주식 | ETF`**(미국 기준, ETN·리츠 제거) · 408 **US 주식 전종목 lazy**(`data/us_symbols.json` 6,936 + `us-list` batch quote + `us-quote` 기간 lazy) · 409 KR 데스크탑 기간 드롭다운 통일 · 410 종목표 UI 리파인(`lib/currency.ts` 통화 현지화·드롭다운 1일부터·자동정렬·화살표·간격·로고) · **411 US 기간 백그라운드 미리계산**(`us_stock_perf` 테이블+`lib/usPerf.ts`+`app/api/cron/us-perf` 매일 22시 UTC `vercel.json`+us-list 1년·DB조인+lazy 제거→전기간 정렬; 1일·1년·거래대금=quote 즉시, 1주~6개월=크론 DB) · 412 **헤더=언어 선택기**(시장과 분리, `Header.tsx` useCountryStore 제거, 한국어/English 준비중). **+ KR 링크허브 65→71(MCP 즉시 라이브, `docs/KR_LINK_HUB_CURATION.md`)·`us_stock_perf` 상위 200 데모·Trillion AI 분석 로드맵(`docs/BUSINESS_STRATEGY.md` §3).** **배포 ✓ onetrillion.app 라이브(이번 세션 첫 배포 STEP 404~412).** **📌 370~412 세부는 `docs/SESSION_BOOT.md` 최상단 배너가 최신·정본**(이 PLAYBOOK 본문 §은 312~369 히스토리 보존).
> **HEAD 커밋**: `5cd234d` (STEP 699 — 한국탭 완성도 심화: 🔭 밸류 렌즈 KR 활성화[야후 .KS PER/PBR 미제공→재무 순이익·자기자본으로 직접 산출·`lib/returns.ts` perFrom·pbrFrom]·⚡ ETF/ETN 성과 크론 스냅샷화[`kr_etp_snapshot`·`lib/krEtpSnapshot.ts`·`app/api/cron/kr-etp`·698 거래일 판정·699 Promise.all 동시조회]·미리보기 수익률 단일소스[ranking에 r1w..r1y 통합]·🧪 개발 안전망[`lib/returns.ts`+vitest+`.github/workflows/ci.yml`]. 이전 `f21fa07` STEP 690 — 🔴 브랜드 대개편[3기둥 무기·직시·자립·멍거 목소리·`docs/BRAND_IDENTITY.md`]+"AI 렌즈"→"TR-AI 렌즈"+탭 14→3[종목·정보·검증]+ETF "상품 구성"[Yahoo topHoldings/네이버 etfAnalysis]+광고 수익화 기반[`lib/ads.ts`·`docs/AD_MONETIZATION_PLAYBOOK.md`]+증권사 중립 note. 이전 `fef75ee` STEP 654 — 공시 R1 **US·KR·JP·GB 4개국** 완성[JP=EDINET CSV→한국어·GB=Investegate/RNS→한국어·651 docType 실측 수정·653 Vercel→Investegate 도달성 통과·649 KR 로고 3,578]. 이전 `be86401` STEP 577 — 6개 공용 카드에 표시 헌장 적용[이름 크게·이게 뭐예요 박스·접힘 메뉴]. 앞선 570~573=스크리닝 토대[공용엔진 lensCompute→lens_scores 1000행→매일 크론 · ⚠️스크리너 UI는 안 만듦] · 574=F-Score 실물+표시 헌장[`docs/LENS_DISPLAY_CHARTER.md`] · 🔴576=TRAI 종합 스텁 제거+정체성 결정["AI가 답 주는 앱"❌→"정직한 재료로 사용자 판단"·④TRAI=뉴스 투명 사실 렌즈 FinBERT+8-K로 재정의] · 568=이 기법 방향 층). **배포 ✓ `onetrillion.app`**. (신뢰도 재검 5렌즈 = `5bdf56f`/STEP537 · 다국어+퀄리티 = 546~549 · 주주환원 탈락+자산성장 채용 = 551~554 · 카드 직관화 = 555. **현재 7기법**: 모멘텀·저변동·퀄리티(검증)/밸류·자산성장(표본약함)/F-Score(건전성)/기술(참고). 로스터 = `docs/LENS_ROADMAP.md` · 포지셔닝 = `docs/BUSINESS_STRATEGY.md`)
> **DB**: NEW 전용 프로젝트 `ccbwxcszdoyjxvckedfp`("Trillion", ap-northeast-2). **`link_hub` KR 138·US 67 — ⚠️ MCP 직접 insert, US 미충전.** POTAL ref `zyurflkhiregundhisky`=절대 금지.
> **🏁 렌즈 신뢰도 등급(STEP 525~537 t·샤프·FF알파·비용 재검 — 투자가능 $5+)**: `/api/lens` + `/stock/[symbol]`. 엔진 `lib/lenses.ts`·신뢰도 통계 `lib/backtest_stats.ts`(t·샤프·NW·OLS). **모멘텀=검증·유의**(t≈2.5·샤프0.71·비용/FF3 후 유의; 수익수준은 과대) · **저변동=위험대비 강**(위험18%·알파유의; 수익우위 단정X) · **밸류=정설이나 표본 약함**(βHML0.71·월별 t<2) · **F-Score=수익 신호 아님**(12코호트 t0.70·건전성만) · **퀄리티(GP/A)=검증·유의**(STEP548 t≈2.9·FF3 알파 t≈2.5 독립 프리미엄·저회전; ROE는 대형주 편중 제외) · **기술=참고용·비독립**(RSI 유의 손실·200일선 모멘텀 흡수). 스크립트 `scripts/backtest_*_rigor.ts`·`_alpha.ts`, French `data/ff`(gitignore), 문서 `docs/LENS_DEV_PLAYBOOK.md`(#1~23)·`LENS_STRENGTH_MAP.md`. **다국어 카피 = `lib/lensCopy.ts`(ko/en)·`?lang`·원본 `docs/LENS_COPY.md`.** **핵심: 유의≠수익수준(생존편향 과대·방향만 신뢰)·소표본 유의는 노이즈·무료 방법론 논문급이나 CRSP급 데이터는 벽. 예측 아닌 방향성. 수익화·유료 AI보기(STEP 511 보류)·UX는 계속 뒤로.**
> **▶ 다음 후보 (2026-07-11 기준)**: **STEP③ = 종목보드 코스피/코스닥 분리 세그먼트 토글**(데이터·API 준비됨 · 현재 `MarketBoard`가 `market=all`만 호출) + **상한/하한 배지**(`|changePercent|≥29.5`) → 그다음 **폴리시**(렌즈 KR종목명 영문 반환·지수바 TOPIX 빈값·오래된 주석). (이전 후보) **ETF 증권사 거래연결(수익화)** · **ETN 정제** · **JP/CN/VN/GB ETF 구성**(현재 US·KR만) · **AI 구독(Phase 5)** · **오늘 개편(탭 3개·ETF·브랜드) 모바일 실사용 QA**. (이하 표시 헌장 순서 = 히스토리) ① **6카드 눈검수 + 렌즈별 "이게 뭐예요?" 문구 다듬기**(F-Score가 기준 템플릿) · ② **기법별 유료 레퍼런스 대조**(헌장 §5 — 각 기법 완성 전 GuruFocus·Danelfin·Stockopedia 등과 대조) · ③ **검증된 조합 전략**(가치+모멘텀·방어형 퀄리티·QARP=버핏류·피오트로스키 가치 — "~류 근사" 정직 꼬리표) · ④ 맨 마지막 **뉴스 투명 렌즈**(FinBERT 센티먼트 + 8-K 이벤트를 '사실'로 · AI 결론 아님) · (대기) 미리계산 인프라(`lens_scores` 1000행·크론)로 보드 힌트. **일본어·중국어 카피=사용자 게이트** · 수익화·Phase 2 결제 PG 계속 뒤로. ⚠️ **스크리너 UI·TRAI 종합 결론 = 안 만듦**(사용자 판단권·중립 원칙).
> **🔑 다음 세션 필독 교훈**: Turbopack이 **API 라우트 변경을 자동 갱신 안 함** → 피드/라우트 수정 후 반드시 **`pkill -f "next dev" && rm -rf .next && npm run dev`** 클린 재시작(`lsof kill`만으론 옛 서버 안 죽음). 코드/키 검증은 **MCP(Chrome)·`?debug=1`**로.
> **이번 세션(312~345) 큰 줄기**: 312~317 관리자·신고 모더레이션·디자인 통일 / 318~322 마이페이지 정리·🔴로그인 데드락(`AuthProvider` 콜백 동기+setTimeout, 되돌리지 말 것)·법정 페이지 / 323~331 종목·상품 탭 / 332~333 게이트웨이 정리 / 334~345 우측 피드 8종. 신규 라우트 5종(news·dart·macro·dividend·ipo `/feed`), 컴포넌트 8종. env: `.env.local` NAVER 키 추가·ECOS placeholder→실제 키. DB 스키마 변경 0.
>
> ⚠️ **아래 본문(§1~)은 V6/STEP271 히스토리 — 전부 [이력] 보존용.** 정체성(§1·2 "안 속는 곳"·4박자·Trustpilot)은 **폐기 → 현행 권위 = `docs/BRAND_IDENTITY.md`**(3기둥 무기·직시·자립 · 멍거 톤 · "종목을 보는 눈을, 누구에게나"). 워크플로우·DB 함정(운종 ref `qxkmwlkchyxfzxbonhtj`)만 유효, **페이지·데이터 구조는 무효(현재는 게이트웨이·상단 종목·정보 2탭)**. 현재 상태는 위 최신 스냅샷·`docs/SESSION_BOOT.md` 기준.
> 🆕 **V7 재정렬 (2026-06-06)**: 네이버 복제 → **토스증권 오마주**. 홈 = 토스식 시장 대시보드(주요지수 10개·전일대비·느낌태그·코스피/코스닥 수급) + 하단 마퀴 티커 + 전 페이지 풀폭. 분석 `docs/TOSS_ANALYSIS_AND_IA.md`. **✅ STEP 162 KRX 공식 OpenAPI = 완료**(키 발급+이용신청 7종, 국내 100 공식·일별 `KRX_API_KEY`). 다음 = 링크모음 큐레이션·잔재 정리.
> **빌드 상태**: ✓ exit 0
> **다음 세션 시작 시 첫 번째로 읽는 파일**: 이 파일 + `session-context.md` (TODO GC)
>
> 🔑 **DB 함정 메모**: 운종 전용 Supabase = 표시명 "OT-Marketing", ref **`qxkmwlkchyxfzxbonhtj`**. 절대 쓰면 안 되는 POTAL = ref **`zyurflkhiregundhisky`**. 마이그레이션·쿼리는 반드시 운종 ref 로.

---

## 1. 운종 한 줄 정체성 (V6 — 2026-06-03 · [이력·폐기])

> ⚠️ **폐기 — 현행 아님.** 현행 정체성 = `docs/BRAND_IDENTITY.md`(3기둥 무기·직시·자립 · "종목을 보는 눈을, 누구에게나"). 아래 V6 서술은 히스토리.
> **운종 = "투자상품에 속지 않게 돕는 곳"** — 정확한 정보 + 솔직한 토론 + 검증된 신뢰
> 구조 = 네이버 페이 증권 레이아웃 + 토스 증권 카드 디자인 + Trustpilot 평가 모델 (V5 계승, 중심축만 편의 → **신뢰**). 마스터 비전 `docs/PRODUCT_SPEC_V6.md`.

조선 한양 종로의 옛 이름 **운종가(雲從街)** — "구름처럼 사람이 모이는 거리" — 에서 가져온 이름.

### V6 확정 결정 5개 (LOCK — 2026-06-03)
- **0 정체성 축**: "동선의 출발점(편의)" → "안 속는 곳(신뢰)"
- **① 평가 방식**: 토론 + 추천/비추천 + 사기의심 신고. 별점(star) ❌ — 조작·명예훼손 소송 리스크 회피
- **② 인증 뱃지**: 금융위(금감원) 신고번호 입력 → 자동 검증 → 뱃지. 운영자 임의 부여 ❌ (법적 방패)
- **③ 코인**: 제외 — 한국 주식으로 먼저 완성·증명 후 재논의
- **④ 정보 깊이 단계화**: 시세·차트·공시·뉴스 먼저(캐시) → 재무지표(ROE·부채비율 등 계산) 2단계 → 정밀 스크리너·비교 필터는 외부 링크

## 2. 4박자 핵심 정체성 (신뢰가 중심축) — [이력·폐기]

> ⚠️ **폐기 — 현행 아님.** 4박자(정보·대화·허브·신뢰)·"신뢰 중심축"은 구 정체성. 현행 = `docs/BRAND_IDENTITY.md` 3기둥(무기·직시·자립 · "종목을 보는 눈을, 누구에게나.").

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
> **⚠️ 이 PLAYBOOK 본문(§1~)은 V6/STEP153 시점 히스토리** — 현재 상태는 이 파일 **상단 스냅샷(STEP 345 · `c0b3035`, 2026-06-22)** 및 `docs/SESSION_BOOT.md` 기준.
