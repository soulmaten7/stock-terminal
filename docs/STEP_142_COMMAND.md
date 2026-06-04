<!-- 2026-06-03 -->
# STEP 142 — 포털형 홈 전면 재구성 (정보 포털 레이아웃)

## 🟢 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
호출법: `@docs/STEP_142_COMMAND.md 파일 내용대로 실행해줘`

---

## 🎯 목표

운종 홈을 **한국 증권 정보 포털 레이아웃**(상단 지수 바 → 브리핑·뉴스 → 실시간 랭킹 → 인기 업종·테마 → 인기 토론글 → 가상자산 → 퀵링크 → ETF → 이용자 종목 → 푸터 + 우측 레일)으로 전면 재구성한다. 섹션 구성·순서·기능을 포털 표준 패턴대로 갖추는 게 목표.

### 절대 원칙 (브랜드·콘텐츠)
- **운종 자체 카피·라벨·디자인 시스템만 사용.** 특정 타사(네이버 등)의 로고·상호·고유 문구·뉴스/AI 본문·광고 이미지·고유 트레이드 드레스를 그대로 복제하지 말 것. 구조·기능 패턴만 구현하고 표현은 운종 것으로.
- **데이터 없는 섹션은 제거하지 말고 "준비 중" placeholder shell(빈 카드 + 안내)** 로 자리만 잡는다. (사용자가 이후 운종 방향으로 채움)
- 운종 디자인 시스템 준수: `bg-unjong-surface` · `rounded-2xl` · `shadow-soft` · `p-5` · `gap-5`, 등락색 토스식(상승 `#1AC267`/하락 `#F04452`).

---

## 📌 전제 상태

- **이전 HEAD**: `0ba360d` (STEP 141). *시작 전 `git log --oneline -1` 확인.*
- **마이그레이션 없음 · DB 변경 없음.**
- 새 홈 컴포넌트 `components/home-v6/HomeClientV6.tsx` 생성 → `app/page.tsx` 가 이걸 렌더하도록 교체. 기존 `home-v5/*` 모듈은 **재사용**(삭제 ❌).

### 활용 가능한 기존 자산 (먼저 각 파일을 읽고 props 확인 후 재사용)
| 용도 | 기존 자산 |
|------|-----------|
| 글로벌 지수 | `/api/yahoo/indices` · `/api/home/global` · `components/global/*` |
| AI/시장 브리핑 | `/api/home/briefing` · `components/briefing/*` |
| 뉴스(카테고리 탭) | `components/home-v5/MarketNewsModule.tsx` |
| 거래량/등락 랭킹 | `/api/kis/volume-rank` · `/api/kis/movers` · `components/movers/*` |
| 업종·테마 | `/api/home/sectors` · `/api/kis/theme` · `/api/kis/sector` |
| 인기 토론글 | `components/home-v5/HotDiscussionsModule.tsx` |
| 검증·평가(운종) | `components/home-v5/HotRoomReviewsModule.tsx` · `HotProductReviewsModule.tsx` |
| ETF | `products`(category=etf) via `createAnonClient` |
| 관심종목 | `components/sidebar/WatchlistPanel.tsx` |
| 실시간 채팅 | `components/sidebar/ChatPanel.tsx` |
| 푸터 | `components/layout/Footer.tsx` |

---

## 🧱 홈 섹션 구조 (위→아래, 운종판)

좌측 메인 컬럼(1fr) + 우측 레일(320px), `max-w-[1480px] mx-auto px-6`, `grid grid-cols-[1fr_320px] gap-6`.

| # | 섹션 | 모듈 | 데이터 | 비고 |
|---|------|------|--------|------|
| 0 | 상단 배너 자리 | `HomeBannerSlot` (신규) | — | placeholder("배너 영역") |
| 1 | 주요 지표 바 | `HomeIndexBar` (신규) | yahoo/indices + kis 지수 | 탭(국내·미국·아시아·유럽) + 지수 카드 가로 + 미니 스파크라인 |
| 2 | 시장 브리핑 + 뉴스 | `HomeBriefing` (신규) + `MarketNewsModule` 재사용 | /api/home/briefing + RSS | 브리핑 헤더(날짜·시각)+면책(운종 문구)+썸네일3+헤드라인 |
| 3 | 🛡️ 검증·평가 (운종 차별점) | `HotRoomReviewsModule`+`HotProductReviewsModule` 재사용 | DB | 포털 패턴엔 없지만 운종 정체성 — 유지 |
| 4 | 실시간 랭킹 | `HomeGlobalRanking` (신규) | volume-rank / movers / (검색=placeholder) | 국가 탭 + 3열(거래량/거래대금/검색 상위) |
| 5 | 인기 업종·테마 | `HomeSectorTheme` (신규) | /api/home/sectors · kis/theme | 국내/미국 탭 + 1~4위 카드(등락률+상승/보합/하락 바) |
| 6 | 오늘의 인기 토론글 | `HotDiscussionsModule` 재사용(카드형) | discussions | 인기글 카드 |
| 7 | 가상자산 TOP | `HomeCryptoSlot` (신규) | — | placeholder("가상자산 — 준비 중", 결정③ 코인 보류) |
| 8 | 퀵 링크 | `HomeQuickLinks` (신규) | 링크 | 환율/오늘의 토론/리포트 pill 3개 (리포트=placeholder 링크) |
| 9 | 요즘 주목할 ETF | `HomeEtfPicks` (신규) | products(etf) | 국내/미국 탭 + 필터 리스트 + 1~3위 카드 |
| 10 | 이용자 인기 종목 | `HomePopularStocks` (신규) | watchlist 집계 or placeholder | "운종 이용자 관심 TOP" 3블록(계좌 데이터 없음 → placeholder) |
| 11 | 푸터 | `Footer` 재사용 | — | 운종 footer |
| R | 우측 레일 | `HomeRightRail` (신규) | WatchlistPanel + placeholder | 관심종목 + 숏컷/머니스토리 자리(placeholder) |

---

## 🔢 작업 순서

### STEP 1 — 레이아웃 셸 `HomeClientV6.tsx`

`components/home-v6/HomeClientV6.tsx` 신규 (섹션 조립 + fss 신뢰 지표 히어로 유지):

```tsx
"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import Footer from "@/components/layout/Footer";
import MarketNewsModule from "@/components/home-v5/MarketNewsModule";
import HotDiscussionsModule from "@/components/home-v5/HotDiscussionsModule";
import HotRoomReviewsModule from "@/components/home-v5/HotRoomReviewsModule";
import HotProductReviewsModule from "@/components/home-v5/HotProductReviewsModule";
import HomeBannerSlot from "./HomeBannerSlot";
import HomeIndexBar from "./HomeIndexBar";
import HomeBriefing from "./HomeBriefing";
import HomeGlobalRanking from "./HomeGlobalRanking";
import HomeSectorTheme from "./HomeSectorTheme";
import HomeCryptoSlot from "./HomeCryptoSlot";
import HomeQuickLinks from "./HomeQuickLinks";
import HomeEtfPicks from "./HomeEtfPicks";
import HomePopularStocks from "./HomePopularStocks";
import HomeRightRail from "./HomeRightRail";

export default function HomeClientV6() {
  const [fssCount, setFssCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { count } = await createAnonClient()
        .from("fss_advisors").select("*", { count: "exact", head: true }).eq("status", "active");
      if (!cancelled) setFssCount(count ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-[1480px] mx-auto px-6 py-5">
      <HomeBannerSlot fssCount={fssCount} />
      <HomeIndexBar />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-5">
        <main className="space-y-6 min-w-0">
          <HomeBriefing />
          <MarketNewsModule />
          <section>
            <h2 className="text-lg font-bold text-unjong-primary mb-3 flex items-center gap-1.5">
              🛡️ 검증·평가 <span className="text-xs text-unjong-muted font-normal">금감원 신고 + 실사용자 평가</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <HotRoomReviewsModule /><HotProductReviewsModule />
            </div>
          </section>
          <HomeGlobalRanking />
          <HomeSectorTheme />
          <HotDiscussionsModule />
          <HomeCryptoSlot />
          <HomeQuickLinks />
          <HomeEtfPicks />
          <HomePopularStocks />
        </main>
        <HomeRightRail />
      </div>
      <Footer />
    </div>
  );
}
```
그리고 `app/page.tsx` 의 `HomeClientV5` → `HomeClientV6` 로 교체(metadata 유지).
> `Footer` import 가 default/named 인지 파일 열어 확인 후 맞출 것.

---

### STEP 2 — 공용 placeholder 셸 컴포넌트

`components/home-v6/PlaceholderCard.tsx`:
```tsx
export default function PlaceholderCard({ title, note }: { title: string; note?: string }) {
  return (
    <section className="bg-unjong-surface rounded-2xl border border-dashed border-unjong-border p-5">
      <h2 className="text-base font-bold text-unjong-primary mb-1">{title}</h2>
      <p className="text-sm text-unjong-muted">{note ?? "준비 중 — 운종 데이터 연동 예정"}</p>
      <div className="mt-3 h-24 rounded-xl bg-unjong-background flex items-center justify-center text-xs text-unjong-muted">
        섹션 자리 (placeholder)
      </div>
    </section>
  );
}
```
이걸 `HomeBannerSlot`(배너), `HomeCryptoSlot`(가상자산), `HomePopularStocks`(이용자 종목 — 3블록 placeholder) 에 활용.
- `HomeBannerSlot`: 상단 가로 배너 자리 + 우측에 fss 신뢰 지표("🛡️ 금감원 신고 {fssCount}개 업체 자동 대조") 노출.
- `HomeCryptoSlot`: `<PlaceholderCard title="거래대금 TOP 가상자산" note="가상자산은 추후 단계에서 검토 (현재 한국 주식 집중)" />`
- `HomePopularStocks`: 3열 grid 의 PlaceholderCard("이용자 인기 종목 — 계좌 연동 후 제공").

---

### STEP 3 — 데이터 연동 섹션 (신규 모듈)

각 모듈은 `createAnonClient` 또는 `fetch('/api/...')` 로 로드, LoadingState/EmptyState 처리, 운종 카드 스타일.

**(a) `HomeIndexBar`** — `/api/yahoo/indices`(미국·글로벌) + 국내 지수. 탭(국내/미국/아시아/유럽) 전환, 지수 카드(이름·현재가·등락 + 미니 스파크라인 SVG). 데이터 키는 라우트 응답 읽고 매핑. 스파크라인 데이터 없으면 생략.

**(b) `HomeBriefing`** — `/api/home/briefing` 호출. 헤더 "📰 시장 브리핑 · {오늘 날짜·시각}" + **운종 자체 면책 문구**("본 요약은 참고용이며 투자 책임은 본인에게 있습니다") + 본문 요약 텍스트. (브리핑 응답 구조는 라우트 읽고 매핑; 실패 시 EmptyState)

**(c) `HomeGlobalRanking`** — 국가 탭(국내/미국…) + 3열: "거래량 상위"(`/api/kis/volume-rank`), "거래대금 상위"(`/api/kis/movers` 또는 동일 소스 정렬), "검색 상위"(데이터 없음 → 열 안에 placeholder "준비 중"). 각 열 TOP 10, 순위+종목명+현재가+등락%. 종목 클릭 → `/stock/[code]`.

**(d) `HomeSectorTheme`** — 국내/미국 탭 + `/api/home/sectors`(또는 kis/sector·theme). 업종 1~4위 카드: 업종명·평균등락률 + 상승/보합/하락 막대(있으면). 데이터만큼만 렌더.

**(e) `HomeQuickLinks`** — pill 3개 가로: "오늘의 환율"(→ `/api/...` 환율 있으면, 없으면 placeholder), "오늘의 토론"(→ 토론 섹션 앵커 또는 `/`), "많이 보는 리포트"(placeholder 링크). 운종 라벨.

**(f) `HomeEtfPicks`** — 국내/미국 탭 + 좌측 필터 리스트(거래대금많은/많이오른/지수추종/배당/테마 — 운종 라벨) + 우측 ETF 1~3위 카드. 데이터: `products` 에서 `category='etf'` 조회(`createAnonClient`), 정렬은 discussion_count 등 보유 컬럼 기준(거래대금 컬럼 없으면 그 필터는 placeholder). 카드: 티커·이름·운용사·(가격 있으면).

**(g) `HomeRightRail`** — 상단 아이콘 nav(알림·관심종목·보유종목·최근 본 — 링크/placeholder) + `WatchlistPanel` 재사용 + 하단 "숏컷/머니스토리" placeholder 카드. sticky top-5.

> 각 모듈: 한국 6자리/미국 구분 필요 시 정규식, 폴링은 시세성만 ≥30초. 실패·빈 데이터는 EmptyState/placeholder — **빈 자리라도 항상 렌더**.

---

### STEP 4 — 빌드 + 커밋

```bash
cd ~/stock-terminal && npm run build
```
✓ exit 0 · `console.log` 금지. 빈 데이터에도 렌더 깨지지 않는지 확인(EmptyState/placeholder).

```bash
cd ~/stock-terminal && git add components/home-v6/ app/page.tsx \
  && git commit -m "feat(v6): 포털형 홈 전면 재구성 — 지수바·브리핑·랭킹·업종테마·인기글·ETF·우측레일 + 데이터없는 섹션 placeholder (STEP 142)" \
  && git push
```

---

### STEP 5 — 문서 갱신

오늘(2026-06-03):
- `CLAUDE.md` · `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md` 헤더 + STEP 142 블록
- `docs/NEXT_SESSION_PLAYBOOK.md` (HEAD 갱신 · 홈 = HomeClientV6 포털형으로 §5 갱신 · home-v5→v6)
- `docs/SESSION_KICKOFF.md` (현재 커밋)

---

## ✅ 완료 기준 (DoD)

1. 홈이 11개 섹션 + 우측 레일 + 푸터로 포털형 재구성, `app/page.tsx` → `HomeClientV6`.
2. 데이터 연동 섹션(지수·브리핑·뉴스·검증평가·랭킹·업종테마·인기글·ETF·관심종목)이 실데이터 또는 EmptyState 로 동작.
3. 데이터 없는 섹션(배너·가상자산·검색상위·이용자종목·숏컷)이 **placeholder shell 로 자리 유지**.
4. 운종 디자인 시스템·운종 카피만 사용(타사 로고/고유 문구/광고 복제 ❌).
5. `npm run build` ✓ exit 0 + push.
6. 6개 문서 갱신.

## ⚠️ 주의

- 마이그레이션·DB 변경 ❌.
- 기존 `home-v5/*` 모듈 삭제 ❌(재사용). 새 코드는 `home-v6/`.
- 각 기존 API/모듈은 **먼저 파일을 읽어 응답·props 확인 후** 연결(추측 금지).
- 폴링은 시세성만 ≥30초(KIS rate limit).
- 타사 고유 콘텐츠(로고·정확한 카피·뉴스/AI 본문·광고)는 복제하지 말고 운종 문구/플레이스홀더로.

---

> **STEP 142 = 포털형 홈 골격 완성.** 이후 사용자가 섹션별로 "운종 방향 수정"(문구·강조·제거·데이터 교체)을 지시 → 빠른 반복. 다음 후보: 섹션별 디테일 폴리시 · 데이터 없는 섹션 운종식 대체.
