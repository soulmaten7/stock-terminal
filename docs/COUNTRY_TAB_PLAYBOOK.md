<!-- 2026-07-06 -->
# 🌍 국가 탭 표준 틀 (Country Tab Playbook)

> **목적**: 새 국가 탭(일본·중국·EU·…)을 만들 때 **US와 똑같은 구조·순서·완성기준**으로 찍어내 추가수정·오차를 최소화한다.
> **US(미국) = 레퍼런스 구현.** 이 문서는 US에서 검증된 패턴을 국가 무관 틀로 일반화 + 로드맵 6개국 소스 매트릭스(§7).
> 🔴 **새 국가탭·언어권 착수 전 이 문서를 매번 (재)읽고 시작한다** (CLAUDE.md 절대규칙 — 계속 까먹어서 못박음). §0 대원칙 + §3 DoD 전 항목 확인 후 착수.
> 관련: 멀티국가 방향 = `NEW_SESSION_HANDOFF.md §12` · 피드 배선 예시 = `docs/STEP_473_COMMAND.md` · 링크 원칙 = §12-1.

---

## 0. 대원칙 (국가 무관 · 항상 지킬 것)

0. ⛔ **완전성 = 최우선. MVP는 "간편·축소"가 아니라 "빠짐없이 다 넣되 검증하며 하나씩".** 국가탭은 **§3 DoD 전 항목을 하나도 빼지 않고** 완성: 배관·종목보드·link_hub·모아보기(피드)·**인덱스 티커(지수바)**·통화·**매매처(brokers)**·모바일·AI 렌즈(R1~R3). "나중/선택/후속"으로 임의 제외 **금지**. **데이터 소스가 막히면 대체 소스를 찾아서라도 채운다**(야후 없으면 vnstock·cafef·investing 등). "하나씩"은 *순서*이지 *범위 축소*가 아니다.
1. **자국 시장 기준** — KR 미러가 아니라 그 나라 현지인·전문가가 실제 쓰는 것 중심. 현지어/영문 전용도 **다 넣는다**(추리지 않는다).
2. **탭 라벨·설명은 한국어**, 콘텐츠·소스만 자국 기준. (`description`도 한국어 유지.)
3. **키리스 소스 우선** — API 키 없는 공개 RSS/공식사이트 우선(운영 리스크·비용 최소). 키 필요하면 `.env.local`(사용자만 취급).
4. **Graceful fallback** — 외부 소스 실패해도 절대 안 깨짐(빈 피드여도 링크 컬럼은 그대로).
5. **DB(link_hub)는 즉시 라이브·배포 불필요**, **코드는 배포 필요**. 두 개를 분리해서 진행.
6. **검증은 라이브로** — Chrome MCP(`navigate`+`get_page_text`/JS)로 localhost:3333·prod 직접 확인.

---

## 1. 국가 탭 구성요소 (8 블록)

| # | 블록 | 무엇 | KR 구현 | US 구현 | 새 국가 시 |
|---|------|------|---------|---------|-----------|
| 1 | **배관(Plumbing)** | 국가 등록·토글·라벨·통화 | `Country` 유니언, `COUNTRIES` 배열 | 동 | §2 touch-point 전부 확장 |
| 2 | **종목·상품(Market Board)** | 종목표(주식·ETF)·**크론 미리계산** | `MarketBoard`(KRX) | `UsMarketBoard`(us-list+`us_stock_perf` 크론) | `<Xx>MarketBoard` + **스냅샷 테이블·크론**(§4-2) + 모바일 카드형 |
| 3 | **link_hub(큐레이션 링크)** | 10 카테고리 ~130행 자국 링크 | KR 138 | US 139 | MCP insert(코드X·즉시 라이브) |
| 4 | **모아보기(라이브 피드)** | 탭별 우측 피드 | 아래 4-1 | 아래 4-1 | 소스 매핑 §7 |
| 5 | **인덱스 티커** | 상단 마퀴(지수) | `HomeIndexStrip`←`/api/yahoo/indices` | 동(글로벌 혼합) | 그 나라 지수 심볼 추가 |
| 6 | **통화·숫자 포맷** | ₩/$/¥/€… | `lib/currency` `formatPrice` | 동 | 통화 코드·기호 추가 |
| 7 | **KR 전용 특수탭** | 유튜브·리딩방·검증 | 라이브 | Placeholder "준비 중" | 기본 Placeholder(현지판은 선택) |
| 8 | **헤더/자산군** | 주식·코인 토글 등 | `Header.tsx` `MENU` | 동(국가 무관) | 보통 손댈 것 없음 |

### 4-1. 모아보기(FEED_TABS) 탭별 소스 유형

`FEED_TABS = ['news','disclosure','macro','analysis','research','etf','ipo']` · 지원 국가 = `FEED_COUNTRY_SUPPORT`.

| 탭 | 피드 성격 | KR 소스 | US 소스 | 새 국가 소스 유형 |
|----|-----------|---------|---------|-------------------|
| news | 종합 시장 뉴스(+대표 이미지) | 네이버 검색 | Yahoo ^GSPC RSS + og:image | 자국 뉴스 RSS/API (+이미지 스크래핑) |
| disclosure | 규제기관 공시 원본 | DART(`DartFeed`) | SEC EDGAR(`SecFeed`) | **그 나라 EDGAR = 최우선 확보** |
| macro | 거시지표 | ECOS | FRED | 중앙은행 + 통계청 (`/api/macro/summary` 확장) |
| analysis | 실적·기업 뉴스 | 네이버 쿼리 | Google News "earnings" | Google News 자국어 쿼리 |
| research | 애널리스트·리포트 뉴스 | 네이버 쿼리 | Google News "analyst rating" | Google News 자국어 쿼리 |
| etf | ETF·펀드 뉴스 | 네이버 쿼리 | Google News "ETF" | Google News 자국어 쿼리 |
| ipo | 공모주·IPO | `OfferingsFeed` | Google News "IPO" | 자국 IPO 소스 or Google News |

> **Google News RSS(키리스, 토픽)** = `https://news.google.com/rss/search?q=쿼리&hl={lang}&gl={국가}&ceid={국가}:{lang}` — 자국어 쿼리로 탭별 차별화. 로케일 파라미터 = §7 각국.

### 4-2. 종목보드 성능·모바일 표준 (⚠️ 전 국가 필수 · 2026-07-01 확정)

**A. 성능 = "크론 미리계산 + DB 스냅샷 서빙" (라이브 fetch 금지).**
- ❌ 안티패턴: 종목 리스트·수익률을 `force-dynamic` 라우트에서 **사용자 접속마다 외부 API(KRX·거래소) 라이브 fetch**. 인메모리 캐시는 서버리스 콜드스타트마다 날아가 무의미 → **초기 ~10초 딜레이**(KR 실제 발생, STEP A로 수정).
- ✅ 표준: **크론이 주기적으로 외부 API를 미리 호출 → DB 스냅샷 테이블 upsert. 화면은 그 스냅샷만 즉시 SELECT.** (US `us_stock_perf` 크론이 이 패턴.) 데이터가 EOD(장 마감 일별)면 하루 몇 회 크론이면 충분.
- 국가별 구성: `<xx>_stock_snapshot` 테이블 + `/api/cron/<xx>-perf`(`CRON_SECRET` 가드) + `vercel.json` 등록. 리스트·수익률 라우트는 스냅샷 SELECT(정렬·limit)만, 비면 라이브 fallback.
- **DoD: 종목보드 초기 로딩 체감 ≤ 1~2초.**

**B. 모바일 = 카드형 행 + 바텀시트 스냅포인트 (데스크탑=표 유지, 모바일만 분기).**
- **행**: 데스크탑 표를 모바일에 욱여넣지 말 것(종목명 "효…" 잘림). 모바일은 **1줄=종목명 풀 표시 / 2줄=현재가(좌 고정)+선택기간 수익률(우 고정)+기간 태그**. 좌=가격·우=% 위치 고정이라 기간 바꿔도 인식됨.
- **바텀시트**: 종목 클릭 시 **초기 50vh → 위로 드래그 시 최대 66vh(2/3)**, 100%(최상단)까지 올리지 말 것. 스크롤 컨테이너에 **`overscroll-behavior: contain`** 로 '당겨서 새로고침' 충돌 차단. 상단 드래그 핸들 유지.
- 적용 대상: 모든 Market Board(`MarketBoard`·`UsMarketBoard`·향후 `<Xx>MarketBoard`) 동일. STEP B 참조.

### 4-3. 증권사 바로가기 = 언어권(사용자 지역) 기준 매매처 · `brokers` 테이블 (⚠️ 전 국가 필수 · 2026-07-01 확정)

- **핵심 구분**: 국가 탭 = 어느 시장 데이터를 보나. **증권사 바로가기 = 언어(=사용자 지역) 기준.** 한국어 유저는 미국·일본 탭을 봐도 한국 증권사로 매매 → **국가 탭 바뀌어도 증권사 유지, 언어를 바꿀 때만** 그 언어권 매매처로 교체.
- **포함 기준 = "거기서 실제로 사고팔 수 있으면 넣는다."** 증권사·네오브로커·은행 증권부문·직판/로보 = 포함. 운용사도 직접 매수 가능하면(미 Vanguard·Fidelity) 포함. **발행사는 `brokers`(매매처)에서만 제외.**
- ⚠️ **두 레이어 구분 (중요)**: 발행사(iShares·SPDR·eMAXIS·NEXT FUNDS 등)는 **매매처(brokers)엔 안 넣지만, 정보 링크로는 `link_hub`(ETF·펀드 등 세부 카테고리)에 적극 포함** — 무조건 배제 금지. 즉 `brokers`=어디서 사나 / `link_hub`=무엇을 보나(발행사 정보 포함).
- **저장 = `brokers` 테이블**(region·type[broker/platform/bank]·name·domain·url·display_order·share·note). MCP 직접(link_hub와 별개). 구 `lib/brokers.ts`(KR 하드코딩)는 이 테이블로 이관.
- **현황(2026-07-01)**: KR 20·US 17·JP 13 저장. 나머지 로드맵 지역(CN/HK·IN·GB/DE/FR·VN·TW)은 각 탭 만들 때 채움.
- **배선(후속 STEP)**: 언어 스위처 만들 때 — `BrokerRanking`을 `lib/brokers` import → `brokers` 테이블 `region=현재 언어` SELECT로 전환(page.tsx 서버 로딩 후 prop 전달).
- **DoD(국가/언어 추가 시)**: 그 언어권 매매처를 `brokers`에 저장(매매가능만·도메인 검증).

### 4-4. AI 렌즈 R3 뉴스 = 자국어 네이티브 종목명 필수 (⚠️ 전 국가 · 2026-07-06 확정 · 이번 세션 최대 교훈)

- **핵심 함정**: R3(종목 뉴스 요약)는 그 나라 언어로 검색해야 진짜 자국 기사가 잡힌다. 그런데 **야후(`fetchYahooName`)는 JP·CN 종목을 영어명으로 준다** → ja/zh 로케일로 검색해도 실은 영어 검색 → 영어/엉뚱 기사. **반드시 그 나라 원어 종목명 테이블을 따로 확보**해 검색어로 써야 함(야후 이름 그대로 쓰면 안 됨).
  - **원어명 소스 = 거래소/포털 공식 리스트**: JP=`jp_names`(JPX 東証上場銘柄一覧 data_j.xls·일본어名 4,014) · CN=`cn_names`(HK=HKEX 번체목록 ListOfSecurities_c.xlsx 3,227 / A주=텐센트 qt.gtimg.cn 간체 3,868) · KR=DART `corp_name`(단 **영문 상장명 충돌**은 `lib/krName.ts` 별칭 — 예 NAVER→네이버, 플랫폼충돌만).
  - 없으면 야후 영어명 폴백 + 로컬 0건 시 영어 재검색(요약은 한국어로 후처리).
  - 종목명 테이블 = `scripts/seed_<xx>_names.ts`(멱등 upsert) + 마이그 `<xx>_names`(public read RLS).
- **⚠️ 데이터 소스 도달성 먼저 확인**: 东方財富(push2his)은 KR·데이터센터 IP에서 차단(curl exit52/502) → **텐센트(qt.gtimg.cn)로 우회**(응답이 GBK 인코딩 → `TextDecoder('gbk')`로 디코딩). 새 국가도 "샌드박스·유저 머신에서 실제 도달되나"를 **빌드 전 curl 프로브**로 확인(차단이면 대체 소스).
- **로케일 = 그 나라 것**(부록 B): 한 국가 안에서도 시장별로 갈릴 수 있음(HK=zh-HK 번체 / A주=zh-CN 간체).
- **결정론 후처리(라우트 `news-brief`)**: ① 요약이 한국어 아니면 번역 ② 작년 이전 연도(옛기사 재순환) 문장 삭제 ③ pubDate 60일 최근성 ④ **통화 단위 교정**(JP 원→엔·CN 원→위안·숫자+단위 뒤만·KR 경로 안 탐). **원칙: 프롬프트로 안 되는 건(통화·회사명) 코드로 확정** — LLM 설득 반복 실패 → 결정론 후처리(STEP 610·620 교훈).

### 4-5. R3 "3중 검수법" (⚠️ 국가 완성 판정 도구 · 2026-07-06 확정)

- **방법**: 그 나라 대표 종목 3~4개를 골라 **각 종목 R3를 3회 독립 생성**(캐시 비우고, 실 라우트와 **동일 파이프라인**: 같은 이름소스·같은 SYSTEM 프롬프트·같은 후처리). 3회 비교 + 아래 체크. Cowork가 샌드박스 tsx로 3회 생성 + MCP로 캐시 실물 재확인(이중).
- **3중 검수가 실제로 잡아낸 것**: ① 네이티브 이름 실패(NAVER→블로그·빈 요약) ② 통화 오표기(엔→원) ③ 회사명 CJK 잔존(任天堂) ④ 오래된 연도 재순환 ⑤ 서로 다른 기사 짜깁기 ⑥ 밸류/목표가/전망 누수(가드레일).
- **통과 기준**: 한국어 · 구체 사건만 · **자국 기사 기반** · 무밸류/무전망/무목표가 · 무짜깁기 · 최근(2개월) · 통화 정확 · 3회 대체로 일관. **사건 없으면 빈 요약이 정답**(지어내지 말 것).

---

## 2. 국가 분기 touch-point 체크리스트 ⚠️ (누락 = 오차)

새 국가 코드(예 `'JP'`)를 넣을 때 **아래 전부**를 미러해야 함. `'KR' | 'US'` 유니언과 `=== 'US'` 분기가 여러 파일에 흩어져 있음.
> 시작 전 확인: `grep -rn "'KR' | 'US'" .` 와 `grep -rn "=== 'US'" .` 로 현재 지점 재확인(코드 바뀌면 갱신).

| 파일 | 손댈 것 |
|------|---------|
| `stores/countryStore.ts` | **`Country` 유니언 확장**(단일 진실원). 기본값은 KR 유지. |
| `components/toolbox/ToolboxClient.tsx` | ① `COUNTRIES` 배열에 `{code,label}` 추가 ② 인라인 `'KR'\|'US'` 유니언 ③ **`countryLabel` 삼항 → 매핑으로**(현재 `country==='KR'?'한국':'미국'` — 국가 늘면 반드시 map화) ④ `FEED_COUNTRY_SUPPORT` ⑤ `feedFor` 국가 분기 ⑥ 특수탭 gating(`market`/`youtube`/`room`) ⑦ `catLinks`는 `l.country===country`라 자동(OK) |
| `components/toolbox/NewsFeed.tsx` | `country` prop 유니언 + `isUs` 식(국가별 소스 분기라면 확장) |
| `components/toolbox/MacroFeed.tsx` | `defaultView` 유니언 + 뷰 분기 |
| `app/api/macro/summary/route.ts` | 국가 유니언 + 거시 데이터 분기(중앙은행/통계청 추가) |
| `app/api/news/feed/route.ts` | `market===` 분기(자국 뉴스 소스 함수 추가, US STEP 473 미러) |
| `app/api/news/route.ts` | `'US'` 분기(있으면 미러) |
| `components/favorites/WatchlistClient.tsx` | 관심목록 국가 분기 |
| `components/layout/HomeIndexStrip.tsx` → `/api/yahoo/indices` | 그 나라 대표 지수 심볼 추가 |
| `lib/currency.ts` | 통화 코드·기호·소수자리 추가 |
| **신규** `app/api/<xx>/*` | 종목/ETF 데이터 라우트(KR `krx`·`kis` / US `us-*` 대응) |
| `vercel.json` | perf 미리계산 크론 추가(`us-perf` 대응) |
| **신규** `components/toolbox/<Xx>MarketBoard.tsx` | `UsMarketBoard` 클론 → 자국 라우트 연결 |
| **DB** `link_hub.country` | MCP insert(코드 아님) |

---

## 3. 완성 기준 (Definition of Done)

- [ ] **배관**: 토글에 국가 노출·전환 정상. `countryLabel` map화(삼항 잔재 X). 유니언 grep 잔여 0.
- [ ] **종목·상품**: 주식+ETF, 기간(1일~1년) 수익률, 정렬·검색·관심⭐. **크론 미리계산·DB 스냅샷 서빙(초기 로딩 ≤1~2초·라이브 fetch 금지) + 모바일 카드형·바텀시트 스냅포인트** — §4-2 필수.
- [ ] **link_hub**: 10 카테고리 **≥ ~130행**, 도메인 웹검증, 자국 기준(영문/현지어 전용 포함).
- [ ] **모아보기**: news(+이미지)·disclosure·macro·analysis·research·etf·ipo 전부 라이브(또는 graceful 빈 피드).
- [ ] **AI 렌즈 R3**: 자국어 네이티브 종목명 검색(§4-4·원어명 테이블+도달성 프로브) + 대표종목 **3중 검수(§4-5) 통과**(자국 기사·통화 정확·무누수).
- [ ] **인덱스 티커**: 그 나라 지수 마퀴에 노출.
- [ ] **통화**: 종목표·수익률 통화/포맷 정확.
- [ ] **모바일 패스**: Chrome MCP로 종목·피드·링크·서브탭 깨짐 없음.
- [ ] **라이브 검증**: localhost:3333 + prod(onetrillion.app) 양쪽 Chrome MCP 확인.
- [ ] **문서**: CHANGELOG·session-context·SESSION_BOOT·핸드오프 갱신(날짜·상태).

---

## 4. 구현 순서 (rework 최소 · 권장)

> 원칙: **코드 없이 되는 것(link_hub)부터 → 배관 → 데이터(무거움) → 피드 → 마감**. 각 코드 단계는 별도 STEP 파일.

1. **link_hub 충전** (STEP 아님·MCP 직접·즉시 라이브) — §7 소스로 웹검증 후 insert. **먼저 해도 무방**(코드 의존 없음). US STEP = 이 세션 US 67→139 참고.
2. **배관 STEP** — §2 touch-point 유니언 확장 + `COUNTRIES` + `countryLabel` map + `lib/currency`. 작고 안전. (이때 종목·피드는 아직 Placeholder라도 OK.)
3. **종목·상품 STEP**(가장 무거움) — `<Xx>MarketBoard` + 데이터 라우트 + perf 크론. 데이터 소스 확보가 관건.
4. **피드 배선 STEP** — `STEP_473_COMMAND.md` **그대로 미러**: 자국 news 소스(+이미지) + Google News 토픽 4탭 + `FEED_COUNTRY_SUPPORT`/`feedFor`. disclosure(자국 EDGAR)·macro(중앙은행) 라우트 추가.
5. **마감** — 인덱스 티커 심볼 + 모바일 패스 + 라이브 검증 + 문서 갱신.

---

## 5. Gotcha (US에서 확인된 함정 — 국가 불문 반복)

- 🔑 **Turbopack**: API 라우트·서버 컴포넌트(`page.tsx`·`CATEGORY_LABELS`) 변경은 자동 갱신 안 됨 → **클린 재시작** `pkill -f "next dev"; rm -rf .next && npm run dev`. 클라이언트 컴포넌트는 HMR 즉시.
- 🌐 **Google News/스크래핑 prod IP 차단 가능** → Vercel에서 간혹 빈 피드. 로컬 OK인데 prod 비면 이 케이스(대체 소스 전환). fallback 덕에 안 깨짐.
- 🧩 **`countryLabel` 삼항** → 국가 3개+면 반드시 `Record`로. 안 그러면 새 국가가 "미국"으로 표시되는 조용한 버그.
- 🗂 **link_hub는 git에 없음**(MCP 직접) → DB 백업/이전 시 별도 export.
- 💸 **결제·키·SERVICE_ROLE 등은 Cowork 취급 불가** — 사용자→`.env.local`.
- ✅ **DB 변경은 배포 불필요**(prod 같은 Supabase), **코드 변경은 push 필요**. 혼동 금지.
- 🔎 **검증은 눈으로**: 카운트 쿼리 + Chrome MCP 라이브 둘 다.
- ⚡ **라이브 fetch 금지**: 종목·수익률을 `force-dynamic`로 매 접속 외부 API 호출 = 콜드스타트마다 10초. 반드시 크론 미리계산+DB 스냅샷(§4-2).
- 📱 **모바일 표 금지**: 데스크탑 컬럼 표를 모바일에 그대로 쓰면 종목명 잘림. 카드형 분기(§4-2 B).

---

## 6. 재사용 STEP 패턴 (복붙 골격)

- **link_hub 충전**: 이 세션 US 방식 = ①§7 후보 → 웹검색 도메인 검증(특화 사이트 위주) → ②`INSERT INTO link_hub (country,category,site_name,site_url,description,display_order,is_active) VALUES …` (Supabase MCP `execute_sql`). 카테고리 슬러그 = 아래 §부록 재사용.
- **피드 배선**: `docs/STEP_473_COMMAND.md`의 3파일 편집(route.ts 자국 뉴스+이미지 / NewsFeed 배선 / ToolboxClient `FEED_COUNTRY_SUPPORT`·`feedFor`)을 국가 코드만 바꿔 미러.
- **종목 보드**: `UsMarketBoard.tsx`를 클론(`Row` shape·`SUBTABS`·`PERIODS` 유지) → fetch 라우트만 자국으로.

---

## 7. 6개국 소스 매트릭스 (자국 기준 후보 · ⚠️ 빌드 시 도메인 웹검증)

> 선정 우선순위(핸드오프 §12-3, 다음 세션 데이터 재확정): **1 US(완료) → 2 일본 → 3 중국·홍콩 → 4 EU → 5 인도 → 6 베트남·대만.**
> 아래는 "그 나라에서 실제 쓰는 것" 후보. 실제 넣기 전 US처럼 도메인 검증. **disclosure(자국 EDGAR)·macro(중앙은행)는 반드시 공식 원본 확보.**

### 🇯🇵 일본 (2순위) — Google News `hl=ja&gl=JP&ceid=JP:ja`
- **지수**: Nikkei 225(^N225) · TOPIX
- **종목데이터**: JPX(jpx.co.jp) · Yahoo Finance JP(finance.yahoo.co.jp) · 株探 Kabutan(kabutan.jp) · みんかぶ Minkabu(minkabu.jp)
- **뉴스**: 日経(nikkei.com) · Kabutan · Minkabu · Reuters JP · Bloomberg JP · Traders Web(traders.co.jp)
- **공시(규제)**: **EDINET(disclosure.edinet-fsa.go.jp, 金融庁)** · **TDnet(release.tdnet.info, TSE 적시공시)**
- **거시**: **日本銀行 BOJ(boj.or.jp)** · **e-Stat(e-stat.go.jp, 統計局)** · 内閣府(GDP) · 財務省
- **거래소·기관**: JPX(jpx.co.jp) · 金融庁 FSA(fsa.go.jp) · 日本証券業協会 JSDA
- **ETF/분석**: Kabutan · Minkabu · Buffett-Code(buffett-code.com, 재무) · Ullet · Morningstar JP
- **커뮤니티**: Yahoo!ファイナンス掲示板 · Minkabu · 5ch 市況板
- **공모주(IPO)**: 96ut.com · Traders Web IPO · JPX 新規上場

### 🇨🇳 중국 + 🇭🇰 홍콩 (3순위) — GN CN `hl=zh-CN&gl=CN&ceid=CN:zh-Hans` / HK `hl=zh-HK&gl=HK&ceid=HK:zh-Hant`
- **지수**: 上证(000001.SS) · 深证(399001.SZ) · CSI300(000300.SS) · 恒生 HSI(^HSI) · HSCEI
- **종목데이터**: 东方财富 East Money(eastmoney.com) · 新浪财经(finance.sina.com.cn) · 腾讯(gu.qq.com) · 雪球(xueqiu.com) · AAStocks(aastocks.com, HK) · HKEX
- **뉴스**: 财新 Caixin(caixin.com) · 第一财经 Yicai(yicai.com) · East Money · 新浪财经 · SCMP(HK) · 21世纪经济
- **공시(규제)**: **巨潮资讯 CNINFO(cninfo.com.cn, CSRC 지정)** · **上交所(sse.com.cn)·深交所(szse.cn)** · **HKEXnews(www1.hkexnews.hk)**
- **거시**: **中国人民银行 PBOC(pbc.gov.cn)** · **国家统计局 NBS(stats.gov.cn)** · 外汇局 SAFE
- **거래소·기관**: SSE · SZSE · HKEX(hkex.com.hk) · 证监会 CSRC(csrc.gov.cn) · SFC(sfc.hk, HK)
- **ETF/분석**: East Money · 天天基金 · Morningstar CN(cn.morningstar.com)
- **커뮤니티**: 雪球 · 股吧(guba.eastmoney.com) · 淘股吧 · Futu/moomoo
- **공모주**: East Money 新股 · SSE/SZSE 新股
- ⚠️ 접근·규제 복잡(후강퉁·港股通) → **정보 사이트 중심**.

### 🇪🇺 유럽 (4순위) — UK `en-GB&gl=GB` / DE `de&gl=DE` / FR `fr&gl=FR` (다국가라 UK 또는 DE부터 착수 권장)
- **지수**: FTSE100(^FTSE) · DAX(^GDAXI) · CAC40(^FCHI) · Euro Stoxx 50(^STOXX50E)
- **종목데이터**: LSE(londonstockexchange.com) · Deutsche Börse/Xetra(boerse-frankfurt.de) · Euronext(euronext.com) · onvista(onvista.de) · Investing.com
- **뉴스**: FT(ft.com) · Reuters · Handelsblatt(DE) · Les Echos(FR) · City AM(UK) · Börsen-Zeitung
- **공시(규제)**: UK **FCA NSM(data.fca.org.uk/nsm)** + RNS + Companies House · DE **Bundesanzeiger(bundesanzeiger.de)** + BaFin · FR **AMF(amf-france.org)** · EU **ESMA**
- **거시**: **ECB(ecb.europa.eu)** · **Eurostat(ec.europa.eu/eurostat)** · BoE(bankofengland.co.uk) · Bundesbank · ONS(UK) · Destatis(DE) · INSEE(FR)
- **거래소·기관**: LSE · Deutsche Börse · Euronext · ESMA · FCA · BaFin · AMF
- **ETF/분석**: justETF(justetf.com) · extraETF(DE) · Morningstar EU · Simply Wall St
- **커뮤니티**: London South East(lse.co.uk) · ADVFN UK · wallstreet-online(DE) · Boursorama(FR)
- **공모주**: LSE new issues · Euronext IPO · Börse Frankfurt

### 🇮🇳 인도 (5순위) — GN `hl=en-IN&gl=IN&ceid=IN:en`
- **지수**: Nifty 50(^NSEI) · Sensex(^BSESN) · Bank Nifty
- **종목데이터**: **NSE(nseindia.com)·BSE(bseindia.com)** · Moneycontrol(moneycontrol.com) · **Screener.in(screener.in, 재무)** · Trendlyne · Tickertape(tickertape.in)
- **뉴스**: Economic Times(economictimes.indiatimes.com) · Moneycontrol · LiveMint(livemint.com) · Business Standard · NDTV Profit
- **공시(규제)**: **SEBI(sebi.gov.in)** · **NSE/BSE corporate announcements** · **MCA(mca.gov.in)**
- **거시**: **RBI(rbi.org.in)** · **MOSPI(mospi.gov.in)** · Trading Economics India
- **거래소·기관**: NSE · BSE · SEBI · MCX(상품)
- **ETF/분석**: Screener.in · Trendlyne · Tickertape · ET Money · Groww
- **커뮤니티**: ValuePickr(forum.valuepickr.com) · Moneycontrol 포럼 · Reddit r/IndianStreetBets·r/IndiaInvestments
- **공모주**: **Chittorgarh(chittorgarh.com, IPO 표준)** · Moneycontrol IPO · NSE/BSE IPO

### 🇻🇳 베트남 (6순위) — GN `hl=vi&gl=VN&ceid=VN:vi`
- **지수**: VN-Index · VN30 · HNX-Index
- **종목데이터**: **HOSE(hsx.vn)·HNX(hnx.vn)** · CafeF(cafef.vn) · Vietstock(vietstock.vn) · VnDirect(vndirect.com.vn) · Fireant(fireant.vn) · Simplize(simplize.vn)
- **뉴스**: CafeF · Vietstock · VnEconomy(vneconomy.vn) · Bloomberg
- **공시(규제)**: **SSC(ssc.gov.vn)** · **HOSE/HNX 공시** · CafeF/Vietstock 기업정보
- **거시**: **SBV(sbv.gov.vn, 중앙은행)** · **GSO(gso.gov.vn, 통계총국)**
- **거래소·기관**: HOSE · HNX · VSD(예탁) · SSC
- **ETF/분석**: Vietstock · FiinTrade · Simplize
- **커뮤니티**: F319(f319.com) · Vietstock 포럼 · FireAnt
- **공모주**: Vietstock IPO · CafeF

### 🇹🇼 대만 (6순위) — GN `hl=zh-TW&gl=TW&ceid=TW:zh-Hant`
- **지수**: TAIEX(^TWII) · TPEx(櫃買)
- **종목데이터**: **TWSE(twse.com.tw)·TPEx(tpex.org.tw)** · Yahoo TW(tw.stock.yahoo.com) · **Goodinfo(goodinfo.tw, 재무)** · CMoney(cmoney.tw) · Wantgoo(wantgoo.com)
- **뉴스**: MoneyDJ(moneydj.com) · 鉅亨 Anue(cnyes.com) · 經濟日報(money.udn.com) · Reuters
- **공시(규제)**: **公開資訊觀測站 MOPS(mops.twse.com.tw, 대만 EDGAR)** · TWSE/TPEx 공시 · FSC
- **거시**: **中央銀行 CBC(cbc.gov.tw)** · **主計總處 DGBAS(dgbas.gov.tw)** · MOEA
- **거래소·기관**: TWSE · TPEx · 金管會 FSC · TDCC(예탁)
- **ETF/분석**: Goodinfo · CMoney · MoneyDJ · Wantgoo
- **커뮤니티**: PTT 股票板(ptt.cc) · CMoney · Wantgoo
- **공모주**: TWSE/TPEx 新上市 · Goodinfo

---

## 부록 A. link_hub 카테고리 슬러그(10, KR/US 공용 재사용)

`analysis`(기업·재무) · `chart`(차트·시세) · `news`(뉴스) · `disclosure`(공시·신용) · `research`(리포트) · `macro`(거시경제) · `etf`(ETF·펀드) · `ipo`(공모주·배당) · `exchange`(거래소·기관) · `community`(커뮤니티).
> 특수탭(종목·상품=Market Board, 유튜브, 리딩방·검증)은 link_hub가 아니라 라이브 컴포넌트.

## 부록 B. 표준 Google News 로케일

| 국가 | hl | gl | ceid |
|------|----|----|------|
| 일본 | ja | JP | JP:ja |
| 중국 | zh-CN | CN | CN:zh-Hans |
| 홍콩 | zh-HK | HK | HK:zh-Hant |
| 영국 | en-GB | GB | GB:en |
| 독일 | de | DE | DE:de |
| 프랑스 | fr | FR | FR:fr |
| 인도 | en-IN | IN | IN:en |
| 베트남 | vi | VN | VN:vi |
| 대만 | zh-TW | TW | TW:zh-Hant |

---

> **한 줄 요약**: 새 국가 = ①link_hub 충전(§7·MCP) → ②배관 확장(§2 전수) → ③종목보드+크론 → ④피드 배선(STEP 473 미러) → ⑤인덱스·모바일·검증(§3 DoD). 함정은 §5.
