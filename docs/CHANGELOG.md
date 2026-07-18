<!-- 2026-07-18 -->
# Trillion(트릴리언) — 변경 이력

## 2026-07-17 (5) — 🗂️ 문서 통합: 현재상태 정본 단일화 (STATE · SYSTEM_MAP · CHANGELOG)

- **개요**: "현재 상태·다음 할 일" 기록 문서가 6개(SESSION_BOOT 139KB · NEXT_SESSION_START 107KB · NEXT_SESSION_PLAYBOOK 61KB · NEW_SESSION_HANDOFF 60KB · SESSION_KICKOFF · session-context)나 겹쳐 append형 평행 히스토리가 됨 → 최신 HEAD가 문서마다 3:3으로 갈리고 "먼저 읽으세요"를 4개가 서로 주장 = 잘못된 인수인계. 읽기전용 서브에이전트 전수 대조 + git/라이브 실측으로 확정 후 통합.
- **⚠️ 위험 발견**: 옛 Supabase ref `qxkmwlkchyxfzxbonhtj`(OT-Marketing)가 문서 13개 + `.env.local`의 `DATABASE_URL`(앱 미사용) + `supabase/.temp/linked-project.json`(CLI 링크)에 잔존. 앱 런타임은 `ccbwxcszdoyjxvckedfp`(Trillion·정답) 확인. → SYSTEM_MAP §2에 footgun 명시(**CLI `db push` 금지·재링크 필요**).
- **해결 (3번 검증-실행)**: `docs/STATE.md` 신설(현재상태 단일 정본·**덮어쓰기**·32줄) + `docs/SYSTEM_MAP.md` 신설(스택·6개국 파이프라인 표[KR 자동 vs 시드]·크론 12·테이블 62·API·env·다크 토큰·함정 — **라이브 실측 기반**) + `CHANGELOG.md`=유일 이력. `CLAUDE.md` 문서규칙·세션종료체크리스트·하네스·세션루틴·참조표를 단일 정본 규칙으로 교체("현재상태=STATE · 이력=CHANGELOG · 아키텍처=SYSTEM_MAP · **현재상태용 새 파일 신설 금지**").
- **Pass 검증**: Pass0 라이브 그라운드트루스(vercel.json 크론 12·62 테이블·시드 수·env·다크 토큰) → Pass1 초안 → Pass2 라이브 수치 교정(`fss_advisors` 1,804→1,847 · `link_hub` KR 138→140 · lens US→1,028) + 옛 ref 누출 0 확인 → Pass3 정합성(정본 상호참조·훅 영향·날짜 일치).
- **아카이브(Claude Code)**: 6개 핸드오프 → `docs/_archive/` · `.claude/hooks/stop-reminder.sh`를 STATE/CHANGELOG 검증으로 교체 · INDEX 갱신.
- **▶ 다음**: ①-JP/CN/VN 종목명 · name_en 자동화 · (선택) 일일 헬스체크·읽기전용 서브에이전트.

## 2026-07-17 (4) — 🌐 ②b-2 관심목록 즉시화 + ①-KR 종목명 영어화 완결 (HEAD `7bd48e5`)

- **개요**: 관심목록 렌즈 요약을 선계산으로 즉시화(②b 완결) + `/en`에서 한글로 남던 KR 종목명을 야후 공식 영문명으로(①-KR·라이브 실측) + 운영모델(멀티에이전트 조직) 자문.
- **②b-2 관심목록 즉시화**(`95d4d9f`): `/api/watchlist/quotes`가 관심 심볼의 `lens_scores` 선계산 상태를 배치로 읽어 톤(강점/주의/보통·state→tone 결정론·라이브 로직과 1:1)으로 각 항목에 포함 → `WatchlistClient`가 로드 즉시 렌더(스켈레톤 없이)·선계산 밖만 실시간 `/api/lens` 폴백(동시성4). ②b(KR 렌즈 선계산) 완결.
- **①-KR 종목명 영어화**(`147bc39`): `kr_stock_snapshot.name_en` 컬럼(Cowork MCP `alter table … add column`) + 신규 `scripts/enrich_kr_names.ts`(야후 배치 quote 100/콜→`longName||shortName`→`name_en` UPDATE·동시성8) + `krx/ranking`(nameEn 반환)·`MarketBoard`(useLocale·3곳 `isEn?nameEn:name`)·`lib/stockName.ts`(KR en 반환)·`watchlist/quotes`+`WatchlistClient`(name_en 선택) 배선. 종목상세는 기존 `resolveStockName`으로 자동.
- **🐞 페이지네이션 버그(Claude Code 발견·수정)**: 초기 스크립트 `select("symbol, market")`가 PostgREST 기본 1000행 상한에 걸려 2772종목 중 ~1772(SK하이닉스 포함) **조용히 누락** → `.range(from, from+999)` 페이지네이션 루프로 전 유니버스 처리(`aebda56`). 재실행 후 `name_en` **2766/2772**(나머지 6 = 야후 미제공 소형주 = 정직한 결측).
- **렌즈 미리보기 공유카드**(`7bd48e5`): ④에서 주인공화한 `LensPreview`(데스크톱 우측 레일)·`BoardTopLensCard`(모바일 인라인)가 종목명을 로케일 무관하게 렌더하던 것 → `displayName = locale==='en'?(nameEn??name):name`(한글 폴백). 두 컴포넌트 모두 `useLocale` 기존 보유·KR 보드는 이미 `nameEn` 실린 row 전달.
- **✅ 라이브 실측**: `/en` KR 보드 리스트+우측 렌즈 미리보기 카드+종목상세 h1 전부 영문명(SK hynix Inc.·Samsung Electronics Co., Ltd.·SK Square·Hyundai Motor Company·Kia Corporation·NAVER Corporation)·`/ko` 한글 유지. 종목상세 메타 타이틀도 영어. 광고 슬롯 증권사명은 광고주 콘텐츠(별개).
- **🅿️ name_en 자동화(미착수)**: 별도 크론 불필요 — 매일 `computeKrSnapshot`(`/api/cron/kr-perf`) upsert payload에 `name_en`이 없어 기존값 보존·새 종목만 null → "name_en IS NULL 종목만 야후에서 채움" 증분 스텝을 일일 흐름에 추가하면 새 상장 자동 커버. 백필=이번 수동 실행 / 정상운영=증분. 사용자 크론 필요성 재검토 요청 → 방식 확정은 대화 후.
- **🧭 운영모델 자문(POTAL 멀티에이전트 조직 적용 여부)**: 3중 검색·검증 결론 = 트릴리언(프리베타)엔 16-Division/59-에이전트는 **과설계**. 멀티에이전트는 독립 병렬 리서치에만 이득(Anthropic·토큰~15배)·코딩은 단일 스레드가 정석(Cognition)·CC 서브에이전트는 2~4개 좁게. 처방 = 단일 스레드 개발 유지 + 시스템맵 1장 + 읽기전용 서브에이전트 2~4개(로케일 감사·소스 프로브·검증) + 일일 헬스체크(3층). 계획 미확정·대화 계속.
- **▶ 다음**: ①-JP/CN/VN 종목명 영어화 · name_en 자동화 방식 확정 · (선택) 운영모델 경량 적용.

## 2026-07-17 (3) — 🔬 렌즈를 주인공으로: ④ 종목헤더·보드 자동미리보기 + ②b-1 KR 렌즈 선계산 (HEAD `fe02a41`)

- **개요**: "렌즈로 보는 경험을 직관의 주인공으로" — ④(종목 페이지 압축 렌즈 헤더 + 보드 상단 자동 미리보기·6개국) 완결 + ②b-1(KR 렌즈 선계산 크론) 착수. 전부 라이브/MCP 실측.
- **④A 종목 페이지 렌즈 헤더**(`dcb1bf6`): `StockLensClient` 상단(이름·현재가 아래)에 압축 렌즈 요약(점7 + 강점/주의/보통·기존 `LensSummary` 패턴·`data.lenses`/`fscore` 재사용) + "종합 매수·매도 점수 없음·판단은 당신" 노트. 밑 상세 카드 불변·ETF 제외. 라이브(삼성전자 강점2·주의2·보통3).
- **④B 보드 상단 자동 미리보기**: 클릭 전에도 맨 위(거래 상위) 종목 렌즈 자동 표시.
  - **744**(`be7407d`·KR): `LensPreview` `example` 라벨 + 신규 `BoardTopLensCard`(모바일 인라인 카드·팝업 아님) + MarketBoard 배선(데스크톱 aside `selectedStock ?? sorted[0]`·**상태 안 바꾸고 표시만 폴백**·URL 복원과 안 싸움). 라이브(SK하이닉스 + "거래 상위 예시").
  - **745**(`9998c7b`·미러): US·JP·CN·VN·GB 5개 보드 동일 적용(CN `.cur` 통화 보존). 라이브 US=Micron 확인. → 6개국 자동 미리보기 일관.
- **②b-1 KR 렌즈 선계산**(`fe02a41` + RPC 마이그 라이브): `computeLensScores`→`computeLensScoresFor(universe, market)` 파라미터화(US 경로 보존) + KR 유니버스(`kr_stock_snapshot` 거래대금 상위·admin 클라·6자리 코드) + `/api/cron/kr-lens-scores`(Vercel cron `30 10 * * *`·kr-perf 뒤) + 로컬 러너(`scripts/precompute_lens_kr.ts`) + **백분위 RPC 시장 필터**(Cowork MCP 라이브·`041_lens_percentiles_market_filter.sql` 아카이브). **KR 489행 저장**(유니버스 500). **MCP 검증**: 삼성전자 states→강점2·주의2·보통3(live 정확 일치)·KR 백분위 정상(momentum 95)·US AAPL 백분위 무오염(시장 격리 작동)·보너스 KR도 백분위 획득(전엔 null).
- **🔑 발견**: `lens_scores.name`의 KR 값이 **영어**("SamsungElec"·야후) → **①(비미국 종목명 영어화)에 야후 영문명(`longName`) 활용 가능** 확인.
- **✅ 검증**: 각 STEP tsc 0·vitest 49/49·라이브(④ 6개국)·MCP(②b-1). ②b-1은 선계산 데이터만 — 관심목록 즉시화는 ②b-2.
- **▶ 다음**: **②b-2**(관심목록/보드가 `lens_scores` 상태를 배치로 읽어 "읽는 중…" 없이 즉시화·`/api/watchlist/quotes`에 톤 포함·없으면 실시간 폴백) → **①**(비미국 종목명 영어화·야후 `longName`+저장+배선).

## 2026-07-17 (2) — 🔎 베타 준비도 평가 + ⭐ 관심목록 렌즈 개편(②a) + /en 종목명 갭 발견 (HEAD `44fa289`)

- **개요**: (1) 경쟁 플랫폼 최신 조사로 "한국어 기준 베타 준비도" 객관 평가, (2) 관심목록을 "내 종목을 렌즈로 보는 목록"으로 재개편(739~742·라이브 실측), (3) 그 과정에 `/en` 비미국 종목명이 한글로 남는 갭 발견.
- **🔎 베타 준비도(3중 검색·검증)**: 결론 = **"클로즈드 베타로 선보이긴 충분, 네이버·토스·초이스스탁과 정면 공개경쟁엔 아직."** 한국 "AI 종목 점수" 시장(초이스스탁 스마트스코어·핀트·LG코스콤 AEFS·씽크풀)은 거의 다 예측/추천/신호 → 트릴리언 차별점 = **비추천 에토스 + 방법 투명성(블랙박스 아님) + 6개국 + 유사투자자문 디렉토리**. 갭 = 스크리너 UI·재방문 훅(관심목록/알림)·비미국 종목명. (근거: Stockopedia·Simply Wall St·Danelfin·초이스스탁·핀트·네이버·토스 웹서치.)
- **⭐ ②a 관심목록 렌즈 개편(739~742)**: "이름만 나열" → **가격·등락 + 압축 렌즈 요약(강점/주의/보통·점7)**.
  - **739**(`9464f0e`) 배치 시세 라우트 `/api/watchlist/quotes` — 관심 심볼을 국가별 스냅샷(`kr_stock_snapshot`·`{us,jp,cn,vn,gb}_stock_perf`)에서 `.in()`으로 한 번에(가격+등락). 라이브 실측(AAPL·삼성전자 정확).
  - **740**(`e4571e7`) `WatchlistClient` 재설계 — 시세 즉시 + **행별 지연 렌즈 요약**(`/api/lens` 재활용·`verdict.tone` pos/warn/flat 카운트·fscore score≥7/≤3·동시성4·스켈레톤)·반응형(모바일 2줄). 라이브: 삼성전자 강점2·주의2·보통3(프로브 톤 일치).
  - **741**(`0fe6971`) 페이지 재편 — 관심종목 hero(제목+"별표한 종목을 렌즈로 한눈에")·리딩방 섹션 `/en` 숨김(KR 전용). ko 3섹션/en 2섹션 실측.
  - **742**(`44fa289`) 데스크톱 현재가 세로 정렬(이름 `flex-1` 흡수 + 렌즈 `sm:w-64` 고정) + 즐겨찾기 설명 종목 중심(ko·en). 라이브: 이름 3·4·8자 3종목 현재가 우측끝 x=1269 동일.
- **🔑 제약(설계 반영)**: `lens_scores`(선계산)는 **US 상위 1000종목만** — KR/JP/CN/VN·US 소형주 없음. 그래서 관심목록 KR 렌즈는 **live `/api/lens` 지연**으로 해결(005930→005930.KS 실시간 계산 확인). 즉시화는 **②b(KR 렌즈 선계산 크론)** 후속.
- **🔍 발견(다음 큐)**:
  - **① 비미국 종목명 /en 한글** — KR 랭킹 API에 `name` 한글 하나뿐(`name_en` 없음). 이전 i18n이 **US SEC 실명만** 커버 → KR/JP/CN/VN 종목명은 /en에서도 한글("/en 100% 영어"의 사각). 해결 = 영문명 소싱(야후 `longName`·"Samsung Electronics Co Ltd")+저장(name_en)+보드·관심목록 배선(ko 폴백).
  - **④ 종목 페이지 렌즈 헤더 + 보드 상단 자동 미리보기** — 목업 2개 확정(풀 7막대 헤더·모바일 인라인 카드·"예시·거래상위" 중립 프레이밍·스플래시 반대), 미구현.
  - **②b KR 렌즈 선계산** — 관심목록 렌즈 즉시화.
- **🎨 설계 결정(④·① 참고)**: 렌즈 3단 밀도 — 카운트+점(목록·보드카드)/풀 막대(종목 페이지)·색·용어 공유. 반응형=일관성이지 동일함 아님. 자동 미리보기는 "추천" 아닌 "거래 상위 예시" 중립 프레이밍. 모바일 스플래시/팝업 반대 → 인라인 카드.
- **✅ 검증**: 각 STEP tsc 0·vitest 49/49·라이브 실측(가격 x=1269 정렬·KR 지연 렌즈·en 리딩방 숨김). 테스트 종목 add→검증→remove로 관심목록 원상.
- **▶ 다음 순서**: ④ → ①(비미국 종목명 영어화) → ②b(KR 렌즈 선계산).

## 2026-07-17 — 🎨 베타 UX·가독성 폴리시 + 지수 티커 이중방어 + 광고문의 언어권 차등 + /en 푸터 정리 (HEAD `21c6649`)

- **개요**: 클로즈드 베타 준비 겸 다크 가독성·모바일 레이아웃 폴리시 + 간헐 지수 티커 사라짐 버그 이중방어 + 광고문의 언어권(en) 차등. 전부 라이브 실측.
- **코인 탭 숨김**(`4135463`): 데이터 준비 전이라 노출 제거(라우트·코드 보존·복구 쉽게). 배포 큐 지연으로 빈 커밋 재트리거(`b0dfe1e`).
- **🌑 다크 가독성 2건**:
  - muted 토큰(`6b2ce97`): `#8A8D93→#9CA3AF` — 다크 배경 소형 보조텍스트 대비 5.95:1(AA 턱걸이)→7.8:1(AAA). 색 토큰 1줄·레이아웃 무변. 마이페이지·보드 등 토큰 쓰는 전역 적용. 배포 재트리거(`c7b8bf2`).
  - 헤더/티커(`ed425f4`): `#0E1116` 다크바 위 하드코딩 흰색(토큰 아님)이 흐림 → 태그라인 `white/40`(≈3.8:1·AA 미달)·워드마크·티커 지수명 `/45`→**/65**, 비활성 탭 `/55`→**/70**. 크기 무변·위계 유지(Trillion 100% 흰색 그대로).
- **📱 모바일 홈보드 풀블리드**(`659b0e2`): `ToolboxClient` 박스 `rounded-2xl border`→`border-y … sm:rounded-2xl sm:border` + 페이지 컨테이너 `px-4`→`px-0 sm:px-6`. 모바일=화면 끝까지(풀블리드·좌우 여백 3중겹침 제거로 ~14% 폭 회복), 데스크톱=카드 유지. **근거**=반응형은 "일관성이지 동일함 아님"(웹서치 3회: 모바일 풀블리드+데스크톱 max-width 중앙 카드가 표준·CNN·Paystack·Robinhood).
- **티커↔보드 빈공간 제거**(`155da9e`): 페이지 컨테이너 모바일 상단 `py-3`→`pt-0 pb-4`(데스크톱 `sm:py-6` 유지). 측정으로 간격=컨테이너 패딩뿐임 확인 후 0으로.
- **🐞 지수 티커 사라짐 이중방어**:
  - **근본원인**: `/api/yahoo/indices`가 21개 지수를 `Promise.all`로 조회 → **심볼 하나라도 야후 순간 실패 시 전체 reject → catch → `{items:[]}`(200)**. + 클라 `HomeIndexStrip`이 `setItems(j.items||[])`로 **빈 응답이 기존 티커를 덮어씀**. 60초 재조회 → 간헐 ~20% 티커 소실(API 5회 중 1회 0개 실측).
  - **클라 견고화**(`fa8a201`): 데이터 있을 때만 갱신(빈 응답 미덮어쓰기) + 빈/실패 시 5초 재시도.
  - **서버 하드닝 STEP 737**(`d391c0c`): 심볼별 `try/catch` 격리(하나 실패=그것만 null·나머지 정상) + `_lastGood` fallback(결과 비면 직전 정상값). **라이브 실측 16회 연속 빈 응답 0**(min 20=격리 작동=한 심볼 빠져도 20개 반환).
- **🔤 헤더 로고 반응형 확대**(`0431d06`): 로고 SVG 고정 22px→`h-6 w-6 lg:h-8 lg:w-8`(모바일 24·데스크톱 32px·2줄 텍스트 높이 정합) + Trillion `leading-none`·태그라인 `mt-1→mt-0.5`(간격 ≈9→2px). 라이브 실측(데스크톱 로고 32px·간격 2px).
- **📢 광고문의 언어권 차등 STEP 738**(`8c7c7a8`): 리딩방(유사투자자문)=한국 특유 개념 → **en(US·국제)에서 제거**. `advertise/page.tsx`(server `getLocale`·room 슬롯·rule2 필터)·`AdInquiryForm`(client `useLocale`·room 옵션 필터)·`en.json`(note·phCompany advisory 문구 정리). **ko 100% 유지**. 라이브 실측: `/en`=슬롯 2(Brokerage·Content feed)·규칙 3·리딩방 노출 0 / `/advertise`(ko)=슬롯 3·규칙 4·리딩방 유지.
- **🐞 교훈**: (1) Vercel 배포 큐 간헐 지연(이 세션 2회)→빈 커밋(`git commit --allow-empty`) 재트리거. (2) `Promise.all`은 하나 실패=전체 실패 — 부분 실패 허용은 심볼별 try/catch(또는 allSettled). (3) 클라가 API 빈 응답을 무비판 반영하면 좋은 상태를 덮어씀 — "데이터 있을 때만 갱신" 가드. (4) `resize_window`가 최대화 창엔 뷰포트 반영 안 됨 → 모바일 실측은 DOM 클래스/computed 검증 + 사용자 폰. (5) 반응형 UX=일관성이지 동일함 아님(레이아웃은 화면 맞춤·디자인 언어는 통일).
- **🧹 /en 푸터 정리(후속)**: (1) 유사투자자문 disclaimer2 en 숨김(`bba2ec0`·"신고·평가·인증 표시…익명 리딩방 주의"=KR 전용·`Footer.tsx` locale 조건·disclaimer1 범용은 양쪽 유지·ko 불변). (2) 사업자 주소 제거(`21c6649`·`businessInfo` ko·en·**무거래 정보서비스라 전자상거래법 제10조 주소표시 비대상**·상호/대표자/사업자번호는 신뢰 위해 유지·법인 전환 시 법인주소 재추가 예정). → **`/en` KR 전용 잔재 완전 0**·라이브 실측(en=advisory·주소 없음/ko=유지).
- **▶ 다음**: 클로즈드 베타 초대(BETA_INVITE.md 준비됨) · (선택) 모바일 폰트 크기 미세조정.

## 2026-07-15 (4) — 🇺🇸 US 뎁스 완결(배당·ETN) + /about 개선 + 🌐 /en 완전 영어화(link_hub·뉴스) (HEAD `3ecadaa`)

- **개요**: US 시장을 KR급 뎁스로 완성(배당·ETN) + /about을 유료 플랫폼 표준으로 개선 + 사용자 지적으로 발견한 `/en` 한글 잔재(link_hub·뉴스)를 전부 영어화. 전 STEP 라이브 실측.
- **🇺🇸 US 뎁스 완결**:
  - **731 US 배당**(`d2ff68d`): `/api/dividends/us-feed`(Nasdaq `calendar/dividends`·일 단위 앞 14일 병합·동시성 4) + `UsDividendFeed` + `UsOfferingsFeed`(IPO+배당 토글·KR OfferingsFeed 완전 동급) + Toolbox 배선. 배당종목→내부 종목상세. 라이브 실측(Vercel 200·40건·"Upcoming ex-dividend"/en·"배당락 예정"/ko).
  - **732 US ETN**(`33f24d2`): US 보드에 ETN 서브탭(주식/ETF/REITs/**ETN**). `/api/yahoo/us-etn-performance`(REIT 패턴·후보 유니버스·**Yahoo quote로 실명+live 필터**·chart 기간수익률). 라이브 18 live ETN(FNGU·VXX r1y −53.8%·BULZ +104.7% 등 극단값 정직 노출·가드 없음). → **US = 주식·ETF·REITs·ETN + IPO·배당 = KR급 뎁스.**
- **✍️ /about 개선**(`b0fee55`): 얇던 소개(슬로건+3기둥+3스텝) → 표준 골격(문제 → 3기둥 → **TR-AI 렌즈 방법 투명화** → 비추천 헤드라인 → 커버리지 → 사용법). 최대 신설 = **렌즈 7개(모멘텀·저변동성·밸류·퀄리티·자산성장·기술·F-스코어)를 학술 계보와 함께 여는 섹션**(그레이엄·파마-프렌치·노비-마르크스 2013·피오트로스키 2000·와일더 1978 — `lensCopy.ts` 실제 값 기반·과장 0). 경쟁사 8곳(Stockopedia·Danelfin·Morningstar 등) About 조사 근거. ko/en 패리티·멍거 톤·라이브 검증(8섹션 양쪽).
- **🌐 /en 완전 영어화(link_hub + 뉴스)** — 사용자가 IPO 탭 한글 지적 → 감사(#86)가 렌즈/데이터 중심이라 놓친 편집·제3자 데이터 발견:
  - **734 link_hub 설명**(`971e237`): `description` 단일 한글 컬럼(490행) → `description_en` 컬럼(MCP 마이그) + 1회 번역 스크립트(gpt-4o-mini) + 렌더 `locale==='en'?description_en:description`(ko 폴백).
  - **735 link_hub 사이트명**(`868c8a5`): `site_name`에 한글 ~139행(기관 고유명·"Investing.com 배당캘린더"류) → `site_name_en`(MCP 마이그) + 이름 전용 번역(기관 공식 영문명 FSS·KRX·DART·증권사 정식명) + 렌더 선택.
  - **736 뉴스 피드**(`3ecadaa`): `/api/news/feed`가 **무조건 한국어 번역**이라 `/en`에서 US/JP/CN/VN 뉴스가 거꾸로 한글이던 것 → **`lang` 파라미터**로 로케일별(en=KR/JP/CN/VN→영어·US/GB 그대로·ko 현행 보존)·인메모리 cache 키 target 분리·NewsFeed `&lang`. **기존 무료 키리스 구글번역+`translation_cache` 재사용 → 추가 비용 ≈ 0.**
  - **✅ 결과**: `/en` = 로고 워드마크 외 한국어 0(정적 UI+결정론+LLM+메타+link_hub 설명/사이트명+뉴스 헤드라인 전부 영어·라이브 KR 시장 뉴스 탭 한글 163→0 확인).
- **마이그(MCP 라이브)**: `link_hub.description_en`·`link_hub.site_name_en`(기록 마이그 파일 커밋).
- **✅ 검증**: 각 STEP tsc 0·빌드·vitest 49/49(패리티 포함)·라이브 브라우저 실측(both locales).
- **🐞 교훈**: i18n은 "레이어"다 — UI·결정론·LLM 넘어 **큐레이션 데이터(link_hub)·제3자 피드(뉴스)**도 각각 스코프. 뉴스는 이미 무조건-ko 번역이라 lang 파라미터화만으로 해결(무료 구글번역이라 비용 0 — OpenAI 가정은 오판이었음, 코드 확인이 정답).
- **▶ 다음(선택)**: 클로즈드 베타 초대 · GB 뉴스 ko 번역(소소) · site_name 번역 품질 스팟수정.

## 2026-07-15 (3) — 🔎 라이브 QA 스윕 + 727 메타타이틀 + 다크 폴리시 D + 🇺🇸 729 US 구조화 IPO 피드 (HEAD `9d977f0`)

- **개요**: i18n 100% 직후 라이브 QA 스윕(브라우저 8페이지 전수) → i18n 잔재 마지막 하나(정적 페이지 메타 타이틀) 발견·수정 → 폴리시 백로그 소진 → **US 시장 뎁스(P2) 실질 전진 = US 구조화 IPO 피드**. 전부 라이브 실측 검증.
- **🔎 라이브 QA 스윕**: `/en`·`/ko` 홈·종목상세(6개국)·about/terms/privacy·로그인 전수 육안. 거의 클린(홈 "음"=로그인 사용자 닉네임 아바타=정상·KR byte 동일·통화·title-case OK). **유일 발견 = 정적 페이지 6종의 `/en` 브라우저 탭/SEO 타이틀이 한글**(본문은 영어인데 `export const metadata={title:"한글"}` 정적 하드코딩이 로케일 안 따라감).
- **727 메타 타이틀 로케일화**(`d15dbed`): `about`·`advertise`·`feedback`·`favorites`·`business`·`coin` → `export const metadata` 삭제하고 `generateMetadata`(로케일 분기·711 패턴). **en 영어**(About·Favorites·Advertising · Inquiries·Beta feedback·Coin (coming soon)·Advisory registration · management)·**ko byte 동일**·feedback `robots:noindex` 보존. `terms`·`privacy`(법률)·`admin`(관리자) 의도적 한글 유지. **라이브 검증** — 6개 `/en` 타이틀 영어 전환·`/ko` 불변·terms/privacy 한글 유지 확인. → **i18n 잔재 0**.
- **다크 폴리시 D**(`1f661e3`): 미사용 `.shadow-soft`/`.shadow-soft-hover` 죽은 CSS 제거(전 `.tsx` 미사용·다크 배경서 `rgba(0,0,0,0.04)` 불가시). 하드코딩 라이트 색 3곳(StockLogo·구글 버튼 2)은 의도적(브랜드 정석)이라 불변. **폴리시 백로그(i18n·다크·통화·title-case·메타) 전부 소진.**
- **729 US 구조화 IPO 피드**(`9d977f0`): US IPO 탭이 **뉴스검색 → 구조화 캘린더**(KR `IpoFeed` 동급). STEP 728 프로브로 **Nasdaq 공개 API 검증**(무키·헤더로 403 회피)→ **신규** `/api/ipo/us-feed`(이번+지난달 병합·upcoming 예정 + priced 최근상장·정규화·6h 캐시) + `UsIpoFeed.tsx`(2섹션 카드: 회사명·티커·거래소·공모가·날짜·딜규모·priced→내부 종목상세 TR-AI 렌즈) + Toolbox US 분기만 교체(JP/CN/VN/GB 뉴스·KR OfferingsFeed **불변**) + i18n(ko "상장 예정"/"최근 상장"·en "Upcoming"/"Recently priced" 패리티).
  - **✅ 라이브 실측**: Vercel `/api/ipo/us-feed` **HTTP 200·실데이터 30건**(예정 6·상장 24·MetaOptics/MOT·Csquare/CSQR·Standard Nuclear/STDN·EWAVU)·**Vercel 403 없음**. `/en` "Upcoming"/"Recently priced" + `/ko` "상장 예정"/"최근 상장" 양쪽 구조화 카드 렌더·회사명 영어·한글/US 교차누출 0. **US 시장 KR급 IPO 뎁스 획득.**
- **✅ 검증 공통**: 각 STEP tsc 0·`NEXT_DIST_DIR=.next-verify` 빌드·vitest(727=49/49·729=49/49 messages.test.ts ko/en 패리티 포함)·라이브 브라우저 실측.
- **🐞 교훈**: (1) i18n 로케일화 시 `export const metadata` 정적 export도 `generateMetadata`로 전환 필요(710D/711이 홈·종목만 커버). (2) Nasdaq IPO 공개 API = 무키·헤더(UA/Origin/Referer) 필수·`data.{upcoming,priced,filed}` 구조·다음달 쿼리 0건(예정은 몇 주 앞만)→이번+지난달 병합. Vercel 서버리스(US IP)서 403 안 남. `LOCALE_SOURCE_PLAYBOOK` 등록 후보.
- **▶ 다음(선택)**: US 배당 캘린더(Nasdaq `calendar/dividends`→US OfferingsFeed=KR 완전 동급) · ETN 서브탭 · 클로즈드 베타 준비.

## 2026-07-15 (2) — 🎉 US 폴리시(725·726) + OAuth 로케일 쿠키(710E) → i18n 100% 완결 (HEAD `6bccc45`)

- **개요**: i18n 마지막 항목(로그인 왕복 로케일)까지 마감 → **i18n 100% = 정적 UI + 결정론 데이터 + LLM 산출물 + 로그인 왕복 전부 로케일 정합.** 그 앞에 US 표시 폴리시 2건.
- **725 종목상세 통화기호**(`3cef637`): `StockLensClient.tsx` 현재가를 `formatPrice(price, countryOf(symbol))`로 → 6개국 통화기호 부착(US `$937.00`·KR `285,000원`·JP `¥`·GB `p`·VN `₫`·CN/HK `¥`/`HK$`). 보드와 일관. %·수익률은 무영향.
- **726 US 종목명 title-case**(`713084c`): `lib/stockName.ts`에 `titleCaseUsName()` — SEC 올대문자(`MICRON TECHNOLOGY INC`)→`Micron Technology Inc`. `/[a-z]/` 가드로 **mixed-case는 무변경**, `KEEP`(IBM·3M·AT&T…)·`CAMEL`(JPMorgan·eBay·iShares…)·`SUFFIX`(Inc·Corp…) 보존. `cleanUsName` 말미 호출.
- **710E OAuth 로케일 쿠키**(`6bccc45`): `/en` 로그인이 한국어 `/`로 떨어지던 gap 제거. **쿠키(`post_login_locale`·SameSite=Lax)로 로케일 왕복** — `redirectTo`/Supabase 허용목록 **byte 불손상**(710D 로그인 사망 회피 절대원칙).
  - 신규 `lib/authRedirect.ts` 순수 헬퍼: `safeNextPath`(오픈 리다이렉트 가드 — 내부 절대경로만, `//`·외부 URL 차단) + `localizePath`(as-needed 프리픽스, en→`/en`, ko→그대로). + `lib/authRedirect.test.ts` 유닛테스트(가드·프리픽스 분기 커버, vitest 49/49).
  - `app/auth/callback/route.ts`: 요청 헤더에서 `post_login_locale` 읽어 `loc` 결정 → `redirect()` 헬퍼가 모든 복귀에 `localizePath` 적용 + 소비한 쿠키 삭제(`maxAge:0`). user insert 로직 불변.
  - 로그인 2곳(`auth/login`·`admin/login`): `signInWithOAuth` 직전 쿠키 세팅(admin은 `useLocale` import 추가). `redirectTo` 2개 문자열 byte 동일.
- **✅ 검증**: tsc 0·vitest 49/49·빌드·4개 로그인 페이지 200·`redirectTo` byte 동일 grep 재확인. **라이브 실측 성공** — 실제 구글 로그인(`soulmaten7@gmail.com`, JWT 발급 3분 내)이 `/en`→`/en`(영어) 복귀·세션 활성. 브라우저 격리 테스트로 `post_login_locale=en`이 `NEXT_LOCALE=ko`인데도 `/en` 구동함을 증명(쿠키가 독립 구동인자).
- **🐞 교훈**: next-intl `NEXT_LOCALE` 쿠키도 로케일을 독립 구동(둘 다 Lax·실사용에서 일치) → 실제 왕복은 둘이 보강. `post_login_locale`은 콜백 **자체 리다이렉트**를 옳게 만들어 미들웨어 재프리픽스에 비의존(더 견고). 쿠키 삭제는 `redirect()`에서 무조건 실행(값이 빈 문자열로 비워짐·max-age=0). 상세=`docs/PARKED_OAUTH_LOCALE_ACTIVATION.md`(활성화 완료 기록).
- **▶ 다음(선택)**: 다크 폴리시 D(죽은 shadow 클래스 정리) · 클로즈드 베타 초대 · 빈 뉴스 명시 UX.

## 2026-07-15 — 🎉 Tier 3: LLM 생성물 영어화 완결 → /en 100% 영어 (HEAD `5c0c348`)

- **개요**: `/en`의 마지막 한국어였던 **LLM 생성물**(브리핑 R2·news-brief R3·공시요약 R1)을 영어화. 설계=`docs/TIER3_LLM_I18N_DESIGN.md`(스키마 A `*_en` 컬럼·on-demand·per-locale). **결과: `/en` = 로고 워드마크(의도적) 외 한국어 0** — 정적 UI + 결정론 데이터 + LLM 생성물 전부 영어. US 영어 시장 제품 완성.
- **720 마이그레이션**(MCP 라이브·기록 `2645cf9`): `stock_briefings.brief_en`·`news_briefs.summary_en`·`filing_summaries.summary_en` 컬럼 추가(nullable·기존 `*_ko` 무손상).
- **721 브리핑 R2**(`e34fee3`): `/api/brief` 영어(프롬프트+`?lang`+`brief_en` on-demand+`computeSymbolLenses(locale)` facts). **🐞 blocker**: `brief_ko` NOT NULL이라 en-first INSERT가 23502 위반→**조용히 실패 시 매 조회 LLM 재과금 누수** → `brief_ko` DROP NOT NULL + upsert 에러 `console.error`.
- **722 news-brief R3**(`60d5d8b`): `/api/news-brief` 영어(+`tags_en` 추가[720 누락]+`summary_ko`/`tags` nullable). **한국어 강제 후처리 ko 게이팅**: 후처리1(비한국어→한국어 재번역)·후처리3(원→엔/위안/동/파운드)를 `locale==='ko'`로 감쌈. 후처리2(옛연도 필터)는 언어중립이라 양쪽 유지.
- **723 공시요약 R1 US**(`9329993`): `/api/events/summary` 영어(`summary_en`·accession 전역 캐시·`summary_ko` DROP NOT NULL).
- **724 공시요약 R1 5개국**(`5c0c348`): `kr/jp/cn/gb/vn-events/summary` 723 패턴 복제(영어 프롬프트[소스=DART·EDINET·cninfo/HKEX·RNS·VN뉴스]·CN/VN 후처리 ko 게이팅·통화 원문 유지).
- **🔒 공통 안전**: 캐시 **컬럼 분리**(`*_en`/`*_ko`)로 언어 교차 오염 원천 차단 · **on-demand**(영어 트래픽만 과금·전량 재생성 아님) · **KR byte 동일**(ko 경로·프롬프트·후처리 불변·라이브 삼성전자 공시 ko/en 컬럼 독립 실측 증명).
- **✅ 검증**: 각 STEP tsc 0·vitest 43/43·빌드·양쪽 실측·가드레일(예측·목표가·투자의견 없음). ⚠️ JP EDINET 키 미설정은 소스 fetch 이슈(로케일 무관·i18n 회귀 아님).
- **🐞 교훈**(`LENS_DEV_PLAYBOOK` #31): additive `*_en` 컬럼만으론 로케일 독립 안 됨 — `*_ko`가 NOT NULL이면 en-first INSERT가 실패 경로 + swallowed upsert 에러 = **조용한 유료 LLM 누수**(visible crash 아님). → `*_ko` DROP NOT NULL + upsert 에러 로깅 필수.
- **▶ 다음(선택)**: US 통화기호 title-case · 빈 뉴스 명시상태 UX · OAuth 로케일 쿠키 · 다크 폴리시 D · 클로즈드 베타.

## 2026-07-14 (5) — 🌐 영어 데이터 레이어 i18n (Tier 1+2 결정론) + 브랜드 록업 폴리시 (HEAD `3cb73ab`)

- **📡 발견(#86 감사)**: `/en`에서 정적 UI는 영어인데 **데이터/AI 레이어가 한국어**(렌즈명·판정·grade·브리핑·공시라벨·종목명 h1). 원인 2층: (A) 클라가 `&lang=en` 안 보냄(카피는 이미 이중언어) (B) 일부 하드코딩 한국어. → 결정론(Tier 1+2)은 이번에 전부 영어화, LLM 생성물(Tier 3)은 설계만.
- **🔧 715 Tier 1**(`a393940`): 렌즈 fetch `&lang=${locale}` 배선(LensPreview·StockLensClient) — 카피 이미 이중언어라 렌즈명·판정·스펙트럼·전망 한방에 영어 + grade 이중언어 맵(`LENS_GRADE`) + h1 영문명(`info.en`) + AiLensBadge lang. **KR byte 동일**(charac 테스트).
- **🔧 716 Tier 2a**(`36dbed9`): 8-K 공시 라벨 이중언어(`eightK.ts`)+`/api/events` lang·캐시키 + F-Score locale(`fscore.ts` 우량/중립/부실→Strong/Neutral/Weak) + ETF 레버리지 정규식 영어 키워드.
- **🔧 717 Tier 2b**(`a9d9ad7`): `lenses.ts` detail 키를 stable화(한국어가 `L.detail['200일선대비%']` **lookup 키**라 key/label 분리) + `DETAIL_LABELS`/headline 이중언어. 조회 3곳 동기화·charac red-diff로 무회귀 증명.
- **🔧 718 Tier 2c**(`72d4f32`): 렌즈 `note` 6개 영어 번역(t값·샤프·STEP번호 등 수치·레퍼런스 보존) + short/long 이중언어(계산 모듈이 언어중립 state 반환). **KR SHA 동일 증명**(live `/api/lens?...&lang=ko` vs git HEAD).
- **🔧 719 브랜드 록업**(`3cb73ab`): `/en`에서 한글 워드마크 "트릴리언" 숨김(헤더·푸터·로그인·`locale==='ko'` 조건부·ko 병기 유지·SEO alternateName 보존).
- **✅ 결과**: `/en` **결정론 데이터 100% 영어**. 남은 한국어 = LLM 생성물(브리핑·news-brief·공시 AI요약) = **Tier 3**(설계 완료 `docs/TIER3_LLM_I18N_DESIGN.md`·스키마 A `*_en` 컬럼·on-demand·STEP 720~723). tsc 0·vitest 43/43.
- **🐞 교훈**: 카피 이미 이중언어면 `&lang` 배선이 최대 레버리지 · 한국어 리터럴이 lookup 키면 key/label 분리(안 하면 gauge 조용히 깨짐) · KR 무회귀는 charac red-diff+SHA로 증명 · `npm run build`가 dev `.next` 밟음→`NEXT_DIST_DIR` 우회. (`docs/LENS_DEV_PLAYBOOK.md` #30.)
- **▶ 다음** = Tier 3(720 마이그레이션부터) or US 잔여(통화기호·IPO) · OAuth 로케일 쿠키 · 다크 폴리시 D · 클로즈드 베타.

## 2026-07-14 (4) — 🐛 캐시 stale 버그 3-STEP 완결: 모든 [locale] 페이지 신선화 (HEAD `d122cac`)

- **📡 발견(배포 확인 중)**: STEP 711 배포를 web_fetch로 확인하다 **`[locale]` 페이지가 무한 정적 캐시로 굳어 배포해도 안 갈아엎어지는** 버그 발견. bare URL이 봇·방문자에 **옛 콘텐츠** 서빙 — `/stock/{종목}`=옛 브랜딩("AI 렌즈"·폐기 태그라인·미정리명 "Apple Inc. - Common Stock"), `/about`=**개편 이전 정체성**("정확한 정보·검증된 신뢰"·"속지 않도록"·"흩어진 금융정보"), `/terms`·`/privacy`=**법무 정확화(07-12) 이전** 텍스트. 코드는 전부 현재값인데 라이브만 stale = SEO·규제 리스크. 캐시버스터(`?fresh=`)로 확정.
- **🔬 원인**: `app/[locale]/layout.tsx`의 `setRequestLocale`+`generateStaticParams`가 정적 렌더를 켜는데, 페이지에 `dynamic`/`revalidate` 지시자가 없으면 on-demand 정적 생성 후 무한 캐시(배포 무효화 안 됨). 홈만 `force-dynamic`이라 신선했던 것.
- **🔧 712**(`2cd926d`): `app/[locale]/stock/[symbol]/page.tsx` `force-dynamic`. 라이브=애플·TR-AI 렌즈·새 태그라인.
- **🔧 713**(`9c4d619`): 정적 8개(`about`·`terms`·`privacy`·`toolbox`·`coin`·`favorites`·`feedback`·`advertise`) `force-dynamic`. 라이브=`/about` 새 3기둥·`/terms`·`/privacy` 법무·`/en/about` 영어 기둥.
- **🔧 714**(`d122cac`): 클라 3개(`mypage`·`auth/login`·`admin/login`)는 `'use client'`라 page의 `dynamic`을 Next가 **무시** → 폴더에 서버 `layout.tsx` 래퍼(`dynamic="force-dynamic"`+passthrough)로 세그먼트 강제 동적. **로그인 로직 1글자 불변**(6줄=죽은 dynamic 삭제만). 3 라우트 `●`→`ƒ`. layout 방식 먹혀 서버/클라 분리 폴백 불필요.
- **🐞 교훈**: (1) `[locale]` 하위 페이지는 캐시 지시자 명시 — `'use client'`는 page의 `dynamic` 무시되니 **서버 layout 래퍼**로. (2) `npm run build`가 실행 중 `npm run dev`의 `.next/`를 밟아 dev 500 → 클린 재시작(`pkill + rm -rf .next && npm run dev`). 빌드 후 dev 500이면 코드 아니라 이 원인부터.
- **✅** tsc 0·vitest 34/34·전 라우트 라이브 200·`/about`·`/terms`·`/privacy`·`/en` 신선 확인. **남은 검증 = 구글 로그인 실제 왕복(브라우저·ko·en).**
- **▶ 다음** = 구글 로그인 왕복 라이브 확인 · US 잔여(선택 통화기호·IPO·ETN) · OAuth 로케일 쿠키 · 다크 폴리시 D · 클로즈드 베타.

## 2026-07-14 (3) — 🔎 US 풀뎁스 P0: 종목상세 영어 SEO + US 파리티 감사 (HEAD `f647b08`)

- **📋 US vs KR 파리티 감사**(서브에이전트 + DB 실측): US는 이미 KR 동급이거나 **더 깊음** — 배관·종목보드(모바일·뷰복원·렌즈미리보기·크론)·피드 7탭·**link_hub 139**(KR 138·옛 "US 67 미충전"은 낡은 정보)·brokers 17·지수바 완비. US가 KR보다 깊은 곳=렌즈 백분위 게이지(US 유니버스 전용)·공시 심각도 분류(material/routine)·서학개미 한글명. KR 전용(갭 아님·의도)=코스피/코스닥·상하한·유사투자자문사·유튜브. **유일한 실질 갭 = 종목상세 영어 SEO.**
- **🔎 STEP 711 종목상세 영어 SEO**(`f647b08`·`app/[locale]/stock/[symbol]/page.tsx` 단일 파일): `generateMetadata`·JSON-LD를 locale 인지화 → `/en/stock/{symbol}`이 영어 title(Stock Price · TR-AI Lens · News · Filings)·description·keywords·OG `en_US`·**hreflang(ko·en·x-default)**·영어 breadcrumb(Home/Stocks). ko `/stock/{symbol}`은 **byte 동일**(SEO 무회귀·curl 대조). VN 분기(뉴스만·공시 없음) 양쪽 보존. 인라인 locale 분기(SEO 템플릿이라 메시지 카탈로그 아님).
- **🔑 Opus 스펙 결함 교정(교훈)**: 스펙이 en 페이지에 `${name}`(서학개미 `foreign_ko_names` 한글명 오버라이드)을 그대로 써서 "애플 forecast" 같은 **한글명 영어 SEO**가 나올 뻔 → **en 분기는 `info.en`(영문명) 주·한글명 보조**로 스왑(Apple Inc. · 애플). ko 출력 무영향. (영어 SEO엔 반드시 영문명 우선.)
- **⚠️ 잔여 US(선택)**: P1 통화기호(`$`·상세 `<h1>`/가격 `formatPrice`) · P2 US IPO 구조화 피드·ETN 서브탭 · (보류) 인라인 증권사 광고=수익화. `/en/stock/{KR종목}`이 한글명인 건 KR 종목 영문명 DB 공백(데이터·지어내지 않음)·나중 자동 해결.
- **✅** tsc 0·vitest 34/34·빌드 성공·`IntlError` 0·ko 무회귀 curl 대조·en 신규 라이브 확인.

## 2026-07-14 (2) — 🌍 2차 i18n(다국어) 완성: next-intl [locale] 라우팅 + 영어(en) + 언어 스위처 + en→US 시장 디폴트 (HEAD `14c1813`)

- **개요**: 2차 목표(다국어) 3단계 완성 — 기반(708) → 문자열 이관(709~709F) → 라우팅·영어·기능(710A~710D). 코드상 i18n 완결. ko는 URL·화면 100% 그대로, `/en`에서 영어 사용 가능, 헤더 스위처로 한↔영 전환.
- **문자열 이관(709~709F·`ko.json`)**: Chrome(Header·Footer)·Toolbox·렌즈(LensPreview·StockLens·EtfLens)·6개 보드(Board 공유 네임스페이스 dedup)·AdvisorDirectory·피드/행·사용자 대면 페이지(about·advertise·business·coin·favorites·feedback·login·mypage·not-found)를 `messages/ko.json`으로(값 100% 동일·화면 0 변화). 서버 컴포넌트=`getTranslations`(async)·클라=`useTranslations`. **제외**: props·API·데이터·필터/정규식 키·**DB로 가는 값**(신고사유·intent·slot=label만 번역·value는 코드 유지). **의도적 제외**: `admin/*`(운영진 전용)·`terms`/`privacy`(관할법 문서라 번역 대상 아님).
- **710A [locale] 라우팅 구조**(`70328e8`·ko 단일·`localePrefix:'as-needed'`·화면 0 변화): `i18n/routing.ts`·`navigation.ts`·`request.ts`(requestLocale)·`proxy.ts`(createMiddleware, Supabase 세션 갱신과 합성) + `app/*` 페이지 라우트 `app/[locale]/*`로 이동(api·정적·메타 라우트 제외)·`generateStaticParams`+`setRequestLocale`(정적 렌더 유지). **🐞 함정**: next-intl 공식 matcher의 "점(.)=정적파일" 규칙이 종목코드(7203.T·0700.HK·600519.SS·VIC.VN·SHEL.L·BRK.B)를 정적으로 오인 → 해외 5개국 종목 상세 전부 404날 뻔 → **확장자 화이트리스트로 교체**(proxy.ts 주석 명시).
- **710B en.json**(`c8a69b5`): 414키 ko와 1:1(누락 0·초과 0)·영어. 브랜드 보이스 잠금(슬로건 "An eye for stocks — for everyone."·3기둥 Institutional-grade analysis/Honest data/Your judgment·멍거 각인 원문·"Insufficient data"). **ICU 아포스트로피 함정**=영어 축약형 배제(do not·it is)로 회피(멍거 건조 톤과 일치). `messages.test.ts` 신설 = 키 패리티·플레이스홀더/태그 보존·양쪽 ICU·아포스트로피·보이스 잠금을 **영구 vitest 회귀 테스트**로. 🐞 `Login.brandKo`=로고 워드마크(트릴리언)라 번역 금지(초기 "Trillion Trillion" 버그 수정).
- **710C 언어 스위처 + 링크 스왑**(`bacacf7`): 헤더에 잠겨있던(en:ready false) 언어 드롭다운 오픈(라벨 각 언어 표기 하드코딩) + 내부 `Link`·`useRouter`·`usePathname`·`redirect`를 `@/i18n/navigation`으로(로케일 유지). `useSearchParams`·`notFound`·외부/광고/mailto/api 링크 제외. **🐞** 스위처 쿼리 보존에 `useSearchParams` 쓰면 전역 헤더에 Suspense 경계 강제→SSG 페이지(/about·/terms) de-opt → 클릭 시점 `window.location.search` 읽기로 우회(SSG 유지). redirect는 명시적 타입 재export(구조분해 시 never-narrowing 깨짐 방지).
- **710D 로케일 기능**(`7882614`): ① `homeMarketFor(locale)` 단일 진실원 = en→US·ko→KR 홈 시장 맨 앞·기본(저장 국가 없는 첫 방문만·STEP 703 뷰 복원 무손상) ② 정적 metadata→`generateMetadata`(로케일 title·og:locale ko_KR/en_US) + JSON-LD 로케일화. hreflang은 레이아웃 alternates가 하위 경로 오인식 유발 → 미들웨어 Link 헤더(경로별 자동)+홈만 HTML alternates(canonical+ko/en/x-default) ③ youtube 조회수 로케일 나눗셈(만/억↔K/M·Intl compact).
- **🅿️ 보류(파트4 롤백 `14c1813`)**: OAuth 로케일 보존 — `/en` 로그인 시 콜백이 `/`(ko)로 떨굼. redirectTo에 `?next=/en` 붙이면 **Supabase 리다이렉트 허용목록이 거부→로그인 자체가 죽음**(구글 동의화면도 안 뜨고 튕김) → 파트4만 롤백(파트1~3 라이브 유지). **쿠키 방식 수정안** = `docs/PARKED_OAUTH_LOCALE_ACTIVATION.md`(redirectTo 불변·쿠키로 로케일 전달).
- **✅ 검증**: tsc 0·vitest 34/34·빌드 성공·`IntlError`/MISSING 0·양쪽 로케일 전수 클릭(ko `/ko` 프리픽스 유출 0·en 프리픽스 유지·스위처 쿼리 보존).
- **▶ 다음**: OAuth 로케일 쿠키 수정(PARKED) · 라이브에서 6개국 보드·유사투자자문사·`/en` 클라이언트 뷰 육안 · **US 탭 풀뎁스(2차 본목표)** · 다크 폴리시 D · 클로즈드 베타 초대(`docs/BETA_INVITE.md`).

## 2026-07-14 — 🌑 다크 테마 3단계 완결 + 🧭 유사투자자문사 정합(라벨·정렬·위치) + 🎓 온보딩(자기설명) + 🖥️ /about 폭 (HEAD `3c2fc8b`)

- **🧭 유사투자자문 조회 UX 정합**: `48e9802` AdvisorDirectory 패널에 **'유사투자자문 조회' 제목** 추가(탭명 정합) + 문서 깊은 히스토리 잔재 [이력·폐기] 배너 마무리(SESSION_KICKOFF·PLAYBOOK·NEXT_SESSION_START·INDEX·ROOM_VERIFICATION·TOSS_ANALYSIS·AI_LENS_SPEC). `e199328` 하위탭·패널 라벨 **'유사투자자문 조회'→'유사투자자문사'**(법적 정확·금감원 등록 업체 목록 성격). `828e97c` 🐞 목록 정렬을 **상호명 접두어((주)·㈜·(브랜드)) 무시 가나다**로(`/api/advisors` 전체로드→JS 정렬→페이지 슬라이스·3뷰 공통) + 하위탭에서 유사투자자문사를 증권사 앞으로. `f66d77f` 하위탭 순서 되돌림 — **증권사→유사투자자문사**(증권사=주류 1차 카테고리 우선·유사투자자문사 인접 유지).
- **🔍 SEO**(`551d5e1`): 메타 keywords 새 정체성으로 교체(주식커뮤니티·투자상품평가·리딩방검증·신뢰평가허브 제거 → **종목분석·TR-AI렌즈·검증된투자기법·유사투자자문조회**).
- **🎓 온보딩 KR (Option A·자기설명 중심)**(`de58fca`): 헤더 로고 밑 태그라인(lg+) + 상단 '소개' 링크(→/about) + LensPreview 문구 또렷하게(빈상태+선택상태·**"사고팔 신호 아니라 판단할 재료"**) + /about '이렇게 봅니다' 3스텝. **배너·팝업 없음**(리서치: 과잉 온보딩 회피·자기설명 UI 우선).
- **🖥️ /about 폭**(`e5c4a97`): 페이지 폭을 앱 기본(max-w-7xl)에 맞춤 — 3기둥 3열 그리드·본문 읽기폭 유지(페이지 이동 시 폭 튐 해소).
- **🌑 다크 테마 개선 (라이트→다크·3단계·안 깨지게)**:
  - **1/3 토큰화**(`f029d91`·겉모습 변화 0): 배경전용 토큰 `unjong-strong` 신설 + `bg-unjong-primary`→`strong`(글자/배경 역할 분리·33곳) + `bg-white`→`bg-unjong-surface`(28곳).
  - **2/3 플립**(`07fc4bf`): `app/globals.css` 토큰 값만 다크로(background #0A0A0A·surface #17181C·border #2A2C31·primary글자 #E9EAEC·muted #8A8D93·strong #2C303A) + body·html `color-scheme:dark`·스크롤바. 앱 전체 다크. **라이브 검증 완료**(헤더·본문 톤 일치·등락 빨강/파랑·민트 살아있음).
  - **3/3 폴리시**(`3c2fc8b`·🔴Opus): 앰버 배지→`bg-amber-400/10 text-amber-300`·게이지 fill→`/45`·상태색(emerald-600→400 등) 다크 대비 + 구글 로그인버튼·StockLogo 실로고원 라이트 유지(정석)·레터아바타 이니셜 `text-unjong-strong`(파스텔 인라인 배경이라).
  - 근거: 브랜드가 미드나잇+민트·헤더 이미 다크·데이터밀도 금융툴은 다크가 정석(리서치). **개선(전환 아님).** 후속 D=accent 틴트 알파·shadow-soft(라이브 눈으로).
- **▶ 다음**: 다크 폴리시 D 후속(accent 틴트 알파·shadow-soft→border, 라이브 눈으로) · **/about 3기둥 이름 직관적 교체**(목업 승인됨·미적용: '전문가의 분석을 당신 손에'/'예측 대신 사실만'/'사라고 하지 않습니다') · 클로즈드 베타 초대(`docs/BETA_INVITE.md` 준비됨) · 2차: i18n·로케일 스캐폴드(next-intl)→US 탭 풀뎁스 · Vercel Analytics 대시보드 Enable(1클릭).

## 2026-07-13 — 🎯 종목보드 UX 마감 + 🔵 브랜드 정체성 인앱 정합 + 🧭 nav 2탭 축소 + 🧪 인앱 베타 피드백 + 📚 지침 정체성 정리 (HEAD `c0d3b80`)

- **🐞 거래대금 정렬 방향 버그 수정**(`b581950`·6개 보드): `(b-a)*dir`→`(a-b)*dir`. desc에서 오름차순으로 뒤집혀 **거래대금 최저 잡주가 상단에 뜨던** 문제(US/JP/CN/VN/GB) — name·price 정렬과 일치. KR 무영향.
- **🔬 TR-AI 렌즈 정직 표시**(`a2887b1`): "준비 중" → **이유 명시**("데이터 부족(상장·거래 이력 짧음)" · 네트워크 오류 문구 분리) · 재무 없는 종목의 퀄리티·자산성장을 숨기지 않고 **"재무 데이터 없음"** 행으로 표시. (직시 원칙 — 데이터 없으면 "데이터 부족"이라 말한다.)
- **📌 STEP 703 종목보드 뷰 복원**(`832d24e`·`lib/boardMemory.ts` + 6개 보드): 렌즈 상세 왕복 시 **하위탭·정렬·페이지 유지**, 국가 전환/새로고침 시엔 초기화.
- **🖥️ PC 우측 TR-AI 렌즈 패널 sticky 고정**(`2573896`·6개 보드): 티커 밑 고정(self-start+max-h 내부스크롤) — 스크롤 내려 하단 종목 클릭해도 렌즈 보임.
- **🧹 종목보드 컨트롤 힌트·색범례 제거**(`19aff5c`·6개 보드): "종목 클릭 시 우측에 TR-AI 렌즈·브리핑" 힌트 + 상승/하락 범례 제거(우측 레일 안내 + 퍼센트 부호가 방향 표시라 중복 · 코스피/코스닥 토글 가로넘침 해소).
- **📱 KR 코스피/코스닥 토글 별도 줄**(`3af1a82`): 세그먼트를 주식 하위탭 아래 별도 줄로 — 모바일 한 줄 오버플로/잘림 해소(주식 탭일 때만 표시).
- **🧪 인앱 베타 피드백 `/feedback`**(`b39406f`): FeedbackForm + `/api/feedback`(서버 삽입·입력 캡) + supabase `feedback` 테이블(RLS on · anon REVOKE) · 설문 5문항+별점+연락처 · noindex · end-to-end 검증.
- **🔵 브랜드 정체성 인앱 정합**(`e1550f9`): `/about`·`/advertise` 새 카피(멍거 톤·3기둥·시장중립·주관 단정 제거) + `BRAND_IDENTITY §6` 진원 정합(옛 "전문가 시각으로, TR-AI가 무료로 분석해 드립니다" 태그라인 → [이력·폐기]) + `CLAUDE.md` 프로젝트 개요 재작성.
- **🧭 nav 상단 2탭 축소**(`c0d3b80`·`components/toolbox/ToolboxClient.tsx`): 상단 '검증' 탭 → **'정보' 하위탭 '유사투자자문 조회'**(KR 전용)로 이동 → 상단 = **종목·정보 2탭**. 하위탭 라우팅·복원·구분선·effect 정합.
- **📚 지침·문서 정체성 정리(1차)**: 라이브 문서(핸드오프·플레이북·SESSION_BOOT·ROADMAP·RELEASE_ROADMAP·README·AD_MONETIZATION·LOGO_PROMPT·BUSINESS_STRATEGY)의 옛 프레임("속지 않게"·"안 속는 곳"·신뢰=중심축·정보/대화/허브/신뢰 4박자·"흩어진 금융정보를 한눈에"·Trustpilot 핵심차별화)을 현행 3기둥(무기·직시·자립)으로 정리 · `PRODUCT_SPEC_V6/V7`엔 [이력·폐기] 배너(본문 보존). STEP 아카이브·구 V3 보존 문서(SYSTEM_DESIGN·CLAUDE_CODE_INSTRUCTIONS)는 히스토리로 유지. (`BRAND_IDENTITY.md`·`CLAUDE.md`는 이미 정리 완료.)
- **✅ 상태**: 통신판매업신고 = **비대상**(무거래 정보서비스 · 2026-07-12 확정 재확인) · 모니터링(Sentry v10·Vercel Analytics) = 2026-07-12 마감·유지. CI·라이브 초록.
- **▶ 다음**: 지침 정체성 정리 잔여분 마무리 검수 · AdvisorDirectory 패널 헤딩 '유사투자자문 조회' 정합 · 공개 POST(inquiry·feedback·click) rate-limit(Vercel KV) · Sentry 소스맵 AUTH_TOKEN(선택) · Vercel Analytics 대시보드 Enable(1클릭) · 1차 출시 = 클로즈드 베타 초대 발송.

## 2026-07-12 (3) — 🛡️ 하드닝 마감(DEFINER 뷰·ai-analysis) + 📈 모니터링 도입(Vercel Analytics·Sentry) (HEAD `09f1174`)

- **🛡️ DEFINER 뷰 정리**(`supabase/migrations/20260712_harden_definer_views_grants.sql`): QA가 플래그한 2개 뷰를 라이브 조사 → **악용 구멍 아님**(둘 다 UNION/LATERAL 복합뷰=업데이트 불가라 anon 쓰기권한은 먹통·노출 데이터는 공개용). `advisor_directory`는 DEFINER **유지**(라우트가 세션 클라로 읽어 로그아웃=anon인데, base 테이블은 RLS on+anon 정책 0 → 이 DEFINER 뷰가 공개 컬럼만 노출하는 필수 통로. security_invoker 켜면 로그아웃 사용자에게 디렉토리 빈 화면). `stock_snapshot_v`(앱 미사용 레거시)만 invoker 전환 + anon/auth 권한 회수 + 두 뷰의 먹통 쓰기권한 회수. 라이브 `/api/advisors` 로그아웃 1,553행 정상 검증. SECURITY DEFINER 함수 8개는 트리거·카운터 RPC라 정상(현행 유지).
- **🔴 미사용 `/api/ai-analysis` 제거**(`36fe906`): POST가 **인증 없이 매 호출 OpenAI gpt-4o-mini 과금**(무한 비용 구멍)인데 앱 완전 미사용(예전 TRAI 스텁 잔재·import 0건) → route + `lib/ai/analysis.ts` 삭제. 공개 POST 전수 분류: reports·watchlist·rooms/favorite·toolbox/favorite·admin/*·business/* = 401 보호 확인. inquiry·toolbox/click = 저위험 공개(입력 캡)·진짜 rate-limit은 서버리스라 Vercel KV 필요 → 후속.
- **📈 Vercel Analytics**(`3b3250e`): `@vercel/analytics` + 루트 `<Analytics/>`. ⚠️ **대시보드 Enable 1클릭 남음**(안 켜면 수집 안 됨).
- **📈 Sentry**(`17bfbf3`·`@sentry/nextjs` v10.65): `sentry.server/edge.config.ts`·`instrumentation-client.ts`·`instrumentation.ts`(onRequestError)·`app/global-error.tsx` + `next.config.ts` 조건부 래핑(DSN 없으면 무동작→빌드 정상). env 4개(NEXT_PUBLIC_SENTRY_DSN·SENTRY_ORG=trillion-nu·SENTRY_PROJECT=javascript-nextjs·SENTRY_AUTH_TOKEN). **라이브 검증 완료** — 테스트 에러가 Sentry Issues에 캡처됨(Claude in Chrome으로 직접 확인).
- **🐞 교훈 — Vercel `NEXT_PUBLIC_*` 빌드캐시 함정**: env를 나중에 추가하면 Vercel이 이전(값 없던) 빌드의 컴파일 캐시를 재사용해 `NEXT_PUBLIC_*`가 코드에 **안 박힘**(SDK 무동작). 새 커밋·일반 재배포로도 안 고쳐짐 → **Redeploy에서 'Use existing Build Cache' 체크 해제**로 캐시 없는 전체 재빌드해야 인라인됨. (Sentry가 배선·env 다 맞는데도 계속 무동작이던 유일 원인. `__SENTRY__` 부재로 진단→캐시프리 재빌드로 해결.)
- **🧹 임시 검증 라우트**(`bb7a2a4`→`09f1174` 삭제): Sentry 확인용 `/api/_sentry-test` 추가→검증 후 제거.
- **▶ 다음 = Vercel Analytics 대시보드 Enable(1클릭)** + (후속) 공개 POST rate-limit(Vercel KV)·Sentry 소스맵 AUTH_TOKEN(선택). **1차 출시 하드닝·모니터링 완료.**

## 2026-07-12 (2) — 🔒 1차 출시 QA 관문 통과 — RLS 4개 테이블 보안 마감 + ⚖️ 법무 정확화 + 🔵 태그라인 새 슬로건 (HEAD `4ea75a1`)

- **🔒 QA 스윕(LAUNCH_PLAYBOOK §2)**: 코드+라이브 전수 점검 — 약관·개인정보·면책, robots/sitemap/OG, 모든 사용자 API 인증(401), service-role 키 클라 미노출, env 안전(.gitignore), XSS 안전 = 전부 출시급 통과. **진짜 블로커 1개 발견·마감**.
- **🔴 RLS 4개 테이블 보안 마감**(`supabase/migrations/20260712_enable_rls_public_data_tables.sql`): `kr_stock_snapshot`(2,771행·KR 보드 핵심)·`brokers`(75)·`jp_stock_perf`(4,256)·`translation_cache`(271)가 RLS off + anon/authenticated에 `DELETE·TRUNCATE·UPDATE`까지 부여돼 **공개 anon 키(클라 번들 내장)만으로 KR 보드 전체 삭제·위조 가능**했음 → RLS on + anon/auth REVOKE(TRUNCATE는 RLS 미적용이라 REVOKE 병행). 읽기/쓰기 경로 9곳(`lib/krSnapshot·jpPerf·stockName`, `app/api/brokers·krx/*·yahoo/jp-list·news/feed`, `app/sitemap`) 전부 service-role(`createAdminClient`)이라 앱 영향 0(코드 검증). 라이브 `apply_migration` 선반영 → 재검증(RLS=true·anon권한 none) → 라이브 `/api/brokers`(20개)·`/api/krx/ranking`(100종목·`source:kr_snapshot`) 정상 서빙 확인. (`kr_etp_snapshot`은 이미 RLS on이었고 이 4개만 누락)
- **⚖️ 법무 정확화**: 이용약관·개인정보처리방침 소셜로그인 표기 '구글만'으로 정확화 + 개인정보 **§11 권익침해 구제방법**(개인정보분쟁조정위 1833-6972·침해신고센터 118·대검 1301·경찰 182) + 시행일 2026-07-11.
- **🔵 태그라인 새 슬로건 반영**: 푸터(`Footer.tsx`)·로그인(`auth/login`)·소개(`about`) 3곳 옛 "전문가 시각으로, TR-AI가 무료로 분석해 드립니다" → **"종목을 보는 눈을, 누구에게나."**. 라이브 `/about` 본문·푸터·OG 메타(og:title·og:image=/og.png·설명) 전부 새 브랜드 확인.
- **✅ 검증**: 커밋 `4ea75a1` 푸시 · CI 최근 3개 전부 초록불(이 커밋 포함) · tsc 0 에러 · 라이브 보드·배포·링크 미리보기 초록.
- **▶ 다음 = 통신판매업신고 대상 여부 확인**(거래·중개 없는 정보/허브 서비스라 비대상 유력·최종 확인) **+ 선택 하드닝**(모니터링 Sentry/Vercel Analytics·공개 POST rate-limit·DEFINER 뷰 security_invoker=on). **진짜 출시 블로커는 없음.**

## 2026-07-12 — STEP 700~702 — 🔭 렌즈 "독립 배선" 아키텍처 리팩토링 (1차 뼈대) + 🇰🇷 종목보드 코스피/코스닥 토글·상하한 배지 + ✨ 1차 폴리시(JP/CN/VN)

- **700**: 🔭 렌즈 "독립 배선" 아키텍처 — StockData 번들 + Lens 인터페이스(compute async 허용=기법당 AI 자리) + LENSES 레지스트리 + 오케스트레이터 제네릭화 + percentile meta화. 계산·출력 불변(특성화 테스트 26개 보증 + 라이브 3종목 프로덕션 대조 byte-identical 확인). 설계=docs/LENS_ARCHITECTURE.md. 🐞 리팩토링 중 발견·즉시 수정: 재무 데이터가 아예 없는 엣지케이스에서 퀄리티·자산성장이 (예전엔 생략되던 것과 달리) na로 포함돼 렌즈 개수가 4→6개로 바뀌는 회귀 — `computeSymbolLenses`에서 `lr` 없으면 두 렌즈를 배열에서 필터링해 원래 동작 복원.
- **701**: 🇰🇷 종목보드 **코스피/코스닥 세그먼트 토글**(전체·코스피·코스닥, `ranking`/`kis` API market 파라미터 배선·캐시 `market:stock:{market}` 분리·전환 시 정렬·검색·기간 유지) + **상한/하한 배지**(±29.5% 근사, 선택 기간이 1일일 때만 표시·PC 표+모바일 카드 동일). ETF/ETN/리츠 탭엔 토글 미노출. RELEASE_ROADMAP §1·KR DoD(item D).
- **702**: ✨ 1차 폴리시 — **JP TOPIX** 깨진 소스(^TPX quote 105.18·spark 빈값) 대체 심볼(^TOPX·998405.T) 실측 둘 다 실패 확인 → **카드 자체를 지수 응답에서 제외**(니케이만 정상 표시, 깨진 값 노출 금지 원칙). **CN 종목보드 홍콩만**(`SHOW_CN_ASHARES=false` 스위치로 상해A·심천A 서브탭 숨김·배선 보존, 2차에 true로 복원 · ETF 서브탭은 데이터 771개 확인돼 유지). **VN 공시→"뉴스" 정직 표기**(`app/stock/[symbol]/page.tsx` SEO title·description·keywords에서 VN만 "공시" 제거 — 인앱 `VnEventLayer`는 이미 "뉴스"로 표기돼 있었음, 페이지 메타데이터만 누락). 5개국 감사 결손 마감.

## 2026-07-11 (2) — 🔵 브랜드 외부 슬로건 확정 + 🖼️ OG/링크 미리보기 새 브랜드·실제 로고 (HEAD `ba3ce68`)

- **🔵 브랜드 외부 슬로건 확정**(`docs/BRAND_IDENTITY.md` §0·`a2d552a`): 슬로건 **"종목을 보는 눈을, 누구에게나."** · 서브 **"모든 시각을 데이터로 — 판단은 당신입니다."** · 각인 = 멍거 원문 "The best thing a human being can do is to help another human being know more." · 경쟁 백스페이스(남들은 "이기게" 판다, 우리는 "제대로 보게, 판단은 당신"). 이전 포지셔닝 문구 **"흩어진 금융정보를 한눈에"는 폐기**(편의 프레임·차별 실패).
- **🖼️ OG/링크 미리보기 새 브랜드**(`336d08c`): `app/layout.tsx` title·description·openGraph·twitter(+images) 새 슬로건으로 교체(리딩방·"한눈에" 문구 제거) · `app/page.tsx` JSON-LD 갱신.
- **🖼️ OG 이미지 실제 로고**(`ba3ce68` = HEAD): `public/og.png`를 실제 로고 마크가 박힌 1200×630으로 교체 + 새 브랜드 문구.
- **핸드오프 문서 갱신**(`38f2ab8`): 세션 종료 핸드오프 6문서 갱신.

## 2026-07-11 — STEP 694~699 — 🐞 미리보기 기간수익률 '—' 버그 단일 소스화 + 🧪 개발 안전망 1차(vitest·CI) + 🔭 밸류 렌즈 KR 활성화 + ⚡ ETF/ETN 크론 스냅샷화 + 🐞 거래일 판정 수정 + 🐞 Vercel keep-alive 재조회 실패 수정

- **694**: 🐞 미리보기 기간수익률 '—' 버그 — 1일전(ranking)·1주~1년(kr-performance)을 브라우저에서 병합하던 걸 **ranking 한 응답으로 통합**(둘 다 같은 kr_stock_snapshot). 병합 실패로 나머지 기간이 통째 '—' 되던 현상 제거. 저장(크론)은 원래 정상, 신규상장주 '—'는 정상.
- **695**: 🧪 개발 안전망 1차 — 수익률 계산 `pct`를 `lib/returns.ts` 순수모듈로 추출·배선 + vitest 유닛테스트(정상·대세상승 비클램프·null) + GitHub Actions CI(매 푸시 tsc→test→lint[비차단]). 이후 로직 변경 시 회귀를 기계가 자동 검증.
- **696**: 🔭 밸류(가치) 렌즈 **한국 활성화** — 야후가 .KS에 PER/PBR을 안 줘 전 종목 "산출 불가"였음 → 재무(순이익·자기자본·주식수)로 PER=시총/순이익·PBR=시총/자기자본 직접 산출(pe/pb null일 때만 폴백, US 무영향). 순수함수 perFrom·pbrFrom + 유닛테스트. (LENS_DEV #29)
- **697**: ⚡ ETF/ETN 성과 **크론 스냅샷화**(kr_etp_snapshot) — 매 요청 라이브 fetch(36콜)의 부분실패(r1w/r3m 전 종목 빈칸)·콜드 2.8s 해소. 종목보드와 동일 패턴·검증된 pct 재사용·순차 fetch. 라우트는 스냅샷 우선(빈 값이면 라이브 폴백). 크론 10:15 UTC.
- **698**: 🐞 STEP 697 크론 r1w·r3m·r6m 전부 null 수정 — KRX ETP가 주말·휴장일에 종목 목록은 주되 종가(TDD_CLSPRC)가 빈칸인데 `snapshot()`이 `rows.length>0`으로만 거래일 판정 → 빈 종가의 주말 스냅샷을 채택해버림. "유효 종가 있는 날만 채택"(`rows.some(r=>TDD_CLSPRC>0)`)으로 수정(크론+두 라우트 폴백). KRX 실측 프로브로 원인·수정 검증.
- **699**: 🐞 STEP 698 수정 후에도 **Vercel 크론에서만** r1w·r3m·r6m 여전히 null 재발 — 순차 조회 시 주말→거래일 재조회(offset 7·91·182)가 필요한 기간만 Vercel↔KRX 평문 HTTP keep-alive 커넥션 재사용에서 두 번째 호출이 죽는 문제로 확정(샌드박스 클라우드 리눅스에선 동일 로직 풀채움 실측). `buildKind`를 종목보드 크론과 동일한 `Promise.all` 동시조회로 전환.

## 2026-07-10 — STEP 673~693 + 🔴 브랜드 대개편 — 정체성 3기둥(무기·직시·자립)+멍거 목소리 + 보드 정렬 개선 + 리딩방 채널 연결 + 광고 수익화 기반 + 브랜드 문구 확정 + 탭 14→3 재구조 + 미리보기 광고 제거·태그라인 교체 + "TR-AI 렌즈" 명칭 통일 + 증권사 소개글·너비 + 위치 이름옆 + 증권사 정보하위·인리스트 광고(KR) + ETF "상품 구성" 상세(US·KR) + 미리보기 ETF 구성 요약 + ETF 영숫자코드·라벨정정 + ETN 상품정보 + ETF 너비·뒤로가기·검증탭 행클릭 + 전체 UI 일관성 3중 감사

- **🔴 브랜드 정체성 대개편**(`docs/BRAND_IDENTITY.md` 재작성): 3기둥 = **무기**(Arm·TR-AI 렌즈)·**직시**(See·1차 재료)·**자립**(Compete·판단은 당신). 정신적 뿌리 = 프로메테우스·칸트(Sapere aude)·그레이엄·멍거. 목소리 = 멍거 톤(건조·인센티브·"덜 멍청하게"). 가드레일 = "무장하되 벼린다"(칼=명료함이지 대박 아님). 근간 = "예언·추천 안 함, 불을 건넨다, 성공=당신이 우릴 덜 필요로 하게 됨". 확정 슬로건/OG: 타이틀 "전문가 시각으로, TR-AI가 무료로 분석해 드립니다", 설명 "가격은 시장이 붙이고, 가치는 당신이 매깁니다 — 판단은 당신 몫". 옛 운종 태그라인은 [이력]로 보존. **신규 전략 문서**: `docs/AD_MONETIZATION_PLAYBOOK.md`(슬롯 인벤토리+어필리에이트+요금표+언어권 합법성 원장·KR=자본시장법상 퍼블리셔 어필리에이트 없음→직접 광고 제휴·진짜 파이=AI구독+증권사 성과형)·`docs/ETF_LENS_PLAN.md`.
- **673**: 6개 보드(KR·US·JP·CN·VN·GB) 기본 정렬 **주당가격→거래대금순** — 삼성전자·Apple 등 시장 대표주가 상위(네이버·야후 표준).
- **674**: 리딩방 채널명에 **금감원 공개 homepage 연결** — 1,557개 등록업체 미인증 외부링크(인증 채널과 시각 구분).
- **675**: 리딩방 공개채널 **플랫폼 아이콘**(텔레그램=Send·유튜브=PlayCircle·카카오=MessageCircle·기타=Globe) + **미리보기 바로가기 복원**(공개=outline·미인증 표시, 인증=solid 구분). OG 프리뷰 게이트 완화.
- **676**: 광고 수익화 기반 — **`lib/ads.ts`** 슬롯 인벤토리·어필리에이트·요금표 단일 소스 코드화. `LensPreview` PC 하단 **`preview_banner_pc` 슬롯** 배선(미판매→광고문의 CTA). 어필리에이트 배선 보존(제휴 0개·스위치 OFF).
- **677**: 미리보기 광고 **AI 카드 밖으로 분리**(신뢰) — PC: 카드 아래 별도 카드. 모바일: 시트 맨 아래 구분선+"광고" 라벨 블록. AI 카드엔 우리 콘텐츠만.
- **678**: OG·SEO 문구 확정 반영(`app/layout.tsx`) — 타이틀 "전문가 시각의 무료 주식 분석", 설명 "전문가 시각으로, TR-AI가 무료로 분석해 드립니다 / 가격은 시장이 붙이고, 가치는 당신이 매깁니다."
- **679**: 홈(`app/page.tsx`) title override 제거 — layout `title.default` 단일 소스 상속으로 홈 탭·구글 제목 불일치 해소.
- **680**: 🧭 **탭 14개 → 상단 4탭(종목·정보·증권사·검증) 재구조**(`ToolboxClient.tsx`, Cowork/Opus 직접 리팩토링·tsc 0). 빅테크식 최소·직관 네비 + catch-all 금지(네이버·다음·야후 관행). "정보" 안에 뉴스·공시·리포트·기업재무·거시·ETF·공모주 + (구분선) 차트·거래소·토론커뮤니티·유튜브 하위탭. 유튜브·리딩방=KR 게이팅, 검증=상단탭 승격. 콘텐츠 렌더링 재사용(무손실). 근거: `docs/BRAND_IDENTITY.md`.
- **681**: 🧹 **미리보기 광고 카드 제거**(`LensPreview.tsx` — PC·모바일 `preview_banner_pc`+어필리에이트 블록 삭제, AI 카드는 렌즈·브리핑·전체보기만). 광고는 리스트 10개마다(`AdSlotRow slot="feed"`)로 일원화. + **UI 태그라인 3곳**(푸터·about·로그인) "흩어진 금융정보를 한눈에" → "전문가 시각으로, TR-AI가 무료로 분석해 드립니다"(정체성 일치). `lib/ads.ts` 정의는 보존(향후 재사용).
- **682**: 🏷️ **"AI 렌즈" → "TR-AI 렌즈" 명칭 통일**(엔진 브랜드 반영, Cowork/Opus 직접·tsc 0). 중앙 `AiLensBadge.lensLabel()` = `TR-AI ${렌즈/Lens/レンズ/镜头}`(다국어 일괄). 미리보기 헤더·빈화면·"전체 렌즈근거보기"→"TR-AI 렌즈·근거 보기"·"AI·사실만"→"TR-AI·사실만", 6개 보드 힌트, 종목페이지(제목·사실만) 반영. 내부 주석·SEO 키워드·"렌즈 점수/근거"(개념어)는 유지.
- **683**: 🏦 증권사 탭 — 20곳 **소개글(계열/유형 중립 사실)** 이름 밑 표시(`ListRow subtitle`), 옛 홍보 note 대체(STEP 328서 뺀 자리 사실로 복원). PC 증권사 탭 너비 `mx-auto max-w-3xl`→`w-full`(다른 탭과 정렬). SK증권=독립계(2018 SK 분리) 반영.
- **684**: 증권사 소개글 위치 이름 밑→**이름 옆**(`ListRow meta`, 바로가기 사이 빈 공간·PC만). Supabase `brokers.note` 20곳 검증 사실로 갱신(옛 "20년 연속 1위" 등 홍보문구 대체) — Cowork가 DB 직접 갱신, 이 커밋 재배포로 `/api/brokers` 하루캐시 플러시.
- **685**: 🧭 증권사 탭 **상단→정보 하위**로 강등(상단 종목·정보·검증 3탭). 🏦 종목 리스트 **10개마다 증권사 데모 광고**(KR 대신증권, `BrokerAdRow`·`lib/ads.boardBrokerAd`) — 트래픽 낮은 참조 탭 대신 사용자가 있는 리스트에서 거래처 안내(어필리에이트 없는 한국은 직접 광고 제휴 경로·데모로 인벤토리 시연). "거래처 안내"지 투자권유 아님. 5개 비KR 보드는 그 언어권 광고 확보 시 동일 패턴.
- **686**: 📦 **ETF/펀드 구성 상세 페이지**(MVP-A·US). `/stock/{ETF}`가 기업재무 렌즈 대신 **구성 뷰**(상위 보유종목·섹터·보수율·운용사)로 분기 — `lib/instrumentType.ts`(Yahoo quoteType 감지)·`api/etf-holdings`(Yahoo topHoldings)·`EtfLensClient`. US 라이브(SPY·QQQ), KR은 "준비 중"(KRX=MVP-B). 구성=상품 정보(거래처 무관)·수익화(증권사)는 별도. 설계 `docs/ETF_LENS_PLAN.md`.
- **687**: 📦 **KR ETF 구성**(MVP-B·네이버 m.stock `etfAnalysis`·키 없음) — `api/etf-holdings` KR 분기(상위10보유·섹터·추종지수·운용사·보수율). KRX getJsonData=LOGOUT(안티스크래핑) 미채택. EtfLensClient 섹터 KR 코드 매핑. ⚠️ 네이버 Vercel 도달성은 §4 실측.
- **688**: 📦 미리보기 렌즈 슬롯 **ETF 구성 요약**(`LensPreview` — ETF면 렌즈 대신 추종·상위3보유·보수율). 보드 ETF 클릭 시 미리보기가 비지 않고 구성 상세와 일관.
- **689/690**: 🐞 ETF **영숫자 KRX 코드**(0193T0 단일종목ETF) 인식 버그 수정(`krCode /^\d[0-9A-Z]{5}$/`) + KR 유형감지 네이버 stockEndType으로. 📛 ETF 구성 라벨 **"TR-AI 렌즈"→"상품 구성"**(AI 분석 아님·정체성). 섹터 미분류 "기타".
- **691**: 📄 ETN **상품 정보** 처리 — 바스켓 없는 전략노트라 "구성" 대신 ETN 설명 + 발행사 신용·레버리지 주의(`etf-holdings.fundType`·`EtfLensClient` ETN 패널·미리보기 안내). ETF/종목과 분기. 🐞 404 가드(Claude Code 검증서 발견·수정): ETN·일반종목은 `etfAnalysis`가 404+빈바디라 `r.json()` 예외로 바깥 catch에 빠져 2단계 미도달(ETN이 stock으로 오분류)됐던 것을, 1단계 fetch를 자체 try/catch로 감싸 `r.ok`만 파싱하도록 수정.
- **692**: 🐞 ETF/ETN 상세 **너비를 종목 상세와 동일**(max-w-7xl+max-w-4xl)·**뒤로가기 router.back()**(홈 아님). 검증 탭 **행 전체 클릭=미리보기**(채널명도 미리보기→바로가기로 링크, 즐겨찾기만 제외). 모바일 동일.
- **693**: 🔍 앱 전체 UI 일관성 **3중 감사** + 2건 수정 — 관심종목 행 **전체 클릭→종목 상세**(링크 없던 것 복구), 로그인 "돌아가기" **router.back()**(홈 고정 제거). 나머지(페이지 너비·6개 보드 행클릭·피드)는 정상 확인.

## 2026-07-09 (2nd) — STEP 668~672D — 보드 성능 스냅샷화 + 데이터 정확성 검수 Round 1 + VN HNX 보류(배선 완비) ✅

- **성능(668·668B)**: VN·US·CN·JP·GB 종목 보드 = 라이브 야후→**크론 스냅샷 DB 서빙**(KR 미러). 로딩 수초→수백ms. 크론 룩백 280→400일로 **r1y 복구**. 6개국 전부 즉시화.
- **검수 Round 1(코드/데이터 대조)** — 유니버스·이름·태깅 실측으로 실제 문제 다수 발견·수정:
  - **669 US 종목명**: us_symbols.json **placeholder 4,231(61%)** = 이름이 티커 → **SEC `company_tickers.json`**로 실명 보강 → 55(0%). (라이브 quote 제거로 드러난 문제·정적 1회 보강.)
  - **670 CN ETF 오태깅**: A주 ETF 363개(상해 5xx·심천 15x)가 `market:'ss'/'sz'`로 주식탭 오염 → **`type`(stock/etf) 필드** 도입, 주식탭 ETF 제외 + ETF탭에 A주 ETF **종목별 통화(CNY)** 표시.
  - 유니버스 크기 확인: JP 4,256·CN 7,098·US 6,936(88% 커버·나머지 상폐추정)·GB 349(FTSE350)·VN 387→403(vnstock HOSE).
- **671~672D VN HNX 사가** → **HOSE 403 확정 + HNX 보류(배선 완비)**:
  - 야후 `.VN`=HOSE 전용(HNX "No data"). 유일 소스 **VCI(Vietcap)** 발견(vnstock 소스에서 엔드포인트 추출)·HNX 커버 확인.
  - VCI가 **클라우드 IP 지속요청 소프트차단**: Vercel `[]`·**GitHub Actions(Azure)도 일회 프로브만 통과, 배치 반복 시 차단**(⚠️"프로브 통과≠지속 통과" 교훈). 로컬/거주지 IP만 안정.
  - → **Yahoo HOSE 403 복구**(672D·보드 정상·VJC 139,000 VND 스케일 정상). **HNX는 배선 완비 후 보류**: `scripts/vn_hnx_vci_cron.mjs`(VCI 페처) + `docs/PARKED_HNX_VCI_ACTIVATION.md`(활성화 체크리스트·VPS 거주지 IP 필요).
- **🅿️ 보류 기능 프로토콜 표준화**(사용자 확정): 소스가 근본적으로 막히면 가짜로 채우지 말고 **작동 코드 보존+PARKED 문서+원장 기록**. `LOCALE_SOURCE_PLAYBOOK §11` 신설 + `CLAUDE.md` 세션종료 체크리스트 추가. 플레이북 §8-10/11 실패원장(야후 HNX·VCI IP차단).
- ▶ **다음**: 데이터 검수 **Round 2(Chrome 라이브 눈검수)·Round 3(교차 레퍼런스)** + CN #2(A주 소형주 ~1,600) → 그 후 **한국어 광고**(원 순서: 검수→광고→다국어).

## 2026-07-09 — STEP 668 — ⚡ 5개 보드 가격 스냅샷화(라이브 야후 제거 → DB 서빙) ✅

- **마이그레이션 `040_perf_snapshot.sql`**: VN·US·CN·JP·GB `*_stock_perf` 테이블에 `price·amount·r1y` + US/CN/JP/GB에 `r1d` 추가. Applied.
- **`lib/{vn,us,cn,jp,gb}Perf.ts`**: `PerfRow`에 `price·amount·r1d·r1y` 추가. `yf.chart` bars에서 `volume`도 추출 → `amount = price × vol`. CN A주: `eastmoneyBars` 업그레이드(`fields2=f51,f53,f57`) — f57 거래대금 직접 저장(price×vol 대신). 280일 룩백에서 `r1y(252거래일)` 포함 저장.
- **`app/api/yahoo/{vn,gb,us,cn,jp}-list/route.ts`**: `yf.quote` 라이브 페치 완전 제거. `{cc}_stock_perf` SELECT(`symbol,price,r1d,r1w,r1m,r3m,r6m,r1y,amount`) → 인메모리 15분 캐시. CN `?market=` / JP `?type=` 파라미터 유지(DB에서 SYMS Set으로 필터). 응답 < 1s (이전 yf.quote 수초 → 테이블 300ms).
- **크론 트리거**: VN 385, GB 349, CN 4008, JP 1080 computed. US Yahoo rate-limit(앞선 ~5.8k 요청 누적) → **로컬 0 computed · Vercel 배포 후 prod 크론 수동 트리거 필요**.
- **TSC**: `EXIT 0`. console.log 없음.

## 2026-07-09 — STEP 665~667 + 🌍 LOCALE_SOURCE_PLAYBOOK — 가독성 리파인 마감 + 지수 티커 6개국 + 검증 배지 AA + 언어권 소스 런북 ✅

- **🌍 `docs/LOCALE_SOURCE_PLAYBOOK.md` 신설**: 언어권 데이터소스 **발견·검증·기록 런북**("런북=프로그램·LLM=인터프리터"). 의미우선 스키마(정체·목적·필수속성·인스턴스) + 발견 결정트리 + 검증게이트(web_fetch JSON 빈값·Vercel IP차단·JS토큰·인코딩·경로추측금지) + 실패원장 9건 + relevance 규칙 + 서학개미/6개국 공시 실측 통합. **CLAUDE.md 참조 테이블 등록.** (이번 세션 "언어권 확장 방법론" 대화의 실체 산출물 — 하드코딩 대신 "방법·정의"를 코드화.)

- **665 표 정리**: 6개 보드 표의 반복 AI렌즈 아이콘 컬럼 제거(5열·TLensLogo import 정리)·클릭 힌트 추가·LensPreview 수익률 라벨 `1일전/1주일전…` 통일·브리핑 13px/leading-6.
- **665B 힌트 이동**: 별도 줄 → 컨트롤 줄 하위탭 뒤(빈 공간 활용·데스크탑 전용).
- **666 지수 티커**: TOPIX(`^TPX`)·상하이종합(`000001.SS`) 추가(22개). 국가 블록 KR→JP→CN→VN→US→GB→ETC 순서 재정렬. `group` 필드·블록 사이 `bg-white/15` 세로 구분선. 라이브 확인(22개·두 심볼 모두 Yahoo 정상).
- **667 배지 대비 AA**: `LensPreview`·`StockLensClient` `gradeBadgeClass` strong 배지 `text-unjong-accent`(민트·저대비) → `text-unjong-success`(다크틸 #0E7C7B·AA 통과). 6개 보드 컨트롤 줄에 빨강/파랑 범례(상승·하락 도트) 데스크탑 전용 추가.
- ▶ **다음**: 광고 대화(진짜 광고 데이터 모델·게재·결제) 또는 서학개미 relevance 파이프라인(플레이북 §5).

## 2026-07-08 (4th) — STEP 662~664 — 증권사 독립 탭 + 종목 보드 우측 레일=AI 렌즈 미리보기(렌즈+브리핑·PC/모바일) + 광고 CTA 정리 ✅

- **662 증권사 독립 탭(`ToolboxClient`)**: BrokerRanking을 종목보드 사이드바에서 분리 → Toolbox 상단탭 `broker` 독립 신설. TAB_ORDER에 `'broker'` 추가·SPECIAL_LABELS·랜더 분기.
- **663D `marketDate` lib**: 브리핑·뉴스요약 `as_of`를 UTC 대신 시장 로컬 타임존(KST/EST/JST 등) 기준 날짜로(`lib/marketDate.ts`·`marketTz(symbol)`·`Intl.DateTimeFormat('en-CA')`). UTC/KST 어긋남 해소.
- **663 KR 레일 LensPreview**: MarketBoard 우측 aside를 증권사→`LensPreview`(렌즈+브리핑 카드·디바운스 700ms·`gradeBadgeClass`·w-96). BrokerRanking 사이드바 제거.
- **663B LensPreview 공유 추출 + 6개 보드 미러**: `components/toolbox/LensPreview.tsx` 공유 컴포넌트 신설(`LensRow` 타입·compact 프롭·Next Link CTA). US·JP·CN·VN·GB 4개 보드도 동일하게 우측 레일=LensPreview. AiLensBadge 파노라마 제거.
- **663E 모바일 하단 시트 LensPreview compact**: 6개 보드 모바일 바텀시트의 "AI 렌즈" `<a>` 버튼 → `<LensPreview compact />`. PC 레일과 동일(렌즈+브리핑). HEAD `53db7fa`.
- **664 광고 CTA 정리(`HEAD 이번`)**: 6개 보드 종목 리스트 10행마다 반복 삽입되던 broker AdSlotRow 제거 → 리스트 **하단 1개만**. 광고주 0인 현재 정직화. 진짜 광고 데이터 모델(승인·결제)은 광고 대화 시 처리.
- ▶ **다음**: 광고 대화(진짜 광고 데이터 모델·게재·결제 설계) 또는 국가 추가(인도·대만).

## 2026-07-08 (3rd) — STEP 659~661 — 🇨🇳 CN 공시 완결 (A주 cninfo + HK HKEXnews, R1 6개국) ✅

- **659 CN A주 이벤트층 `CnEventLayer` (`f3fee9b`)**: `/api/cn-events`(symbol.SS/.SZ → cninfo `topSearch` orgId → `hisAnnouncement` 8건) + `CnEventLayer`·isCN 배선. 노이즈 필터(减持/质押/日常关联交易/龙虎榜) + MATERIAL 키워드(业绩/分红/收购/重大合同 등). 10분 인메모리 캐시.
- **660 CN R1 `CnFilingSummary` (`73dfc9b`)**: `/api/cn-events/summary`(`unpdf` PDF 텍스트 추출→gpt-4o-mini 한국어 사실 요약→`filing_summaries`[`CN`+id] 캐시·SSRF=static.cninfo.com.cn PDF·한국어 아님→번역 폴백·위안 통화교정).
- **661 CN HK 이벤트층 + R1 (`e5a7b55`)**: HKEXnews(홍콩거래소 공식 공시) 배선 — `cn-events` 라우트에 HK 브랜치 추가(prefix.do JSONP→stockId→titleSearchServlet 20건·NOISE_HK/MATERIAL_HK 필터·DATE_TIME DD/MM/YYYY→ISO 변환). `isCN`에 `.HK` 포함(A주+HK 통합). `cn-events/summary` SSRF 확장(hkexnews.hk PDF 허용·accession=`HK`+id·시스템 프롬프트 "중국어 또는 영어"). `CnEventLayer` 라벨 동적(HKEXnews → "공시 · HKEX" / cninfo → "공시 · 巨潮资讯"). 기존 `CnEventLayer`·`CnFilingSummary` 재사용(신규 컴포넌트 없음).
- **📊 공시 R1 현황**: **US(EDGAR)·KR(DART)·JP(EDINET)·GB(RNS)·CN A주(cninfo)·CN HK(HKEXnews)** = 6개국(6소스) 공시층+원문요약 완성. VN=뉴스·이벤트층(R1 소스 없음·보류).
- ▶ **다음**: 광고(대화 먼저) 또는 국가 추가(인도·대만).

## 2026-07-08 (2nd) — STEP 657~658 — 🇻🇳 VN 공시층(뉴스·이벤트) + VN 마감(R1 소스한계 보류) ✅

- **657 VN 이벤트층 `VnEventLayer` (`04cae64`)**: `/api/vn-events`(symbol.VN→ticker) + `VnEventLayer`·isVN 배선. **소스 정찰**: TCBS `tcanalysis` v1/v2 전 경로 404(폐기)·CafeF AJAX(`Events_RelatedNews_New.aspx`) 200이나 빈 `<ul>`(세션/쿠키 필요)·HNX/SSI/VnDirect/Fireant DNS/SSL 도달불가 → **Google News RSS(hl=vi&gl=VN)** 만 안정 동작. `{ticker} kết quả kinh doanh OR cổ tức OR báo cáo tài chính OR đại hội OR phát hành OR sáp nhập` 쿼리로 재무 이벤트 필터·최근 8·10분 캐시.
- **657B VN 진짜 공시 재도전=Vietstock → NO-GO (`5459b0b`)**: Vietstock 공시 AJAX(`/data/getdocument`) 토큰 플로우 실측 → `__RequestVerificationToken`이 **JS 렌더 후 삽입**(정적 HTML len=0)·토큰 없으면 Error 페이지(240KB) 반환 → **서버사이드 fetch로 토큰 획득 불가**. → Google News 유지하되 **정직 라벨**: 헤더 "최근 주요 뉴스·이벤트"·태그 "뉴스 · Google News"(뉴스를 공시로 위장 금지). US·KR·JP·GB=공식 공시 vs VN=뉴스·이벤트로 정직 구분.
- **658 VN R1 `VnFilingSummary` → resolve 0% (`1b8e1e1`)**: `/api/vn-events/summary`(구글뉴스 링크→기사 본문 resolve→베트남어→한국어 요약·`filing_summaries`[`VN`+id]·SSRF=news.google.com 한정·한국어아님→번역 폴백·동₫ 통화교정) + `VnFilingSummary`(GbFilingSummary 미러·실패시 숨김). **결과: resolve 0%** — Google News RSS `<link>` `/rss/articles/CBMi...` URL은 서버사이드 `fetch(redirect:follow)`로 **400 반환**(JS전용 디코딩·batchexecute 필요)·RSS description/source 태그 어디에도 실제 기사 URL 없음. 로컬·Vercel 동일 0%. → 항목별 `VnFilingSummary` 전부 조용히 숨김(코드는 무해·보존).
- **🏁 VN 마감 판정**: VN엔 US/KR/JP/GB 같은 공식 공시원문 소스 없음(TCBS 폐기·CafeF 세션·Vietstock JS토큰·구글뉴스 JS디코딩 벽). 베트남 시장 규모 대비 노력 상한 도달 → **VN = 이벤트층(뉴스·이벤트) + R3 한국어 뉴스요약으로 커버, R1은 보류**(VnFilingSummary 코드는 숨김상태로 보존, 나중 진짜 소스 생기면 배선만). 사용자 승인(2026-07-08).
- **📊 공시 R1 현황**: US(EDGAR)·KR(DART)·JP(EDINET)·GB(RNS) = 4개국 공식 공시 R1. VN=뉴스 이벤트층+R3(R1 보류). 남은 완전성 = **CN 공시**.
- ▶ **다음**: **CN 공시**(cninfo·HKEXnews·⚠️东方財富 IP차단 전례로 **도달성 프로브 먼저** — `docs/NEXT_SESSION_CN_PLAN.md`) 또는 광고(대화 먼저).

## 2026-07-08 — STEP 649~654 — KR 종목 로고 + JP·GB 공시 R1 완성(공시층+원문요약) ✅

- **649 KR 종목 로고 수집 (`52805ab`)**: 한국탭 보드 로고 반쪽(글자 아바타)—원인=`lib/avatar.ts` 하드코딩 `DOMAIN_MAP` 101개뿐. → DART 기업개황(`company.json`)의 `hm_url`(홈페이지)를 소스로 `scripts/collect_kr_logo_domains.ts`(dart_corp_codes 전 상장사 순회)→`data/kr_logo_domains.json` **3,578 도메인**(상장 3,922 중 91%·hm_url 없는 344만 글자 폴백). `lib/avatar.ts` KR 조회=`DOMAIN_MAP`(손매핑 101 우선)+수집 폴백. 라이브: 효성중공업·두산·삼양식품·HD현대일렉트릭 실로고.
- **650 JP 공시 이벤트층 (`1c3dadd`)**: STEP 646 `jp_disclosures`(12,466건)를 종목 페이지에 표시 — `/api/jp-events`(symbol→secCode→최근 8·docType 한국어 라벨·화이트리스트) + `/api/jp-events/doc`(EDINET PDF 프록시·type=2·키 서버측) + `JpEventLayer`(KrEventLayer 미러·중대[臨時] 배지)·isJP 분기. 도요타·소니 라이브.
- **651 JP R1 원문 요약 (`e95017f`)**: `/api/jp-events/summary`(EDINET 원문 CSV type=5 다운로드→`fflate` unzip→일본어 본문 추출[탭·UTF-16LE·HTML제거·서술형만]→gpt-4o-mini 한국어 사실 요약→`filing_summaries` 캐시) + `JpFilingSummary`(KrFilingSummary 미러). **docType 실측 수정**: 임시보고서=**180**(訂正=190)·사업보고서 120·반기 160·공개매수 270; 이전 맵의 350/360은 실은 大量保有 노이즈였음(DB 실측). 임시보고서 reason은 법조문 코드("第19条…")라 무의미→본문 요약 필수. 라이브: 도요타 임시보고서(제122회 주총 이사 6명 선임·찬성 95.97~98.94%)·자기주식(3.65조엔·목표 99.99%)·사업보고서 정확.
- **653 GB 공시 이벤트층 = RNS via Investegate (`7a7f3f6`)**: 정찰 결과 GB엔 EDINET급 공식 무료 종합 API 없음 — FCA NSM=정식보고서만(트레이딩업데이트·M&A 누락·완전성 미달), 종합 RNS는 LSEG 상업약관. → **Investegate**(서버렌더·무료·회사별 페이지) 온디맨드+캐시+원문 링크 귀속(ToS 완화). `/api/gb-events`(symbol.L→TIDM→`/company/{TIDM}` HTML 파싱→노이즈 필터[Form 8.x·Rule 8·TR-1·PDMR]→material→최근 8) + `GbEventLayer`·isGB. **Vercel→Investegate 도달성 라이브 통과**(Shell 공시 파싱). ⚠️ Barclays 등 대형 금융=자기가 낸 Form 8.x(남의 회사 포지션)로 page1 도배→빈 층(MVP 수용).
- **654 GB R1 원문 요약 (`fef75ee`)**: `/api/gb-events/summary`(Investegate 상세→`{source}-announcement` 컨테이너 본문 추출[gnw/rns/prn…·HTML제거·푸터컷·12k]→gpt-4o-mini 한국어 사실 요약→`filing_summaries`[`GB`+id] 캐시·SSRF 방지 URL 검증) + `GbFilingSummary` + `MATERIAL` 정규식 확장(quarter·q1~4·update·outlook·buyback·agreement 등). 라이브: Shell Q2 아웃룩(생산 610-650 kboe/d·LNG 7.4-7.8 MT·화학마진 약 $240/tonne·7/30 발표) 한국어 요약 정확.
- **📊 공시 R1 현황**: **US(EDGAR)·KR(DART)·JP(EDINET)·GB(RNS)** = 4개국 공시층+원문요약 완성. 남은 완전성 = **VN·CN 공시**.
- **656 VN 공시 정찰**(코드 없음·investigation): VN도 EDINET급 공식 무료 종합 API 없음. **TCBS 공개 API(`apipubaws.tcbs.com.vn`)는 도달되나 `tcanalysis/v1/ticker/...` 경로 폐기(404·이동)** → 회사-이벤트 엔드포인트는 네트워크 캡처 필요(추측 실패 확인). 대안=CafeF/Vietstock 서버렌더 스크랩(GB Investegate 방식). VN 빌드는 다음 세션 — **자급형 실행계획 `docs/NEXT_SESSION_VN_PLAN.md` 신설**(정찰 결과·빌드 계획·미러 원본·함정 전부).
- ▶ **다음**: **VN 공시(공시층+R1) — `docs/NEXT_SESSION_VN_PLAN.md` 먼저 읽고 착수** → CN → 광고(대화 먼저).

## 2026-07-07 — STEP 645~648 — 완전성 청산①(매매처 DB)·②-JP(EDINET 공시)·헤더 홈 픽스 ✅

- **645 매매처 정적→DB 배선 (`0023fda`)**: `brokers` 테이블(MCP 생성·KR20·US17·JP13·VN13·GB12=75행)을 화면에 배선 — `/api/brokers?region=KR` + `BrokerRanking` 테이블 조회(정적 `lib/brokers.ts`는 폴백). **언어권 기준 설계**(플레이북 §4-3): 한국어=전 탭에 KR 증권사, 언어 스위처 생기면 region만 교체(일본탭에 한국 증권사=버그 아님·의도). CN만 미보유(중국어판 시 추가). 라이브 검증(KR20·US Schwab/Fidelity·JP SBI/楽天).
- **646~647 JP 공시 데이터층 = EDINET (`0ea7189`·`5d9e90a`)**: 예전 "무료 소스 없어 보류"=완전성 룰 위반 → **EDINET(금융청 무료 공식 API·키=env)**로 제대로 청산. `jp_disclosures` 테이블(MCP·마이그 039) + `lib/edinet.ts`(secCodeOf 7203.T→72030) + 크론 `/api/cron/jp-disclosures`(회사필터 없어 날짜별 긁어 미리계산) + vercel.json 크론. **라이브 검증: 12,466건·2,148개사·중대공시(臨時報告書·current_report_reason) 2,260건**, 도요타(72030)·소니(67580) 有報(≈10-K)·臨時報告書(≈8-K) 확인. dedup(doc_id) 픽스로 45일 전체 백필 완결(ON CONFLICT 방지).
- **⚠️ 배포 교훈**: `.env.local`=로컬 전용, 배포엔 안 올라감 → 프로덕션은 **Vercel 대시보드에 env 등록 + 재배포**해야 적용(env는 배포 시점에 구워짐). EDINET 등록=키 팝업(팝업허용 필수)·해외 SMS는 +82.
- **648 헤더 로고→홈 리셋 픽스**: 로고/'주식' 클릭 시 무조건 홈(언어권 기본=한국어→한국탭·종목·상품·주식)으로. 원인=`useHomeReset`이 아무 데서도 소비 안 됨 + 국가(`countryStore` persist)·탭(localStorage) 유지. → `homeResetStore.reset`=국가 KR+localStorage 탭 market 리셋, `ToolboxClient`가 n 구독→탭=종목·상품·서브=모아보기 + 콘텐츠 div 리마운트(보드 서브필터=주식 초기화).
- ▶ **다음**: JP STEP 649 = JpEventLayer + R1 원문 요약(종목페이지 UI) · 완전성 청산 GB(RNS)→VN→CN · 광고.

## 2026-07-07 — STEP 640~643 + 검색엔진 등록 — 🔍 한국어 SEO 완결 ✅

- **640 세션 문서 갱신 (`21a87d9`)**: STEP 635~639 반영·4문서 날짜 07-07.
- **641 구글 서치콘솔 (`087b948`)** + **642 네이버 서치어드바이저 (`2956ce7`)**: `layout.tsx metadata.verification`에 google + naver 인증 태그. **양대 검색엔진 소유권 인증 + sitemap.xml 제출 완료** — 구글 19,983 URL "성공"·네이버 등록. (색인은 며칠~몇 주 점진적.)
- **643 해외종목 한글명 121종 (`6c5e9d7`)**: `data/foreign_ko_names.json`(애플·테슬라·엔비디아·도요타·텐센트 등) + `resolveStockName` 오버라이드(한글 우선·영문 `en` 병기). 라이브 검증: TSLA→테슬라·AAPL→애플·META→메타(us_symbols.json 없어도)·7203.T→도요타·0700.HK→텐센트, 대조군 MMM→3M CO(영문 유지). META·BABA·ARM 사이트맵 합류. 121종 중 118종 영문명 교차검증 일치.
- **교훈**: 서치콘솔·서치어드바이저 등록 = SEO를 실제로 '켜는' 스위치(sitemap 제출로 크롤 시작). 해외종목은 영문명이라 한국 검색 누락 → 한글명 오버라이드로 서학개미 검색 커버(영문 병기로 양쪽 다).
- ▶ **다음**: 한국어 광고 설정(수익화).

## 2026-07-07 — STEP 635~639 — 🔍 한국어 SEO 1차 (종목 SSR·사이트맵·구조화데이터) ✅

- **문제(봇 실측)**: 종목 페이지가 클라렌더 → 봇엔 코드(005930)만·회사명 없음·메타 전부 루트공통·JSON-LD 0·sitemap 정적 5개 = 최대 SEO 구멍.
- **635 종목페이지 서버컴포넌트 전환 (`ff7f95d`)**: `generateMetadata`(종목명 유니크 title/desc/canonical/OG) + `lib/stockName.ts`(서버 이름해석 — KR=`kr_stock_snapshot`·US/JP/CN/VN/GB=번들 JSON) + h1에 SSR 이름 주입(봇이 회사명 봄) + JSON-LD(BreadcrumbList+Corporation). 기존 page.tsx→`StockLensClient.tsx` 이동.
- **636 사이트맵 전 종목 (`58e89ec`)**: 정적 5 → **약 21,800 URL**(KR 스냅샷 0.7·해외 번들 19,038 0.5·revalidate 1d).
- **637 홈 구조화데이터 (`0046c2c`)**: Organization+WebSite JSON-LD. SearchAction은 종목 검색결과 페이지 없어 제외(가짜 마크업 금지).
- **638 라이브 검증**(브라우저 원시 DOM): 종목/홈 JSON-LD·sitemap 19,983 URL·국가별 유니크 제목 통과. **발견**: h1이 하이드레이션 후 `/api/lens`(야후 영문)로 덮여 "SamsungElec" 깜빡 + US "- Common Stock" 잡음.
- **639 후속 픽스 (`aa525a5`)**: h1 우선순위 `initialName || data.name`(SSR 네이티브 유지 — 삼성전자·SK하이닉스·トヨタ 깜빡임 제거·title과 일치) + `cleanUsName`(US "Common Stock" 접미 제거→Apple Inc.). 재검증 통과.
- **교훈**: 클라렌더=봇에 빈 페이지 → 서버컴포넌트+generateMetadata가 SEO 핵심. `/api/lens`(야후 영문)와 SSR 이름소스가 달라 하이드레이션 후 표기 뒤집힘 → SSR 네이티브 이름 우선으로 확정.
- ▶ **다음**: 구글 서치콘솔 sitemap 제출 등 SEO 마무리 → 한국어 광고 설정.

## 2026-07-06 — STEP 622~630 — 🇻🇳 베트남 탭 + 🇬🇧 영국 탭 완성(빠짐없이) + 완전성 원칙

- **STEP 622 — 플레이북 + 언어권 로드맵 캡처**: 플레이북 §4-4(AI R3 = 자국어 네이티브 종목명 필수·야후 영어명 함정·소스 도달성 프로브)·§4-5(3중 검수법) + ROADMAP §2-1(언어권 거미줄: 한국어권 완성→영어권→언어권마다 누적).
- **STEP 623~627 — 🇻🇳 베트남 탭 완성**: ① link_hub 49 · ② 배관(토글·피드 vi·통화 ₫) · ③ 종목보드(HOSE 387·야후 `.VN`·`vn_stock_perf` 크론 — vnstock으로 유니버스+베트남어명) · ⑤ **지수바(VN-Index·VN30 = 야후 미커버 → VnDirect dchart 대체)** · **매매처(brokers VN 13)** · R3(베트남어·`vn_names`·vi·통화 동·3중 검수). ⚠️ 东方財富·HNX 야후 미커버 → 텐센트/HOSE-only 대응.
- **STEP 628~630 — 🇬🇧 영국 탭 완성**: ① link_hub 46 · ② 배관(피드 en-GB·통화 펜스`p`) · ③ 종목보드(FTSE 350·349·야후 `.L`·`gb_stock_perf` 크론 — Wikipedia FTSE 100/250 헤더파싱으로 유니버스+클린 영문명) · ⑤ **지수바(FTSE 100·250·USD/GBP)** · **매매처(brokers GB 12)** · R3(영어·`gb_names`·en-GB·통화 파운드·3중 검수). UK=영어권이라 이름테이블만 클린화·번역 불필요.
- **🔴 완전성 원칙 못박음** (VN-Index·매매처를 '후속'으로 뺀 실수 교정): `CLAUDE.md` 절대규칙 + 플레이북 §0/배너 = "새 탭/언어권 착수 전 플레이북 재독" + "MVP=축소 아님·DoD 전 항목(지수바·매매처 포함) 빠짐없이·소스 막히면 대체 찾아서라도".
- **국가탭: US·KR·JP·CN·VN·GB = 6개국 · R3 전부 네이티브.** 마이그 033~038(jp/cn/vn/gb_names·vn/gb_stock_perf).
- ▶ **다음**: 한국어권 마무리(디테일 + 한국어 SEO + 광고 → 한국어판 MVP). 또는 국가 더(인도·대만).

## 2026-07-06 — STEP 612~620 — CN R3 뉴스 + JP·CN 네이티브 종목명(진짜 자국어 검색) + 4개국 R3 3중 검수

- **STEP 612~616 — CN R3 + JP 진짜 일본어 검색 (HEAD `f1ff19a`)**: CN(.HK/.SS/.SZ) R3 뉴스 zh 로케일 + 로컬 0건 시 영어 폴백. **JP 네이티브** — 야후가 JP/CN을 영어명으로 줘 ja/zh가 실은 영어검색이던 문제 → **JPX 東証上場銘柄一覧(data_j.xls) → `jp_names` 4,014종목(일본어명)** 시드 → ja 검색이 진짜 일본 기사(도요타 아쿠아·GR SPORT·323만8400엔). 야후 영어명은 폴백. 마이그 `jp_names`(MCP).
- **STEP 618~619 — CN 네이티브 종목명 (HEAD `6a9cecd`)**: `cn_names` **7,095행 = HK 3,227(HKEX 번체목록 ListOfSecurities_c.xlsx·zh-HK 검색) + A주 3,868(텐센트 qt.gtimg.cn 간체·zh-CN 검색)**. **东方財富(push2his)이 KR·샌드박스 IP에서 차단(exit52·502) → 텐센트로 우회**(응답 GBK → `TextDecoder('gbk')`). 로케일 HK=zh-HK/A주=zh-CN 분기. `lib/cnName.ts`·`scripts/seed_cn_names.ts`·마이그 `cn_names`. HKEX xlsx는 `!ref`가 A1:R8로 잘못 박혀 실제 셀에서 범위 재계산 필요.
- **STEP 620 — 3중 검수 결함 수정 (HEAD `55c94df`)**: JP·CN·KR R3를 실제 종목 **3회씩 독립생성** 검수 → ① KR **NAVER 빈 요약**(공식 상장명이 영문 "NAVER"→검색이 '네이버' 블로그에 잠식) = `lib/krName.ts` 별칭(035420→네이버·플랫폼충돌만 등록; S-Oil·HMM·LG 등은 정상이라 미등록) ② JP/CN **통화 오표기**(소프트뱅크 "4조6700억 원"←엔) = **결정론 후처리**(ja 원→엔·zh 원→위안·숫자+단위 뒤만·KR 경로 안 탐) ③ 회사명 CJK 잔존(任天堂 등) = 한글화 프롬프트. 재검증 통과.
- **국가별 AI 현황**: **US·KR = R1·R2·R3 완전체 / JP·CN = R3 네이티브 완성**(공시 R1·R2=무료 실시간 소스 없어 보류). **4개국 R3 3중 검수 통과.**
- **교훈**: 야후 영어명이 JP·CN 네이티브 검색을 막음 → 거래소/포털 원어명(JPX·HKEX·텐센트)이 정답. 데이터센터·KR IP는 东方財富 차단 → 대체 소스 실측(텐센트=GBK). 프롬프트로 안 되는 통화·회사명 = 결정론 후처리(STEP 610 교훈 재확인).
- ▶ **다음**: 베트남 탭 / 전 국가 추가 검수 / SEO.

## 2026-07-06 — STEP 600~611 — 'AI 렌즈' 브랜딩·발견성 + KR AI 확장(R2·R3) + JP R3 뉴스

- **STEP 600~601 — 'AI 렌즈' 박스 배지 + 종목 UX (HEAD `121daae`)**: 옛 'TRAI' → **'AI 렌즈' 어두운 박스 배지**(헤더 T로고 재사용·"기법별 전망" 제거·언어별 렌즈 ko/en/ja/zh). 종목 페이지 뒤로가기 = `router.back()`(무조건 홈 X → 직전 화면). **시트 URL 동기화**(`lib/useSheetSync.ts`): 홈=보드라 그냥 back하면 모바일 시트가 소실되던 문제 → 시트 열 때 `?s=심볼` history push → 종목 페이지 뒤로 = 그 시트 복원. 모바일 시트 수익률 카드 현재가 중복 제거.
- **STEP 602~603 — AI 렌즈 발견성 표식**: 리스트만 봐선 AI 렌즈 있는지 몰랐던 문제 → **현재가↔1일전 사이**에 표식 노출. PC=전용 컬럼(헤더 로고+"AI 렌즈"·행마다 민트 렌즈 칩), 모바일=상단 정렬바 라벨(아이콘 열 위 중앙 정렬)+각 카드 로고 아이콘. 신호 전용(직접 이동 X)·행 탭→시트→'AI 렌즈 보기'.
- **R4 영구 보류 문서화** (`AI_BRIEFING_SPEC.md`): R4(Q&A)=사실상 어드바이저 → 정보 허브 포지셔닝 밖 + 무료 모델과 상충 → **안 만듦·미래 자산**. R1~R3까지가 AI 층 완결 범위.
- **STEP 604~606 — 🎉 KR AI 확장 (HEAD `cf22aba`)**: US 코드 그대로·데이터만 교체. **R2 브리핑에 DART 공시** 연결(KR 6자리→`fetchDartMaterial`), **R3 뉴스 = 한글 종목명(`dart_corp_codes.corp_name`)+ko 로케일**, **R3 짜깁기 금지** 가드레일(서로 다른 기사 인과로 엮지 마). Cowork MCP 검수: 삼성·SK하이닉스·NAVER R2·R3 무예측·무밸류·3회 일관. **"US 완성형→데이터 교체" KR 실증.**
- **STEP 607~611 — 🎉 JP R3 뉴스 (HEAD `b2079b7`)**: JP(.T)=야후 일본명(`fetchYahooName`)+ja 로케일. **문제 2건 결정론 후처리로 해결**: ① 야후 영어 상호→영어 기사→LLM 영어 출력 → **요약 한국어 아니면 번역 폴백**(gpt-4o-mini 재호출). ② Google RSS가 옛 기사를 최근 pubDate로 재순환(프롬프트·날짜필터 무력) → **작년 이전 연도(2023 등) 언급 문장 정규식 삭제**. +pubDate 60일 최근성 필터(전 국가). MCP 검수: 도요타 한국어·소프트뱅크 2023 제거 통과.
- **국가별 AI 현황**: **US = R1·R2·R3 / KR = R1·R2·R3 / JP = R3**(공시 R1·R2=EDINET 대기·무료 API 키 필요) / **CN = 미착수.**
- **교훈**: JP 뉴스는 야후 영어명·구글 옛기사 재순환 탓에 KR보다 훨씬 손이 감. **프롬프트 강화 2회 실패 → 결정론 후처리로 확정**(LLM 설득보다 코드로 보장). 후처리(번역·최근성)는 KR·US 뉴스에도 적용돼 전 국가 품질 개선.
- ▶ **다음**: CN R3 / SEO — **JP 공시(R1·R2)=보류 확정**(EDINET=무료지만 정기보고서 지연+XBRL 2~4주·TDnet=실시간이나 ¥70k/월 유료 → 무료 모델상 R3 뉴스로 대체, 상세=`AI_BRIEFING_SPEC`).

## 2026-07-06 — STEP 595~598 — KR 공시 이벤트 층 + R1-KR(DART 원문) + US 3라운드 검증·R3 밸류 누수 픽스

- **STEP 595(+595B) — KR 공시 이벤트 층 (HEAD `c55016b`)**: `lib/dartEvents.ts`(corp_code→DART `list.json` 중대공시 키워드 필터)+`/api/kr-events`+`KrEventLayer`(`isKR` 감지→DART층, US는 EDGAR). `dart_corp_codes` 빈 것 발견 → `scripts/seed_dart_corp_codes.ts`(corpCode.xml·상장사 **3,922** 시드·`fflate`). SK하이닉스 공시 반환 검증.
- **STEP 596 — R1-KR DART 원문 요약 (HEAD `a246b81`)**: `lib/dartSummary.ts`(document.xml zip→**EUC-KR 디코딩**→텍스트)+`/api/kr-events/summary`+`KrFilingSummary`. `filing_summaries` 캐시(accession=rcept_no) US와 공유. SK하이닉스 나스닥 상장공시 정확 요약(한글 안 깨짐)·정기보고서 키워드 추가. = **"US 완성형 → 데이터 교체" 실증.**
- **STEP 597 — US 3라운드 중복검수**: 11종목×R1/R2/R3. **R1 실적(2.02) EX-99.1 첨부 경로 실증**(AAPL·MSFT 실적 숫자 정확 추출 — 유일 미검증 경로였음).
- **STEP 598 — R3 밸류 누수 픽스 (HEAD `24b3438`)**: **Cowork이 MCP로 캐시 실물 직접 검수** → R3 밸류 의견 누수 발견(BAC "과대평가"·INTC "목표주가 200달러"·JPM "공정가치") — "매도" regex는 오탐이나 그 카드가 가리킨 R3는 진짜 누수. R3 프롬프트 강화(구체 사건만·밸류판단/목표주가/투자의견 금지·사건 없으면 숨김)+R2 "예정" 방지. 캐시 비워 재생성 → 3라운드 누수 0. **MCP 재검수: BAC/INTC/JPM 숨김·나머지 구체 사건만.**
- **🎉 US(R1+R2+R3) 확정** — 3라운드 검증 + Cowork MCP 독립 재검수 통과. (R2 미세 "예정" 표현은 GPT 한계·가드레일 무관·경미.) **KR = 공시층+R1 완료.**
- **🔒 검증 규칙 확립**: STEP 명령서는 Claude Code가 **동일 검증을 3회 반복**해 일관 결과 확인 후 보고(플레이키 방지). Cowork은 **MCP로 캐시 실물 독립 재검수**.
- ▶ **다음**: 다른 국가탭 확장(R2-KR·R3-KR·JP/CN)은 **사용자 승인 후에만**.

## 2026-07-06 — STEP 591~593 — 🎉 AI 브리핑 레이어 US 완성형 빌드(R1+R2+R3) 라이브

- **STEP 591 (R1·HEAD `e0d033d`)**: 8-K 공시 원문 AI 요약 — `lib/eightKSummary.ts`(본문+EX-99.x 추출·HTML strip) + `app/api/events/summary`(지연 생성·`filing_summaries` 전역 캐시·SSRF 가드·gpt-4o-mini 사실만) + 이벤트 카드 지연 "AI 요약". 라이브 검증: NVDA 5.02(임원 변동) 원문 정확 요약·예측 0.
- **STEP 592 (R2·HEAD `3b51efe`)**: 종목 브리핑 — `app/api/brief`(서버 `computeSymbolLenses` 재계산+공시 → 핵심 긴장+지켜볼 것·`stock_briefings` 종목+날짜 캐시) + 최상단 `StockBrief` 카드. 검증: NVDA "중기 강세 vs 장기 비싼 밸류 엇갈림 + 임원변동·실적 지켜보기"·예측 0.
- **STEP 593 (R3·HEAD `28cc508`)**: 뉴스 요약 — `lib/stockNews.ts`(Google News RSS) + `app/api/news-brief`(사실 요약+중립 토픽태그·JSON 모드·`news_briefs` 캐시·조건부) + 이벤트 아래 `StockNewsBrief`. 검증: NVDA 실적·주가·투자자관심 토픽(방향 태그 아님). R3 v1 한계=티커 검색 노이즈·분석가 동향 서술(선 안 넘음).
- **마이그레이션(MCP·Trillion `ccbwxcszdoyjxvckedfp`)**: 030 filing_summaries · 031 stock_briefings · 032 news_briefs (전역 캐시·public read RLS).
- **🎉 US 완성형(R1+R2+R3) 완결** — 전부 무료·공개·지연생성+캐시·LLM 사실만·예측 0. ▶ 다음 = R1-KR(DART)부터 국가탭 데이터 교체 → 전 국가탭 → SEO.

## 2026-07-06 — STEP 584~589 마감 + 🔴 AI 브리핑 레이어(R1~R3) 전략·설계 (무료·공개·SEO 모델)

- **STEP 584~589 (코드·문서·HEAD `3f4b647`)**: 584 문서매듭 · **585 페이지명 "AI LENS"** + '이 화면 읽는 법'(progressive disclosure) + 이벤트 severity 재구성(중대 노출·루틴 접힘) · **586 한국어 보이스 v1**(원어민 전문가 톤 재집필: 표본약함→약한 신호·건전성→재무 건전성·근거주의→자료 갱신 · `VOICE_GUIDE.md` 신설) · **587 전문가 톤 1차**(접힘 카드=판정+수치 선언형 · 디스클레이머 통합=상단 1줄+법적문구 전역푸터) · **588 판정 보이스 v2**(구어 제거: 강하게 오르는 흐름→강한 상승 추세·알짜로 잘 버는 우량→높은 수익성) · **589 시간축 스트립 초보 정리**(장기 칸 합의도 단어-우선[엇갈림/대체로 우호적]·암호 꼬리표 제거).
- **🔴 AI 브리핑 레이어 결정 (전략/설계 · 마스터 `docs/AI_BRIEFING_SPEC.md` 신설)**: LLM = 비정형 텍스트를 사실로 읽는 것만(점수·예측·판정 X). **R1** 공시 원문 요약 · **R2** 종목 브리핑(핵심 긴장+지켜볼 것) · **R3** 뉴스 요약·토픽태그 · R4(Q&A) 안 함. 가드레일=`AI_LENS_SPEC §1` 계승. 배관 재활용(`ai-analysis` OpenAI gpt-4o-mini+`ai_analysis` 캐시 · `eightK` 원문URL).
- **🔑 접근/수익 모델 대전환 (BUSINESS_STRATEGY 2026-07-06)**: AI 브리핑 = 무료·공개(**구독 폐기**) = SEO·글로벌 트래픽 엔진. 로그인 게이트 = 개인화(즐겨찾기·알림)에만·콘텐츠 아님(숨기면 SEO 죽음). 수익 = 광고·디렉토리·브로커 제휴(트래픽 뒤·저거부감부터·배너 맨끝).
- **리서치(3라운드×2)**: 뉴스 감성 팩터 기각(대형주 예측력 약·이미 반영·LM 상업 라이선스 유료·가짜정밀도) → 뉴스=사실 브리핑만. 추정치 변경 렌즈 = 신선 후보(Yahoo `eps_trend`/`eps_revisions` 라이브 무료 실측·삼성/도요타 커버)이나 백테스트 이력 유료(I/B/E/S) → "참고용"+스냅샷 검증예약 → **보류**(AI 완성 우선).
- **v2 UI 시안 확정**: 가격 앵커 → R2 브리핑(긴장+지켜볼 것·생성시각) → 시간축 → 렌즈 한 줄 그림 → 공시(R1+렌즈 인과선·경중 분리) → 뉴스(토픽) · 틴트=AI/흰=결정론 · 3개의 시계 타임스탬프.
- **▶ 다음 = AI R1-US 빌드 → R1-KR(DART)·기타 → R2 → R3 → 전 국가탭 완성 → 그 다음 SEO** (US 완성형→데이터 교체 확장·수익화/문서화 그 뒤).

## 2026-07-05 — STEP 579~583 — 시간축(단기·중기·장기) 재구성 + 실시간 이벤트(공시) 사실 레이어 (US 완성형)

- **STEP 579 (백엔드·HEAD f2c70d1)**: `LensRead.horizon`(모멘텀=중기·기술=단기·밸류/저변동/퀄리티/자산성장=장기) + `/api/lens` 퍼센타일 주입 — DB 함수 `lens_percentiles`(029·방향별: 모멘텀·퀄리티 높을수록 / 저변동·밸류·자산성장 낮을수록 우호)로 lens_scores(US 1000) 대비 랭크. 비US는 null(방향만).
- **STEP 580 (UI·HEAD be7c96f)**: 종목 페이지 = **시간축 스트립**(단기 RSI존·중기 모멘텀 퍼센타일·장기 팩터 pill+"N중 M 우호") + **기법별 best-viz**(팩터=퍼센타일 게이지·기술=RSI존·F=체크리스트) + **단/중/장 그룹핑**. 퍼센타일 없으면(비US) 방향 폴백. `HorizonStrip`·`PctGauge`·`RsiZone`.
- **STEP 581 (이벤트 백엔드·HEAD 4b0aa97)**: `lib/eightK.ts`(8-K item→렌즈 매핑·A 근거흔듦/B 새맥락/general·`flagLens`) + `/api/events`(EDGAR `submissions.json` items **결정론 분류**·NLP 없이·US) + `docs/EVENT_LAYER_SPEC.md`(3회 검수). NVDA 5.02·2.02 실데이터 검증.
- **STEP 582 (이벤트 UI·HEAD bc2674a)**: "최근 중대 공시·이벤트" 리스트 + 렌즈 카드 **⚠️(A·근거 흔듦)/📌(B·새 사실)** 플래그. 사실만·"좋다/나쁘다 판단 안 함". 오너리스크(5.02)·실적(2.02)이 관련 렌즈에 연결 = 사용자 문제의식("사건 반영 안 됨") 해소.
- **STEP 583 (정직화·HEAD c39117b)**: 눈검수 4수정 — 5.02="임원·이사진 변동"(과장 제거·대부분 루틴·`flagLens=false` 리스트만) · F-Score 카드에도 플래그 배선 · 9.01 노이즈 제거(중대 item만) · A/B 박스 분리(`FlagChip`·`FlagBox`). **원칙: 서브내용 무관 확실 이벤트만 렌즈 플래그.**
- **전략 결정 (BUSINESS_STRATEGY 2026-07-05)**: **"3개의 시계"** — 팩터 렌즈=하루1회(Stockopedia 표준)·이벤트(공시)=즉시·뉴스/WIIM=연속·Pro. **펀더 신선도=애널 추정치 변경**(Zacks·매일)=진짜 staleness 해법(뉴스 아님). free/pro=StockTitan 딜레이 티어. 공시=DART(한국)+EDGAR(미국) 무료.
- **유료 벤치마크**: Stockopedia(팩터 퍼센타일 0~100·매일)·StockTitan(8-K **AI 원문 요약**·속도 티어)·Benzinga WIIM(촉매+거래량)·TipRanks(반면교사=한 점수로 뭉갬)·Zacks(추정치)·AskEdgar(무료20/Pro).
- **▶ 다음**: ② **AI 원문 실독 요약**(8-K 본문/EX-99.1 읽어 정확한 한 줄·무료N/Pro — StockTitan식) → 거래량 맥락(WIIM-lite) → 추정치 변경 렌즈(US) → KR 공시(DART·별도 테이블). 세부 문구 미세조정.

## 2026-07-04 — STEP 570~577 — 스크리닝 인프라 + F-Score 실물·표시 헌장 + TRAI 정체성 결정 + 6카드 헌장

- **STEP 570~573 (스크리닝 토대)**: `lib/lensCompute`(computeSymbolLenses) 공용 엔진 추출 → 카드(/api/lens)와 배치가 **같은 계산 공유** + `LensRead.value/state`(언어중립) 노출(570). `lens_scores` 테이블(028 마이그레이션·MCP 적용) + 시드 30종목(571). `lib/lensPrecompute`(시총 상위 N 배치·100행마다 flush) → 로컬 **1000종목** 채움(572). `/api/cron/lens-scores` **매일 20:00 UTC 크론**(573). = 공용엔진→DB 1000행→무인 갱신. **단 스크리너 UI는 안 만듦** — 사용자: "종목 페이지(한 종목 다각 분석)가 본체, 스크리너는 '픽'에 가까워 우리 중립과 충돌". 미리계산 인프라는 대기(나중 보드 힌트용).
- **STEP 574 (F-Score 카드 실물 + 표시 헌장)**: F-Score 카드 v6 실물화 — 성적표→**"부실 위험 체크"**, 이름 크게·**"이게 뭐예요?" 박스**·**9칸 트래커**·**9항목 3그룹**(수익성·재무 안정성·효율성, 전문용어+(쉬운 풀이))·상단 **신뢰도 등급 범례**. `lib/fscore.ts`(9항목 group+plain)·`lensCopy`·`page.tsx`. **`docs/LENS_DISPLAY_CHARTER.md` 신설** = 모든 렌즈 카드 표시 규칙(대원칙·상단공지·필수칸·역할분리·밀도·경쟁대조·F-Score 기준템플릿). 유료 레퍼런스 대조(GuruFocus·Stockopedia): 점수+9체크리스트+구간(7↑/4~6/0~3)이 **업계 표준과 일치**, 우리는 쉬운말·정직한 자체검증(t≈0.7)으로 우위.
- **STEP 575 (픽스)**: F-Score "이익의 질" 근거 `현금 > 순익` → `현금 · 순익`(미달 시 부등호가 사실과 반대로 보이던 문제).
- **STEP 576 (TRAI 스텁 제거 + 제품 정체성 결정)**: "TRAI 종합 분석"(5렌즈 요약) 스텁 완전 제거(page.tsx·ai-view 라우트) — **AI가 결론을 대신 내리면 사용자 판단권 침해**(우리가 거부한 '권위가 답 내려주기'·중복·낡음). 리서치(Danelfin·TipRanks·Robinhood Cortex·Seeking Alpha): 뉴스+팩터 결합은 업계 표준이나 우리 위반은 마지막 Buy/Sell뿐. → **청사진 ④ TRAI 재정의**: 뉴스 = **투명한 사실 렌즈**(FinBERT 무료 오픈소스 + 헤드라인 사실 + 8-K 이벤트 플래그)·블랙박스/권유 아님·**결론은 영원히 사용자**·맨 마지막 층. `BUSINESS_STRATEGY` 결정 로그 + 헌장 §0 원칙5. **제품 정체성 = "AI가 답 주는 앱"이 아니라 "정직한 재료로 사용자가 판단하는 앱".**
- **STEP 577 (6카드 헌장 적용)**: 공용 렌즈 카드 템플릿 1곳 수정 → **6개(모멘텀·저변동·기술·밸류·퀄리티·자산성장) 동시** 헌장 적용(이름 크게·"이게 뭐예요?" 박스·접힘=메뉴+한줄설명·펼침=박스). F-Score 접힘 설명 일관. **7장 골격 통일.** 근거수치는 그대로 노출(사용자 "숫자 안 줄인다" 원칙).

## 2026-07-04 — STEP 564~568 — 카드 패밀리룩 재편 · "이 기법 방향" 층 · 제품 청사진(4층)

- **STEP 564~567 (카드 패밀리룩 재편)**: `app/stock/[symbol]/page.tsx` — 사용자 피드백 반복 수용. **564 시각 계층**(카드 `shadow-sm`·`rounded-2xl`·원형 SVG 화살표[펼침 `rotate-180`]·서랍 배경 틴트 `bg-unjong-background/50`). **565 정보 순서**(기법 설명을 이름 밑 서브타이틀로 이동·서랍 = 판정 문장+headline → 스펙트럼 → 근거 수치 → 단기/장기 → 자세히 순). **566 메뉴화**(접힘 카드 = 깔끔한 "기법 메뉴"[이름+등급 배지+설명만]·판정 문장은 펼침 안으로 — 사용자: "판정 죽 늘어놔도 일반인 눈엔 엇갈림 안 잡힌다"에 설득, 내 '엇갈림 스캔' 논리 약함 인정). **567 3구간 스펙트럼**(`Spectrum{labels,active,tone}` 공통 컴포넌트 — 활성 구간만 색조[민트=우호·앰버=주의·중립]·비활성 회색·7기법+F-Score 패밀리룩·`SPECTRUM_LABELS` ko/en). tsc EXIT=0.
- **STEP 568 ("이 기법 방향" 층)**: `lib/lensCopy.ts` `LENS_OUTLOOK`(7기법×상태별 ko/en) + `lib/lenses.ts` `LensRead.outlook`·`outlookOf()`(6렌즈 부착) + 페이지 스펙트럼 밑 **"이 기법 방향"** 줄(F-Score 동일). 카드가 측정에서 멈추지 않고 **그 기법 '방법대로'의 방향**까지 — 시간축 단기/장기·유리/불리/중립·정직 꼬리표. **예측 아님**(역사적 base-rate·보장 아님). 모든 기법이 수익 방향은 아님 — 저변동=위험·F-Score=건전성·기술=상태 축 유지(억지 "오른다" 금지). API 검증(momentum→"단기~중기 유리한 편…"·valuation→"장기 불리한 편…") + 눈검수(Technical="단기 상태: 추세 위 — 참고용, 모멘텀 겹침"). tsc EXIT=0.
- **STEP 568 (제품 청사진 로그)**: `docs/BUSINESS_STRATEGY.md` 결정 로그 — 4층 청사진 = **①원자**(7 검증 팩터 ✅) → **②방향**(기법별 outlook ✅) → **③조합전략**(가치+모멘텀·방어형 퀄리티·QARP=버핏류·피오트로스키 가치·마법공식 보류 — "~류 근사" 정직 꼬리표) → **④TRAI**(사실+뉴스 종합 = 의견·맨 마지막). 정직 원칙: 렌즈=현재 사실·앞은 TRAI(의견)·안 되는 기법 억지 X·조합은 근사 표기. 데이터 정책: 유료 데이터 나오면 럭키·안 나오면 뺌.

## 2026-07-03 — STEP 557~562 — 발생액 탈락 · 7렌즈 3중 교차검증 · UI 편의성

- **STEP 557~558 (발생액 탈락)**: `scripts/backtest_accruals_rigor.ts` — (순이익−영업현금)/총자산 저−고 롱숏 **연 −7.62%(방향 역전)**·t−1.36·FF3 알파 t−1.20 음수 → Sloan 발생액 이례현상 우리 표본 미재현(1996 후 크게 약화). 렌즈 미채용. **강력 후보 소진** 명시(로드맵). 플레이북 #26.
- **STEP 559~561 (7렌즈 3중 교차검증)**: `backtest_crossval_price.ts`(가격3)·`backtest_crossval_fund.ts`(재무3) — 롱숏 월별 시계열을 초·중·후반 3구간(fold)으로 나눠 방향 일관성. **모멘텀 [+,+,+] t3.6 · 퀄리티 [+,+,+] t3.2 = 시기 무관 단단** / 자산성장 [+,+,+] 방향일관·유의미달 / 밸류 [+,−,+] 시기의존(2016~20 가치 부진기) / 저변동 raw 취약(방어 별도) / 기술 모멘텀 중복(FF3 모멘텀 미통제). **등급 변경 없음**(정직 재확인) → 6렌즈 note에 반영. 플레이북 #27·STRENGTH_MAP 표.
- **STEP 562 (UI 편의성 Phase 2)**: `app/stock/[symbol]/page.tsx` — **한 페이지 유지**(탭 X, 엇갈림 보존). 렌즈·F-Score 카드 **압축(판정 문장+등급+근거 수치 접힘)/클릭 시 상세 펼침**(`openLens` state). **"기법 성향" 종합 블록 제거**(우리 결론 권유 → 중립화)·`styleRead`·`gradeColor` 삭제. 모바일 390px 눈검수 통과. tsc EXIT=0.

## 2026-07-03 — STEP 551~555 — 주주환원 탈락 · 자산성장 채용 · 카드 직관화

- **STEP 551~552 (주주환원 탈락)**: `scripts/backtest_shyield_rigor.ts` — (배당+자사주[−발행])/시총 롱숏 총 t0.85·순 t1.09 · **FF3 알파 소멸**(t0.56·0.84)·βHML0.52~0.57 → 가치(HML)의 재포장, 독립 프리미엄 아님. 커버리지 충분(배당45%·자사주64%)이라 데이터 탓 아님 → **렌즈 미채용**. 로드맵·강도지도·플레이북(#24) 정직 기록. **탈락도 완결.**
- **STEP 553~554 (자산성장 채용)**: `scripts/backtest_assetgrowth_rigor.ts` — 총자산 전년比 저−고(CMA) 롱숏 연~+8%·**βHML0.17(밸류와 독립 축)** 이나 t1.6 유의미달. 주주환원과 달리 **독립된 새 축=효용 有** → **7번째 렌즈로 채용, 등급 "표본 약함"**. `assetGrowthLens`·ko/en 카피·route 배선. **원칙 확립: 채용=효용(독립성+해석) / 등급=유의성**(플레이북 #25).
- **STEP 555 (카드 직관화)**: 제품 핵심 가치 = 숫자 몰라도 "각 기법이 이 종목을 어떻게 읽는지" 전달. `LENS_READINGS`(7기법×상태별 `{phrase,plain}`·ko/en) 추가 → `LensRead.verdict` + `readOf()`, 6렌즈+F-Score 카드에 **판정 문장+쉬운 해석** 노출. **정확한 근거 수치는 그대로 병기**(축소 X — 숫자로 판단하는 사용자 배려). **"각 기법 시각·예측 아님"은 상단 1회** 공통 전제. tsc `--noEmit` EXIT=0.

## 2026-07-03 — STEP 546~549 — 다국어 카피 구조 + 6번째 기법(퀄리티)

- **STEP 546~547 (다국어 카피)**: 렌즈 겉면·개념 설명을 **언어별 맵 `lib/lensCopy.ts`**(`LENS_COPY: Record<Locale,...>`, ko/en)로 분리. 기법 *이름* = 영문 정식명칭(만국 공통 앵커), 그 아래 "이게 뭔데?"·"알아보기"는 **각 언어답게(직역 아님)** 큐레이션. `lenses.ts`·API가 `pickLocale(?lang)`로 읽고 캐시 키에 locale 포함. 원칙·원본 = `docs/LENS_COPY.md`. (**TRAI가 본체** → 카피 품질 = 제품의 얼굴.)
- **STEP 548 (퀄리티 검증)**: `scripts/backtest_quality_rigor.ts` — GP/A(Novy-Marx 총수익성=매출총이익/총자산) vs ROE 비교. GP/A 롱숏 **t=2.92·CAPM 알파 t=2.49·FF3 알파 t=2.49**(시장·규모·가치 넘는 독립 프리미엄)·회전율 29%(저비용). ROE는 **t=1.00 유의미달**(βSMB=−0.73 대형주 편중)이라 제외. 은행 자동 제외(매출총이익 null).
- **STEP 549 (퀄리티 추가)**: `qualityLens(grossProfit, totalAssets, locale)` 6번째 기법으로 라이브 — 등급 "검증", GP/A% 라벨(높음>40·낮음<15). `app/api/lens/route.ts`가 최신연도 매출총이익·총자산 계산 후 push(없으면 GP/A "—", 은행 미적용). ko/en 카피 완비. 인프라 재사용으로 **STEP 2개** 만에 붙음. 검증: NVDA GP/A 74.21% "높음", BRK-A(은행) "—".
- **문서**: `LENS_ROADMAP`(현재 6·퀄리티 후보→운영 이동·마법공식 보류 사유) · `LENS_STRENGTH_MAP`(퀄리티 행) · `LENS_DEV_PLAYBOOK`(#23 인프라 재사용) · `BUSINESS_STRATEGY`(마법공식 보류 결정).

## 2026-07-03 — STEP 539~544 — 렌즈 페이지 표현 개편 + 제품 포지셔닝 확정

- **STEP 539~541 (표현 개편)**: 렌즈 카드 = 영문 정식명칭(앵커)+한글 요약 · "{기법} 알아보기"(개념·유래) · "자세히"(검증·한계) 접기 · 단일 열·홈 `max-w` 통일 · **TRAI**(민트 T 모노그램) 리브랜딩(🤖·🧭 이모지 제거·보드 진입버튼 4개 통일).
- **STEP 542 (① 정직화 + 문서화)**: 밸류 라벨 `저평가/고평가`(verdict) → `낮음/보통/높음`(PER 수준 사실·검증 밖 단정 제거). `docs/LENS_ROADMAP.md` 신설(3단계 순서 + 현재 5 로스터 + 추가 후보). `docs/BUSINESS_STRATEGY.md` 결정 로그에 **제품 정의(포지셔닝)** + "종목 종합 데이터 허브 안 만듦(commodity)".
- **STEP 543 (② 등급 배지)**: 각 렌즈 `grade`·`gradeTier` + 카드 겉면 **신뢰도 배지**(민트=검증·앰버=조건부/해석·회색=참고). "5개 동등해 보임" 해소 = 포지셔닝 키스톤(읽기 + 신뢰도).
- **STEP 544 (② 엇갈림 표시)**: `styleRead` — 모멘텀×밸류 성향 요약(성장/가치/정렬/중립) + "일치=신뢰·엇갈림=정보". 5개를 억지 매수/매도로 뭉치지 않음(축 다름).
- **포지셔닝 확정**: "예측 아님 — 검증된 프로 렌즈들이 이 종목을 각각 어떻게 읽는지 + 얼마나 믿을 만한지, 선택은 사용자. 엇갈림=정보. 개인이 못 하는 걸 대신." 점수=과거 외삽(나침반)·앞은 TRAI가 "근거 있는 조건부 예상"(유추도 데이터 grounding·예측 아님). ▶ 다음: 배포+모바일 · ③ 퀄리티(QMJ).

## 2026-07-02 — STEP 525~537 — 🏁 신뢰도 업그레이드 사이클 (5렌즈 t·샤프·FF알파·거래비용 재검)

- **신뢰도 엔진**: `lib/backtest_stats.ts`(mean/stdev/tStat/Newey-West/Sharpe/tertileLongShort/**ols 다중회귀**) + Ken French 무료 팩터(`data/ff`·gitignore). 월별 롱숏 시계열 → 유의성·위험조정·팩터알파.
- **STEP 525~527 (모멘텀)**: `backtest_momentum`(v2 월별 롱숏)+`backtest_momentum_alpha`(회전율·비용·CAPM/FF3/FF4). 롱숏 t≈2.5·샤프0.71·비용30bps/FF3 후에도 유의 → **검증·유의**(단 수익수준 과대·FF4 알파 미소멸=편향).
- **STEP 528~529 (저변동)**: `backtest_lowvol_rigor`. 저 leg 위험=고 leg의 18%·CAPM/FF3 알파 유의(βMkt음)·저회전 → **위험대비 강**(raw 수익차 t≈1.6 약함·수익 우위 단정X).
- **STEP 530~531 (밸류)**: `backtest_value_rigor`(연형성/월수익·E/P·B/M·은행 포함). βHML0.71 재현(=학계 HML)이나 우리 표본 월별 t<2 → **정설이나 표본 약함**(최근 가치 부진·정직 하향).
- **STEP 532~535 (F-Score)**: `backtest_fscore_rigor`. 고정임계(≤3/≥7)→소표본 3코호트→3분위→N600·12코호트. t2.24(5코호트)가 t0.70(12코호트)으로 붕괴 → **수익 신호 아님**(FF3α0.28·건전성 해석만). 데이터-우선이 가짜 유의 차단.
- **STEP 536~537 (기술)**: `backtest_technical_rigor`. RSI 침체매수 연−8.7%·CAPMα t−2.01(유의 손실)·회전율66% / 200일선 t1.6·FF3 흡수 → **참고용·비독립**.
- **플레이북 #18~22**: 유의≠수익수준(생존편향 과대·FF알파 미소멸=편향) / 렌즈마다 성공지표 다름 / 소표본 유의는 노이즈(데이터-우선) / 회전율도 신뢰지표 / RSI 역추세는 유의 손실. **공통 한계**: 무료 데이터 논문급 *방법론* 도달, 생존편향(CRSP급 데이터)은 벽·항상 명시.

## 2026-07-02 — STEP 510~523 — 🏁 무료 AI 렌즈층 5종 전부 검증·판정 완결 (저변동·데이터감사·F재검증·유동성필터·밸류·기술)

- **STEP 510·517·518 (저변동성)**: `scripts/backtest_lowvol.ts`. 넓은 유니버스는 고변동군 왜곡 → **$5+ 유동성 필터** 후 저−고 **+7.4%/년·위험 25%** 확인(이례현상 부분 확인). ✅검증
- **STEP 512~516 (데이터 감사 + F-Score 진짜 검증)**: `scripts/audit_data.ts` 커버리지 진단 → EDGAR 매출/매출원가 태그 확장(단·복수·업종별) → 금융/비금융 분리. 넓은표본 F-Score spread **−36%**(대·중형 수익예측 무의미) → 카드 "재무 건전성 해석" 최종 확정. ✅검증(건전성)
- **STEP 517~518 (모멘텀 유동성 필터)**: 넓은 250 raw −8.2% → **$5+ 필터 +2.4%p/년**. 페니스탁이 저모멘텀 반등 노이즈. "유니버스가 결과 지배" 메타교훈 확립. ✅검증
- **STEP 519 (표시 정리)**: `/stock/[symbol]` 렌즈 카드 = 검증결과·조건·미검증 라벨 정직 반영.
- **STEP 520~521 (밸류)**: `lib/edgar.ts` 자기자본(StockholdersEquity) 추가 + `scripts/backtest_value.ts`(E/P·B/M·**은행 포함**·13코호트·$5+). E/P 싼−비쌈 **+10.2%p/년(13중 11코호트)**, B/M +5.5% 조건부. 밸류 렌즈 검증 문구. HEAD `a56a827`. ✅검증
- **STEP 522~523 (기술)**: `lib/technical.ts`(RSI·MA 공유엔진 — 렌즈=백테스트 일치) + `scripts/backtest_technical.ts`(상태별 이후수익 패널 19,011 stock-month). **RSI 평균회귀 기각**(침체−과열 −0.9%/3M, 과열이 오히려 우위=모멘텀 압도) · 200일선 위−아래 +0.76%/3M(연~3%·약함). 기술=참고용. HEAD `64a5d9a`. ⚪참고용
- **살아있는 문서**: `docs/LENS_DEV_PLAYBOOK.md`(문제로그 #1~17·§0 관통원칙 7) + `docs/LENS_STRENGTH_MAP.md`(기법별 적합영역·근거표기). **원칙**: 예측 아닌 정직한 방향성. 수익화·유료 AI보기(STEP 511 보류)·UX는 전 기법 검증 후로 미룸(사용자 지침).

## 2026-07-02 — STEP 508~509 — 모멘텀 1사이클 완주 (12-1 백테스트+렌즈 canonical 정리)

- **STEP 508**: `lib/momentum.ts`(12-1 함수) + `scripts/backtest_momentum.ts`. 148회 리밸런스·n=3,670. 프리미엄 **연율 +4.1%** 확인
- **STEP 509**: `lib/lenses.ts` 모멘텀 렌즈 → canonical 12-1 + detail(12-1%) + note(백테스트 검증 문구). HEAD `59cb0c1`

## 2026-07-02 — STEP 500~507 — F-Score 1사이클 완주 (정찰→엔진→렌즈→백테스트→정직반영)

- **STEP 500**: `scripts/probe_fscore.mjs` — 야후 구 재무모듈(2024-11 사망) 확인 → `fundamentalsTimeSeries` 전환 필요
- **STEP 501**: `scripts/probe_fts.mjs` — `fundamentalsTimeSeries` 필드 실측. 비금융주 전 필드 OK, 금융주 currentAssets/grossProfit MISSING
- **STEP 502**: `lib/fscore.ts`(9기준 순수계산) + `app/api/lens/route.ts`(fts fetch+fscore) + 렌즈 페이지 F-Score 카드. 검증: NVDA 4/9·JNJ 4/9·JPM 미지원·삼성 6/9
- **STEP 503**: `scripts/backtest_fscore.ts` — 야후 재무 5년 한계로 2023 단일 코호트만 가능. spread +4.0%p (2023 코호트, n=37/46/7)
- **STEP 504**: F-Score 카드 "검증 전 — 참고용" 문구 (데이터 한계 정직 반영)
- **STEP 505**: `scripts/probe_edgar.mjs` — SEC EDGAR companyfacts 정찰. 2009~·무료·US 전종목. 주요 필드 10년+ 확인
- **STEP 506**: `lib/edgar.ts`(어댑터) + `scripts/backtest_edgar.ts`(10코호트 백테스트). 결과: 대형주에서 점수↔수익 관계 불분명(중>고, 저 n=9)
- **STEP 507**: F-Score 카드 최종 문구 "대형주에선 점수와 수익률의 뚜렷한 관계 없었어요 — 소형·가치주에서 더 유효(정설)". HEAD `cc3dc99`

## 2026-07-02 — STEP 494~499 — JP/CN 이름 우선 표시·로고 자동수집·KR 모바일 글자·렌즈 엔진+페이지+AI보기 진입

- **STEP 494**: JP/CN 보드 이름 우선 표시 (이름 굵게 → 코드 작게 회색)
- **STEP 495**: `scripts/gen_logo_domains.mjs` Yahoo assetProfile 자동 수집 → `data/cn_logo_domains.json`(5,205) + `data/jp_logo_domains.json`(2,762). `lib/avatar.ts` AUTO_DOMAINS 적용
- **STEP 496**: `MarketBoard.tsx` 모바일 수익률 텍스트 `text-[13px]` 추가(너무 작은 글자 수정)
- **STEP 497**: `lib/lenses.ts`(모멘텀·기술·밸류 순수 계산) + `app/api/lens/route.ts`(야후 온디맨드+30분 캐시) 렌즈 엔진 MVP
- **STEP 498**: `app/stock/[symbol]/page.tsx` 렌즈 3개 카드 UI. `next.config.ts` `/stock` 레거시 리다이렉트 제거(307 버그 수정)
- **STEP 499**: 4개 보드(KR·US·JP·CN) 모바일 바텀시트 + 데스크탑 펼침에 "🧭 AI보기" 진입 버튼. `/api/lens` KR 6자리→`.KS`/`.KQ` 자동 해석. HEAD `628b14d`

## 2026-07-01 — STEP 493 — A주(SS/SZ) r1w~r6m 東方財富 kline 대체 (Yahoo 400 → 6,697개 계산)

- `lib/cnPerf.ts`: `.SS`/`.SZ` → 東方財富 `push2his.eastmoney.com` kline(secid 1.=상해/0.=심천, 전복권, 일봉 260일)
- `.HK`/`.ETF(HK)` = Yahoo chart 유지
- 재시딩: **6,697개** (이전 2,821 → +3,876). SS 1,856/1,856(100%), SZ 2,012/2,012(100%), HK 2,589/2,808(92%), ETF 248/412(60%)

## 2026-07-01 — STEP 492v2 — CN 전종목 확충: HKEX 공식목록+후강퉁·선강퉁 (108→7,098, HK 2808/SS 1856/SZ 2012/ETF 412)

- `data/cn_symbols.json` 교체: 108 큐레이션 → **7,098 전종목** (HKEX ListOfSecurities.xlsx + SSE_Securities.csv + SZSE_Securities.csv)
- HK 4자리 포맷(`0700.HK`) 수정(HKEX 5자리 `00700` → `int().zfill(4)` 변환)
- SSE/SZSE CSV TAB 구분자 처리(`load_csv_tsv` 함수, UTF-16 인코딩)
- 크론 재시딩: **2,821개 r1w 계산** (HK 2,581/2,808 = 92%, ETF 248/412 = 60%)
- ⚠️ A주(SS/SZ) chart Yahoo Finance 400 — 현재가·1일 라이브, r1w~r6m "—" (Yahoo 제한)

## 2026-07-01 — STEP 485~492 완료 · 중국 탭 완성(홍콩·상해·심천·ETF) + JP 번역·서브탭·풀심볼 확장 (HEAD TBD, push ✓)

- **STEP 485**: US·JP 뉴스 한국어 번역 — `translateTitles()` (비공식 구글번역 gtx + `translation_cache` Supabase 테이블).
- **STEP 486**: JP ETF·REIT 서브탭(3탭: 종목/ETF/리츠) + 일본어 레버리지 배지(`レバレッジ/インバース/ダブル`) + `cacheByType` 서브탭별 캐시.
- **STEP 487**: `JP_NAME_MAP` 우선 → Yahoo 발행사명 오버라이드(1570.T=NOMURAname→NF 日経平均レバレッジ(2倍)).
- **STEP 488**: US 리츠 서브탭(27개 REIT·`/api/yahoo/us-reit-performance`) + `UsMarketBoard` 3탭(주식/ETF/리츠).
- **STEP 489**: JPX 공식 목록(`data_j.xls`) 파싱 → `jp_symbols.json` 72→4,268개(주식 3,739/ETF 466/리츠 63).
- **STEP 490**: Supabase 1,000행 limit 수정 — `jp_stock_perf`·`us_stock_perf` 페이지네이션(`.range()` 루프). JP 2,582/3,724 r1w 채움, US 6,052/6,081.
- **STEP 491**: 중국/HK 탭 배선 — `Country='CN'` + `FEED_COUNTRY_SUPPORT` CN 5탭 + Google News 중화권(`zh-HK/HK/HK:zh-Hant`) + 항셍·CSI300·USD/CNY 마키 인덱스(15개) + `NewsFeed` CN 분기.
- **STEP 492**: `CnMarketBoard` 완전 배선 — `lib/currency.ts` HK·CN + `CN_DOMAIN_MAP` 31항목 + `logoUrl` CN 분기 + `leverageInfo` 중국어(反向/看空/槓桿/看多/兩倍/二倍) + `ToolboxClient` import+플레이스홀더 교체 + vercel.json cn-perf 크론. **108개 r1w 시딩 완료(HK40/SS30/SZ26/ETF12 전부 채움)**.

## 2026-07-01 — STEP 479~484 완료 · 일본 탭 완성(종목·뉴스·로고·닛케이225) + 레버리지 배지 오탐 수정 (HEAD `44e0aac`, push ✓)

- **STEP 479**: `Country` 타입 `'JP'` 추가 + 🇯🇵 국가 토글 + `FEED_COUNTRY_SUPPORT` JP 확장(5탭) + `link_hub` JP 자동 노출.
- **STEP 480**: `JpMarketBoard` 신설(Yahoo `.T` 72종목·¥ 통화·바텀시트·모바일 카드형) + `jp_stock_perf` 테이블·크론(`/api/cron/jp-perf`, 08:00 UTC=17:00 JST) + `formatPrice` JP(`¥`) + vercel.json 크론 추가. **72행 시딩 완료**.
- **STEP 481**: 뉴스 피드 JP 분기(`market=JP`) + Google News 일본 로케일(`ja/JP/JP:ja`) + `googleNews()` 공통화(US·JP 공유). JP 뉴스·실적·리포트·ETF·IPO 피드 5종 라이브.
- **STEP 482**: 상단 마키 `^N225`(닛케이 225) + `JPY=X`(USD/JPY) 추가 → 12개 글로벌 지수.
- **STEP 483**: `JP_DOMAIN_MAP` 73항목 `lib/avatar.ts` 추가 → 일본 종목 실로고(logo.dev 도메인 방식). `JpMarketBoard` 3곳 `.T` 접미어 숨김(표시만, 로고 조회는 풀 심볼 유지).
- **STEP 484**: 레버리지·인버스 배지 영문명 오탐 수정 — 단어 경계(`\b`) 적용(BEAR/BULL/INVERSE/LEVERAGE/2X/3X). "RBC Bearings" 등 정상 종목명 제외, 실제 ETF명만 배지.

## 2026-07-01 — STEP 473~478 완료 · US 피드 파리티 + KR 딜레이 제거 + KR/US 모바일 개편 (HEAD `8795c1b`, 전부 push·배포)

- **STEP 473**: US 탭 피드 파리티 — 뉴스 대표이미지(og:image) + 모아보기 4탭(Google News 토픽·기업재무/리포트/ETF/공모주). ⚠️ prod Google News(Vercel IP) 미검증.
- **STEP 474**: KR 종목 딜레이 제거 — `kr_stock_snapshot` 테이블(MCP) + `/api/cron/kr-perf`(`lib/krSnapshot`) + ranking/kr-performance 스냅샷 우선 서빙 + vercel 크론(10 UTC). **2,769행 시딩 완료**(기준일 20260630) → 로딩 ~10초→즉시.
- **STEP 475·477·478**: KR 종목표 모바일 — 카드형(종목명 강조·현재가 축소) + 바텀시트 스냅포인트(50/66vh·overscroll-contain) + PC 동일 정렬 헤더(종목명·현재가·기간 커스텀 드롭다운, native select 제거).
- **STEP 476**: US 종목표 모바일 동일 미러(`UsMarketBoard`).
- **`COUNTRY_TAB_PLAYBOOK.md` 신설 + §4-2**: 국가 탭 표준 틀 + 종목보드 성능(크론 미리계산 필수)·모바일 = 전 국가 공통 표준.
- ▶ 미완료: prod 라이브 검증(Google News·모바일·속도).

## 2026-07-01 — 🔗 US 링크 허브 풀충전 (67→139 · 미국 자국 기준 · MCP 직접 · 라이브 검증)

코드 변경 없음(DB 직접 insert). HEAD `b741ead` 유지. DB="Trillion" `ccbwxcszdoyjxvckedfp`. **prod 같은 Supabase → 즉시 라이브·배포 불필요.**
- **`link_hub` US 67 → 139**(KR 140 동급). 원칙=미국 자국 기준·다 넣는다(영문 전용 포함), KR 미러 아님.
- 카테고리별(기존→현재): analysis 8→14 · chart 6→12 · community 6→13 · disclosure 6→13 · etf 5→12 · exchange 5→13 · ipo 7→12 · macro 8→18 · news 8→18 · research 8→14 (총 +72행).
- 특화 도메인 웹검색 검증(인사이더·13F·의원매매·지역연준 등) 후 insert. 제외: QuickFS(서비스 종료)·SPACInsider/Econoday/ADP(미확인).
- 라이브 검증(Chrome MCP): onetrillion.app US 뉴스 탭 신규 10개(Motley Fool·Investopedia·Business Insider·Forbes·Fortune·TheStreet·IBD·Kiplinger·CNN Business·Axios) 정상 노출.

## 2026-06-30 — STEP 469~472 · 광고 슬롯 맨위 제거 + 헤더 코인 팝오버 + 탭 5묶음 재정렬·구분선

HEAD `b741ead`. **배포 ✓ `onetrillion.app`**(STEP 422~472 전부 push·배포 완료, origin/main 최신). DB = "Trillion" `ccbwxcszdoyjxvckedfp`.
- **STEP 469 — 광고 슬롯 맨위 제거**: `AdvisorDirectory`·`BrokerRanking`·피드 링크·일반 링크 탭 **맨 위 광고 제거** → **10개마다(이후부터)** 패턴으로 통일. 첫 콘텐츠 바로 광고 없는 깔끔한 진입.
- **STEP 470** — 헤더 코인 준비중 뱃지 스타일(471로 대체됨).
- **STEP 471 — 헤더 코인 탭 팝오버**: "준비중" 항상 뜨던 뱃지 제거 → **코인 클릭 시만 "준비 중이에요" 팝오버**(바깥 클릭 닫힘). `coinOpen` state + `coinRef` + outside-click handler(`Header.tsx`).
- **STEP 472 — 탭 5묶음 재정렬 + 거래소·기관 + 구분선**: TAB_ORDER에서 `exchange`를 `community` 앞으로(거래소·기관 묶음). `CLUSTER_START` 상수 + 탭바에 얇은 세로 **묶음 구분선**(뉴스·ETF·거래소·기관·커뮤니티 앞). `거래소` → **`거래소·기관`** 리네임(KRX+유관기관 포함). `app/page.tsx` 라벨 수정.
- **🔗 링크 허브 풀충전 (MCP 직접 insert — git/마이그레이션 아님!)**: KR `link_hub` **73 → 138개**(전 10개 카테고리 2배+). 빈 탭(차트·시세·커뮤니티·거래소·리포트·거시 등) 전부 채움 + 뉴스 22·리포트 21·거시 21·ETF 14 등. 도메인은 웹검색으로 검증(증권사·연구소·운용사·기관). **⚠️ 마이그레이션 아닌 DB 직접 입력이라 git엔 없음.** **US는 67개 — 아직 KR 수준 미충전(다음 작업).** 원칙 = "추리지 말고 다 넣는다(허브=수집)".
- **📱 모바일 패스 완료**: Chrome MCP로 종목·상품·푸터·페이지네이션·피드(거시)·리딩방·뉴스 링크 라이브 점검 → 깨짐 없음(옛 '푸터 뜨는' 문제도 해결 확인). AI·광고 빼면 **KR 탭 베타 출시 가능 수준**으로 판단.
- **▶ 다음**: ① **US 링크 풀충전**(KR 수준 138개로) · ② Phase 2 결제 PG+빌링 테이블+본인인증 · ③ Trillion AI 전망(Phase 5). (모바일 패스=이번 세션 완료.)

## 2026-06-30 — STEP 466~468 · 종목·상품 수익률 패노라마 + 전 리스트 10개마다 광고 문의

HEAD `205c8ef`. **배포 ✓ `onetrillion.app` 라이브**(STEP 422~468 전부 push·배포 완료, origin/main 최신). **종목·상품 표에 기간 수익률 인라인 펼침 + 모든 리스트 탭에 광고 문의 슬롯을 확장한 세션.** DB = "Trillion"(`ccbwxcszdoyjxvckedfp`).
- **STEP 466·467 — 종목·상품 수익률 패노라마 + 표 광고**: KR·US 종목·상품 표에서 **데스크탑 행 클릭 → 그 행 아래로 1일~1년 수익률 가로 패노라마**(아코디언·재클릭 닫힘·`hidden lg:table-row`·`Fragment`). 모바일은 기존 하단 시트 유지. **표 10행마다 '광고 문의하기' 행**(`AdSlotRow slot="broker"`, 페이지 마지막 행 뒤 생략).
- **STEP 468 — 다른 탭 광고 확장 + 'feed' 슬롯**: 유튜브 Top100 **10개마다**, 피드 링크 리스트(뉴스·공시·리포트·거시·ETF·공모주 + 커뮤니티·거래소) **맨 위 1개+10개마다** 광고. 새 **`feed`(콘텐츠 피드) 슬롯** 신설 — `AdSlotRow` 타입·`AdInquiryForm` 옵션·`/advertise` 안내 카드 3번째·URL 화이트리스트.
- **라이브 검증(Chrome MCP)**: KR 효성중공업 1년 `+267.45%` 패노라마·US BRK-A 패노라마·표 10행마다 광고 4개/페이지, 유튜브 10·20·…·90위 광고(100위 뒤 생략), 뉴스 맨 위 광고 — 전부 정상.
- **▶ 다음 후보**: ① 모바일 패스(리딩방·검증/business/advertise 눈으로 확인) · ② Phase 2 결제 PG + 빌링 테이블 + 본인인증(도메스틱 PG/글로벌 MoR) · ③ Trillion AI 전망(Phase 5).

## 2026-06-30 — STEP 462~465 · 약관 정비·빈 상태 CTA·관리자 UX·모바일 서브탭

로컬 HEAD `e770a1b`(STEP 465). ⚠️ **origin/main=`939f12b`(=현재 라이브) — STEP 422~465 전부 미배포.**
- **STEP 462 — 약관 정비 + 고아 파일 4개 삭제**: `app/terms`·`app/privacy` "자가등록" → "업체 인증(게재)" 문구 정정. 구 자가등록 플로우 잔재 4파일 완전 삭제(RoomSubmitModal·rooms/submit API·AdminSubmissions·admin/submissions API).
- **STEP 463 — verified view 빈 상태 온보딩 CTA**: 리딩방·검증 "인증 리딩방" 탭에 인증 업체가 없을 때 → 온보딩 카드("무료로 게재" + "지금 등록하기" 버튼 → /business).
- **STEP 464 — /admin 레이아웃 정리**: 금감원 조회 탭 밖 상시 노출(제목 바로 아래, 클레임 심사하며 즉시 조회). 처리 큐 탭 3개[업체 클레임·신고·광고 문의] — 금감원 탭 제거 + 탭 이름 반복 부제목 제거.
- **STEP 465 — FEED_TABS 모바일 서브탭**: 뉴스·공시·거시·분석·리포트·ETF·공모주 7개 피드 탭에 **모바일 전용 서브탭 [링크 | 모아보기]** 추가(데스크탑은 2단 그대로·서브탭 `lg:hidden`). 탭 전환 시 '링크'로 자동 리셋. `FEED_SUB_LABEL` 상수.

## 2026-06-30 — STEP 456~461 · 채널 단위 게재 모델 + /advertise 문의 + /admin 탭·게이트 + 결제·빌링 레일(§3)

로컬 HEAD `687263d`(STEP 461). ⚠️ **origin/main=`939f12b`(=현재 라이브) — STEP 422~461 전부 미배포(로컬 26커밋 ahead).** **리딩방·검증을 '채널 단위 게재' 모델로 완성하고 광고 문의·관리자 동선·결제 레일을 확정한 세션.** DB = "Trillion"(`ccbwxcszdoyjxvckedfp`).
- **채널 단위 디렉토리(456·459)**: 리딩방·검증=3뷰 탭 [금감원 등록업체 | 인증 리딩방 | 관심도순](각 ↕). 채널명=운영자 '인증'한 곳만(✓UserCheck 뱃지). 인증 리딩방 뷰=**채널 단위**(활성 `business_links` 1개=독립 행, 같은 업체명·다른 채널명, 교차연결 X). `expires_at` 만료 필터. `api/advisors` verified 채널 브랜치 + `AdvisorDirectory` `channel_*`·`rowKey`.
- **/advertise 광고 문의(457·460)**: 공개 페이지(2단: 슬롯[증권사/리딩방]+§3 정책 / 폼)→`ad_inquiries`(테이블 MCP 생성, RLS 서비스롤). 폼=이메일+전화 **둘 다 필수**. 광고 슬롯(증권사·리딩방)→"광고 문의하기" CTA(`AdSlotRow`, /advertise?slot=, 맨위+10개마다). 진입점=슬롯·헤더 드롭다운·푸터.
- **/admin 탭+게이트(458)**: 탭 [업체 클레임 | 신고 | 광고 문의 | 금감원 조회](`AdminTabs`). 광고 문의 탭(`AdminAdInquiries`)=목록+상태(신규/연락함/종료), "연락함"=위치별 템플릿 **mailto**(`api/admin/ad-inquiries` PATCH). `/admin/login` 전용 게이트(구글→`?next=/admin`→role) + 헤더 드롭다운 관리자 제거 + 푸터 © 작은 관리자 링크.
- **운영자 채널 UI(461)**: `/business`>내 업체 관리=**"게재 채널"**(링크→채널 용어), 채널명 우선 입력, 무료 1채널 + 추가="채널당 월 5만원·결제하면 자동 게재/미결제 자동 비공개"(Phase 2 stub). 유료 뱃지 '광고'→'유료'(추가 채널=게재지 광고 아님).
- **🗺️ ROADMAP §3 추가**: 게재 가격 모델(무료 1채널/추가 ₩5만·채널 단위) + **결제·빌링 레일**(리딩방 게재 + AI 구독 **공용**, 빌링키 정기결제→성공 webhook=`expires_at` 연장/실패=자동 비공개, PG 후보 토스페이먼츠 빌링·포트원, ⚠️ PG 키=사용자(.env)·수취 전 법률자문+통신판매업 신고+약관+환불·세금). 단계: 지금 무료/Phase 2 PG/Phase 5 AI.
- **DB(MCP·git 아님)**: `ad_inquiries` 신규(RLS 서비스롤). **테스트 데이터 전부 정리**(business_members/links/claims·ad_inquiries=0; link_previews 999·fss_advisors 1804 실데이터 유지). soulmaten7 admin.
- ▶ **다음 후보**: ① 배포(`git push` 422~461) + onetrillion.app 검증 + fss-advisors 크론 확인 · ② Phase 2 결제 PG + 빌링 테이블 + 본인인증 · ③ 옛 자가등록 죽은코드 정리 · ④ Trillion AI 전망(Phase 5).

## 2026-06-28 — STEP 422~455 · 리딩방·검증 MVP 2.0(클레임·인증·광고 + OG 프리뷰 + 표형 디렉토리) + ROADMAP §3 정책 + 관리자·운영자 동선 정리

HEAD `9d34b3f`(STEP 455, push 완료 → 배포 반영 확인). **리딩방·검증 탭을 '업체 클레임·인증·광고' 시스템으로 완성 + ROADMAP §3 정책 확정 + 관리자·운영자 동선 정리한 세션.** 금감원 유사투자자문 신고 데이터가 주체, 인증한 업체가 채널 링크 관리(1무료+추가유료), 광고는 노출(순위)만 판다. DB = NEW "Trillion"(`ccbwxcszdoyjxvckedfp`).
- **🗺️ ROADMAP §3 정책 확정**: 게재=금감원 유사투자자문 신고된 곳만(미신고=게재 X, 검색 경고+신고만). 라벨="유사투자자문 신고"(등록 아님·신고제·금융투자업 아님). 3층 뱃지(① 유사투자자문 신고=규제 사실·자동·무료 ② 운영자 인증=클레임+국세청 진위확인·무료 ③ 광고=신고+인증한 곳만·유료). 원칙: 사실은 안 판다·노출(순위)만 판다. "신고=입장권" 플라이휠. 광고=순위 부스트일 뿐+매체 가드레일 3개(콘텐츠 가이드·신고 임계치 제한·"광고" 라벨). ⚠️ 광고비 수취 전 법률자문 필수.
- **업체 클레임·인증(STEP 430~441)**: `/business` 검색→국세청 진위확인(`lib/nts.ts`, data.go.kr)→서류 업로드(`business-docs` 버킷)→관리자 검토(`/admin`)→운영자 인증→마이페이지 '내 업체'(검증사실 미리보기·소개·무료링크1+추가유료스텁·관리자공유)→디렉토리 노출. DB `business_members/claims/links/listing`+RLS. 라벨 "유사투자자문 신고"+"운영자 인증" 뱃지(STEP 441). admin 자가등록 섹션 제거(436).
- **디렉토리 폴리시(STEP 442~448)**: 플랫폼 탭 제거(442) · 리스트 표화(`#·등록업체명·채널명` 컬럼 헤더 클릭 정렬, 행은 ⭐만 — 445·447) · OG 링크 프리뷰(카톡식 카드, 443) = `lib/og.ts`(fetchOg+EUC-KR 디코딩, 444·446)+`/api/link-preview`(lazy 캐시)+`/api/admin/crawl-previews`(dev 배치 전체 1회 크롤, 446)+`link_previews` 테이블 · 채널명=info_name 없으면 OG 제목 폴백(446) · 미리보기 재배치(헤더=업체명, 채널명+신고 한 줄, 플랫폼 아이콘=채널명 앞 — 444·448).
- **관리자·운영자 동선(STEP 449~455)**: 관리자 페이지 — 🔎 금감원 조회 검색박스(사업자번호→`fss_advisors`, `AdminFssLookup`) + 클레임 심사에 대표·개업일·진위확인(✓/✗) 컬럼(449) · 사업자번호·연락처 하이픈 표시 통일(`lib/utils/format.ts` `formatBizNo`·`formatPhone`, 450) · **운영자 동선 통합** = `/business`를 "리딩방 등록·관리" 허브(`BusinessHub` 탭 [업체 인증 | 내 업체 관리]·스마트 기본탭)로 + 마이페이지 '내 업체' 탭 제거 + 디렉토리 버튼 "리딩방 등록·관리"(451~455). 네비=리딩방 / 뱃지·내용=정확한 용어 원칙 유지.
- **기타(STEP 422~429)**: 모바일 시트 UX · 토론 전면 제거 · 카카오 로그인 제거(구글만) · 증권사 광고 슬롯(ListRow sponsored)·유튜브 채널 소개 한 줄·리딩방 인피드 광고(테스트 프리뷰).
- **DB(MCP·git 아님)**: business_* 4테이블+RLS, `business-docs` 버킷, `link_previews` 테이블(OG 캐시), soulmaten7 role=admin. **배포 전 테스트 클레임 데이터 전부 삭제**(business_links/members/claims=0, link_previews 실 OG 유지).
- ▶ **다음 후보**: 배포(422~455 반영) + fss-advisors 크론 실작동 확인(CRON_SECRET·Vercel 로그) · 결제 PG+본인인증(Phase 2 후반) · 옛 자가등록 죽은코드 정리 · 금융투자업 등급 지도 확장(투자자문사 탭) · (최종) Trillion AI 전망.

## 2026-06-27 — STEP 413~421 · US 시장 완전체(거시·뉴스·공시 4기둥) + 종목표 정렬 재설계 + 모바일 폴리시 + 기간 드롭다운 리파인 + 배포

HEAD `fac8fb1`(413~421 + 문서). 배포 ✓ **onetrillion.app 라이브.** **미국 시장을 종목·상품에 이어 거시(FRED)·뉴스(Yahoo)·공시(SEC EDGAR)까지 확장해 KR과 동등한 4기둥으로 완성한 세션** + 종목표 정렬 전면 재설계(KR·US 동일) + 모바일 디테일 폴리시. DB = NEW "Trillion"(`ccbwxcszdoyjxvckedfp`).
- **STEP 413 — 피드 국가맵 리팩터 + 거시 US 노출**: `components/toolbox/ToolboxClient.tsx`의 단일 `country==='KR'` 가드를 `FEED_COUNTRY_SUPPORT` 맵으로 교체 → **거시(macro) US 노출**(FRED 데이터 이미 완성, 가드만 풀림) + `MacroFeed` `defaultView` prop.
- **STEP 414 — US 뉴스 피드**: `/api/news/feed?market=US` = Yahoo `^GSPC` RSS(키리스 실시간 증시 헤드라인) 정규식 파싱 + `NewsFeed` `country` prop.
- **STEP 415 (flagship) — US 공시 피드**: `/api/sec/feed`(SEC EDGAR `getcurrent` 8-K Atom, UA=`SEC_USER_AGENT`) + 새 `components/toolbox/SecFeed.tsx`(DartFeed 미러) + disclosure US 개방. **DART의 미국 짝.**
- **STEP 416 — 모바일 US 종목명 클램프**: 종목명 셀 `truncate`(긴 이름 가로 오버플로 방지).
- **STEP 417 — 종목표 정렬 재설계(KR·US 동일)**: 종목명(가나다/알파벳)·현재가·기간 **헤더 클릭 정렬 + ▲/▼ 항상 표시**, **기본 현재가↓**(탭 전환 시 리셋), `#`는 번호만(클릭 X), **거래대금 정렬 제거**.
- **STEP 418 — 죽은 라우트 삭제**: `app/api/yahoo/us-quote`·`us-performance`(호출처 0, -368줄). (옛 `/api/sec`는 `lib/api/sec.ts`가 써서 유지.)
- **STEP 419 — 모바일 3종**: ① 표 아래 **증권사 중복 제거**(클릭 시트에만) ② `ListRow` ⭐·바로가기 **우측정렬**(전 링크탭 적용) ③ **종목 클릭 시트에 현재가 + 1일~1년 수익률** 추가.
- **STEP 420 — 기간 선택 커스텀 드롭다운**: 네이티브 `<select>` 교체 → 모바일 일관 렌더·작은 인라인·바깥클릭 닫힘.
- **STEP 421 — 기간 라벨 "전" 표기**: 1일전·1주일전·1개월전·3개월전·6개월전·1년전(PERIODS 배열+시트 하드코딩 둘 다) + 드롭다운 **버튼·목록 폭 일치**.
- **🔵 결정**: 거래소 분리(코스피/코스닥, NYSE/나스닥) **안 함** — 검색·정렬로 충분 + US는 데이터 태그 없음 → 주식 탭 통합 유지.
- **🚀 배포**: STEP 413~421 + 세션 문서 → **onetrillion.app 라이브**.
- **현황**: **US 시장 완전체** = 종목·상품(전종목+ETF) + 거시(FRED) + 뉴스(Yahoo) + 공시(SEC EDGAR) **4기둥**, KR↔US UI 통일. DB `us_stock_perf` 상위 200 데모 적재 → **prod 크론 매일 22시 UTC** 전종목 자동(라이브 후 첫 실행 시 1주~6개월 전부 채워짐).
- ⚠️ KR 데이터값이 개발환경에선 이상(페니주·고가) — 라이브 실데이터 확인 권장.
- ▶ **다음 후보**: ④ 평가 디렉토리(MVP 2.0 차별화 축) 심화 · US 1주~6개월 전종목 크론 라이브 채워졌는지 확인 · 추가 모바일 폴리시(실폰 발견 시) · 리포트·실적·ETF·공모주·배당 US 피드 = 보류(키리스 한계/데이터) · (최종) Trillion AI 분석 전망 레이어(`docs/BUSINESS_STRATEGY.md` §3).

## 2026-06-26 — STEP 405~412 · US 종목 탭 신설·KR 구조 통일·종목표 UI 리파인·US 기간 백그라운드 미리계산·언어 선택기 + KR 링크허브 71 큐레이션 + Trillion AI 분석 로드맵 + 배포

HEAD `9984804`(405~412 + 문서). 배포 ✓ **onetrillion.app 라이브**(이번 세션 첫 배포 — STEP 404~412 + 세션 문서). **미국 시장을 KR과 동등한 종목 탭으로 끌어올린 세션** + KR 링크허브 재점검 + AI 분석 전망 레이어 전략 기록. DB = NEW "Trillion"(`ccbwxcszdoyjxvckedfp`).
- **🔵 KR 링크허브 재점검(MCP, git 아님 · 즉시 라이브)**: KR link_hub **65 → 71 큐레이션**. FIX 2: 연합인포맥스 url → einfomax.co.kr, KRX 정보데이터시스템 http → https. 소프트삭제(is_active=false) 2: 클리앙·Investing.com 포럼. ADD 8: 한국IR협의회·KOFIA·코스닥협회·IRGO·증권플러스비상장·KCIF·KIEP·토스증권피드. display_order 1..N 재정렬. 문서 `docs/KR_LINK_HUB_CURATION.md`.
- **STEP 405 — US 종목 탭 신설**: `app/api/yahoo/us-performance`(193 유니버스) + 새 `components/toolbox/UsMarketBoard.tsx` + `ToolboxClient`에 US 종목·상품 탭 노출.
- **STEP 406 — US 표를 KR 구조로 통일**: 하위탭(주식/ETF/ETN/리츠) + 기간 드롭다운 + 증권사 사이드바(`BrokerRanking`은 MarketBoard 내장 구조 미러).
- **STEP 407 — US ETF 데이터 + 하위탭 미국 기준**: 73 ETF `app/api/yahoo/us-etf-performance` + 하위탭을 미국 기준 **`주식 | ETF`**로 정리(ETN·리츠 제거 — 미국 시장 특성).
- **STEP 408 — US 주식 전종목(lazy)**: `data/us_symbols.json`(6,936=주식6,121+ETF815, NYSE/나스닥/AMEX 공식 심볼) + `app/api/yahoo/us-list`(전 종목 batch quote, 거래대금순) + `app/api/yahoo/us-quote`(기간 lazy) + UsMarketBoard 주식 탭 lazy.
- **STEP 409 — KR 표 데스크탑 기간 드롭다운 통일**: `MarketBoard.tsx` KR↔US 동일 UI(모바일은 이미 드롭다운이었음).
- **STEP 410 — 종목표 UI 리파인**: `lib/currency.ts`(통화 현지화 KR 원 / US $), 드롭다운 1일부터(고정 1일 컬럼 흡수), 드롭다운 선택 시 자동 정렬, 정렬 화살표 lucide 18px, 컬럼 간격·로고 키움, 증권사 리스트 높이 정렬. KR·US 양쪽.
- **STEP 411 — US 기간 백그라운드 미리계산(option C)**: `us_stock_perf` 테이블(symbol/r1w/r1m/r3m/r6m, RLS public read) + `lib/usPerf.ts`(전 종목 chart→메모리계산→일괄 upsert) + `app/api/cron/us-perf`(매일 22시 UTC, `vercel.json` 등록, CRON_SECRET, maxDuration 300) + us-list에 **1년**(quote `fiftyTwoWeekChangePercent` 무료) + DB 조인 + UsMarketBoard **lazy 제거→전 기간 정렬** + 화살표. 핵심: 1일·1년·거래대금=quote 즉시, 1주~6개월=크론 DB.
- **STEP 412 — 헤더를 언어 선택기로(시장과 분리)**: `Header.tsx`에서 useCountryStore 제거, 한국어🇰🇷 / English🇺🇸(준비중). 시장은 페이지 한국/미국 토글이 담당.
- **🔵 데이터(MCP)**: `us_stock_perf` **상위 200종목** 데모 적재(전 종목은 prod 크론 22시 UTC 자동).
- **🔵 전략 기록**: `docs/BUSINESS_STRATEGY.md` §3에 **"⭐ Trillion AI 분석 — 최종 단계 로드맵(전망 레이어)"** 추가 — 2층 구조(현 핵심=정리/무신고, 최종=전망 유료 구독), 검증 기법 skill화→구독, 매수추천 X·전망 O, 기법 국가불문→데이터 기반=해자, **유사투자자문업 신고**(자본시장법) 추후·각국 규제 상이·법률자문 필수, 투명성(신고·방법론·트랙레코드)=차별점, 우선순위는 데이터+MVP 먼저. (참조 AI Berkshire, MIT.)
- **🚀 배포**: STEP 404~412 + 세션 문서 → **onetrillion.app 라이브**(이번 세션 첫 배포).
- ⚠️ **US 1주~6개월 전 종목**은 prod 크론 첫 실행(22시 UTC) 후 완성(현재 상위 200 데모만). KR 데이터값 이상(개발환경) — 라이브 실데이터 확인 권장.
- ▶ **다음 후보**: ④ 평가 디렉토리(MVP 2.0 차별화 축) 심화 · US 정렬 토글 KR-parity(화살표 일관) · KR 데이터값 라이브 검증 · US ETF/기타상품 확장·증권사 US 연결·다른 시장(일본 등) · (최종) Trillion AI 분석 전망 레이어(`BUSINESS_STRATEGY.md` §3).

## 2026-06-25 — STEP 395~402 · 완성도 패스(전종목 수익률·country-aware·신선도 가드·P2 묶음) + 배당 복원 + US 링크허브 + 인프라(Supabase 전용 이전·도메인 연결)

HEAD `52ebd5f`(402). 배포 ✓ **onetrillion.app 라이브.** **흩어진 디테일을 메우는 완성도 패스 8개 STEP + 데이터/인프라.** STEP 395~401 = `e21f2cc`, STEP 397~402 최종 = **`52ebd5f`** → onetrillion.app 반영 완료. DB = NEW "Trillion" 프로젝트(`ccbwxcszdoyjxvckedfp`).
- **STEP 395 — KR 전종목 기간 수익률**: 신규 `app/api/krx/kr-performance/route.ts`(KRX `bydd_trd` 기준일 + 5개 과거 날짜 오프셋 7/30/91/182/365일, 휴장일 백워크). `MarketBoard`가 symbol로 r1w~r1y 병합. **기간 수익률 커버 종목 46 → 2,768**(기존 야후 UNIVERSE 45개만 → KRX 전종목으로 확대, 긴 기간 "—" 대폭 해소).
- **STEP 396 — country-aware 탭**: `components/toolbox/ToolboxClient.tsx` US 선택 시 KR 전용 탭(종목·상품/유튜브/리딩방·검증) 숨김 → 링크 있는 탭만 노출(빈 화면 방지).
- **STEP 397 (P0) — 법정/메뉴 정리**: privacy 대표/연락처 입력(장은태 / contact@onetrillion.app), about 한자 雲從 표기 제거, Header에서 코인 메뉴 제거(주식만).
- **STEP 398 — no-op(false positive)**: audit이 `middleware.ts` 부재를 지적했으나, Next 16은 middleware.ts 대신 `proxy.ts`를 쓰고 이미 세션 갱신이 동작 중 → 변경 없음. **교훈: audit 발견은 코드로 검증 후 STEP화.**
- **STEP 399 — 거시경제 지표 기준일자 표시**: `components/toolbox/MacroFeed.tsx` `fmtDate` 헬퍼 + "YYYY.MM 기준" 표기(신선도 신뢰).
- **STEP 400 — 유튜브 주간 갱신 안전가드**: `lib/youtube.ts` 수집 < 30이면 throw + 기존 데이터 보존(빈 테이블 사고 방지).
- **STEP 401 — 공모주 피드 빈결과/에러 5분 캐시**: `app/api/ipo/feed/route.ts`(38 스크래핑 장애 시 재시도 폭주 방지).
- **STEP 402 (P2 묶음)**: 푸터 서비스 컬럼 "주식·상품"(`/`) 링크 추가 + 마이페이지 닉네임 저장 성공/실패 인라인 피드백 + `RoomFavoritesClient` 비로그인 "로그인하세요" 카드 분기 통일(3개 즐겨찾기 섹션 일관화).
- **🔵 배당 데이터 복원(MCP, git 아님)**: NEW 프로젝트 `dividends` 0건 → OLD(`qxkmwlkchyxfzxbonhtj`)에서 **top-60 고배당 + 참조 27종목 복사**(Supabase MCP). 공유 DB라 즉시 반영. 상위: JB금융지주 9.9%·HD현대 9.61% 등. `exDate`는 NULL → "—" 표기.
- **🔵 US 링크허브 큐레이션**: 67개 사이트/10카테고리(`docs/US_LINK_HUB_CURATION.md`, 2차 레드팀 검수로 dead URL 제거).
- **🔵 인프라(이전 단계)**: Supabase 마이그레이션 OLD→NEW "Trillion"(`ccbwxcszdoyjxvckedfp`, ap-northeast-2) 완료, **onetrillion.app 도메인 연결**(DNS 라이브, MX 보존, SSL 자동).
- ▶ **다음 후보(보류)**: KR 링크 큐레이션 품질 재점검(US 67개처럼 정밀 검수) · advisors 검색+플랫폼 동시 필터(`app/api/advisors/route.ts` `else if`라 검색 시 플랫폼 무시 — UI가 의도적 either/or이라 합치려면 재설계, 보류) · 뉴스 og:image 스크래핑 경량화(6→3)+빈 fallback · admin 페이지네이션(현 limit 300) · 토론/평가 첫 콘텐츠 시딩 · 전체 i18n(현 UI 한국어 유지) · "리포트/차트" 탭 라벨-콘텐츠 불일치 정리.

## 2026-06-24 (이어서) — Supabase 전용 프로젝트 분리 + 배포 + 구글 로그인 활성화 + /kr·검색박스 수정

HEAD `e6afa23`(394). 빌드 ✓. **흩어진 데이터를 Trillion 전용 Supabase로 이사 → Vercel 배포 → 구글 로그인 LIVE.** STEP 393~394 코드 수정 2건은 Claude Code, 인프라(Supabase 분리·배포·OAuth)는 Cowork이 MCP·가이드로 직접 수행.
- **🔵 Supabase 전용 프로젝트 분리(대형 인프라, Cowork MCP 직접)**: 기존 `qxkmwlkchyxfzxbonhtj`(표시명 "OT-Marketing", ap-southeast-1)에 Trillion 데이터가 타 프로젝트와 섞여 있던 것을 → **신규 `ccbwxcszdoyjxvckedfp`("Trillion", ap-northeast-2 서울)** 전용 프로젝트로 이사.
  - 방식: pg_dump 직결=IPv6 차단·풀러도 막힘 → **Supabase MCP 카탈로그 introspection으로 완전판 스키마 재구성** 후 NEW 적용(초기 `_trillion_schema.sql` 768줄 재구성본은 컬럼 누락[dividends·quant_factors·financials 등] 있어 폐기). 마이그레이션 5개: `trillion_01_tables`→`02_fk_and_indexes`→`03_rls_policies`→`04_functions_triggers`→`05_views`.
  - 결과: **37 테이블**(잔재 10개=advertisers·banners·banner_clicks·payments·partners·partner_slots·partner_leads·partner_clicks·chat_messages·chat_reports 제외) + 뷰 2(advisor_directory·stock_snapshot_v) + 함수 9 + 트리거 7 + auth.users 회원가입 트리거(on_auth_user_created→handle_new_user) + FK 34 + RLS 정책 61. **RLS 구멍 0개**(OLD의 무방비 banner_clicks·chat_reports가 제거되어 더 안전).
  - 데이터: link_hub 100·products 10·youtube_channels 100 = MCP로 복사(행수·URL 일치 검증). fss_advisors는 배포 후 크론으로 재적재 → **1,804건 동기화 완료**. 시드 더미(예시 리딩방 5)·테스트 자가등록(2, rejected)은 의도적 제외(새 프로젝트가 더 깨끗).
  - 문서: `docs/SUPABASE_MIGRATION.md`(상태)·`docs/SUPABASE_MIGRATION_HANDOFF.md`(사용자 단계 가이드). ⚠️ POTAL ref `zyurflkhiregundhisky` 절대 금지 유지. 코드 식별자 `unjong-*`·DB 표시명 대소문자 차이로 유지.
- **🚀 Vercel 배포 — `stock-terminal-delta.vercel.app`**: env 5개를 새 프로젝트 값으로 교체(NEXT_PUBLIC_SUPABASE_URL·NEXT_PUBLIC_SUPABASE_ANON_KEY·SUPABASE_SERVICE_ROLE_KEY[새 형식 `sb_secret_...`, supabase-js 2.101 정식 지원]·SUPABASE_PROJECT_REF·DATABASE_URL). CRON_SECRET은 Vercel에만. ⚠️ DATABASE_URL은 아직 구 프로젝트값이나 **앱 런타임 미사용**(코드에서 `lib/supabase/admin.ts`가 SERVICE_ROLE_KEY만 사용) → 무해, 로컬 DB작업 시에만 교체.
- **🔑 구글 로그인 활성화(사용자+Cowork 가이드)**: Google Cloud Console OAuth 클라이언트 리디렉션 URI에 새 콜백 `https://ccbwxcszdoyjxvckedfp.supabase.co/auth/v1/callback` 추가(기존 콜백 유지) + Supabase 새 프로젝트 Auth→Providers→Google 활성화(Client ID/Secret) + URL Configuration(Site URL=`https://stock-terminal-delta.vercel.app`, Redirect URLs=`.../**`·`http://localhost:3333/**`). 첫 시도 실패 "Unable to exchange external code"=Client Secret 불일치 → 구글에서 secret **새로 발급**(Add secret)해서 해결 → **구글 로그인 정상 동작 확인.**
- **STEP 393 — 로그인 후 죽은 `/kr` → 홈(`/`) 리다이렉트 수정**(`64003e1`): 로그인은 됐으나 콜백이 V7때 삭제된 `/kr`로 보내 404. `app/auth/callback/route.ts`의 `next` 기본값 `/kr`→`/`, `app/auth/login/page.tsx` 돌아가기 링크 `/kr`→`/`.
- **STEP 394 — 종목 검색박스를 하위탭 같은 줄 우측으로 이동**(`e6afa23`): `components/toolbox/MarketBoard.tsx` 검색박스가 표 위 별도 줄(2줄)이던 것을 `주식 ETF ETN 리츠` 하위탭과 **같은 줄 우측**으로 이동(표 우측 1년/☆ 위 정렬). 모바일 w-32, sm+ w-48.
- **남은 선택사항**: ① DATABASE_URL 구값(런타임 미사용·무해) · ② `middleware.ts` 없음(STEP 299에서 추가했다 정리 때 사라짐 — 현재 로그인 정상이나 토큰 만료~1h 후 SSR 세션 갱신 안정성 위해 추후 복구 권장, 필수 아님) · ③ OLD "OT-Marketing" 프로젝트는 Trillion 용도로 더 안 씀(며칠 안정 후 정리 판단).
- ▶ **다음 1순위: onetrillion.app 도메인 연결**(가비아 DNS A/CNAME, 이메일 MX 유지) + Vercel 도메인 추가 + Supabase Site URL·구글 OAuth를 onetrillion.app로 갱신(또는 병행).

## 2026-06-24 — STEP 370~392 · 코드 헬스 → 캐시 → UX → 모바일 반응형 → 종목·상품 고도화 → 종목 표 마무리 + 전면 코드 감사·정리

HEAD `8424e9b`(392). 빌드 ✓. **데스크톱 안정화 + 전면 모바일 반응형 + 종목·상품 대폭 고도화 + 종목 표 마무리 + 전면 코드 감사·정리.**
- **종목 표 마무리(386·392)**: `table-fixed`+칸별 고정폭(정렬·데이터 변해도 컬럼 위치 고정) + 숫자 페이지네이션(`← 1 2 3 … 52 →`, 리딩방 `pageNumbers()` 통일). 392: 잘린 종목명 데스크탑 hover 툴팁 + 모바일 시트 풀네임(truncate 제거) + toggleWatch 실패 시 revert.
- **🔍 전면 코드 감사·정리(387~391, 3-에이전트 감사)**: **🔴보안 387** 미사용·무인증 `rooms/[id]/verify`(admin 클라=RLS 우회로 누구나 '검증됨' 마킹 가능) 삭제 · **🧹388** 죽은 코드 27파일(미사용 스토어7·컴포넌트7[TopNav·TickerBar·RightFixedNav 등]·lib8[payment·chat·stockCalculations·깨진 watchlist 등]·타입4 + `/api/likes`) · **389** 국가 상태 `useCountryStore` 통합+persist(헤더 플래그↔게이트웨이 동기화, 로컬 useState+localStorage 제거) · **390** 등락 색 토큰화(`--color-unjong-up`#F04452·`--color-unjong-down`#3182F6) · **391** non-null 단언 방어·관심종목 effect unmount 가드·로그아웃 시 clientCache 클리어. ⚠️ **감사 오탐 보존**: `etf/etn/reit-performance` 라우트·`room_likes` 테이블은 동적 fetch/라이브 DB 존재라 **사용 중**(grep·migration 기준 오탐).
- **코드 헬스(370·372)**: 죽은 legacy 라우트 11+컴포넌트 27(370, HomeIndexStrip만 layout으로 보존 이동) + 죽은 API 라우트 ~55(372, 옛 종목상세·KIS·home·stocks 등). 빌드 페이지 **144→28**. 크론(fss-advisors·youtube-refresh)·활성 보존. **371** 지수 티커 한글→영어(KOSPI·NASDAQ…). ⚠️ 라우트 삭제라 클린 재시작 필수.
- **속도(373·374)**: `lib/clientCache.ts`(Map, stale-while-revalidate) — 피드 5종·MarketBoard(373)·AdvisorDirectory(374)가 받은 데이터 캐시 → **재방문 즉시 표시**(백그라운드 갱신) + 첫 로딩 스켈레톤. 컴포넌트만(새로고침 적용).
- **UX 디테일(375)**: 리딩방 미리보기 카드 ⭐(리스트 동기화) · 링크행 "바로가기🔗" 항상표시(`ListRow` 한 곳=LinkCard·BrokerRanking·Youtube 전부) · 유튜브 "N월 N주차 기준"(week_label) · 마이페이지 즐겨찾기 카테고리 섹션 · 푸터 카카오톡 제거.
- **즐겨찾기 일원화(376)**: 마이페이지 '내 즐겨찾기' 탭 = `/favorites` 중복 → **탭 제거**(미사용 import·state 정리). 헤더 ⭐ → `/favorites` 단일. 마이페이지 = 프로필+내신고.
- **📱 모바일 반응형(377~381·385, 마스터 `docs/MOBILE_BUILD_PLAN.md`)**: 377 패딩 `px-4 sm:px-6`·푸터·게이트웨이 / 378 표 일부 컬럼 `sm:`부터(→381 대체) / 379 증권사 바로가기 모바일 **표 아래** + 뉴스 이미지·바텀시트 / 380 탭 터치타깃 + 고정폭 스윕 / **381 표 모바일 = 기간 6컬럼→드롭다운 1칸**(select 1일~1년) + `#`간격 축소 + min-w 320 / **385 종목 클릭 시트 = 증권사 바로가기 리스트(모바일 전용 `lg:hidden`)**. 아침 체크리스트 `docs/MOBILE_MORNING_CHECKLIST.md`.
- **⭐ 관심종목(382)**: 기존 `watchlist` 테이블 재사용(구 죽은코드 잔재) + **`name_ko TEXT` Cowork이 Supabase MCP로 추가**(RLS·정책 "Users can manage own watchlist" 기존). `/api/watchlist` GET/POST(upsert onConflict user_id,symbol,market) + MarketBoard 행 맨 오른쪽 ⭐(stopPropagation) + `/favorites` 관심종목 섹션(`WatchlistClient`).
- **전체 종목+검색(383)**: KRX ranking cap 200→3000, MarketBoard 전 종목(~2,600) 로드 → 50/페이지(이전·다음, 행번호 절대순위 `page*50+i+1`) + 검색(종목명·코드 전 종목 필터). ⚠️ **현재가·1일=전 종목(KRX), 1주~1년=야후 UNIVERSE 45개만**("—") → 긴 기간 확장 후속.
- **종목 클릭 시트(384→385)**: 384는 정보링크(네이버/DART/TradingView/KIND)였으나 → **385에서 증권사 바로가기 리스트 + 모바일 전용으로 교정**(사용자 의도: 모바일은 증권사 리스트가 한눈에 안 보임 → 종목 클릭으로 접근).
- **🔑 워크플로우**: STEP 382~385는 Claude Code(Sonnet) 자율 작성 → Cowork 검토·교정(별 위치 좌→우, 행번호, DB컬럼, 시트 내용). **돌리기 전 Cowork 검토** 권장.
- **검증**: 이 환경 Chrome 마우스 CDP 멈춤 → **JavaScript 실행으로 종단검증**(관심종목 DB저장·페이지 51번·검색·증권사 시트·`lg:hidden` display:none 전부 OK).
- ▶ **다음**: ① 모바일 실측 미세조정 → ② 모바일 마무리 → ③ 배포(Vercel·onetrillion.app) → ④ 앱스토어.

## 2026-06-23 (이어서 2) — STEP 364~369 · 출시 준비(도메인·이메일·로고) + 종목·상품 랜딩 안정화

HEAD `bb04a13`(369). 빌드 ✓. **출시 로지스틱스(도메인·이메일·로고) 확정 + 데스크톱 랜딩 완성도.**
- **🌐 도메인 확정**: **onetrillion.app**(가비아 등록. `.app`=HTTPS 강제, 핀테크/신뢰에 +). 사이트 주소 = `https://onetrillion.app`(metadataBase·robots·sitemap 반영). ⚠️ **아직 미배포(로컬만)** — 배포는 모든 작업 끝낸 뒤 한 번에(Vercel 예정).
- **✉️ 이메일 확정**: **contact@onetrillion.app**(구글 워크스페이스 Business Starter). 가비아 DNS에 TXT(소유인증)+MX(`1 smtp.google.com.`) 설정·검증 완료(dns.google로 확인). 푸터 반영(365).
- **🎨 로고 확정**: **T 모노그램**(윗줄 3블록+기둥='T', 흩어진→하나. 미드나잇#0E1116+민트#2DD4BF) — Claude Design 3안(수렴허브/T모노/렌즈) 중 선택. 프롬프트 `docs/LOGO_PROMPT.md`. 파비콘·앱아이콘·OG·헤더 전면 적용(369).
- **364** 파비콘(`app/icon.svg`)·OG/apple 이미지(`next/og` ImageResponse)·metadataBase. **365** 푸터 이메일. **366** robots(+`/admin`·`/mypage`·`/auth` 색인 차단)·sitemap·브랜드 404(`not-found`). **367** 푸터 사업자 표시(대표자 **장은태**·주소 **제주 서귀포시 동문로 55 2층**).
- **368 종목·상품 랜딩 안정화** 🔴: 기본 정렬 '1일'→**거래대금순**(대형주=yahoo 기간데이터 참 → 빈 컬럼"—" 해소) + **스켈레톤** 로딩("불러오는 중…" 대체). '#' 헤더=거래대금순 복귀. (원인: 기간 수익률은 yahoo 대형주 UNIVERSE만 → 1일정렬 시 소형주가 위로 가 죄다 "—"였음.)
- ▶ **다음(사용자 지정 순서)**: ① 사용자가 본 PC 문제 정리→수정 → ② 모바일 반응형 완성 → ③ **플레이스토어·앱스토어 등록**(연결제 준비됨, 웹앱 래핑 필요). robots/sitemap은 배포 직전 재확인. SPF/DKIM(메일 발신)도 배포·발신 시점에.
- ⚠️ 데이터: 데모 `room_submissions` sub:1·검증용테스트 = status `rejected`(공개 X). 테스트 신고 2건 dismissed.

## 2026-06-23 (이어서) — STEP 361~363 · 마이페이지 버그·재구성 + 옛 라우트 차단 + 자가등록 승인제

HEAD `32cb51d`(363). 빌드 ✓. STEP 346~360 후 같은 세션에서 이어서 진행한 디테일 정비.
- **361 마이페이지 정비**: 🔴 **AuthProvider 레이스**(세션 있을 때 `setLoading(false)`를 즉시 호출 → user가 null인 찰나에 마이페이지가 `/auth/login`으로 튕김) → `fetchProfile` 완료 시점으로 미뤄 루트 수정(STEP 319 동기콜백 원칙 유지). 마이페이지 재구성(죽은 탭 구독·관심종목 제거 → 프로필·**내 즐겨찾기**(링크+리딩방)·내 신고, `unjong-*` 토큰·모바일). 로그인·소개 옛 태그라인 → "흩어진 금융정보를 한눈에".
- **362 옛 라우트 차단**: `next.config.ts` redirects — 안 쓰는 legacy 라우트 12종(`/market`·`/stock`·`/room`·`/rooms`·`/news`·`/products`·`/product`·`/discussion`·`/calendar`·`/global`·`/scalper`·`/longterm`) → 홈(`/`). 옛 운종 디자인·브랜드 페이지 노출 차단(코드는 보존, 도달만 막음 — 실제 삭제는 출시 전).
- **363 자가등록 승인제**: '+리딩방 등록'이 즉시 공개(`status:'public'`)였던 구멍 → **pending(대기) → 관리자 승인 후 공개**. 신규 `/api/admin/submissions`(approve/reject, admin) + `AdminSubmissions` 컴포넌트(승인/반려 버튼) + 등록 모달 "관리자 검토 후 공개" 안내. 신고 모더레이션과 동일 원칙.
- **데이터 정리(MCP)**: 데모 리딩방 `room_submissions` sub:1('운종 데모 리딩방(테스트)') status `public`→`rejected`(공개 목록에서 제거·되살리기 가능). 테스트 신고 2건(LW주식공부·BDBC, 둘 다 dismissed)은 관리자 전용이라 유지.
- ⚠️ **미검증(클린 재시작 후 확인 예정)**: 363 자가등록 승인 플로우(등록→대기→승인→공개).

## 2026-06-23 — STEP 346~360 · 🔴 리브랜드 Trillion + 모바일 반응형 + 리딩방 신뢰 재정비(평가 구축→철회→관심순)

빌드 ✓ 전 STEP. HEAD `7e1d7d3`(360). **운종/UNJONG → Trillion/트릴리언 리브랜드 + 모바일 반응형 토대 + 리딩방을 '미검증 평가' 빼고 '사실+관심순'으로 재정비.**

**리브랜드(351~353)**: 운종/UNJONG → **Trillion / 트릴리언**(사업자명 **원트릴리언**, 사업자번호 **210-39-33812**, `docs/LAUNCH_INFO.md`). 포지셔닝 = **"흩어진 금융정보를 한눈에"**(정보 허브 — '안 속는 곳'에서 재정렬). 디자인 = **미드나잇 `#0E1116` + 민트 `#2DD4BF`** — 헤더·푸터·지수티커 다크화(352~353). 코드 식별자(`unjong-*`)·DB는 대소문자 달라 그대로 유지(안전). 헤더 언어설정(한/미)은 **한국판 완성 후로 보류**.

**즐겨찾기 일원화(348~350·357)**: 헤더 알림→**즐겨찾기**, 전용 페이지 `/favorites`(HTML5 드래그 순서) + 리딩방 즐겨찾기(`room_favorites`, `RoomFavoritesClient`). 357 링크 즐겨찾기(`LinkCard`)도 비로그인에 별 노출 + 클릭 시 `/auth/login` 유도(게이팅 통일). 서버는 전 동작 `401`+RLS.

**모바일 반응형(354~355)**: `body{min-width:1280px}` 제거(데스크톱 강제폭 해제 — 모바일 가로스크롤 주범) + 게이트웨이 피드 모바일 스택(`flex-col lg:flex-row`) + 헤더 작은폰 넘침 해소(gap-3 px-4 sm:↑ + 보조텍스트 `hidden sm:inline`) + 푸터 패딩. 활성 surface 전수 코드 점검 = 피드 카드형·표 `overflow-x-auto`·리딩방 모바일 하단시트 등 **이미 반응형**(비반응형 그리드는 legacy 미라우팅). ⚠️ 이 환경 Chrome resize_window는 렌더 뷰포트 미반영(`innerWidth` 1920 고정) → **모바일 실측은 사용자 폰 몫.**

**🔴 리딩방 신뢰 재정비 — 평가 구축→철회→관심순(356~360, 이번 세션 핵심 결정)**:
- 356 별점(1~5)·후기(`room_reviews`) + 358 리뷰 신고·관리자 숨김(`room_review_reports`·`/admin` ⭐리뷰 섹션) **구축·검증 완료**했으나 →
- **사용자 결정(철회)**: 리딩방은 텔레그램·카톡 등 **off-platform → 이용 증빙 불가** → 거짓·악의 리뷰를 막을 수 없고 명예훼손 리스크 → "안 속는 곳" 정체성과 충돌. **별점·후기·좋아요(♥) 전부 제거.**
- 359: 리뷰 UI·라우트(`/api/reviews*`)·`RoomReviews`·`AdminReviews`·♥(`toggleLike`)·추천순 **제거** → **즐겨찾기로 일원화**. 리딩방엔 **사실(금감원 등록·신고) + 즐겨찾기 + 바로가기**만.
- 360: 정렬 = **관심(누적 즐겨찾기)순 기본 + 가나다↑↓**(화살표 아이콘). 뷰 `advisor_directory`에 `favorite_count` 추가, `/api/advisors` `sort=interest`. 행에 관심 수(0 숨김), 토글 낙관적 ±1. ✅ Chrome으로 정렬탭·토글·DB 검증.

**DB 변경(MCP 직접, git 아님)**: `room_reviews`·`room_review_reports` 테이블 **생성 후 dormant 보존**(앱 미사용, 되살리기용) · `advisor_directory` 뷰에 **`favorite_count`**(room_favorites 집계, 카운트만 노출) 추가 · `room_favorites`에 `position` · `room_likes` dormant(♥ 제거). soulmaten7=admin 유지. **운종 전용 ref `qxkmwlkchyxfzxbonhtj`(표시명 OT-Marketing)** — POTAL `zyurflkhiregundhisky` 금지.

**🔑 유지 교훈**: Turbopack은 **API 라우트 변경/삭제를 자동 갱신 안 함** → `pkill -f "next dev"; rm -rf .next; npm run dev` 클린 재시작 필수(356·358·359·360 전부 해당). 컴포넌트만 바뀌면 HMR/새로고침으로 충분.

**▶ 다음 후보(보류)**: 마이페이지 '내 즐겨찾기' 정비 · 모바일 폰 실측 정밀 수정 · 출시 전 데이터 정리(데모·dormant 테이블·키 rotate) · 이메일/도메인(trillion.* 변형 — 사용자 작업) · 푸터 대표자·주소 채우기 · 언어 i18n(한국판 완성 후).

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
