<!-- 2026-06-22 -->
# 운종(雲從) — 새 세션 즉시 시작 파일

> ⭐ **더 디테일한 마스터 인수인계**: `docs/NEXT_SESSION_PLAYBOOK.md` (이 파일은 그 단축본)
>
> 이 파일을 처음부터 끝까지 읽으면 바로 작업 시작 가능.
> **Last refreshed**: 2026-06-22 (STEP 345 — 게이트웨이 우측 피드 8종 완성 + 종목·상품 탭 + 로그인 데드락 해소)
> **실행 환경**: Mac 로컬 `~/stock-terminal` 에서 직접 실행
> **현재 커밋**: `c0b3035` (STEP 345 · 공모주 청약일정 피드 파싱 수정) — 빌드 ✓
> ⚠️ **최신 상태는 `docs/SESSION_BOOT.md` 기준** (이 파일 본문 §1~는 V6/271 히스토리). 🔑 라우트 수정 후 재시작은 `pkill -f "next dev" && rm -rf .next && npm run dev`.
> 세션이 끝날 때마다 이 파일과 NEXT_SESSION_START.md 반드시 업데이트할 것.

---

## 1. 운종 한 줄 정체성 (V6 — 2026-06-03 확정)

> **운종 = "투자상품에 속지 않게 돕는 곳"** — 정확한 정보 + 솔직한 토론 + 검증된 신뢰
>
> 구조 = 네이버 페이 증권 레이아웃 + 토스 증권 카드 디자인 + Trustpilot 평가 모델 (V5 계승, 중심축만 편의 → **신뢰**). 마스터 비전 `docs/PRODUCT_SPEC_V6.md`.

거래 X · 영어판 X · 깊은 분석 X (외부 정확한 곳으로 동선 안내 = 허브) · 코인 제외(한국 주식 먼저)

## 2. 운종 V5 페이지 13개

| 라우트 | 역할 |
|--------|------|
| `/` | 포털형 홈 = `components/home-v6/HomeClientV6` (지수바·브리핑·랭킹·업종테마·ETF·우측레일 + 검증·평가·HOT토론·뉴스) |
| `/kr` | 한국주식 카드 5개 |
| `/us` | 미국주식 카드 4개 |
| `/stock/[code]` | 종목 페이지 (좌 정보·차트 / 중 탭 5종: 차트·시세 / 토론 / 뉴스 / 공시 / 인사이트 + 댓글 / 우 채팅) |
| `/products` | 상품 디렉토리 (ETF·펀드·랩·리츠·채권) |
| `/product/[id]` | 상품 평가 |
| `/rooms` | 리딩방 디렉토리 (텔레그램·카카오·디스코드·유튜브) |
| `/room/[id]` | 리딩방 평가 |
| `/calendar` | Investing.com 외부 링크 안내 |
| `/auth/login`·`/auth/callback` | 카카오 OAuth (활성화 미완) |
| `/mypage` | 마이페이지 |

## 3. 현재 진행 상태 (STEP 88~153 · V7)

### ✅ STEP 137~151 (V6 정체성 → V7 네이버 복제 진입)
- **137** FSS 유사투자자문업자 인증 (lib/fss.ts·cron·검증 API·뱃지) — 금감원 신고 자동 검증, **1,738건 적재 완료**
- **138** 홈 신뢰 축 재배치 — 검증·평가 최상단 + 금감원 1,738개 히어로 + 뉴스 카테고리 탭
- **139** 종목 페이지 네이버급 디테일 — StockInsightsTab·Orderbook·Execution·InfoPanel·lib/format
- **140** 종목 토론 추천/비추천 통일 (ThumbsUp/Down + voteMap)
- **141** 종목 공시 탭 (StockDisclosuresTab DART/SEC, 주의공시 레드) → 종목 5탭 완성
- **142** 포털형 홈 전면 재구성 → 홈 = `components/home-v6/HomeClientV6`
- **143** 홈 빈 섹션·버그 수정 (브리핑 야후 라이브러리·거래량 실값·업종테마 market 키·레터 아바타)
- **144** 홈 지수 카드 스파크라인 — HomeIndexBar inline SVG 30일 추세선 + indices API yf.chart()
- **145** 브리핑 overnight 안정화 — 누락·0·NaN → "—"(중립), 가짜 초록 "+0.00%" 제거 (신뢰 정렬)
- **147** 종목 메타 보강 — StockInfoPanel 외국인 소진율·상장주식수 (KIS 한국 전용)
- **149** 홈 빈 섹션 CTA 버튼 — HOT토론·평가 참여 유도 링크
- **150** 브리핑 간밤 지수 실데이터 복구 — 라우트 runtime/dynamic 누락 수정
- **151** 네이버식 상단 6메뉴 + /discussion·/news shell — **V7 진입** (네이버 복제, 마스터 `docs/SITE_MAP_V7.md`)
- **152** 마켓 페이지 + 국내 랭킹 테이블 — /market (거래대금·거래량·상승·하락 필터·클릭→종목)
- **153** 마켓 미국 랭킹 — us-movers 확장 + MarketClient 국가 분기 (미국 상승/하락, $가격)

### ✅ MVP 1.0 + 2.0 (이전 누적)
- 정보: 9개 정확 카드 + 종목 5탭 디테일 / 대화: 토론·댓글·채팅(Realtime) / 검색 + Watchlist
- 상품·리딩방 평가 디렉토리 (platform_discussions 추천/비추천 + 금감원 인증 뱃지)
- 디자인 시스템 (Pretendard + 토스 색상 + rounded-2xl + shadow-soft)

### 🔴 사용자 직접 작업 (미완)
- **카카오 OAuth 활성화** (카카오 콘솔 + Supabase Dashboard) — 추천/비추천 투표 실동작 전제
- **Vercel 배포 + unjong.com 도메인** (도메인 결정 후) — FSS cron 활성 전제
- **SUPABASE_ACCESS_TOKEN 폐기** (보안 권장)

## 4. 다음 STEP 후보 (우선순위)

1. ~~브리핑 overnight 안정화~~ ✅ STEP 145 · ~~지수 카드 스파크라인~~ ✅ STEP 144
2. **홈 레이아웃 비율 미세조정** (메인/우측레일 균형)
3. **인기글 예시 시드** (HotDiscussions·평가글 초기 콘텐츠 — '예시' 명확 표기)
4. ~~외국인보유율·상장주식수 메타~~ ✅ STEP 147 완료
5. **Sponsored 분리 UI** (광고 ↔ 평가 시각 분리)
6. **카카오 OAuth 활성화** (사용자) / **Vercel 배포 + unjong.com** (사용자)

## 5. DB 마이그레이션 — 020·021·022 까지 모두 적용 완료

005 → 014 → 015 → 016 → 017 → 018 → 019 → **020 → 021 → 022** (Cowork Supabase MCP, 운종 DB ref `qxkmwlkchyxfzxbonhtj` = 표시명 "OT-Marketing")
- 005 채팅 기본 / 014 room·nickname / 015 채팅 통합 / 016 users V5 / 017 discussions / 018 댓글 / 019 platform 디렉토리 + 시드
- **020 dislike_votes** — 상품·리딩방 평가 추천/비추천 ✅ (06-04)
- **021 fss_advisors** — 금감원 원장 + 인증 컬럼, **FSS 1,738건 적재** ✅ (06-04)
- **022 discussion_dislike** — 종목 토론 추천/비추천 ✅ (06-04)
- ⚠️ POTAL ref `zyurflkhiregundhisky` 절대 사용 금지 (혼동 주의)

## 6. 핵심 참조 파일

| 파일 | 용도 |
|------|------|
| `docs/NEXT_SESSION_START.md` | **가장 최신 상태** (이 파일과 같이 읽기) |
| `docs/CHANGELOG.md` | 세션별 변경 이력 |
| `session-context.md` | TODO + 누적 결정사항 |
| `CLAUDE.md` | Cowork ↔ Claude Code 역할 분담 |
| `docs/PRODUCT_SPEC_V4.md` | V4 비전 (V5 는 NEXT_SESSION_START 참조) |
| `docs/BRAND_IDENTITY.md` | 운종 브랜드 정체성 + V5 디자인 시스템 |

## 7. 세션 시작 시 Cowork 액션

1. **이 파일 + NEXT_SESSION_START.md 읽기**
2. `session-context.md` TODO 가비지 컬렉션
3. 사용자에게 다음 STEP 제안 → 결정 후 명령서 작성
4. 명령서 작성 시 보안: `.env.local` 값 절대 평문 X (마스킹·`.env.example` 형식)
