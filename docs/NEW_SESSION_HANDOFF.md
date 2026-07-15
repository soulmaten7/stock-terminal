<!-- 2026-07-15 -->
# 🚀 Trillion(트릴리언) — 새 세션 시작 핸드오프

> **이 파일 하나만 읽으면 새 세션이 바로 업무 가능하도록 만든 완전 자급형 문서.**
> 더 깊은 히스토리 = `docs/SESSION_BOOT.md`(배너 누적) · `docs/CHANGELOG.md` · 정책 = `docs/ROADMAP.md` §3.
> **갱신 시점: 2026-07-15 · HEAD `5c0c348` · 앱 배포 ✓ onetrillion.app.** (최신 상세 = `docs/SESSION_BOOT.md`)
> **🆕 2026-07-15 (최신): 🎉 Tier 3: LLM 생성물 영어화 완결 → /en 100% 영어 (HEAD `5c0c348`).** `/en`의 마지막 한국어(LLM 생성물=브리핑 R2·news-brief R3·공시요약 R1)를 영어화. 설계 `docs/TIER3_LLM_I18N_DESIGN.md`(스키마 A `*_en` 컬럼·on-demand·per-locale). **결과=`/en` 로고 빼고 한국어 0**(정적 UI+결정론+LLM 전부 영어·US 영어 시장 제품 완성). **720**(`2645cf9`) `*_en` 컬럼 마이그(MCP) · **721**(`e34fee3`) `/api/brief` R2[프롬프트+lang+`brief_en` on-demand+lens facts 로케일·🐞 `brief_ko` NOT NULL→en-first INSERT 23502→조용한 유료 LLM 누수 될 뻔→DROP NOT NULL+에러로깅] · **722**(`60d5d8b`) `/api/news-brief` R3[+`tags_en`·한국어 강제 후처리(재번역·통화) `ko` 게이팅·옛연도 필터는 양쪽] · **723**(`9329993`) `/api/events/summary` R1 US[`summary_en`·accession 전역캐시] · **724**(`5c0c348`) `kr/jp/cn/gb/vn-events/summary` R1[723 복제·CN/VN 게이팅·통화 원문]. **컬럼 분리(`*_en`)로 캐시 충돌 차단·on-demand 과금·KR byte 동일**(라이브 삼성 공시 ko/en 독립·vitest 43/43). 교훈 `LENS_DEV_PLAYBOOK` #31(additive `*_en`만으론 로케일 독립 안 됨·`*_ko` NOT NULL이 en-first 실패경로·swallowed upsert=조용한 LLM 누수). ▶ 다음(선택)=US 통화기호·빈뉴스 UX·OAuth 로케일 쿠키·다크 폴리시 D·클로즈드 베타. (아래는 히스토리.)
> **🆕 2026-07-14 (5): 🌐 영어 데이터 레이어 i18n(Tier 1+2 결정론) + 브랜드 록업 (HEAD `3cb73ab`).** #86 감사로 발견 = `/en` 정적 UI는 영어인데 데이터/AI 레이어(렌즈명·판정·grade·브리핑·공시라벨·h1)가 한국어. 원인=(A)클라가 `&lang=en` 안 보냄(`lensCopy.ts` 카피는 **이미 이중언어**) (B)일부 하드코딩. **715**(`a393940`) 렌즈 fetch `&lang` 배선[한 줄로 이름·판정·스펙트럼·전망 영어]+grade 이중언어 맵+h1 `info.en`+뱃지 lang · **716**(`36dbed9`) 8-K·F-Score(우량/중립/부실→Strong/Neutral/Weak)·ETF 이중언어+`/api/events` lang캐시 · **717**(`a9d9ad7`) `lenses.ts` detail 키 stable화[한국어가 `L.detail['200일선대비%']` **lookup 키**라 key/label 분리]+DETAIL_LABELS/headline·조회 3곳 동기화 · **718**(`72d4f32`) note 6개 영어[t값·STEP번호 수치 보존]+short/long 이중언어[계산모듈 언어중립 state] · **719**(`3cb73ab`) `/en` 한글 워드마크 "트릴리언" 숨김(헤더·푸터·로그인·ko 병기 유지·SEO alternateName 보존). **🔒 KR byte 동일**=charac red-diff+live `/api/lens?...&lang=ko` SHA 대조로 증명(vitest 43/43). **결과=`/en` 결정론 데이터 100% 영어**, 남은 한국어=LLM 생성물(브리핑·news-brief·공시 AI요약)=**Tier 3**(설계 `docs/TIER3_LLM_I18N_DESIGN.md`·스키마 A `*_en` 컬럼·on-demand·STEP 720~723). 교훈=`LENS_DEV_PLAYBOOK` #30(카피 이중언어면 `&lang`가 최대 레버리지·한국어 리터럴이 lookup 키면 key/label 분리[gauge 조용히 깨짐]·KR 무회귀 charac+SHA 증명). ▶ 다음=Tier 3(720 마이그레이션) or US 잔여(통화기호·IPO)·OAuth 로케일 쿠키·다크 폴리시 D·클로즈드 베타. (아래는 히스토리.)
> **🆕 2026-07-14 (4): 🐛 캐시 stale 버그 3-STEP 완결 — 모든 [locale] 페이지 신선화 (HEAD `d122cac`).** STEP 711 배포 확인(web_fetch) 중 발견 = **`[locale]` 페이지가 캐시 지시자 없으면 무한 정적 캐시로 굳어 배포해도 안 갈아엎어짐** → bare URL이 봇·방문자에 **옛 콘텐츠** 서빙: `/stock/{종목}`=옛 브랜딩("AI 렌즈"·폐기 태그라인·미정리명 "Apple Inc. - Common Stock"), `/about`=**개편 이전 정체성**("정확한 정보·검증된 신뢰"·"속지 않도록"·"흩어진 금융정보"), `/terms`·`/privacy`=**법무 정확화(07-12) 이전** 텍스트. 코드는 전부 현재값인데 라이브만 stale=SEO·규제 리스크(캐시버스터 `?fresh=`로 확정). 원인=`app/[locale]/layout.tsx`의 `setRequestLocale`+`generateStaticParams` 정적렌더 자격 + 페이지 캐시 지시자 누락(홈만 `force-dynamic`이라 신선했음). **712**(`2cd926d`) 종목상세·**713**(`9c4d619`) 정적 8개(about·terms·privacy·toolbox·coin·favorites·feedback·advertise) `force-dynamic` · **714**(`d122cac`) 클라 3개(mypage·auth/login·admin/login)는 `'use client'`라 page의 `dynamic`을 Next가 **무시** → 폴더에 **서버 `layout.tsx` 래퍼**로 세그먼트 강제 동적(로그인 로직 불변·6줄 죽은 dynamic 삭제만·`●`→`ƒ`). 🐞 교훈=(1) `[locale]` 페이지 캐시 지시자 명시(`'use client'`=서버 layout 래퍼) (2) `npm run build`가 실행 중 dev `.next` 밟아 500→클린 재시작. tsc 0·vitest 34/34·전 라우트 라이브 200·/about 새 3기둥·/terms·/privacy 법무 신선. **남은 검증=구글 로그인 실제 왕복(브라우저·ko·en).** ▶ 다음=로그인 왕복 확인·US 잔여(통화기호`$`·IPO·ETN)·OAuth 로케일 쿠키·다크 폴리시 D·클로즈드 베타. (아래는 히스토리.)
> **🆕 2026-07-14 (3): 🔎 US 풀뎁스 P0 — 종목상세 영어 SEO + US 파리티 감사 (HEAD `f647b08`).** **📋 감사(서브에이전트+DB 실측)**: US는 이미 KR 동급이거나 **더 깊음**(레퍼런스 구현) — 배관·종목보드(모바일·뷰복원·렌즈미리보기·크론)·피드 7탭·**link_hub 139**(KR 138·옛 'US 67 미충전'은 낡은 정보)·brokers 17·지수바 완비. US가 KR보다 깊은 곳=렌즈 백분위 게이지(US 전용)·공시 심각도 분류(material/routine)·서학개미 한글명. KR 전용(갭 아님·의도)=코스피/코스닥·상하한·유사투자자문사·유튜브. **유일 실질 갭=종목상세 영어 SEO.** **🔎 STEP 711**(`f647b08`·`app/[locale]/stock/[symbol]/page.tsx` 단일): `generateMetadata`·JSON-LD locale 인지화 → `/en/stock/{symbol}` 영어 title(Stock Price · TR-AI Lens · News · Filings)·description·keywords·OG `en_US`·**hreflang(ko·en·x-default)**·영어 breadcrumb(Home/Stocks). ko는 **byte 동일**(SEO 무회귀·curl 대조)·VN 분기(뉴스만) 보존. **🔑 Opus 스펙교정**: en 페이지에 `${name}`(서학개미 한글명 오버라이드) 쓰면 한글명 영어SEO라 목적 붕괴 → en 분기는 `info.en`(영문명) 주·한글명 보조(ko 무영향·영어SEO엔 영문명 우선). tsc 0·vitest 34/34·빌드 성공. ▶ 다음 US(선택)=P1 통화기호`$`·P2 US IPO 구조화·ETN·(보류) 인라인 증권사 광고=수익화. 그 외=OAuth 로케일 쿠키·다크 폴리시 D·클로즈드 베타. (아래는 히스토리.)
> **🆕 2026-07-14 (2): 🌍 2차 i18n(다국어) 완성 — next-intl `[locale]` 라우팅 + 영어(en) + 언어 스위처 + en→US 시장 디폴트 (HEAD `14c1813`).** 3단계 = 기반(708) → **문자열 이관(709~709F)**(Chrome·Toolbox·렌즈·6보드[Board 공유 dedup]·AdvisorDirectory·피드·사용자 대면 페이지 → `messages/ko.json`·서버 `getTranslations`/클라 `useTranslations`·값 100% 동일·화면 0·제외=props·API·데이터·필터/정규식 키·**DB로 가는 값**[신고사유·intent·slot=label만 번역]·**admin·약관/개인정보 의도적 제외**) → **710A** 라우팅 구조(`70328e8`·ko 단일·`localePrefix:'as-needed'`·화면 0·`i18n/routing·navigation·request`+`proxy`[Supabase 세션 갱신과 합성]+`app/[locale]/*` 이동+generateStaticParams+setRequestLocale·**🐞 next-intl matcher 점(.)규칙이 종목코드 `7203.T`·`0700.HK`·`600519.SS`·`VIC.VN`·`SHEL.L`·`BRK.B`를 정적파일로 오인→해외 5개국 종목상세 전부 404날 뻔→확장자 화이트리스트로 교체**) → **710B** `en.json`(`c8a69b5`·414키 ko와 1:1[누락 0·초과 0]·브랜드 보이스 잠금[슬로건 "An eye for stocks — for everyone."·3기둥 Institutional-grade analysis/Honest data/Your judgment·멍거 각인 원문·"Insufficient data"]·영어 축약형 배제로 ICU 아포스트로피 회피·`messages.test.ts`=키패리티/플레이스홀더/ICU/보이스 영구 vitest·`Login.brandKo`=로고 워드마크라 번역금지[초기 "Trillion Trillion" 버그 수정]) → **710C** 스위처+내부 링크 스왑(`bacacf7`·헤더 언어 드롭다운 오픈+내부 `Link`/`useRouter`/`usePathname`/`redirect`→`@/i18n/navigation`·`useSearchParams`/notFound/외부·광고·mailto/api 제외·**🐞 스위처 쿼리보존 useSearchParams는 전역 헤더에 Suspense 강제→SSG(/about·/terms) de-opt→클릭시 window.location.search 읽기로 우회**) → **710D** 로케일 기능(`7882614`·`homeMarketFor(locale)`[en→US·ko→KR 홈시장 맨앞·기본·저장국가 없는 첫방문만·STEP 703 뷰 복원 무손상]·정적 metadata→`generateMetadata`[로케일 title·og:locale ko_KR/en_US]·JSON-LD 로케일화[hreflang=미들웨어 Link헤더 경로별+홈만 HTML alternates]·youtube 조회수 로케일 나눗셈[만/억↔K/M·Intl compact]). **🅿️ OAuth 로케일 보류(파트4 롤백 `14c1813`)**: `/en` 로그인→콜백이 `/`(ko)로 떨굼·redirectTo에 `?next=/en` 붙이면 **Supabase 리다이렉트 허용목록이 거부→로그인 자체가 죽음**(구글 동의화면도 안 뜸)→파트4만 롤백(1~3 라이브)·**쿠키 방식 수정안 = `docs/PARKED_OAUTH_LOCALE_ACTIVATION.md`**(redirectTo 불변). ✅ tsc 0·vitest 34/34·빌드 성공·`IntlError`/MISSING 0·양쪽 로케일 전수 클릭. ▶ 다음=OAuth 로케일 쿠키 수정·라이브에서 6개국 보드·유사투자자문사·`/en` 클라이언트 뷰 육안·**US 탭 풀뎁스(2차 본목표)**·다크 폴리시 D·클로즈드 베타 초대. (아래는 히스토리.)
> **🆕 2026-07-14 (1): 🌑 다크 테마 3단계 완결 + 🧭 유사투자자문사 정합(라벨·정렬·위치) + 🎓 온보딩(자기설명) + 🖥️ /about 폭 (HEAD `3c2fc8b`).** **유사투자자문 조회 정합**: `48e9802` 패널 '유사투자자문 조회' 제목+문서 [이력·폐기] 배너 마무리 · `e199328` 라벨 '유사투자자문 조회'→**'유사투자자문사'**(금감원 등록업체 목록) · `828e97c` 정렬 상호명 접두어((주)·㈜·(브랜드)) 무시 가나다(`/api/advisors` 전체로드→JS정렬→슬라이스·3뷰) · `f66d77f` 하위탭 증권사→유사투자자문사 · `551d5e1` 메타 keywords 새 정체성(리딩방검증·신뢰평가허브 제거→종목분석·TR-AI렌즈·검증된투자기법). **🎓 온보딩 KR(Option A·자기설명)**(`de58fca`): 헤더 태그라인(lg+)+상단 '소개' 링크(→/about)+LensPreview 문구 또렷("사고팔 신호 아니라 판단할 재료")+/about '이렇게 봅니다' 3스텝·**배너·팝업 없음**·**/about 폭**(`e5c4a97`) 앱 기본(max-w-7xl). **🌑 다크 테마(라이트→다크·안 깨지게 3단계)**: 1/3(`f029d91`) 토큰화(배경전용 `unjong-strong` 신설·`bg-unjong-primary`→strong·`bg-white`→surface·겉모습 변화 0)·2/3(`07fc4bf`) 플립(`app/globals.css` 토큰 값만 다크·background #0A0A0A·surface #17181C·border #2A2C31·`color-scheme:dark`·앱 전체 다크·**라이브 검증**)·3/3(`3c2fc8b`·🔴Opus) 폴리시(앰버 배지·게이지·상태색 다크 대비+구글버튼·StockLogo 실로고원 라이트 유지·레터아바타 이니셜 strong). 근거=미드나잇+민트·헤더 이미 다크·데이터밀도 금융툴 다크 정석·**개선이지 전환 아님**. ▶ 다음=다크 폴리시 D 후속(accent 틴트·shadow-soft)·/about 3기둥 이름 직관화(목업 승인·미적용)·클로즈드 베타 초대(`docs/BETA_INVITE.md` 준비됨)·2차 i18n 스캐폴드(next-intl)→US 풀뎁스·Vercel Analytics Enable(1클릭). (아래는 히스토리.)
> **🆕 2026-07-13: 🎯 종목보드 UX 마감 + 🔵 브랜드 정체성 인앱 정합 + 🧭 nav 2탭 + 🧪 베타 피드백 + 📚 지침 정체성 정리 (HEAD `c0d3b80`).** **종목보드 UX**: 🐞 거래대금 정렬 방향 버그(`(b-a)*dir`→`(a-b)*dir`·6보드·거래대금 최저 잡주가 상단 뜨던 US/JP/CN/VN/GB)·**STEP 703** 뷰 복원(`lib/boardMemory.ts`·렌즈 상세 왕복 시 하위탭·정렬·페이지 유지, 국가전환/새로고침 시 초기화)·PC 우측 TR-AI 렌즈 패널 **sticky**·컨트롤 힌트·색범례 제거·KR 코스피/코스닥 토글 별도 줄(모바일 잘림 해소). **TR-AI 렌즈 정직 표시**: "준비 중"→이유 명시(데이터 부족/네트워크 오류)·재무 없는 종목 "재무 데이터 없음" 행. **🔵 브랜드 인앱 정합**(`e1550f9`): `/about`·`/advertise` 멍거 톤·3기둥·시장중립 카피 + `BRAND_IDENTITY §6` 옛 태그라인 [이력·폐기] + `CLAUDE.md` 개요 재작성. **🧭 nav 2탭**(`c0d3b80`·`ToolboxClient.tsx`): 상단 '검증'→'정보' 하위탭 **'유사투자자문 조회'**(KR 전용)→상단=종목·정보 2탭. **🧪 `/feedback`**(`b39406f`): FeedbackForm+`/api/feedback`(서버 삽입·입력 캡)+supabase `feedback`(RLS on·anon REVOKE)·설문5+별점+연락처·noindex·e2e 검증. **📚 지침 정체성 정리(1차)**: 라이브 문서 옛 프레임("속지 않게"·"안 속는 곳"·신뢰=중심축·4박자·"흩어진 금융정보를 한눈에"·Trustpilot 핵심차별화)→현행 3기둥, `PRODUCT_SPEC_V6/V7`엔 [이력·폐기] 배너. **통신판매업신고=비대상**(무거래 정보서비스·재확인). ▶ 다음=지침 잔여분 마무리 검수·AdvisorDirectory 헤딩 '유사투자자문 조회' 정합·공개 POST rate-limit(Vercel KV)·Sentry 소스맵 AUTH_TOKEN(선택)·Vercel Analytics Enable(1클릭)·1차 출시=클로즈드 베타 초대 발송. (아래는 히스토리.)
> **🆕 2026-07-12 (3): 🛡️ 하드닝 마감(DEFINER 뷰 정리[stock_snapshot_v invoker·advisor_directory=공개 디렉토리 서빙 통로라 DEFINER 유지·라이브 1,553행 검증]·미사용 `/api/ai-analysis` 제거[비인증 OpenAI 과금 구멍]) + 📈 모니터링(Vercel Analytics[⚠️대시보드 Enable 1클릭]·Sentry @sentry/nextjs v10·라이브 에러캡처 검증). 🐞 Vercel `NEXT_PUBLIC_*` 빌드캐시 함정=env 늦게 추가 시 미인라인→'캐시 없이 재배포'로 해결.**
> **🆕 2026-07-12 (최신): 🔒 1차 출시 QA 관문 통과 — RLS 4개 테이블 보안 마감**(`kr_stock_snapshot`·`brokers`·`jp_stock_perf`·`translation_cache`가 RLS off + anon에 삭제·TRUNCATE 권한 → 공개 anon 키로 KR 보드 삭제·위조 가능하던 구멍을 RLS on+anon REVOKE로 봉인·`supabase/migrations/20260712_enable_rls_public_data_tables.sql`·읽기 전부 service-role이라 앱 영향 0·라이브 검증) **+ ⚖️ 법무 정확화**(구글만·개인정보 §11 권익침해 구제) **+ 🔵 태그라인 새 슬로건**(푸터·로그인·소개 "종목을 보는 눈을, 누구에게나.") **+ STEP 700~702**(렌즈 독립배선 아키텍처·KOSPI/KOSDAQ 토글·상하한 배지·1차 폴리시[JP TOPIX 숨김·CN 홍콩만·VN 공시→뉴스]). 커밋 `4ea75a1`·CI 최근 3개 초록. ▶ 다음 = 통신판매업신고 대상 확인(무거래→비대상 유력)+선택 하드닝(모니터링·rate-limit·DEFINER 뷰). (아래는 히스토리.)
> **🆕 2026-07-10: STEP 673~690 + 🔴 브랜드 대개편 — 정체성 3기둥 + TR-AI 렌즈 + 탭 3개 + ETF "상품 구성" (HEAD `f21fa07`).** **🔴 브랜드 정체성 대개편**(`docs/BRAND_IDENTITY.md` 재작성): 3기둥 = **무기**(Arm·TR-AI 렌즈)·**직시**(See·1차 재료)·**자립**(Compete·판단은 당신). 정신적 뿌리 = 프로메테우스·칸트(Sapere aude)·그레이엄·멍거. 목소리 = 멍거 톤(건조·인센티브·"덜 멍청하게"). 가드레일 = "무장하되 벼린다"(칼=명료함이지 대박 아님). 근간 = "예언·추천 안 함, 불을 건넨다, 성공=당신이 우릴 덜 필요로 하게 됨". 확정 슬로건/OG: 타이틀 "전문가 시각으로, TR-AI가 무료로 분석해 드립니다"·설명 "가격은 시장이 붙이고, 가치는 당신이 매깁니다 — 판단은 당신 몫". **682** "AI 렌즈"→**"TR-AI 렌즈"** 명칭 통일(중앙 `AiLensBadge.lensLabel()` 다국어). **광고 수익화**(`docs/AD_MONETIZATION_PLAYBOOK.md` 신설·`lib/ads.ts`): 슬롯 인벤토리+어필리에이트+요금표+언어권 합법성 원장(KR=자본시장법상 퍼블리셔 어필리에이트 없음→직접 광고 제휴·진짜 파이=AI구독+증권사 성과형·리딩방 광고=중심축서 내림). **680·685** 탭 14→**3 재구조**(`ToolboxClient.tsx`): 상단=종목·정보·검증, 나머지 12개(뉴스·공시·리포트·기업재무·거시·ETF·공모주·증권사·차트·거래소·토론커뮤니티·유튜브)="정보" 하위탭·증권사=정보 하위(참조 디렉토리)·검증=상단탭(KR 게이팅)·유튜브=KR 게이팅. 근거=catch-all 금지+빅테크식 최소. **677·681** 미리보기 광고 완전 제거→리스트 10개마다 일원화·태그라인 3곳 새 문구. **678·679** OG/SEO(layout 메타·홈 title override 제거→layout `title.default` 단일 소스)·상하이종합→SSE Composite. **683·684** 증권사 20곳 계열/유형 중립 사실 note(Supabase `brokers.note`·옛 "20년 연속 1위" 대체·SK증권=독립계·이름 옆 `ListRow` meta·PC 너비). **685** 종목 리스트 10개마다 증권사 데모 광고(KR 대신증권·`BrokerAdRow`·`lib/ads.boardBrokerAd`)="거래처 안내"지 투자권유 아님. **686~690 ETF/상품 구성**(`docs/ETF_LENS_PLAN.md`): `/stock/{ETF}`가 기업재무 렌즈 대신 **"상품 구성"** 뷰(상위보유·섹터·보수율·운용사·추종지수)·US=Yahoo topHoldings·KR=네이버 m.stock `etfAnalysis`(키 없음·Vercel 도달 확인)·`lib/instrumentType.ts`·`app/api/etf-holdings/route.ts`·`EtfLensClient.tsx`·미리보기 요약·**영숫자 KRX 코드(0193T0) 인식 버그 수정**·라벨="상품 구성"(AI 분석 아님)·REIT=단일주식·ETN=구성없음. **3중 검수 통과**(코드리뷰 8파일·Supabase 브로커 20/20·라이브 US/KR ETF·브로커 API·홈 3탭/OG·링크 카테고리 전부). ▶ 다음=**ETF 증권사 거래연결(수익화)·ETN 정제·JP/CN/VN/GB ETF 구성·AI 구독(Phase 5)·오늘 개편 모바일 실사용 QA.** (아래는 히스토리.)
> **🆕 2026-07-09 (5th): STEP 668~672D — 보드 성능 스냅샷화 + 데이터 검수 Round 1 + VN HNX 보류(배선 완비).** **성능(668·668B)** 5개 보드(VN·US·CN·JP·GB) 라이브 야후→**크론 스냅샷 DB 서빙**(KR 미러)·즉시화·크론 룩백 400일로 r1y 복구. **검수 Round 1(코드/데이터)**: **669** US 종목명 **SEC `company_tickers.json`로 실명 보강**(placeholder 4,231→55·라이브 quote 제거로 드러남). **670** CN ETF 오태깅=`type` 필드로 주식탭 정화+ETF탭 A주 ETF 종목별 통화(CNY). **VN HNX(671~672D)**: 야후 `.VN`=HOSE전용→**VCI(Vietcap)** 발견(vnstock 소스서 엔드포인트 추출·HNX 커버 확인)→**VCI가 클라우드 IP 지속요청 소프트차단**(Vercel `[]`·GitHub Actions도 일회 프로브만 통과·배치 반복 차단 ⚠️"프로브≠지속" 교훈·로컬/거주지 IP만)→**Yahoo HOSE 403 복구**(672D·보드 정상·VJC 139,000 VND 스케일 정상)+**HNX 보류(배선 완비)**: `scripts/vn_hnx_vci_cron.mjs`(VCI 페처)+`docs/PARKED_HNX_VCI_ACTIVATION.md`(활성화 체크리스트·VPS 거주지 IP 필요). **🅿️ 보류 기능 프로토콜 표준화**(사용자 확정): 막힌 소스=가짜 금지·작동코드 보존+PARKED 문서+원장 기록 → `LOCALE_SOURCE_PLAYBOOK §11`+`CLAUDE.md` 세션종료 체크리스트. ▶ 다음=**데이터 검수 Round 2(Chrome 라이브)·Round 3(교차) + CN #2(A주 소형주 ~1,600)** → 그 후 **한국어 광고**(원 순서: 검수→광고→다국어). ⚠️ cninfo·HKEXnews·지수 Vercel 도달성 최종 실측 잔여. (아래는 히스토리.)
> **🆕 2026-07-09 (4th): STEP 662~667 — UI 리파인 묶음 + 🌍 LOCALE_SOURCE_PLAYBOOK 신설 (HEAD `51e28c3`).** **662** 증권사 독립 탭(BrokerRanking 사이드바 분리→상단탭). **663·663B** 종목보드 우측 레일=**AI 렌즈 미리보기**(`components/toolbox/LensPreview.tsx` 공유·선택종목 렌즈읽기+R2 브리핑[디바운스 700ms]+기간수익률+Next Link CTA)·6개 보드 미러·**663E 모바일 시트도 compact 동일**·인라인 패노라마/증권사 사이드바 제거. **663D** `lib/marketDate.ts`=브리핑·뉴스요약 `as_of` UTC→시장 로컬 타임존 날짜(DB 캐시·하루 1회). **664** 광고 CTA 10행 반복 제거→하단 1개(광고주 0 정직화). **665·665B** 표 반복 AI렌즈 아이콘 컬럼 제거(5열)+클릭힌트·수익률 `1일전…` 통일·브리핑 13px. **666** 지수 티커 6개국(TOPIX·상하이종합 추가·22개·국가 블록 순서+구분선·라이브 확인). **667** 검증 배지 민트→다크틸 AA·빨강/파랑 범례(muted는 이미 AA·라이트 톤 유지). **🌍 `docs/LOCALE_SOURCE_PLAYBOOK.md` 신설** — 언어권 데이터소스 발견·검증·기록 런북("런북=프로그램·LLM=인터프리터"·의미우선 스키마[정체·목적·필수속성·인스턴스]·검증게이트·실패원장·서학개미/6개국 실측 통합·CLAUDE.md 참조 등록·새 locale 착수 전 필독). ▶ 다음=**광고 대화**(진짜 광고 데이터 모델) 또는 **서학개미 relevance 파이프라인**(플레이북 §5·data.go.kr 키 필요). ⚠️ 배포 후 cninfo·HKEXnews·지수 Vercel 도달성 최종 실측. (아래는 히스토리.)
> **🆕 2026-07-08 (3rd): STEP 659~661 — 🇨🇳 CN 공시 완결(A주 cninfo + HK HKEXnews) + R1 (HEAD `4404424`).** **659(`f3fee9b`)** CnEventLayer=**cninfo(巨潮资讯网·증감회 지정 공식 공시)**·isCN — topSearch로 code→orgId(형식 제각각·하드코딩 금지)+hisAnnouncement 목록·온디맨드+캐시. **660(`73dfc9b`)** CnFilingSummary R1=`/api/cn-events/summary`(adjunctUrl PDF→**unpdf** 텍스트추출→중국어→한국어 요약→`filing_summaries`[`CN`+id]·SSRF static.cninfo). 라이브 정확(格力 주주총회). 텍스트 PDF·번역폴백 불필요. **661(`4404424`)** HK=HKEXnews로 `.HK` 공시층+R1 — cn-events에 HK 브랜치(prefix.do JSONP→stockId→titleSearchServlet)+isCN에 `.HK`+summary SSRF에 hkexnews(accession=`HK`+id). **CnEventLayer·CnFilingSummary 재사용**(라벨 동적). **CN 완결 = A주+HK.** **📊 공식 공시 R1 = US·KR·JP·GB·CN(A주+HK).** VN=뉴스 이벤트층+R3(R1 보류). ⚠️ **배포 후 cninfo·HKEXnews Vercel 도달성 실측 대기**(东方財富 IP차단 전례). 🧠 Phase 5 메모=`docs/AI_BRIEFING_SPEC.md`(TradingAgents 참고 강세/약세 병치·지금 적용 안 함). ▶ 다음=**광고(대화 먼저)** 또는 국가 추가(인도·대만). (아래는 히스토리.)
> **🆕 2026-07-08 (2nd): STEP 657~658 — 🇻🇳 VN 공시층(뉴스·이벤트) + VN 마감(R1 소스한계 보류) (HEAD `1b8e1e1`).** **657(`04cae64`)** VnEventLayer=Google News RSS(vi·VN)·isVN — 정찰서 TCBS `tcanalysis` 전경로 404·CafeF AJAX 빈응답(세션필요)·HNX/SSI 도달불가 확인 후 Google News로 대체(재무 키워드 필터·최근 8·10분 캐시). **657B(`5459b0b`)** VN 진짜공시 재도전=Vietstock 공시 AJAX → **NO-GO**(`__RequestVerificationToken`이 JS 렌더 후 삽입·정적 HTML엔 없음→서버fetch 토큰불가) → Google News 유지하되 **정직 라벨**("최근 주요 뉴스·이벤트 · Google News"·뉴스를 공시로 위장 금지). **658(`1b8e1e1`)** VnFilingSummary R1(`/api/vn-events/summary`·구글뉴스→기사 resolve→한국어 요약·`filing_summaries`[`VN`+id]·SSRF·번역 폴백·동₫ 교정) 구현 → **resolve 0%**: 구글뉴스 `<link>` `/rss/articles/CBMi...` = JS전용 디코딩(서버fetch 400·batchexecute 필요)·RSS에 원문 URL 없음, 로컬·Vercel 동일 → 항목별 조용히 숨김(코드 무해·보존). **🏁 VN 마감**(사용자 승인): VN엔 US/KR/JP/GB 같은 공식 공시원문 소스 없음(TCBS 폐기·CafeF 세션·Vietstock JS토큰·구글뉴스 JS디코딩 벽). 베트남 시장 규모 대비 노력상한 → VN=이벤트층(뉴스·이벤트)+R3 한국어 뉴스요약으로 커버, R1 보류(VnFilingSummary 코드는 숨김상태 보존·나중 진짜 소스 생기면 배선만). **공시 R1 공식 = US·KR·JP·GB 4개국 유지.** ▶ 다음=**CN 공시**(cninfo·HKEXnews·⚠️东方財富 IP차단 전례로 **도달성 프로브 먼저**·`docs/NEXT_SESSION_CN_PLAN.md` 먼저 읽고 착수) 또는 광고(대화 먼저). (아래는 히스토리.)
> **🆕 2026-07-08 (최신): STEP 649~654 — KR 종목 로고 + JP·GB 공시 R1 완성(공시층+원문요약). 공시 R1 = US·KR·JP·GB 4개국 (HEAD `fef75ee`).** **649(`52805ab`)** KR 로고=DART 기업개황 `hm_url`→`data/kr_logo_domains.json` **3,578 도메인**(상장 3,922 중 91%)·`lib/avatar.ts` KR=DOMAIN_MAP(손 101 우선)+수집 폴백·보드 실로고 라이브. **650(`1c3dadd`)** JP 공시층=`/api/jp-events`(secCode→jp_disclosures·docType 한국어 라벨)+`/api/jp-events/doc`(EDINET PDF 프록시·키 서버측)+`JpEventLayer`(KrEventLayer 미러)·isJP. **651(`e95017f`)** JP R1=`/api/jp-events/summary`(EDINET 원문 CSV type=5→`fflate` unzip→일본어 본문→gpt-4o-mini 한국어 사실 요약→`filing_summaries`)+`JpFilingSummary`·**docType 실측 수정**(임시보고서=**180**·350/360은 大量保有 노이즈였음·reason은 법조문 코드라 본문 요약 필수). **653(`7a7f3f6`)** GB 공시층=**Investegate/RNS**(정찰: GB엔 EDINET급 공식 무료 종합 API 없음·FCA NSM=정식보고서만·완전성 미달·종합 RNS는 LSEG 상업약관 → 온디맨드+캐시+원문 링크 귀속으로 완화)·`/api/gb-events`(symbol.L→TIDM→`/company/{TIDM}` HTML 파싱→노이즈 필터 Form 8.x·TR-1·PDMR)+`GbEventLayer`·isGB·**Vercel→Investegate 도달성 라이브 통과**(⚠️Barclays 등 대형 금융=Form 8.x 도배로 빈 층·MVP 수용). **654(`fef75ee`)** GB R1=`/api/gb-events/summary`(`{source}-announcement` 본문→gpt-4o-mini 한국어 요약→`filing_summaries`[`GB`+id]·SSRF 방지)+`GbFilingSummary`+MATERIAL 정규식 확장. 라이브 정확(도요타 주총·자기주식·Shell Q2 아웃룩). **656 VN 정찰**(코드 없음): VN도 EDINET급 공식 무료 종합 API 없음 — **TCBS 공개 API(`apipubaws.tcbs.com.vn`) 도달되나 `tcanalysis/v1/ticker/...` 경로 폐기(404)** → 회사-이벤트 엔드포인트 네트워크 캡처 필요/대안 CafeF·Vietstock 서버렌더 스크랩(GB 방식). ▶ 다음=**VN 공시(공시층+R1) — `docs/NEXT_SESSION_VN_PLAN.md` 먼저 읽고 착수**(자급형 실행계획) → CN → 광고(대화 먼저). (아래는 히스토리.)
> **🆕 2026-07-07: STEP 645~648 — 완전성 청산(매매처 DB·JP공시 EDINET) + 헤더 홈 픽스.** **645(`0023fda`)** 매매처 정적→DB(`brokers` 테이블 KR·US·JP·VN·GB 75행 화면 배선·`/api/brokers?region=KR`·**언어권 기준**[한국어=전탭 KR증권사]·정적 폴백·CN만 미보유). **646~647(`0ea7189`·`5d9e90a`)** JP 공시=**EDINET**(금융청 무료 공식 API·키 env)로 "무료소스 없어 보류" 룰위반 청산·`jp_disclosures`+`lib/edinet.ts`+크론 미리계산(회사필터 없어 날짜별)·**라이브 12,466건·2,148개사·臨時報告書 2,260건**·도요타(72030)/소니(67580) 有報·臨時報告書 확인·dedup(doc_id) 픽스로 45일 백필 완결. **648** 헤더 로고/'주식'→홈(한국탭·종목·상품·주식) 완전 리셋(resetHome 국가KR+탭market·ToolboxClient n 구독). **⚠️ env 교훈: `.env.local`=로컬 전용, 프로덕션은 Vercel 대시보드 등록+재배포 필요.** ▶ 다음=JP STEP 649(JpEventLayer+R1 요약 UI)·완전성 GB(RNS)→VN→CN·광고. (아래는 히스토리.)
> **🆕 2026-07-07: STEP 635~643 — 🔍 한국어 SEO 완결(종목 SSR·사이트맵·구조화데이터 + 구글·네이버 등록 + 해외 한글명 121종) (HEAD `6c5e9d7`).** 봇 실측 진단(클라렌더→봇엔 코드만·회사명 없음·메타 루트공통·JSON-LD 0·sitemap 정적5) → **635** `generateMetadata`(종목명 유니크 title/desc/canonical/OG)+`lib/stockName.ts`(KR=`kr_stock_snapshot`·해외=번들 JSON)+h1 SSR 이름주입+JSON-LD(Breadcrumb+Corporation)·page.tsx→`StockLensClient.tsx` · **636** 사이트맵 정적5→약 21,800 URL · **637** 홈 Organization+WebSite JSON-LD · **638→639** 하이드레이션 후 `/api/lens`(야후 영문)가 h1을 "SamsungElec"로 덮던 문제→**h1 `initialName||data.name`(SSR 네이티브 유지)**+US "Common Stock" 잡음 제거. 라이브 재검증 통과(삼성전자·SK하이닉스·トヨタ自動車·Apple Inc.). ▶ 다음=구글 서치콘솔 sitemap 제출→한국어 광고. (아래는 히스토리.)
> **🆕 2026-07-06: STEP 622~630 — 🇻🇳 베트남 탭 + 🇬🇧 영국 탭 완성(빠짐없이) + 완전성 원칙 (HEAD `3f38f33`).** 언어권 거미줄 로드맵대로 한국어권 국가 확장. **🇻🇳 VN**: 링크49·배관(vi·₫)·보드(HOSE 387·야후 `.VN`·vnstock 유니버스+베트남어명)·**지수바 VN-Index/VN30(야후 미커버→VnDirect dchart)**·매매처13·R3(`vn_names`·vi·3중 검수). **🇬🇧 GB**: 링크46·배관(en-GB·펜스)·보드(FTSE 350·349·야후 `.L`·Wikipedia 유니버스+영문명)·**지수바 FTSE 100/250**·매매처12·R3(`gb_names`·en-GB·3중 검수). **🔴 완전성 원칙 못박음**(CLAUDE.md+플레이북 §0): 새 탭 착수 전 플레이북 재독·**MVP≠축소·DoD 전 항목(지수바·매매처) 빠짐없이**·소스 막히면 대체 찾아서라도(야후 없으면 vnstock·VnDirect·텐센트·Wikipedia). **국가탭: US·KR·JP·CN·VN·GB = 6개국 · R3 전부 네이티브.** ▶ 다음=한국어권 마무리(디테일+한국어 SEO+광고→한국어판 MVP) 또는 국가 더(인도·대만). (아래는 히스토리.)
> **🆕 2026-07-06: STEP 612~620 — CN R3 + JP·CN 네이티브 종목명(진짜 자국어 검색) + 4개국 R3 3중 검수 (HEAD `55c94df`).** 야후 영어명 탓에 ja/zh가 실은 영어검색이던 문제 → **JP=JPX `jp_names` 4,014종목(일본어명)** · **CN=`cn_names` 7,095행(HK 3,227 HKEX 번체·zh-HK + A주 3,868 텐센트 qt.gtimg 간체·zh-CN)**. **东方財富이 KR·데이터센터 IP 차단→텐센트 우회(GBK).** 3중 검수로 **KR NAVER 빈요약(영문명→블로그 잠식)=`lib/krName.ts` 별칭(035420→네이버)** · **통화 오표기(엔←원)=결정론 후처리(JP 원→엔·CN 원→위안)** · 회사명 CJK=한글화 프롬프트 수정. **국가별 AI: US·KR R1·R2·R3 완전체 / JP·CN R3 네이티브 완성. 4개국 R3 3중 검수 통과.** ▶ 다음=베트남 탭 / 전 국가 추가 검수 / SEO. (JP·CN 공시 R1·R2=무료 실시간 소스 없어 보류.) (아래는 히스토리.)
> **🆕 2026-07-06: STEP 600~611 — 'AI 렌즈' 브랜딩·발견성 + KR AI 확장(R2·R3) + JP R3 뉴스 (HEAD `b2079b7`).** 옛 'TRAI'→**'AI 렌즈' 박스 배지**("기법별 전망" 제거) · 종목 뒤로=`router.back()`+**시트 URL 복원**(`useSheetSync`) · **AI 렌즈 발견성 표식**(현재가↔1일전·PC 컬럼/모바일 헤더라벨+행 아이콘) · **KR=R1·R2·R3 완성**(R2 DART 공시·R3 한글명 ko·짜깁기 금지·`cf22aba`) · **JP=R3 뉴스**(야후 일본명 ja·요약 한국어 번역 폴백·옛연도 문장 삭제·60일 최근성·`b2079b7`). **국가별 AI: US R1·R2·R3 / KR R1·R2·R3 / JP R3 / CN 미착수.** R4(Q&A)=영구 보류(어드바이저=포지셔닝 밖+무료 상충). 🔒 규칙=Claude Code 3회 반복+Cowork MCP 실물 재검수. **교훈: JP 뉴스는 야후 영어명·구글 옛기사 재순환 탓에 프롬프트 2회 실패→결정론 코드 후처리로 확정.** ▶ 다음=CN R3 / SEO — **JP 공시=보류 확정**(무료 실시간 소스 없음·R3 대체). 국가 확장은 승인 후. (아래는 히스토리.)
>
> **🆕 2026-07-06: STEP 584~589 마감 + 🔴 AI 브리핑 레이어 전략·설계 확정 (HEAD `3f4b647`).** 종목 페이지 "AI LENS" 명명·전문가 톤·정직 보이스(584~589) + **AI(LLM) 브리핑 레이어 R1~R3 + 접근/수익 대전환**. LLM=비정형 텍스트를 사실로만(점수·예측 X). **R1** 공시요약·**R2** 브리핑(핵심 긴장+지켜볼것)·**R3** 뉴스·R4 안 함. **AI 브리핑 무료·공개(구독 폐기)=SEO/글로벌 엔진 · 로그인=개인화(즐겨찾기·알림)만 · 수익=광고/디렉토리/제휴.** 뉴스 감성 팩터 기각·추정치 렌즈 보류. 마스터=`docs/AI_BRIEFING_SPEC.md`·전략=`BUSINESS_STRATEGY` 07-06. **🎉 US(R1+R2+R3) 확정 + KR 공시층·R1-KR 완료 (595~598·HEAD 24b3438). 3라운드 검증+Cowork MCP 재검수 통과·R3 밸류 누수 차단. 🔒 규칙=Claude Code 3회 반복검증+Cowork MCP 실물 재검수. ▶ 다음=다른 국가탭(R2-KR·R3-KR·JP/CN)은 사용자 승인 후.** (아래 07-03 이하는 히스토리.)**
>
> **🆕 2026-07-03 (직전): 렌즈 페이지 표현 개편 + 제품 포지셔닝 확정(STEP 539~544).** 검증된 5렌즈를 정직하게 보여주는 UI: 영문 정식명칭+한글 요약 · "{기법} 알아보기"(개념·유래) · "자세히"(검증) 접기 · 단일 열·홈 너비 통일 · **TRAI**(민트 T) 리브랜딩 · 밸류 라벨 verdict 제거(낮음/보통/높음) · **신뢰도 등급 배지**(검증/표본약함/건전성/참고용) · **기법 엇갈림 표시**(모멘텀×밸류 성향). **제품 정의**: 예측 아님 — 검증된 렌즈들의 읽기 + 신뢰도, 선택은 사용자, 엇갈림=정보(`docs/BUSINESS_STRATEGY.md` 결정 로그) · 종목 데이터 허브=안 만듦(commodity). **3단계**: ①정직화(밸류 완료) →②UI 틀(등급·엇갈림 완료) →③새 기법(퀄리티→마법공식→주주환원, `docs/LENS_ROADMAP.md`). **▶ 다음 = 배포+모바일 눈검수 · ③ 퀄리티(QMJ) 착수.** (수익화·유료 TRAI 계속 뒤로.)
> (직전 2026-07-02: STEP 525~537 신뢰도 업그레이드 사이클 — 5렌즈 t·알파 재검, 모멘텀=검증·저변동=위험대비·밸류=표본약함·F=수익신호아님·기술=참고용.)
> (직전 2026-07-02: STEP 510~523 무료 렌즈 5종 판정 완결.)
> (직전 2026-07-01: US 링크 67→139 · US 피드 파리티 · KR 종목 딜레이 제거 · KR/US 모바일 개편.)

---

## 1. Trillion이 뭔가 (정체성 — 2026-07-10 대개편)

- **사업자**: 원트릴리언 · 대표 **장은태** · 사업자번호 **210-39-33812** · 도메인 **onetrillion.app** · 문의 contact@onetrillion.app.
- **정체성 3기둥 (`docs/BRAND_IDENTITY.md` 재작성)** = **무기**(Arm — TR-AI 렌즈로 전문가 시각을 무료로 쥐여줌) · **직시**(See — 가공 아닌 1차 재료를 그대로) · **자립**(Compete — 판단은 당신 몫). 정신적 뿌리 = 프로메테우스(불=지식)·칸트(Sapere aude)·그레이엄·멍거. **목소리 = 멍거 톤**(건조·인센티브·"덜 멍청하게"). 가드레일 = "무장하되 벼린다"(칼=명료함이지 대박 아님). 근간 = **"우린 예언·추천 안 함, 불을 건넨다, 성공=당신이 우릴 덜 필요로 하게 됨."**
- **확정 슬로건/OG (§0)**: 타이틀 **"종목을 보는 눈을, 누구에게나."** · 설명 "모든 시각을 데이터로. 예측도 추천도 없이, 판단은 당신입니다." · 각인 = 찰리 멍거. (옛 "전문가 시각으로 TR-AI가 무료로 분석" 태그라인은 [이력·폐기] · `BRAND_IDENTITY §6`.)
- **하는 일** = 기관급 분석 기법(**TR-AI 렌즈**)을 개인 손에 + 1차 재료(시세·뉴스·공시)를 정직하게 데이터로 → 판단은 사용자. **장기 메인 수익 = AI 구독**(Phase 5, 미착수) + 인리스트 광고·유사투자자문 조회 디렉토리.
- ⚠️ **옛 정체성은 [이력]로 폐기**: "투자상품에 안 속게 돕는 신뢰"(운종)·"흩어진 금융정보를 한눈에" 단독 태그라인·신뢰=중심축·정보/대화/허브/신뢰 4박자는 더 이상 프레임 아님(`docs/BRAND_IDENTITY.md` 권위). 유사투자자문 조회(옛 '검증')는 '정보' 하위탭의 한 surface.
- **거래 X** (정보·허브·링크 연결만). **대화/토론도 전면 제거됨**(다시 넣지 말 것).
- 디자인 = 미드나잇 `#0E1116` + 민트 `#2DD4BF`. 코드 식별자는 `unjong-*`(리브랜드 전 잔재, 유지).

## 2. 지금 상태 (2026-07-10)

- 최신 코드 **HEAD `f21fa07` = STEP 690**(🔴 브랜드 대개편 + 탭 3개 + ETF "상품 구성"), origin/main 동기화·**앱 배포 ✓ onetrillion.app.**
- **🧭 상단 탭 3개 = 종목 · 정보 · 검증** (STEP 680·685). 나머지 12개(뉴스·공시·리포트·기업재무·거시·ETF·공모주·증권사·차트·거래소·토론커뮤니티·유튜브)는 **"정보" 하위탭**. 증권사=정보 하위(참조 디렉토리)·검증=상단(KR 게이팅)·유튜브=KR 게이팅. (`ToolboxClient.tsx`)
- **📦 ETF/펀드 = "상품 구성" 뷰** (STEP 686~690): `/stock/{ETF}`가 기업재무 렌즈 대신 상위보유·섹터·보수율·운용사·추종지수. US=Yahoo topHoldings·KR=네이버 `etfAnalysis`. REIT=단일주식·ETN=구성없음. `lib/instrumentType.ts`·`app/api/etf-holdings/route.ts`·`EtfLensClient.tsx`.
- **🏦 증권사 20곳 중립 사실 note** (STEP 683·684): Supabase `brokers.note`(계열/유형·옛 홍보 대체)·이름 옆 표시·PC 너비. 종목 리스트 10개마다 증권사 데모 광고(KR 대신증권·`BrokerAdRow`).
- **🔬 종목 분석층 = TR-AI 렌즈** (STEP 682, 옛 "AI 렌즈" 개명·중앙 `AiLensBadge.lensLabel()` 다국어). 6개국(US·KR·JP·CN·VN·GB) 종목보드+공시층+R1~R3 AI는 종전 완성 상태 유지.
- **🏁 무료 AI 렌즈층 완결(2026-07-02)** — `/stock/[symbol]` 렌즈 전부 백테스트 판정(투자가능 $5+): 모멘텀·저변동·F-Score·밸류(E/P) ✅검증 / 기술 ⚪참고용. 검증 스크립트·플레이북·적합영역 지도 = durable 자산.
- **KR 종목 로딩 딜레이(~10초) 해결** — `kr_stock_snapshot` 크론 미리계산 서빙(STEP 474). 스냅샷 **2,769행 시딩 완료**(기준일 20260630). 화면=스냅샷 즉시 SELECT, 비면 라이브 fallback.
- **KR·US 종목표 모바일 개편 완료** — 카드형(종목명/티커 강조·현재가 축소) + 바텀시트 스냅포인트(50/66vh·overscroll 차단) + PC 동일 정렬 헤더(종목명·현재가·기간 커스텀 드롭다운). `MarketBoard`·`UsMarketBoard` 둘 다.
- **US 탭 피드 파리티** — 뉴스 대표이미지 + 기업재무·리포트·ETF·공모주 모아보기(Google News 토픽, STEP 473). ✅ **prod 라이브 검증 완료(2026-07-01)**: onetrillion.app에서 Google News 정상 반환(Vercel IP 차단 없음)·뉴스 이미지 O·KR ranking `source:"kr_snapshot"` 680ms.
- **AI·광고 빼면 KR 탭 = 베타 가능 수준.**
- **🆕 2026-07-01: US 링크 허브 풀충전 완료** — `link_hub` US **67→139**(미국 자국 기준, 10개 카테고리 전부 KR 동급). onetrillion.app US 뉴스 탭 라이브 검증 완료. US 탭도 KR 수준 정보 밀도 확보. (코드 변경 없음·DB 직접이라 배포 불필요.)

## 3. 아키텍처 / 스택

- **Next.js 16 App Router** (Turbopack, dev 포트 **3333**) · **Tailwind v4** · **Zustand**(`countryStore`·`authStore`).
- **Supabase** = `@supabase/ssr`, 프로젝트 **"Trillion" `ccbwxcszdoyjxvckedfp`** (ap-northeast-2). server/browser client + admin client(SERVICE_ROLE, RLS 우회).
  - ⚠️ **POTAL ref `zyurflkhiregundhisky`는 절대 금지** (다른 프로젝트). 구 `qxkmwlkchyxfzxbonhtj`("OT-Marketing")도 폐기.
- **Vercel 크론**(`vercel.json`): `fss-advisors`(매일 19시 UTC — 금감원 신고 갱신, "매일 갱신" 근거) · `youtube-refresh`(주간) · `us-perf`(매일 22시 UTC — US 기간 수익률 미리계산).
- **홈(`/`)** = `app/page.tsx`(서버, `force-dynamic`) → `ToolboxClient` 게이트웨이. 국가 토글(KR/US) + 세부 탭.
- 로그인 = 구글 OAuth(Supabase). `/admin` 별도 로그인 게이트(`/admin/login`, role 체크).

## 4. 탭 구조 (상단 3탭 · 2026-07-10 재구조 STEP 680·685)

상단 탭 = **종목 · 정보 · 검증** (`TAB_ORDER` in `ToolboxClient.tsx`). 옛 14탭 catch-all 폐기(네이버·다음·야후 관행) → 빅테크식 최소·직관.

| 상단 탭 | 내용 |
|---------|------|
| 📊 **종목** | KRX/6개국 실데이터 보드 + 우측 레일 TR-AI 렌즈 미리보기 + 리스트 10개마다 증권사 광고. ETF/펀드 클릭 = **"상품 구성"** 뷰 |
| 📰 **정보** | 하위탭 = 뉴스 · 공시 · 리포트 · 기업재무 · 거시 · ETF · 공모주 · **증권사**(참조 디렉토리) · 차트 · 거래소 · 토론커뮤니티 · 유튜브(KR 게이팅) |
| ✅ **검증** | 리딩방·유사투자자문 검증(금감원 등록·신고 사실 + 누적 관심) — KR 게이팅 |

- **헤더 자산군 탭**: `주식`(활성) · `코인`(준비중 — 클릭 시 "준비 중이에요" 팝오버, 페이지 이동 X).
- 특수탭(종목·상품·유튜브·리딩방)=라이브 데이터라 라벨이 코드(`SPECIAL_LABELS`). 나머지=`app/page.tsx` `CATEGORY_LABELS`.
- 종목·상품: KRX 실데이터 ~2,600(+US·JP·CN·VN·GB) + 정렬·검색·페이지네이션·관심⭐ + **데스크탑 행 클릭 → 1일~1년 수익률·TR-AI 렌즈 미리보기**(모바일=하단 시트).
- 피드 탭(뉴스·공시·리포트·기업재무·거시·ETF·공모주): 좌 큐레이션 링크 + 우 라이브 피드. 모바일은 서브탭 `[모아보기 | 링크모음]`.

## 5. DB 데이터 현황

- **`link_hub`**: **KR 138(active) · US 139(2026-07-01 풀충전 완료).** ⚠️ **MCP 직접 insert로 채움 — 마이그레이션/git에 없음!** US는 미국 자국 기준으로 KR 동급 충전 완료(10 카테고리 전부). ⚠️ DB 백업/이전 시 `link_hub`는 git에 없으므로 별도 export 필수.
- **`fss_advisors`** 1,804행(금감원 유사투자자문 신고, 크론 매일 갱신) — 리딩방·검증 탭의 주체 데이터.
- **`youtube_channels`** 100(주간 크론). **`us_stock_perf`** 상위 200 데모(전 종목은 prod 크론 자동).
- **`ad_inquiries`**(광고 문의, RLS 서비스롤) · **`business_*`** 4테이블(업체 클레임·인증·채널·게재) + `business-docs` 버킷 · `link_previews`(OG 캐시 999).
- **테스트 데이터 전부 정리됨**(business_*·ad_inquiries = 0). soulmaten7 = admin role.

## 6. 수익 모델 (현재/미래)

- **리딩방 게재(도메스틱)**: 인증 업체당 **무료 1채널** + **추가 채널 ₩5만/월**. 단위=채널(연결 링크), 독립 행(교차연결 X — 독립이 추가 결제 동기). `business_links.expires_at` 만료 시 자동 비공개.
- **광고 문의(`/advertise`)**: 슬롯 `broker`(종목·상품)·`room`(리딩방)·`feed`(콘텐츠 피드) → `ad_inquiries`. 관리자(`/admin`)에서 처리(연락함=템플릿 mailto).
- **광고 슬롯 노출**: 리스트 **10개 이후마다**(맨 위 광고 없음 — STEP 469).
- ⚠️ **결제는 전부 UI만 만들어둔 stub — 기능 미구현(Phase 2a 의도적 보류).** PG 붙이기 전 **법률자문 + 통신판매업 신고 + 정기결제 약관 + 환불·세금** 필요.
- **장기 메인 수익 = AI 구독(Phase 5).** 광고·채널 게재는 부차(생존). 결제 레일은 리딩방+AI 구독 **공용**(한 번 만들어 두 번 씀).

## 7. 워크플로우 (⚠️ 중요 — 역할 혼용 금지)

- **Cowork(나) = 두뇌**: 대화·설계·결정 + 코드/명령어/문서 **작성**. DB 변경(링크 등)은 Supabase MCP로 직접. **실행·빌드·git은 안 함.**
- **Claude Code = 손**: Cowork이 만든 STEP/명령어 **실행**, 빌드 확인, git commit/push.
- **STEP 파일 방식**: Cowork이 `docs/STEP_N_COMMAND.md` 작성 → 사용자가 Claude Code에 `@docs/STEP_N_COMMAND.md 파일 내용대로 실행해줘`.
- **Claude Code 실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Opus는 Cowork이 🔴 표시한 복잡한 디버깅/리팩토링만).
- 🔑 **Turbopack 함정**: **API 라우트·서버 컴포넌트(`page.tsx`·`CATEGORY_LABELS` 등) 변경을 자동 갱신 안 함** → 라우트/서버 수정 후 반드시 클린 재시작: `pkill -f "next dev"; rm -rf .next && npm run dev`. **클라이언트 컴포넌트는 HMR로 즉시 반영.**
- **DB 변경(링크·데이터)은 즉시 라이브** — 코드 아니라 배포 불필요(prod도 같은 Supabase).
- **배포/푸시는 사용자가 명시적으로 "커밋/배포해"라고 할 때만.**
- 검증은 Chrome MCP(`navigate`+`get_page_text`/`screenshot`)로 localhost:3333·onetrillion.app 직접 확인.

## 8. 보안 경계 (Cowork이 못 하는 것)

- 키·비밀번호·토큰·SERVICE_ROLE·CRON_SECRET·PG 키(토스 빌링)·data.go.kr 키 **입력/취급 불가.** 비밀은 **사용자 → `.env.local` → 서비스**. 코드는 `process.env.X` 참조만.
- 결제 실행·금전 이동 불가. 권한/공유 설정 변경 불가. 영구 삭제 불가.

## 9. 핵심 파일 맵

| 영역 | 파일 |
|------|------|
| 홈/게이트웨이 | `app/page.tsx`(`CATEGORY_LABELS`·`CATEGORY_ORDER`) · `components/toolbox/ToolboxClient.tsx`(`TAB_ORDER`·`CLUSTER_START`·피드맵·국가가드) |
| 종목 표 | `components/toolbox/MarketBoard.tsx`(KR) · `UsMarketBoard.tsx`(US) |
| 리딩방·검증 | `components/toolbox/AdvisorDirectory.tsx`(3뷰 탭·채널 단위) |
| 유튜브 | `components/toolbox/YoutubeRanking.tsx` |
| 광고 슬롯 | `components/toolbox/AdSlotRow.tsx`(slot broker/room/feed) |
| 헤더 | `components/layout/Header.tsx`(`MENU` 주식/코인·언어선택·프로필) |
| 광고 문의 | `app/advertise/` + `components/advertise/AdInquiryForm.tsx` |
| 관리자 | `app/admin/`(탭형) + `app/admin/login/` |
| 업체 인증 | `components/business/` + `/business` |
| 문서 | `docs/SESSION_BOOT.md`(상세) · `docs/CHANGELOG.md` · `docs/ROADMAP.md`(정책§3) · `session-context.md`(TODO) · `CLAUDE.md`(지침) |

## 10. ▶ 다음 작업 (우선순위 · 2026-07-10)

1. **ETF 증권사 거래연결(수익화)** — "상품 구성" 뷰(STEP 686~690)에 증권사 거래 링크/제휴 붙이기(오늘은 상품 정보만·수익화는 별도로 미룸).
2. **ETN 정제 · 비KR ETF 구성 확장** — ETN=구성없음 전략 노트 정리 + JP/CN/VN/GB ETF "상품 구성"(현재 US·KR만).
3. **오늘 개편 모바일 실사용 QA** — 탭 3개·ETF 상품 구성·증권사 note·TR-AI 렌즈를 실제 폰/Chrome 반응형으로 눈검수.
4. **Trillion AI (Phase 5)** — 종목분석/브리핑/요약 구독형(장기 메인 수익). 전제: 유사투자자문업 신고+법률자문.
5. **Phase 2 결제** — 토스페이먼츠 빌링/구독(`subscriptions`·`billing_events`)+빌링키 정기결제+webhook. 전제: 토스 가입+법률자문+통신판매업. (AI 구독과 결제 레일 공용.)
6. (대기) 데이터 검수 Round 2/3(Chrome 라이브·교차) · cninfo·HKEXnews·지수 Vercel 도달성 최종 실측 · CN #2(A주 소형주 ~1,600).

## 11. 이번 세션(2026-07-01) 한 일 — 요약

- **US 링크 `link_hub` 67→139** (미국 자국 기준·MCP 직접·라이브 검증).
- **STEP 473** — US 탭 피드 파리티: 뉴스 대표이미지(og:image) + 기업재무·리포트·ETF·공모주 모아보기(Google News 토픽·키리스). `route.ts`·`NewsFeed`·`ToolboxClient`.
- **STEP 474** — KR 종목 딜레이 제거: `kr_stock_snapshot` 테이블(MCP 생성) + `/api/cron/kr-perf` + `ranking`/`kr-performance` 스냅샷 우선 서빙 + vercel 크론(10 UTC). **2,769행 시딩 완료** → 로딩 10초→즉시. `lib/krSnapshot.ts`.
- **STEP 475·477·478** — KR 종목표 모바일: 카드형(종목명 강조·현재가 축소) + 바텀시트 스냅포인트(50/66vh·overscroll) + PC 동일 정렬 헤더(기간 커스텀 드롭다운). `MarketBoard.tsx`.
- **STEP 476** — US 종목표 모바일 동일 미러. `UsMarketBoard.tsx`.
- **`docs/COUNTRY_TAB_PLAYBOOK.md` 신설** — 국가 탭 표준 틀(구성요소·touch-point·DoD·구현순서·6개국 소스 매트릭스) + §4-2 성능/모바일 전 국가 표준.
- ✅ **prod 라이브 검증 완료**: onetrillion.app에서 Google News(Vercel IP 차단 없음)·뉴스 이미지·KR 스냅샷 680ms 정상. ▶ 다음 = 일본 탭.

---

## 12. 🌍 멀티 국가 탭 전략 — US 완성 → 일본·중국·… (2026-06-30 사용자 확정 방향)

> 🧭 **새 국가 탭을 만드는 표준 틀·touch-point 체크리스트·완성기준(DoD)·구현순서·6개국 소스 매트릭스 = `docs/COUNTRY_TAB_PLAYBOOK.md`** (2026-07-01 신설). **새 국가는 반드시 이 플레이북대로** 찍어낸다(오차 최소화). 아래 §12-1~12-3은 방향, 플레이북은 실행 틀.

### 12-1. 핵심 원칙: 각 국가 탭 = 그 나라 "자국 시장 기준" (⚠️ KR 미러 아님)
- 각 국가 탭은 **한국 시장 기준이 아니라 해당 국가 자국 기준**으로 구성한다. (US=미국 리테일/전문가가 실제 쓰는 것, JP=일본 현지 기준 …)
- 한국에서 안 보이거나 **영문/현지어 전용이어도 넣는다** — 오히려 그 나라 현지인이 쓰는 디테일한 사이트일수록 가치. **"한국에서 잘 안 쓰니 빼자"는 금지 — 다 넣는다.**
- **근거 ① (번역 시대)**: 번역이 쉬운 시대 → 영문/현지어 사이트도 사용자에게 무조건 이득.
- **근거 ② (AI 무기)**: 미래 **Trillion AI**가 해당 종목/상품에 모든 주식 분석 기법을 적용할 때, 이 디테일한 현지 소스들이 **빠짐없는 데이터 무기**가 된다.
- **탭 라벨은 한국어 유지**(미국·일본·중국…), 콘텐츠만 자국 기준.

### 12-2. US 완성 ✅ 완료 (2026-07-01)
> **결과: `link_hub` US 67→139 충전 완료.** 카테고리별(기존→현재): analysis 8→14 · chart 6→12 · community 6→13 · disclosure 6→13 · etf 5→12 · exchange 5→13 · ipo 7→12 · macro 8→18 · news 8→18 · research 8→14. 추가 대표 예: (기관) SEC·FINRA·Fed·CFTC·OCC·SIPC·DTCC·IEX·MSRB EMMA · (공시) OpenInsider·WhaleWisdom·Fintel·BamSEC·Capitol Trades·Quiver Quantitative·FINRA BrokerCheck · (뉴스) Motley Fool·Investopedia·Business Insider·Forbes·Fortune·TheStreet·IBD·Kiplinger·CNN Business·Axios · (거시) FOMC·ISM·Conference Board·U.Michigan 심리·Atlanta Fed GDPNow·NY Fed Nowcast·EIA·Yardeni·Treasury Direct · (ETF) VettaFi·ETF Research Center·Portfolio Visualizer·iShares·Vanguard·SPDR·Invesco · (분석) Simply Wall St·Finbox·YCharts·Fiscal.ai·Value Line · (리서치) Nasdaq Earnings·StreetInsider·AAII·Stock Rover·Validea·AlphaSpread · (차트) Google Finance·Webull·TC2000·Trade Ideas·ChartMill·BigCharts · (배당/IPO) Stock Analysis IPO·Sure Dividend·DRIP Champions·Nasdaq Dividend Calendar. ⚠️ 웹검색 검증 결과 QuickFS(서비스 종료)·SPACInsider/Econoday/ADP(미확인)는 제외.
- 종목 데이터는 이미 US 라이브(Yahoo·`us_stock_perf` 크론) — 링크 허브까지 자국 기준으로 채워 US 4기둥(시세·정보·거시·공시) + 허브 완성.
- **US 고유 사이트 후보**(카테고리별 · 미국 기준):
  - 공시/규제: SEC EDGAR · FINRA · 13F 트래커(WhaleWisdom·Fintel) · Form4 인사이더
  - 시세/차트/데이터: Yahoo Finance · Google Finance · TradingView · Finviz · Koyfin · Barchart · StockCharts · MarketWatch
  - 뉴스: Bloomberg · CNBC · WSJ · Barron's · Reuters · Benzinga · The Motley Fool
  - 분석/리서치: Seeking Alpha · Morningstar · Simply Wall St · Zacks · TipRanks
  - 어닝/캘린더: Earnings Whispers · Nasdaq Earnings Calendar
  - ETF/펀드: etf.com · ETFdb(VettaFi) · Morningstar
  - 거시: FRED · BEA · BLS · U.S. Treasury · Federal Reserve
  - 커뮤니티: Reddit(r/stocks·r/wallstreetbets·r/investing) · StockTwits
  - 거래소/기관: NYSE · NASDAQ · CBOE · OCC · SIPC
  → KR과 동일 방식(웹검색 도메인 검증 → Supabase MCP insert·즉시 라이브). 카테고리 슬러그는 KR 셋 재사용 가능하되 US 특성에 맞게 조정.

### 12-3. 멀티 국가 로드맵 (시장 선정 — 1차 분석 · ⚠️ 다음 세션서 현재 데이터로 검증)
선정 기준: ① 시장 규모(시총·거래대금) ② 한국 리테일 관심·접근성(서학개미 보관액·순매수 상위국) ③ 현지 정보 사이트 풍부도 ④ AI 분석 활용가치.

| 순위 | 시장 | 이유 |
|------|------|------|
| 1 | 🇺🇸 미국 | 글로벌 시총 압도적 1위(~절반), 서학개미 최대 집중. **진행 중.** |
| 2 | 🇯🇵 일본 | 아시아 2위(도쿄증권거래소·닛케이), 지리·문화 근접, 반도체·상사·엔캐리 관심. |
| 3 | 🇨🇳 중국 + 🇭🇰 홍콩 | 거대 시장(상하이·선전 A주·항셍), 중국 테크 관심 큼. 접근/규제 복잡(후강퉁·港股) → 정보 사이트 위주. |
| 4 | 🇪🇺 유럽 | 영국(LSE)·독일(DAX)·프랑스 — 럭셔리·산업재·방산. |
| 5 | 🇮🇳 인도 | 고성장 신흥(Nifty/Sensex), 글로벌 자금 유입 부상. |
| 6 | 🇻🇳 베트남 · 🇹🇼 대만 | 베트남=한국 리테일 관심 큼 / 대만=TSMC 등 반도체. |

→ **다음 세션 시작 시: 현재 시총 순위 + 한국예탁결제원 '국가별 서학개미 보관금액·순매수' 데이터를 웹검색으로 확인해 순위를 데이터로 확정**한 뒤, US 완성 → 2순위부터 각국 자국 기준으로 하나씩.

---

> **새 세션 첫 행동 권장**: 이 파일 정독 → `session-context.md` TODO 가비지 컬렉션 → **US 탭을 "미국 자국 기준"으로 완성(§12)** 부터 시작 (또는 사용자에게 시장 우선순위 데이터 검증 먼저 할지 확인) → STEP 작성.
