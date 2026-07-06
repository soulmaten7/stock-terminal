<!-- 2026-07-06 -->
# 🚀 Trillion(트릴리언) — 새 세션 시작 핸드오프

> **이 파일 하나만 읽으면 새 세션이 바로 업무 가능하도록 만든 완전 자급형 문서.**
> 더 깊은 히스토리 = `docs/SESSION_BOOT.md`(배너 누적) · `docs/CHANGELOG.md` · 정책 = `docs/ROADMAP.md` §3.
> **갱신 시점: 2026-07-06 · HEAD `3f4b647`(STEP 589) · 앱 배포 ✓ onetrillion.app.**
> **🆕 2026-07-06 (최신): STEP 584~589 마감 + 🔴 AI 브리핑 레이어 전략·설계 확정 (HEAD `3f4b647`).** 종목 페이지 "AI LENS" 명명·전문가 톤·정직 보이스(584~589) + **AI(LLM) 브리핑 레이어 R1~R3 + 접근/수익 대전환**. LLM=비정형 텍스트를 사실로만(점수·예측 X). **R1** 공시요약·**R2** 브리핑(핵심 긴장+지켜볼것)·**R3** 뉴스·R4 안 함. **AI 브리핑 무료·공개(구독 폐기)=SEO/글로벌 엔진 · 로그인=개인화(즐겨찾기·알림)만 · 수익=광고/디렉토리/제휴.** 뉴스 감성 팩터 기각·추정치 렌즈 보류. 마스터=`docs/AI_BRIEFING_SPEC.md`·전략=`BUSINESS_STRATEGY` 07-06. **🎉 US(R1+R2+R3) 확정 + KR 공시층·R1-KR 완료 (595~598·HEAD 24b3438). 3라운드 검증+Cowork MCP 재검수 통과·R3 밸류 누수 차단. 🔒 규칙=Claude Code 3회 반복검증+Cowork MCP 실물 재검수. ▶ 다음=다른 국가탭(R2-KR·R3-KR·JP/CN)은 사용자 승인 후.** (아래 07-03 이하는 히스토리.)**
>
> **🆕 2026-07-03 (직전): 렌즈 페이지 표현 개편 + 제품 포지셔닝 확정(STEP 539~544).** 검증된 5렌즈를 정직하게 보여주는 UI: 영문 정식명칭+한글 요약 · "{기법} 알아보기"(개념·유래) · "자세히"(검증) 접기 · 단일 열·홈 너비 통일 · **TRAI**(민트 T) 리브랜딩 · 밸류 라벨 verdict 제거(낮음/보통/높음) · **신뢰도 등급 배지**(검증/표본약함/건전성/참고용) · **기법 엇갈림 표시**(모멘텀×밸류 성향). **제품 정의**: 예측 아님 — 검증된 렌즈들의 읽기 + 신뢰도, 선택은 사용자, 엇갈림=정보(`docs/BUSINESS_STRATEGY.md` 결정 로그) · 종목 데이터 허브=안 만듦(commodity). **3단계**: ①정직화(밸류 완료) →②UI 틀(등급·엇갈림 완료) →③새 기법(퀄리티→마법공식→주주환원, `docs/LENS_ROADMAP.md`). **▶ 다음 = 배포+모바일 눈검수 · ③ 퀄리티(QMJ) 착수.** (수익화·유료 TRAI 계속 뒤로.)
> (직전 2026-07-02: STEP 525~537 신뢰도 업그레이드 사이클 — 5렌즈 t·알파 재검, 모멘텀=검증·저변동=위험대비·밸류=표본약함·F=수익신호아님·기술=참고용.)
> (직전 2026-07-02: STEP 510~523 무료 렌즈 5종 판정 완결.)
> (직전 2026-07-01: US 링크 67→139 · US 피드 파리티 · KR 종목 딜레이 제거 · KR/US 모바일 개편.)

---

## 1. Trillion이 뭔가 (정체성 — 최신)

- **사업자**: 원트릴리언 · 대표 **장은태** · 사업자번호 **210-39-33812** · 도메인 **onetrillion.app** · 문의 contact@onetrillion.app.
- **본질 (2026-06 갱신)** = ① **흩어진 금융정보를 한눈에** (정보 애그리게이션 허브) + ② **AI 기반 구독** (Phase 5, 아직 미착수 — 장기 메인 수익).
- ⚠️ **옛 "투자상품에 안 속게 돕는 신뢰" 정체성은 폐기됨.** 신뢰·검증(리딩방·검증 탭)은 여러 정보 surface 중 하나일 뿐, 더 이상 중심축 아님.
- **거래 X** (정보·허브·링크 연결만). **대화/토론도 전면 제거됨**(다시 넣지 말 것).
- 디자인 = 미드나잇 `#0E1116` + 민트 `#2DD4BF`. 코드 식별자는 `unjong-*`(리브랜드 전 잔재, 유지).

## 2. 지금 상태 (2026-07-01)

- 최신 코드 **HEAD `64a5d9a` = STEP 523**(무료 AI 렌즈 5종 검증 완결·STEP 510~523), origin/main 동기화·**앱 배포 ✓ onetrillion.app.**
- **🏁 무료 AI 렌즈층 완결(2026-07-02)** — `/stock/[symbol]` 5렌즈 전부 백테스트 판정(투자가능 $5+): 모멘텀·저변동·F-Score·밸류(E/P) ✅검증 / 기술 ⚪참고용. 검증 스크립트·플레이북(#1~17)·적합영역 지도 = durable 자산. 수익화·UX는 전 기법 검증 후로 보류(사용자 지침).
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

## 4. KR 탭 구조 (5묶음 · 13 세부탭)

탭바(`TAB_ORDER` in `ToolboxClient.tsx`), 묶음 사이 세로 구분선(`CLUSTER_START`):

| 묶음 | 탭 |
|------|-----|
| 📊 시세·데이터 | 종목·상품 · 차트·시세 |
| 📰 정보·분석 | 뉴스 · 공시·신용 · 리포트 · 기업·재무 · 거시경제 |
| 💼 상품 | ETF·펀드 · 공모주·배당 |
| 🏛 거래소·기관 | 거래소·기관 |
| 👥 사람·의견 | 커뮤니티 · 유튜브 · 리딩방·검증 |

- **헤더 자산군 탭**: `주식`(활성) · `코인`(준비중 — 클릭 시 "준비 중이에요" 팝오버, 페이지 이동 X). 거대 금융 플랫폼 확장 자리 예약.
- 특수탭(종목·상품·유튜브·리딩방)=라이브 데이터라 라벨이 코드(`SPECIAL_LABELS`). 나머지=`app/page.tsx` `CATEGORY_LABELS`.
- 종목·상품: KRX 실데이터 ~2,600 + 정렬·검색·페이지네이션·관심⭐ + **데스크탑 행 클릭 → 1일~1년 수익률 패노라마**(모바일=하단 시트).
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

## 10. ▶ 다음 작업 (우선순위)

1. ✅ **prod 라이브 검증 완료 (2026-07-01)** — onetrillion.app API 확인: US 모아보기 Google News 정상(Vercel IP 차단 없음)·뉴스 이미지 O·KR `source:"kr_snapshot"` 680ms. **→ 새 1순위 = 아래 2(일본).** (남은 확인: 모바일 UI를 실제 폰/Chrome 반응형으로 눈으로 한 번.)
2. **멀티 국가 2순위(일본)** — `docs/COUNTRY_TAB_PLAYBOOK.md`대로. 먼저 시총 순위 + 한국예탁결제원 서학개미 보관금액·순매수 웹검색으로 국가 순서 확정 → 일본 `link_hub` 자국 기준 충전 → 배관(유니언 확장)·종목보드(크론 스냅샷)·피드 배선(STEP 473/474 미러).
3. **Phase 2 결제** — 토스페이먼츠 빌링/구독(`subscriptions`·`billing_events`)+빌링키 정기결제+webhook. 전제: 토스 가입+법률자문+통신판매업.
4. **Trillion AI (Phase 5)** — 종목분석/브리핑/요약 구독형. 전제: 유사투자자문업 신고+법률자문.
5. (선택) 추가 링크 죽은 URL 점검 · ETF/ETN/리츠 탭도 크론 스냅샷 적용(현재 KR 주식만).

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
