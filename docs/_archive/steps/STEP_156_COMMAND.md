<!-- 2026-06-04 -->
# STEP 156 — 홈을 토스식 시장 대시보드로 (홈만)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_156_COMMAND.md 파일 내용대로 실행해줘`

## 목표
**홈 화면만** 토스증권 홈처럼 = **[시장 상태바] + [지수 그리드] + [큰 실시간 랭킹 테이블] + [우측 관심 레일]**.
나머지 모듈(뉴스·검증평가·섹터·ETF·인기종목 등)은 홈에서 내림. 다른 페이지·네비는 안 건드림.
> ⚠️ STEP 155(네비 4탭)는 보류. 이번엔 **홈만**.

## 전제 상태
- HEAD: `01f2682` (STEP 154) — 빌드 ✓ / git clean
- 변경: `HomeClientV6.tsx`(전체 재작성) + `MarketClient.tsx`(embedded prop 2곳). 둘 다 기존 컴포넌트 재사용 — 새 빌드 최소.

## 설계
- **랭킹 테이블 = 이미 만든 `MarketClient` 재사용** (토스 홈의 "실시간 차트" = 우리 마켓 랭킹). `embedded` prop 추가 → 홈에선 "마켓" 헤더/컨테이너 없이 랭킹만, `/market` 페이지는 그대로.
- 지수 그리드 = `HomeIndexBar`(있음) · 관심 레일 = `HomeRightRail`(있음) 재사용.
- 시장 상태바 = 토스식 정적 라벨(국내 애프터마켓·해외 프리마켓).
- (다음 반복: 주요 일정 카드 · 지수 수급 · 코스피/코스닥 실값 · 종목 미리보기 패널)

---

## 작업 1/2 — `components/market/MarketClient.tsx` (embedded prop, 2곳 부분 교체)

### ① 함수 시그니처
**찾기:**
```tsx
export default function MarketClient() {
```
**바꾸기:**
```tsx
export default function MarketClient({ embedded = false }: { embedded?: boolean }) {
```

### ② 컨테이너 + 헤더 (embedded 분기)
**찾기:**
```tsx
  return (
    <div className="max-w-[1480px] mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-unjong-primary">마켓</h1>
        <p className="mt-1 text-sm text-unjong-muted">실시간 랭킹 — 종목 클릭 시 상세로. (시총·52주 필터·히트맵은 순차 확장)</p>
      </header>
```
**바꾸기:**
```tsx
  return (
    <div className={embedded ? "" : "max-w-[1480px] mx-auto px-4 py-6"}>
      {embedded ? (
        <h2 className="text-lg font-bold text-unjong-primary mb-3">📈 실시간 차트</h2>
      ) : (
        <header className="mb-4">
          <h1 className="text-xl font-bold text-unjong-primary">마켓</h1>
          <p className="mt-1 text-sm text-unjong-muted">실시간 랭킹 — 종목 클릭 시 상세로. (시총·52주 필터·히트맵은 순차 확장)</p>
        </header>
      )}
```
> `/market` 페이지(`<MarketClient />`)는 prop 없음 → `embedded=false` → 기존과 100% 동일. 홈만 `embedded`.

---

## 작업 2/2 — `components/home-v6/HomeClientV6.tsx` (파일 전체 교체)

```tsx
"use client";

import HomeIndexBar from "./HomeIndexBar";
import HomeRightRail from "./HomeRightRail";
import MarketClient from "@/components/market/MarketClient";

export default function HomeClientV6() {
  return (
    <div className="max-w-[1480px] mx-auto px-6 py-5">
      {/* 시장 상태바 (토스식) */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-unjong-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1AC267]" />
          국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1AC267]" />
          해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
        </span>
      </div>

      {/* 지수 그리드 */}
      <HomeIndexBar />

      {/* 메인(실시간 랭킹) + 우측 관심 레일 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-5">
        <main className="min-w-0">
          <MarketClient embedded />
        </main>
        <HomeRightRail />
      </div>
      {/* 푸터는 전역 LayoutShell 이 렌더 */}
    </div>
  );
}
```

> 기존 모듈(HomeBannerSlot·HomeBriefing·MarketNewsModule·검증평가·HomeGlobalRanking·HomeSectorTheme·HotDiscussions·HomeCryptoSlot·HomeQuickLinks·HomeEtfPicks·HomePopularStocks)는 **홈에서 내림**(파일은 그대로 존재, import만 제거). fssCount 로직도 제거.

---

## 작업 3/3 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 홈을 토스식 시장 대시보드로 — 지수그리드 + 실시간 랭킹(MarketClient 재사용) + 관심 레일 (STEP 156)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] (확인) `npm run dev` → 홈(`/`)이 [시장 상태바 + 지수 + 실시간 랭킹 테이블 + 관심 레일]로 토스처럼 보이는지. `/market` 페이지는 그대로인지

## 주의·예상 이슈
- `MarketClient` embedded 는 `/market` 무영향(prop 없으면 false). 홈만 헤더/컨테이너 생략.
- 홈에서 내린 모듈 파일들은 삭제 X(존재) → 빌드 깨지지 않음. 단지 홈에 안 보일 뿐.
- 새 HomeClientV6 는 import 3개(HomeIndexBar·HomeRightRail·MarketClient)만 사용 → 미사용 import 0.
- 시장 상태바는 정적 라벨(v1). 실시간 장세 판정은 다음 반복.

---
> STEP 156 = 홈 토스식 대시보드 v1. 전제 `01f2682` → 보고 나서 다음 반복(주요 일정·수급·코스피 실값·미리보기). 문서·STEP 154 문서는 묶어서 갱신.
