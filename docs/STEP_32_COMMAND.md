# STEP 32 — 레거시 `components/home/` 데드코드 대규모 정리

**🚀 실행 명령어 (Sonnet):**

```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

Claude Code 세션에서:

```
@docs/STEP_32_COMMAND.md 파일 내용대로 실행해줘
```

---

## 전제 상태

- 이전 커밋: `9dccb75` (Phase 2-C 경제 캘린더)
- V2 User Flow Architecture 전환(세션 #22) + W5 더미 제거(세션 #15) 이후, `components/home/` 다수 파일이 `HomeClient.tsx`에서 더 이상 import되지 않음
- 레거시 로드맵의 "STEP 32~35 = ProgramTrading/GlobalFutures/WarningStocks/IpoSchedule 더미 제거" 항목은 **이미 ComingSoonCard stub 상태이고 홈에서 빠져있어** 실질적 잔여 작업은 "사용 안 되는 파일 삭제"만 남음
- 동일 맥락에서 다른 레거시 홈 파일(BreakingFeed, InstitutionalFlow, MarketMiniCharts, MarketSummaryCards, MarketTabs, RightSidebar, SupplyDemandSummary, TodayDisclosures, TodayNews, TopMovers, BannerSection, AdColumn, AdBanner)도 함께 정리해 한 커밋에 묶는다 — STEP 32~35를 단일 cleanup으로 통합

## 목표

`app/**` 혹은 활성 `components/widgets/**` 에서 import되지 않는 `components/home/` 레거시 파일 **15개** 삭제. 빌드/런타임에 영향이 없어야 한다.

## 참조 결과 (Cowork 사전 조사)

```
AdBanner            → 1 ref (components/home/AdColumn.tsx — 자체도 데드)
AdColumn            → 0 ref
BannerSection       → 1 ref (components/home/RightSidebar.tsx — 자체도 데드)
BreakingFeed        → 0 ref
GlobalFutures       → 0 ref   ← 구 STEP 33
InstitutionalFlow   → 0 ref
IpoSchedule         → 0 ref   ← 구 STEP 35
MarketMiniCharts    → 0 ref
MarketSummaryCards  → 0 ref
MarketTabs          → 0 ref
ProgramTrading      → 0 ref   ← 구 STEP 32
RightSidebar        → 0 ref
SupplyDemandSummary → 1 ref (RightSidebar — 데드)
TodayDisclosures    → 1 ref (RightSidebar — 데드)
TodayNews           → 1 ref (RightSidebar — 데드)
TopMovers           → 0 ref
WarningStocks       → 0 ref   ← 구 STEP 34
```

유지 대상:
- `components/home/HomeClient.tsx` — 현 홈 레이아웃
- `components/home/WidgetCard.tsx` — 18개 위젯에서 import 중 (공통 카드 셸)

## 실행 단계

### 1. 삭제 전 최종 확인 (grep)

```bash
cd ~/Desktop/OTMarketing
grep -rln "from '@/components/home/\(AdBanner\|AdColumn\|BannerSection\|BreakingFeed\|GlobalFutures\|InstitutionalFlow\|IpoSchedule\|MarketMiniCharts\|MarketSummaryCards\|MarketTabs\|ProgramTrading\|RightSidebar\|SupplyDemandSummary\|TodayDisclosures\|TodayNews\|TopMovers\|WarningStocks\)'" app components 2>/dev/null || true
```

→ **출력이 없어야 한다.** 하나라도 나오면 중단하고 Cowork에 보고.

### 2. 15개 파일 일괄 삭제

```bash
cd ~/Desktop/OTMarketing && rm \
  components/home/AdBanner.tsx \
  components/home/AdColumn.tsx \
  components/home/BannerSection.tsx \
  components/home/BreakingFeed.tsx \
  components/home/GlobalFutures.tsx \
  components/home/InstitutionalFlow.tsx \
  components/home/IpoSchedule.tsx \
  components/home/MarketMiniCharts.tsx \
  components/home/MarketSummaryCards.tsx \
  components/home/MarketTabs.tsx \
  components/home/ProgramTrading.tsx \
  components/home/RightSidebar.tsx \
  components/home/SupplyDemandSummary.tsx \
  components/home/TodayDisclosures.tsx \
  components/home/TodayNews.tsx \
  components/home/TopMovers.tsx \
  components/home/WarningStocks.tsx
```

(17개 파일 — 위 목록 15개 + AdBanner/SupplyDemandSummary/TodayDisclosures/TodayNews 4개는 단일참조 체인이 끊기므로 함께. 최종 합계 17개.)

재집계:
- 0-ref 직접 데드: AdColumn, BreakingFeed, GlobalFutures, InstitutionalFlow, IpoSchedule, MarketMiniCharts, MarketSummaryCards, MarketTabs, ProgramTrading, RightSidebar, TopMovers, WarningStocks → **12개**
- RightSidebar가 사라지면서 체인 데드되는 파일: BannerSection, SupplyDemandSummary, TodayDisclosures, TodayNews → **4개**
- AdColumn이 사라지면서 체인 데드되는 파일: AdBanner → **1개**
- 합계: **17개**

### 3. 폴더 최종 상태 확인

```bash
ls components/home/
```

→ `HomeClient.tsx`, `WidgetCard.tsx` 2개만 남아야 한다.

### 4. 빌드 검증

```bash
npm run build
```

TypeScript/Next 컴파일 에러 0개 확인. 에러가 나면 즉시 중단하고 로그 공유.

### 5. 개발 서버 quick check (선택)

```bash
# 이미 돌고 있으면 생략
npm run dev
```

홈 `/` 열어서 위젯 16개(Chat/Chart/OrderBook/Tick/Watchlist/ScreenerMini/News/DART/EconCalendarMini/Movers/Volume/NetBuy/Themes/Global) 렌더 확인.

### 6. 커밋 & 푸시

```bash
git add -A
git commit -m "chore: remove legacy components/home/* dead files (17)

Dashboard V2 User Flow Architecture migration left 17 components/home/*
files unreferenced from app/** and active widgets. Bulk removed.

Direct dead (12): AdColumn, BreakingFeed, GlobalFutures, InstitutionalFlow,
IpoSchedule, MarketMiniCharts, MarketSummaryCards, MarketTabs,
ProgramTrading, RightSidebar, TopMovers, WarningStocks

Chain dead via RightSidebar: BannerSection, SupplyDemandSummary,
TodayDisclosures, TodayNews

Chain dead via AdColumn: AdBanner

Kept: HomeClient.tsx (active layout), WidgetCard.tsx (shared shell).

Consolidates roadmap STEP 32-35 (individual ComingSoonCard removals)
into a single cleanup — targets were already stub+unreferenced."

git push
```

## 세션 종료 체크

작업 완료 시 Cowork이 아래 4개 문서 헤더 날짜를 2026-04-22로 업데이트하고 CHANGELOG 엔트리 추가:
- `CLAUDE.md`
- `docs/CHANGELOG.md`
- `session-context.md`
- `docs/NEXT_SESSION_START.md`

## 다음 STEP 예고

STEP 33 후보 (Cowork 판단 후 확정):
- **A. `/admin` 대시보드 설정** — 어드민 페이지가 없으면 리드/구독자 관리 UI
- **B. 장중 실시간 검증** — KIS API 호출 빈도/limit 실측, 위젯 polling 간격 조정
- **C. 세션 종료 hook 점검** — `.claude/hooks/` 자동 검증 스크립트가 실제로 동작하는지 확인
