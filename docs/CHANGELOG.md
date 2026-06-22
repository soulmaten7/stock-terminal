<!-- 2026-06-22 -->
# 운종(雲從) — 변경 이력

## 2026-06-22 — STEP 312~345 · 게이트웨이 완성: 종목·상품 탭 + 우측 피드 8종 + 관리자·모더레이션·로그인 마무리

빌드 ✓ 전 STEP. HEAD `c0b3035`(345). **게이트웨이 각 카테고리 탭에 "우측 실시간 피드" 8종을 붙여 V7 관문을 실사용 가치 있는 화면으로 완성.**

**312~317 — 관리자·신고 모더레이션·디자인 통일**: 312 헤더 '관리자' 링크(admin 전용, User role +admin) · 313 카테고리 리스트 시각언어 통일(ListRow/SectionHeader 공용화, 증권사 이중박스 제거, CategorySection 삭제) · 314 리딩방 행 표형 통일(카드→밑줄·파비콘24px) · 315~317 신고 모더레이션(로그인 필수+작성자기록+중복방지+대기상태 접수→검토 후 공개 / admin 확인·기각=확인분만 🚨 공개 / 마이페이지 '내 신고'+본인 철회).

**318~322 — 마이페이지 정리 · 🔴 로그인 데드락 · 너비 표준화 · 푸터·법정**
- 318 '알림 설정' 탭 제거 · 320 '채팅 관리' 탭 제거+max-w-7xl · 321 페이지 너비 표준화(admin·coin).
- **319 🔴 로그인 데드락 해소** — `onAuthStateChange` 콜백 안 `await supabase.from(...)` → auth 락 데드락 → getSession 영구 멈춤(로그인 상태 화면에 안 뜸)이 원인. **콜백 동기 유지 + DB조회 setTimeout(0) 분리**로 해결(`AuthProvider.tsx`). ⚠️ 되돌리지 말 것.
- 322 푸터 V7 정리(환불/통신판매 제거) + 법정 페이지 신규(`/privacy`·`/terms`·`/about`), max-w-7xl 통일.

**323~331 — 종목·상품 탭 빌드(게이트웨이 첫 탭)**: 멀티컬럼 수익률 정렬표(주식/ETF/ETN/리츠 하위탭, 현재가·1일~1년, 기간 헤더 클릭 정렬) + 우측 증권사 거래대금 순위(`BrokerRanking` hideHeader). `MarketBoard.tsx`. 레이아웃 다회 조정(차트 제거→표 전체폭(1년 안잘림)·증권사 우측 이동·헤더 2줄 분리·부가설명 제거·로고 24px 행높이 정렬·sticky 해제). 331 ETF·ETN 1주/1년 빈값 수정(fetchDay 재시도+캐시 가드).

**332~333 — 게이트웨이 정리**: 332 증권사 독립 탭 제거(종목·상품 흡수)+링크 카테고리 중복 헤더 제거 · 333 특수 탭(유튜브·종목·상품·리딩방) 중복 헤더 제거(리딩방 출처·주의 박스는 유지).

**334~345 — 🟢 우측 피드 시리즈 8종 (이번 세션 핵심)**
- **뉴스(334~336)** — 네이버 뉴스 검색 API(`NAVER_CLIENT_ID/SECRET` .env.local 추가), 최신 20개, **대표 기사 og:image**(헤더 위장+네이버 폴백+referrerPolicy hotlink 우회, 이미지 있는 기사 대표), 탭 새로고침 유지(localStorage), `?debug=1`. `/api/news/feed`·`NewsFeed.tsx`.
- **공시·신용(337)** — 금감원 **DART** API(`DART_API_KEY` 기존) 상장사 최신 전자공시 20건(회사·보고서명·제출인·날짜→DART 원문). `/api/dart/feed`·`DartFeed.tsx`.
- **거시경제(338~339)** — 한국은행 **ECOS 100대 지표**(기준금리·국고채3년·원/달러·CPI·코스피) + 미국 **FRED**(기준금리·10년물·실업률·CPI), **한국/미국 토글 박스**. `/api/macro/summary`·`MacroFeed.tsx`. ⚠️ `ECOS_API_KEY`가 placeholder('your_ecos_api_key')였음 → 실제 키 교체 후 작동.
- **기업재무·리포트·ETF(340)** — 전용 데이터 없는 탭은 **NewsFeed 일반화**(`?q=` 쿼리별 캐시)로 주제별 뉴스(실적·재무 / 증권사 리포트·목표주가 / ETF·펀드).
- **배당(341)** — Supabase `dividends` 실데이터 **고배당 TOP 20**(중복 제거). `/api/dividend/feed`·`DividendFeed.tsx`.
- **공모주(342~345)** — **38커뮤니케이션 청약일정 스크래핑**(EUC-KR, 종목·청약일·공모가·주간사, 1h 캐시, 실패 시 38 링크 폴백) + **공모주/배당 토글**(`OfferingsFeed`). `/api/ipo/feed`·`IpoFeed.tsx`. 파싱 3차 수정: 343 시도 → 344 cheerio `&` 셀렉터 매칭실패(빈값) → **345 행당 링크 2개(종목명+분석)라 `!==1`이 다 걸러낸 게 진짜 원인 → `===0`+날짜셀 가드**.

**🔑 핵심 교훈 — Turbopack이 API 라우트 변경을 자동 갱신 안 함**: dev 서버가 옛 라우트 모듈+모듈레벨 캐시를 물고 안 바뀜(343~345 빈값이 다 이것). `lsof kill`만으론 옛 서버가 안 죽기도 함 → **`pkill -f "next dev" && rm -rf .next && npm run dev` 클린 재시작**이 확실한 cure. 코드/키는 가정 말고 MCP·`?debug=1`로 검증하는 흐름이 주효(ECOS placeholder 키도 그렇게 발견).

**env 변경(git 아님)**: `.env.local` — `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET` 추가, `ECOS_API_KEY` placeholder→실제 키. (DART·FRED·DATA_GO_KR 키 기존.) DB 스키마 변경 없음(읽기: dividends·stocks·quant_factors·stock_prices).

**▶ 다음 후보(보류)**: IPO cron으로 DB 적재(라이브 스크랩 안정화) · 52주 저가 우량주(`db/52w-lows` 실데이터 있음) 패널 · 모바일 반응형 · 테스트/데모 데이터 정리(출시 전) · 유튜브/구글 키 rotate · 업체명 확정 후 사업자등록·푸터 법정보.

## 2026-06-20 — STEP 272~311 · 🔴 V7 대전환(네이버 클론 폐기 → 게이트웨이+리딩방 검증) + 유튜브 Top100 + 카카오/구글 로그인 + 자가등록·관리자

빌드 ✓ 전 STEP. HEAD `84fab0b`(311). **정체성 재정의: 랭킹·차트·종목상세·상품리스트 폐기 → 흩어진 주식 정보·서비스를 한 곳에 모으는 "검증된 중립 관문" + 리딩방·유사투자자문 검증.** 마스터 비전 = `docs/PRODUCT_SPEC_V7.md`.

**272~280 — V7 전환 전 옛 홈 버그픽스**: 272 isKrxCode 전면교체(영숫자 KRX코드, ETF 미리보기 차트) · 273 기간칩 우측정렬 · 274 주식필터 통합+봉너비고정+종목토론 쓰기창 · 275 차트 꽉채움+ETN 차트제거 · 276 상품 100개 확장 · 277~278 스티키(티커 밑) · 279 기간칩 차트연동 · 280 분봉.

**🔴 V7 대전환** — `docs/PRODUCT_SPEC_V7.md` 작성.
- **281~284** `/toolbox`→홈 승격, 헤더=주식/코인(종목검색 제거), 옛 홈·`/market` 제거, 한국/미국 토글+카테고리 탭, max-w-7xl 폭통일, 지수 티커 복귀.
- **285~286** 유튜브 Top100(구독자순 1만↑, 코인/부동산/골프 제외) — DB `youtube_channels`, UI, 주간 크론 `/api/cron/youtube-refresh`(월9시KST, `lib/youtube.ts`). env `YOUTUBE_API_KEY`.
- **287** 탭 순서 재정렬(뉴스·증권사·유튜브 앞)+라벨 개선+기본탭 일치. link_hub 카테고리 +8(네이버페이증권·다음금융·아이투자·KB/신한/하나/메리츠/대신 리서치, DB직접).
- **288~296 리딩방·검증** — `fss_advisors` 1,738건 디렉토리화. 288 조회+면책 / 289 신고(`room_reports`,`/api/reports`) / 290 재구성(100/페이지·가나다) / 291 좋아요(`room_likes`,1인1회)+추천순, 집계뷰 `advisor_directory` / 292 플랫폼탭(텔레그램/카카오톡/네이버/기타 host정밀파싱)+한줄카드+분할 미리보기 / 293 대표위치 / 294 리딩방명(info_name)+전체탭+미리보기 sticky / 295 정보란 정리(연락처 삭제) / 296 만료 자동숨김.
- **297~300 로그인** — 297 구글 OAuth 버튼 / 298 Supabase 구글 provider 활성화(Management API) / **299 🔴 `middleware.ts` 추가 — `@supabase/ssr` 필수 미들웨어 부재가 로그인 루프 원인이었음, 해결** / 300 로그인 시 헤더 이니셜 아바타.
- **301~311 자가등록·관리자·UI** — 301 자가등록 폼 + `room_submissions` + 사업자번호 **FSS 자동대조**(`/api/rooms/submit`, 로그인 필수) / 302~307 리딩방 컨트롤 레이아웃 정렬(정렬탭·등록버튼·미리보기 칼럼 정렬 — 여러 차례 조정) / 308 자가등록 디렉토리 합류(**advisor_directory 뷰 UNION**, source·intro, '이용자 등록' 중립표시·✅금감원등록은 fss만) / 309 `color-scheme:light`(OS 다크모드 드롭다운 깨짐) / 310 네이티브 select→**커스텀 드롭다운**(박스 바로 아래로) / **311 관리자 페이지 `/admin`**(role=admin, 신고·자가등록 표).
- **✅ 검증**: 테스트 신고 1건 `room_reports` 적재 확인(로그인→모달→제출→DB 전 경로 작동). 데모 자가등록 행 1건(view UNION 표시 확인). **⚠️ 출시 전 테스트/데모 데이터 삭제 필요.**

⚠️ 보안: 유튜브 API키·구글 Client Secret 스크린샷 노출 → rotate 권장(미실행). DB 직접변경(git 아님): youtube_channels·room_reports·room_likes 테이블, advisor_directory 뷰, link_hub +8.

## 2026-06-18 — STEP 265~271 (홈 리셋 · 랭킹 표 UI 통일 · 종목 상세 미국 차트) · 종목 상세 점검

빌드 ✓ 전 STEP. **새 기능 X — 사용자 클릭 QA로 발견한 UX·버그 정리 + 종목 상세 점검.**

**홈 리셋·크래시 (2026-06-17)**
- **265** **avatarBg 빈값 가드** — 종목 상세 진입 시 `name`이 undefined면 `name.length`에서 크래시하던 것을 `const s = name || ""`로 방지. + 헤더 홈/로고 클릭 시 **주식 탭으로 리셋**(탭을 URL `?tab=`로 반응형 관리, `app/page.tsx` `force-dynamic`). 파일: `lib/avatar.ts` · `HomeRankingTabs.tsx` · `app/page.tsx`. 커밋 `837a9df`
- **266** **홈 완전 리셋** — 헤더 홈/로고 클릭 시 주식·국내·전체·1일까지 전부 초기화. 탭만 바꾸던 265를 보강: zustand 리셋 카운터(`stores/homeResetStore.ts` 신규) + `key` 리마운트로 `MarketClient` 하위 상태(국가·기간)까지 리셋. 파일: `homeResetStore.ts` · `HomeClientV6.tsx` · `Header.tsx`. 커밋 `e5b8b3d`

**랭킹 표 UI 통일 (2026-06-18)**
- **267** **'순위' 헤더 줄바꿈 수정** — 고정폭(`w-12`)이 좁아 '순위'가 2줄로 깨지던 것 → 고정폭 제거 + `whitespace-nowrap`. 랭킹 4종(주식·ETF·ETN·리츠). 커밋 `5f992fc`
- **268** **♡ 관심 + 칼럼 정렬 통일** — ETF·ETN·리츠에도 ♡(관심종목) 칼럼 추가(주식엔 이미 있음 → 관심종목에서 함께 보임) + 셀 패딩 `px-3`로 주식과 통일. 파일: `HomePerfRanking.tsx` · `HomeEtfRanking.tsx`. 커밋 `3e85c04`
- **269** **종목명 칸 `w-full`** — 리츠처럼 이름이 짧으면 칼럼이 좁아져 현재가·대비가 왼쪽으로 밀리던 문제 → 종목명 `th`에 `w-full`로 남는 폭 흡수, 값 칼럼 우측 고정. 전 탭(주식·ETF·ETN·리츠 + /market) 위치 통일. 커밋 `8408560`
- **270** **미리보기 트리거 hover→행 클릭** — 마우스만 올려도 바뀌던 미리보기를 **행 클릭 시** 표시로 변경. 행 클릭=상세 이동은 제거(상세는 미리보기 안 '종목 상세·토론 보기 →' 버튼). 파일: `MarketClient` · `HomePerfRanking` · `HomeEtfRanking` · `HomeStockDetail`. 커밋 `db791b0`

**종목 상세 미국 차트 (2026-06-18)**
- **271** **미국 차트 yahoo 연결** — 종목 상세 차트가 미국이면 "미국 주식 차트는 Yahoo Finance 통합 추후" placeholder였던 것 → `/api/yahoo/chart` 일봉 캔들 렌더(국내와 동일 렌더, D/W/M 토글은 숨기고 "미국 종목 · 일봉 (Yahoo Finance)" 라벨). 파일: `StockChartSection.tsx`. 커밋 `8670ba2`

**종목 상세 점검 결론**: 주식·ETF·ETN·리츠·미국 5종 상세 전부 정상.
- 미국 호가·체결 카드 = `return null`(국내전용 KIS) → 카드 자체 미표시(빈 '로딩 중' 멈춤 없음 — 정상).
- 미국 좌측 정보패널 = `/api/yahoo/quote-detail` 호출(이름·현재가·시세·재무) → 동작 확인. **추가 작업 불필요.**

## 2026-06-15 — STEP 261~264 (/market 미국·ETN 합류 + ETN 기간 일관화 + 홈 속도) · 리딩방 설계 기록

빌드 ✓ 전 STEP.
- **261** `/market` 통합에 **미국·ETN 합류** — `us-performance`에 이름·현재가·1일등락 추가, ETN(`/api/krx/etn`) 1일 합류. 미국 $가격·타입 배지. 커밋 `227dcf8`
- **262** **ETN 기간 수익률 API** `/api/krx/etn-performance` — KRX를 6개 날짜(오늘·1주·1개월·3개월·6개월·1년) 조회해 종가 비교. 1년 전(20250617)까지 데이터 확인. 커밋 `98a3118`
- **263** **ETN 탭 기간칩 전환**(`HomePerfRanking`, 1일~1년) + /market ETN 전 기간 합류. `HomeEtnRanking` 삭제. 커밋 `a4cf8c8`
- **264** **홈 속도** — KRX `ranking` route 5분 캐시(반복 로드 즉시화). 커밋 `14c1493`

**결과**: 주식·ETF·ETN·리츠·미국 5개 전부 동일한 기간 수익률 방식(완전 일관) + /market 통합 비교 + 홈 로딩 개선.
**리딩방 검증 설계** = `docs/ROOM_VERIFICATION_SPEC.md` 기록(데이터 확보·구현은 플랫폼 완성 후 — 전체 리스트화 + 신고 사실 라벨 + 신고/광고 상위·분리표시).

## 2026-06-15 — STEP 254~260 (ETN 실데이터 연결 + 펀드 시도→제거 + 탭 유지)

ETN을 KRX 실데이터로 연결, 펀드는 무료 수익률 소스가 없어 제거. 탭 새로고침 유지. 빌드 ✓ 전 STEP.

- **254** ETN 프로브 `?debug=1` 진단 → HTTP 404(구독 문제 아님, 경로 오류). 커밋 `cfbc6c3`
- **255** **ETN 엔드포인트 수정** `sto`→`etp`(`/svc/apis/etp/etn_bydd_trd`) → ETN **380종목 실데이터 정상**. 커밋 `02498d1`
- **256** **ETN 탭 연결** — `HomeEtnRanking`(KRX 1일 시세 성적표·거래대금순/1일 등락순·hover 미리보기). MCP 화면 확인. 커밋 `e9564f3`
- **257** 펀드 프로브 `/api/fund`(data.go.kr `getStandardCodeInfo` 펀드표준코드). `.env.local` `DATA_GO_KR_KEY`(승인 후 반영 지연 겪음). 커밋 `fd4b842`
- **258** 펀드 route 검색·유형 필터·필드 매핑(`q`→`fndNm`, `type`→`fndTp`). 확인: `fndTp`(유형) 됨 / `fndNm`(이름)은 **정확일치만** → 키워드 검색 불가. (부수: `MarketClient` `country!=="global"` 타입 에러 제거.) 커밋 `804c015`
- **259** 펀드 디렉토리 탭(유형 필터·더보기·불러온 목록 검색·네이버 폴백) + **탭 새로고침 유지**(`?tab=`, `HomeRankingTabs` useEffect+replaceState). 커밋 `f6b1a8c`
- **260** **펀드 탭 제거** — 거래소 상품 아님(은행 판매)·무료 수익률 데이터 없음(data.go.kr·KOFIA 오픈API·예탁결제원 전부 확인)·네이버/토스도 미취급. `HomeFundDirectory`·`/api/fund` 삭제. 탭 = **주식·ETF·ETN·리츠·리딩방 리스트**

**결론**: ETN ✅ 실데이터 → 주식·ETF·ETN·리츠·미국 전부 수익률 됨. **펀드 = 유료 데이터 영역**(무료론 정확·안정 불가, '신뢰' 정체성상 스크래핑 비채택) → 제거.
**스코프 재정렬**: 거래되는 상품(주식·ETF·ETN·리츠) 수익률 + 리딩방·채널 검증(차별점) + 토론·신뢰.

## 2026-06-15 — STEP 247~253 (틀 기능적 완성: 반쪽 기능 정리·미리보기 차트·ETF 1주일 + ETN 프로브)

"새 기능 X — 만들어둔 틀의 기능적 완성." 빌드 ✓ 전 STEP. HEAD `60fbd48`(253).

- **247** STEP 243~246 아카이브 + 문서 커밋
- **248** `/market` **글로벌 칩 제거**(`MarketClient` COUNTRIES=kr·us) — 데이터 없는 반쪽 버튼 정리
- **249** 종목 클릭 시 **이름 전달**(`?name=`, `StockPageClient` useSearchParams) — stocks DB에 ETF 없어 빈 이름 뜨던 갭 메움. 커밋 `539c5fb`
- **250** **'1 Issue' 해결** — anon Supabase 클라 `storageKey:"sb-unjong-anon"` 분리 → "Multiple GoTrueClient instances" 경고 제거(MCP 콘솔로 확인)
- **251** **미리보기 차트 yahoo 폴백** — `/api/yahoo/chart` 신규(국내 `.KS/.KQ`·미국 바로) + `HomeStockDetail` 국내=KIS먼저→비면 yahoo·미국=yahoo. **미국·ETF·리츠도 차트**(AAPL ~270봉 MCP 확인)
- **252** **ETF 1주일(r1w) 메움** — `etf-performance` r1w + `HomeEtfRanking` 매핑. 1주일 '—' 해소. 커밋 `c319d6c`
- **253** **ETN 프로브** `/api/krx/etn`(KRX `etn_bydd_trd`). MCP로 찔러 확인 → **`empty_or_not_subscribed`** = 키·주식은 정상이나 **ETN 상품 미구독**. 커밋 `60fbd48`

**데이터 현황**: 주식(국내·미국)·ETF·리츠 = yahoo 실데이터 ✅ / 미리보기 차트 = 전 타입 ✅ / **ETN = KRX 'ETN 일별매매정보' 이용신청 대기**(프로브로 미구독 확정) / **펀드 = KOFIA 소스 대기**.
**남은 결정(사용자 작업)**: ① ETN KRX 구독 ② 펀드 KOFIA ③ 유튜브 팔로워 API 키 ④ 카카오 OAuth(투표) ⑤ AI 해설 빌드 여부(설계 `docs/AI_LENS_SPEC.md` 완료) ⑥ 평가·검증 MVP 2.0 방향.

## 2026-06-15 — STEP 240·243~246 (데이터 레이어: 기간 수익률 실데이터 + /market 통합 디렉토리)

홈 UI 완성 후 "—" 칸을 실데이터로 채우고, /market을 전 타입 통합 성적표로. 빌드 ✓ 전 STEP. HEAD `bfa7d97`(246).

- **240** ETF 미리보기 폭 주식과 동일(wide+2/3·1/3 그리드) — 적용 완료 `bd4287e`(228~241 기록 땐 미적용이었음)
- **243** 주식 기간 수익률(1주~1년) 실데이터 — `/api/yahoo/kr-performance`(대표 ~45종목, yahoo 과거 시세·영업일 오프셋 5/21/63/126/252·30분 캐시) + MarketClient **2단계 병합**(KRX 1일 즉시 → 기간 도착 시 심볼 기준). 유니버스 밖은 "—"
- **244** 리츠 탭 실데이터 — `/api/yahoo/reit-performance`(리츠 14) + **제네릭 `HomePerfRanking`**(단일 소스 기간 랭킹, 리츠/ETN 공용). ComingSoon → 실제 성적표
- **245** 미국 주식 기간 수익률 — `/api/yahoo/us-performance`(대표 40, us-movers 유니버스 재사용) + MarketClient US 2단계 병합
- **246** `/market`('상품 리스트') = **전 타입 통합 디렉토리** — 주식·ETF·리츠를 한 테이블에 같은 기간 수익률 자로 가로질러(타입 배지·타입 필터·기간칩). `MarketDirectoryClient` 신규, kr-performance에 name·price 추가해 shape 통일. **핵심 차별점 '가로질러 비교' 실현**

**데이터 현황**: 주식(국내·미국)·ETF·리츠 = yahoo 실데이터 ✅ / **ETN 보류**(yahoo 데이터 없음, 코드 14개 0/14 → KRX ETN 엔드포인트 필요) / **펀드 보류**(KOFIA 소스 필요).
**다음**: US를 /market 통합에 합류(us-performance에 name 추가) · 종목→증권사 바로가기(허브) · ETN(KRX)·펀드(KOFIA) · AI 해설.

## 2026-06-15 — STEP 228~241 (V7 UI 전면 재설계: 홈 = 상품 성적표 + 헤더 정리)

전략 대화로 운종 정체성 재확정 → UI 전면 재설계. 빌드 ✓ 전 STEP. HEAD `bbf4e88`(241).

**링크모음·홈 속보 (228~232)**
- **228** 주식 관련 링크모음 3등분(한국｜미국｜증권사 리스트), 탭 제거·전부 노출
- **229** 홈 실시간차트 표:미리보기 2:1 + 인기토론 카드 → 🔴 실시간 속보(RSS)
- **230~232** 속보 카드 높이(46vh)·대표 이미지(왼쪽 열 flex 크게)·헤드라인 배치 / 실시간차트 지연문구·투자위험 토글 제거

**홈 = 상품 성적표로 재편 (233~238)** ← 이번 세션 핵심
- **233** 홈 🔴속보 카드 **제거**(성적표 최상단 reflow) + 랭킹 탭 6→3(지금뜨는카테고리·투자자동향·채널 랭킹 삭제) + 리딩방 랭킹→**리딩방 리스트**(맨끝·구분선)
- **234** 주식 마켓 **기간 수익률 성적표 칼럼화**(UI-first, 1주~1년 placeholder)
- **235** 랭킹 탭 **상품 타입 재편**: 주식·ETF·ETN·펀드·리츠 ｜ 리딩방 리스트. ETN·리츠·펀드='준비 중'. `HomeEtfRanking` `fixedAsset` prop(ETF/펀드 토글 대체)
- **236** 주식 정렬칩 거래대금/거래량/급상승/급하락 → 수익률축 (※237에서 단일칼럼으로 대체)
- **237** 마켓 **단일 '[기간] 대비' 칼럼 + 기간칩(1일전~1년전) 토글**(다중 칼럼 폐지, 칩=기간 선택·정렬, 기본 1일전)
- **238** '상품 리스트' 라벨 제거 + **ETF/펀드도 동일 단일칼럼·기간칩**(ETF 1·3·6·12개월=yahoo 실데이터, 1주일=—)

**다듬기·헤더 (239~241)**
- **239** 기간칩 '전' 제거(1일·1주일·…·1년), 칼럼 헤더는 '…전 대비' 유지
- **240** ETF 미리보기 폭 주식과 동일 — ⚠️ **명령서만, 미적용**(239→241 건너뜀). 적용 대기
- **241** 헤더 정리 — **뉴스·시황 제거** + **마켓 → 상품 리스트**(라우트 `/market` 유지). 메뉴 = 홈·상품 리스트·주식 관련 링크모음

**정체성·결정 (전략 대화 결론)**
- 운종 = "흩어진 모든 상품을 중립으로 한 곳에 펼치고, 스스로 판단(읽는 법)을 돕는 곳". 필터 = "이거 보려고 운종에 올 이유 있나?"(없으면 안 만듦). 거래 X = 정보·허브·소통.
- 성적표 = 상품 타입(주식·ETF·ETN·펀드·리츠) × 기간 수익률, 중립. 증권사 = 카테고리 아님(상품 안 '바로가기'+수수료). 리딩방 리스트 = 검증 디렉토리(상품과 구분).
- AI 해설 = 보기 레이어(추천·단타 X). 종목 디테일 = 링크아웃(허브).

**다음**: ① STEP 240 적용 ② 주식 1주~1년·시총 **실데이터 연동**(yahoo kr-performance 등 = 데이터 레이어, 큰 작업) ③ ETN·리츠·펀드 데이터 ④ `/market` 상품 통합 디렉토리화.

## 2026-06-09 — STEP 218·220~227 (주식 관련 링크모음 = toolbox 구축)

옛 toolbox(`link_hub`) 살려 헤더 4번째 탭 '주식 관련 링크모음'(`/toolbox`). HEAD `2a3c895`. 빌드 ✓ 전 STEP.
- **218 마운트**: `app/toolbox/page.tsx` 신규(기존 `ToolboxClient`+`link_hub` 54개), 헤더 탭, 광고 Partner Slot 제거(광고 규칙 준수)
- **220 재설계**: 카드 그리드 → **카테고리 탭 + 한 줄 리스트**(아이콘·이름·도메인·설명), 옛 민트색 → 운종 토큰. `CategorySection` 고아화
- **221 증권사 톱 블록**: `lib/brokers.ts`·`BrokerRanking`(거래대금 순위) + **박스형 탭** + 카테고리 재정렬(증권사 톱으로·exchange→거래소). 새 라벨(재무·분석/ETF/공모주) 추가, 링크는 후속. 🚫 광고 0
- **222 레이아웃**: 헤더 제거 + **증권사 우측 레일** + 검색 컴팩트 우측·국가 좌측
- **223·224**: 증권사 **20개**(도메인 검증) + 헤더 제목 한 줄·부제 제거 / 행 **'바로가기' 버튼**(hover 아이콘 대체)
- **225·226**: 가로 **2:1**(좌 링크 : 우 증권사) — 임의값 `[2fr_1fr]` 미생성 → 표준 `grid-cols-3`+`col-span-2`로 수정
- **227**: 국가 필터 **'전체' 제거 + 한국 우선**(기본 한국)
> 증권사 순위 = 객관 거래대금(분기 고정·근사치, 상위3 점유%: 키움18·미래에셋13·한투11). 광고 시 '유료 노출'과 명확 분리(운종 신뢰). **다음 = 링크 큐레이션 INSERT**(재무·분석/ETF/공모주 + 보강) → 새 탭 등장

## 2026-06-09 — STEP 162·219 (KRX 공식 OpenAPI 국내 100 + 로고 커버리지)

- **162 KRX 공식 OpenAPI**: `data-dbg.krx.co.kr/svc/apis/sto/stk_bydd_trd`·`ksq_bydd_trd`, 헤더 `AUTH_KEY`, env `KRX_API_KEY`(`.env.local`·커밋 금지). 국내 랭킹 100 **공식·일별**. **키 발급 + API 이용신청 7종 승인**(유가/코스닥 일별매매·ETF·종목기본·KOSPI/KOSDAQ 지수) → 401 해결·실데이터 확인. 키 없으면 KIS 30 fallback
- **219 로고 커버리지**: `DOMAIN_MAP` 42→**100**(엔터·게임·2차전지·바이오·금융 등) + **ETF 브랜드 배지**(KODEX→KO·TIGER→TI…, 국내 6자리 가드로 미국 오탐 방지). 소형주는 아바타 폴백(정상)

## 2026-06-09 — STEP 215~217 (홈 시장시간바·옛 홈 잔재 제거·헤더 개편)

- **215**: 시장 시간 안내 바(애프터마켓·프리마켓) → 랭킹 탭 줄 우측(자투리·xl 이상)
- **216**: 종목 뒤로가기 **옛 홈(잔재) 제거** — `/kr`·`/us` → `/market` 리다이렉트 + 뒤로 링크 통일(옛 `(windows)` 셸 안 뜸). 셸 파일 삭제는 후속
- **217**: **헤더 개편 1차** — MY·토론·평가 탭 제거 + 뉴스·시황 추가(홈/마켓/뉴스·시황), 우측 레일 '보유' 제거. MY=프로필 아이콘. 평가·검증 톱레벨은 UI 완성 후

## 2026-06-07 — STEP 212~214 (홈 실시간채팅 + 우측 레일 정리)

홈 우측 레일에 실시간채팅 신설 + 레이아웃 정리. HEAD `6ef495f`. 빌드 ✓ 전 STEP.

**홈 실시간채팅 (212)**
- 신규 `HomeLiveChat.tsx` — 우측 레일 위 반화면(46vh) 전체(장중) 채팅. 기존 `chat_messages` 재활용·**방 키 `symbol="HOME"`**(종목 채팅과 분리)·Supabase realtime. DB 변경 0. 빈상태 "첫 메시지를 남겨보세요". `HomeRightRail` = [⚡실시간채팅] + [관심종목] + [세로 아이콘 탭]

**레일 정리 (213·214)**
- 213 입력창 강조 — 하단 회색 슬랩 제거 → 입력칸 라운드+옅은 채움+focus 테두리 강조. **우측 레일 고정(sticky) 해제** → 관심종목이 페이지(왼쪽 랭킹) 길이만큼 길게. 🐛 관심종목 등락색 버그(상승 파랑→빨강, STEP 189 sed 잔재)
- 214 우측 레일 폭 `360→400px`(`HomeClientV6` 그리드) — 채팅·관심종목 넓히고 메인(실시간차트 등) 그만큼 축소

**결정·상태**
- 실시간채팅 = 종목 무관 홈 전체 채팅(HOME방). 신규라 초반 빈상태 정상
- 관심종목은 고정 아님 — 페이지 스크롤 따라 늘어남(그리드 stretch)

## 2026-06-07 — STEP 207~211 (상세 페이지 보강: 방·채널·종목 + 조회수/팔로워 DB)

상세 페이지 디테일 + 조회수·팔로워 DB. HEAD `f64612c`. 빌드 ✓ 전 STEP.

**방/채널 상세 (207·209·210)**
- 207 `/room/{id}` 보강(`RoomDetailClient`) — 플랫폼 로고 + 방 투표 👍/👎(`leading_room_votes`) + 👁 조회수 + 입장하기 강조. FSS 사업자번호 인증·면책·평가 토론 유지
- **209 DB 024** — `increment_room_view(uuid)` RPC(security definer, RLS 우회) + 진입 시 호출 → 조회수 실제 +1, 조회순 의미 생김 (MCP 적용)
- **210 DB 025** — `leading_rooms.follower_count`·`follower_synced_at` + **채널 팔로워순 정렬칩·👤 표시**(채널 한정). 데이터 0부터(유튜브 자동수집 B는 후속) (MCP 적용)

**종목 상세 (208·211)**
- 208 토스급 — 🐛 상승가 색버그(파랑→빨강, STEP 189 sed 잔재) + 좌측 캔들 한국식 색(`#F04452`/`#3182F6`) + 기본 탭 '토론'→'차트·시세' + 전일대비 절대값(역산)
- 211 폴리시 — 헤더 종목 로고(`StockLogo`) + 미국 뒤로가기 링크 수정(US→`/market`). 점검 결과 호가(매도 파랑/매수 빨강)·중앙 차트 색은 이미 정상

**결정·상태**
- 종목 상세는 이미 토스보다 풍부(차트·호가·체결·토론·뉴스·공시·인사이트·채팅) → 갈아엎기 X, 버그·폴리시만
- 유튜브 팔로워 자동수집(B): YouTube Data API 키 + 채널ID 필요 → 후속 STEP
- 마이그레이션 024·025 = 운종 DB(`qxkmwlkchyxfzxbonhtj`)에 Cowork MCP 적용 완료

## 2026-06-07 — STEP 200~206 (리딩방·채널 랭킹 + 좋아요/싫어요 DB + 투자상품 미리보기)

운종 차별화 핵심 — 리딩방/채널 평가 디렉토리(MVP 2.0). HEAD `2bf1bc7`. 빌드 ✓ 전 STEP.

**리딩방 랭킹 (200~204)**
- 200 '리딩방' 탭 신설 — `leading_rooms`(금감원 인증 위 + 활동 순), "운종은 평가 X" 경고
- **201 DB 023** — `leading_rooms` 좋아요/싫어요 컬럼 + `leading_room_votes` 테이블 + 트리거 + RLS (운종 DB `qxkmwlkchyxfzxbonhtj`에 **MCP로 적용 완료**)
- 202 행 리디자인 — 플랫폼 로고(logo.dev) + 방이름 + 👍/👎/👁, 메타줄 삭제
- 203 hover 프리뷰(`HomeRoomPreview`) — 텔레그램 연결 카드(입장하기, 라이브 임베드 불가) + 👍/👎 투표(실동작·로그인) + 방 평가(`platform_discussions`) + CTA. `platformLogo.tsx` 공용화
- 204 **리딩방=텔레그램·카카오만** + **'주식 관련 채널' 탭 신설**(유튜브·디스코드·인스타·페북·기타) — platform 필터 분리(DB 변경 0). 채널은 미인증 라벨 없음·경고 가벼움

**투자상품 + 정렬·문구 정리 (205~206)**
- 205 탭 rename "~랭킹"(투자상품/리딩방/채널) · **ETF hover 미리보기**(종목 미리보기 `HomeStockDetail` 재사용) · 정렬 라벨 "거래대금순 / 1·3·6·12개월 수익률"("인기순" 삭제)
- 206 리딩방·채널 **경고 문구 개정**("추천·보증하지 않아요" 방패 유지) + **좋아요순/싫어요순/조회순 클릭 정렬**(공용, 활성 지표 굵게, 싫어요순=주의 뷰)

**결정·로드맵**
- 리딩방(유료 시그널 telegram/kakao) ↔ 채널(콘텐츠 youtube/discord/insta/fb) 분리 = 운종 정확성. 투표=`leading_room_votes`(vote_type like/dislike, 기존 토론 패턴). ETF=종목코드라 종목 미리보기 재사용
- **팔로워순(채널)**: 유튜브=Data API 자동(주1회 크론), 인스타/페북=공식 수집 불가→**등록 기반(claim-your-channel)**, 디스코드=위젯 부분. `follower_count` 컬럼 후속
- 토스식 "기간 거래대금순"=과거 거래대금 데이터 없음→기간은 **수익률**(정직). 광고=사용자 지시 시에만(철칙도 그때 사용자). 미리보기 홈 먼저→상세 페이지 후속

## 2026-06-07 — STEP 195~199 (인기토론 홈 + 투자상품 랭킹 ETF·증권사 링크)

홈 차별화 + 운종 허브 진입. HEAD `ef5f6ec`. 빌드 ✓ 전 STEP.

**인기토론 홈 (195~196)**
- 195 얇은 지수 티커 헤더 밑 고정(`HomeIndexStrip`, sticky) — 지수 앵커 유지
- 196 큰 주요지수 박스 → **🔥 인기 토론 2열 라이브**(`HomePopularDiscussions`, discussions 좋아요 순 10개·20초 폴링·👍/👎/💬·빈상태 CTA) + 하단 마퀴 제거. ⚠️ 수급(코스피/코스닥 개인·외국인·기관)은 박스와 함께 홈에서 빠짐(투자자동향 탭엔 있음)
> 결정: 인기토론 = **인기순 + 반론(👎) 노출**(신뢰가중 알고리즘 X — 운종 주관 배제, 인증 로그인 글쓰기가 1차 필터). 신규라 초반 빈상태 정상.

**투자상품 랭킹 (197~199)**
- 197 랭킹 탭에 **'투자상품'** 추가 → 인기 ETF(KIS 거래대금 랭킹에서 ETF만 필터)
- 198 ETF/펀드 토글 + 인기순/수익순(1·3·6·12개월) — 신규 `/api/yahoo/etf-performance`(대표 ETF 16개 과거 시세로 기간 수익률·30분 캐시). 펀드=준비중
- 199 종목 상세 좌측 **"어디서 거래할까"** 증권사 바로가기(토스 종목 딥링크 + 7개사 홈페이지, 거래 X 동선안내). 국내 6자리만
> 도메인 사실: ETF는 운용사(KODEX=삼성, TIGER=미래에셋) 발행, 증권사는 판매 창구 → 어느 증권사서나 거래. 운종 = 중립 정보·허브.

**로드맵·결정 기록**
- 다음 = **리딩방 랭킹**(FSS 검증 데이터 — 인증/등록 위 + 추천 아래, 신고/주의 신호 노출)
- **광고**: 현재 설계 0 반영. **사용자가 "광고 넣자" 지시할 때만** 다루고, 광고 철칙도 그때 사용자가 직접 정함(운종이 미리 만들지 않음).
- 펀드 데이터 소스(금투협 등) · 증권사 데이터 공유 시 투자상품 틀에 그대로 확장.

## 2026-06-07 — STEP 175~194 (토스 실시간차트 완성 + 로고/차트 디테일 + 한국식 등락색)

V7 토스 밀착 3차 — 실시간차트 탭(A~D)·종목 미리보기·로고/색 정밀화. HEAD `f0c38c6`. 빌드 ✓ 전 STEP.

**상세 패널·랭킹 3탭 (175~182)**
- 175 종목 상세 패널 완성(실 차트+지표, placeholder 제거) · 176 랭킹 3탭(실시간 차트 ｜ 지금 뜨는 카테고리 ｜ 국내 투자자 동향) · 177 투자자동향 순매수/순매도 토글+로고
- 178 실시간차트 ♥관심 토글 + 상세 패널 캔들차트 · 179 필터 토스식 한 줄(국가·시장·정렬) · 180 상세 패널 커뮤니티(차트 밑 종목 토론, 있으면 실제·없으면 CTA)
- 181 미리보기 패널을 필터 밑·랭킹과 같은 높이로(`detailSlot`) · 182 미국 탭 "데이터 없음" 버그(screener 빈값/실패 시 대표 40종목 등락순 폴백)

**로고·차트·색 디테일 (183~190)**
- 183 레버리지/인버스 ETF 로고 배지(이름 파싱 2x/3x/인버스) · **184 종목 로고 logo.dev 연동**(미국 티커 7만 자동 + 국내 도메인맵 42, `NEXT_PUBLIC_LOGODEV_TOKEN`) — 구글 파비콘 대체
- 185 지수 스파크라인 area fill(선 밑 그라데이션) · 186 미리보기 캔들 거래량 막대+월 축 라벨 · 187 월 라벨 가장자리 잘림 수정(양끝 anchor) · 188 거래량 막대 키움(토스식)
- **189 등락 색 한국식 전환**(상승=빨강 `#F04452`·하락=파랑 `#3182F6`, 전역 sed 25파일·StockLogo 인버스 제외·globals.css toss 팔레트 보존) · 190 헤더 우측 아이콘 오른쪽 정렬(검색 max-w 캡 제거)

**실시간차트 A~D 토스화 (191~194)**
- 191 [A] 필터 라운드스퀘어 칩+구분선+정렬세트(거래대금/거래량/급상승/급하락, 시가총액·토스증권 제외)
- 192 [B] 기간 행(실시간~1년, 실시간만 활성·나머지 준비중) + 투자위험 숨기기 토글(레버리지/인버스 실제 숨김)
- 193 [C] 지금 뜨는 카테고리 2열(국내 KIS업종 ｜ **해외 신규 미국 SPDR 섹터 ETF** `/api/yahoo/sector-etf`) + 이모지. "N개 중 M개"는 데이터 없어 생략
- 194 [D] 국내 투자자 동향 3열(외국인·기관 실데이터 ｜ **개인 "준비중" — KIS 미제공 정직 표기**)
> 정직 원칙: 토스증권 거래대금/거래량·거래비율·AI요약·테마분류·개인 종목별·기간별 과거데이터 = 토스 자체/미보유 → 가짜 X, UI만 매칭 or 준비중 표기. logo.dev 토큰은 `.env.local`(커밋 금지).

## 2026-06-06 — STEP 169~174 (토스 UI 정밀화 — 관심 레일·단일 헤더·종목 로고·hover 상세)

홈 UI를 토스에 더 밀착. HEAD `13067c6`. 빌드 ✓ 전 STEP.
- 169 관심종목 우측 레일 토스화 — 헤더까지 풀하이트 2단 + 레터아바타 + ♥(관심해제), 숏컷 placeholder 제거(채팅 자리) (`7b3d0fc`)
- 170 헤더 한 줄 통합 — 로고+네비(홈/마켓/토론·평가/MY)+검색+우측아이콘 단일 60px 헤더, `MainNav` 행 제거(파일 유지) → 관심 레일 상단 밀착 (`cc23d93`)
- 171 관심 레일 우측 세로 아이콘 탭(토스식) — 알림/관심/보유/최근 far-right, 관심종목 풀하이트 유지, 우측 컬럼 320→360 (`a997964`)
- 172·173 종목 로고 — 172 레터아바타(`65e819b`) → **173 실로고** 대체: 주요 종목 도메인 → Google favicon (`lib/avatar.ts` `DOMAIN_MAP` 국내 20·미국 8) + 미매핑/실패 시 레터아바타 폴백(`StockLogo` 신규). 홈·마켓·관심 공통 (`cefe651`). (Clearbit 무료 2025말 종료 → favicon. 더 선명히는 logo.dev 무료 키)
- 174 종목 hover 상세 **3단 레이아웃**(토스 UI 셸) — [랭킹 ｜ 상세 ｜ 관심]. `MarketClient onHover` + 신규 `HomeStockDetail`(로고·현재가·등락 실데이터 + 차트 자리 + **운종 확장영역 placeholder**: 증권사별 투자상품·단톡방/커뮤니티). xl 이상 표시 (`13067c6`)
> 셸 우선(사용자 방침): 상세 패널은 토스 구조로 만들고 콘텐츠는 운종 데이터(상품 리스트·단톡방 링크)로 추후 채움. AI/한줄요약 가짜 금지.

## 2026-06-06 — STEP 154~168 (토스증권 오마주 V7 — 홈 대시보드·풀폭·지수·티커·수급·랭킹100)

V7 방향 재정렬: 네이버 복제 → **토스증권 오마주**. 홈을 토스식 시장 대시보드로, 전 페이지 풀폭 통일. 분석 문서 `docs/TOSS_ANALYSIS_AND_IA.md`. HEAD `959d8fa`. 빌드 ✓ 전 STEP.

**홈 대시보드·레이아웃**
- 154·157 마켓 시총 필터(KIS `market-cap`) · 랭킹 100 확대(KIS 국내 3종 + Yahoo US movers 100, `a8a03cf`)
- 156 홈 = 토스식 시장 대시보드 (지수그리드 + `MarketClient embedded` 재사용 + 관심레일). 155 네비 4탭은 보류
- 158·159·159+ 홈·전 페이지 풀폭 통일 (마켓·토론·뉴스·상품·리딩방·MY + 분석/차트/공시/등락/거래량/뉴스/호가/종목상세/파트너 — `max-w` 캡 제거, 앱 프레임 `max-w-[1984px]` 유지) (`1ddd141`·`f65ae27`·`2855f68`)

**홈 지수 그리드 토스화**
- 160 지수 그리드 빽빽 — 미국/국내 토글 제거 → 국내·해외·환율·원자재·코인 **10개 한 판**(코스피·코스닥·원달러·S&P·나스닥·다우·필반·VIX·금·비트코인). Yahoo `^KS11`/`^KQ11` 실값 확인 (`7dbdb5f`)
- 164 지수 카드 디테일 — 전일대비 **절대 변화량**(`regularMarketChange`) + **느낌 태그**(급등/급상승/조정/급락, 변동률 규칙) (`4f2b16a`)
- 165 코스피·코스닥 **수급**(개인/외국인/기관 순매수, 억원) — KIS `inquire-investor-daily-by-market` tr_id `FHPTJ04040000` (실제 응답 검증 후 연동) (`0f13cf7`) · 166 날짜 파라미터 수정(`DATE_1=오늘` → `output[0]` 최신 영업일, 10일전 stale 해결) (`84320d0`)

**티커 (토스식 하단)**
- 163 상단 티커 미작동 `KRX:KOSPI`/`KOSDAQ` 심볼 제거(빈칸 해결, 코스피/코스닥은 그리드로) (`c90fc66`)
- 167 상단 TradingView 티커 **제거** → 홈 **하단 고정 얇은 마퀴 티커**(주요지수 그리드와 동일 `/api/yahoo/indices` 데이터 → 숫자 일치, `IntersectionObserver`로 그리드 화면 이탈 시 등장) + 인덱스 라우트 30초 서버 캐시 (`237bd43`)
- 168 하단 티커 디테일 — 전일대비 금액 + 마퀴 실제 이동(`width:max-content` 버그 수정) + `⚠ 투자유의사항` 고정 라벨 (`959d8fa`)

**국내 랭킹 100**
- 161 국내 랭킹 100 인프라 — `/api/krx/ranking` 라우트 + `MarketClient` KRX 우선·**KIS 30 fallback** (`9fc2e58`). ⚠️ `data.krx.co.kr` 비공식 백엔드는 **서버사이드 세션쿠키 차단(LOGOUT 반환)** → 현재 KIS 30 fallback 동작 중
- 162 **KRX 공식 OpenAPI**(`openapi.krx.co.kr` · `data-dbg.krx.co.kr/svc/apis/sto/stk_bydd_trd`·`ksq_bydd_trd` · 헤더 `AUTH_KEY`) 연동 명령서 작성 — **⏳ 미실행: 인증키 승인 대기 + API 이용신청(유가증권·코스닥 일별매매정보) 필요**. 일별(장 마감) 기준 100개. 키는 `.env.local` `KRX_API_KEY`(커밋 금지)

## 2026-06-04 — STEP 153 (마켓 미국 랭킹 — us-movers 확장 + MarketClient 국가 분기)

V7 마켓 미국 탭 실데이터화 → 국내+미국 둘 다 랭킹 테이블. 새 DB 0.
- `/api/yahoo/us-movers` 확장(**하위호환**): `?dir=up|down&count=30` + `volume` 필드. 파라미터 없으면 기존(up·5) 동작 → 홈 소비자 무영향. `day_losers` 분기, 폴백도 dir 반영
- `MarketClient` 국가 분기: 미국 탭 = US_FILTERS(상승/하락) + us-movers 연결, `priceText` 로 원/$ 통일, 거래대금·시장필터는 국내만. 글로벌 placeholder
- 브라우저 확인 ✓ (Meta $622.98 +4.24% / AMD +4.02%, 클릭→/stock). 빌드 ✓ (`33e72f7`)
- 미완 후속: 시총·52주·인기 필터(KIS 신규 엔드포인트, STEP 154) · 업종 히트맵(155) · 토론/뉴스 상세

## 2026-06-04 — STEP 152 (마켓 페이지 + 국내 랭킹 테이블 — 네이버 마켓>주식 1차)

V7 **첫 실제 페이지 채우기**. 새 API·DB 0 (기존 KIS 랭킹 재사용).
- `app/market/page.tsx` + `components/market/MarketClient.tsx` 신규: 국가 탭(국내·미국·글로벌 — 미국/글로벌 placeholder) + 시장 필터(전체·코스피·코스닥) + 랭킹 필터(거래대금·거래량·상승·하락) + 랭킹 테이블(순위·종목명·현재가·전일대비·거래량·거래대금) + 행 클릭 → `/stock/[code]`
- 데이터: `/api/kis/volume-rank`(거래대금·거래량 `{stocks}`) · `/api/kis/movers`(상승·하락 `{items}`) — `j.stocks ?? j.items` 로 양쪽 흡수
- `MainNav` "마켓" → `/market` (기존 `/kr`·`/us` 라우트는 유지)
- 브라우저 확인 ✓ (거래대금 삼성전자 12.1조 / 상승 마음AI +29.99%, 필터 전환·종목 클릭 동작). 빌드 ✓ (`840e718`)

## 2026-06-04 — STEP 149·150·151 (홈 CTA · 브리핑 실데이터 복구 · 네이버식 네비 뼈대) + V7 진입

브라우저 확인 후 발견·수정 + **네이버 증권 구조 복제(V7) 진입**.
- **149 빈 섹션 CTA** (`2d8a39f`): `HotDiscussionsModule`·`HotReviewPostsModule` EmptyState 에 참여 유도 버튼("종목 보러 가기 →"·"평가하러 가기 →") + 따뜻한 문구. `Link` 이미 import.
- **150 브리핑 실데이터 복구** (`2e2fe00`→`acdc313`): "간밤 미국 시장" 4개가 "—"로 비던 문제. 1차 per-symbol 전환 후에도 안 떠서 → **진짜 원인 = briefing 라우트에 `export const runtime="nodejs"`·`dynamic="force-dynamic"` 누락**(Edge/정적캐시에서 yahoo-finance2 실패). 두 줄 추가로 해결. 브라우저 확인 = S&P 7,553.68 등 실값. (교훈: "되는 라우트 vs 안 되는 라우트" 설정 비교 필요)
- **151 네이버식 네비 뼈대** (`140b929`): `MainNav` 6메뉴 재편 [홈·마켓·토론·뉴스·평가·검증·MY] + `/discussion`·`/news` 페이지 shell 신설(전역 layout 상속, 기존 모듈 재사용). 브라우저 확인 ✓ (active 탭 밑줄·페이지 로드)
- **V7 진입**: 네이버페이 증권을 spec 으로 똑같이 복제 후 운종식 적응. 코인 제외. 마스터 = `docs/SITE_MAP_V7.md`. 다음 STEP 152 = 마켓 페이지(국내·미국 통합 + 랭킹 테이블). 빌드 ✓

## 2026-06-04 — STEP 147 (종목 메타 보강 — 외국인 소진율 + 상장주식수)

종목 페이지 `StockInfoPanel` 재무 섹션에 한국 전용 메타 2행 추가. 마이그레이션·DB·새 의존성 0.
- `/api/kis/price`: `listedShares`(KIS `lstn_stcn` 상장주식수) · `foreignRatio`(KIS `hts_frgn_ehrt` 외국인 소진율) 2필드 추가 — 기존 `inquire-price` 응답에 이미 오던 표준 필드 매핑
- `StockInfoPanel` (`99864a3`): StockData 타입 2필드 + 한국/미국 매핑 + 재무 행 2개(`isKr && 값>0` 가드) + `formatShares` 헬퍼(억주/만주/주)
- **명칭 정확성**: `hts_frgn_ehrt` = "외국인 **소진율**"(보유÷한도). 한도 제한 종목(통신·전력 등)은 보유율과 다를 수 있어 정확한 용어로 표기(네이버 증권 동일) — 운종 신뢰 정체성
- 미국 종목은 두 행 미표시(`isKr` 가드). 빌드 ✓ (exit 0)

## 2026-06-04 — STEP 144·145 (홈 지수 스파크라인 + 브리핑 overnight 안정화)

홈 상단 데이터 품질 P0 두 건. 마이그레이션·DB 변경 0. 새 의존성 0.
- **STEP 144 지수 스파크라인** (`a0cc3bf`): `HomeIndexBar` 미국 5개 지수 카드에 최근 30일 일봉 추세선(외부 라이브러리 없이 inline SVG `<path>`). `/api/yahoo/indices` 에 `yf.chart()` 30일 시계열 → `spark: number[]` 추가(실패 시 빈 배열 graceful). 헤드라인 숫자는 기존 `quote()` 유지(회귀 0). 심볼별 호출로 전환하며 잠재 순서 매칭 버그도 해소
- **STEP 145 브리핑 overnight 안정화** (`90cb8a3`): `/api/home/briefing` `fetchUsIndices` 가 누락·0·NaN 값을 가짜 "+0.00%"(초록) 대신 `hasData:false` 로 표시 → `HomeBriefing` 이 "—"(중립 회색)으로 렌더. "데이터 없음"과 "0% 보합"을 구분 → 운종 신뢰 정체성 정렬
- 빌드 ✓ (exit 0). 야후 정상 시 기존과 동일, 달라지는 건 데이터 없을 때뿐

## 2026-06-04 — 마이그레이션 020·021·022 적용 완료 + FSS 실데이터 적재 ✅

STEP 137~140 에서 작성만 해두고 "적용 대기" 상태였던 마이그레이션 3종을 운종 전용 Supabase(표시명 "OT-Marketing", ref `qxkmwlkchyxfzxbonhtj`)에 **모두 적용 완료**. (POTAL ref `zyurflkhiregundhisky` 사용 금지 — 혼동 주의)
- **020_dislike_votes** ✅ — 상품·리딩방 평가(`platform_discussions`) 추천/비추천: `platform_discussion_likes.vote SMALLINT(-1/1)` + `dislike_count` + 동시갱신 트리거
- **021_fss_advisors** ✅ — 금감원 파인 유사투자자문업자 원장 테이블 + `leading_rooms` 인증 컬럼(`biz_no`·`cert_type`·`cert_verified_at`·`fss_biz_no`). **FSS 실데이터 1,738건 적재 완료** (`scripts/import-fss-advisors.ts`)
- **022_discussion_dislike** ✅ — 종목 토론(`discussions`) 추천/비추천: `discussion_likes.vote` + `discussions.dislike_count` + 동시갱신 트리거
- 효과: STEP 137(리딩방 금감원 신고 검증 뱃지)·STEP 138/140(추천·비추천 투표)이 이제 **실동작**. 코드 변경 없음(마이그레이션·데이터 적재만)

## 2026-06-04 — STEP 143 (홈 빈 섹션·버그 수정 + 시각 밀도)

STEP 142 포털 홈의 비어 보이는/깨진 데이터 섹션 3곳 복구. 마이그레이션 없음.
- **브리핑**: `/api/home/briefing` overnight 가 raw `quoteResponse` fetch(빈값) → `yahoo-finance2` `quote()` 교체(`/api/home/sectors` 와 동일 방식). 미사용 US_SYMBOLS/YF_URL/fmt 제거. DART 일정 범위 당일→최근 3일
- **거래량 랭킹**: `HomeGlobalRanking` 가짜 "spike x·0%" → 실제 `price`·`changePercent` 매핑
- **업종·테마**: `HomeSectorTheme` 두 탭 모두 `/api/home/sectors?market=KR|US` + 올바른 키(`sector`/`change`). 불안정 `kis/theme` 제거
- **랭킹 레터 아바타**: 종목명 첫 글자 컬러 원형(해시 색상) — 거래량·등락 두 열 (타사 로고 X, 운종 자체 UI)
- 빌드 ✓ (exit 0). 인기 토론글 0건은 버그 아님(EmptyState 정상)

## 2026-06-03 — STEP 142 (포털형 홈 전면 재구성)

홈을 한국 증권 정보 포털 레이아웃으로 재구성. 마이그레이션·DB 변경 0. `home-v5` 모듈 재사용.
- `components/home-v6/HomeClientV6` 신규 → `app/page.tsx` 교체 (HomeClientV5 → V6). max-w-1480, 메인(1fr)+우측레일(320)
- 신규 데이터 모듈: `HomeIndexBar`(yahoo/indices, 미국/국내 탭)·`HomeBriefing`(home/briefing 간밤지수+일정+운종 면책)·`HomeGlobalRanking`(거래량 volume-rank/등락 movers/검색 placeholder, 종목클릭→/stock)·`HomeSectorTheme`(국내 kis/theme·미국 home/sectors)·`HomeEtfPicks`(products etf, 필터 인기순만 실데이터)·`HomeRightRail`(아이콘 nav+WatchlistPanel+숏컷 placeholder)
- placeholder shell(빈 자리 유지): `HomeBannerSlot`(fss 신뢰지표)·`HomeCryptoSlot`(코인 보류 결정③)·`HomePopularStocks`(계좌 연동 후)·검색상위·숏컷·ETF 미구현 필터
- 재사용: MarketNewsModule·HotDiscussionsModule·HotRoom/ProductReviewsModule. 🛡️ 검증·평가 섹션 유지(운종 차별점)
- 운종 카피·디자인 시스템만 사용(타사 로고·고유 문구·광고 복제 X). 등락색 토스식(상승#1AC267/하락#F04452)
- **푸터 중복 제거**: 명령서는 HomeClientV6에 Footer 추가였으나 전역 LayoutShell 이 이미 Footer 렌더 → 홈 자체 Footer 생략
- 빌드 ✓ (exit 0). 빈 데이터에도 EmptyState/placeholder 로 렌더

## 2026-06-03 — STEP 141 (종목 공시(DART·SEC) 탭 추가)

네이버 "전자공시" 대응. 신규 데이터·마이그레이션 0 — 기존 `/api/stocks/disclosures` 연결.
- `StockDisclosuresTab` 신규: 한국(DART) / 미국(SEC EDGAR) 자동. 공시 유형 뱃지
- **주의 공시 강조**(운종 신뢰): 유상증자·CB발행·대주주변동·합병분할 → 레드 뱃지 + 하단 안내. 정기보고·재무=파랑, IR·자사주·무상증자=초록
- `StockTabs`: "공시" 탭 추가 (뉴스↔인사이트, 총 5탭 = 차트·시세/토론/뉴스/공시/인사이트). 기본 탭 discussion 유지
- 종목 진입 시 1회 로드(폴링 X, DART 한도 여유). 데이터 없음/에러 시 EmptyState. 빌드 ✓ (exit 0)

## 2026-06-03 — STEP 140 (종목 토론 추천/비추천 통일 — 신뢰 신호 일관화)

상품·리딩방 평가(STEP 020)엔 추천/비추천이 있었으나 종목 토론은 좋아요만 → 통일.
- 마이그레이션 `022_discussion_dislike.sql` 신규 (**2026-06-04 적용 완료**): `discussion_likes.vote SMALLINT(-1/1)` + `discussions.dislike_count` + like/dislike 동시 갱신 트리거(INSERT/DELETE/UPDATE 전환). 기존 좋아요는 vote=1 승계
- `DiscussionItem`: Heart 좋아요 → **ThumbsUp(추천)/ThumbsDown(비추천)**, 사용자당 1표 토글·전환 (PlatformDiscussionBoard 패턴 이식). 댓글·신고·Realtime 유지
- `DiscussionBoard`: `likedIds`(Set) → `voteMap`(Map<id,1|-1>), select +dislike_count, 헤더 "추천 정렬"
- `HotDiscussionsModule`(홈): 좋아요 표시 → 추천 👍 + 비추천 👎 수
- 추천=#1AC267 / 비추천=#F04452 (평가·홈 토스식과 통일). 빌드 ✓ (exit 0). 실제 투표는 022 적용 후 → **2026-06-04 적용 완료, 실동작**

## 2026-06-03 — STEP 139 (종목 페이지 네이버급 디테일 — 기존 API 연결)

신규 데이터 소스·마이그레이션 0 — 이미 있으나 미연결이던 백엔드 API를 화면에 연결.
- `lib/format.ts` 신규: `formatKRW`(조/억/원)·`formatPct`
- `StockInfoPanel`: 시세표에 **거래대금·배당수익률** 행 추가 (KIS `/api/kis/price` 응답에 이미 존재)
- **차트·시세 탭**: `StockOrderbookCard`(호가 10단, 막대그래프)·`StockExecutionCard`(실시간 체결) 신규 — 한국 6자리만, 10초 폴링
- **인사이트 탭 전면 구현**(placeholder 교체): 기업실적분석 표(매출·영업이익·순이익·영업이익률·순이익률 + **ROE·부채비율 파생계산**, DART) + 투자자별 매매동향(KIS) + 업종 등락률(KIS). 재무 fallback(DART 키/코드 없음) 시 안내 + **FnGuide 외부 링크**(V6 ④ 경계)
- 등락색: 시세성(호가·체결·수급·업종)은 **상승 빨강(#F04452)/하락 초록(#1AC267)** — 평가·홈 토스식(초록=상승)과 의도된 구분
- 미국 티커는 KIS 섹션 숨김, 재무표는 시도. `lib/dart-financial.ts`·earnings API 미수정(연결만). 빌드 ✓ (exit 0)

## 2026-06-03 — STEP 138 (홈 화면 신뢰 축 재배치 — V6 정체성 정렬)

정문(홈)을 신뢰 정체성으로 정렬 — 엔진(STEP 137)과 홈의 어긋남 해소. 순수 프론트엔드(마이그레이션 없음).
- **HomeClientV5 위계 재정렬**: 시장핫이슈→토론→평가→뉴스(정보 우선) → **검증·평가 → 평가글 → 토론 → 시장정보(제목 muted, 위계↓) → 뉴스**(신뢰 우선). 히어로에 `fss_advisors` 실 카운트("N개 업체 자동 대조", 적재 1,738건)
- **HotRoomReviewsModule**: 인증 = "금감원 신고 ✓"(토스 그린 pill) / 미인증 = "신고 미확인"(회색) — 신뢰=초록·미확인=무채색 규칙
- **HotReviewPostsModule 신규**: `platform_discussions` 추천/비추천(👍/👎)·outcome(수익/손실/중립) 전시. 홈에서 추천/비추천 보이는 유일한 자리. 데이터 0행이면 EmptyState
- **MarketNewsModule**: 카테고리 탭(전체·국내증시·해외·경제·정책) — 제목 키워드 휴리스틱 1차(`TODO: 분류 정교화`)
- 빌드 ✓ (exit 0). 기존 모듈 삭제 없이 위계만 재정렬

## 2026-06-03 — STEP 137 (FSS 유사투자자문업자 인증 시스템 — V6 Phase 2-①)

운종 신뢰 축 핵심: 리딩방이 금융위(금감원) 실제 신고 업체인지 **공적 데이터 자동 검증**.
- **STEP 0 조사 확정**(라이브): 금감원 파인 목록 = GET `pageIndex` 파라미터, 174페이지(10행/페이지), 봇 UA 차단 → 표준 브라우저 UA 필수. 헤더 동적 매핑으로 컬럼 순서/추가(신고일자) 안전. 라이브 파싱 검증 통과(사업자번호·상호·유효기간 추출 정상)
- **마이그레이션 `021_fss_advisors.sql` 신규** (**2026-06-04 적용 완료**): `fss_advisors` 원장 캐시 + `leading_rooms` 인증 컬럼(biz_no·cert_type·cert_verified_at·fss_biz_no) + RLS 공개읽기
- **`lib/fss.ts`**: cheerio 파싱 + 174페이지 순회(페이지당 딜레이) + 사업자번호 dedup upsert(500배치) + 미수집 active 행 revoked 처리
- **`scripts/import-fss-advisors.ts`** (수동 1회 실행, tsx) — admin import는 상대경로로 별칭 미해석 회피
- **`app/api/cron/fss-advisors/route.ts`** + `vercel.json` cron (UTC 19:00 = KST 04:00, CRON_SECRET 인증). 배포 후 활성
- **검증 API `app/api/rooms/[id]/verify/route.ts`**: 사업자번호 → fss_advisors active+유효기간 대조 → leading_rooms is_certified 토글 (TODO: 운영자/admin 게이팅)
- **뱃지 UI**: RoomsClient·RoomDetailClient → "금감원 신고업체 ✓"(green pill) / "신고 미확인"(gray). 상세에 운영자 사업자번호 검증 폼 + 출처/확인일 + **면책 고지**(투자권유 X·신고=수익보장 아님)
- cheerio·tsx 설치. 빌드 ✓ (exit 0)
- ✅ **2026-06-04**: 021 적용 + 실데이터 **1,738건 적재 완료** → 리딩방 금감원 신고 검증·뱃지 실동작

## 2026-06-03 — V6 Phase 1-3 (KIS 캐시 안정화 — 결정 ④ 1단계)

KIS rate limit 대응: "밀리초 실시간"이 아니라 "캐시 갱신" 모델.
- `lib/kis.ts` `fetchKisApi`에 **응답 TTL 캐시 + 동시요청 coalescing** 추가. 동일 (trId+endpoint+params) 요청은 TTL(기본 15s, `KIS_CACHE_TTL_MS`) 동안 메모리 캐시에서 제공, 동시 요청은 1회 호출로 합침
- 효과: 여러 카드/사용자가 같은 라우트(movers·volume·investor-rank·price·chart 등)를 10초마다 폴링해도 KIS 실호출·rate-limit 큐 부담 대폭 감소. 오류는 캐시 안 함(다음 호출 재시도)
- `cacheTtlMs:0` 으로 호출별 캐시 우회 가능. `.env.example`에 `KIS_CACHE_TTL_MS` 문서화
- 빌드 ✓ (exit 0). (공시 DART 는 30초 폴링·뉴스 RSS 는 revalidate 600 으로 이미 완화 — 추가 캐시는 후속)

## 2026-06-03 — V6 Phase 1-2 (플랫폼 평가 토론 추천/비추천 도입 — 결정 ①)

별점 ❌ → 추천(+1)/비추천(-1) + 사기의심 신고. 조작·명예훼손 리스크 회피.
- 마이그레이션 `020_dislike_votes.sql` 신규 (**2026-06-04 적용 완료**): `platform_discussion_likes.vote SMALLINT(-1/1)` + `platform_discussions.dislike_count` + like/dislike 동시 갱신 트리거(INSERT/DELETE/UPDATE 전환)
- `PlatformDiscussionBoard`: ThumbsUp/ThumbsDown 투표 UI(토스 그린/레드), 사용자당 1표 토글·전환, 본인 투표 선로드(myVotes), 신고 라벨 "사기의심 신고"
- 빌드 ✓ (exit 0). 020 적용 완료 — 실제 투표는 카카오 OAuth 활성화(사용자 작업) 후 로그인 사용자에게 동작

## 2026-06-03 — V6 Phase 1-1 (정체성 카피 전환: "동선의 출발점" → "안 속는 곳")

PRODUCT SPEC V6 확정 — 중심축을 편의(동선의 출발점) → 신뢰(투자상품에 속지 않게 돕는 곳)로 전환. 코드 카피 정렬 1차.
- `app/layout.tsx` 메타: title/description/openGraph + keywords V6 정렬 ("정확한 정보 + 솔직한 토론 + 검증된 신뢰")
- `app/page.tsx` 메타 title 전환
- `app/auth/login` 서브타이틀 전환
- `HomeClientV5` 상단 V6 정체성 태그라인 배너 추가
- 잔여 "동선의 출발점" 0건, 빌드 ✓ (exit 0)

## 2026-06-03 — STEP 135 (잔여 문서 V5 정렬 패치)

STEP 134 commit 후 정밀 재검수에서 발견된 4건 처리 — 헤더만 오늘 날짜이고 본문은 V4 그대로였던 문서 정렬.

- **README.md 전면 재작성**: 핵심 정체성 표 (정보/대화/허브/신뢰) V5 정렬, 운종 V5 페이지 13개 표 추가, "단타·장타·미국주식 × 7개" → "한국 5개·미국 4개 정확 카드", "3창 분리 실시간 채팅" → "종목별 채팅 + 토론·댓글", "21개 카드 + 21개 디테일" → V4 이력으로 강등, 진행 상태 표 STEP 88~135 명시, `cp .env.example .env.local` 실행 가이드 추가
- **docs/BRAND_IDENTITY.md**: 태그라인 "한국 주식 동선" → "한국 금융 동선" (MVP 2.0 포함), 정체성 5가지(V4) → 4박자(V5) — V4 5가지는 보존 명시, 색상 팔레트 V4 → V4·V5 비교 표 (`#0E7C7B`→`#1AC267`, `#C73E3A`→`#F04452`), 중복 "## 이름" 헤더 정리, 참조 섹션 V5 (NEXT_SESSION_START·SESSION_KICKOFF) 추가
- **docs/PRODUCT_SPEC_V4.md**: 상단에 ⚠️ "V4 명세 이력 보존" 안내문 추가 — V4→V5 주요 변경 (3창→2창, 21개→9개, 종목별 채팅, MVP 2.0 평가 디렉토리) 요약 + V5 비전 위치 (NEXT_SESSION_START·SESSION_KICKOFF) 명시
- **.env.example 신규 생성** (STEP 119 결정 후 미생성 상태였음): 21개 키 (Supabase 5 · KIS 6 · DART/ECOS/SEC/FRED 4 · 카카오 OAuth 2 · 토스페이먼츠 2 · OpenAI 1 · SUPABASE_ACCESS_TOKEN rotate 권장) 그룹화
- **.gitignore 패턴 보정**: `.env*` 규칙에 `!.env.example` 예외 추가 — 템플릿 파일이 git 에 포함되도록
- 빌드 영향 X (문서·gitignore만)

## 2026-06-03 — STEP 134 (모든 문서·로그 3차 교차검수 갱신)

- **4개 필수 문서 헤더 일관 (2026-06-03)**: CLAUDE.md · CHANGELOG.md · session-context.md · NEXT_SESSION_START.md
- **NEXT_SESSION_START.md 전면 재작성**: STEP 88~133 진행 상태 표 + 마이그레이션 015~019 적용 완료 명시 (이전 "미적용" 오기 정정) + 운종 V5 페이지 구조 (13개 라우트) + 운종 V5 정체성 + 다음 STEP 후보 (광고 분리·Tier·고아 청소·모바일·OAuth·배포)
- **CLAUDE.md**: 운종 V5 정체성 (네이버 레이아웃 + 토스 카드 + Trustpilot) 반영, MVP 1.0/2.0 구조 명시
- **session-context.md**: Last GC 2026-06-03 갱신, STEP 134 블록 추가
- **SESSION_KICKOFF.md**: V5 최신 상태로 갱신 (이전 2026-05-28 시점)
- **BRAND_IDENTITY.md**: 디자인 시스템 V5 추가 (Pretendard·토스 색상·rounded-2xl)
- **README.md**: 운종 V5 소개 보강
- **3번 교차검수**: 모든 문서의 STEP 번호·날짜·커밋 해시 일관 확인
- 빌드 영향 X (문서만)

## 2026-06-01 — STEP 133 (/screener 제거 + /calendar 외부 링크 + MVP 2.0 디자인 통일, 리뉴얼 5/5)

- `/screener` + `components/screener` 삭제 (정체성 충돌 — 네이버·키움 영역). `lib/watchlist.ts`는 고아 컴포넌트가 아직 사용 중이라 보존
- `/calendar` → Investing.com 외부 링크 안내 페이지(허브 정체성). 기존 CalendarPageClient는 고아로 보존
- `MainNav`: 종목발굴(Screener) 제거 → 상품·리딩방 + 경제 캘린더만 (미사용 BarChart3 import 정리)
- MVP 2.0 4페이지 토스 통일: 디렉토리 카드 `rounded-2xl + shadow-soft + p-5`, 상세 정보 카드 `rounded-2xl + shadow-soft`
- 빌드 ✓ (exit 0). `/screener` 라우트 제거 확인

### 🎉 전면 디자인 리뉴얼 완료 (STEP 129~133)
디자인 시스템(토스 토큰·CardContainer) → 9개 카드 콘텐츠 → 종목 페이지 탭 + 우측 nav → 새 홈 손성기 순서 + MVP 2.0 진입 → 페이지 정리·디자인 통일.
운종 V5 = 네이버 레이아웃 + 토스 카드 + Trustpilot 평가.

## 2026-06-01 — STEP 132 (새 홈 손성기 모듈 순서 + MVP 2.0 진입, 리뉴얼 4/5)

- `HotProductReviewsModule`·`HotRoomReviewsModule` 신규 — HOT 상품/리딩방 평가 TOP 5 (인증 마크)
- `HomeClientV5` 재배치(손성기 순서): 시장 핫이슈 → HOT 토론 → **HOT 평가 2모듈(MVP 2.0)** → 시장 헤드라인
- 컨테이너 gap-5·py-5, 핫이슈 헤더 text-lg, 관심종목 우측 sticky 유지
- `WatchlistPanel` 외곽 rounded-2xl + shadow-soft (토스 카드 톤)
- 빌드 ✓ (exit 0)

## 2026-06-01 — STEP 131 (종목 페이지 네이버 탭 시스템 + 우측 fixed nav, 리뉴얼 3/5)

- `StockTabs` 신규: 차트·시세 / 토론 / 뉴스 / 인사이트 4탭 (활성 border-b-2)
- `StockChartSection` 신규: 큰 일봉 차트(400px) + 일/주/월 토글 + 토스 그린·레드
- `StockInsightsTab` 신규: placeholder (재무·동종업종 추후)
- `StockPageClient`: 가운데 StockNewsModule+DiscussionBoard 직접 렌더 → StockTabs 통합
- `RightFixedNav` 신규(우측 48px, app/stock/layout.tsx 종목 페이지 한정). ⚠️ 미존재 라우트(/notifications·/watchlist·/recent) 대신 기존 라우트(/mypage·/)로 연결 — 페이지 신설 시 교체
- 빌드 ✓ (exit 0)

## 2026-06-01 — STEP 130 (카드 9개 콘텐츠 토스 스타일, 리뉴얼 2/5)

- 종목 행: `rounded px-2 py-1(.5)` → `rounded-lg px-3 py-3 transition-colors` (여유 + 호버 전환)
- 등락 색: `text-unjong-success/danger` → 토스 `text-[#1AC267]`/`text-[#F04452]` (카드 한정, 선명)
- 순위 숫자: `text-base font-bold ... w-5 text-center tabular-nums` (1·2·3 강조)
- 대상: ScalperCards(Movers·Volume·NetBuy·공시)·UsCards(지수·M7·UsMovers·시계)·LongtermCards(공시)
- 빌드 ✓ (exit 0)

## 2026-06-01 — STEP 129 (디자인 시스템 + CardContainer 토스 스타일, 리뉴얼 1/5)

- `globals.css`: 토스 색상 토큰(toss-blue/red/green/gray-*) + `.shadow-soft`·`.shadow-soft-hover` 유틸
- `CardContainer` 재설계: `rounded-2xl` + shadow-soft + hover 전환 + 헤더 emoji 18px·title text-base bold·subtitle xs + 바디 p-5
- 카드 그리드 gap-4 → gap-5 (KrCards · /us 페이지 · HomeClientV5 핫이슈)
- CardContainer 사용처(Scalper·Longterm·Us 카드) 전부 자동 새 디자인 적용
- 빌드 ✓ (exit 0)

## 2026-06-01 — STEP 128 (MVP 2.0 1차 — 상품·리딩방 디렉토리 + 평가 시스템)

### 세션 전체 요약
운종 진짜 차별화 = "Trustpilot 한국 금융 버전" 진입. 금융 상품·리딩방 평가 디렉토리 기반 구축 (MVP 2.0 1차 — 기반만).

### DB 마이그레이션 019 (`supabase/migrations/019_platform_directory.sql` · Cowork 가 MCP 로 별도 적용)
- `products` (etf/fund/wrap/els/bond/reits) · `leading_rooms` (telegram/kakao/discord/… + is_certified)
- `platform_discussions` (다형 — target_type 'product'|'room' + target_id, outcome·duration 평가 메타)
- `platform_discussion_likes` / `platform_discussion_reports`
- 트리거: like_count·discussion_count 자동 갱신 + report 5건 자동 hidden / RLS: 모두 read·인증만 insert
- 시드: ETF 10개(KODEX 200·TIGER 미국나스닥100 등) + 리딩방 placeholder 5개 + Realtime publication

### 신규 페이지
- `/products` 상품 디렉토리(카테고리 필터) · `/product/[id]` 상품 평가(좌 정보 + 우 평가 토론)
- `/rooms` 리딩방 디렉토리(플랫폼 배지·인증 마크·⚠️ "운종 평가 X" 경고문) · `/room/[id]` 리딩방 평가

### 신규 컴포넌트 (`components/platform/`)
- ProductsClient · RoomsClient (디렉토리) · ProductDetailClient · RoomDetailClient (평가)
- `PlatformDiscussionBoard` — DiscussionBoard 패턴 재활용 + target_type 다형 + 좋아요/신고 + outcome(👍/😐/👎)·duration 평가 메타

### 헤더
- `MainNav` SECONDARY_LINKS 에 "상품·리딩방 (Reviews, Award 아이콘)" 추가 (종목발굴 앞)

### 빌드
- `npm run build` ✓ Compiled successfully (exit 0) — TS/ESLint 0. `/products`·`/product/[id]`·`/rooms`·`/room/[id]` 생성 확인.

### 동작 전제 / 정체성
- 실데이터·평가 insert 는 마이그레이션 019 적용 + 카카오 OAuth 활성화 후. 비로그인은 읽기 + 안내.
- 운종 = 평가 X(사용자 토론만), 광고(Sponsored)↔토론 분리·Tier 인증·KOFIA/KRX API 는 추후 STEP.

## 2026-06-01 — STEP 127 (가독성 리뉴얼 — Pretendard + 크기·spacing 상향)

### 세션 전체 요약
"네이버 페이 증권 수준 가독성"(사용자 의도) — Pretendard 폰트 + 텍스트 한 단계 상향 + 카드 spacing. 옵션 B(한 번에).

### [1] Pretendard 폰트 (`app/globals.css`)
- jsDelivr CDN `@import` 추가 (pretendardvariable-dynamic-subset) — 기존엔 font-family 에 'Pretendard' 참조만 있고 로드 X 였음
- body font-family → `"Pretendard Variable"` 우선 (CDN 등록 패밀리명과 일치) + Apple SD Gothic Neo / Noto Sans KR 폴백

### [2] 루트 폰트 크기 (핵심 — 명령서 px 목표의 전제) ⚠️ 추가 조치
- `html { font-size: 13px → 16px }`. 기존 13px 루트 때문에 rem 기반 Tailwind 텍스트가 전부 축소돼 있었음(text-xs=9.75px). 명령서가 주석으로 단언한 "text-xs=12px / text-sm=14px" 및 네이버 수준 목표는 16px 루트에서만 성립 → 명령서 자체 일관성을 위해 함께 변경.

### [3] 텍스트 크기 일괄 상향 (perl, 전 .tsx)
- **순서 교정**: 명령서 sed 는 체이닝 버그로 `text-[10px]`이 `text-xs`→`text-sm`까지 가버림. 교정 순서 = `text-xs→text-sm` 먼저, 그 다음 `text-[10px]/[11px]→text-xs` → 표 의도대로 (10/11px → 12px, 12px → 14px)
- `text-[10px]`·`text-[11px]` → `text-xs` (잔여 0), `text-xs` → `text-sm`
- `text-sm`→`text-base` 는 이번 STEP 제외(명령서 지침)

### [4] 카드 padding / 줄간격
- `p-3`→`p-4` (단어경계 perl — gap-3/px-3 미영향), `px-3 py-2`→`px-4 py-3` (py-2.5 제외)
- `leading-snug`→`leading-normal` (1.5)

### 빌드
- `npm run build` ✓ Compiled successfully (exit 0) — TS/ESLint 0.

### 참고 / 검증
- ⚠️ 이 세션은 일부 셸/Read 출력 렌더가 손상됐으나 명령 실행·exit code·Edit·빌드는 정상. globals.css/layout.tsx 에 이전 자동편집 잔재(중복 font-family 블록)는 무해하게 보존.
- `app/layout.tsx` 의 Inter import 는 미사용(무해)이나 파일 렌더 손상으로 안전상 미제거 → 추후 정리
- 루트 16px + 클래스/패딩 상향 = "한 번에" 의도. 과하면 사용자 시각 확인 후 미세 조정(다음 STEP)

## 2026-05-31 — STEP 126 (종목 페이지 핫픽스 — 종목명·시총·52주·차트)

### 세션 전체 요약
`/stock/000660`(SK하이닉스) 스크린샷에서 발견된 4개 버그 핫픽스.

### 버그 1 — 종목명 미표시 (토론·채팅 헤더가 코드만 표시)
- `StockPageClient`: stocks DB `name_ko` 조회(한국)/ticker(미국) → `stockName` state
- `DiscussionBoard`·`StockChatPanel` 에 `stockName` prop 전달 → 헤더·placeholder `{stockName || symbol}`
- StockInfoPanel 좌측 헤더는 KIS `hts_kor_isnm` 그대로 사용(정상)

### 버그 2 — 시가총액 1억배 오류 (200조 → 0.2조 표시) **결정적**
- KIS `hts_avls` 단위 = 억원. 잘못된 변환 `/100000000` → 올바른 `/10000` (1조=10,000억), 1만 미만 `X억`
- `StockInfoPanel.formatMarketCap`(한국 분기) + `StockDetailPanel` OverviewTab 둘 다 수정

### 버그 3 — 52주 최고/최저 "—" 표시
- `app/api/kis/price/route.ts`: `stck_dryc_*`(당해년도) → `w52_hgpr || w52_lwpr` (52주) 우선, 기존 필드 폴백

### 버그 4 — 차트 빈 박스
- `StockInfoPanel` 차트 effect: 컨테이너 `min-w-[260px] relative`, `createChart width = clientWidth || 280` 폴백
- 빈 candles 가드(`console.warn`) + catch `console.error` 진단 로그

### 빌드
- `npm run build` ✓ Compiled successfully — TS/ESLint 0.
- 차트/시총/52주 실데이터는 KIS 인증·네트워크 필요 → 사용자 실행 환경에서 최종 확인.

## 2026-05-31 — STEP 125 (미국 주식 상세 정보 + 검색 ⭐ Watchlist 통합)

### 세션 전체 요약
미국 주식 종목 페이지를 한국과 동일 수준(시고저·52주·PER·시총)으로 풍부화 + 검색 드롭다운에서 ⭐ 관심종목 추가/제거. 운종 V5 PC 핵심 기능 완성.

### [1] 신규 API — `/api/yahoo/quote-detail?symbol=`
- yahoo-finance2 `quoteSummary` (price·summaryDetail·defaultKeyStatistics·financialData)
- 시고저·거래량·52주·PER·PBR·시총·배당수익률 통합, `.raw ?? value` 양쪽 처리

### [2] StockInfoPanel 미국 분기 풍부화
- 미국 로딩 `/api/yahoo/quote` → `/api/yahoo/quote-detail`
- 시세·재무 박스를 한국·미국 공통 구조로 (조건 `data.open > 0`)
- `formatPrice`/`formatMarketCap` 헬퍼 (미국 $/T·B, 한국 원/조), 가격 헤더 미국 `$` prefix
- isUS = !isKr (별도 state 없이 symbol 기반), "통합 추후" 메시지 제거

### [3] HeaderSearch ⭐ Watchlist 통합 (STEP 113 완료)
- 드롭다운 항목 우측 Star 버튼 → watchlistStore add/remove 토글 (e.stopPropagation)
- 이미 관심종목이면 amber 채워진 별, 비로그인도 동작(localStorage)
- 항목 구조: `<button>`(선택) + `<button>`(⭐)를 `<div>` 안에 분리 (버튼 중첩 회피)

### 빌드
- `npm run build` ✓ Compiled successfully — TS/ESLint 0. `/api/yahoo/quote-detail` 생성 확인.
- Yahoo quoteSummary 라이브 응답은 배포 환경에서 확인 권장 (실패 시 graceful — 시세 박스 미표시).

### 운종 V5 PC 핵심 기능 완성 ✅
구조·카드·청소·인증코드·종목페이지·토론·댓글·채팅·새 홈·차트·뉴스·UI일관성·미국 상세·검색⭐

## 2026-05-31 — STEP 124 (토론 댓글 기능 — 운종 V5 대화 본질 완성)

### 세션 전체 요약
댓글 없는 토론(게시판) → 댓글 있는 토론(대화)로. "운종 = 정보 + 대화" 본질 완성.

### DB 마이그레이션 018 (`supabase/migrations/018_discussion_comments.sql` 신규 · Cowork 가 MCP 로 별도 적용)
- `discussion_comments` 테이블 (discussion_id·user_id·nickname·tier·content(1~2000)·like/report_count·hidden·created_at)
- `comment_count` 자동 갱신 트리거 (INSERT +1 / DELETE -1)
- RLS: 모두 read(hidden=false), 인증만 insert, 본인만 delete + Realtime publication

### 신규 컴포넌트 — `components/stock/DiscussionComments.tsx`
- 댓글 목록(시간 오름차순) + Realtime 구독(postgres_changes INSERT)
- 작성: 인증 필요 + 닉네임·Tier 자동, Enter 전송, 비로그인 amber 안내 + /auth/login
- 본인 댓글 hover 시 삭제(Trash2) → confirm → delete

### DiscussionItem 수정
- 댓글 버튼 onClick → 펼치기/접기 토글 (채워진 MessageCircle = 열림)
- showComments 시 DiscussionComments 자식 렌더
- localCommentCount: 영역 열려있을 때만 댓글 INSERT Realtime 구독해 +1

### 빌드
- `npm run build` ✓ Compiled successfully — TS/ESLint 0.

### 동작 전제 / 잔여
- 실제 댓글 insert 는 마이그레이션 018 적용 + 카카오 OAuth 활성화 후. 비로그인은 읽기만 + 안내.
- 댓글 좋아요·신고, 대댓글(parent_comment_id), 댓글 길이 카운터 UI → 추후

## 2026-05-31 — STEP 123 (UI 일관성 — 공통 상태 컴포넌트 추출)

### 세션 전체 요약
로딩·빈상태·에러 메시지가 컴포넌트마다 달랐던 것을 공통 컴포넌트로 통일. 신규 `components/ui/State.tsx` 생성 후 11개 컴포넌트에 적용.

### 신규 컴포넌트
- `components/ui/State.tsx` — `LoadingState` / `EmptyState` / `ErrorState`
  - `LoadingState`: "⏳ {title}" 중앙 이탤릭, className override 가능
  - `EmptyState`: 이모지 아이콘 + title + description + 선택 action 버튼
  - `ErrorState`: "❌ {title}" 빨간 텍스트

### 적용 파일 (11개)
- `components/stock/DiscussionBoard.tsx` — 로딩/첫 토론 빈상태
- `components/stock/StockChatPanel.tsx` — 로딩/첫 메시지 빈상태
- `components/stock/StockNewsModule.tsx` — 로딩/뉴스 없음 빈상태
- `components/stock/StockInfoPanel.tsx` — 로딩 상태
- `components/home-v5/HotDiscussionsModule.tsx` — 로딩/첫 토론 빈상태
- `components/home-v5/HotChatRoomsModule.tsx` — 로딩/채팅방 없음 빈상태
- `components/home-v5/MarketNewsModule.tsx` — 로딩/에러 상태
- `components/sidebar/ChatPanel.tsx` — 로딩/첫 메시지 빈상태
- `components/sidebar/WatchlistPanel.tsx` — 로딩/관심종목 없음 빈상태 (복원 버튼 포함)
- `components/cards/ScalperCards.tsx` — 4개 카드 (Movers/Volume/NetBuy/Disclosure) 로딩·빈상태
- `components/cards/LongtermCards.tsx` — 로딩·빈상태

### 색상 점검
- 의미 있는 inline 색상 (`emerald/red/amber/blue/purple`) 모두 의도된 사용 (배지·차트) — 변경 X
- `#FEE500` 카카오 브랜드 — 유지
- 차트 라이브러리 hex (`#0ABAB5`, `#C73E3A` 등) — 차트 색계열, 변경 X

### 빌드
- `npm run build` ✓ Compiled successfully — TS/ESLint 0

## 2026-05-31 — STEP 122 (종목별 뉴스 + 시장 헤드라인 — RSS + Yahoo)

### 세션 전체 요약
"운종 = 오르내림 + 대화 + 정보(뉴스)" 4박자 완성. 한국 경제 RSS 5개 통합 시장 헤드라인 + 종목별 뉴스(한국 RSS 종목명 매칭 / 미국 Yahoo).

### 신규 API
- `/api/news/market` — 한경·매경·머니투데이·이데일리·연합 RSS 5개 통합. 정규식 RSS 2.0 파싱(xml2js 무의존), 최신순+제목 중복 제거 TOP 30, revalidate 600(10분 캐싱), Promise.allSettled 로 일부 실패 무시
- `/api/news/stock?symbol=` — 한국(6자리): stocks DB `name_ko` 조회 → KR RSS 3개 제목 종목명 포함 필터 / 미국(티커): Yahoo Finance `yf.search(symbol, {newsCount:10})`

### 신규 컴포넌트
- `components/home-v5/MarketNewsModule.tsx` — 새 홈 시장 헤드라인 (10건, 5분 갱신, 외부 새 탭)
- `components/stock/StockNewsModule.tsx` — 종목 페이지 종목별 뉴스 (5건, 10분 갱신)

### 통합
- `HomeClientV5` 가운데: 시장 핫 이슈 카드 → **MarketNewsModule** → HotDiscussionsModule
- `StockPageClient` 가운데: **StockNewsModule** → DiscussionBoard

### 빌드
- `npm run build` ✓ Compiled successfully — TS/ESLint 0. `/api/news/market`(static 10m revalidate)·`/api/news/stock`(dynamic) 생성 확인.
- RSS 라이브 fetch 검증은 배포 환경 네트워크 의존 → 코드에 graceful 에러 처리(빈 결과 반환). curl 검증은 배포 후.

### 추후 (네이버 검색 API — 사용자 키 발급)
- 종목별 매핑 정확도 ↑ (현재 RSS 종목명 부분일치), 동의어 처리('삼전' 등)

## 2026-05-31 — STEP 120 (종목 페이지 마무리 — 좋아요·신고 + 차트 inline + 미장 Yahoo)

### 세션 전체 요약
종목 페이지 `/stock/[code]` 의 3가지 미완성 마무리: 토론 좋아요·신고 인터랙션, 좌측 일봉 차트 inline, 미국주식 Yahoo 가격 통합.

### [1] 토론 좋아요·신고 (`components/stock/DiscussionItem.tsx` 신규 분리)
- `DiscussionBoard` 인라인 DiscussionItem → 별도 파일 분리 (상태 관리)
- 좋아요: onClick → `discussion_likes` insert/delete 토글 + 낙관적 카운트 + 채워진 하트
- 신고: onClick → `confirm` 다이얼로그 → `discussion_reports` insert (5건↑ 자동 hidden)
- 비로그인 클릭 → amber 배너 "로그인 후 이용 가능합니다" + /auth/login (3초 자동 숨김)
- `DiscussionBoard`: 본인 좋아요한 글 ID(`likedIds`) 미리 로드 → 초기 liked 상태 표시
- 댓글 버튼: disabled (count 만, 댓글 기능 추후)

### [2] StockInfoPanel 차트 inline
- 종목 헤더 박스 아래 60일 일봉 캔들 차트 (높이 200px)
- lightweight-charts dynamic import (STEP 108 ChartTab 재활용), attributionLogo: false
- 한국 주식만 표시 · ResizeObserver 너비 자동 조절 (effect cleanup 으로 안전 해제)

### [3] 미국 주식 StockInfoPanel — Yahoo 통합
- 미국 분기: `/api/yahoo/quote?symbols=` 호출 (가격·등락률) — "통합 추후" 메시지 제거
- 시세·재무 박스는 한국 주식만 풍부 / 미국은 "Yahoo Finance 통합 작업 중" 안내
- 종목명은 ticker 표시 (Yahoo quote 가 종목명 미반환 — quoteSummary 통합 추후)

### 빌드
- `npm run build` ✓ Compiled successfully — TS/ESLint 0. `/stock/[code]` 정상.

### 참고 (인증 미활성화)
- 좋아요·신고 실제 DB insert 는 RLS 상 로그인 필요 → 카카오 OAuth 활성화(STEP 118 사용자 작업) 후 동작. 비로그인은 안내 배너로 흐름 차단.

## 2026-05-31 — STEP 117 (새 홈 페이지 + dashboard 처분 + V3 2차 청소)

### 세션 전체 요약
`/` 가 V3 redirect → V5 새 홈으로 전환. dashboard + V3 12개 페이지 + V3 컴포넌트(home/widgets/chat) 통째 삭제. "한국 주식 동선의 출발점" 정체성 (네이버 페이 증권 홈 리뉴얼 인사이트 적용).

### 신규
- `app/page.tsx` — `/` 가 새 홈 (이전: `/kr` redirect)
- `components/home-v5/HomeClientV5.tsx` — 3컬럼 (좌 채팅+활발한 채팅방 · 중 시장 핫 이슈 카드 4종+HOT 토론 · 우 관심종목 sticky)
- `components/home-v5/HotDiscussionsModule.tsx` — 24시간 좋아요 순 토론 TOP 10
- `components/home-v5/HotChatRoomsModule.tsx` — 24시간 메시지 많은 종목 TOP 5 (클라 집계)

### 삭제 (운종 V5 가 100% 대체)
- `app/dashboard` (V3 5섹션 통합 홈)
- V3 12개 페이지: briefing/analysis/chat/chart/orderbook/ticks/disclosures/investor-flow/movers/net-buy/news/themes/market-map
- `components/home/*` (HomeClient·WidgetCard), `components/widgets/*` (위젯 28개), `components/chat/*` (FloatingChat)

### 보존 판단 (명령서 [5] 검증 결과)
- **`app/api/home/*` 보존** — `/api/home/disclosures` 가 살아있는 V5 카드(ScalperDisclosureCard)에서 사용 중. (`briefing`·`investor-flow` 도 일부 V3 컴포넌트가 참조)
- Footer: 삭제 페이지로의 링크 없음 → 변경 없음
- 명령서 예시의 `DisclosureCard` → 실제 export 명 `ScalperDisclosureCard` 로 수정 적용

### 이연 사항
- 고아 컴포넌트 dirs(analysis/briefing/stocks/news/dashboard/movers/net-buy/orderbook/ticks/toolbox/watchlist/partners/payment/advertiser 등) — 호스트 페이지 삭제로 미사용. 빌드 영향 없어 추후 일괄 정리
- 고아 `stores/chatStore.ts` (FloatingChat 전용이었음), `components/layout/TopNav.tsx` — 추후
- `app/global` — 명령서 12개 목록에 없어 보존

### 빌드
- `npm run build` ✓ Compiled successfully — TS/ESLint 0. 라우트 맵: `/` 새 홈 생성, dashboard+V3 12개 제거 확인.

### 운종 V5 페이지 구조 (최종)
- `/` 새 홈 · `/kr` 한국 5카드 · `/us` 미국 4카드 · `/stock/[code]` 종목(정보·토론·채팅) · `/screener` · `/calendar` · `/auth/login`·`/auth/callback` · `/mypage`

## 2026-05-31 — STEP 115 (종목 페이지 + 토론 게시판 + 종목별 채팅 — V5 핵심)

### 세션 전체 요약
운종 본질 페이지 `/stock/[code]` 신규 — 좌(종목정보)·중(토론)·우(실시간 채팅) 3컬럼. 토스/네이버 페이 증권 패턴. 검색·관심종목·카드 클릭 동선을 종목 페이지로 통합.

### DB 마이그레이션 017 (`supabase/migrations/017_discussions.sql` 신규 · Cowork 가 MCP 로 별도 적용)
- `discussions` (토론 게시글: symbol·nickname·tier·content·like/comment/report_count·hidden)
- `discussion_likes` (좋아요, PK 복합) · `discussion_reports` (신고, 5건↑ 자동 hidden)
- `chat_messages.symbol` 컬럼 추가 (NULL=전체, 값=종목별 채팅)
- like_count·report_count 자동 갱신 트리거 + RLS (모두 read, 인증만 insert) + Realtime publication

### 신규 페이지/컴포넌트
- `app/stock/[code]/page.tsx` + `app/stock/layout.tsx` (메인 헤더 유지 passthrough)
- `StockPageClient` — 3컬럼 grid (320 / 1fr / 380), 진입 시 selectedSymbol 동기화
- `StockInfoPanel` — 좌측 sticky 종목 정보 (가격·시세·재무, KIS 30초 폴링, 미국주식 추후 표시)
- `DiscussionBoard` — 가운데 토론 (HOT/최신 정렬, 비로그인 글쓰기 차단+로그인 안내, 좋아요/신고 UI)
- `StockChatPanel` — 우측 종목별 실시간 채팅 (symbol 필터 + postgres_changes, 비로그인 가능)

### 동선 변경 (→ /stock/[code])
- `HeaderSearch` 선택, `WatchlistPanel` 클릭, 카드 클릭(Movers·Volume·NetBuy·장타공시·M7·UsMovers) — setSelectedSymbol 유지 + router.push 추가

### 운종 정책
- 토론 읽기 = 비로그인 OK / 글쓰기 = 로그인 후 (카카오 안내) · 채팅 = 비로그인 OK (트레이더-XXXX) · 신고 5건↑ 자동 숨김

### 미구현(다음 STEP) — 명령서 명시
- 좋아요·신고·댓글 onClick 동작, 미국주식 종목 정보(Yahoo) 통합, 종목 페이지 차트 — 모두 추후

### 빌드
- `npm run build` ✓ Compiled successfully — TS/ESLint 0. `/stock/[code]` 동적 라우트 생성 확인.

## 2026-05-31 — STEP 118 (Layer 3 인증 — 카카오 OAuth + DB 통합 + 로그인 UI)

### 세션 전체 요약
V3 이메일/비밀번호 인증 → 카카오 OAuth 단일로 전환. users 테이블 V5 정리(결제 컬럼 제거 + tier 추가) 마이그레이션 016 동봉. 인증 선택사항 정책(비로그인도 채팅·관심종목 가능).

### [1] DB 마이그레이션 016 (`supabase/migrations/016_users_v5.sql` 신규)
- V3 결제 컬럼 제거: subscription_status / subscription_start_date / subscription_end_date / billing_key
- `tier SMALLINT (1·2·3)` 추가 — 운종 Tier 시스템, `bio TEXT` / `oauth_provider TEXT` 추가
- `handle_new_user()` 트리거: auth.users INSERT 시 public.users 자동 생성 (카카오 raw_user_meta_data 닉네임/아바타 추출, ON CONFLICT DO NOTHING)
- RLS: 전체 SELECT 허용, 본인만 UPDATE
- ⚠️ **Cowork 가 Supabase MCP 로 별도 적용** (Claude Code 적용 X)

### [2] 페이지
- `app/auth/signup` 삭제 (카카오 OAuth 가 자동 가입 처리)
- `app/auth/login/page.tsx` V5 운종 디자인 새로 작성 (카카오 버튼 1개 · FEE500)
- `app/auth/callback/route.ts` 정리 (exchangeCodeForSession + 트리거 미적용 대비 폴백 insert, 디버그 console.log 제거, next ?? /kr)

### [3] 코드
- `types/user.ts` — V3 결제 필드·UserRole·SubscriptionStatus 제거, `role: free|premium|pro` + tier·bio·oauth_provider 추가
- `stores/authStore.ts` — tier state 추가 (setUser 시 user.tier 반영)
- `stores/nicknameStore.ts` — ensureNickname 로그인 시 DB 닉네임 우선 + 비로그인 localStorage 폴백
- `components/auth/AuthProvider.tsx` — 변경 없음 (`.select('*')` 가 tier 포함)
- `lib/utils/permissions.ts` 삭제 (V3 admin/advertiser 권한 헬퍼 — 미사용 고아, UserRole 의존)
- `app/mypage/page.tsx` — 삭제된 subscription 필드 참조 제거 (구독 배지만 유지)

### ⚠️ 사용자(Jang Eun) 직접 작업 필요 (별도)
1. 카카오 Developers 콘솔: 앱 등록 + Web 플랫폼/Redirect URI + 동의항목 + REST API 키 발급
2. Supabase Dashboard: Kakao Provider ON + REST API 키 입력
   - Redirect: `https://qxkmwlkchyxfzxbonhtj.supabase.co/auth/v1/callback`

### 빌드
- `npm run build` ✓ Compiled successfully — TS/ESLint 0. `/auth/signup` 라우트 제거, `/auth/login`·`/auth/callback` 정상.

## 2026-05-31 — STEP 116 (V3 잔재 1차 청소 — 9개 페이지 + 의존 컴포넌트·API)

### 세션 전체 요약
V3/OTMarketing 잔재 페이지 9개 + V3 결제·광고 API 3개 + 전용 컴포넌트 2개 삭제. dashboard·widgets·V3 13개 페이지·auth·mypage 는 보존 (STEP 117 에서 재결정).

### [1] 페이지 폴더 9개 삭제
- `app/ad`, `app/advertiser`, `app/admin`, `app/partner` (OTMarketing 잔재 — 2026-04-23 별도 저장소 분리)
- `app/payment`, `app/pricing` (V3 결제 — 운종은 거래 X)
- `app/toolbox` (V3 도구 — V4 대체)
- `app/stocks`, `app/watchlist` (V3 종목/관심종목 — V4 검색·Screener·WatchlistPanel 대체)

### [2] V3 결제·광고 API endpoints 삭제
- `app/api/payment`, `app/api/advertiser`, `app/api/admin`

### [3] 의존 컴포넌트
- 삭제: `components/common/PaywallModal.tsx` (app/stocks·AuthGuard 전용 → 0 사용)
- 삭제: `components/auth/AuthGuard.tsx` (사용처가 전부 삭제된 admin·stocks 뿐 → 0 사용)
- 보존: `components/chat/FloatingChat.tsx` (HomeClient/dashboard 가 사용 중)

### [4] 잔여 링크 정리 (삭제 라우트 404 방지)
- `components/layout/Header.tsx` — 프로필 드롭다운 `/stocks?tab=watchlist` 링크 제거
- `components/widgets/WatchlistWidget.tsx` — `href '/watchlist'` → `/kr`, 종목 링크 `/stocks/${symbol}` → `/kr`
- `app/mypage/page.tsx` — `/pricing` 프리미엄 CTA 제거(미사용 Crown import 정리), 관심종목 `/stocks/${symbol}` 링크 → `/kr`
- `components/layout/Footer.tsx` — 광고 문의 `/advertiser` → `mailto:ad@stockterminal.com`

### 범위 메모
- 보존된 V3 페이지(analysis/news/chat 등) 내부 컴포넌트의 `/stocks/*` 링크는 호스트 페이지가 보존 대상이라 STEP 117 로 이연. 문자열 링크라 빌드 영향 없음.
- `components/layout/TopNav.tsx` 는 어디에서도 import 안 되는 고아 컴포넌트(렌더 X) — 이번엔 미정리.

### 빌드
- `npm run build` ✓ Compiled successfully — TypeScript/ESLint 에러 0. 라우트 맵에서 9개 페이지 제거 확인.
- 검증 grep 3종(삭제 import / PaywallModal / 정적 href) 모두 0건.

## 2026-05-31 — STEP 114 (운종 V5 1차 리뉴얼 — 구조 통합)

### 세션 전체 요약
3창(단타/장타/미장) → 2창(한국/미국) 통합, 카드 21개 → 정확 9개, 종목 상세 4탭 → 2탭, 채팅 3채널 → 1채널, 컨테이너 1984px. "정확도 보장되는 본질만" 방향으로 대규모 정리.

### [1] 컨테이너 너비 (`app/layout.tsx`)
- `max-w-screen-2xl`(1536px) → `max-w-[1984px]` (토스 수준 화면 사용)

### [2] 3창 → 2창 통합
- `app/(windows)/scalper`, `longterm` 폴더 삭제 → `app/(windows)/kr` 신규 (page + [card])
- `app/(windows)/us` 유지 (메타 "미국주식 — 운종")
- `next.config.ts` redirect: `/scalper`, `/longterm`(+ :path*) → `/kr` 영구 이동
- 홈 `app/page.tsx` redirect `/scalper` → `/kr`
- 메뉴 `MainNav.tsx`: ⚡단타창/🌳장타창/🌙미국주식창 → 🇰🇷한국주식/🇺🇸미국주식

### [3] 카드 21개 → 정확 9개
- 한국 5개 (`components/cards/KrCards.tsx` 신규): Movers·Volume·NetBuy·단타공시·장타공시
- 미국 4개: 글로벌 지수·M7·미국 Movers·미국 시계+시장상태
- 삭제 12개: ViCard·ThemeTop10Card·ShortInterestCard (ScalperCards), EarningsCalendarCard·ValueScreenCard·DividendTopCard·Lows52WCard·SectorCard·WarningStockCard (LongtermCards), PreAfterMarketCard·UsNewsCard·FOMCCalendarCard (UsCards)
- `CardDetail.tsx` CARD_META 9개 + window 타입 `kr | us` 로 정리, 카드 detailHref `/kr/*`·`/us/*` 통일

### [4] 종목 상세 4탭 → 2탭 (`StockDetailPanel.tsx`)
- 유지: 차트, 종합 / 삭제: 호가창(OrderBookTab)·체결(TickTab) — 전문가용, 운종 페르소나 X

### [5] 채팅 3채널 → 1채널 (`ChatPanel.tsx`)
- ROOM_META `general` 단일 ("💬 운종 전체 채팅"), room 상태 const 고정, 디버그 console.log 제거
- DB 마이그레이션 `supabase/migrations/015_chat_unify.sql` 동봉 (⚠️ Cowork 가 Supabase MCP 로 별도 적용)

### 빌드
- `npm run build` ✓ Compiled successfully — TypeScript/ESLint 에러 0

## 2026-05-29 — 세션 #28 종료 (STEP 107~109 완성)

### 세션 전체 요약
채팅 무한로딩 픽스 + 종목 상세 패널 4탭 실데이터 + 관심종목 실데이터화. Layer 1 전면 실데이터 완성.

### STEP 107 (`lib/supabase/anon-client.ts` 신규)
- `@supabase/ssr` createBrowserClient 세션 락 버그 → 순수 `@supabase/supabase-js` 익명 클라이언트로 교체
- `ChatPanel.tsx` — createAnonClient 사용, 10s Promise.race 타임아웃, try/catch 완비

### STEP 108 (`components/sidepanel/StockDetailPanel.tsx` 전면 교체)
- ChartTab: dynamic import lightweight-charts, KIS 봉차트 실데이터
- OrderBookTab: `/api/kis/orderbook` + `/api/kis/price` 10초 폴링
- TickTab: `/api/kis/execution` 5초 폴링
- OverviewTab: `/api/kis/price` 30초 폴링 + 시가총액·PER·PBR 표시

### STEP 109 (`ebbd416`)
- `app/api/yahoo/quote/route.ts` — 미국주식 batch quote API 신규
- `stores/watchlistStore.ts` — Zustand persist (localStorage), KR 5 + US 3 seed
- `components/sidebar/WatchlistPanel.tsx` — KIS(KR) + Yahoo(US) 30초 폴링 실데이터
- `app/mypage/page.tsx` — useWatchlistStore 제거 → local state (DB-backed)

## 2026-05-29 — 세션 #27 종료 (Layer 1-B 완성 — Supabase Realtime 채팅)

### 세션 전체 요약
Layer 1-B (Supabase Realtime 채팅) 완성. ChatPanel 더미 제거 → 실시간 송수신. 3창 채팅방 분리.

### STEP 106 (`6b350d8`)
- `supabase/migrations/014_chat_rooms.sql` — chat_messages 에 room + nickname 추가, INSERT RLS 익명 허용, 방별 Broadcast 트리거
- `stores/nicknameStore.ts` — Zustand persist, 트레이더-XXXX 자동생성
- `components/sidebar/ChatPanel.tsx` — 더미 제거, postgres_changes Realtime, 과거 100건 로드, Enter 전송, 자동스크롤

⚠️ 채팅 활성화: Supabase Dashboard SQL Editor 에서 `014_chat_rooms.sql` 실행 필수

## 2026-05-29 — 세션 #26 종료 (Layer 1-A 완성 — 21/21 카드 100% 실데이터)

### 세션 전체 요약
Layer 1-A (카드 실데이터) 7개 STEP 완성. 단타창 7/7 + 장타창 7/7 + 미국주식창 7/7 = **21/21 카드 100% 실데이터**.

### STEP 100 (`1f46fa3` 기준, 이번 세션 복원)
- 15개 카드 → setSelectedSymbol 연결 (카드 클릭 → 우측 패널 자동 업데이트)

### STEP 101 (`6fa3c79` 이후)
- MoversCard 실데이터: `/api/kis/movers` → 단타창 1/7

### STEP 102
- VolumeCard `/api/kis/volume-rank?sort=spike&limit=5`
- NetBuyBrokerCard `/api/kis/investor-rank`
- ScalperDisclosureCard `/api/home/disclosures?limit=5`

### STEP 103
- ViCard: `/api/kis/vi` 신규 (±5% 해제 / ±8% 발동 필터)
- ThemeTop10Card: `/api/kis/theme` 신규 (THEME_MAP 10개 × 3-4종목)
- ShortInterestCard: `/api/krx/short-interest` 신규 (시드 데이터)
- **단타창 7/7 완성** ✅

### STEP 104
- LongtermDisclosureCard: `/api/dart/disclosures-longterm` 신규
- EarningsCard: `/api/dart/earnings-calendar` 신규
- ValueStocksCard: `/api/db/value-stocks` 신규
- DividendCard: `/api/db/dividend-top` 신규
- Lows52WCard: `/api/db/52w-lows` 신규
- SectorCard: `/api/kis/sector` 신규
- WarningCard: `/api/krx/warning` 신규
- **장타창 7/7 완성** ✅

### STEP 105 (`bbe3adf`)
- GlobalIndicesCard: `/api/yahoo/indices` (S&P/Nasdaq/Dow/Russell/VIX)
- PreAfterMarketCard: `/api/yahoo/prepost` (8개 한국인 인기 종목)
- Magnificent7Card: `/api/yahoo/m7` (NVDA·AAPL·MSFT·GOOG·AMZN·META·TSLA)
- UsMoversCard: `/api/yahoo/us-movers` (day_gainers screener + fallback)
- ForexClockCard: `/api/forex/usdkrw` (환율 60초) + 클라이언트 시계 1초 (EST/KST + 시장상태)
- UsNewsCard: `/api/news/us` (Yahoo S&P 500 뉴스 검색)
- FOMCCalendarCard: `/api/calendar/us-econ` (시드 + D-day 자동계산)
- **미국주식창 7/7 완성** ✅
- **🎯🎯🎯 21/21 (100%) 모든 카드 실데이터 완성 — Layer 1-A 끝**

## 2026-05-27 — 세션 #25 종료 (Layer 0 + 21개 카드 디테일 완성)

### 세션 전체 요약
운종(雲從) 브랜드 확정 + V4 비전 + Layer 0 시각 골격 + 21개 카드 (3창 × 7) + 21개 디테일 페이지 + 3컬럼 레이아웃 + ContextNav 자동 변경까지 한 세션에 완성. **운종 시각 정체성 100% 구현.**

### 추가 STEP (STEP 94 이후)

#### STEP 95-A (revert) — V3 헤더 잔재 제거 (잘못된 제거 → 롤백)
- 처음 Header + TickerBar + TopNav + LayoutShell + Footer 5개 모두 제거 → 과도한 제거
- LayoutShell·Footer 까지 빠져서 페이지 골격 깨짐
- `git revert d6227a8` 으로 STEP 95-A 롤백 (`9b1676f`)

#### STEP 96 (`c0bbff0`) — 단타창 카드 4개 추가
- VI 발동/해제 (한국 시장 특유)
- NetBuy + 거래원 매수상위 (통합)
- 테마 TOP10
- 공매도 잔고 변화 (숏커버/위험 시그널)
- 단타창 채팅 메시지 100% 화면 동기화

#### STEP 97 (`c08696d`) — 장타창 카드 4개 추가
- 저평가 종목 (PER/PBR/ROE 조합)
- 배당 캘린더 + 수익률 TOP
- 52주 신저가 우량주
- 관리종목·투자유의 (위험 회피)
- 가치투자자 채팅 메시지 100% 동기화

#### STEP 95-C (`8441316`) — 헤더 4단 통합 + ContextNav
- V3 헤더 골격 유지 + 운종 브랜드로 통일
- STOCK TERMINAL → UNJONG 운종 (영문 + 한글, 한자 X)
- V3 검색 아이콘 → 큰 통합 검색박스
- V3 + 운종 글로벌 티커 통합 (TradingView 실시간 위젯 유지)
- V3 옛 네비 16개 → 3창 + 종목발굴 + 경제캘린더
- 4단 ContextNav 신설 — 창별 카드 7개 메뉴 자동 변경 (앵커 점프 + 금색 깜박임)
- 두 번째 운종 헤더 (UnjongHeader) import 제거
- 카드 21개에 id 추가 (앵커 점프 연결)

#### STEP 95-D (`03fd1ed`) — 헤더·페이지·사이드 미세조정 7개
- 1단 우측 아이콘 정렬·크기 통일 (size 18 + p-1)
- 3단 메뉴 영문+한글 병기 (종목발굴 (Screener) · 경제캘린더 (Calendar))
- 4단 ContextNav 위치 변경 (좌측 채팅창 침범 X, 메인+우측 wrapper 안)
- 페이지 헤더 박스 제거 (⚡단타창 박스 등 3창 모두)
- Layer 1 안내 박스 제거 (3창 모두)
- 카드 그리드 3열 → 2열 (md:grid-cols-2)
- 좌측 사이드 비율 고정 (채팅 65% + 관심종목 35%)

#### STEP 95-E (`ea52558`) — 3컬럼 구조 재설계
- 우측 사이드패널 (StockDetailPanel 별도 컬럼) 폐기 → 메인 영역 1행으로 이동
- 관심종목을 좌측에서 우측 컬럼으로 이동 (폭 300px)
- 채팅 좌측 sticky top + 고정 500px
- 좌측 채팅 아래 빈 공간 = Layer 2 광고·텔레그램 placeholder
- StockDetailPanel `inline` prop 추가 (풀폭 가로 헤더 디자인)
- overflow-hidden 제거 → 페이지 자연 스크롤

#### STEP 95-E1 (`8c7dc6a`) — 차트 풀폭 사이즈 핫픽스
- ChartTab 의 차트 placeholder `aspect-[4/3]` → `w-full h-[300px]`
- SVG viewBox 400×300 → 1600×400 (4:1 가로)
- preserveAspectRatio="none" + polyline 13 포인트 재배치
- 차트가 풀폭으로 펼쳐짐

#### STEP 95-F (`cf5835e`) — 카드 풀폭 (관심종목 영역 침범)
- 우측 별도 컬럼 (WatchlistPanel aside) 제거
- 우측 영역 안에 1행 wrapper 추가 — 종목상세 (flex-1) + 관심종목 (300px) 가로 배치
- 2행~ children = 우측 영역 풀폭 (카드가 관심종목 위까지 침범)
- WatchlistPanel: h-full + rounded-lg + overflow-y-auto (자체 영역 스크롤)

#### STEP 98+99 (`8890620`) — 미국주식창 카드 4개 + 카드 디테일 페이지 21개

**STEP 98 — 미국주식창 카드 4개 추가**:
- Pre-market / After-hours 변동 TOP (NVDA Pre +2.4% · TSLA AH -1.8% 등)
- Magnificent 7 (NVDA·AAPL·MSFT·GOOG·AMZN·META·TSLA)
- USD/KRW 환율 + 미국 시계 (REGULAR/PRE/AH 상태)
- FOMC·CPI·NFP·GDP·PMI 캘린더
- **미국주식창 7개 카드 완성** → 21개 카드 (3창 × 7) 총합 완성
- 미장 투자자 채팅 메시지 100% 동기화

**STEP 99 — 카드 더보기 + 디테일 페이지 (동적 라우트 21개)**:
- CardContainer.detailHref prop 추가 — 헤더에 "더보기 →" 링크
- 21개 카드 (3창 × 7) 모두 detailHref 전달
- CardDetail.tsx 공통 컴포넌트 (21개 메타 + 뒤로가기 + 필터/정렬 placeholder)
- 동적 라우트 3개:
  - `app/(windows)/scalper/[card]/page.tsx`
  - `app/(windows)/longterm/[card]/page.tsx`
  - `app/(windows)/us/[card]/page.tsx`
- 21개 디테일 URL 자동 처리:
  - `/scalper/{movers,volume,vi,netbuy,disclosure,theme,short}`
  - `/longterm/{disclosure,earnings,value,dividend,lows,sector,warning}`
  - `/us/{indices,prepost,m7,movers,forex,news,fomc}`
- 디테일 페이지에서도 좌측 채팅 + 1행 (종목상세+관심종목) 유지 (운종 정체성)
- 뒤로가기 = 명시적 Link (`← 단타창으로` 등, router.back() 의존 X)

### 세션 #25 누적 성과
- **운종 시각 골격 100% 완성** — 3컬럼 + 21개 카드 + 21개 디테일 + 헤더 4단 + ContextNav
- 모든 더미 데이터는 Layer 1 에서 실 API 연결 예정
- 글로벌 티커는 TradingView 실시간 위젯 (이미 실데이터)

### 다음 (Layer 1)
- 21개 카드 더미 → 실데이터 (KIS · DART · Yahoo · KRX)
- Supabase Realtime 채팅 실시간
- 카드 → 종목 클릭 → 우측 패널 연결 확장
- 디테일 페이지 풀 리스트 (30~100건+)

---

## 2026-05-27 — STEP 94 + Layer 0 완료 (세션 #25)

### V3 → 운종 메인 전환
- `app/page.tsx` 루트를 `/scalper` 자동 리다이렉트로 교체
- 기존 V3 5섹션 홈을 `app/dashboard/page.tsx` 로 이동 (보존)
- 루트 진입 시 단타창이 첫 화면 (Layer 1 에서 성향 선택 추가 예정)
- FloatingChat v3 — root layout에 원래 없었음, HomeClient 내부에서만 작동 (/dashboard 정상)
- `/dashboard` 상단에 "V3 보존 페이지" 안내 배너 추가

### Layer 0 (틀) 완료 — 8개 STEP 모두 ✅
- STEP 88: 운종 브랜드 정체성
- STEP 89: 3창 라우트 (/scalper /longterm /us)
- STEP 90: 헤더 (로고 · 검색 · 글로벌 티커 · 3창 카드 박스)
- STEP 91: 좌측 사이드 (채팅 + 관심종목)
- STEP 92: 메인 카드 그리드 (창별 3개 더미)
- STEP 93: 우측 사이드패널 (4탭 · 종목 클릭 연결)
- STEP 94: V3 5섹션 → /dashboard 강등 (본 STEP)
- STEP 95: PRODUCT_SPEC_V4 문서

### Layer 1 진입 (다음 세션)
- 카드 7개씩 완성 (단타·장타·미장 각 4개 신규 카드 추가)
- 신규 데이터 연결: VI · 거래원 · 공매도 · 저평가 · 신저가 · M7 · Pre/After · 환율
- Supabase Realtime 채팅 실작동
- 카드 종목 클릭 → 우측 패널 연결 확장
- 글로벌 티커 실시간 (Yahoo + KIS)

---

## 2026-05-27 — STEP 88 (세션 #25)

### Stock Terminal → 운종(雲從) 브랜드 전환
- `package.json` name: `stock-platform` → `unjong`
- `app/layout.tsx` 메타데이터: 운종 브랜드로 통일 (title, description, OpenGraph)
- `app/globals.css` 색상 팔레트 추가 (`--color-unjong-*` CSS 변수, Tailwind v4)
- 모든 "Stock Terminal" / "StockTerminal" 문자열 → "운종(雲從)" 으로 일괄 변경
- `docs/BRAND_IDENTITY.md` 신설 — 이름·의미·태그라인·색상·도메인 전략

### V4 비전 문서화
- `docs/PRODUCT_SPEC_V4.md` 신설 — 운종 비전·구조·레이어 로드맵
- `docs/PRODUCT_SPEC_V3.md` 는 히스토리 보존 (덮어쓰지 않음)

### Layer 0 (틀) 시작점
- STEP 88~95 의 8단계 작업 정의 (1~1.5주)
- STEP 89~94: 라우트·헤더·사이드·카드·V3 강등
- STEP 95: PRODUCT_SPEC_V4 (이미 완료)

### 다음 STEP
- STEP 89: 3창 라우트 구조 (`/scalper` `/longterm` `/us`)

## 2026-04-23 — STEP 02: OTMarketing 분리 후 handoff 문서 셋업

### 주요 변경
- OTMarketing CPA 사업 폴더(`~/OTMarketing/`)가 별도 저장소 `soulmaten7/otmarketing-cpa`로 분리됨 — 본 프로젝트는 `~/stock-terminal/`에서 독립 git 저장소로 운영 (`soulmaten7/stock-terminal`)
- 외장하드 Antigravity 사본은 `_archived_Antigravity_20260423/` 로 명명, 1주일 후 삭제 예정
- 백업 위치: `~/_BACKUP_20260423_191738/` (2026-04-30 이후 수동 삭제)
- 본 세션 산출물:
  - `CLAUDE.md` 갱신 — 절대 규칙에 "OTMarketing 분리" 항목 추가, 실행 명령어 경로를 `~/Desktop/OTMarketing` → `~/stock-terminal` 으로 교체
  - `docs/NEXT_SESSION_START.md` 상단에 "2026-04-23 OTMarketing 분리 직후" 박스 추가 (기존 내용 보존)
  - `docs/CROSS_REFERENCE.md` 신규 생성 — OTMarketing과의 공유 인프라·분리 경계 명시

### 분리 이전과의 차이
- (분리 이전) `~/OTMarketing/` 한 폴더에 Stock Terminal Next.js 앱 + CPA 템플릿 혼재
- (분리 이후) Stock Terminal 코드만 독립 폴더 + 독립 git + 독립 Vercel 프로젝트
- (영향) Vercel·GitHub 계정은 공용, 저장소·도메인·DB는 분리

### 미커밋 변경 (working tree 보존, 다음 세션에서 별도 처리)
- `M components/widgets/SectorHeatmapWidget.tsx` (STEP 87 잔여)
- `D templates/proposals/*` (OTMarketing으로 이관 — local 삭제만 반영, 원본은 `~/OTMarketing/templates/proposals/`에 보존)
- `?? docs/STEP_01_PROJECT_SEPARATION.md`, `?? docs/STEP_87_COMMAND.md`

## 2026-04-23 — STEP 87: 회귀 핫픽스 + UI 디테일 (yahoo-finance2 v3 인스턴스화 / 반응형 / 툴팁 / 호가창 동기화)

## 2026-04-23 — STEP 86: 신규 화면 3개 (/market-map 섹터 히트맵 + /themes 테마주 + /disclosures 2컬럼) + TopNav 링크 정비

## 2026-04-23 — STEP 85: 데이터 품질 수정 (sectors KR 폴백 + movers 로그 + screener ETF 필터 + news 키워드 필터)

## 2026-04-23 — feat(dashboard): Section 1 L-shape 레이아웃 + FloatingChat v3 + WidgetHeader 통일 (STEP 84) — TickWidget/BriefingWidget/GlobalIndicesWidget/VolumeTop10/NetBuyTop 변환, OverviewTab 14일 필터+종목배지+빈상태 UI

## 2026-04-23 — fix(dashboard): 긴급 패치 6건 통합 (STEP 83) — 섹션 고정높이, 위젯 전체보기 링크, FloatingChat 재설계, 중복key 수정

## 2026-04-23 — chore(qa): STEP 82 통합 QA — 빌드 검증, console 정리, V3_RELEASE_NOTES.md 생성, 세션 문서 업데이트

## 2026-04-23 — feat(widgets): 체결창/호가창 폴리싱 — fadeIn 애니, 대량체결 배지, depth bar, 총잔량, selectedSymbol 동기화 (STEP 81)

## 2026-04-23 — feat(home): Section 5 Information Streams — NewsStream + DisclosureStream(KR/US) + EconomicCalendar (STEP 80)

## 2026-04-23 — feat(home): Section 4 Market Structure — SectorHeatmapWidget (KR/US 토글) + ThemeTop10Widget (STEP 79)

## 2026-04-23 — feat(home): Section 3 Discovery — ScreenerExpandedWidget + MoversPairWidget + Volume/NetBuy inline (STEP 78)

## 2026-04-23 — feat(chat): 인라인 ChatWidget → 전역 FloatingChat 전환 (3상태: 닫힘/최소화/열림) (STEP 77)

## 2026-04-23 — feat(dashboard): Section 2 Pre-Market & Global 추가 — 장전 브리핑 + 글로벌 지수 확장 17지표 (STEP 76)

## 2026-04-23 — feat(dashboard): Section 1 TODO 보강 — 배당/DART재무상태·현금흐름/SEC공시 (STEP 75)

## 2026-04-22 — feat(dashboard): Section 1 반응형 + 선택 종목 persist + 모바일 토글 (STEP 74)

## 2026-04-22 — feat(dashboard): 뉴스·공시·재무 탭 상세 콘텐츠 (STEP 73)

## 2026-04-22 — feat(dashboard): 종합 탭 5블록 실데이터 연결 (STEP 72)

## 2026-04-22 — feat(dashboard): selectedSymbolStore + 종합 탭 5블록 구조 골격 (STEP 71)

## 2026-04-22 — feat(dashboard): Section 1 3컬럼 레이아웃 + 우측 종목상세 패널 스켈레톤 (STEP 70)

## 2026-04-22 — docs: Dashboard Spec V3.2 — Section 1 우측 컬럼 확정 (스냅샷 헤더 + 탭 4개, 종합 블록 5개)

## 2026-04-22 — Dashboard Spec V3.1 — Section 1 레이아웃 확정 (🅐 3컬럼 + 60/25/15)

## 2026-04-22 — STEP 59~66: P0/P1 위젯·페이지 전량 실데이터 전환 (commit 6cbf55a)

한 세션에 8개 STEP 일괄 실행 — 28 files, +3482 / -290.

### STEP 59: /global — Yahoo Finance 35개 심볼 실데이터
- `app/api/global/route.ts` 신설 — 35개 심볼을 8개 섹션(국내/미국/선물/환율/채권/원자재/아시아/유럽)으로 반환
- `components/global/GlobalPageClient.tsx` 신설 — 섹션 필터 세그먼트, 52주 고가/저가, 60초 자동갱신, 채권 yield 포맷 구분
- `app/global/page.tsx` — WidgetDetailStub 제거, Client 호출만 남김

### STEP 60: /briefing — 3-컬럼 실데이터
- `components/briefing/BriefingPageClient.tsx` 신설 — /api/home/briefing + /api/calendar/upcoming 조합
- 3-컬럼 그리드: 간밤 미증시 / 오늘 주요 공시 / 이번주 경제지표
- `app/briefing/page.tsx` 스텁 제거

### STEP 61: VerticalNav 5그룹 재구성
- 14개 flat 아이콘 → 5그룹 (시세 / 정보 / 일정 / 글로벌 / 도구)
- hover 시 54px → 220px 확장 애니메이션, 그룹 헤더 uppercase 라벨
- 호가창·체결창·채팅 메뉴 신규 노출 (기존 drawer/inline 전용이던 항목들)
- Task #25 해결

### STEP 62: News 폴리싱
- `NewsFeedWidget` — 소스 배지(6개 색상 맵) 클릭 시 `/news?source=` 프리셋, 종목 태그 `#` 표시
- `NewsClient` — 1h/24h/7d/전체 기간 세그먼트, 중요 공시만 토글, URL 파라미터 초기화 (`useSearchParams`)
- `app/news/page.tsx` — Suspense 래핑

### STEP 63: Calendar 폴리싱
- `EconCalendarMiniWidget` — 3단계 중요도 dot(회색/주황/빨강), 오늘/내일 라벨 + 당일 로우 하이라이트
- `CalendarPageClient` — 기간(7/30/60일) + 국가(6개: 전체/미국/한국/유럽/일본/중국) + 중요도 3-세그먼트
- URL `?importance=` 프리셋 이동 지원

### STEP 64: TrendingThemes + /analysis 폴리싱
- `TrendingThemesWidget` — 상승/하락 토글, 상대 등락률 바 시각화, 테마 클릭 시 `/analysis?theme=` 프리셋
- `AnalysisClient` — 전체 테마 4-컬럼 그리드 섹션 (상승/하락/종목수 정렬) + `?theme=` 파라미터 하이라이트
- `app/analysis/page.tsx` Suspense 래핑

### STEP 65: Chat 폴리싱
- `ChatWidget` — `$005930` `$삼성전자` 패턴 자동 감지 → `/chart?symbol=` 링크 (renderWithTags 파서)
- `app/chat/page.tsx` — WidgetDetailStub 제거, ChatWidget 풀페이지 전환

### STEP 66: Ticks 폴리싱
- `TickWidget` — 6자리 숫자 심볼 인풋, 심볼 변경 시 5초 폴링 재시작
- `components/ticks/TicksPageClient.tsx` 신설 — 통계 패널(체결강도·매수/매도·가중평균가) + 50건 로그 테이블 + 매수/매도 뱃지
- `app/ticks/page.tsx` 스텁 제거, Suspense 래핑

### 결과
- P0/P1 위젯 + 대응 풀페이지 **전량 실데이터** 전환 완료
- 홈 대시보드의 모든 위젯이 기능하는 상태 = 런칭 가능 수준 UI
- 다음 우선순위: 배포(Vercel) 검증 + P2 (Chart 확장, AI 분석 추가) / Supabase 스키마 배포

---

## 2026-04-22 — STEP 58: NetBuy 위젯 + /net-buy TopTab 개선 (P0)

### 변경
- `app/api/kis/investor-rank/route.ts` — sort(buy/sell) + market 파라미터, foreignTop/institutionTop/combined 3종 반환
- `NetBuyTopWidget` — 외국인/기관 + 매수/매도 이중 토글, 막대 시각화, href 동적화
- `components/net-buy/TopTab.tsx` — 3-세그먼트 컨트롤 (Who/Mode/Market) + URL 파라미터 초기화, 종목명 `/chart?symbol=` 링크

---

## 2026-04-22 — STEP 57: Volume 위젯 + /movers/volume 페이지 리팩토링 (P0)

### 변경
- `app/api/kis/volume-rank/route.ts` — market + sort(spike/volume/amount) + limit 파라미터 추가, tradeAmount 필드 포함
- `VolumeTop10Widget` — 배수 막대 시각화 (급등=빨강, 고배수=주황, 기본=티얼), 10x 이상 "급등" 뱃지
- `components/movers/MoversVolumePageClient.tsx` 신규 — 시장구분 + 정렬(거래증가율/거래량/거래대금), 배수 막대, 종목명 → /chart 링크
- `app/movers/volume/page.tsx` — WidgetDetailStub 스텁 제거, Suspense 래퍼로 교체

---

## 2026-04-22 — STEP 56: Movers 위젯 + /movers/price 페이지 리팩토링 (P0)

### 변경
- `app/api/kis/movers/route.ts` — market(kospi/kosdaq/all) + limit(30) 파라미터 추가, prdyVrss·volume 필드 추가
- `MoversTop10Widget` — 상한가/하한가 배경 강조 + 뱃지, 탭 라벨에 상한가 개수, href 동적화 (?tab=)
- `components/movers/MoversPricePageClient.tsx` 신규 — 상승/하락 + 시장구분 + 상한가만 토글, 전일대비·거래량 컬럼, 종목명 → /chart 링크
- `app/movers/price/page.tsx` — WidgetDetailStub 스텁 제거, Suspense 래퍼로 교체

---

## 2026-04-22 — STEP 55: DartFilings 위젯 + /disclosures 페이지 리팩토링 (P0)

### 변경
- `lib/dart-classify.ts` 신규 — classifyDartType / TYPE_COLOR / fmtDartDate / fmtDartDateFull 공용 모듈
- `DartFilingsWidget` — 전체/중요 토글 action 슬롯, 붉은 보더, 중요 뱃지, href 동적화
- `components/disclosures/DisclosuresPageClient.tsx` 신규 — 화이트/티얼 테마, 시장구분·중요 필터, 유형 뱃지 컬럼, URL 파라미터 지원
- `app/disclosures/page.tsx` — Suspense 래퍼 + 다크 테마 잔재 제거

---

## 2026-04-22 — STEP 54: /orderbook 풀스크린 10단 페이지 (P0 Phase B)

### 변경
- `app/orderbook/page.tsx` — WidgetDetailStub 스텁 제거, Suspense 래퍼로 교체
- `components/orderbook/OrderBookPageClient.tsx` — 신설 (URL ?symbol=, 종목 요약 헤더 8개 지표, 10단 호가창 3-col, 총잔량 게이지 바, 5초 갱신)

---

## 2026-04-22 — STEP 53: OrderBookWidget 리팩토링 (P0 Phase A)

### 변경
- `components/widgets/OrderBookWidget.tsx` — 3-col 그리드 (매도잔량·호가·매수잔량), 총잔량 푸터 + 비율 게이지, 6자리 심볼 입력 폼, href 동적화

---

## 2026-04-22 — STEP 52B: 중복·미사용 파일 정리

### 변경
- 죽은 코드 제거: `components/common/LoadingSkeleton.tsx`, `app/compare/`, `components/compare/`
- 구 Phase 명령서 15개 삭제 (PHASE1~4 + V3_W1~W5, 5,702 lines)
- 중복 `docs/DATA_SOURCES_MAPPING.xlsx` 제거 (`REFERENCE_PLATFORM_MAPPING.xlsx`로 대체됨)
- `PRODUCT_SPEC_V3.md` · `NEXT_SESSION_START.md` 구 명령서 참조 정리

---

## 2026-04-22 — STEP 52: Chart 페이지 리팩토링 (P0 Phase A)

### 변경
- `app/chart/page.tsx` — WidgetDetailStub 스텁 제거, Suspense 래퍼로 교체
- `components/chart/ChartPageClient.tsx` — 신설 (URL 파라미터 ?symbol=, 기간 토글 D/W/M, lightweight-charts 캔들+거래량, TradingView 임베드, OHLCV 30행 테이블)
- `components/widgets/ChartWidget.tsx` — href `/chart` → `/chart?symbol={encodeURIComponent(raw)}` 동적화

---

## 2026-04-22 — STEP 51: Watchlist Phase A — 전일비 컬럼 + 인라인 추가 폼 + 정렬

### 변경
- `components/widgets/WatchlistWidget.tsx` — `change` 필드 추가, grid-cols-5, 전일비 컬럼, 종목명 → Link
- `components/watchlist/WatchlistPageClient.tsx` — `change` 필드, 인라인 추가 폼(6자리 검증), 컬럼별 토글 정렬(SortKey 8종), 전일비 컬럼 추가

---

## 2026-04-22 — STEP 50: 레퍼런스 플랫폼 매핑 테이블 작성

### 배경
사용자 지시: "다른 플랫폼에 있는 UI와 기능을 그대로 가져온다. 매수매도만 제외." 이후 STEP 51+ 부터 각 위젯·페이지 UI를 리팩토링하기 전에, 어느 플랫폼을 벤치마킹할지 합의된 매핑 문서가 필요. 중복 기능은 가장 잘 구현된 플랫폼 하나를 선택하고, 한 곳만 있는 기능은 그대로 가져온다는 원칙 확정.

### 추가
- `docs/REFERENCE_PLATFORM_MAPPING.md` — 홈 위젯 14개 + 상세 페이지 14개 + 레퍼런스 URL 리스트 매핑
- `docs/REFERENCE_PLATFORM_MAPPING.xlsx` — 동일 내용 엑셀 버전 (필터링/정렬용, 우선순위 색상 코딩)

### 매핑 요약
- **주 벤치마크 플랫폼 (가장 많이 참조)**: 네이버증권 (정보 조회), TradingView (차트), Koyfin (대시보드/관심종목), Finviz (스크리너/히트맵), Investing.com (경제캘린더/글로벌), 키움 영웅문 (호가·체결·관심종목)
- **우선순위 분포**: P0 = 11개, P1 = 13개, P2 = 5개 (총 28개 매핑)
- **P0 핵심**: 홈/Screener/Watchlist/Chart 페이지 + Watchlist/Chart/OrderBook/DART/Movers/Volume/NetBuy 위젯

### 다음 단계
STEP 51부터 P0 항목 순서대로 레퍼런스 UI 스크린샷 수집 → 위젯별 디테일 스펙 문서 작성 → UI 리팩토링

## 2026-04-22 — STEP 49: 위젯 네비게이션 정합성 정리

### 배경
홈 위젯 13개의 `href` 연결 감사 결과, 11개 이미 정확. 사이드바 '시장 지도' 항목이 중복 페이지 `/analytics` (InvestorFlowWidget 하나만 렌더)를 가리키는 매핑 오류 발견.

### 수정
- `VerticalNav.tsx`: '시장 지도' href `/analytics` → `/analysis` (SectorHeatmap + ThemeGroups + MarketFlow + EconomicDashboard 실제 시장 지도 페이지)
- `app/analytics/` 삭제 (`/investor-flow` 와 중복 기능)
- `components/common/WidgetShell.tsx` 삭제 (미사용, `WidgetCard` 와 중복)
- `ScreenerMiniWidget.tsx`: 우상단 `ArrowUpRight` 아이콘 링크 추가 (다른 위젯과 일관된 UX)

### 유지 (이미 올바른 매핑)
- 11개 위젯 href 정확 — Watchlist, Chart, OrderBook, Tick, News, DART, EconCal, Movers, Volume, NetBuy, Global
- TrendingThemesWidget.`href="/analysis"` 는 정답이었음

## 2026-04-22 — STEP 48: 드로워 오버레이 제거, 평범한 페이지 라우팅으로 회귀

### 배경
STEP 47에서 Parallel Route `@panel` + Intercepting Route `(.)screener` + 우측 오버레이 `DetailDrawer` 조합을 구축했으나, 사용자 의도와 불일치. 사용자는 "URL만 바뀌고 레이아웃(사이드바+티커바+푸터)은 유지되는 평범한 페이지 이동"을 원했음. `/net-buy` 가 이미 그 패턴이었고, 그게 정답.

### 제거
- `app/@panel/` 디렉토리 전체 (`default.tsx`, `(.)screener/page.tsx`)
- `components/common/DetailDrawer.tsx`
- `app/layout.tsx` 의 `panel` parallel slot 파라미터

### 유지
- `components/common/WidgetShell.tsx` — [더보기 →] `<Link href>` 기반 평범 네비게이션
- STEP 47의 `link-hub` 삭제, `/filings` → `/disclosures` 정리는 그대로 유효

### 교훈
Next.js Parallel/Intercepting Routes는 진짜 모달 오버레이 UX가 필요할 때만 쓴다. "URL은 바뀌지만 레이아웃은 유지"는 App Router의 기본 동작이므로 별도 인프라 불필요.

## 2026-04-22 — STEP 47: URL 라우팅 인프라 + 드로워 패턴 도입

### Added
- **Parallel Routes 인프라**: `app/@panel/` 슬롯 + `app/layout.tsx`에 `panel` 파라미터 추가
- **Intercepting Route**: `app/@panel/(.)screener/page.tsx` — 대시보드에서 `/screener` 네비 시 드로워로 인터셉트
- **공통 컴포넌트 `DetailDrawer`** (`components/common/DetailDrawer.tsx`): 우측 슬라이드 드로워, ESC/백드롭 닫기, body 스크롤 잠금
- **공통 컴포넌트 `WidgetShell`** (`components/common/WidgetShell.tsx`): 위젯 외곽 + `[더보기 →]` 버튼 통합 (STEP 48부터 위젯 전체에 적용 예정)

### Changed
- `/screener` 직접 URL 접속은 풀페이지 유지 (공유·SEO·북마크 대응)
- `VerticalNav` 의 DART 공시 링크 `/filings` → `/disclosures` 교체
- `DartFilingsWidget` 의 `href` `/filings` → `/disclosures` 교체

### Removed
- `app/link-hub/` — `toolbox/` 가 완전 대체
- `app/filings/` — 스텁 페이지. `disclosures/` 가 실제 DART API 연동 구현체

### 아키텍처 결정
- **URL-routed drawer 패턴 채택**: `/screener` URL이 네비게이션 컨텍스트에 따라 드로워 또는 풀페이지로 렌더됨
- **인터셉팅 마커 수정**: `(..)` → `(.)` (루트 레벨에선 동일 세그먼트 마커 사용)

## 2026-04-22 — STEP 46: 스크리너 팩터 업그레이드 (API JOIN + 프리셋 8종 + 정렬 컬럼)

- **Migration**: `supabase/migrations/013_stock_snapshot_view.sql` 신규 — stocks + 최신 quant_factors + 최신 dividends LEFT JOIN LATERAL view
- **API**: `app/api/stocks/screener/route.ts` 전면 재작성 — PER/ROE/composite/yield/payout 필터 + orderBy 화이트리스트 기반 정렬
- **UI**: `components/screener/ScreenerClient.tsx` 재작성 — 프리셋 3종 → 8종 (퀀트 TOP 100 / 저PER+고ROE / 모멘텀 / 배당 귀족 / Quality), 필터 5종 추가 (PER max, ROE min, 퀀트종합 min, 배당수익률 min), 테이블 컬럼 3종 추가 (PER, ROE, 퀀트종합 배지), 클릭 정렬
- **Data**: quant_factors 200행 + dividends 790행 노출 채널 개통. 스크리너에서 전종목 팩터 검색 가능
- **Result**: `/screener` 페이지 stub → 전업용 팩터 스크리너로 격상

## 2026-04-22 — STEP 45: QuantAnalysis 재활성화 (전종목 팩터 집계 완료, 5개 분석 탭 전원 live)

- **Migration**: `supabase/migrations/012_quant_factors.sql` 신규 — quant_factors 테이블
- **Script**: `scripts/seed-quant-factors.py` 신규 — TOP 200 대상 Value/Momentum/Quality 퍼센타일 집계
- **Data**: quant_factors 200행 시딩 (schema cache 문제 → Management API로 테이블 직접 생성)
- **Component**: `components/analysis/QuantAnalysis.tsx` 스텁(32줄) → 실제 퀀트 컴포넌트(~200줄)
  - 종합 퀀트 스코어 그라디언트 헤더 (0~100, 섹터 내 순위 포함)
  - Value · Momentum · Quality 3개 점수 카드
  - 레이더 차트 (RadarChart)
  - 원시 지표 테이블 (PER/PBR/ROE/영업이익률/3M·6M·12M 수익률)
- **5개 분석 탭 모두 실데이터 연결 완료** — 가치투자 · 기술적 분석 · 수급 분석 · 배당 분석 · 퀀트 분석

## 2026-04-22 — STEP 44: DividendAnalysis 재활성화 (DART alotMatter 배당 수집)

**신규 파일**
- `scripts/seed-dividends.py` — DART `alotMatter.json` 으로 TOP 200 대상 2019~2024 (6년) 배당 이력 수집

**데이터 작업**
- dividends 테이블 790행 시딩 (200종목 × 최대 6년, 무배당주 제외)
- 삼성전자 검증: 2024 DPS=1,446원 yield=2.7% payout=29.2% ✓

**코드 변경**
- `components/analysis/DividendAnalysis.tsx` — 32줄 스텁 → 실제 배당 컴포넌트
  - 4지표 카드 (DPS·yield·payout·YoY growth), DPS 바차트, yield/payout 라인차트

---

## 2026-04-22 — STEP 43: SupplyAnalysis 재활성화 (KIS FHKST01010900 수급 시딩)

**신규 파일**
- `scripts/seed-supply-demand.py` — KIS 종목별 투자자별 매매동향 API → supply_demand 테이블 upsert

**데이터 작업**
- supply_demand 테이블 3,000행 시딩 (100종목 × ~30영업일, 실패 0건)

**코드 변경**
- `components/analysis/SupplyAnalysis.tsx` — 32줄 스텁 → 실제 수급 분석 컴포넌트
  - 60일 합계 카드 (외국인·기관·개인), 양수=빨강/음수=파랑
  - 일별 순매수 스택 바차트, 누적 순매수 라인차트, 최근 5일 요약 테이블

---

## 2026-04-22 — STEP 42: TechnicalAnalysis 재활성화 (stock_prices 시딩 + MA·볼린저·RSI)

**데이터 작업**
- `scripts/seed-stock-prices.py` 실행 → `stock_prices` 테이블 시총 TOP 200 1년 일봉 53,363건 upsert (실패 0건, 누계 54,899건)

**코드 변경**
- `types/stock.ts` — `StockPrice` 인터페이스 추가
- `components/analysis/TechnicalAnalysis.tsx` — 32줄 스텁 → 실제 기술 지표 컴포넌트 재작성
  - SMA (5·20·60·120일), 볼린저밴드 (20일 ±2σ), RSI (Wilder's 14일), 거래량 바차트
  - 일봉 20개 미만 종목은 "데이터 부족" 카드 표시

---

## 2026-04-22 — STEP 41: 나머지 4개 분석 탭 정직 스텁 교체

**코드 변경**
- `components/analysis/QuantAnalysis.tsx`: 282줄 → 35줄 (스텁, 예정 STEP 45+)
- `components/analysis/DividendAnalysis.tsx`: 320줄 → 35줄 (스텁, 예정 STEP 44)
- `components/analysis/TechnicalAnalysis.tsx`: 394줄 → 35줄 (스텁, 예정 STEP 42)
- `components/analysis/SupplyAnalysis.tsx`: 335줄 → 35줄 (스텁, 예정 STEP 43)
- **총 1,331줄 → 약 140줄** (1,191줄 감소)

**제거된 기술 부채**
- AI Summary 섹션 4개 (V3 방향성 위반)
- 하드코딩된 수익률/퍼센타일/팩터 스코어
- `ai_analyses` 테이블 쿼리 4개
- placeholder fallback 숫자

---

## 2026-04-22 — STEP 40: ValueAnalysis 정직한 재작성

**코드 변경**
- `components/analysis/ValueAnalysis.tsx` 전면 재작성 (315줄 → 약 150줄)
  - 제거: AI Summary 섹션, ai_analyses 테이블 쿼리, DCF 모델, 그레이엄 안전마진, SECTOR_AVERAGES 하드코딩, placeholder fallback 숫자 (`per ?? 12.5`, `currentPrice = 52000`, `sharesOutstanding = 100_000_000`)
  - 추가: DART 실재무 시계열 차트 (매출·영업이익·순이익 최근 5년), 수익성·안정성 지표 추이 (영업이익률·순이익률·부채비율)
  - 유지: 상단 KPI 카드 5개 (PER/PBR/ROE/EPS/BPS), null 일 때 `—` 표시

**방향성**
- CLAUDE.md 절대규칙 준수: "session-context.md 에 없는 숫자 만들기 금지"
- V3 방향성 준수: AI 리포트 전면 제거
- DART 미커버 종목은 ComingSoonCard 로 정직 표시

---

## 2026-04-22 — STEP 39: DART 파서 보완 + TOP 100 확장

**코드 변경**
- `scripts/seed-dart-financials.py` `find_amount` 전면 개선
  - account_id/account_nm 완전 일치 우선 → IFRS/DART 태그 prefix 부분 매칭 2차 fallback
  - 일반 한글 키워드 부분매칭 차단 (엉뚱한 항목 매칭 방지)
  - `find_is_or_cis` 신설 — 손익계산서는 IS 먼저, 없으면 CIS (단일 포괄손익계산서) 탐색
  - keyword 확장: 매출/영업수익/수익, 영업이익/영업이익(손실)/영업손익, 당기순이익/당기순이익(손실)/당기순손익/반기·분기순이익 + `ifrs-full_RevenueFromContractsWithCustomers`·`ifrs-full_ProfitLossFromOperatingActivities`
  - CFS → OFS fallback 추가 (연결재무제표 미제출 종목 대응)
- `lib/dart-financial.ts` 동일 방향 동기화 (`findBySjDiv` 1/2차 로직 + IS→CIS fallback + CFS→OFS fallback + keyword 확장)
- `scripts/debug-dart-sample.py` 신규 — DART `fnlttSinglAcntAll` raw 응답 덤프 (sj_div 별 그룹화, 상위 40건 + OFS 재시도)

**근본 원인 진단 (Part A)**
- SK하이닉스·한화에어로·삼성바이오·HD현대중공업 4종목 모두 **IS 섹션 없음, CIS 단일 손익계산서만 제출**
- 파서가 `sj_div='IS'` 만 탐색 → 전 필드 null
- 한화에어로 매출 = `매출` (account_nm), 삼성바이오 영업이익 = `영업이익` (괄호 없음) — keyword 확장 동시 필요

**데이터 작업**
- STEP 38 누락 4종목 전원 복구 성공 (rev/op/ni 모두 적재)
- `TOP_N=100 YEARS='2023,2024'` 배치 → `financials` 193건 upsert (누계 576건)
- SKIP 5건: 005935/005387 (우선주 corp_code 없음), HD현대마린솔루션 2023 (신규상장), 기타 2건

**효과**
- 테마 50종목 중 **37종** DART 실재무 커버 (STEP 38 의 0종 → 37종)
- 시총 TOP 100 종목의 `/stocks/[symbol]` 에 2023/2024 연간 매출·영업이익·순이익·자산·부채·자본 시계열 DB 적재 완료
- `lib/dart-financial.ts` 도 동기화되어 런타임 API 도 동일 정확도 확보

---

## 2026-04-22 — STEP 38: DART 재무제표 파이프라인

**신규 파일**
- `scripts/seed-dart-financials.py` — DART `fnlttSinglAcntAll` API → `financials` 테이블 upsert
  - IS: 매출·영업이익·순이익 / BS: 자산·부채·자본
  - `operating_margin`, `net_margin`, `debt_ratio` 자동 계산
  - `on_conflict='stock_id,period_type,period_date'` 멱등 upsert
  - 환경변수 `TOP_N` / `YEARS` / `REPRT_CODE` 로 확장 가능

**데이터 작업**
- `dart_corp_codes` 테이블 3,959건 (DART 전체 코드 매핑, Step 38A 선행 완료)
- `financials` 테이블 18건 upsert (시총 TOP 10 × 2023,2024 연간 — 총 누계 401건)
- 삼성전자 2023 rev=258.9조 op=6.6조 / 2024 rev=300.9조 op=32.7조 검증 완료

**비고**: SK하이닉스·한화에어로스페이스·삼성바이오로직스·HD현대중공업 4종목 IS 항목명 불일치로 null → STEP 39에서 account_id fallback 보완 예정

---

## 2026-04-22 — STEP 37: KIS 재무 스냅샷 시딩

**데이터 작업 (코드 변경 없음)**
- `scripts/seed-financials-snapshot.py` 실행
- `financials` 테이블에 KIS inquire-price 기반 PER/PBR/EPS/BPS 192건 upsert (실패 0건)
- 대상: 시총 TOP 200 종목 (`financials` 누계 383건)

**효과**
- `/stocks/[symbol]` OverviewTab KPI 그리드 활성화 (PER/PBR/EPS/BPS `—` → 숫자)
- 삼성전자 예시: PER 33.14 / PBR 3.4 / EPS 6,564 / BPS 63,997
- ROE는 `eps / bps * 100` 자동 계산 (OverviewTab API 기존 fallback 로직)
- `data/themes.json` 테마 50종목 중 시총 TOP 200 안의 종목들 즉시 혜택

---

## 2026-04-22 — STEP 36: Supabase stocks/link_hub 전체 시딩

**데이터 작업 (코드 변경 없음)**
- `scripts/seed-stocks.py` 실행 → `stocks` 테이블 KOSPI(949)+KOSDAQ(1820) 전체 2,780건 upsert
- `link_hub` 테이블 56건 재시딩

**효과**
- STEP 35에서 🔒 잠겼던 4개 탭(재무·어닝·뉴스·수급)이 `data/themes.json` 37개 테마 종목에서 해제됨
- `/api/stocks/resolve?symbol=xxx` 응답 `source` 필드가 `kis` → `supabase`로 전환

---

## [2026-04-22] 세션 #24 — 관심종목 생태계 완성 + 수급 탭 통합 (Step 28~30)

### Step 28 — /net-buy 탭 구조 통합
- `/investor-flow` → `/net-buy?tab=flow` 301 리다이렉트
- `/net-buy` 2탭 구조: [종목별 TOP] [시장 동향]
- `async searchParams` (Next.js 16 Promise 타입) 패턴 적용

### Step 29 — 수급 탭 KIS API 실데이터 연동
- `TopTab`: `/api/kis/investor-rank` 외국인+기관 합산 TOP 20
- `FlowTab`: `/api/home/investor-flow` 투자자별 매매동향 (KOSPI/KOSDAQ)

### Step 30 — 관심종목 생태계 완성 (Phase 2-D)
- `lib/watchlist.ts` — `getWatchlistSymbols` 헬퍼 추가
- `ScreenerClient` — ⭐ 버튼 + 낙관적 UI (로그인 필요 시 alert)
- `WatchlistPageClient` (신규) — 실데이터 풀 페이지 (auth gate + 8컬럼 + 10초 폴링 + 삭제)
- `app/watchlist/page.tsx` — Math.random() 스텁 → WatchlistPageClient 대체
- `WatchlistWidget` — 로그인 사용자: Supabase watchlist, 비로그인: DEFAULT_SYMBOLS fallback

---

## [2026-04-22] 세션 #23 — 사이드바 통합 후 레이아웃 정렬 대수술 (Step 20~27)

**배경**: 세션 #22 이후 사이드바(w-14)가 레이아웃 안으로 들어왔는데, 기존 대시보드 그리드는 사이드바 없던 시절의 폭 가정(minmax 280/640/300)을 그대로 썼음. 결과적으로 R4 + Col 3 (뉴스/DART) 가 박스 밖으로 사이드바 크기만큼 튀어나옴.

### Step 20 (`53271dd`) — User Flow 아키텍처 재구성
- 기존 Zone 기반 분류에서 User Flow 기반으로 전환
- Col 1: 마켓채팅 (45%) + 종목발굴 (10%) + 관심종목 (45%) — "정보 → 탐색 → 결정"
- Col 2: 차트 (50%) + (호가창 | 체결창 1:1) (50%) — "분석 → 주문"
- Col 3: 뉴스속보 (50%) + DART공시 (50%) — "실시간 이벤트 스트림"
- R4: 상승/하락 | 거래량 | 실시간수급 | 상승테마 | 글로벌지수 (1:1:1:1:1)

### Step 20a~21 (`64fe8fa`) — VerticalNav sticky 안정화
- `components/layout/VerticalNav.tsx`에 `self-start` 추가 — sticky top-0 스크롤 추적 정상화
- `components/layout/LayoutShell.tsx` Footer 정렬 시도

### Step 22 (`907f525`) — Footer 풀폭 복원
- LayoutShell 구조 Step 19 복원 — Header / TickerBar / Footer 모두 max-w-screen-2xl (1536) 풀폭
- 롤백 이유: Step 21의 Footer pl-14 접근이 다른 부분을 망가뜨림

### Step 23 (`e16ca3a`) — Footer 수동 정렬 시도
- Footer에 `pl-16 pr-4` 적용 — `html { font-size: 13px }` 컨텍스트 고려한 수동 픽셀 계산
- 결과: 시각적으로 여전히 미스매치 (서브픽셀 오차 추정)

### Step 24 (`7ed8fe2`) — Footer 구조 미러링 (Footer 정렬 최종 해결)
- 픽셀 계산 대신 **LayoutShell 구조 미러링** 접근
- Footer 내부를 `<div w-14 shrink-0 /> + <div flex-1 min-w-0 px-2>` 구조로 재작성
- 사이드바+Main과 **동일 Tailwind 클래스**를 쓰므로 rem base·서브픽셀·줌 무관하게 정렬 보장
- Footer turquoise / disclaimer 배경은 1536 풀폭 유지

### Step 25 (`6749cee`) — Outer grid minmax floor 축소
- `minmax(280px,2.5fr) minmax(640px,6.5fr) minmax(300px,3fr)` → `minmax(240px,2.5fr) minmax(560px,6.5fr) minmax(280px,3fr)`
- Grid 최소 합 1236 → 1080 (+gap 16 = 1096) — Main 가용 ~1190px 안에 fit
- 결과: **R4 오버플로우 해결**. 하지만 R1-R3 Col 3 (뉴스/DART)는 여전히 튀어나옴

### Step 26 (`c00d199` + `b3281e5`) — minmax track min을 0으로
- 1차 시도 (c00d199): section div에 `minWidth: 0`만 추가 → 효과 있으나 불완전
- 2차 수정 (b3281e5): outer grid를 `minmax(0,2.5fr) minmax(0,6.5fr) minmax(0,3fr)`로 변경
- Track은 부모 밖으로 못 나가지만, 새로고침 시 **잠시 fit 됐다가 다시 밀려나는** 증상 발견 — 데이터 post-hydration 시점에 grid item이 min-content로 track을 안에서 밀어냄

### Step 27 (`290ec82`) — Grid item 자체의 min-width + overflow 차단 (최종 완성)
- CSS Grid Level 1 스펙의 "Automatic Minimum Size of Grid Items" 문제 해결
- `section-col1 / col2 / col3 / r4 / orderbook-tick` 5개 grid item에 `minWidth: 0 + overflow: hidden` 추가
- **3단계 방어선 구축**:
  1. Track level: `minmax(0, Nfr)` — track이 부모 밖으로 못 나감
  2. Item level: `minWidth: 0` — item이 자식 min-content로 track을 못 밀어냄
  3. Visual level: `overflow: hidden` — 최종 clip 안전망
- 결과: 새로고침 / post-hydration / 데이터 변경 모든 시점에서 오버플로우 완전 차단

### 교훈
- **픽셀 계산보다 구조 미러링** — Step 23 실패 후 Step 24 성공. Tailwind 클래스가 같으면 rem base 무관.
- **CSS Grid는 track + item 양쪽 min-width를 모두 막아야 확실하게 오버플로우 방지** — Step 25~26의 단편적 접근으론 불충분.
- **"새로고침 시 잠시 fit → 다시 밀림"은 항상 post-hydration content growth** — 자식 min-content 팽창이 원인.
- **복붙 가능한 명령서 패턴** (`docs/STEP_N_COMMAND.md`) — Cowork 설계 + Claude Code 실행 워크플로우 검증됨.

### 커밋 9개 (시간순)
1. `53271dd` refactor: restructure home dashboard to User Flow architecture
2. `64fe8fa` fix: align footer with main + stabilize sidebar sticky
3. `907f525` revert: restore footer to full box width (header = footer = 1536)
4. `e16ca3a` fix: align footer inner content with dashboard R1/R4 left edge
5. `7ed8fe2` refactor: mirror sidebar+main structure in footer for exact alignment
6. `6749cee` fix: shrink dashboard grid mins to fit post-sidebar main width
7. `c00d199` fix: add minWidth: 0 to dashboard section divs to prevent col overflow
8. `b3281e5` fix: set grid track min to 0 so dashboard never overflows main width
9. `290ec82` fix: block grid items from expanding their tracks post-hydration

### 아카이브된 명령서 (참고용)
`docs/STEP_20_COMMAND.md` ~ `docs/STEP_27_COMMAND.md` (8개) — 이번 세션의 Cowork 설계 기록

---

## [2026-04-21] 세션 #22 (계속) — Step 12: 마켓채팅 참여자 팝업 (Phase 2-A)

### Step 12 — 마켓채팅 참여자 팝업 (Phase 2-A)

**변경 사항**:
- 마켓채팅 헤더에 실시간 참여자 수 표시 ("Live · N명")
- 참여자 수 클릭 → 참여자 목록 모달 오픈
- 모달 크기: 320px × 600px (마켓채팅 위젯과 유사)
- 참여자 추적: Supabase Presence API (로그인 사용자만)
- 모달 UX: 배경 클릭/ESC/X 버튼으로 닫힘, 배경 블러, 스크롤 가능

**신규 파일**: `components/widgets/ChatParticipantsModal.tsx`
**수정 파일**: `components/widgets/ChatWidget.tsx`

**Phase 2-A 완료. Phase 2-B, 2-C 대기**:
- Phase 2-B: `/investor-flow` 페이지 내용을 `/net-buy` 내 탭으로 흡수
- Phase 2-C: 경제캘린더 홈 미니 위젯 (오늘+내일 주요 이벤트)

---

## [2026-04-21] 세션 #22 (계속) — Step 11: 사이드바 IA 개편 Phase 1

### Step 11 — 사이드바 IA 개편 Phase 1

**변경 사항**:
- 사이드바 14개 → 12개 정리
  - 제거: 커뮤니티 채팅
  - 통합: 수급 TOP + 투자자 동향 → "수급"
  - 리네임: 분석 → 시장 지도
  - 라벨 간결화: 상승/하락 TOP → 상승/하락
  - 순서: 차트를 상위로 이동
- Active State 3중 표시 구현
  - 왼쪽 컬러 바 (티파니블루 `#0ABAB5`)
  - 배경 틴트 (10% 알파)
  - 아이콘 색상 변경
- 접근성: `aria-current="page"` 속성 추가

**변경 파일**: `components/layout/VerticalNav.tsx` (단일 파일)

**Phase 2 예정 작업** (다음 세션):
- 마켓채팅 참여자 팝업 구현
- `/investor-flow` 페이지 내용을 `/net-buy` 내 탭으로 흡수
- 경제캘린더 홈 미니 위젯 추가

**Phase 3 예정 작업**:
- 시장 지도(Finviz 스타일 히트맵) 전면 재구현
- 글로벌 지수 페이지 V2 (스파크라인 + 상관계수 + VKOSPI)

---

## [2026-04-21] 세션 #22 — 홈 대시보드 V1 → V1.5 재구성 + KIS P1 복구 (Step 9-10)

### Step 9 — KIS 상승/하락/거래량 API 빈 응답 해결 (커밋 `f198862`)
- **근본 원인**: `movers` 엔드포인트 경로가 TR ID와 완전 불일치 — `FHPST01700000`(등락률 순위)이 `/quotations/volume-rank`(거래량 순위) 경로로 호출되어 KIS가 조용히 빈 `output` 반환
- **movers 라우트 완전 재작성**:
  - 경로: `/uapi/domestic-stock/v1/quotations/volume-rank` → `/uapi/domestic-stock/v1/ranking/fluctuation`
  - 파라미터 14개 재구성 (KIS 공식 GitHub 샘플 verbatim): `fid_rsfl_rate1/2`, `fid_input_cnt_1`, `fid_prc_cls_code` 신규 추가
  - symbol 필드: `stck_shrn_iscd` 우선 + `mksc_shrn_iscd` fallback
- **volume-rank 라우트 파라미터 교정**:
  - `FID_COND_SCR_DIV_CODE`: `20101` → `20171`
  - `FID_INPUT_DATE_1`: `''` → `'0'` (빈 문자열 거부)
  - `FID_BLNG_CLS_CODE`: `'0'`(평균거래량) → `'1'`(거래증가율 = "급등")
- **실측 검증 (Chrome MCP localhost:3333 라이브)**:
  - `/api/kis/movers?dir=up` 10건 반환 — 국일제지 +29.83%, 에이에프더블류 +29.93% 등 상한가 근처
  - `/api/kis/movers?dir=down` 10건 반환
  - `/api/kis/volume-rank` 10건 반환 — 화인써키트, 현대리바트 등
- 근거: https://github.com/koreainvestment/open-trading-api (examples_llm/domestic_stock/fluctuation + volume_rank)

### Step 10 — volume-rank spike 단위 버그 수정 (보수적 패치)
- **발견된 이슈**: 모든 종목의 `spike` 값이 `101x`로 동일 표시
- **원인**: KIS `vol_inrt` 필드가 %가 아닌 basis points(‱) 단위로 추정 — `/100 + 1` 공식이 10000이란 값을 만나면 101 산출
- **수정**: `vol_inrt` 의존 제거, 수동 계산(`volume / avgVolume`)만 사용
  - 장마감 후에는 `avgVolume == volume`이라 일시적으로 1.0x 표시 (허위값 대신 투명한 0~1 표현)
  - 장중(09:00-15:30 KST)에는 실제 거래량 배수로 정확히 작동

### 커밋 9개 (시간순)
1. `c42ccb9` Step 1/3: `TrendingThemesWidget` 신규 + `ChatSidebar` 신설
2. `b928742` Step 2/3: 4-row 대시보드 + 우측 고정 ChatSidebar 레이아웃
3. `56b8114` Step 3/3: 레거시 `RealtimeChatWidget` 제거 + nav 아이콘 + detail 페이지 스텁
4. `f6c4606` Step 4: 3-row grid + 마켓채팅을 grid cell로 편입 + 탭 통합 (발견피드/시장활성도)
5. `624d204` V1.2: 2-zone 대시보드 (R1-R3 viewport 고정 + R4 discovery 스크롤)
6. `d4ab8ae` V1.3: R4 플랫 레이아웃 (5개 단일 위젯) + 500px 고정 + 단일 스크롤 레이어
7. `86685b6` V1.4: R4 뷰포트 채움 `max(500px, calc(100vh - 280px))` + F-pattern 재배치
8. `49d449f` V1.5: zone 재구성 + KOSPI 200 추가 + 30초 폴링 + Yahoo 401 해결
9. `f198862` fix(kis): 등락률/거래량 순위 API 빈 응답 해결 (P1) — Step 9
10. (pending) fix(kis): volume-rank spike 단위 버그 수정 — Step 10

### 주요 변경
- **홈 레이아웃 V1.5 확정**: 3-column grid `minmax(280px,2.5fr) minmax(640px,6.5fr) minmax(300px,3fr)` × 4-row (R1 차트/R2 위젯/R3 discovery 헤더 + 서브그리드/R4 flat 5위젯)
- **신규 위젯**: `TrendingThemesWidget` (KRX 섹터 TOP 5)
- **제거**: 레거시 `RealtimeChatWidget` (grid cell로 통합되면서 중복 제거), "발견피드"/"시장활성도" 탭 구조
- **R4 discovery 영역 확정 순서 (좌→우)**: 상승/하락 TOP 10 | 거래량 급등 TOP 10 | 실시간 수급 TOP | DART 공시 피드 | 뉴스속보
  - 내러티브 흐름: "가격 이동 → 원인 → 뉴스 컨텍스트"
  - 단일 스크롤 레이어 아키텍처 (`min-h-0` + `flex-1 overflow-y-auto`)
- **글로벌 지수 위젯 (Yahoo Finance)**:
  - `yahoo-finance2` v3 npm 설치 → Yahoo 401 crumb 인증 이슈 해결
  - **KOSPI 200 (`^KS200`) 추가** → 한국 투자자용 선물 기준 지수 (9개로 확장)
  - 30초 자동 폴링 (`setInterval` + cleanup)
  - 서버 캐시 5분 → 30초
  - breaking change: v3는 `new YahooFinance()` 인스턴스화 필요
- **NetBuyTopWidget 확장**: `size?: 'default' | 'large'` + `inline?` props 추가 (R4용)
- **Col 1 폭 축소**: 3fr → 2.5fr (마켓채팅 + 글로벌 지수 컬럼)
- **위젯 위치 스왑**:
  - Col 1 하단: 관심종목 → 글로벌 지수
  - R3 중앙: 글로벌지수|실시간수급 → 관심종목|상승테마

### 파일 변경
- 신규: `app/api/home/global/route.ts` (yahoo-finance2 기반 재작성), `components/widgets/TrendingThemesWidget.tsx`, `components/layout/ChatSidebar.tsx` (→ 나중에 grid cell로 흡수)
- 수정: `components/home/HomeClient.tsx` (여러 차례 grid 포뮬러 재조정), `components/widgets/GlobalIndicesWidget.tsx` (KOSPI 200 + 폴링), `components/widgets/NetBuyTopWidget.tsx` (size/inline props), `components/widgets/MoversTop10Widget.tsx` (size/inline props), `components/widgets/VolumeTop10Widget.tsx`, `components/widgets/DartFeedWidget.tsx`, `components/widgets/NewsFeedWidget.tsx`
- 문서: `docs/STEP_4~8_COMMAND.md` 5개 생성 (Cowork → Claude Code 핸드오프 아카이브)

### 데이터 검증
- `/api/home/global` 9개 지수 전부 실데이터 (KOSPI 6,388.47 +2.72%, KOSPI 200 962.26 +2.83%, KOSDAQ 1,179.03 +0.36%, ...)
- 홈 시각 검증: Col 1 글로벌지수 정상, R3 관심종목+상승테마 1:1, R4 5위젯 순서 일치

### 알려진 이슈 (P1 다음 세션)
- **상승/하락 TOP 10, 거래량 급등 TOP 10 "데이터 없음"** — KIS API 응답 빈 배열. 엔드포인트 조사 필요

---

## [2026-04-21] 세션 #21 — Phase B 위젯 4종 실데이터 실시간 연동

### 변경
- **WatchlistWidget** 재구현: DUMMY 하드코딩 → `/api/kis/price` × 5종목(005930·000660·035420·373220·035720) 병렬 fetch, **10초 폴링**. "준비 중" 배지 제거, subtitle "KIS API · 10초 갱신"으로 교체
- **OrderBookWidget** 재구현: 하드코딩 ASKS/BIDS → `/api/kis/orderbook` + `/api/kis/price` 병렬 fetch, **5초 폴링**, 5단 호가. maxVol 대비 볼륨 바 동적 렌더. "준비 중" 배지 제거
- **TickWidget** 재구현: DUMMY 5건 → `/api/kis/execution` (최근 30건 중 10건 표시), **5초 폴링**. 체결강도 실계산 (매수체결 볼륨 / 전체 볼륨 × 100, changeSign 1·2 = 상승). "준비 중" 배지 제거
- **RealtimeChatWidget** 재구현: DUMMY 6개 + 비활성화 입력 → **Supabase Realtime `postgres_changes` INSERT 구독** + `/api/chat/send` POST. 로그인 상태별 입력창 활성/비활성 토글. nickname = user_id 해시 → NICKS[10] 매핑. 최근 20개 초기 로드 + 실시간 append (max 50). "Phase B" 배지 → "Live"

### 제거
- "준비 중" 배지 전량 제거 (WatchlistWidget · OrderBookWidget · TickWidget · RealtimeChatWidget)
- DUMMY 하드코딩 상수 전량 제거
- `grep "준비 중|Phase B|DUMMY" components/widgets/` → **0건**

### 실데이터 연동 현황
- 13개 위젯 모두 fetch() 실데이터 연결 (EconCalendar는 iframe)
- KIS API 경로: price / orderbook / execution / chart / volume-rank / investor-rank / movers / investor (7종)
- Supabase Realtime: chat_messages INSERT 브로드캐스트

### 빌드
- 78/78 통과 · 커밋 `6d3cd13` (원커밋 `a764d22` + 메시지 amend) 푸시

---

## [2026-04-20] 세션 #20 — KIS 차트 실데이터 연동 (lightweight-charts v4)

### 추가
- `npm i lightweight-charts@4.2.3` — KRX 종목 캔들차트 렌더링 라이브러리
- `app/api/kis/chart/route.ts` — KIS `FHKST03010100` (일봉 최대 150일). params: `symbol`, `period(D/W/M)`, `from`, `to`

### 변경
- **ChartWidget** 완전 재구현:
  - 6자리 숫자 입력 → KRX 경로: `/api/kis/chart` fetch → lightweight-charts 캔들+거래량 렌더
  - 그 외(AAPL, NASDAQ:NVDA 등) → TradingView tv.js 렌더 (기존 방식 유지)
  - 상승=빨강(#FF3B30) / 하락=파랑(#0064FF) KR 색깔 컨벤션
  - 거래량 서브차트 (scaleMargins top=0.8, 반투명 색상)
  - placeholder 입력: `005930 · AAPL`
- **HomeClient**: NewsFeed R4-5 (2행 span), 경제캘린더 R6 전체 폭(1/4 span)

### 빌드
- 78/78 통과 (신규 라우트 1개 추가)

### API 검증
- `GET /api/kis/chart?symbol=005930` → 삼성전자 일봉 150일 데이터 ✓

---

## [2026-04-20] 세션 #19 cont — 그리드 포뮬러 재조정 + ChartWidget 정리

### 변경
- **gridTemplateRows 포뮬러**: `(100vh - 136px) / 3` → `(200vh - 152px) / 6`
  - 152 = sticky(112) + 5 row gaps(40), 2 뷰포트 기준 균등 분배
- **ChartWidget**: `hide_top_toolbar=1` + `allow_symbol_change=0` — 팝업 방지 + 외부 심볼 변경 차단

---

## [2026-04-20] 세션 #19 — 그리드 행 높이 뷰포트 고정 (레이아웃 v3)

### 버그픽스
- **[레이아웃 v3] gridTemplateRows 뷰포트 기반 고정**: `minmax(300px, 1fr)` → `calc((100vh - 136px) / 3)` 교체.
  - 136px = Header(72) + TickerBar(40) + grid-pad-top(8) + 2×row-gap(8×2)
  - 3행 × row_h + 2×gap = 100vh - 112px ← 1페이지 정확히 채움
  - 1440×900 기준: row_h = 254.67px, 1920×1080 기준: row_h = 314.67px
- `minHeight: 200vh` 제거 — row 고정으로 불필요
- sub-grid(R3C2 호가창+체결창)에 `gridTemplateRows: '1fr'` 추가 — 세로 꽉 채움

### 검증
- 빌드 77/77 통과
- 1440×900: page1 bottom = 900px (정확), page2 bottom = 1688px (= 2×900 - 112)
- 1920×1080: page1 bottom = 1080px, page2 bottom = 2048px (= 2×1080 - 112)

---

## [2026-04-20] 세션 #18 cont — 홈 대시보드 레이아웃 v2

### 리팩토링
- **[레이아웃 v2] 2페이지 CSS 그리드**: `gridTemplateRows: repeat(6, minmax(300px, 1fr))`, `minHeight: 200vh`. 14개 위젯 중요도 순 재배치 (위 섹션 5 배치도 참고).
- **CommunityChatWidget → RealtimeChatWidget**: 고정 플로팅 → 인라인 WidgetCard 그리드 위젯. 제목 "커뮤니티 채팅" → "실시간 채팅", 고정 포지셔닝 완전 제거.
- **Sticky Header + TickerBar**: Header `sticky top-0 z-40`, TickerBar `sticky top-[72px] z-30`.
- **테이블형 위젯 폰트 스케일업**: WatchlistWidget, VolumeTop10Widget, MoversTop10Widget, GlobalIndicesWidget, NetBuyTopWidget, InvestorFlowWidget, DartFilingsWidget, NewsFeedWidget, PreMarketBriefingWidget — 헤더 `text-[10px]`→`text-xs`, 행 `text-xs`→`text-sm`, 행 패딩 `py-1.5`→`py-2.5`.
- `/chat` 페이지 제목 "커뮤니티 채팅" → "실시간 채팅".

### 문서
- `docs/DASHBOARD_SPEC_V1.md` 섹션 5 추가 — 2페이지 배치도 + 중요도 근거.

---

## [2026-04-20] 세션 #18 — 홈 대시보드 버그픽스 4종

### 버그픽스
- **[Bug 1] 레거시 채팅 중복 제거**: `components/chat/{ChatPanel,ChatSidebar,FloatingChat,ChatProvider}.tsx` + `components/layout/FloatingChat.tsx` + `components/home/SidebarChat.tsx` 파일 삭제. `LayoutShell`에서 ChatSidebar·FloatingChat·ChatProvider 제거.
- **[Bug 2] 채팅 fixed 플로팅 전환**: `CommunityChatWidget` — `left: 72px, bottom: 12px, w: 320px, h: 360px, z-index: 40, border-radius: 12px, box-shadow`. 헤더 더블클릭·버튼 클릭 최소화/펼치기 토글. `/chat` 바로가기 ArrowUpRight 버튼. 좌측 컬럼 `grid-rows: repeat(3, minmax(0,1fr))` 균등 3등분 + `padding-bottom: 24px`.
- **[Bug 3] 위젯 바로가기 + 사이드바 페이지**: `WidgetCard`에 `href` prop + ArrowUpRight 버튼 추가. 14개 위젯 전부 href 주입. 13개 신규 라우트 페이지 생성 (`/watchlist /movers/volume /movers/price /chart /orderbook /ticks /global /filings /calendar /net-buy /investor-flow /briefing /chat`). `VerticalNav` 아이콘 12개 → 실제 라우트 경로로 업데이트.
- **[Bug 4] TradingView iframe URL 수정**: `s.tradingview.com/widgetembed/` + `hide_side_toolbar=1&allow_symbol_change=1`. 팝업 차단 완성.

### 추가
- `components/common/WidgetDetailStub.tsx` — 위젯 상세 페이지 공통 스텁 컴포넌트 (테이블 20행)
- `app/{watchlist,movers/volume,movers/price,chart,orderbook,ticks,global,filings,calendar,net-buy,investor-flow,briefing,chat}/page.tsx` — 13개 상세 페이지 스텁

---

## [2026-04-21] 세션 #17 — Phase B 데이터 통합 (9개 위젯 실데이터 연동)

### 추가
- `app/api/home/news/route.ts` — 한국경제·매일경제·이데일리 RSS 3종 병합 (정규식 파싱, 5분 캐시)
- `app/api/home/global/route.ts` — Yahoo Finance v7: 8개 지수·환율·선물·채권 실데이터
- `app/api/kis/movers/route.ts` — KIS 등락률 순위 (`FHPST01700000`, ?dir=up|down)
- `app/api/home/investor-flow/route.ts` — KIS KOSPI(0001)/KOSDAQ(1001) 투자자별 순매수 집계
- `app/api/home/briefing/route.ts` — Yahoo Finance 미증시 4종 + DART 오늘 주요 공시

### 변경 (위젯 실데이터 교체)
- `ChartWidget` — TradingView iframe 임베드 (종목 입력·이동 가능, `key` prop으로 리렌더)
- `EconCalendarWidget` — Investing.com SSLecal2 iframe (주간 캘린더)
- `NewsFeedWidget` — `/api/home/news` 실데이터, 출처별 컬러, 링크 클릭 → 원문
- `GlobalIndicesWidget` — `/api/home/global` 실데이터, Placeholder 로딩 상태
- `VolumeTop10Widget` — `/api/kis/volume-rank` 실데이터 (기존 API 활용)
- `MoversTop10Widget` — `/api/kis/movers` 실데이터 (신규 API)
- `NetBuyTopWidget` — `/api/kis/investor-rank` 실데이터 (기존 API 활용)
- `InvestorFlowWidget` — `/api/home/investor-flow` 실데이터
- `PreMarketBriefingWidget` — `/api/home/briefing` 실데이터 (미증시 + 오늘 공시)
- `DartFilingsWidget` — `/api/dart` 실데이터, 공시 유형 자동 분류, DART 원문 링크

---

## [2026-04-20] 세션 #16 — 3-패널 워크스테이션 홈 + 14개 위젯 스텁 (Phase A)

### 추가
- `components/widgets/` 신규 디렉토리 — 14개 위젯 스텁 생성
  - WatchlistWidget, VolumeTop10Widget, MoversTop10Widget (좌측)
  - ChartWidget, OrderBookWidget, TickWidget (중앙)
  - GlobalIndicesWidget, DartFilingsWidget, EconCalendarWidget (우측)
  - NetBuyTopWidget, InvestorFlowWidget, NewsFeedWidget, PreMarketBriefingWidget (우측)
  - CommunityChatWidget (고정 하단)
- `components/home/HomeClient.tsx` — 3-패널 CSS Grid (3fr 6fr 3fr, gap 8px) 레이아웃으로 전면 재작성
- `docs/DASHBOARD_SPEC_V1.md` — 설계 원칙·14위젯 상세·데이터소스·Phase 구현 로드맵
- `docs/DATA_SOURCES_MAPPING.xlsx` 기반 — 엑셀 4개 시트에서 MVP 14위젯 데이터소스 확정

### 변경
- VerticalNav section id 유지 (section-watchlist, section-volume 등)
- CommunityChatWidget: fixed bottom-0 left-12 (48px VerticalNav 회피)

### 다음 단계 (Phase B)
1. TradingView 차트 iframe 임베드 (0.5일)
2. 경제캘린더 Investing.com iframe (0.5일)
3. 뉴스 RSS 3종 API 연동 (1.5일)
4. KIS API 시세·순위 연동 (2~3일)

---

## [2026-04-18] 세션 #15 — (L) 클릭/리드 개별 삭제 API + 어드민 UI

- **신규 API `app/api/admin/partners/clicks/[id]/route.ts`** (admin only)
  - DELETE: `partner_clicks` 개별 레코드 삭제. `requireAdmin()` 게이트 + `createAdminClient()` 로 service_role 하드 삭제. 200 `{ok:true}` / 400 invalid id / 500 DB error.
- **신규 API `app/api/admin/partners/leads/[id]/route.ts`** (admin only)
  - DELETE: `partner_leads` 개별 레코드 삭제. 동일 패턴. 파트너 FK `SET NULL` 영향 없음 (리드 자체 삭제).
- **`app/admin/partners/clicks/page.tsx`** — 최근 클릭 테이블에 "액션" 컬럼 + 🗑️ 버튼 주입. confirm 가드 + `deletingId` 상태 + rowError 배너 + 성공 시 `load()` 재조회.
- **`app/admin/partners/leads/page.tsx`** — 동일 패턴 (이름 포함 confirm 메시지) + colSpan 8→9 / rowError 배너.
- 슬롯 매핑 삭제는 (I) 에서 이미 ✕ chip 지원 → 별도 API 불필요.
- 용도: QA 데이터 정리 (`/e2e-chrome-mcp-test` 클릭, E2E 테스트 리드 2건, test-asset→chat-sidebar-bottom 매핑) + 앞으로 누적될 테스트·실수 데이터 영구 관리 수단.

## [2026-04-18] 세션 #15 — (J) 채팅 사이드바 하단 PartnerSlot 추가

- **`components/chat/ChatPanel.tsx`** — 입력 div 아래(최하단)에 `<PartnerSlot slotKey="chat-sidebar-bottom" variant="compact" className="mx-2 mb-2" />` 삽입. `import PartnerSlot from '@/components/partners/PartnerSlot';` 추가.
- ChatPanel 은 `ChatSidebar`(1400px+ aside) + `FloatingChat`(1400px- 플로팅) 양쪽에서 공유되므로 데스크톱·모바일 모두 동일 위치에서 슬롯 표출. 매핑 없으면 `PartnerSlot` 이 `null` 리턴 → 레이아웃 공간 0.
- **`app/admin/partners/page.tsx` SLOT_KEYS 확장** — `chat-sidebar-bottom` 옵션 추가 (드롭다운 8 옵션). 편집/매핑 UI 그대로 재사용.
- **Chrome MCP E2E 검증** (1920px viewport):
  1. `POST /api/admin/partners/4/slots` body `{slot_key:"chat-sidebar-bottom", position:1, is_active:true}` → 200, slot id=6 insert
  2. `/` 리로드 → ChatSidebar aside 하단에 test-asset compact 카드 렌더 확인 ("테스트 자산운용 · 글로벌 ETF 포트폴리오 + AI 로보어드바이저 서비스 →"), href 에 `utm_medium=chat-sidebar-bottom` 포함
  3. Console 에러: Supabase auth-js `AbortError: Lock broken` 3건만 (기존 known, 무관)
- 잔여 QA 매핑: test-asset(id=4) → chat-sidebar-bottom(slot id=6) 은 다음 세션 cleanup 시 정리 대상.

## [2026-04-18] 세션 #15 — (K-2) Chrome MCP E2E 5/5 PASS — (I) 편집·삭제·슬롯 재매핑 검증

- **Task #48** — 라이브 검증 전부 통과 (`qa-test-bank` id=5 기준)
  1. PATCH `/api/admin/partners/5` (4필드: name·category·description·priority) → 200 OK, 응답에 갱신된 `updated_at` 포함, 리로드 후 UI 3열 (이름·카테고리·priority) 전부 반영
  2. POST `/api/admin/partners/5/slots` (`stock-detail-bottom`, position 1) → 200, slot id=4 insert 확인
  3. 동일 slot_key 로 중복 POST → 409 `{"error":"이미 매핑된 슬롯입니다"}` (UNIQUE(slot_key, partner_id) 제약 검증)
  4. DELETE `/api/admin/partners/5/slots?slot_key=stock-detail-bottom` → 200 `{ok:true}`, 리로드 후 해당 행 슬롯 비어있음 확인
  5. DELETE `/api/admin/partners/5` → 200 `{ok:true}`, 리로드 후 목록 3행 → 2행 (test, test-asset), qa-test-bank 완전 제거. ON DELETE CASCADE (partner_slots/partner_clicks) / SET NULL (partner_leads) DB 레벨 연동 확인
- Console 에러: Supabase auth-js Navigator Locks `AbortError: Lock broken` 3건만 관찰 (기존 known, 본 작업 무관)
- 잔여 QA 데이터: `/e2e-chrome-mcp-test` 클릭 1건 + (H) E2E 테스트 lead 2건은 `test` 파트너에 귀속, 운영 데이터와 혼용되지 않음. 다음 세션에서 필요시 별도 cleanup 엔드포인트로 정리

## [2026-04-18] 세션 #15 — (I) 파트너 편집·삭제 + 슬롯 재매핑 (Phase 2 CRUD 완성)

- **신규 API `app/api/admin/partners/[id]/route.ts`** (admin only, service_role)
  - PATCH: 부분 필드 업데이트 (slug/name/category/country/description/logo_url/cta_text/cta_url/priority/is_active/features). slug 정규식 재검증, features 는 문자열/객체 모두 허용 (파싱 실패 시 400), `updated_at` 자동 갱신. 중복 slug 충돌은 23505 → 409 메시지로 변환.
  - DELETE: 파트너 하드 삭제. `partner_slots`/`partner_clicks` 는 ON DELETE CASCADE 로 자동 정리, `partner_leads` 는 ON DELETE SET NULL 로 리드 로그 보존.
  - Next 16 dynamic route 규약 준수: `{ params }: { params: Promise<{ id: string }> }` + `const { id: idStr } = await params;`
- **신규 API `app/api/admin/partners/[id]/slots/route.ts`** (admin only)
  - POST: body `{ slot_key, position?, is_active? }` — 파트너에 슬롯 매핑 추가. slot_key 정규식(`^[a-z0-9-]+$`) 검증, 파트너 존재 확인 후 insert. UNIQUE(slot_key, partner_id) 충돌(23505) → 409.
  - DELETE: query `?slot_key=xxx` 또는 `?slot_id=NNN` — 해당 매핑만 제거 (partner_id 스코프 유지).
- **`app/admin/partners/page.tsx` UI Phase 2 확장**
  - `editingId` 상태: 신규 등록 vs. 편집 모드 분기. 편집 버튼(✏️) 클릭 시 폼을 해당 파트너 필드로 채우고 스크롤 업 → PATCH 제출.
  - 삭제 버튼(🗑️) + `window.confirm` 가드 → DELETE `/api/admin/partners/{id}` → 성공 배너 + 리스트 갱신.
  - 슬롯 칩에 ✕ 버튼 추가 → confirm 후 DELETE `/api/admin/partners/{id}/slots?slot_key=xxx`.
  - 슬롯 칩 행 끝에 "+ 슬롯" 인라인 액션 → 드롭다운(SLOT_KEYS) + position 입력 → POST `/api/admin/partners/{id}/slots`.
  - 행 align-top / 신규 "액션" 컬럼(9번째) / rowActionError 별도 배너.
  - 편집 모드에서는 하단 슬롯 영역 비활성(슬롯은 테이블에서 ✕/+ 로 관리) + "편집 취소" 링크 노출.
- Partner.id 타입을 `string` → `number` (BIGSERIAL 실제 타입과 일치) 정정. Slot 타입 `partner_id: number`.
- new files: `app/api/admin/partners/[id]/route.ts`, `app/api/admin/partners/[id]/slots/route.ts`

## [2026-04-18] 세션 #15 — (K) Chrome MCP E2E 5/5 PASS — (G)(H) 검증

- **Task #46** — (G) 슬롯 확장 + (H) 트래킹·대시보드 라이브 검증 전부 통과
  1. `/admin/partners/clicks` 초기 렌더 — 필터 4종·KPI 4카드·3테이블·최근 목록 전부 표출, 데이터 없음 상태 문구 정상
  2. `POST /api/partners/clicks` — 200 OK / `{ok:true}` / Supabase insert 확인
  3. 대시보드 실데이터 반영 — 총 클릭 `1` / 총 리드 `2` / 전환율 `200.0%` (리드>클릭 히스토리) / bySlot `home-row3-left:1 click, 0 lead, 0.0%` / byPartner `test · 테스트 증권 · 1/2/200%` / byDay `2026-04-18 click 1 lead 2` / 최근 1건 `21:03:37 · test · home-row3-left · /e2e-chrome-mcp-test`
  4. `/screener` 하단 PartnerSlot — `screener-bottom` 슬롯 매핑 없음 → API `{partners:[]}` → null 렌더, 에러 0
  5. `/stocks/005930` 하단 PartnerSlot — `stock-detail-bottom` 슬롯 매핑 없음 → null 렌더, 페이지 "삼성전자" 헤더 정상
- Console 에러: Supabase auth-js 라이브러리 내부 Navigator Locks `AbortError: Lock broken ... 'steal' option` 2건만 관찰 — 기존 known 경고, 본 작업과 무관
- 잔여 QA 데이터: `partner_clicks` 1건 (source_page `/e2e-chrome-mcp-test`) 유지 — 편집/삭제 API Phase 2에서 정리 가능

## [2026-04-18] 세션 #15 — (H) UTM/클릭 대시보드 + PartnerSlot 클릭 트래킹

- **(H1) PartnerSlot 클릭 트래킹 주입** — `components/partners/PartnerSlot.tsx`
  - `trackClick()` 헬퍼: `navigator.sendBeacon` 우선, 실패 시 `fetch({ keepalive: true })` 폴백
  - payload: `{ slug, slotKey, sourcePage: window.location.pathname }` → `POST /api/partners/clicks`
  - card / compact 두 variant `<Link onClick={trackClick}>` 로 바인딩
  - 트래킹 실패는 try/catch 로 완전 흡수 → 네비게이션 중단 없음
- **(H2) 신규 API `app/api/admin/partners/clicks/route.ts`** (admin only, service_role)
  - GET 필터: `partner_slug` / `slot_key` / `from` / `to` (YYYY-MM-DD)
  - 집계 4종: `bySlot` (slot_key별 클릭·리드·전환율) / `byPartner` (파트너별) / `byDay` (KST 일자별) / `recent` (최근 100건 raw)
  - 리드 연결: 동일 기간 `partner_leads` 조회 → `partner_id` 매칭하여 전환율 계산 (클릭 → 리드)
  - slot별 전환율은 `utm_medium` 이 `slot_key` 와 일치할 때만 계상 (PartnerSlot 생성 URL 규칙 준수)
- **(H2) 신규 페이지 `app/admin/partners/clicks/page.tsx`** (`AuthGuard minPlan='admin'`)
  - KPI 4카드: 총 클릭 / 총 리드 / 전체 전환율 / 활성 슬롯
  - 테이블 2종 (2-col grid): 슬롯별 / 파트너별 집계 (클릭·리드·전환율)
  - 일자별 추이 카드: ASCII bar (민트=클릭 / 오렌지=리드, maxDayCount 비례)
  - 최근 클릭 목록 100건 (clicked_at KST · 파트너 2줄 · 슬롯 · source_page truncate)
  - 필터 4종: 파트너 드롭다운 · 슬롯 키 직접 입력 · 시작/종료일 (기본 -30일 ~ 오늘)
- **헤더 네비게이션 교차 링크**:
  - `/admin/partners` → "클릭 대시보드" 버튼 (MousePointerClick 아이콘)
  - `/admin/partners/leads` → "클릭 대시보드" 버튼
  - `/admin/partners/clicks` → "리드 대시보드" 버튼
- new files: `app/api/admin/partners/clicks/route.ts`, `app/admin/partners/clicks/page.tsx`

## [2026-04-18] 세션 #15 — (G) 슬롯 키 확장 (stock-detail-bottom / screener-bottom)

- **전략 결정**: `/stocks/[symbol]` + `/screener` 모두 사이드바 레이아웃 없음 → 리팩토링 최소화 위해 **하단 풀폭 슬롯** 패턴 채택. 기존 `stock-detail-sidebar` / `toolbox-sidebar` 키는 보존 (DB 데이터 호환).
- **`app/admin/partners/page.tsx` SLOT_KEYS 확장** — `stock-detail-bottom` / `screener-bottom` 2개 추가 (드롭다운 7 옵션).
- **`app/stocks/[symbol]/page.tsx`** — `<StockDetailTabs/>` 아래에 `<PartnerSlot slotKey="stock-detail-bottom" variant="card" />` 주입 (max-w-[1400px] 래퍼).
- **`components/screener/ScreenerClient.tsx`** — 페이지네이션 아래에 `<PartnerSlot slotKey="screener-bottom" variant="card" />` 주입 (mt-8).
- 슬롯 미활성(파트너 미지정) 시 `PartnerSlot` 가 null 리턴 → 그레이스풀 빈 상태. 어드민에서 slot_key 매핑 추가 즉시 해당 위치에 카드 렌더.

## [2026-04-18] 세션 #15 — (F) /admin/partners/leads 리드 대시보드 + CSV Export

- **신규 API `app/api/admin/partners/leads/route.ts`** (admin only, service_role)
  - GET 필터: `partner_slug`, `from`, `to` (YYYY-MM-DD), `q` (이름·이메일·전화·문의 본문 ilike OR 검색), `limit`/`offset`, `format` (json|csv)
  - CSV 모드: UTF-8 BOM(`\ufeff`) 프리픽스 + 헤더 12열 (created_at·partner_slug·partner_name·name·email·phone·message·source_slug·utm_source·utm_medium·utm_campaign·consent_marketing), Content-Disposition: attachment
  - 파트너 조인: FK select 대신 `partner_id` in-clause 로 별도 조회 후 메모리에서 병합 (RLS 우회)
- **신규 페이지 `app/admin/partners/leads/page.tsx`** (`AuthGuard minPlan='admin'`)
  - 헤더: ← 파트너 관리 링크 + "리드 대시보드" + CSV 다운로드 버튼 (anchor href 로 직접 다운로드 트리거)
  - 필터 4종: 파트너 드롭다운(기본 전체) · 시작일(기본 -30일) · 종료일(오늘) · 검색박스(Enter 즉시 조회)
  - KPI 카드 4개: 총 리드 / 이메일 보유 / 전화 보유 / 마케팅 동의 — 분자/분모 포맷
  - UTM TOP 5 바(badge): utm_medium 별 유입 랭킹 (슬롯별 CTR 기반 평가에 직결)
  - 리스트 테이블: created_at (KST) · 파트너(이름+slug 2줄) · 이름 · 이메일 · 전화 · 문의(truncate+title) · UTM pill · 동의 ✓/-
- **`app/admin/partners/page.tsx` 헤더에 "리드 대시보드" 링크 추가** (ListOrdered 아이콘)
- new files: `app/api/admin/partners/leads/route.ts`, `app/admin/partners/leads/page.tsx`

## [2026-04-18] 세션 #15 — (E) /admin/partners Chrome MCP E2E 5/5 PASS

- **Task #42**: 비-admin 계정으로 1차 검증 → 2중 차단 정상 확인
  - UI: "접근 권한 없음 · 이 페이지는 관리자만 접근할 수 있습니다" AuthGuard 차단
  - API: `GET /api/admin/partners` → `403 {"error":"관리자 권한 필요"}`
- `scripts/sql-exec.py` 로 soulmaten7@gmail.com → `role='admin'` 승격 (users.id `a7db2d46-bcfb-4a1a-8ff4-14eb3c59fc87`)
- 재검증 5/5 PASS:
  1. 페이지 렌더 — 헤더 "파트너 관리" + 부제 + 새로고침/파트너 추가 버튼
  2. 리스트 2건 표출 — `test` (증권사 / 100 / home-row3-left#1 + toolbox-category-exchange#1) · `test-asset` (자산운용 / 90 / home-sidebar-bottom#1)
  3. 폼 접힘/펼침 동작
  4. POST 성공 — slug=`qa-test-bank`, name="QA 테스트 은행", 카테고리/슬롯 없이 최소 필드로 추가 → 성공 배너 "파트너 'QA 테스트 은행' 생성 완료" + 리스트에 3번째 row 즉시 반영 (priority 기본 50, 활성 ✓)
  5. 슬롯 칩 렌더링 — `home-row3-left#1` / `toolbox-category-exchange#1` / `home-sidebar-bottom#1` 3종 정상 표시

## [2026-04-18] 세션 #15 — (E) /admin/partners 최소 CRUD (Phase 1)

- **신규 관리자 페이지 `app/admin/partners/page.tsx`** — AuthGuard `minPlan='admin'` 로 게이트
  - 상단: "파트너 관리" 헤더 + 새로고침 / 파트너 추가 버튼
  - 폼 접힘/펼침 — 폼 필드 11종 (slug·name·category·country·description·logo_url·cta_text·cta_url·priority·is_active·features JSON) + 선택적 슬롯 매핑 2필드 (slot_key 드롭다운 · slot_position)
  - 슬롯 드롭다운 옵션: `home-row3-left` / `home-sidebar-bottom` / `toolbox-sidebar` / `stock-detail-sidebar` / — 선택 안 함 —
  - 리스트 테이블 — slug · 이름 · 카테고리 · 국가 · priority · 활성 뱃지 · 연결 슬롯 칩(들) · `/partner/[slug]` 바로가기
  - 성공/에러 피드백 박스 (CheckCircle2 / AlertCircle)
- **신규 API `app/api/admin/partners/route.ts`** (service_role)
  - `requireAdmin()` 헬퍼 — 서버 세션 사용자 조회 → `users.role === 'admin'` 확인 → 401/403 반환
  - GET: `partners` 전체 + `partner_slots` 조인해 슬롯 매핑 병합 (priority desc, created_at desc)
  - POST: slug 정규식 검증 (`^[a-z0-9-]+$`), features JSON 파싱·배열 검증, country 기본 'KR', cta_text 기본 '자세히 보기', 중복 slug `23505` 에러 사용자 친화 메시지, 선택적 슬롯 매핑 실패 시 `slot_warning` 으로 경고만 (파트너는 유지)
- **`app/admin/page.tsx` 대시보드** — "바로가기" 카드 섹션 추가 → `/admin/partners` 딥링크 (Handshake 아이콘)
- **Phase 1 scope**: 추가(Create)만. 편집·삭제·슬롯 재매핑은 Phase 2 (급한 경우 Supabase SQL Editor 로 처리)
- new files: `app/api/admin/partners/route.ts`, `app/admin/partners/page.tsx`

## [2026-04-18] 세션 #15 — (D) 홈 Row3 우측 하단 PartnerSlot placeholder 교체 (commit becb74c)

- **`supabase/migrations/011_partner_seed_2.sql`** — 두 번째 테스트 파트너 시드
  - `test-asset` = 테스트 자산운용, 자산운용 카테고리, features 3종 (연 보수 0.2% / AI 리밸런싱 / 최소 10만원)
  - 주황 로고 (`FF9500`) "TEST+Asset", CTA "포트폴리오 상담 신청", priority 90
  - `partner_slots` 매핑: `home-sidebar-bottom` → `test-asset` (position 1)
- **`components/home/HomeClient.tsx`** — 회색 "PARTNER SLOT (W4)" placeholder div 제거 → `<PartnerSlot slotKey="home-sidebar-bottom" variant="card" />` 렌더링
- **Chrome MCP 검증 PASS** — 우측 사이드바에 두 카드 세로 스택 (test 증권 민트 / test-asset 주황), 회색 박스 완전 사라짐, 콘솔 Fast Refresh [LOG] 13건·에러 0건
- **DB 컬럼 이름 픽스** — `partner_slots.priority` 는 존재하지 않음 → 실제 컬럼명 `position` 으로 자동 수정

## [2026-04-18] 세션 #15 — W5 더미 데이터 제거 1차 (ComingSoonCard + 4개 위젯)

- **공통 스켈레톤 `components/common/ComingSoonCard.tsx` 신설** — 제목·아이콘·설명·eta 뱃지 props, `bg-[#F5F7FA]` + 점선 border + 민트 eta 뱃지
- **4개 홈 위젯 더미 제거 → ComingSoonCard 교체** (commit b8f007d / 6 files / +287 -97)
  - `ProgramTrading.tsx` — arb 215 / nonArb -108 하드코딩 제거 → "KRX 크롤링 연동 후 공개"
  - `GlobalFutures.tsx` — S&P/NASDAQ/WTI/금 4건 하드코딩 제거 → "외부 선물 API 연결 후"
  - `WarningStocks.tsx` — 테스트A/B/C 3건 하드코딩 제거 → "KRX 데이터 연결 후"
  - `IpoSchedule.tsx` — 테크바이오/그린에너지/AI로보틱스 3건 하드코딩 제거 → "공시 파이프라인 연결 후"
- **Chrome MCP 검증 5/5 PASS**
  - 더미 잔존물 0건 (`(주)테스트`·`테크바이오`·`차익거래`·`비차익거래` 등 모두 사라짐)
  - "데이터 준비 중" 박스 정확히 4개
  - 300px 그리드 높이 유지
  - Console: Supabase auth-js `AbortError: Lock broken` 1건 (SDK 경합, W5 무관)
- **ScreenerClient 는 손대지 않음** — 이미 `/api/stocks/screener` 연결 (W2~)
- **Task #38 EarningsCalendar / #39 EconomicCalendar → Phase 2 이관 결정**
  - DART는 "발표 예정" API 미제공, ECOS는 "과거 지표" API — 둘 다 실데이터 연결이 간단하지 않음
  - W4 파트너 리드 유입 검증이 우선 — 방문자 1,000명 or 리드 10건 이상 확보 시 재검토
- new files: `components/common/ComingSoonCard.tsx`, `docs/COMMANDS_V3_W5_DUMMY_REMOVAL.md`

## [2026-04-18] 세션 #14 — W4 Partner-Agnostic Landing + E2E 검증

- **W4 Partner-Agnostic Lead Gen 인프라 1차 출시** (Claude Code 실행, commit 91eea5a — 11 files / +1322 insertions)
  - DB: `supabase/migrations/010_partners.sql` — 4 테이블 (`partners`, `partner_slots`, `partner_leads`, `partner_clicks`) + RLS (SELECT 공개 / INSERT leads·clicks 익명 허용 / 쓰기 service_role 만)
  - 테스트 시드 1건 (`slug='test'`, `테스트 증권`, features 3종 JSONB) + 슬롯 2개 바인딩 (`home-row3-left`, `toolbox-category-exchange`)
  - API 4종: `/api/partners/[slug]` (GET 단건) · `/api/partners/slots?key=…` (GET 슬롯+파트너 조인) · `/api/partners/leads` (POST 이름·연락처·동의 검증, IP SHA256 해시) · `/api/partners/clicks` (POST fire-and-forget 추적)
  - 페이지: `app/partner/[slug]/page.tsx` (Server) → `components/partners/PartnerLandingClient.tsx` (Client) — Hero + Features 3카드 + 리드 폼 (이름 필수 ≤80 / 이메일·전화 중 1 필수 / 문의 ≤1000 / consent) + 성공 박스 전환
  - 슬롯 컴포넌트: `components/partners/PartnerSlot.tsx` — card/compact 두 가지 variant, `/partner/${slug}?utm_source=slot&utm_medium=${slotKey}` 링크 생성 (부모 'use client' 때문에 Server → Client 전환)
  - 기존 placeholder 일부 교체: `components/home/HomeClient.tsx` (Row3 좌측) + `components/toolbox/CategorySection.tsx` (`slug==='exchange'` 섹션 헤더 하단)
- **W4 Chrome MCP E2E 검증 8/8 PASS** (Task #36)
  - `/partner/test` Hero + Features + 폼 렌더링 / 폼 제출 → "신청 완료" 박스 전환 / 리드 1건 삽입
  - 홈 Row3 좌측 card variant 렌더링 + 클릭 → `utm_medium=home-row3-left`
  - `/toolbox` 거래소·증권사 섹션 compact variant 렌더링 + 클릭 → `utm_medium=toolbox-category-exchange`
  - `/api/partners/slots?key=toolbox-category-exchange` JSON 실시간 응답 (partner 1건)
  - Console errors: Supabase auth-js `AbortError: Lock broken` 1건 — SDK 내부 탭 간 lock 경합 (무해, W4 무관)
- **W4 MVP 범위 밖 (Phase 2 보류)**
  - `/admin/partners` CRUD UI (현재는 SQL 시드로 추가, 추후 관리자 패널 필요)
  - 리드 대시보드 (열람/상태관리/Export)
  - 슬롯 키 추가 확장 (종목 상세 탭 내 슬롯, 채팅 사이드바 슬롯 등)
  - Utm 상세 로그·대시보드 (현재는 `partner_clicks` 테이블에 row 적재만 됨)

## [2026-04-18] 세션 #13 — Google OAuth + Chat API 하네스 + Chat UX + W2.5/W2.6/W3 실데이터

- **Supabase Google OAuth 실제 활성화 (기획 → 완료)**
  - Google Cloud 신규 프로젝트 `Terminal` + OAuth 2.0 Client ID 발급 (soulmaten7-org)
  - Redirect URI 등록: `https://qxkmwlkchyxfzxbonhtj.supabase.co/auth/v1/callback` + `http://localhost:3333/auth/callback`
  - `scripts/auth-config.py` (신규) — PAT Management API `/config/auth` GET/PATCH 래퍼
  - PATCH 완료: `external_google_enabled=true` / `client_id` / `secret` / `site_url=http://localhost:3333` / `uri_allow_list=http://localhost:3333/**`
  - Chrome MCP 검증: 로그인 버튼 → accounts.google.com 정상 리다이렉트 (client_id 일치)
- **public.users RLS INSERT 정책 누락 — 긴급 패치**
  - 증상: Google 로그인 후 세션은 생성되지만 `/auth/callback` 의 users insert 가 **조용히 차단** → AuthProvider 가 행 조회 실패 (406) → UI 는 로그아웃 상태로 보임
  - 원인: RLS 정책이 SELECT/UPDATE 만 있고 INSERT 정책 부재 (기본 deny)
  - 수정: `CREATE POLICY "Users can insert own profile" FOR INSERT WITH CHECK (auth.uid() = id)`
  - 백필: 유령 auth.users `a7db2d46-…` (soulmaten7@gmail.com) public.users 행 생성 → 기존 세션 즉시 활성화
- **/auth/callback 진단 로그 강화** (commit 60fce18)
  - `error/error_description` 파라미터 캡처, `exchangeCodeForSession` 실패 상세 로그, `users insert` 실패 로그 분리
- **Task #26 Chat API 하네스 점검 6/6 통과** (Chrome MCP E2E)
  - 401 (로그인 필요) / 400 (빈문자·공백·금지어·500자 초과) / 200 (500자 경계) / 200 (태그 추출: 한글명→symbol / 6자리 직접 / 미매칭 `[]`) / 429 (분당 5개 초과)
  - `trim()` 방어 로직 현장 검증 (공백만 메시지 차단, commit 6091053 이미 반영)
  - 하네스 메시지 5건 `hidden=true` 처리하여 채팅창 오염 방지
- **Next.js 16 Turbopack 캐시 손상 복구 절차 정립**
  - 증상: dev 서버가 /api/* 전부 pending/500 응답, ChunkLoadError 발생
  - 처방: `rm -rf .next node_modules/.cache` + `lsof -ti :3333 | xargs kill -9` + `npm run dev` 재시작
- 쿠키 정리 Mac 가이드: DevTools Application → Cookies → 수동 삭제 (HttpOnly 쿠키는 JS 로 삭제 불가)
- new files: `scripts/auth-config.py`
- DB 변경: `CREATE POLICY` 1건 (users INSERT) + public.users 1건 백필 (Management API 로 반영)
- **Task #27 Chat UX/렌더링 디테일 점검 완료** (`components/chat/ChatPanel.tsx`)
  - 글자수 카운터 추가 — `{input.length}/500` 하단 표시, 450+ 주황, 490+ 빨강 볼드
  - 에러 UX 강화 — 아이콘(⚠) + 빨강 배경/테두리 박스 + 5초 유지 (기존 3초)
  - 429 rate-limit 전용 메시지 — "분당 메시지 한도를 초과했습니다. 잠시 후 다시 시도하세요."
  - 네트워크 오류 카피 개선 — "네트워크 오류 — 연결 상태를 확인하세요"
  - 전송 후 input 포커스 유지 (inputRef) — 연속 메시지 작성 개선
  - $태그 렌더링에 pill 배경 추가 (`bg-[#0ABAB5]/10` + hover 효과) — 가독성·클릭 영역 확대
- **W2.5 비교 탭 실데이터 연동** (`/api/stocks/compare` + `CompareTab.tsx`)
  - 신규 엔드포인트: 2~5개 symbol → stocks + financials + 최근 6개월 stock_prices 통합 반환
  - CompareTab 재작성: 심볼 칩 + 검색 드롭다운 (max 5) / KPI 테이블 (현재가·6M수익률·시총·PER·PBR·ROE·EPS·BPS) / 정규화 라인차트 (시작일=100)
  - 공통 거래일 교집합으로 차트 정렬 (결측일 대응)
- **W2.6 뉴스·공시 탭 실데이터 연동** (신규 2 엔드포인트 + 2 탭 교체)
  - `/api/stocks/disclosures` — DART list.json 라이브 조회 (corp_code → `dart_corp_codes` DB lookup)
  - `/api/stocks/news` — Google News RSS 라이브 조회 (User-Agent 지정, CDATA/HTML 정리)
  - DisclosuresTab 재작성: 기간 선택 (1/3/6/12개월) + 공시 유형 10종 분류 필터 + 원본 DART 링크
  - NewsTab 재작성: timeAgo 렌더 + 출처·시간 표시, `stockId` 대신 `symbol` 사용
  - NewsDisclosureTab: 두 탭에 symbol 프로퍼티 전달로 통합
- **W3 투자자 도구함 강화** (`/app/toolbox/page.tsx` + `ToolboxClient.tsx`)
  - 국가(KR/US/…) 필터 추가 — `availableCountries` 동적 구성, 1국가뿐이면 필터 숨김
  - 표시 건수 카운터 추가 (전체 N개 · 표시 M개)
  - 기존 기능 유지: 검색 / 카테고리 접기 / 즐겨찾기 / 클릭 추적 / Partner Slot 자리
- new endpoints: `/api/stocks/compare`, `/api/stocks/disclosures`, `/api/stocks/news`
- 데이터 흐름 변화: 뉴스·공시는 DB 시딩 없이 라이브 API 의존 → `news` / `disclosures` 테이블은 향후 캐싱 용도로 보류

## [2026-04-18] 세션 #12 — W2.3 보강 + W2.4 실적 탭 실데이터

- W2.3 보강: DART corp_codes 3,959건 시딩 + ROE 계산식(EPS/BPS×100) 추가
- /api/dart/company 삼성전자 기업개황 정상 반환
- ROE 10.26% 개요 탭 표시 (KPI 7/7 완성, 배당수익률만 추후 DART 배당 API 연동 시 보강)
- W2.4 실적 탭: lib/dart-financial.ts + /api/stocks/earnings + EarningsTab 차트 교체
- DART fnlttSinglAcntAll.json 연결재무제표 파싱 (매출/영업이익/순이익/마진)
- 연간 4건 (2022~2025) + 분기 12건 (8분기 이상 확보)
- 차트: 연간 grouped bar + 분기 line + 마진 line + 상세 테이블
- Management API SQL executor 구축 (scripts/sql-exec.py) — 앞으로 모든 DDL 자동화
- Chrome MCP 검증: 개요 KPI 8/8 실데이터, 실적탭 SVG 14개 + 테이블 정상
- commits: 5c6434e (W2.3 보강), d9102da (W2.4), 88b2add (sql-exec)

## [2026-04-18] 세션 #11 — W2.3 재무·가격 DB 시딩

- financials 191건 upsert (KIS API, TOP 200 + 005930)
- stock_prices 52,969건 upsert (FDR DataReader, 200종목 × ~265일, 실패 0)
- supabase/migrations/007_stock_prices.sql 신규 (테이블 + 3 인덱스 + RLS + 2 POLICY)
- Supabase Studio 에서 직접 실행 (direct connection IPv4 미지원, pooler region 이슈로 우회)
- Chrome MCP 검증: /stocks/005930?tab=overview → PER 32.91 / PBR 3.38 / EPS 6,564 / BPS 63,997 / 52주 53,700~223,000 KRW 전부 실데이터
- 미완: ROE (KIS 미제공, W2.4에서 계산식 추가), 배당수익률 (DART corp_codes 시딩 필요)
- commit: 31f443f

## 세션 #10 — 2026-04-18 (W2.1 종목 상세 8탭 재구축 + 라이트 테마 + URL 탭 상태 + AuthGuard 제거)

### 구조 변경
- **`app/stocks/[symbol]/page.tsx` 전면 재작성**: 다크 테마 10탭 + AuthGuard 래핑 → 라이트 테마 8탭 + 비로그인 접근 허용
- **Server/Client 역할 분리**: `StockHeader.tsx` / `StockDetailTabs.tsx` / `WatchlistToggle.tsx` 로 컴포넌트 분리
- **URL `?tab=` 기반 탭 상태**: 기존 `useState` → `useSearchParams`, 뒤로가기/앞으로가기 지원

### V3 표준 8탭 (왼쪽부터)
- 개요 / 차트 / 호가 / 재무 / 실적 / 뉴스·공시 / 수급 / 비교

### 신규 컴포넌트
- `lib/constants/stock-tabs.ts` — 탭 키 상수 + 타입
- `components/stocks/StockHeader.tsx`, `StockDetailTabs.tsx`, `WatchlistToggle.tsx`
- `components/stocks/tabs/OverviewTab.tsx` (KPI 8개 placeholder + 기업개황 placeholder)
- `components/stocks/tabs/OrderbookTab.tsx` (OrderBook + ExecutionList 2분할, 미국은 안내문)
- `components/stocks/tabs/EarningsTab.tsx` (placeholder, W2.3)
- `components/stocks/tabs/NewsDisclosureTab.tsx` (뉴스/공시 서브탭 통합)
- `components/stocks/tabs/CompareTab.tsx` (placeholder, W2.3)

### 라이트 테마 일괄 치환 (총 7개 파일)
- 기존 유지 탭 5개: `ChartTab`, `FinancialsTab`, `NewsTab`, `DisclosuresTab`, `SupplyDemandTab`
- 공용 컴포넌트 2개: `OrderBook`, `ExecutionList`
- 매핑: `bg-dark-* → bg-white/F5F7FA`, `border-border → border-[#E5E7EB]`, `text-text-* → text-black/666666`, `text-up → [#FF3B30]`, `text-down → [#007AFF]`, `text-accent → [#0ABAB5]`

### 보존된 파일 (V3 범위 외, 라우팅만 제외)
- `ShortSellingTab`, `InsiderTab`, `DividendTab`, `SectorTab`, `MacroTab` — 파일 보존 (추후 개요/재무 서브섹션 활용 가능)

### 검증 (Chrome MCP)
- 8탭 순서 정확 ✅
- `darkResidueCount: 0` (bg-dark/text-text/border-border 전부 제거) ✅
- body 배경 `rgb(255, 255, 255)` ✅
- AuthGuard 차단 없음 (비로그인 접근 가능) ✅
- URL `?tab=chart/orderbook/financials/earnings/news/flow/compare` 모두 전환 정상 ✅
- 삼성전자 헤더 / AAPL 헤더 정상 ✅
- 미국 종목 (AAPL) 호가 탭 안내문 "미국 주식은 호가 데이터를 제공하지 않습니다" ✅

### git
- 21 files changed, 1,135 insertions(+), 256 deletions(-)
- 커밋 `267e83b` → push 완료

---

## 세션 #9 — 2026-04-18 (홈 Bento Grid 재구축 + Light Theme 전환 + 블룸버그 T자형 레이아웃)

### W1.5 — Header/TickerBar 슬림화 + HomeClient Bento Grid 초안
- **`components/layout/Header.tsx`** 전면 교체: 191px 2단 구조 → 단일 73px, 네비 6개 → 3개 (홈/스크리너/도구함), 민트 리본 제거
- **`components/layout/TickerBar.tsx`**: `colorTheme: 'dark' → 'light'`, `bg-[#0D1117] h-12 → bg-white h-10`
- **`components/home/HomeClient.tsx`**: flex 3단 구조 → `grid-cols-2` 5행 Bento 초안
- **`components/home/WidgetCard.tsx`** 신규: 모든 위젯 공통 래퍼 (bg-white + border-[#E5E7EB])

### W1.6 — 5개 위젯 다크→라이트 전환 + C안 T자형 레이아웃 적용
- **색상 매핑**: `bg-[#0D1117]` 제거, `bg-[#161B22] → bg-[#F5F7FA]`, `border-[#2D3748] → border-[#E5E7EB]`, `text-white → text-black`, 부가 텍스트 `text-[#666666]`
- **대상 위젯**: VolumeSpike, MarketMiniCharts, ProgramTrading, GlobalFutures, WarningStocks
- **MarketMiniCharts**: TradingView `colorTheme: 'light'` + `isTransparent: true` 전환
- **HomeClient.tsx C안 레이아웃** (블룸버그 T자형):
  - Row 3~5: 속보피드 `gridRow: span 3` (924px tall) | 경제지표/IPO/실적발표 세로 스택 (각 300px)
  - Row 6: 프로그램매매 / 글로벌선물 / 투자경고 각 `col-span-2` 균등 3등분

### 검증 (Chrome MCP)
- 다크 잔재 (`bg-[#0D1117]` / `bg-[#161B22]`) 카운트: **0** ✅
- 속보피드 실측: y=853, **height=924px** (row-span-3 작동)
- 경제/IPO/실적 x=997 정렬, 각 300px 세로 스택 확인
- Row 6 3등분 y=1789 정렬 확인
- 페이지 높이 2,579px, 첫 화면 위젯 8개

### git
- W1.5 + W1.6 통합 푸시: 17 files changed (main 브랜치)

---

## 세션 #8 — 2026-04-18 (V3 제품 스펙 전면 개정 + 전략 방향 확정)

### 전략 결정 (대화를 통한 합의)
- **포지셔닝 재정의**: "전업투자자 = 일반인 (일반투자자가 되고싶은 상위 1%)" → Aspirational Design 적용
- **UI 철학**: Bloomberg/Koyfin 표준의 Bento Grid + 단일 지속 채팅 + 투자자 도구함 (Link Hub)
- **개발 우선순위**: PC-First → 모듈식 컴포넌트 설계 → 이후 태블릿/모바일 반응형 전환
- **채팅 원칙**: 종목별 분산 X, **전체 단일 채팅** + `$종목` 자동 태그 + 필터 + 인기 종목 뱃지 (Density Over Distribution)
- **데이터 소스**: 100% 무료 소스(DART/KRX/KIS/FDR/Naver/ECOS)로 전업투자자 데이터의 95% 커버 가능 — 이미 KIS 서버사이드 연동 완료로 비로그인 이용자도 실시간 데이터 열람 가능
- **수익화 전략 단일 모델** (구독/결제 전면 폐기):
  - Phase 1 (즉시): **광고주 독립적(Partner-Agnostic) 랜딩페이지 인프라** + Lead Gen (DB 장사, 한국 리드 5~10만원/건)
  - Phase 2 (5~12주): 트래픽 확보 + 리드 퀄리티 스코어 + 파트너 슬롯 확장 (여전히 무료 플랫폼)
  - Phase 3 (12개월+): 글로벌 시장 확장 + 광고 인벤토리 세분화 — **구독/결제 시스템 일절 없음**
- **전 Phase 공통 원칙**: 플랫폼은 100% 무료 놀이터, 수익은 오직 랜딩 리드에서
- **제외 항목**: Pro 구독, 토스페이먼츠/Paddle 결제 연동, AI 종목 분석 리포트, CSV 다운로드, À la carte 프리미엄 — **전부 범위 제외**
- **레거시 제거 예정**: `components/home/AdColumn.tsx` (인증/일반 배너 20일 5만/3만원 모델) — W4 이전에 `HomeClient.tsx` 에서 렌더 제거

### 신규 문서
- **`docs/PRODUCT_SPEC_V3.md`** — 11개 섹션 제품 스펙 (V2 Home Redesign Spec을 대체, 전체 제품 범위로 확장)

### 다음 단계 (Phase 1 실행)
1. Persistent Chat (root `layout.tsx` 배치)
2. 종목 상세 8개 탭 (개요/차트/호가/재무/실적/뉴스공시/수급/비교)
3. 투자자 도구함 페이지 (10 카테고리 × 5+ 링크)
4. 광고주 독립적 랜딩페이지 템플릿 (`/partner/[slug]`)

### 검증
- 문서 작성 세션 — 코드 변경 없음

---

## 세션 #7 — 2026-04-17 (stocks + link_hub DB 시딩)

### 신규
- **`scripts/seed-stocks.py`** (155 lines) — KOSPI+KOSDAQ 종목 + link_hub 링크 시딩 스크립트

### 데이터
- **stocks 테이블 시딩**: KOSPI 949건 + KOSDAQ 1,821건 = 총 **2,780건** upsert 완료
- **link_hub 테이블 시딩**: 기존 더미 데이터 삭제 후 KR/US **56건** 재삽입 완료

### 라이브러리 전환
- **pykrx → FinanceDataReader(FDR)**:
  - pykrx가 KRX API 세션 인증 요구(`LOGOUT 400`)로 차단됨
  - FDR로 교체하여 정상 동작 확인
  - 앞으로 KRX 관련 데이터 작업(공매도, 수급, 프로그램매매 등)은 FDR 기준으로 통일
- **의존성 추가** (Python 런타임): `FinanceDataReader`, `supabase`, `python-dotenv`

### 검증
- `npm run build` — 에러 없음 ✅

### git
- `21fafe3` — `scripts/seed-stocks.py` 커밋

---

## 세션 #6 — 2026-04-17 (Rate limit 복구 + /admin AuthGuard + Cowork/Claude Code 모델 분리 규칙)

### 수정

#### `.env.local` — KIS API Rate Limit 복구
- **배경**: 한투 실전계좌 첫 3영업일 제한(1건/초)이 4/15에 종료됨 → 기존 400ms 유지 중이라 복구 필요
- **수정**: `KIS_RATE_LIMIT_MS=400` → `KIS_RATE_LIMIT_MS=60` (20건/초)

#### `components/home/WatchlistLive.tsx` — 관심종목 폴링 복구
- **수정**: `setInterval(fetchPrices, 15000)` → `setInterval(fetchPrices, 10000)` (15초 → 10초)
- 상단 주석도 3영업일 경과 기준으로 갱신 (10종목 × 60ms = 0.6초 → 10초 폴링)

#### `components/auth/AuthGuard.tsx` — `'admin'` minPlan 지원 추가 (보안 이슈)
- **배경**: 기존 AuthGuard는 `'free'|'premium'|'pro'`만 지원 → /admin 전용 게이트 불가
- **수정**:
  - `type MinPlan = 'free' | 'premium' | 'pro' | 'admin'` 추가
  - **`admin` 게이트는 DEV_BYPASS=true 여도 반드시 role 체크** (보안 우선)
  - admin 차단 시 PaywallModal 대신 "접근 권한 없음" 전용 화면 표시

#### `app/admin/page.tsx` — AuthGuard 래핑 (비로그인 접근 차단)
- **배경**: `/admin` 페이지가 AuthGuard 없이 노출되어 비로그인자도 진입 가능 (보안 이슈)
- **수정**:
  - 상단에 `import AuthGuard from '@/components/auth/AuthGuard'` 추가
  - 반환 JSX 전체를 `<AuthGuard minPlan="admin">...</AuthGuard>`로 감싸기

#### `CLAUDE.md` — Claude Code 모델 선택 규칙 섹션 신설
- **배경**: Cowork(설계)=Opus, Claude Code(실행)=Sonnet 역할 분담을 명문화할 필요
- **수정**: "역할 분담" 섹션 아래 "Claude Code 모델 선택 규칙" 신설
  - 기본값: Sonnet (`claude --dangerously-skip-permissions --model sonnet`)
  - Opus 필요 조건 4가지 명시 (원인 불명 에러 / 대규모 리팩토링 / 복잡 알고리즘 / 레거시 해독)
  - 표기 규칙: Cowork이 명령어에 **🔴 Opus 권장** 배지를 붙인 경우만 Opus 실행

### 검증
- `npm run build` — 에러 없음 ✅
- 4개 파일 변경 확인 (.env.local, WatchlistLive, AuthGuard, admin page)

---

## 세션 #5 — 2026-04-17 (AuthGuard DEV_BYPASS + Turbopack 서버 안정화 + 문서 전체 업데이트)

### 수정

#### `components/auth/AuthGuard.tsx` — DEV_BYPASS 추가
- **배경**: 세션 #4에서 13개 페이지 테스트 시 종목상세·분석 페이지가 paywall에 막혀 UI 확인 불가
- **수정**: `DEV_BYPASS = true` 플래그 추가 → 모든 기능 잠금 해제 (개발 모드 전용)
- **주의**: 프로덕션 배포 전 반드시 `DEV_BYPASS = false` 또는 해당 줄 삭제 필요
```typescript
const DEV_BYPASS = true;  // TODO: 배포 전 삭제
function canAccess(role, minPlan): boolean {
  if (DEV_BYPASS) return true;
  // ... 기존 role 체크 로직
}
```

#### `next.config.ts` — distDir 시도 후 원복
- **배경**: Turbopack이 FUSE mount 위에서 embedded DB(RocksDB) lock 파일 생성 시도 → "Operation not permitted (os error 1)" 크래시
- **시도**: `distDir: '/tmp/nextjs-dist'` 및 절대 경로로 캐시 디렉토리 이동 시도
- **결과**: Next.js 내부에서 `path.join(projectRoot, distDir)` 사용 → 절대 경로가 프로젝트 내부 상대 경로로 해석돼 효과 없음
- **최종**: `next.config.ts` 원복 (distDir 제거), `.fuse_hidden` 파일 삭제로 근본 원인 해결

### 해결된 이슈

#### Turbopack "Failed to open database" 크래시 해결
- **원인**: FUSE-mounted Mac 폴더에서 Turbopack 증분 캐시 DB(RocksDB) 파일 lock 불가
- **증상**: `[Error: Failed to open database - Loading persistence directory failed - Operation not permitted (os error 1)]`
- **해결**: `mcp__cowork__allow_cowork_file_delete`로 `.fuse_hidden*` 파일 7개 삭제 후 서버 재시작 → 정상 동작
- `.fuse_hidden` 발생 원인: 이전 서버 종료 시 오픈 상태 파일을 FUSE가 임시 파일로 보관, 이후 재시작 시 충돌
- 서버 상태: PID 22737, 포트 3333, HTTP 200 정상 확인

#### `.git/index.lock` 이슈 (FUSE mount 제약)
- 샌드박스에서 `.git/index.lock` 삭제 불가 → 샌드박스에서 git 커밋 실패
- **해결**: 사용자가 Mac 터미널에서 직접 `rm -f .git/index.lock && git add -A && git commit && git push` 실행
- 커밋 완료: `49abd20` (AuthGuard DEV_BYPASS), `da61662` (next.config.ts 관련)

### 문서 업데이트
- CLAUDE.md, docs/CHANGELOG.md, session-context.md, docs/NEXT_SESSION_START.md 날짜 2026-04-17로 갱신
- 세션 #4~5 전체 로그 기록 완료

### 미해결 / 다음 세션 이슈
1. `stocks` 테이블 DB 시딩 필요 (KOSPI/KOSDAQ 상장종목)
2. `link_hub` 테이블 DB 시딩 필요 (투자 링크 카테고리)
3. 더미 데이터 제거 필요: ProgramTrading, GlobalFutures, WarningStocks, EconomicCalendar, IpoSchedule, EarningsCalendar, ScreenerPage (12종목), ComparePage (삼성/SK 하드코딩)
4. `/admin` 페이지 AuthGuard 누락 (role=admin 체크 없음 — 보안)
5. 한투 rate limit 3영업일(~4/15) 경과 → `RATE_LIMIT_MS=60ms` + WatchlistLive 폴링 10초로 복구 필요
6. DEV_BYPASS = false 로 전환 후 프로덕션 배포

---

## 세션 #4 — 2026-04-11 (13개 페이지 Chrome MCP 테스트 + 홈 수급 최적화)

### 추가 (신규)
- **`app/api/kis/investor-rank/route.ts`** — 한투 외국인/기관 매매종목 가집계 batch endpoint (TR ID: FHPTJ04400000). 한 번의 호출로 외국인 TOP10 + 기관 TOP10 동시 반환.

### 수정 (components/home/InstitutionalFlow.tsx)
- 기존: 10개 심볼 각각 `/api/kis/investor` 병렬 호출 (10건) + 30초 폴링 → WatchlistLive의 10건과 충돌해 초당 20건 rate limit 초과
- 수정: 단일 `/api/kis/investor-rank` batch 호출 (1건) + 60초 폴링 + WatchlistLive와 겹치지 않도록 5초 지연 시작
- 홈 페이지 전체 API 호출 폭주 해결

### 13개 페이지 Chrome MCP 테스트 결과
| # | 페이지 | 상태 | 메모 |
|---|---|---|---|
| 1 | / | ✅ | 홈 대시보드 정상, InstitutionalFlow batch 적용 후 TOP10 실데이터 표시 |
| 2 | /stocks/005930 | 🔒 | AuthGuard paywall (로그인 필요 — 예상 동작) |
| 3 | /news | ✅ | RSS 실제 피드 20건, 매체 필터/키워드 검색 정상 |
| 4 | /analysis | ⚠️ | FRED 미국 경제지표 실데이터 OK / 업종 히트맵·테마·시장수급은 더미 |
| 5 | /screener | ⚠️ | UI·필터 정상, 12종목 전체 더미 데이터 |
| 6 | /compare | ⚠️ | UI 정상, 삼성전자·SK하이닉스 비교 데이터 더미 |
| 7 | /link-hub | ⚠️ | UI 정상, `link_hub` 테이블 시딩 필요 (0건) |
| 8 | /stocks | ⚠️ | UI·필터·정렬 정상, `stocks` 테이블 비어있음 |
| 9 | /stocks/005930/analysis | 🔒 | AuthGuard paywall |
| 10 | /advertiser | ✅ | 랜딩 페이지 + CTA 정상 |
| 11 | /mypage | ✅ | 미로그인 시 /auth/login 리다이렉트 정상 |
| 12 | /pricing | ✅ | Premium/Pro 요금제 버튼 정상 |
| 13 | /admin | ⚠️ | **AuthGuard 누락 — 비로그인도 접근 가능 (보안 이슈)** |

### 확인된 이슈 (후속 작업)
1. **DB 시딩 필요**: `stocks`, `link_hub` 테이블 비어있음 → 검색·링크허브 실데이터 없음
2. **더미 데이터 제거 필요**: ProgramTrading, GlobalFutures, WarningStocks, EconomicCalendar, IpoSchedule, EarningsCalendar, ScreenerPage, ComparePage
3. **관리자 페이지 AuthGuard 추가 필요** (role=admin 체크)
4. **Turbopack 파일시스템 캐시 오류**: 샌드박스 환경에서 "Operation not permitted" / "Another write batch or compaction is already active" → dev 서버 주기적 재시작 필요 (운영엔 영향 없음, 로컬 샌드박스 한정)

## 세션 #3 — 2026-04-11

### 검증 (토요일 장외, 금요일 4/10 종가 기준)
- **/api/kis/price**: 정상 ✅ (삼성전자 206,000원, +2000, +0.98%)
- **/api/kis/investor**: 정상 ✅ (4/10 외국인 +465,171주 / 기관 -475,614주)
  - 세션 #2의 "수급 +0억 문제" 해결 확인
- **/api/kis/orderbook**: 정상 ✅ (매도/매수 10호가)
- **/api/kis/execution**: 정상 ✅ (체결 내역)

### 수정 (lib/kis.ts)
- **Rate limiter race condition 수정**: 기존 단순 timestamp 방식은 동시 요청이 모두 통과되는 버그 → Promise chain으로 serialize
- **토큰 deduplication**: HMR 리로드 시 3개 API가 동시에 토큰을 발급받다가 "1분/회" 제한에 걸리는 문제 → pendingTokenPromise로 공유
- **토큰 디스크 캐시 추가**: /tmp/kis-token-cache.json에 저장 → HMR 리로드에도 토큰 재사용
- **RATE_LIMIT_MS 기본값 400ms → 1100ms**: 한투 실전계좌 첫 3영업일은 1건/초 제한. 3영업일 경과 후 env로 복구 가능

### 수정 (WatchlistLive)
- 폴링 주기 10초 → 15초 (첫 3영업일 rate limit 대응)
- 3영업일 경과 후 (~4/15) 10초로 복구 예정

## 세션 #2 — 2026-04-09

### 추가
- 홈 페이지 3-layer 리팩토링 (1층=실시간 스코어보드+채팅, 2층=오늘의 시장, 3층=주요 일정)
- 4-column 레이아웃: AdColumn(280px) | SidePanel(320px) | Main(flex-1) | AdColumn(280px), maxWidth 1920px
- 12개 새 홈 컴포넌트: WatchlistLive, SidebarChat, BreakingFeed, InstitutionalFlow, VolumeSpike, ProgramTrading, GlobalFutures, MarketMiniCharts, WarningStocks, EconomicCalendar, IpoSchedule, EarningsCalendar
- AdColumn 컴포넌트: 320x120 배너, 인증업체(금색) / 일반(회색) 구분, 광고주 랜딩 페이지 (/ad/[id])
- 한국투자증권 OpenAPI 연동: lib/kis.ts (토큰 캐싱 + 400ms 레이트 리미터)
- API 라우트 4개: /api/kis/price, /api/kis/orderbook, /api/kis/execution, /api/kis/investor
- 4개 신규 페이지: /news (뉴스·공시), /analysis (시장분석), /screener (스크리너), /compare (비교분석)
- AI 분석 시스템: GPT-4o-mini 연동, 5가지 분석 (가치/기술적/퀀트/배당/수급), 7일 캐시
- Make 자동화 설계 문서 (5개 시나리오)
- 명령서 문서 4개: COMMANDS_PHASE1~4

### 변경
- Header: sticky/fixed 해제 → 일반 스크롤, Tiffany 컬러 상단 배너, Playfair Display 로고
- TickerBar: sticky 해제
- HomeClient: 기존 대시보드 → 라이브스코어+채팅 컨셉 4-column 레이아웃으로 전면 개편
- SidebarChat: 탭 제거 (전체 채널만), sticky bottom, Supabase Realtime 채널명 Date.now() 추가
- WatchlistLive: 한투 API 실시간 연동 (10초 폴링), 가격 변동 blink 애니메이션
- InstitutionalFlow: hydration mismatch 수정 (mounted 패턴)
- BreakingFeed: TodayDisclosures + TodayNews 합쳐서 혼합 피드로 변경
- LayoutShell: 홈 페이지용 조건부 레이아웃 적용
- layout.tsx: history.scrollRestoration='manual' 추가, scrollTo 다중 타이머 적용
- .env.local: 한투 API 키, OpenAI API 키 추가

### 수정
- Hydration Mismatch: InstitutionalFlow (mounted 패턴), WatchlistLive (skeleton UI)
- SidebarChat duplicate subscription: Supabase 채널명 충돌 해결
- 스크롤 위치 문제: 다중 setTimeout + requestAnimationFrame으로 해결
- 메인 콘텐츠 너비 문제: 사이드패널을 광고 바깥으로 이동, maxWidth 1920px

## 세션 #1 — 2026-04-08

### 추가
- Next.js 16 + TypeScript + Tailwind CSS + Supabase 프로젝트 초기 설정
- 공통 레이아웃: Header, TickerBar, Footer, FloatingChat 컴포넌트
- 인증 시스템: 로그인, 회원가입, AuthProvider, AuthGuard, 소셜 로그인 콜백
- 홈 대시보드: MarketSummaryCards, TodayDisclosures, TodayNews, SupplyDemandSummary, TopMovers, BannerSection
- 링크 허브 페이지 + 한국/미국 링크 데이터 (linkHub.ts)
- 종목 검색/리스트 페이지
- 종목 상세 대시보드 10개 탭 (차트, 재무제표, 공시, 수급, 공매도, 내부자, 배당, 뉴스, 섹터, 거시경제)
- 기법별 분석 5개 컴포넌트 (가치투자, 기술적, 퀀트, 배당, 수급)
- 광고주 센터 (랜딩 + 대시보드)
- 마이페이지, 구독/결제, 관리자 페이지
- API 라우트 8개 (DART, KRX, ECOS, SEC, FRED, 뉴스, AI분석, 결제)
- DB 스키마 SQL (20개 테이블, 인덱스, RLS 정책)
- Zustand 스토어 4개 (auth, country, watchlist, chat)
- 유틸리티: 금칙어 필터, 채팅 모더레이션, 결제, AI 분석, 주식 계산 함수
- 타입 정의 5개 (stock, user, chat, advertiser, api)
- CLAUDE_CODE_INSTRUCTIONS.md 전체 개발 명령서
- 프로젝트 관리 체계 (CLAUDE.md, session-context.md, CHANGELOG, NEXT_SESSION_START, hook)

### 변경
- 없음 (초기 생성)

### 삭제
- 없음 (초기 생성)
