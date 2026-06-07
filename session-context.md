<!-- 2026-06-07 -->
<!-- Last GC: 2026-06-04 (마이그레이션 020·021·022 적용 + FSS 1,738건 적재 완료 시점) -->
# 운종(雲從) — 프로젝트 맥락

## STEP 200~206 (2026-06-07) — 리딩방·채널 랭킹 + 좋아요/싫어요 DB ✅

운종 MVP 2.0(평가 디렉토리) 진입. HEAD `2bf1bc7`. 빌드 ✓.
- **200~204 리딩방→채널 분리**: '리딩방' 탭(`leading_rooms`) → 행(플랫폼 로고+방이름+👍/👎/👁) → hover 프리뷰(연결 카드+투표+방 평가, `HomeRoomPreview`·`platformLogo` 공용) → **리딩방=텔레/카톡만, '주식 관련 채널' 탭**(유튜브·디스코드·인스타·페북, platform 필터)
- **201 DB 023**: `leading_rooms` like/dislike 컬럼 + `leading_room_votes`(vote_type·트리거·RLS) — 운종 DB(`qxkmwlkchyxfzxbonhtj`)에 **MCP 적용 완료**
- **205~206**: 탭 "~랭킹" rename · ETF hover 미리보기(`HomeStockDetail` 재사용) · 정렬 라벨(거래대금순/기간 수익률) · 리딩방/채널 경고 문구 개정 + 좋아요/싫어요/조회 클릭 정렬(공용)
- **정직/결정**: ETF "기간 거래대금순"=데이터 없음→수익률 / 텔레그램 라이브 임베드 불가→연결 카드 / 채널 미인증 라벨 없음
- **팔로워 전략**: 유튜브=API 자동(주1회 크론), 인스타/페북=등록 기반, 디스코드=부분. `follower_count` 후속
- **다음**: 채널 팔로워순(DB) · **상세 페이지 디테일**(방/채널/종목 클릭 후) · 광고는 사용자 지시 시에만 · STEP 162 키

## STEP 195~199 (2026-06-07) — 인기토론 홈 + 투자상품 랭킹 ✅

HEAD `ef5f6ec`. 빌드 ✓.
- **195·196 인기토론 홈**: 얇은 지수 티커 헤더밑 고정(`HomeIndexStrip`) + 큰 주요지수 박스→**인기토론 2열 라이브**(`HomePopularDiscussions`, 좋아요순·20초폴링·👍/👎/💬·빈상태 CTA) + 하단 마퀴 제거. 수급은 홈에서 빠짐(투자자동향 탭엔 유지)
  - 결정: 인기토론 = 인기순 + 반론 노출(신뢰가중 X, 인증 로그인이 1차 필터)
- **197~199 투자상품 랭킹**: '투자상품' 탭 → ETF(인기순=거래대금 / 수익순 1·3·6·12개월, `/api/yahoo/etf-performance` 신규) + 펀드 준비중. 종목 상세에 "어디서 거래할까" 증권사 바로가기(토스 딥링크+7개사, 거래 X)
- **로드맵**: 다음 = 리딩방 랭킹(FSS 검증·인증 위/추천 아래·주의 신호). 펀드 소스 추후.
- **광고**: 설계 0. **사용자 지시 시에만** 다룸, 철칙도 그때 사용자가 정함(운종 미리 안 만듦).
- **데이터 정직**: ETF 수익순=대표 16개 과거 시세 계산 / 증권사 딥링크는 토스만(나머지 홈페이지) / 인기토론·펀드 초반 빈상태 = 정상

## STEP 175~194 (2026-06-07) — 토스 실시간차트 완성 + 로고/차트/색 정밀화 ✅

V7 토스 밀착 3차. HEAD `f0c38c6`. 빌드 ✓.
- **175~182**: 상세 패널 완성(실차트+커뮤니티 토론) · 랭킹 3탭(실시간차트｜카테고리｜투자자동향) · 필터 한 줄 · ♥관심 · 미리보기 필터 밑 정렬(`detailSlot`) · 미국탭 "데이터없음" 폴백(대표 40종목 등락순)
- **183·184 로고**: 레버리지/인버스 배지(2x/3x) · **logo.dev**(미국 티커 자동 + 국내 도메인 42, `NEXT_PUBLIC_LOGODEV_TOKEN` — `.env.local` 커밋금지). 구글 파비콘 대체
- **185~188 차트**: 지수 스파크라인 area fill · 미리보기 캔들 거래량 막대+월 라벨(잘림 수정·막대 키움)
- **189 등락색 한국식**: 상승=빨강 `#F04452`·하락=파랑 `#3182F6` 전역(sed 25파일, StockLogo 인버스 제외, globals.css toss 팔레트 보존) · 190 헤더 아이콘 우측정렬
- **191~194 실시간차트 A~D**: [A]필터 라운드스퀘어 칩(거래대금/거래량/급상승/급하락) · [B]기간행(실시간만 활성·나머지 준비중)+투자위험 토글(레버리지 숨김 실동작) · [C]카테고리 2열(국내 KIS업종 ｜ 해외 미국섹터ETF 신규) · [D]투자자동향 3열(외국인·기관 실 ｜ 개인 준비중)
- **정직 원칙 유지**: 토스 거래비율·AI요약·테마분류·개인종목별·기간별 = 미보유/토스자체 → 가짜 X
- **다음**: 인기토론 홈(지수 티커 헤더밑 고정 + 인기토론 2열 라이브, 인기순+반론 노출) · STEP 162 KRX 공식 OpenAPI(키 대기)

## STEP 169~174 (2026-06-06) — 토스 UI 정밀화 (관심 레일·헤더·로고·hover 상세) ✅

홈 토스 밀착 2차. HEAD `13067c6`.
- 169·171 관심 레일: 헤더까지 풀하이트 + 레터아바타 + ♥ + 우측 세로 아이콘 탭(알림/관심/보유/최근). 우측 컬럼 360. 채팅 자리 확보(추후)
- 170 헤더 단일 줄: 로고+네비+검색+아이콘 한 줄(60px), MainNav 행 제거 → 콘텐츠 상단 밀착
- 173 종목 실로고: 주요 종목 도메인 favicon(`lib/avatar.ts` DOMAIN_MAP) + `StockLogo` 폴백(아바타). 홈·마켓·관심 공통. 더 선명히는 logo.dev 키
- 174 hover 상세 3단: [랭킹｜상세｜관심], `MarketClient onHover`→`HomeStockDetail`(헤더 실데이터 + 차트자리 + 운종 확장영역 placeholder). **UI 셸만** (차트·운종 상품/단톡방 콘텐츠는 추후)
- 다음: 상세 패널 실콘텐츠(차트·증권사 상품·단톡방) · #4 카테고리 탭(지금 뜨는 카테고리·국내 투자자 동향) · STEP 162 KRX 공식 OpenAPI(키 대기)

## STEP 154~168 (2026-06-06) — 토스증권 오마주 V7 ✅ (162 키 대기)

V7 = **토스 오마주**(네이버 복제에서 재정렬). 홈 토스식 대시보드 + 전 페이지 풀폭 + 지수 그리드 토스화 + 하단 마퀴 티커. HEAD `959d8fa`. 분석 `docs/TOSS_ANALYSIS_AND_IA.md`.
- **홈/레이아웃**: 156 홈=토스 대시보드(지수+MarketClient embedded+관심레일), 158·159(+) 전 페이지 풀폭(앱 프레임 1984 유지), 157 랭킹 100
- **지수 그리드(160)**: 토글 제거 → 10개(국내·해외·환율·원자재·코인) 한 판. 164 전일대비 금액+느낌태그(급등/급상승/조정/급락). 165 코스피·코스닥 수급(개인/외국인/기관, KIS `FHPTJ04040000` 일별)·166 날짜 수정
- **티커(167·168)**: 상단 TradingView 제거 → 하단 고정 마퀴(그리드 동일 데이터 → 숫자 일치, 스크롤 시 등장, 금액+⚠투자유의사항 라벨, `width:max-content`로 이동). 163 KRX 티커심볼 제거. 인덱스 30초 캐시
- **국내 랭킹 100(161)**: `/api/krx/ranking` + KIS 30 fallback. `data.krx` 백엔드 서버사이드 차단 → KIS fallback 중. **162 KRX 공식 OpenAPI 연동 = 인증키 승인 대기(미실행)**
- **다음**: 키 승인 후 STEP 162 실행 → 랭킹 토스화(등락바·이유태그) → 종목상세 3단(토스 핵심 구조) → 맥락 태그(뉴스 소스)
- **핵심 데이터 소스**: 지수=Yahoo `/api/yahoo/indices`(10심볼·changeText·30s캐시) · 수급=KIS `FHPTJ04040000`(일별·억원) · 국내랭킹=`data.krx` 백엔드 차단→KIS 30, 공식 OpenAPI 대기

## STEP 153 (2026-06-04) — 마켓 미국 랭킹 (us-movers 확장 + 국가 분기) ✅

V7 마켓 국내+미국 완성. 전제 `840e718`.
- us-movers 확장(하위호환): dir up/down·count 30·volume. MarketClient 국가 분기(미국 상승/하락, `priceText` 원/$ 통일, 거래대금·시장필터 국내만)
- 브라우저 확인 ✓ (Meta +4.24%, AMD +4.02%, 클릭→종목). 빌드 ✓ (`33e72f7`)
- **다음**: 토론/뉴스 상세 · STEP 154 시총/52주/인기 필터(KIS 신규 엔드포인트) · 155 업종 히트맵

## STEP 152 (2026-06-04) — 마켓 페이지 + 국내 랭킹 테이블 (네이버 마켓>주식 1차) ✅

V7 첫 페이지 채우기. 새 API·DB 0. 전제 `140b929`.
- `/market` + `MarketClient`: 국가 탭(국내·미국·글로벌) + 시장 필터(전체·코스피·코스닥) + 랭킹 필터(거래대금·거래량·상승·하락) + 랭킹 테이블 + 행 클릭→종목
- 데이터 KIS `volume-rank`(거래대금·거래량)·`movers`(상승·하락), `j.stocks ?? j.items` 흡수. 미국·글로벌 placeholder
- MainNav 마켓 → /market. 브라우저 확인 ✓ (필터 전환·클릭). 빌드 ✓ (`840e718`)
- **다음**: STEP 153 마켓 확장(미국 랭킹·시총/52주/인기 필터·업종 히트맵) → 토론/뉴스 상세 → 문서

## STEP 149·150·151 (2026-06-04) — 홈 CTA · 브리핑 복구 · 네이버식 네비 뼈대 (V7 진입) ✅

브라우저 확인 후 발견·수정 + 네이버 구조 복제(V7) 진입. 전제 `5d71f04`.
- **149** (`2d8a39f`): 홈 HOT토론·평가 EmptyState 에 참여 CTA 버튼 + 문구 (가짜글 X, 참여 유도)
- **150** (`2e2fe00`→`acdc313`): 브리핑 간밤지수 "—" → 실값. **진짜 원인 = 라우트 `runtime/dynamic` 누락**(per-symbol 아님 — Edge/정적캐시에서 yahoo 실패). 브라우저 확인 S&P 7,553.68
- **151** (`140b929`): MainNav 네이버식 6메뉴 [홈·마켓·토론·뉴스·평가·검증·MY] + `/discussion`·`/news` shell 신설. 전역 layout 자동 상속
- **V7 진입**: 네이버 증권 복제 → 운종 적응. 코인 제외. 마스터 `docs/SITE_MAP_V7.md`. **다음 STEP 152 = 마켓 페이지**(국내·미국 통합 + 네이버식 랭킹 테이블)
- 미완 후속: 4개 문서 HEAD 표기 갱신·문서 커밋(이 블록과 함께)

## STEP 147 (2026-06-04) — 종목 메타 보강 (외국인 소진율 + 상장주식수) ✅

종목 `StockInfoPanel` 재무 섹션 한국 전용 메타 2행. 마이그레이션·DB·새 의존성 0. 전제 `98b68e2`.
- `/api/kis/price`: `listedShares`(lstn_stcn) · `foreignRatio`(hts_frgn_ehrt) 2필드 매핑 추가(기존 inquire-price 응답의 표준 필드)
- `StockInfoPanel` (`99864a3`): 타입 2필드 + 한/미 매핑 + 재무 행 2개(isKr && 값>0 가드) + formatShares 헬퍼
- 명칭: hts_frgn_ehrt = "외국인 소진율"(보유÷한도) 정확 표기. 미국 미표시(isKr). 빌드 ✓
- 다음 후보: 홈 레이아웃 미세조정 · 빈 섹션 CTA 문구 · Sponsored 분리 UI / 사용자: 카카오 OAuth·Vercel

## STEP 144·145 (2026-06-04) — 홈 데이터 품질 P0 (스파크라인 + 브리핑 안정화) ✅

홈 상단 신뢰·품질 P0 두 건. 마이그레이션·DB·새 의존성 0. 전제 `fac9e71`.
- **144 지수 스파크라인** (`a0cc3bf`): HomeIndexBar 미국 5지수 카드에 최근 30일 일봉 추세선(inline SVG, 외부 차트 라이브러리 X). indices API 에 yf.chart() 30일 시계열 `spark[]` 추가(실패=빈배열 graceful). 헤드라인 quote() 유지 = 숫자 회귀 0. 심볼별 호출로 순서 매칭 잠재버그 해소
- **145 브리핑 overnight 안정화** (`90cb8a3`): briefing fetchUsIndices 누락·0·NaN → 가짜 초록 "+0.00%" 대신 `hasData:false` → HomeBriefing "—"(중립 회색). "데이터 없음" vs "0% 보합" 구분 = 신뢰 정렬
- 빌드 ✓ (exit 0). 다음 후보: 홈 레이아웃 비율 미세조정 · 인기글 예시 시드 · 종목 메타(외국인보유율·상장주식수)

## 마이그레이션 020·021·022 적용 완료 + FSS 적재 (2026-06-04) ✅

STEP 137~140 에서 작성만 해둔 마이그레이션 3종을 운종 전용 Supabase(표시명 "OT-Marketing", ref `qxkmwlkchyxfzxbonhtj`)에 모두 적용. (POTAL `zyurflkhiregundhisky` 절대 사용 금지)
- 020_dislike_votes ✅ — 상품·리딩방 평가 추천/비추천
- 021_fss_advisors ✅ — 금감원 유사투자자문업자 원장 + leading_rooms 인증 컬럼. **FSS 실데이터 1,738건 적재 완료**
- 022_discussion_dislike ✅ — 종목 토론 추천/비추천
- 결과: STEP 137(금감원 신고 검증 뱃지)·138/140(추천/비추천 투표) 실동작. 코드 변경 없음
- HEAD 변동 없음(`0d7c23b` STEP 143). 남은 사용자 작업: 카카오 OAuth 활성화(로그인 후 투표 동작) · Vercel 배포(cron 활성)

## STEP 143 (2026-06-04) — 홈 빈 섹션·버그 수정 + 시각 밀도 ✅

STEP 142 포털 홈의 깨진 데이터 섹션 3곳 복구. 마이그레이션 없음.
- 브리핑: raw quoteResponse fetch(빈값) → yahoo-finance2 quote() + DART 일정 최근 3일
- 거래량 랭킹: 가짜 spike x·0% → 실제 price·changePercent
- 업종·테마: 두 탭 /api/home/sectors?market=KR|US + 키 sector/change (kis/theme 제거)
- 랭킹 레터 아바타(이름 첫글자 컬러원) — 타사 로고 X
- 빌드 ✓. 다음: 지수 스파크라인 · 인기글 시드 · 레이아웃 미세조정

## STEP 142 (2026-06-03) — 포털형 홈 전면 재구성 ✅

홈을 한국 증권 정보 포털 레이아웃으로. 마이그레이션·DB 변경 0, home-v5 재사용.
- components/home-v6/HomeClientV6 → app/page.tsx 교체. max-w-1480 + 메인/우측레일(320)
- 데이터 모듈: HomeIndexBar·HomeBriefing·HomeGlobalRanking·HomeSectorTheme·HomeEtfPicks·HomeRightRail
- placeholder shell: HomeBannerSlot(fss)·HomeCryptoSlot(코인 보류)·HomePopularStocks·검색상위·숏컷
- 재사용: 뉴스·HOT토론·검증평가 모듈. 운종 카피·디자인만(타사 복제 X)
- 푸터 중복 제거(전역 LayoutShell 사용). 빌드 ✓
- 다음: 사용자 섹션별 운종 방향 수정 반복

## STEP 141 (2026-06-03) — 종목 공시(DART·SEC) 탭 추가 ✅

- StockDisclosuresTab 신규: /api/stocks/disclosures 연결 (한국 DART·미국 SEC 자동)
- 주의 공시(유상증자·CB·대주주변동·합병분할) 레드 강조 + 하단 안내 (운종 신뢰 — 위험 신호)
- StockTabs 5탭: 차트·시세 / 토론 / 뉴스 / 공시 / 인사이트. 진입 1회 로드(폴링 X)
- 마이그레이션·DB 변경 없음. 빌드 ✓
- 다음 후보: 외국인보유율·상장주식수 메타 / 평가 시드 데이터 / Sponsored 분리 UI

## STEP 140 (2026-06-03) — 종목 토론 추천/비추천 통일 ✅

상품·리딩방 평가(020)와 종목 토론의 신뢰 신호 통일.
- 마이그레이션 022(✅ 2026-06-04 적용 완료): discussion_likes.vote + discussions.dislike_count + 동시갱신 트리거
- DiscussionItem: Heart → ThumbsUp/ThumbsDown vote 토글·전환 (댓글·신고·실시간 유지)
- DiscussionBoard: voteMap 로드 + select dislike_count + '추천 정렬'
- HotDiscussionsModule: 추천👍/비추천👎 표시
- 추천 #1AC267 / 비추천 #F04452 (전 토론·평가 통일). 빌드 ✓
- 다음 후보: 공시(DART) 탭 / 외국인보유율·상장주식수 메타

## STEP 139 (2026-06-03) — 종목 페이지 네이버급 디테일 (기존 API 연결) ✅

신규 소스·마이그레이션 0. 미연결 백엔드 API를 화면에 연결.
- lib/format.ts(formatKRW·formatPct), StockInfoPanel 거래대금·배당수익률 행
- 차트·시세 탭: StockOrderbookCard(호가10단)·StockExecutionCard(체결) 한국만 10초 폴링
- 인사이트 탭: 기업실적표(매출~순이익률+ROE·부채비율 파생, DART) + 투자자 매매동향 + 업종 등락률 + 재무 fallback 시 FnGuide 링크
- 시세성 등락색 빨강=상승(평가·홈 토스식과 의도된 반대)
- 빌드 ✓. 다음 후보: 종목 토론 추천/비추천 통일 · 공시(DART) 탭 · 외국인보유율·상장주식수 메타

## STEP 138 (2026-06-03) — 홈 화면 신뢰 축 재배치 (V6 정체성 정렬) ✅

정문(홈)을 신뢰 정체성으로 정렬. 순수 프론트엔드.
- HomeClientV5 위계: 검증·평가 → 평가글 → 토론 → 시장정보(위계↓) → 뉴스. 히어로 fss_advisors 실 카운트(1,738)
- HotRoomReviewsModule: "금감원 신고 ✓"(초록)/"신고 미확인"(회색)
- HotReviewPostsModule 신규: platform_discussions 추천/비추천·outcome 전시
- MarketNewsModule: 카테고리 탭(휴리스틱 1차)
- 빌드 ✓. 다음 후보: 상호·홈페이지 자동매칭 / Phase 2-④ 재무지표 / 평가 시드

## STEP 137 (2026-06-03) — FSS 유사투자자문업자 인증 시스템 (V6 Phase 2-①) ✅

리딩방이 금감원 실제 신고업체인지 공적 데이터 자동 검증.
- STEP 0 확정(라이브): 파인 GET `pageIndex`, 174p(10행/p), 봇 UA 차단→브라우저 UA. 파싱 검증 통과
- 마이그레이션 `021_fss_advisors.sql`(✅ 2026-06-04 적용 완료): fss_advisors 원장 + leading_rooms 인증 컬럼
- lib/fss.ts(cheerio), scripts/import-fss-advisors.ts(tsx 수동), cron 라우트+vercel.json(KST 04:00), 검증 API, 뱃지 UI("금감원 신고업체 ✓") + 검증 폼 + 면책 고지
- 빌드 ✓. ✅ 2026-06-04: 021 적용 + 실데이터 1,738건 적재 완료 → 검증·뱃지 실동작. cron 은 Vercel 배포 후 활성
- 후속: 운영자/admin 권한 게이팅(TODO), 상호·홈페이지 자동 매칭, Vercel 배포 후 cron 활성

## V6 Phase 1 (2026-06-03) — 틀 완성 + 신뢰 축 정렬 ✅ (PRODUCT_SPEC_V6 로드맵)

PRODUCT SPEC V6 확정 — 중심축 "동선의 출발점(편의)" → **"투자상품에 속지 않게 돕는 곳(신뢰)"**. Phase 1 3개 항목 완료.
- **1-1 정체성 카피 전환** (`3a645eb`): layout/page/login 메타·문구 + HomeClientV5 태그라인 배너
- **1-2 추천/비추천** (`e717be0`): 마이그레이션 020(vote SMALLINT + dislike_count + 트리거) + PlatformDiscussionBoard ThumbsUp/Down UI. 별점 ❌
- **1-3 KIS 캐시 안정화** (`e37bf9d`): lib/kis.ts 응답 TTL 캐시(기본 15s) + 동시요청 coalescing

### 후속 (Phase 2 — 신뢰 강화) — 대부분 STEP 137~143 에서 완료
- ② 리딩방 **금융위(금감원) 신고번호 검증 뱃지** → ✅ STEP 137 완료 (021 적용 + FSS 1,738건 적재). 데이터 소스 = 금감원 파인 유사투자자문업자 목록
- ④ 정보 깊이 단계화 → ✅ STEP 139 완료 (시세·차트·공시·뉴스 + 재무 2단계 ROE/부채비율 파생, 정밀 분석은 FnGuide 외부 링크)
- 증권사별 상품 링크 다중화 — 미착수
- ✅ 마이그레이션 020·021·022 = 2026-06-04 전부 적용 완료. 추천/비추천 투표는 카카오 OAuth 활성화(사용자) 후 로그인 사용자에게 동작

## STEP 135 (2026-06-03) — 잔여 문서 V5 정렬 패치 ✅

STEP 134 commit 후 정밀 재검수에서 발견된 4건 후속 처리:

- **README.md 전면 재작성**: 본문에 남아있던 V4 표기 (단타·장타·미국주식 × 7, 3창 분리, 21개 카드, ASCII 다이어그램) → V5 (한국 5·미국 4 카드, 종목별 채팅, 페이지 13개 표) 정렬
- **docs/BRAND_IDENTITY.md**: 태그라인 "한국 주식" → "한국 금융" 동선, V4 5가지 정체성 → V5 4박자 (V4 보존 명시), 색상 팔레트 V4·V5 비교, 중복 헤더 정리
- **docs/PRODUCT_SPEC_V4.md**: 상단 V5 진입 안내 (V4→V5 주요 변경 요약) 추가 — 본문은 V4 명세 이력 보존
- **.env.example 신규 생성**: 21개 키 그룹화 (Supabase·KIS·DART·SEC·카카오·토스·OpenAI) + SUPABASE_ACCESS_TOKEN rotate 권장 주석
- **.gitignore**: `!.env.example` 예외 추가 (env 패턴이 템플릿까지 가리던 문제)

빌드 영향 X (문서·gitignore만).

## STEP 134 (2026-06-03) — 모든 문서·로그 3차 교차검수 갱신 ✅

- 4개 필수 문서 헤더 일관 (2026-06-03): CLAUDE.md · CHANGELOG.md · session-context.md · NEXT_SESSION_START.md
- 보강 문서 갱신: SESSION_KICKOFF.md · BRAND_IDENTITY.md · README.md
- 마이그레이션 015~019 **모두 적용 완료** 명시 (이전엔 "미적용" 잘못 표기)
- 운종 V5 페이지 구조 최종 (13개 라우트) 정리
- MVP 1.0 → MVP 2.0 진입 (상품·리딩방 평가) 반영
- 운종 정체성 V5 = 네이버 레이아웃 + 토스 카드 + Trustpilot 평가 = 한국 금융 동선의 출발점

## STEP 129~133 (2026-06-01) — 전면 디자인 리뉴얼 ✅ (운종 V5 = 네이버 레이아웃 + 토스 카드 + Trustpilot 평가)

- **129** 디자인 시스템: globals.css 토스 색상 토큰 + `.shadow-soft(/-hover)`, CardContainer 재설계(rounded-2xl·shadow·p-5), 카드 그리드 gap-5
- **130** 카드 9개 콘텐츠: 행 padding↑·rounded-lg·transition, 등락색 토스(#1AC267/#F04452), 순위 강조
- **131** 종목 페이지 탭: StockTabs(차트·토론·뉴스·인사이트) + StockChartSection(400px) + RightFixedNav(app/stock/layout)
- **132** 새 홈 손성기 순서: HotProductReviewsModule·HotRoomReviewsModule + HomeClientV5 재배치(핫이슈→HOT토론→HOT평가→헤드라인) + WatchlistPanel 토스화
- **133** /screener 삭제, /calendar→Investing.com 외부 링크, MainNav 정리(BarChart3 제거), MVP2 4페이지 토스 통일

### 잔여 (다음 STEP)
- RightFixedNav 미존재 라우트 (`/notifications`·`/recent`) 임시 연결 — 페이지 신설 시 교체
- 고아 컴포넌트 (`components/calendar` 잔재 · `components/screener` 잔재 · `components/watchlist` · `components/stocks` · `lib/watchlist.ts`) 일괄 청소
- **DB 마이그레이션 015~019 = ✅ 모두 적용 완료** (이전 표기 오류)
- 카카오 OAuth 활성화 = 🔴 사용자 직접 작업 (도메인 결정 후 권장)
- STEP_119_COMMAND.md 의 Supabase PAT 폐기 = 🔴 사용자 직접 (계속 권장)

## STEP 128 (2026-06-01) — MVP 2.0 1차: 상품·리딩방 디렉토리 + 평가 ✅

### 신규 (운종 = Trustpilot 한국 금융 버전 진입)
- 마이그레이션 019: products / leading_rooms / platform_discussions(다형 target_type) / likes / reports + 트리거 + RLS + 시드(ETF 10·리딩방 5)
- 페이지: /products · /product/[id] · /rooms · /room/[id]
- 컴포넌트(components/platform): ProductsClient·RoomsClient·ProductDetailClient·RoomDetailClient·PlatformDiscussionBoard(좋아요·신고·outcome·duration)
- 헤더 MainNav: "상품·리딩방(Reviews)" 메뉴 추가

### 정체성: 운종 = 평가 X(토론만), 리딩방 경고문 노출
### 동작 전제 / 잔여
- 마이그레이션 019 적용(Cowork) + 카카오 OAuth 활성화 후 실데이터·평가 insert
- 추후: 광고(Sponsored)↔토론 분리 UI, Tier 1·2·3 인증, KOFIA/KRX API

## STEP 127 (2026-06-01) — 가독성 리뉴얼 (Pretendard + 크기·spacing 상향) ✅

### 변경
- globals.css: Pretendard CDN @import 로드 + body "Pretendard Variable" + **html font-size 13px→16px**(핵심 — rem 텍스트 축소 원인 제거)
- 전 .tsx: text-[10px]/[11px]→text-xs, text-xs→text-sm (perl, 명령서 sed 순서 버그 교정), leading-snug→leading-normal, p-3→p-4, px-3 py-2→px-4 py-3
- 빌드 ✓ (exit 0)

### 주의
- 이 세션 셸/Read 출력 렌더 간헐 손상 (실행·빌드·Edit 은 정상). globals.css/layout.tsx 의 중복 font-family 잔재는 무해 보존, layout.tsx Inter 미사용 추후 정리
- 루트 16px + 상향 = "한 번에". 과하면 사용자 피드백 후 미세 조정

## STEP 126 (2026-05-31) — 종목 페이지 핫픽스 (4개 버그) ✅

### 수정
- 버그1 종목명: StockPageClient 가 stocks DB name_ko 조회 → DiscussionBoard·StockChatPanel `stockName` prop
- 버그2 시총(결정적): KIS hts_avls=억원 → `/10000`+조/억 (StockInfoPanel·StockDetailPanel 둘 다)
- 버그3 52주: KIS price API `w52_hgpr/w52_lwpr` 우선 + 기존 필드 폴백
- 버그4 차트: 컨테이너 min-w-[260px], createChart width=clientWidth||280, 빈 candles 가드 + console 진단

### 검증: KIS 실데이터는 사용자 실행 환경 확인 (차트 안 뜨면 콘솔 [chart] 로그)

## STEP 125 (2026-05-31) — 미국 주식 상세 + 검색 ⭐ Watchlist ✅

### 신규
- API `/api/yahoo/quote-detail` — quoteSummary 로 미국 시고저·52주·PER·PBR·시총·배당
- `StockInfoPanel`: 미국 분기 풍부화 (시세·재무 박스 한국·미국 공통, formatPrice/formatMarketCap, isUS=!isKr)
- `HeaderSearch`: 드롭다운 ⭐ 버튼 → watchlistStore add/remove 토글 (비로그인 localStorage)

### 의미: 운종 V5 PC 핵심 기능 완성 (114~125)
### 잔여 (사용자 결정)
- 댓글 좋아요·신고 / 대댓글 / 큰 시각 변경 / 모바일 반응형 / Vercel 배포 + unjong.com / 카카오 OAuth 활성화 / 네이버 검색 API

## STEP 124 (2026-05-31) — 토론 댓글 기능 ✅

### 신규
- 마이그레이션 018: discussion_comments 테이블 + comment_count 트리거 + RLS + Realtime
- `DiscussionComments.tsx`: 목록(Realtime) + 작성(인증) + 본인 삭제 + 비로그인 안내
- `DiscussionItem`: 댓글 버튼 토글 + localCommentCount Realtime(+1)

### 의미: 토론 = 메인 글 + 댓글 = 진짜 "대화"
### 동작 전제 / 잔여
- 댓글 insert = 마이그레이션 018 적용 + 카카오 OAuth 활성화 후
- 댓글 좋아요·신고, 대댓글(parent_comment_id) → 추후

## STEP 123 (2026-05-31) — UI 일관성 — 공통 상태 컴포넌트 추출 ✅

### 신규
- `components/ui/State.tsx`: `LoadingState` / `EmptyState` / `ErrorState` 공통 컴포넌트
- 적용: DiscussionBoard · StockChatPanel · StockNewsModule · StockInfoPanel · HotDiscussionsModule · HotChatRoomsModule · MarketNewsModule · ChatPanel · WatchlistPanel · ScalperCards(4개) · LongtermCards

### 검증
- 색상: 의미 있는 inline 색상(배지·차트·카카오) 모두 의도된 사용 — 변경 X
- 빌드: ✓

## STEP 122 (2026-05-31) — 종목별 뉴스 + 시장 헤드라인 (RSS + Yahoo) ✅

### 신규
- API `/api/news/market`(한국 RSS 5개 통합, 정규식 파싱, 10분 캐싱, TOP30) · `/api/news/stock`(한국 RSS 종목명 매칭 / 미국 Yahoo search)
- 컴포넌트 `MarketNewsModule`(새 홈) · `StockNewsModule`(종목 페이지)
- 통합: HomeClientV5(카드→뉴스→HOT토론), StockPageClient(뉴스→토론)

### 의미: "운종 = 오르내림 + 대화 + 정보(뉴스)" 4박자 완성
### 동작 전제 / 잔여
- RSS·Yahoo 라이브 fetch → Vercel 배포 환경 실데이터 검증 권장 (로컬 차단 시 graceful 안내)
- 종목 한국뉴스: name_ko 부분일치 → 네이버 검색 API(키) 통합 시 정확도↑

## STEP 120 (2026-05-31) — 종목 페이지 마무리 (좋아요·신고 + 차트 + 미장 Yahoo) ✅

### 변경
- `DiscussionItem.tsx` 분리: 좋아요(discussion_likes 토글) + 신고(discussion_reports confirm) + 비로그인 amber 안내(3초)
- `DiscussionBoard`: likedIds 미리 로드해 초기 liked 표시, 댓글 버튼 disabled
- `StockInfoPanel`: 60일 일봉 차트 inline(lightweight-charts dynamic, 한국만) + 미국주식 Yahoo quote 가격·등락률 통합

### 동작 전제
- 좋아요·신고 DB insert = 카카오 OAuth 활성화 + 017 적용 후. 비로그인은 안내 차단
### 잔여
- 토론 댓글, 미국주식 시고저·52주·PER(quoteSummary)·종목명 → 추후

## STEP 117 (2026-05-31) — 새 홈 + dashboard 처분 + V3 2차 청소 ✅

### 신규
- `/` 새 홈 (`HomeClientV5`): 3컬럼 — 좌 채팅+활발한 채팅방 / 중 시장 핫 이슈 카드 4종+HOT 토론 / 우 관심종목
- `home-v5` 모듈: HotDiscussionsModule(24h 좋아요 TOP10), HotChatRoomsModule(24h 메시지 TOP5)

### 삭제
- `app/dashboard` + V3 12개 페이지(briefing/analysis/chat/chart/orderbook/ticks/disclosures/investor-flow/movers/net-buy/news/themes/market-map)
- `components/home`·`widgets`(28개)·`chat`(FloatingChat)

### 보존 판단
- `app/api/home/*` 보존 — disclosures 가 V5 ScalperDisclosureCard 에서 사용 중
- `app/global` 보존(목록 외)

### 이연
- 고아 컴포넌트 dirs 다수(analysis/briefing/stocks/news/dashboard 등), chatStore, TopNav → 추후 일괄 청소
- 다음: STEP 119 Vercel 배포

### 운종 V5 최종 구조
- / · /kr · /us · /stock/[code] · /screener · /calendar · /auth/* · /mypage

## STEP 115 (2026-05-31) — 종목 페이지 + 토론 + 종목별 채팅 (V5 핵심) ✅

### 신규
- `/stock/[code]` — 운종 본질 페이지. 좌(StockInfoPanel 320) · 중(DiscussionBoard) · 우(StockChatPanel 380) 3컬럼 sticky
- DB 마이그레이션 017: discussions / discussion_likes / discussion_reports + chat_messages.symbol + 트리거/RLS/Realtime
- 컴포넌트 4종: StockPageClient, StockInfoPanel(KIS 30초 폴링), DiscussionBoard(HOT/최신·글쓰기·좋아요/신고 UI), StockChatPanel(symbol 필터 실시간)

### 동선
- 검색(HeaderSearch)·관심종목(WatchlistPanel)·카드(Movers/Volume/NetBuy/장타공시/M7/UsMovers) 클릭 → /stock/[code] (setSelectedSymbol 유지 + router.push)

### 정책
- 토론 읽기 비로그인 OK / 글쓰기 로그인 필요 · 채팅 비로그인 OK · 신고 5건↑ 자동 hidden

### ⚠️ 후속
- Cowork: 마이그레이션 015·016·017 순서 적용 (017 전엔 토론·종목채팅 빈 화면)
- 다음 STEP: 좋아요/신고/댓글 동작, 미국주식 Yahoo 통합, 차트 → 추후 / STEP 117 새 홈

## STEP 118 (2026-05-31) — Layer 3 인증 (카카오 OAuth) ✅

### 변경
- 인증: 이메일/비밀번호 → **카카오 OAuth 단일**. `app/auth/signup` 삭제, `login` V5 재작성, `callback` 정리
- DB 마이그레이션 016 동봉: users 결제 컬럼 제거 + tier(1·2·3)·bio·oauth_provider 추가 + handle_new_user 트리거 + RLS
- 코드: types/user.ts(결제 필드 제거+tier), authStore(tier), nicknameStore(로그인 우선), permissions.ts 삭제(미사용 고아), mypage subscription 필드 정리
- 정책: 인증 선택사항 (비로그인도 채팅·관심종목 가능, 로그인 시 영구화)

### 🔴 사용자 직접 작업 (인증 활성화 전제)
1. 카카오 Developers 콘솔: 앱 등록 + Redirect URI + REST API 키
2. Supabase Dashboard: Kakao Provider ON + 키 입력
→ Cowork: 마이그레이션 015 + 016 Supabase MCP 적용

### 이연
- mypage 구독/결제 탭 V3 잔재, dashboard/V3 `/stocks` 링크 → STEP 117

## STEP 116 (2026-05-31) — V3 잔재 1차 청소 ✅

### 삭제
- 페이지 9개: `ad`·`advertiser`·`admin`·`partner` (OTMarketing 잔재), `payment`·`pricing` (결제 X), `toolbox`, `stocks`·`watchlist` (V4 대체)
- API 3개: `api/payment`·`api/advertiser`·`api/admin`
- 컴포넌트 2개: `PaywallModal` + `AuthGuard` (사용처가 전부 삭제 폴더 → 0 사용)

### 보존 (STEP 117 에서 재결정)
- `dashboard` + `HomeClient` + `widgets/*` + `FloatingChat`
- V3 13개 페이지: briefing/analysis/chat/chart/orderbook/ticks/disclosures/investor-flow/movers/net-buy/news/themes/market-map
- `auth`·`mypage` (Layer 3 활용)

### 링크 정리 (404 방지)
- Header `/stocks` 제거, WatchlistWidget·mypage 의 `/stocks`·`/watchlist`·`/pricing` → `/kr` 또는 제거, Footer `/advertiser` → mailto

### 이연
- 보존 V3 페이지 내부 컴포넌트의 `/stocks/*` 링크 다수 → STEP 117
- 고아 `components/layout/TopNav.tsx` → 추후

## STEP 114 (2026-05-31) — 운종 V5 1차 리뉴얼 (구조 통합) ✅

### 배경 (사용자 결정)
- "단타/장타/미장 분리는 인위적, 사용자는 종목 자체로 봄" → **3창 → 2창 (한국/미국)**
- "카드 21개 중 정확도 보장되는 9개만 본질" → **21개 → 9개** (나머지는 네이버/키움/FnGuide 가 더 잘함 → 허브로 연결)
- "호가창·체결은 전문가용, 운종 페르소나 X" → **종목 상세 4탭 → 2탭**
- "같은 종목인데 채널 분리는 인위적 (희석)" → **채팅 3채널 → 1채널 (general)**
- "토스 1984px vs 운종 1536px 차이로 좁아 보임" → **컨테이너 1984px**

### 변경 결과
- 라우트: `/scalper`·`/longterm` 삭제 → `/kr` 통합, `/us` 유지, redirect 영구 처리
- 카드: 한국 5 (`KrCards.tsx`) + 미국 4 = 9개. 12개 컴포넌트·시드 제거
- 종목 상세: 차트·종합 2탭 / 채팅: 운종 전체 채팅 1채널
- 빌드 ✓ Compiled successfully (TS/ESLint 0)

### ⚠️ 후속 필수
- `supabase/migrations/015_chat_unify.sql` — **Cowork 가 Supabase MCP 로 별도 적용** (Claude Code 직접 적용 X)
- 다음: STEP 115 (종목 페이지 + 토론 게시판 + 종목별 채팅 + 인증)

## 세션 #25 (2026-05-27) — 운종(雲從) 브랜드 + Layer 0 + 21개 카드 디테일 완성

### 핵심 결정 사항
- **브랜드**: Stock Terminal → **운종(雲從) · UNJONG** 확정 (한자는 표기 X, 영문+한글만)
- **도메인**: onetrillion.app (보유) 메인 + unjong.com 보호 (Layer 6 구매 예정)
- **글로벌**: 영어판 X, 국가별 별도 페이지 (Layer 7+)
- **포지셔닝**: 한국 주식 동선의 출발점 (정보·대화·허브·신뢰 4박자)
- **거래 X**: 증권사 라이선스 X, 정보+대화+허브만

### 화면 구조 (Layer 0 확정)
- **헤더 4단 (sticky)**:
  - 1단: UNJONG 운종 + 통합 검색박스 + 한국기·알림·즐겨찾기·프로필
  - 2단: 글로벌 티커 (TradingView 실시간 위젯 — 이미 실데이터)
  - 3단: [⚡단타창][🌳장타창][🌙미국주식창] + 🔍 종목발굴(Screener) · 📅 경제캘린더(Calendar)
  - 4단: ContextNav — 창별 카드 7개 메뉴 자동 변경 (앵커 점프 + 금색 깜박임)
- **3컬럼 본문**:
  - 좌측 (300px, sticky): 채팅 500px 고정 + Layer 2 광고 placeholder
  - 우측 영역: 1행 (종목상세 flex-1 + 관심종목 300px) + 2행~ 카드 풀폭 (관심종목 영역 침범)

### 21개 카드 (3창 × 7) — 100% 시각화 완성
- **단타창**: 🚀 Movers · 🔥 Volume · 🚨 VI · 💰 NetBuy+거래원 · 📄 공시 · 🎯 테마 · ⚠️ 공매도
- **장타창**: 📊 공시 · 📅 분기실적 · 💎 저평가 · 💰 배당TOP · 📉 52주신저가 · 🗺️ 섹터 · ⚠️ 관리종목
- **미국주식창**: 🌐 지수+VIX · 🌅 Pre/After · ⭐ M7 · 🇺🇸 Movers · 💱 환율+시계 · 📰 뉴스+8K · 📅 FOMC

### 21개 디테일 페이지 (동적 라우트)
- `app/(windows)/{scalper,longterm,us}/[card]/page.tsx` 3개 동적 라우트
- 21개 URL 자동: `/scalper/movers`, `/longterm/value`, `/us/m7` 등
- 카드 헤더의 "더보기 →" 클릭 시 진입
- 디테일 페이지: ← 뒤로가기 + 카드 타이틀 + 필터/정렬 placeholder + Layer 1 안내
- 디테일 페이지에서도 좌측 채팅 + 1행 유지 (운종 정체성)

### 광고 모델 (Layer 2~3 예정)
- Tier 1: 🏛️ 금융위 인증 (증권사·은행·자산운용사)
- Tier 2: ▶️ 운종 검증 (유튜브·텔레그램·전문가·강의)
- Tier 3: 일반 AD 라벨 (회색 톤)
- 광고 위치: 좌측 채팅 아래 Layer 2 placeholder + 메인 카드 하단

### Layer 0 완료 — 세션 #25 전체 커밋 히스토리
- ✅ STEP 88 (`892c662`) — 운종 브랜드 적용
- ✅ STEP 89 (`e8bc870`) — 3창 라우트
- ✅ STEP 90 (`052c439`) — 헤더 고정
- ✅ STEP 91 (`13ae6c4`) — 좌측 사이드
- ✅ STEP 92 (`ef1bf4d`) — 메인 카드 3개씩
- ✅ STEP 93 (`7026306`) — 우측 사이드패널
- ✅ STEP 94 (`954e59f`) — V3 → /dashboard 강등
- ✅ STEP 96 (`c0bbff0`) — 단타창 카드 4개 추가
- ✅ STEP 97 (`c08696d`) — 장타창 카드 4개 추가
- ✅ STEP 95-A revert (`9b1676f`) — 잘못된 V3 헤더 제거 롤백
- ✅ STEP 95-C (`8441316`) — 헤더 4단 통합 + ContextNav
- ✅ STEP 95-D (`03fd1ed`) — 미세조정 7개
- ✅ STEP 95-E (`ea52558`) — 3컬럼 구조
- ✅ STEP 95-E1 (`8c7dc6a`) — 차트 풀폭 핫픽스
- ✅ STEP 95-F (`cf5835e`) — 카드 풀폭 (관심종목 침범)
- ✅ STEP 98+99 (`8890620`) — 미국주식창 4개 + 카드 디테일 21개

### 신설 문서
- `docs/PRODUCT_SPEC_V4.md` — 운종 V4 비전·구조·레이어
- `docs/BRAND_IDENTITY.md` — 브랜드 이름·색·도메인·태그라인
- `docs/STEP_88~99_COMMAND.md` — 각 STEP 명령서 (총 16개)

### 신설 컴포넌트
- `components/header/`: Header (V3 골격, UNJONG 운종) · TickerBar (TradingView) · MainNav · ContextNav
- `components/sidebar/`: ChatPanel · WatchlistPanel · UnjongSidebar (deprecated)
- `components/sidepanel/`: StockDetailPanel (inline 모드)
- `components/cards/`: CardContainer · CardDetail · ScalperCards · LongtermCards · UsCards
- `stores/unjongSelectedSymbolStore.ts`

### 다음 (Layer 1) — 3가지 후보
1. **Layer 1-A**: 21개 카드 더미 → 실 API (KIS · DART · Yahoo · KRX) — 5~7일
2. **Layer 1-B**: Supabase Realtime 채팅 실시간 — 3~4일
3. **Layer 1-C**: 글로벌 티커 강화 + 카드 → 우측 패널 연결 — 1~2일

추천 순서: 1-C → 1-A → 1-B

## 프로젝트 개요
- **서비스 정의**: 글로벌 개인투자자용 통합 데이터 터미널 플랫폼
- **포지셔닝 (V3 확정)**: "전업투자자 = 일반인 (일반투자자가 되고싶은 상위 1%)" — Aspirational Design
- **핵심 전략**: 전업투자자가 보는 데이터 환경을 일반 투자자에게 **완전 무료**로 제공, 수익은 Partner-Agnostic Lead Gen 으로만 발생 (V3 확정)
- **UI 철학**: Bloomberg/Koyfin 표준 Bento Grid + 단일 지속 채팅 + 투자자 도구함(Link Hub)
- **수익 모델 (V3 단일)**: **Partner-Agnostic Lead Gen 만.** 구독/결제/Pro/AI 리포트/CSV/À la carte — **전부 제외**
  - Phase 1 (즉시): 랜딩페이지 인프라 + Lead Gen (한국 5~10만원/리드)
  - Phase 2 (5~12주): 트래픽 확보 + 리드 퀄리티 스코어 + 파트너 슬롯 확장
  - Phase 3 (12개월+): 글로벌 시장 + 광고 인벤토리 세분화 — **여전히 구독 없음**
- **데이터 소스**: 100% 무료 (DART/KRX/KIS/FDR/Naver/ECOS) — KIS 서버사이드 연동 완료로 비로그인 이용자도 실시간
- **기술 스택**: Next.js 16 + TypeScript + Tailwind CSS + Supabase + Zustand + Recharts + TradingView 위젯
- **배포**: Vercel + Supabase Cloud
- **결제 연동**: **없음** — 토스페이먼츠/Paddle 연동 코드 작성 금지 (별도 의사결정 전까지)

## 현재 TODO (Layer 별 — 2026-05-27 GC 완료)

### ✅ Layer 0 — 완성 (세션 #25)
- [x] 운종(雲從) 브랜드 적용
- [x] 3창 라우트 (`/scalper` `/longterm` `/us`)
- [x] 헤더 4단 통합 (V3 + 운종)
- [x] 3컬럼 레이아웃 (채팅·메인·관심종목)
- [x] 21개 카드 시각화 (3창 × 7)
- [x] 21개 디테일 페이지 (동적 라우트 3개)
- [x] V3 5섹션 → `/dashboard` 강등 (보존)
- [x] 카드 더보기 + 뒤로가기

### ✅ Layer 1-B — 완성 (세션 #27, 2026-05-29)
- [x] ChatPanel 더미 제거 → Supabase Realtime 실시간 (STEP 106)
- [x] 닉네임 store (Zustand persist, 트레이더-XXXX)
- [x] 3창 채팅방 분리 (scalper/longterm/us)
- [x] postgres_changes subscribe + 자동스크롤 + Enter 전송
- [x] 마이그레이션 014_chat_rooms.sql (room+nickname 컬럼, RLS 익명)
- ⚠️ **Supabase Dashboard 에서 014 SQL 실행 필수** (사용자 직접)

### ✅ Layer 1-A — 완성 (세션 #26, 2026-05-29)
- [x] 단타창 7/7 카드 실데이터 (STEP 101~103) — KIS API
- [x] 장타창 7/7 카드 실데이터 (STEP 104) — DART + DB + KIS
- [x] 미국주식창 7/7 카드 실데이터 (STEP 105) — Yahoo Finance
- [x] 카드 → setSelectedSymbol 15개 연결 (STEP 100)
- [x] **21/21 카드 100% 실데이터 완성** 🏁

### 🚧 Layer 1-B — 다음 (Supabase Realtime 채팅)

#### Layer 1-B: Supabase Realtime 채팅 (3~4일)
- [ ] 좌측 채팅창 더미 → 실시간 송수신
- [ ] 닉네임 시스템 (Layer 4 점수제 별도)
- [ ] 채팅 메시지 영구 저장 (Supabase)
- [ ] 단타·장타·미장 채팅방 분리

### 🚧 Layer 1-A2 — 보완 (선택)
- [ ] 테마 종목 매핑 확장 (현재 THEME_MAP 10개 × 3~4종목)
- [ ] KRX 공매도 자동 수집 (현재 시드 데이터)
- [ ] 관리종목·투자유의 KRX 자동 수집 (현재 시드)
- [ ] NetBuyBrokerCard 거래원 TOP3 (현재 "—" 하드코딩)

### 📦 Layer 2 — 광고 허브 (Layer 1 후)
- [ ] 좌측 채팅 아래 Layer 2 placeholder → 실 광고 카드
- [ ] 메인 카드 하단 광고 영역 신설 (증권사·전문가)
- [ ] 광고 카드 디자인 (Tier 3단계)
- [ ] 참고 사이트 모아보기 (헤더 메뉴)
- [ ] V3 의 link_hub 56건 데이터 재활용

### 🏛️ Layer 3 — 인증 시스템 (Layer 2 후)
- [ ] DB 스키마 확장 (`partners.verification_tier`, `verification_badge` 등)
- [ ] 인증 마크 디자인 (Tier 1·2·3)
- [ ] 운영자 어드민 (검증 워크플로우)
- [ ] 광고주 신청 페이지 (`/partner/apply`)
- [ ] 24~48시간 검증 응답 시스템

### 🛡️ Layer 4 — 모더레이션 (베타 직전)
- [ ] 채팅 리딩방 광고 자동 필터링
- [ ] "매수/매도 추천" 발언 자동 모더레이션
- [ ] 사용자 신고 + 누적 점수
- [ ] 닉네임 정확도 점수제

### 🔍 Layer 5 — 통합 검색 + AI 봇 (차별화)
- [ ] 통합 종목 검색 — 한 종목 → 모든 출처 결과
- [ ] @운종AI 채팅 봇 (GPT-4o-mini)
- [ ] AI 분석 자동 종목 추천

### 🚀 Layer 6 — 배포·도메인·영업
- [ ] unjong.com + unjong.app 도메인 구매 ($21)
- [ ] Vercel 배포 + onetrillion.app 연결
- [ ] 환경변수 점검 (KIS/DART/Supabase/OpenAI)
- [ ] Supabase RLS 재검증
- [ ] 광고주 영업 시작 (증권사 7곳 + 유튜버 5~10곳)

### 별도 작업 (Layer 무관)
- [ ] ESLint cleanup — `set-state-in-effect` 63건 일괄 정리 (비차단 경고)
- [ ] 모바일/태블릿 반응형 (3컬럼 → 1컬럼)
- [ ] `/screener`, `/calendar` 보조 페이지 실제 작동 (현재 placeholder)

### 완료 아카이브 (참고)
- ~~Vercel 첫 배포~~ → Layer 6 으로 이전
- ~~DisclosureStreamWidget US~~ → 미국주식창 News+8K 카드로 통합
- ~~GlobalIndicesWidget Sparkline~~ → TradingView 실시간 위젯으로 대체
- ~~SESSION_KICKOFF self-update 루틴~~ → 세션 #25 종료 시 정착 완료
- ~~5섹션 대시보드 V3~~ → `/dashboard` 로 보존

### P4 — 1개월+
- [ ] 일본(TSE) / 홍콩(HKEX) 시장
- [ ] 영어 버전 글로벌 확장
- ~~[ ] 토스페이먼츠/Paddle 결제~~ → V3 에서 영구 폐기
- ~~[ ] 광고주 배너 등록 시스템~~ → Partner-Agnostic Landing 으로 대체

---

## 완료 아카이브

> 완료된 세션·STEP 로그. 가장 최근이 위에, 과거가 아래로.

### 2026-04-23 — STEP 87 완료
- yahoo-finance2 v3 인스턴스화 핫픽스 (섹터 API KR·US 복구)
- 섹터 히트맵 모바일 반응형 (grid-cols-2 → md:3 → lg/xl:4)
- 섹터 타일 title 툴팁 + cursor-help
- 종목 클릭 → 호가창 동기화 (VolumeTop10 + NetBuyTop 2개 위젯)

### 2026-04-23 — STEP 86 완료
- 신규 화면 3개: /market-map (섹터 히트맵 드릴다운), /themes (테마주 Top10), /disclosures (2컬럼 리팩토링)
- TopNav: '섹터 지도' /market-map + '테마주' /themes 링크 추가

### 2026-04-23 — STEP 85 완료
- 데이터 품질 4개 버그 수정 (sectors KR 폴백 / movers 로그 / screener ETF 필터 / news 키워드 필터)

### 2026-04-23 세션 — STEP 75~82 완료 (V3 대시보드 풀 구현)
- [x] STEP 75: Section 1 보강 — 배당수익률, DART BS/CF, SEC EDGAR 공시
- [x] STEP 76: Section 2 Pre-Market & Global — BriefingWidget + GlobalIndicesWidget 5그룹
- [x] STEP 77: FloatingChat 전역화 (3상태), layout.tsx 주입
- [x] STEP 78: Section 3 Discovery — ScreenerExpandedWidget + MoversPairWidget
- [x] STEP 79: Section 4 Market Structure — SectorHeatmapWidget + ThemeTop10Widget
- [x] STEP 80: Section 5 Information Streams — NewsStream + DisclosureStream + EconCalendar
- [x] STEP 81: 체결창/호가창 폴리싱 — fadeIn, 대량체결배지, depth bar, selectedSymbol 동기화
- [x] STEP 82: QA — 빌드 OK, console.log 없음, V3_RELEASE_NOTES.md 생성

### 2026-04-22 세션 — STEP 74 완료
- [x] STEP 74: Section 1 반응형 + persist + FAB 토글
  - selectedSymbolStore: zustand persist 미들웨어, key=selected-symbol
  - mounted 플래그: SnapshotHeader / OverviewTab / NewsTab / DisclosuresTab / FinancialsTab 5곳
  - Section 1 grid 3단계 반응형: xl(≥1440)=280/1fr/360 / lg(≥1280)=240/1fr/320 / <lg=240/1fr
  - StockDetailToggle.tsx: lg 미만 FAB + 슬라이드 오버레이
  - 중앙 컬럼 min-w-[480px] 보장

### 2026-04-22 세션 — STEP 73 완료
- [x] STEP 73: 뉴스·공시·재무 탭 상세 콘텐츠 + StockDetailPanel 탭 라우팅 확장
  - NewsTab.tsx: useEffect+fetch → /api/stocks/news, 50건 리스트, 상대시간 표시
  - DisclosuresTab.tsx: KR=DART /api/stocks/disclosures, US=SEC TODO
  - FinancialsTab.tsx: KR=earnings API 손익계산서 실데이터, 재무상태·현금흐름 TODO
  - StockDetailPanel: overview/news/disclosures/financials 4탭 완전 라우팅

### 2026-04-22 세션 — STEP 72 완료
- [x] STEP 72: 종합 탭 5블록 실데이터 연결
  - 블록1(핵심투자지표): KIS price API — per/pbr/marketCap/high52w/low52w, dividendYield=—
  - 블록2(수급미니): KIS investor API — 당일·5일 외인/기관/개인, KR전용
  - 블록3(뉴스): Google News RSS `/api/stocks/news?limit=3`
  - 블록4(공시): DART `/api/stocks/disclosures?limit=3` — US=SEC TODO
  - 블록5(재무미니): DART earnings `/api/stocks/earnings` — quarters[-4:] CSS 막대
  - StockDetailPanel: 가격 1회 페치 후 Header·OverviewTab 공유, 종목 변경 시 탭 overview로 초기화

### 2026-04-22 세션 — STEP 71 완료
- [x] STEP 71: selectedSymbolStore 신설 + WatchlistWidget 클릭 핸들러 연결 (Case A)
  - stores/selectedSymbolStore.ts: code/name/market Zustand 스토어
  - WatchlistWidget: 종목명 Link에 onClick → setSelected (inferMarket 헬퍼 포함)
  - SnapshotHeader: 스토어 구독 (종목명·코드·시장 표시)
  - components/dashboard/tabs/OverviewTab.tsx: 5블록 구조 골격 (Coming soon)
  - StockDetailPanel: overview 탭에 OverviewTab 연결, 탭 전환 prop 전달

### 2026-04-22 세션 — STEP 70 완료
- [x] STEP 70: Section 1 3컬럼 레이아웃 + 우측 종목상세 패널 스켈레톤
  - components/dashboard/ 폴더 신설
  - DetailTabs.tsx / SnapshotHeader.tsx / StockDetailPanel.tsx 신규
  - HomeClient Section 1 = 3컬럼 grid (280px / 1fr / 360px, h-680px)
  - 중앙 컬럼: ChartWidget(60%) / OrderBookWidget(25%) / TickWidget(15%)
  - 좌측: WatchlistWidget / 우측: StockDetailPanel (스켈레톤)

### 2026-04-22 세션 — STEP 69 완료 (docs only)
- [x] STEP 69: Dashboard Spec V3.2 — Section 1 우측 컬럼 확정 (스냅샷 헤더 + 탭 4개, 종합 블록 5개)

### 2026-04-22 세션 — STEP 59~66 완료 (commit 6cbf55a, 8 STEP 일괄)
- [x] STEP 59: /global — Yahoo Finance 35개 심볼 실데이터 (8섹션 필터)
- [x] STEP 60: /briefing — 3-컬럼 (미증시/공시/경제지표) 실데이터
- [x] STEP 61: VerticalNav 14 flat → 5그룹 (시세/정보/일정/글로벌/도구), hover 54↔220px (Task #25 해결)
- [x] STEP 62: News — 소스 배지 URL 프리셋, 기간/중요 필터
- [x] STEP 63: Calendar — 기간·국가·중요도 3-세그먼트, importance= 프리셋
- [x] STEP 64: Analysis — 테마 상승/하락 토글, 전체 테마 4-컬럼 그리드, theme= 하이라이트
- [x] STEP 65: Chat — $종목코드 자동 링크, /chat 풀페이지화
- [x] STEP 66: Ticks — 심볼 인풋, 통계 패널+50건 테이블, /ticks 풀페이지화
- [x] 누계: 28 files changed, +3482 / -290
- [x] **P0/P1 위젯·페이지 전량 실데이터 전환 완료** — 런칭 가능 수준 UI 달성

### 2026-04-22 세션 — STEP 58 완료
- [x] NetBuyTopWidget 외국인/기관·매수/매도 이중 토글 + 막대 시각화
- [x] /api/kis/investor-rank sort+market 파라미터
- [x] net-buy TopTab 3-세그먼트 (Who/Mode/Market) + URL 프리셋

### 2026-04-22 세션 — STEP 57 완료
- [x] VolumeTop10Widget 배수 막대 시각화 + 급등 뱃지
- [x] MoversVolumePageClient 신설 (시장구분·정렬 필터, 30종목)
- [x] /movers/volume 스텁 → Suspense 래퍼로 교체

### 2026-04-22 세션 — STEP 56 완료
- [x] MoversTop10Widget 상한가/하한가 강조 + 뱃지 + href 동적화
- [x] MoversPricePageClient 신설 (상승/하락·시장구분·상한가만 필터, 30종목)
- [x] /movers/price 스텁 → Suspense 래퍼로 교체

### 2026-04-22 세션 — STEP 55 완료
- [x] dart-classify.ts 공용 유틸 신설
- [x] DartFilingsWidget 중요 토글 + 뱃지 + href 동적화
- [x] DisclosuresPageClient 화이트 테마 + 시장구분·중요 필터 + 유형 뱃지 컬럼

### 2026-04-22 세션 — STEP 54 완료
- [x] /orderbook 풀스크린 10단 (종목 요약 + 호가 + 총잔량 게이지)

### 2026-04-22 세션 — STEP 53 완료
- [x] OrderBookWidget 키움 스타일 리팩토링 (3-col · 총잔량 푸터 · 심볼 입력)

### 2026-04-22 세션 — STEP 52B
- [x] 중복·미사용 파일 정리 (17개 파일 삭제)

### 2026-04-22 세션 — STEP 52 완료
- [x] /chart 풀스크린 차트 페이지 (lightweight-charts + TradingView)
- [x] 기간 토글 D/W/M + OHLCV 30행 테이블 (KRX)
- [x] ChartWidget href 동적화 (?symbol=)

### 2026-04-22 세션 — STEP 51 완료
- [x] WatchlistWidget: 전일비 컬럼 추가 (grid-cols-5, change 필드, 종목명 Link)
- [x] WatchlistPageClient: 인라인 추가 폼 (6자리 검증), 8-컬럼 토글 정렬, 전일비 컬럼

### 2026-04-22 세션 — STEP 50 완료
- [x] 홈 위젯 14개 + 상세 페이지 14개 레퍼런스 플랫폼 매핑
- [x] `docs/REFERENCE_PLATFORM_MAPPING.md` 생성
- [x] `docs/REFERENCE_PLATFORM_MAPPING.xlsx` 생성 (우선순위 색상 코딩, 3탭)
- [x] P0 = 11개 / P1 = 13개 / P2 = 5개 분포 확정
- [x] 주 벤치마크 플랫폼 6개 확정 (네이버증권, TradingView, Koyfin, Finviz, Investing.com, 키움 영웅문)

### 2026-04-22 세션 — STEP 49 완료
- [x] 홈 위젯 13개 href 감사 — 11개 이미 정확
- [x] VerticalNav '시장 지도' `/analytics` → `/analysis` 수정
- [x] `app/analytics/` 디렉토리 삭제 (중복)
- [x] `WidgetShell.tsx` 삭제 (미사용)
- [x] ScreenerMini 우상단 ↗ 아이콘 추가
- [x] 빌드 검증 통과

### 2026-04-22 세션 — STEP 48 완료
- [x] STEP 47 드로워 오버레이 인프라 제거
- [x] `app/@panel/` 삭제
- [x] `DetailDrawer.tsx` 삭제
- [x] `app/layout.tsx` panel slot 제거
- [x] 빌드 검증 통과
- [x] 평범한 페이지 라우팅으로 회귀 — `/net-buy` 패턴과 동일하게 동작

### 2026-04-22 세션 — STEP 47: URL 라우팅 인프라 + 드로워 패턴 ✅
- Parallel Routes `app/@panel/` + `app/layout.tsx` panel 슬롯 추가
- Intercepting Route `app/@panel/(.)screener/` — 내부 네비 시 드로워, 직접 URL 시 풀페이지
- DetailDrawer, WidgetShell 공통 컴포넌트 신규
- `app/link-hub/`, `app/filings/` 구버전 제거
- VerticalNav + DartFilingsWidget `/filings` → `/disclosures` 교체
- 인터셉팅 마커 수정 사항: `(..)` → `(.)` (루트에선 동일 세그먼트 마커)

### 2026-04-22 세션 — STEP 46: 스크리너 팩터 업그레이드 ✅
- Migration 013 stock_snapshot_v view — stocks/quant_factors/dividends LEFT JOIN LATERAL 집계
- API route 팩터 필터 + 화이트리스트 기반 정렬 지원
- ScreenerClient 프리셋 3→8종, 필터 5종 추가, 컬럼 3종 추가, 정렬 UI
- 누계 DB 변화 없음 (view 신설만)
- 5개 분석 탭 완성 이후 첫 유저 노출 단계 — 스크리너가 팩터 자산 활용 UX 1순위 진입점

### 2026-04-22 세션 — STEP 45 완료 ✅ 5개 분석 탭 전원 live
- [x] `supabase/migrations/012_quant_factors.sql` 신규 (Management API로 적용)
- [x] `scripts/seed-quant-factors.py` 신규 작성 (TOP 200 Value/Momentum/Quality 퍼센타일)
- [x] quant_factors 테이블 200행 시딩
- [x] QuantAnalysis.tsx 재작성 (종합 스코어 + 3팩터 카드 + RadarChart + 원시 지표 테이블)
- [x] 빌드 성공 (타입 에러 0건)
- **누계 DB**: stocks 2,780 / financials 576 / stock_prices 54,899 / supply_demand 3,000 / dividends 790 / quant_factors 200
- **마일스톤**: 종목 상세 /analysis 5개 탭 전원 실데이터 연결 완료

### 2026-04-22 세션 — STEP 44 완료
- [x] `scripts/seed-dividends.py` 신규 작성 (DART alotMatter.json)
- [x] dividends 테이블 790행 시딩 (TOP 200 × 최대 6년, 삼성전자 6년 검증 완료)
- [x] DividendAnalysis.tsx 재작성 (4지표 카드 + DPS 바차트 + yield·payout 라인)
- [x] 빌드 성공 (타입 에러 0건)

### 2026-04-22 세션 — STEP 43 완료
- [x] `scripts/seed-supply-demand.py` 신규 작성 (KIS FHKST01010900)
- [x] supply_demand 테이블 3,000행 시딩 (100종목 × ~30영업일, 실패 0건)
- [x] SupplyAnalysis.tsx 재작성 (합계 카드 + 스택 바 + 누적 라인 + 5일 테이블)
- [x] 빌드 성공 (타입 에러 0건)
- [ ] STEP 44: DART 배당 공시 수집 → DividendAnalysis 재활성화

### 2026-04-22 세션 — STEP 42 완료
- [x] `stock_prices` 시딩 완료: 200종목 × 1년 일봉, 54,899건 (실패 0건)
- [x] `StockPrice` 타입 추가 (`types/stock.ts`)
- [x] TechnicalAnalysis.tsx 재작성 (스텁 → MA·볼린저·RSI·거래량 실차트)
- [x] 빌드 성공 (타입 에러 0건)
- [ ] STEP 43: KIS per-stock investor-flow 수집 → SupplyAnalysis 재활성화
- [ ] STEP 44: DART 배당 공시 수집 → DividendAnalysis 재활성화

### 2026-04-22 세션 — STEP 41 완료
- [x] Quant/Dividend/Technical/Supply 4개 탭 정직 스텁 교체 (1,331→140줄)
- [x] 빌드 성공 (타입 에러 0건)
- [ ] STEP 42: stock_prices 시딩 → TechnicalAnalysis 재활성화
- [ ] STEP 43: KIS per-stock investor-flow 수집 → SupplyAnalysis 재활성화
- [ ] STEP 44: DART 배당 공시 수집 → DividendAnalysis 재활성화
- [ ] STEP 45+: 시장 전체 팩터 집계 → QuantAnalysis 재활성화

### 2026-04-22 세션 — STEP 40 완료
- [x] ValueAnalysis.tsx 전면 재작성 (315줄 → ~150줄, 가짜값 제거 + DART 실재무 연결)
- [x] 빌드 성공 (타입 에러 0건)
- [x] 삼성전자·SK하이닉스·현대모비스 페이지 200 OK 확인
- [ ] STEP 41 후보: QuantAnalysis / DividendAnalysis 동일 방향 정리 / 분기 재무 수집

### 2026-04-22 세션 — STEP 39 완료
- [x] `scripts/debug-dart-sample.py` 신규 (DART raw 응답 덤프 도구)
- [x] 4종목 null 근본 원인 진단 — IS 섹션 없이 CIS 단일 포괄손익계산서만 제출
- [x] `seed-dart-financials.py` 파서 전면 개선 (1·2차 매칭 분리, IS→CIS fallback, CFS→OFS fallback, keyword 확장)
- [x] `lib/dart-financial.ts` 동일 방향 동기화 (런타임 API 정확도 확보)
- [x] STEP 38 누락 4종목 (SK하이닉스·한화에어로·삼성바이오·HD현대중공업) 전원 복구
- [x] `TOP_N=100 YEARS='2023,2024'` 배치 → financials 193건 upsert (누계 576건)
- [x] 테마 50종 중 37종 DART 커버 확인
- [ ] STEP 40 후보: ValueAnalysis.tsx UI 연결 / 분기 보고서 수집 / 테마 50 풀커버

### 2026-04-22 세션 — STEP 38 완료
- [x] `scripts/seed-dart-financials.py` 신규 작성 (DART IS+BS 수집 파이프라인)
- [x] `dart_corp_codes` 3,959건 매핑 완료
- [x] `financials` 테이블 18건 upsert (시총 TOP 10 × 2023,2024 연간, 총 누계 401건)
- [x] 삼성전자 2023/2024 연간 매출·영업이익 검증 완료

### 2026-04-22 세션 — STEP 37 완료
- [x] KIS 재무 스냅샷 시딩 (`financials` 192건 → 누계 383건)
- [x] OverviewTab KPI 그리드 PER/PBR/EPS/BPS 활성화 확인 (삼성전자 PER 33.14)

### 2026-04-22 세션 — STEP 36 완료
- [x] Supabase stocks 테이블 시딩 (KOSPI 949 + KOSDAQ 1820 = 2,780건)
- [x] link_hub 56건 재시딩
- [x] 테마 37개 종목 🔒 해제 확인 (source: supabase로 전환)

### Session #23 완료 (2026-04-22) — 사이드바 통합 후 레이아웃 정렬 대수술 (Step 20~27)
- **배경**: 세션 #22 사이드바 통합 후 대시보드가 사이드바 크기(w-14 ≈ 45px)만큼 박스 밖으로 오버플로우. 기존 grid가 1536 기준이고 Main은 1490 가용이라 불일치.
- **Step 20**: User Flow 아키텍처 재구성 (Col 1 정보→탐색→결정 / Col 2 분석→주문 / Col 3 이벤트 스트림 / R4 랭킹)
- **Step 20a~21**: VerticalNav `self-start`로 sticky 안정화
- **Step 22**: LayoutShell Step 19 복원 — Header/Ticker/Footer 모두 1536 풀폭
- **Step 23**: Footer `pl-16 pr-4` 픽셀 수동 맞춤 시도 (실패)
- **Step 24**: Footer 내부를 sidebar+main 구조 미러링 — Tailwind 클래스 동일화로 서브픽셀 오차 무시하고 정렬 성공
- **Step 25**: outer grid mins 280/640/300 → 240/560/280 축소 (R4 오버플로우 해결)
- **Step 26**: outer grid `minmax(0, Nfr)` 변경 (track level 차단)
- **Step 27 (최종)**: section div에 `minWidth: 0 + overflow: hidden` 추가 (item level 차단) — 3단 방어선으로 완전 해결
- **9개 커밋 (53271dd → 290ec82)**, STEP_20~27_COMMAND.md 8개 아카이브
- **교훈**: CSS Grid 오버플로우는 track + item 양쪽 min-width를 모두 막아야 완전 차단. 픽셀 계산보다 구조 미러링이 안정적.

### Session #22 Step 12 완료 (2026-04-21)
- Phase 2-A: 마켓채팅 참여자 팝업 완료
- Supabase Presence API 통합 — 로그인 사용자의 실시간 접속 추적
- 새 컴포넌트: ChatParticipantsModal (320×600, ESC/배경 클릭 닫기)
- ChatWidget 재구조 — action slot을 버튼으로 변경, 2번째 useEffect 추가 (Presence)

### Session #22 Step 11 완료 (2026-04-21)
- 사이드바 IA 개편 Phase 1 완료
- 14개 → 12개로 정리 (커뮤니티 채팅 제거, 수급 통합, 시장 지도 리네임)
- Active State 3중 표시 (왼쪽 바 + 배경 틴트 + 아이콘 색상)
- Phase 2, 3 로드맵 결정됨 (아래 TODO 참조)

> ※ Session #22 당시 Phase 2/3 TODO 는 상단 P2/P3 로드맵에 흡수 (2026-04-23 GC).

### 세션 #22 완료 — 2026-04-21 (홈 대시보드 V1 → V1.5 재구성)
- **신규 위젯**: TrendingThemesWidget (KRX 섹터 TOP 5)
- **제거**: 레거시 RealtimeChatWidget (grid cell로 흡수), 발견피드/시장활성도 탭
- **홈 레이아웃 V1.5 확정**:
  - 3-column: `minmax(280px,2.5fr) minmax(640px,6.5fr) minmax(300px,3fr)`
  - Col 1: 마켓채팅 + 글로벌 지수 (하단 스왑 — 관심종목 → 글로벌 지수)
  - Col 2: 차트 + (관심종목 | 상승테마 1:1)
  - Col 3: 호가창 + 체결창
  - R4 discovery: 상승/하락 | 거래량 | 실시간수급 | DART | 뉴스
  - R4 높이: `max(500px, calc(100vh - 280px))` 뷰포트 채움
  - 단일 스크롤 레이어 (`min-h-0` + `flex-1 overflow-y-auto`)
- **Yahoo Finance 401 복구**: `yahoo-finance2` v3 npm 설치, `new YahooFinance()` 인스턴스화
- **KOSPI 200 추가** (`^KS200`) → 9개 지수, 30초 폴링
- **NetBuyTopWidget**: size/inline props 추가 (R4용)
- **Col 1 폭 축소**: 3fr → 2.5fr
- 8개 커밋: c42ccb9 → b928742 → 56b8114 → f6c4606 → 624d204 → d4ab8ae → 86685b6 → 49d449f
- STEP_4~8_COMMAND.md 5개 파일 생성 (Cowork → Claude Code 핸드오프 아카이브)

### P1 — 세션 #22 내 해결 ✅
- ~~KIS API 빈 배열 이슈: 상승/하락 TOP 10, 거래량 급등 TOP 10 "데이터 없음"~~ → Step 9 (커밋 `f198862`) 해결
  - movers: 경로 `/quotations/volume-rank` → `/ranking/fluctuation` + 파라미터 14개 재구성
  - volume-rank: SCR_DIV `20101→20171`, INPUT_DATE `'' → '0'`, BLNG_CLS `0→1`
  - Chrome MCP 실측: 국일제지 +29.83%, 화인써키트 +29.85% 등 3개 엔드포인트 모두 실데이터
- ~~volume-rank spike 값 전부 `101x` 표시 버그~~ → Step 10 (보수적 패치: `vol_inrt` 제거, 수동 계산만)

### P1 (다음 세션 우선) — 장중 재검증
- **spike 값 장중 거동 확인**: 장마감 상태에선 `avgVolume == volume`이라 1.0x 표시. 장중(09:00-15:30 KST)에 실제 배수 값 확인 + 2배 이상 급등 종목 실측
- **movers dir=down 정렬 재검증**: 장마감 후 양수값 혼재 관찰됨 — 장중 재확인 시 올바른 하락 순 정렬 나오는지

### 세션 #21 완료 — 2026-04-21 (Phase B 위젯 4종 실데이터 실시간 연동)
- **WatchlistWidget**: /api/kis/price × 5종목 병렬, 10초 폴링
- **OrderBookWidget**: /api/kis/orderbook + price 병렬, 5초 폴링, 5단 호가 + 동적 볼륨 바
- **TickWidget**: /api/kis/execution 최근 10건, 5초 폴링, 체결강도 실계산
- **RealtimeChatWidget**: Supabase Realtime postgres_changes INSERT 구독 + /api/chat/send POST, 로그인 토글, nickname 해시 매핑
- "준비 중" 배지 4종 전량 제거, 13개 위젯 모두 실데이터 연동 완료 (EconCalendar iframe 제외)
- 빌드 78/78 통과, 커밋 `6d3cd13` 푸시 (Claude Code가 타입 린터 fix(types) 포함 amend)

### 세션 #20 완료 — 2026-04-20 (KIS 차트 실데이터 + lightweight-charts)
- lightweight-charts v4.2.3 설치
- /api/kis/chart (FHKST03010100, 150일 일봉) 신규
- ChartWidget: 6자리 → KIS+Lightweight Charts, 영문 → TradingView tv.js
- HomeClient: NewsFeed R4-5, EconCalendar R6 전체폭
- 빌드 78/78 통과, API 삼성전자 검증 완료

### 세션 #19 완료 — 2026-04-20 (그리드 행 높이 뷰포트 고정)
- gridTemplateRows: minmax(300px,1fr) → calc((100vh - 136px) / 3) 교체
- 정확히 2페이지 고정: 1440×900, 1920×1080 모두 검증
- minHeight: 200vh 제거
- sub-grid R3C2 gridTemplateRows: '1fr' 추가
- 빌드 77/77 통과

### 세션 #18 cont 완료 — 2026-04-20 (홈 대시보드 레이아웃 v2)
- CommunityChatWidget → RealtimeChatWidget (인라인 WidgetCard, "실시간 채팅")
- 2페이지 CSS 그리드 (6행 × 3열, minHeight 200vh), 위젯 중요도 순 재배치
- Sticky Header (top-0 z-40) + TickerBar (top-[72px] z-30)
- 테이블형 위젯 9종 폰트 스케일업 (text-xs→text-sm, py-1.5→py-2.5)
- /chat 페이지 제목 "실시간 채팅"으로 업데이트
- docs/DASHBOARD_SPEC_V1.md 섹션 5 추가 (2페이지 배치도)
- 빌드: 77/77 통과

### 세션 #18 완료 — 2026-04-20 (홈 대시보드 버그픽스 4종)
- Bug 1: 레거시 채팅 6개 파일 삭제 (ChatPanel/ChatSidebar/FloatingChat/ChatProvider + 2개 스텁) + LayoutShell 정리
- Bug 2: CommunityChatWidget fixed floating (left:72px, bottom:12px, 320×360, 더블클릭 최소화, /chat 링크) + 좌측 컬럼 3등분 grid
- Bug 3: WidgetCard href+ArrowUpRight + 14개 위젯 href 주입 + 13개 라우트 페이지 스텁 + VerticalNav 실라우트 연결
- Bug 4: TradingView iframe URL → s.tradingview.com, hide_side_toolbar=1, allow_symbol_change=1
- 빌드: 77/77 통과

### 세션 #17 완료 — 2026-04-21 (Phase B 데이터 통합)
- `ChartWidget`: TradingView iframe 임베드 (종목 입력 가능)
- `EconCalendarWidget`: Investing.com SSLecal2 iframe
- `NewsFeedWidget`: 한경·매경·이데일리 RSS 3종 실데이터
- `GlobalIndicesWidget`: Yahoo Finance 8종 실데이터
- `VolumeTop10Widget`: KIS volume-rank API 실데이터
- `MoversTop10Widget`: KIS movers API 신규 (등락률 순위 up/down)
- `NetBuyTopWidget`: KIS investor-rank API 실데이터
- `InvestorFlowWidget`: KIS KOSPI/KOSDAQ 투자자별 실데이터
- `PreMarketBriefingWidget`: Yahoo Finance 미증시 + DART 오늘 공시
- `DartFilingsWidget`: DART OpenAPI 실데이터, 유형 자동 분류
- 신규 API 5종: /api/home/{news,global,investor-flow,briefing} + /api/kis/movers
- 빌드 통과: 64/64 페이지

> ※ P1~P4 로드맵은 상단 "현재 TODO" 로 통합 (2026-04-23 GC).

## 완료된 세션 히스토리 (상세 로그)

### 세션 #15 — 2026-04-18 ((L) 클릭/리드 개별 삭제 API + 어드민 UI)
- **신규 API 2종** — `DELETE /api/admin/partners/clicks/[id]` + `DELETE /api/admin/partners/leads/[id]`. 모두 `requireAdmin()` 게이트 + service_role 하드 삭제. 400/401/403/500 표준 응답.
- **대시보드 UI 확장**:
  - `/admin/partners/clicks` 최근 클릭 테이블 → "액션" 컬럼 + 🗑️ 버튼 (confirm 가드, deletingId 비활성 상태, rowError 배너)
  - `/admin/partners/leads` 리스트 테이블 → 동일 패턴 (이름 포함 confirm 메시지, colSpan 8→9)
- 슬롯 매핑 삭제는 (I) 의 ✕ chip 버튼으로 이미 지원 → 별도 작업 불필요
- QA 데이터 + 앞으로 쌓일 테스트·실수 데이터 영구 관리 수단 확보. Chrome MCP E2E 는 블록 4/4 에서 함께 수행 or 별도 세션에 이관

### 세션 #15 — 2026-04-18 ((J) 채팅 사이드바 하단 PartnerSlot)
- **`components/chat/ChatPanel.tsx`** — 입력 영역 아래 최하단에 `<PartnerSlot slotKey="chat-sidebar-bottom" variant="compact" className="mx-2 mb-2" />` 삽입 (+ import 추가).
- ChatPanel 은 ChatSidebar(1400px+ aside) + FloatingChat(<1400px 플로팅 위젯) 둘 다에서 공유되므로 데스크톱·모바일 모두 슬롯 노출. 미매핑 파트너 시 `PartnerSlot` null 반환 → 공간 0.
- **`app/admin/partners/page.tsx` SLOT_KEYS 확장** — `chat-sidebar-bottom` 추가 (드롭다운 8 옵션).
- Chrome MCP 렌더 검증 (1920px, `/`): test-asset(id=4) → chat-sidebar-bottom(slot id=6) 매핑 후 ChatSidebar aside 최하단에 compact 카드 표출, href 에 `utm_medium=chat-sidebar-bottom` 포함. Console 에러 0 (auth lock AbortError 3건만, 기존 known).
- QA 잔여: test-asset → chat-sidebar-bottom 매핑 / `/e2e-chrome-mcp-test` 클릭 1건 / E2E lead 2건 → 다음 세션 cleanup 엔드포인트 or 어드민 수동 정리.

### 세션 #15 — 2026-04-18 ((K-2) Chrome MCP E2E 검증 — (I) 5/5 PASS)
- Task #48 — 라이브 검증 전부 통과 (qa-test-bank id=5)
  1. PATCH `/api/admin/partners/5` (name·category·description·priority) → 200 OK + UI 3열 반영
  2. POST `/api/admin/partners/5/slots` (`stock-detail-bottom` pos1) → 200, slot id=4
  3. 동일 slot_key 재-POST → 409 "이미 매핑된 슬롯입니다" (UNIQUE 제약)
  4. DELETE `/api/admin/partners/5/slots?slot_key=stock-detail-bottom` → 200 `{ok:true}`
  5. DELETE `/api/admin/partners/5` → 200, 목록 3행→2행, CASCADE/SET NULL 연동 확인
- Console 에러 0 (Supabase auth lock AbortError 3건은 기존 known)
- 잔여 QA 데이터: `/e2e-chrome-mcp-test` 클릭 1건 + E2E lead 2건은 test 파트너에 귀속 → 다음 세션에서 cleanup 엔드포인트 만들면 정리 가능

### 세션 #15 — 2026-04-18 ((I) 파트너 편집·삭제 + 슬롯 재매핑 — Phase 2 CRUD)
- **신규 API `app/api/admin/partners/[id]/route.ts`** — PATCH (부분 필드, slug 재검증, features JSON 파싱, 23505→409) + DELETE (CASCADE slots/clicks, SET NULL leads). Next 16 `params: Promise<...>` + `await params` 규약 준수.
- **신규 API `app/api/admin/partners/[id]/slots/route.ts`** — POST `{slot_key, position, is_active}` (UNIQUE 충돌 23505→409) + DELETE `?slot_key=` or `?slot_id=` (partner_id 스코프).
- **어드민 UI 확장 `app/admin/partners/page.tsx`**:
  - `editingId` 상태 분기: 편집 버튼(✏️) 클릭 → 폼 채움 + 스크롤 업 → PATCH 제출
  - 삭제 버튼(🗑️) + window.confirm → DELETE 파트너
  - 슬롯 칩에 ✕ 버튼 → confirm 후 슬롯 매핑 제거
  - 슬롯 라인에 "+ 슬롯" 인라인 액션 → 드롭다운 + position 입력 → POST slot 매핑
  - 테이블 "액션" 컬럼 추가 (9컬럼) + align-top 적용 + rowActionError 별도 배너
  - 편집 모드: 하단 슬롯 폼 영역 숨김 (칩 레벨에서 관리) + "편집 취소" 링크
- Partner.id `string → number` 타입 정정 (BIGSERIAL 실제 타입과 일치)
- 다음: (K-2) 편집·삭제 + 슬롯 재매핑 Chrome MCP E2E 검증, 그리고 `/e2e-chrome-mcp-test` QA 클릭 로그 정리

### 세션 #15 — 2026-04-18 ((K) Chrome MCP E2E 검증 — (G)(H) 5/5 PASS)
- Task #46 — 라이브 검증 통과
  1. /admin/partners/clicks 초기 렌더: 필터·KPI·테이블·최근 목록 전부 표출
  2. POST /api/partners/clicks: 200 OK + DB insert 확인 (`/e2e-chrome-mcp-test` source_page)
  3. 대시보드 실데이터: 총 1 클릭 · 슬롯별 · 파트너별 · 일자별 ASCII bar · 최근 1건 KST 모두 정상
  4. /screener 하단 PartnerSlot: `screener-bottom` 매핑 없음 → null 렌더
  5. /stocks/005930 하단 PartnerSlot: `stock-detail-bottom` 매핑 없음 → null 렌더
- Console 에러 0 (Supabase auth lock AbortError 2건은 기존 known)

### 세션 #15 — 2026-04-18 ((H) UTM/클릭 대시보드 + PartnerSlot 클릭 트래킹)
- **(H1) PartnerSlot 트래킹 주입** — `navigator.sendBeacon` 우선, 실패 시 `fetch keepalive` 폴백. payload: `{slug, slotKey, sourcePage}`. 트래킹 실패는 try/catch 완전 흡수 (네비게이션 영향 없음)
- **(H2) 신규 API `app/api/admin/partners/clicks/route.ts`** — partner_slug / slot_key / from / to 필터, 4종 집계 (bySlot / byPartner / byDay / recent) + 리드 전환율 계산 (동일 기간 partner_leads 조인)
- **(H2) 신규 페이지 `app/admin/partners/clicks/page.tsx`** — KPI 4카드 + 슬롯별/파트너별 2-col 테이블 + 일자별 ASCII bar (민트=클릭 / 오렌지=리드) + 최근 100건
- **헤더 네비**: /admin/partners 에 "클릭 대시보드" 버튼 · /admin/partners/leads 에 "클릭 대시보드" 버튼 · /admin/partners/clicks 에 "리드 대시보드" 버튼 (MousePointerClick 아이콘 공통)
- 의사결정: "CTR"은 impression tracking 없으므로 생략 → click→lead 전환율로 대체 (슬롯별 utm_medium 매칭)

### 세션 #15 — 2026-04-18 ((G) 슬롯 키 확장 — stock-detail-bottom / screener-bottom)
- **전략 결정**: `/stocks/[symbol]` + `/screener` 둘 다 사이드바 없음 → 리팩토링 최소화 위해 **하단 풀폭 슬롯** 패턴 채택 (기존 `stock-detail-sidebar` / `toolbox-sidebar` 키는 보존하여 DB 데이터 호환)
- **`app/admin/partners/page.tsx` SLOT_KEYS 확장** — `stock-detail-bottom` / `screener-bottom` 2개 신설 → 드롭다운 7 옵션
- **`app/stocks/[symbol]/page.tsx`** — `<StockDetailTabs/>` 아래 `max-w-[1400px] mx-auto px-4 pb-10` 래퍼로 `<PartnerSlot slotKey="stock-detail-bottom" variant="card" />` 주입
- **`components/screener/ScreenerClient.tsx`** — Pagination 블록 아래 `mt-8` 여백으로 `<PartnerSlot slotKey="screener-bottom" variant="card" />` 주입
- 동작: 파트너 미지정(슬롯 매핑 없음)이면 PartnerSlot이 `null` 리턴 → 그레이스풀 빈 상태. 어드민에서 slot_key 추가 즉시 카드 출현.

### 세션 #15 — 2026-04-18 ((F) /admin/partners/leads 리드 대시보드 + CSV Export)
- **신규 API `app/api/admin/partners/leads/route.ts`** (admin only)
  - GET 필터: partner_slug · from · to (YYYY-MM-DD) · q (이름/이메일/전화/문의 OR ilike) · limit · offset · format(json|csv)
  - CSV 모드: UTF-8 BOM 프리픽스 + 12열 헤더 + `attachment; filename="partner_leads_YYYY-MM-DD.csv"` 내려보냄 (엑셀 한글 깨짐 방지)
  - 파트너 이름/slug 병합은 FK select 대신 in-clause 별도 조회 후 메모리 병합 (RLS 우회 안전)
- **신규 페이지 `app/admin/partners/leads/page.tsx`** (AuthGuard admin)
  - 필터 4종 + 검색 + 조회/CSV 다운로드 버튼 · KPI 4카드 (총/이메일/전화/동의) · UTM TOP 5 badge · 리드 테이블 8컬럼
  - 기본 기간: 오늘 ~ 30일 전 (`todayIso(-30)` ~ `todayIso(0)`)
  - CSV 다운로드는 anchor href 로 직접 트리거 → 브라우저 "다운로드 허용 필요" 팝업 유발 가능 (보안 정책 준수)
- `app/admin/partners/page.tsx` 헤더에 "리드 대시보드" 링크 버튼 추가 (ListOrdered 아이콘)

### 세션 #15 — 2026-04-18 ((E) /admin/partners Chrome MCP E2E 검증)
- **Task #42 — 2단계 검증 후 5/5 PASS**
  1. 비-admin 1차 — UI `AuthGuard` 차단 + API `GET /api/admin/partners` → 403
  2. `scripts/sql-exec.py` 로 soulmaten7@gmail.com → `role='admin'` 승격 (`UPDATE public.users ... RETURNING`)
  3. 재로드 후 UI 렌더 — 헤더/새로고침/파트너 추가 버튼 표출
  4. 리스트 2건 표출 — `test` + slot 칩 2종 (home-row3-left#1, toolbox-category-exchange#1), `test-asset` + home-sidebar-bottom#1
  5. 폼 POST — `qa-test-bank` / "QA 테스트 은행" 최소 필드로 생성 → 성공 배너 + 리스트 3번째 row 즉시 반영
- 검증용 QA 데이터 유지 (Phase 1 = DELETE 없음, 추후 SQL로 제거 가능)
- 스크린샷 저장 · Task #42 완료

### 세션 #15 — 2026-04-18 ((E) /admin/partners 최소 CRUD — Phase 1 = 추가)
- **신규 API `app/api/admin/partners/route.ts`** (service_role, `requireAdmin` 헬퍼로 admin 검증 후 create)
  - GET: partners 전체 + partner_slots 조인 (priority desc, created_at desc) — 슬롯 매핑 병합
  - POST: slug 정규식(`^[a-z0-9-]+$`) 검증 / features JSON 파싱·배열 검증 / country 기본 'KR' / 중복 slug `23505` 사용자 친화 메시지 / 선택적 `slot_key` + `slot_position` 주입 (매핑 실패 시 `slot_warning` 으로 경고만)
- **신규 페이지 `app/admin/partners/page.tsx`** (`AuthGuard minPlan='admin'`)
  - 헤더 (← 대시보드 링크 + 새로고침 + 파트너 추가 버튼) + 성공/에러 배너
  - 접힘/펼침 폼: 11 필드 + features JSON 텍스트영역 + 슬롯 드롭다운(`home-row3-left` / `home-sidebar-bottom` / `toolbox-sidebar` / `stock-detail-sidebar`) + position
  - 리스트 테이블: slug · 이름 · 카테고리 · 국가 · priority · 활성 뱃지 · 슬롯 칩 · `/partner/[slug]` 외부 링크
- **`app/admin/page.tsx` 대시보드** — "바로가기" 카드 섹션 추가 (Handshake 아이콘 + `/admin/partners` 딥링크)
- **Phase 2 남은 것**: 편집·삭제·슬롯 재매핑 UI, 리드 대시보드, 슬롯 키 확장, UTM 대시보드

### 세션 #15 — 2026-04-18 ((D) 홈 Row3 우측 하단 PartnerSlot placeholder 교체)
- `supabase/migrations/011_partner_seed_2.sql` — 두 번째 테스트 파트너 `test-asset` (테스트 자산운용) + `home-sidebar-bottom` 슬롯 매핑 (position 1)
  - DB 컬럼 픽스: `partner_slots.priority` → 실제 컬럼명 `position` 으로 자동 수정 후 재적용
- `components/home/HomeClient.tsx` — 회색 "PARTNER SLOT (W4)" placeholder div 제거 → `<PartnerSlot slotKey="home-sidebar-bottom" variant="card" />` 교체
- Chrome MCP 검증 PASS (commit becb74c) — 사이드바에 두 카드 세로 스택 (상: 테스트 증권 민트 / 하: 테스트 자산운용 주황), 회색 박스 완전 사라짐, 콘솔 Fast Refresh [LOG] 13건·에러 0건

### 세션 #15 — 2026-04-18 (W5 더미 데이터 제거 1차 — ComingSoonCard + 4개 위젯)
- `components/common/ComingSoonCard.tsx` 공통 스켈레톤 신설 (제목·아이콘·설명·eta 뱃지)
- 4개 홈 위젯 하드코딩 더미 제거 → ComingSoonCard 교체 (commit b8f007d, 6 files / +287 -97)
  - ProgramTrading (arb 215 / nonArb -108) → "KRX 데이터 연결 후"
  - GlobalFutures (S&P/NASDAQ/WTI/금 4건) → "외부 선물 API 연결 후"
  - WarningStocks (테스트A/B/C 3건) → "KRX 데이터 연결 후"
  - IpoSchedule (테크바이오 등 3건) → "공시 파이프라인 연결 후"
- Chrome MCP 검증 5/5 PASS — 더미 잔존물 0건, "데이터 준비 중" 4개, 300px 유지, console error W5 무관 1건
- ScreenerClient는 이미 실연결 상태라 손대지 않음
- **결정**: Task #38 EarningsCalendar / #39 EconomicCalendar → Phase 2 이관 (DART·ECOS 모두 '발표 예정' API 미제공, W4 리드 유입 검증 우선)
- 다음 순서 (D) 홈 잔여 PARTNER SLOT (W4) 회색 placeholder 교체 → (E) /admin/partners 최소 CRUD

### 세션 #14 — 2026-04-18 (W4 Partner-Agnostic Landing + E2E 검증)
- **W4 Partner-Agnostic Lead Gen 인프라 1차 완료** (commit 91eea5a, 11 files / +1322 insertions)
  - `supabase/migrations/010_partners.sql` — 4 테이블 + RLS (SELECT 공개 / leads·clicks INSERT 익명 허용 / 쓰기 service_role)
  - 테스트 시드: `slug='test' 테스트 증권`, features 3종 (수수료 0.015% / AI 리서치 무료 / 24시간 상담), 슬롯 2개 (`home-row3-left`, `toolbox-category-exchange`)
  - API 4종 (`/api/partners/[slug]`, `/slots`, `/leads`, `/clicks`) — curl 4/4 PASS, leads POST 시 IP SHA256 해시화
  - 페이지: `/partner/[slug]` Server + `PartnerLandingClient` Client (Hero + Features + 리드 폼 + 성공 박스 전환)
  - 컴포넌트: `PartnerSlot` (card/compact variant, UTM 쿼리 자동 주입) — 부모 'use client' 때문에 Client 컴포넌트로 전환
  - 교체: `HomeClient` Row3 좌측 + `CategorySection` `slug==='exchange'` 헤더 하단
- **Chrome MCP E2E 8/8 PASS** (Task #36)
  - `/partner/test` 풀 렌더링 + 폼 제출 → "신청 완료" 전환 / 홈 card 클릭 UTM `home-row3-left` 전달 / toolbox compact 클릭 UTM `toolbox-category-exchange` 전달 / slots API 실시간 응답
  - Console errors: Supabase auth-js `AbortError: Lock broken` 1건 (SDK 내부 탭 lock 경합, 기능 무관)
- **MVP 범위 밖 (Phase 2)**: `/admin/partners` CRUD · 리드 대시보드 · 슬롯 키 확장 · UTM 대시보드

### 세션 #13 — 2026-04-18 (Google OAuth + Chat API/UX + W2.5/W2.6/W3 실데이터)
- Google Cloud `Terminal` 프로젝트 + OAuth Client 발급 (soulmaten7-org)
- `scripts/auth-config.py` 신규 (PAT Management API `/config/auth` 래퍼)
- Supabase PATCH: `external_google_enabled=true` / client_id·secret / `site_url=http://localhost:3333` / `uri_allow_list=http://localhost:3333/**`
- Chrome MCP 검증: 로그인 버튼 → accounts.google.com 리다이렉트 (client_id 일치)
- **긴급 패치**: public.users RLS INSERT 정책 부재로 callback 의 users insert 조용히 차단 → 406 → UI 로그아웃 상태 증상 발견
- 수정: `CREATE POLICY "Users can insert own profile" FOR INSERT WITH CHECK (auth.uid() = id)` + 유령 `a7db2d46-…` soulmaten7@gmail.com 백필
- /auth/callback 진단 로그 강화 (commit 60fce18) — exchangeCodeForSession / users insert 실패 상세 로깅
- Task #26 Chat API 하네스 6/6 통과: 401 / 400×4 / 200 / 태그추출 3종 / 429 (Chrome MCP fetch 기반 E2E)
- 하네스 메시지 5건 hidden 처리
- Turbopack 캐시 손상 복구 절차 정립: `rm -rf .next node_modules/.cache` + `lsof -ti :3333 | xargs kill -9` + `npm run dev`
- **Task #27 완료** — `components/chat/ChatPanel.tsx` 디테일 보강
  - 글자수 카운터 `{len}/500` (450+ 주황, 490+ 빨강 볼드)
  - 에러 박스 아이콘(⚠) + 빨강 테두리 + 5초 유지
  - 429 rate-limit 전용 한글 안내 + 네트워크 오류 카피 개선
  - 전송 후 input 포커스 유지 (inputRef)
  - $태그 렌더 pill 배경 추가 (`bg-teal/10` + hover `/20`)
- commits: 60fce18 push 완료, `scripts/auth-config.py` + ChatPanel 개선 + 문서 4종 동기화 이 세션 마지막 commit 에서 포함
- **W2.5 완료** — `/api/stocks/compare` 신규 + `CompareTab` 전면 재작성
  - 2~5개 symbol 비교: 심볼 칩(추가/제거) + KPI 테이블 (시총·PER·PBR·ROE·EPS·BPS·6M수익률) + 정규화 라인차트 (시작일=100)
  - 공통 거래일 교집합 정렬, 5가지 고정 색상 (teal/red/blue/amber/violet)
- **W2.6 완료** — 뉴스·공시 라이브 엔드포인트 2종 + 탭 2종 재작성
  - `/api/stocks/disclosures`: DART list.json 라이브 (corp_code DB lookup) + 10종 유형 분류
  - `/api/stocks/news`: Google News RSS 라이브 (국가별 한/영 쿼리 + CDATA/HTML 정리)
  - DisclosuresTab: 기간 1/3/6/12개월 + 유형 필터 동적 카운트 + DART 원본 링크
  - NewsTab: 외부 RSS 기반 → `symbol` prop 필요 (NewsDisclosureTab 도 함께 업데이트)
- **W3 완료** — `/toolbox` 국가 필터 추가 (ToolboxClient + page.tsx)
  - `availableCountries` 동적 구성 (실제 데이터에 존재하는 국가만)
  - 1개 국가뿐이면 필터 숨김, 전체/KR/US/… 토글
  - 표시 건수 카운터 (전체 N · 표시 M)
- 신규 API: 3개 (`compare`, `disclosures`, `news`)
- 새 파일 없음 (기존 탭 재작성 + 엔드포인트 디렉토리 생성)

### 세션 #12 — 2026-04-18 (W2.3 보강 + W2.4 실적 탭 실데이터)
- W2.3 보강: DART corp_codes 3,959건 시딩 + ROE 계산식(EPS/BPS×100) 추가 → KPI 7/7 완성
- /api/dart/company 기업개황 정상 반환 (삼성전자 대표이사·주소·홈페이지·전화)
- W2.4 실적 탭: lib/dart-financial.ts + /api/stocks/earnings + EarningsTab 차트 교체
- DART fnlttSinglAcntAll 연결재무제표 파싱 (annual 4건, quarters 12건)
- 차트: 연간 grouped bar + 분기 line + 마진 line + 상세 테이블
- scripts/sql-exec.py: Supabase Management API PAT 래퍼 — 이후 모든 DDL 자동화 가능
- Chrome MCP 검증: KPI 8/8 실데이터, SVG 14개 + 테이블 정상
- commits: 5c6434e / d9102da / 88b2add push 완료

### 세션 #11 — 2026-04-18 (W2.3 재무·가격 DB 시딩)
- financials 191건 upsert (KIS API inquire-price, TOP 200 + 005930)
- stock_prices 52,969건 upsert (FDR DataReader 1Y OHLCV, 200종목 × ~265일, 실패 0)
- supabase/migrations/007_stock_prices.sql 신규 (테이블 + 3 인덱스 + RLS + 2 POLICY)
- Supabase Studio 직접 실행 (direct DB connection IPv4 미지원, pooler region 이슈 우회)
- Chrome MCP 검증: PER 32.91 / PBR 3.38 / EPS 6,564 / BPS 63,997 / 52주 53,700~223,000 KRW 전부 실데이터
- 미완: ROE (KIS 미제공, W2.4에서 계산식 추가), 배당수익률 (DART corp_codes 시딩 필요)
- commit: 31f443f push 완료

### 세션 #10 — 2026-04-18 (W2.1 종목 상세 8탭 재구축)
- **페이지 재작성**: `app/stocks/[symbol]/page.tsx` 다크 10탭 + AuthGuard → 라이트 8탭 + 비로그인 접근
- **8탭 표준**: 개요 / 차트 / 호가 / 재무 / 실적 / 뉴스·공시 / 수급 / 비교 (V3 스펙)
- **컴포넌트 분리**: StockHeader / StockDetailTabs / WatchlistToggle / 5개 신규 탭 (Overview/Orderbook/Earnings/NewsDisclosure/Compare)
- **URL `?tab=` 기반 탭 상태**: useSearchParams, 뒤로가기/앞으로가기 지원
- **라이트 테마 일괄 치환**: 5개 기존 탭(ChartTab/FinancialsTab/NewsTab/DisclosuresTab/SupplyDemandTab) + OrderBook + ExecutionList
- **보존 파일**: ShortSelling/Insider/Dividend/Sector/Macro 파일 유지 (라우팅만 제외)
- **Chrome MCP 검증**: darkResidueCount 0, 8탭 정확, URL 탭 전환 정상, 비로그인 접근 OK, 미국 종목 호가 안내문 확인
- **git**: 21 files changed, 커밋 `267e83b` push 완료

### 세션 #9 — 2026-04-18 (홈 Bento Grid 재구축 + Light Theme 전환)
- **W1.5 — Header/TickerBar 슬림화 + HomeClient Bento 초안:**
  - `Header.tsx` 191px 2단 → 단일 73px, 네비 6→3개 (홈/스크리너/도구함), 민트 리본 제거
  - `TickerBar.tsx` 다크 48px → 라이트 40px (`colorTheme: 'light'`, `isTransparent: true`)
  - `HomeClient.tsx` flex 3단 → `grid-cols-2` 5행 Bento Grid 초안
  - `WidgetCard.tsx` 신규 공통 래퍼 (bg-white + border-[#E5E7EB])
- **W1.6 — 5개 위젯 다크→라이트 + C안 T자형 레이아웃:**
  - 대상 위젯: VolumeSpike, MarketMiniCharts, ProgramTrading, GlobalFutures, WarningStocks
  - 색상 매핑: `bg-[#0D1117]` 제거, `bg-[#161B22]→bg-[#F5F7FA]`, `border-[#2D3748]→border-[#E5E7EB]`, `text-white→text-black`, 부가 `text-[#666666]`
  - MarketMiniCharts TradingView `colorTheme: 'light'` 전환
  - **C안 블룸버그 T자형 레이아웃**: 속보피드 `gridRow: span 3` (924px tall) | 경제/IPO/실적 세로 스택 (각 300px)
  - Row 6: 프로그램매매 / 글로벌선물 / 투자경고 각 col-span-2 3등분
- **Chrome MCP 검증:** darkResidueCount 0, 속보 y=853 height=924, 경제/IPO/실적 x=997 세로 스택, 페이지 높이 2,579px, 첫 화면 8개 위젯
- **git:** W1.5 + W1.6 통합 푸시 17 files changed (main)

### 세션 #8 — 2026-04-18 (V3 제품 스펙 전면 개정)
- **전략 방향 확정 (대화):**
  - "전업투자자 = 일반인 (상위 1%)" Aspirational Design 포지셔닝
  - Bloomberg/Koyfin Bento Grid + 단일 지속 채팅 + 투자자 도구함
  - PC-First → 이후 태블릿/모바일 반응형 (모듈식 설계)
  - 채팅은 전체 1개, 종목 분산 X (Density Over Distribution)
  - 데이터 100% 무료 소스로 95% 커버 — KIS 서버사이드로 비로그인 이용자도 실시간
  - 수익화 단일 모델: **Partner-Agnostic Lead Gen 만.** 구독/결제/Pro/AI 리포트/CSV — **전부 제거**
- **신규 문서:** `docs/PRODUCT_SPEC_V3.md` (11섹션), `docs/COMMANDS_V3_PHASE1.md`
- **V2 Spec 아카이브:** `docs/HOME_REDESIGN_V2_SPEC.md` 는 참고용으로만 유지
- **코드 변경:** 없음 (문서 세션)

### 세션 #7 — 2026-04-17 (stocks + link_hub DB 시딩)
- **stocks 테이블 시딩**: KOSPI 949건 + KOSDAQ 1,821건 = 총 2,780건 upsert 완료
- **link_hub 테이블 시딩**: 기존 더미 데이터 삭제 후 KR/US 56건 재삽입 완료
- **pykrx → FDR 전환**: KRX API 세션 인증 차단(LOGOUT 400) → FinanceDataReader로 교체
- **신규 파일**: `scripts/seed-stocks.py` (155 lines)
- **빌드**: `npm run build` 에러 없음 ✅
- **git**: `21fafe3` 커밋

### 세션 #6 — 2026-04-17 (Rate limit 복구 + /admin AuthGuard + 모델 선택 규칙)
- **Rate limit 복구**: `.env.local` `KIS_RATE_LIMIT_MS=400→60`, `WatchlistLive.tsx` 폴링 15초→10초
- **/admin AuthGuard 추가 (보안)**:
  - `AuthGuard.tsx`에 `'admin'` minPlan 타입 추가
  - admin 게이트는 `DEV_BYPASS=true` 여도 반드시 `role==='admin'` 체크 (보안 우선)
  - admin 차단 시 PaywallModal 대신 "접근 권한 없음" 전용 화면
  - `app/admin/page.tsx` 전체를 `<AuthGuard minPlan="admin">` 로 래핑
- **모델 선택 규칙 명문화**: `CLAUDE.md`에 Sonnet 기본 / Opus는 🔴 배지 붙은 경우만 실행 규칙 신설
- **빌드**: `npm run build` 에러 없음 ✅
- **git**: `18fcc48` push 완료 (세션 #6 — 12개 파일 변경)

### 세션 #5 — 2026-04-17 (AuthGuard DEV_BYPASS + Turbopack 서버 안정화 + 문서 전체 갱신)
- **AuthGuard**: `DEV_BYPASS = true` 추가 → 13개 페이지 paywall 전체 해제 (개발 확인용)
- **Turbopack 크래시 해결**: `.fuse_hidden` 파일 7개 삭제 후 서버 재시작 → `✓ Ready in 1175ms`
  - 원인: FUSE mount 위에서 Turbopack RocksDB lock 파일 생성 불가 → "Operation not permitted"
  - 해결: `mcp__cowork__allow_cowork_file_delete`로 `.fuse_hidden*` 삭제 후 `next.config.ts` 원복
- **next.config.ts**: `distDir` 절대경로 시도 (실패) → 원복 (Next.js path.join 제약으로 절대경로 불가)
- **git 이슈**: 샌드박스에서 `.git/index.lock` 삭제 불가 → 사용자 Mac 터미널에서 직접 push 완료 (커밋 `49abd20`, `da61662`)
- **문서 전체 갱신**: 4개 문서 날짜 + 세션 #4~5 로그 기록 완료

### 세션 #4 — 2026-04-11 (13개 페이지 Chrome MCP 테스트 + 홈 수급 최적화)
- **신규**: `app/api/kis/investor-rank/route.ts` (batch endpoint, TR ID: FHPTJ04400000)
- **수정**: `components/home/InstitutionalFlow.tsx` — 10건 병렬 개별호출 → 1건 batch 호출 (60초 폴링)
- **효과**: 홈 페이지에서 WatchlistLive(10건/15초) + InstitutionalFlow(1건/60초) = 한투 rate limit 안정화
- **테스트**: 13개 페이지 전부 Chrome MCP로 순회, 페이지별 UI/데이터 상태 기록
- **발견된 이슈**:
  - DB 시딩 필요 (`stocks`, `link_hub` 비어있음)
  - 더미 데이터 8개 컴포넌트 제거 필요
  - `/admin` AuthGuard 누락 (보안)
  - Turbopack 파일시스템 캐시 오류 (샌드박스 한정)

### 세션 #1 — 2026-04-08
- **작업 내용**: 프로젝트 초기 설정 + 전체 파일 구조 생성
- **완료된 것**:
  - Next.js 16 + TypeScript + Tailwind + Supabase 프로젝트 생성
  - 90개 이상 파일 생성 (9개 페이지 + 50개 이상 컴포넌트 + API 라우트 + 유틸리티)
  - DB 스키마 SQL 작성 (20개 테이블)
  - 공통 레이아웃 (Header, TickerBar, Footer, FloatingChat)
  - 인증 시스템 (로그인/회원가입/AuthGuard)
  - 홈 대시보드 전체 컴포넌트
  - CLAUDE_CODE_INSTRUCTIONS.md 전체 개발 명령서 작성

### 세션 #3 — 2026-04-11
- **작업 내용**: 한투 API 4종 검증 + lib/kis.ts 버그 수정
- **검증 결과 (토요일 장외, 4/10 종가 기준)**:
  - /api/kis/price: 정상 (삼성전자 206,000원)
  - /api/kis/investor: 정상 (외국인 +465,171주 / 기관 -475,614주) — 수급 +0억 문제 해결
  - /api/kis/orderbook: 정상 (10호가)
  - /api/kis/execution: 정상 (체결 내역)
- **수정한 버그**:
  - Rate limiter race condition → Promise chain serialize
  - 토큰 발급 deduplication → pendingTokenPromise 공유
  - 토큰 디스크 캐시 추가 (/tmp/kis-token-cache.json)
  - RATE_LIMIT_MS 400ms → 1100ms (첫 3영업일 1건/초 제한 대응)
  - WatchlistLive 폴링 10초 → 15초
- **병렬 3개 API 호출 재테스트**: 3.1초 (1.1초 × 3, 직렬화 정상)

### 세션 #2 — 2026-04-09
- **작업 내용**: Phase 1~4 전체 구현 (홈 리팩토링 + API + 서브페이지 + 수익화)
- **완료된 것**:
  - 홈 3-layer 리팩토링 (라이브스코어+채팅 컨셉)
  - 4-column 레이아웃 (Ad | SidePanel | Main | Ad), maxWidth 1920px
  - 12개 새 홈 컴포넌트 구현
  - 한투 OpenAPI 연동 (4개 API 라우트, 토큰 캐싱, 레이트 리미터)
  - 관심종목 실시간 10초 폴링, 외국인/기관 수급 30초 폴링
  - 속보 뉴스+공시 혼합 피드 (DART + RSS)
  - 4개 신규 페이지 (/news, /analysis, /screener, /compare)
  - AI 분석 GPT-4o-mini 연동 성공 (삼성전자 가치분석 테스트 완료)
  - AdColumn (320x120 배너, 인증/일반 구분)
  - Hydration mismatch 3건 수정
  - Header/TickerBar sticky 해제
  - SidebarChat 탭 제거, sticky bottom
- **미완료**: 토스페이먼츠 (라이브 URL 필요), 프로그램매매 데이터 (KRX 크롤링 필요)

## 핵심 수치 (2026-04-23 STEP 87 기준)
- **최신 STEP**: 87 (섹터 API v3 핫픽스 + 반응형 + 호가창 동기화)
- **최신 커밋**: `1f46fa3` (docs: session-handoff bootstrap)
- **홈 대시보드**: V3 5섹션 구조 (STEP 82 확정)
- **신규 풀스크린 페이지**: `/market-map` · `/themes` · `/disclosures` (STEP 86)
- **빌드 상태**: ✅ 클린 · TypeScript 0 오류 · console.log 0 · ESLint 63건 비차단 경고
- **배포 상태**: ❌ 미배포 (P0)
- **지원 시장**: 한국(KOSPI/KOSDAQ) + 미국(NASDAQ/NYSE) — 일본/홍콩 P4
- **한투 API**: 7개 엔드포인트 전부 검증 완료
- **AuthGuard**: `DEV_BYPASS = true` (admin 게이트는 DEV_BYPASS 무시)
- **Rate limit**: `KIS_RATE_LIMIT_MS=60` (20건/초)

### DB 시딩 누계
| 테이블 | 건수 | 비고 |
|--------|------|------|
| stocks | 2,780 | KOSPI 949 + KOSDAQ 1,821 |
| link_hub | 56 | KR/US |
| financials | 576 | DART 연간 (TOP 100 × 2023/2024) |
| stock_prices | 54,899 | 200종목 × 1년 일봉 |
| supply_demand | 3,000 | 100종목 × 30영업일 |
| dividends | 790 | TOP 200 × 최대 6년 |
| quant_factors | 200 | TOP 200 Value/Momentum/Quality |
| dart_corp_codes | 3,959 | DART 매핑 |

### AI 분석
- **모델**: GPT-4o-mini, 7일 캐시 (종목 AI 분석 전용)

## 세션 업데이트 지침
- 이 파일에 없는 숫자를 임의로 만들지 말 것
- 핵심 수치는 실제 확인된 수치만 기록
- 세션 히스토리는 가장 최근이 위로 추가 (완료 아카이브 섹션)
- **GC 루틴**: 2주+ 방치 TODO 는 ROADMAP 강등 또는 제거, Last GC 날짜 헤더 갱신
