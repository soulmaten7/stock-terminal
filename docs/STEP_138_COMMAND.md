<!-- 2026-06-03 -->
# STEP 138 — 홈 화면 신뢰 축 재배치 (V6 정체성 정렬)

## 🟢 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
호출법: `@docs/STEP_138_COMMAND.md 파일 내용대로 실행해줘`

---

## 🎯 목표 — "정문(홈)을 신뢰의 옷으로 갈아입힌다"

지금 홈은 태그라인만 V6("투자상품에 속지 않게 돕는 곳")로 바뀌었을 뿐, **레이아웃 위계는 여전히 V5 포털**이다. 메인이 "🔥 시장 핫이슈(가격 카드)"로 시작 → 이건 네이버·토스가 하는 "정보 출발점" 정체성. 게다가 STEP 137에서 만든 **신뢰 엔진(금감원 ✓ 인증, 추천/비추천)이 홈에 하나도 전시되지 않는다.**

이번 STEP 은 **갈아엎기가 아니라 위계 재정렬 + 신뢰 신호 전시**다. 4박자(신뢰·대화·정보·허브) 중 **신뢰를 맨 위로**, 정보(가격 카드)는 한 단계 내린다. 모든 모듈은 유지한다.

> **핵심 원칙**: 홈에 들어온 사람이 3초 안에 "여기는 검증·평가하는 곳이구나"를 느껴야 한다.

---

## 📌 전제 상태

- **이전 HEAD**: `eff1d77` (STEP 137 — FSS 인증 + 임포트 1,738건 적재 완료)
- DB: 마이그레이션 020·021 적용 완료. `fss_advisors` 1,738행, anon SELECT 열림(`fss_advisors public read`). `platform_discussions` anon SELECT 열림(hidden=false).
- **마이그레이션 없음** — 순수 프론트엔드 작업.
- 데이터 읽기 클라이언트: `@/lib/supabase/anon-client` 의 `createAnonClient()`
- 손대는 파일:
  - `components/home-v5/HomeClientV5.tsx` (위계 재정렬 + 히어로 지표)
  - `components/home-v5/HotRoomReviewsModule.tsx` (금감원 뱃지 강조 + "신고 미확인")
  - `components/home-v5/HotReviewPostsModule.tsx` (**신규** — 평가 글 추천/비추천 전시)
  - `components/home-v5/MarketNewsModule.tsx` (카테고리 탭)

---

## 🎨 새 홈 위계 (재정렬 후)

```
[히어로]  투자상품에 속지 않게 돕는 곳  +  🛡️ 금감원 신고 1,738개 업체 자동 대조 중

좌 aside        |  메인 (신뢰 우선)                         | 우 aside
─────────────── | ───────────────────────────────────────── | ──────────────
실시간 채팅      |  ① 🛡️ 검증·평가 (리딩방 평가 + 상품 평가)   | 관심 종목
활발한 채팅방    |  ② ⭐ HOT 평가 글 (추천/비추천 · NEW)        |
                |  ③ 💬 HOT 토론                              |
                |  ④ 📊 시장 정보 (가격 카드 4개 — 위계 ↓)    |
                |  ⑤ 📰 뉴스 (카테고리 탭)                    |
```

이전: 시장핫이슈 → 토론 → 평가 → 뉴스 (정보가 맨 위)
이후: **검증·평가 → 평가글 → 토론 → 시장정보 → 뉴스** (신뢰가 맨 위, 정보는 4번)

---

## 🔢 작업 순서

### STEP 1 — `HomeClientV5.tsx` 재정렬 + 히어로 신뢰 지표

`components/home-v5/HomeClientV5.tsx` 를 아래로 교체:

```tsx
"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ChatPanel } from "@/components/sidebar/ChatPanel";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";
import { createAnonClient } from "@/lib/supabase/anon-client";
import {
  MoversCard,
  VolumeCard,
  NetBuyBrokerCard,
  ScalperDisclosureCard,
} from "@/components/cards/ScalperCards";
import HotDiscussionsModule from "./HotDiscussionsModule";
import HotChatRoomsModule from "./HotChatRoomsModule";
import MarketNewsModule from "./MarketNewsModule";
import HotProductReviewsModule from "./HotProductReviewsModule";
import HotRoomReviewsModule from "./HotRoomReviewsModule";
import HotReviewPostsModule from "./HotReviewPostsModule";

export default function HomeClientV5() {
  const [fssCount, setFssCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = createAnonClient();
      const { count } = await sb
        .from("fss_advisors")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (!cancelled) setFssCount(count ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {/* 히어로 — V6 정체성 + 신뢰 지표 */}
      <div className="px-10 pt-5">
        <div className="rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-unjong-primary">투자상품에 속지 않게 돕는 곳</h1>
            <p className="text-sm text-unjong-muted mt-0.5">
              정확한 정보 + 솔직한 토론 + 검증된 신뢰 — 주식·상품·리딩방을 한곳에서 교차검증하세요.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-unjong-background px-4 py-2.5 flex-shrink-0">
            <ShieldCheck size={18} className="text-unjong-accent" />
            <div className="leading-tight">
              <p className="text-xs text-unjong-muted">금감원 신고업체 자동 대조</p>
              <p className="text-sm font-bold text-unjong-primary">
                {fssCount !== null ? `${fssCount.toLocaleString()}개 업체` : "대조 중…"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr_320px] gap-5 px-10 py-5 min-h-[calc(100vh-200px)]">
        {/* 좌측: 대화 */}
        <aside className="space-y-5 sticky top-5 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="h-[400px] flex flex-col">
            <ChatPanel />
          </div>
          <HotChatRoomsModule />
        </aside>

        {/* 가운데: 신뢰 우선 위계 */}
        <main className="space-y-5">
          {/* ① 검증·평가 — 운종 정체성 (맨 위) */}
          <section>
            <h2 className="text-lg font-bold text-unjong-primary mb-3 flex items-center gap-1.5">
              🛡️ 검증·평가
              <span className="text-xs text-unjong-muted font-normal">금감원 신고 여부 + 실사용자 평가</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <HotRoomReviewsModule />
              <HotProductReviewsModule />
            </div>
          </section>

          {/* ② HOT 평가 글 — 추천/비추천 전시 (NEW) */}
          <HotReviewPostsModule />

          {/* ③ HOT 토론 — 대화 */}
          <HotDiscussionsModule />

          {/* ④ 시장 정보 — 위계 한 단계 ↓ (주인공 아님) */}
          <section>
            <h2 className="text-base font-semibold text-unjong-muted mb-3">📊 시장 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <MoversCard />
              <VolumeCard />
              <NetBuyBrokerCard />
              <ScalperDisclosureCard />
            </div>
          </section>

          {/* ⑤ 뉴스 — 카테고리 */}
          <MarketNewsModule />
        </main>

        {/* 우측: 관심 종목 */}
        <aside className="sticky top-5 self-start max-h-[calc(100vh-2rem)]">
          <WatchlistPanel />
        </aside>
      </div>
    </>
  );
}
```

> 핵심 변화: ① 검증·평가가 맨 위, ④ 시장정보 제목 색을 `text-unjong-muted` 로 낮춰 위계 표현. 히어로에 `fss_advisors` 실 카운트 노출.

---

### STEP 2 — `HotRoomReviewsModule.tsx` 인증 뱃지 강조 + "신고 미확인"

기존 작은 ShieldCheck 아이콘을 **명시적 pill** 로 바꾸고, 미인증은 회색 "신고 미확인" 노출.

해당 `<li>` 내부의 이름 줄 + 그 아래를 아래처럼 교체:

```tsx
<div className="min-w-0 flex-1">
  <p className="text-sm font-semibold text-unjong-primary truncate">{r.name}</p>
  <div className="flex items-center gap-1.5 mt-0.5">
    {r.is_certified ? (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-[#1AC267]/10 text-[#1AC267]">
        <ShieldCheck size={11} /> 금감원 신고 ✓
      </span>
    ) : (
      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-unjong-muted">
        신고 미확인
      </span>
    )}
    <span className="text-xs text-unjong-muted truncate">{r.operator || "운영자 미상"}</span>
  </div>
</div>
```

> `is_certified` 는 이미 select 에 포함됨 — 쿼리 변경 불필요. `ShieldCheck` import 도 이미 있음.
> 색: 인증=토스 그린(`#1AC267`), 미확인=회색. **운종 신뢰 = 초록, 미확인 = 무채색** 규칙 통일.

---

### STEP 3 — `HotReviewPostsModule.tsx` 신규 (추천/비추천 전시)

STEP 137·020 에서 만든 평가 글(`platform_discussions`)을 홈에 전시. 이게 **추천/비추천·outcome 을 보여주는 유일한 홈 자리**.

`components/home-v5/HotReviewPostsModule.tsx` 신규:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type ReviewPost = {
  id: string;
  target_type: "product" | "room";
  target_id: string;
  nickname: string;
  tier: number;
  content: string;
  outcome: "positive" | "neutral" | "negative" | null;
  like_count: number;
  dislike_count: number;
  created_at: string;
};

const OUTCOME = {
  positive: { label: "수익", cls: "bg-[#1AC267]/10 text-[#1AC267]" },
  negative: { label: "손실", cls: "bg-[#F04452]/10 text-[#F04452]" },
  neutral:  { label: "중립", cls: "bg-slate-100 text-unjong-muted" },
} as const;

export default function HotReviewPostsModule() {
  const [items, setItems] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const sb = createAnonClient();
        const { data } = await sb
          .from("platform_discussions")
          .select("id, target_type, target_id, nickname, tier, content, outcome, like_count, dislike_count, created_at")
          .eq("hidden", false)
          .order("like_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(6);
        if (!cancelled) setItems((data || []) as ReviewPost[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-unjong-primary flex items-center gap-1.5">
          ⭐ HOT 평가 글 <span className="text-xs text-unjong-muted font-normal">추천 순</span>
        </h2>
      </header>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState icon="⭐" title="첫 평가를 남겨보세요" description="상품·리딩방 페이지에서 작성 가능." />
      ) : (
        <ul className="space-y-2">
          {items.map((p) => {
            const href = p.target_type === "room" ? `/room/${p.target_id}` : `/product/${p.target_id}`;
            const typeLabel = p.target_type === "room" ? "리딩방" : "상품";
            const tierEmoji = p.tier === 3 ? "🏆" : p.tier === 2 ? "✓" : "";
            const oc = p.outcome ? OUTCOME[p.outcome] : null;
            return (
              <li key={p.id}>
                <Link href={href} className="block bg-unjong-background rounded-lg p-4 hover:border-unjong-accent border border-transparent transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{typeLabel}</span>
                    {oc && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${oc.cls}`}>{oc.label}</span>}
                    <span className="text-sm font-medium text-unjong-primary">{tierEmoji} {p.nickname}</span>
                  </div>
                  <p className="text-sm text-unjong-primary truncate">{p.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-unjong-muted">
                    <span className="flex items-center gap-1"><ThumbsUp size={11} /> {p.like_count}</span>
                    <span className="flex items-center gap-1"><ThumbsDown size={11} /> {p.dislike_count}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
```

> ⚠️ 현재 `platform_discussions` 데이터가 0행일 수 있음(시드 없음) → EmptyState 정상 노출. 빌드·동작엔 문제 없음.

---

### STEP 4 — `MarketNewsModule.tsx` 카테고리 탭 (What 4 — 뉴스 카테고리별)

제목 키워드 기반 경량 분류(전체·국내증시·해외·경제·정책). RSS 가 카테고리를 안 주므로 **제목 키워드 휴리스틱**으로 분류(정밀 분류 아님 — 1차).

`MarketNewsModule` 에 카테고리 상태 + 필터 추가:

```tsx
// items 정의부 아래에 추가
const CATEGORIES = ["전체", "국내증시", "해외", "경제", "정책"] as const;
type Cat = (typeof CATEGORIES)[number];

function categorize(title: string): Cat {
  const t = title;
  if (/미국|나스닥|S&P|뉴욕|연준|FOMC|엔비디아|애플|테슬라|중국|일본|유럽/.test(t)) return "해외";
  if (/금리|환율|물가|GDP|수출|무역|고용|경기|반도체 업황/.test(t)) return "경제";
  if (/정부|금융위|금감원|규제|법안|정책|국회|세금/.test(t)) return "정책";
  if (/코스피|코스닥|증시|상한가|급등|급락|공시|실적|종목/.test(t)) return "국내증시";
  return "국내증시";
}
```

컴포넌트 내부:
```tsx
const [cat, setCat] = useState<Cat>("전체");
const filtered = cat === "전체" ? items : items.filter((n) => categorize(n.title) === cat);
```

헤더 아래에 탭 UI 추가:
```tsx
<div className="flex gap-1.5 mb-3 flex-wrap">
  {CATEGORIES.map((c) => (
    <button
      key={c}
      onClick={() => setCat(c)}
      className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
        cat === c ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
      }`}
    >
      {c}
    </button>
  ))}
</div>
```
그리고 렌더링 `items.map` → `filtered.map`, EmptyState 분기는 `filtered.length === 0` 으로.
> `useState` import 가 이미 있음. 분류는 1차 휴리스틱이라 추후 정교화 가능(주석 남길 것: `// TODO: 분류 정교화`).

---

### STEP 5 — 빌드 + 커밋

```bash
cd ~/stock-terminal && npm run build
```
✓ exit 0 확인. `console.log` 금지.

```bash
cd ~/stock-terminal && git add components/home-v5/HomeClientV5.tsx \
  components/home-v5/HotRoomReviewsModule.tsx \
  components/home-v5/HotReviewPostsModule.tsx \
  components/home-v5/MarketNewsModule.tsx \
  && git commit -m "feat(v6): 홈 신뢰 축 재배치 — 검증·평가 최상단 + 금감원 뱃지/추천·비추천 전시 + 히어로 신뢰지표 + 뉴스 카테고리 (정체성 정렬)" \
  && git push
```

---

### STEP 6 — 문서 갱신

오늘(2026-06-03) 날짜로:
- `CLAUDE.md` · `docs/CHANGELOG.md` · `session-context.md` · `docs/NEXT_SESSION_START.md` 헤더 + STEP 138 블록
- `docs/NEXT_SESSION_PLAYBOOK.md` (HEAD 해시 갱신, 홈 위계 V6 정렬 반영)
- `docs/SESSION_KICKOFF.md` (현재 커밋)

> 참고: PLAYBOOK §5 홈 라우트 설명을 "신뢰 우선 위계(검증·평가→평가글→토론→시장정보→뉴스)" 로 갱신.

---

## ✅ 완료 기준 (DoD)

1. 홈 메인이 "🛡️ 검증·평가" 로 시작 (시장 정보는 4번째).
2. 히어로에 `fss_advisors` 실 카운트("1,738개 업체 자동 대조") 노출.
3. 리딩방 모듈: 인증 = "금감원 신고 ✓"(초록 pill), 미인증 = "신고 미확인"(회색).
4. "⭐ HOT 평가 글" 모듈 추가 — 추천/비추천·outcome 표시 (데이터 0행이면 EmptyState).
5. 뉴스 카테고리 탭 동작.
6. `npm run build` ✓ exit 0 + push.
7. 6개 문서 갱신.

## ⚠️ 주의

- 마이그레이션 없음 — DB 변경 ❌.
- `platform_discussions`·`fss_advisors` 는 anon 읽기로 충분 (service role ❌).
- 기존 모듈 삭제 ❌ — 위계만 재정렬.
- 뉴스 분류는 1차 휴리스틱 — 정밀 분류는 다음 STEP.

---

> **STEP 138 = 정문(홈)을 신뢰 정체성으로 정렬.** 이걸로 "엔진(STEP 137) ↔ 정문(홈)" 의 어긋남이 해소됨. 다음 후보: 상호·홈페이지 자동 매칭 / Phase 2-④ 재무지표 / 평가 시드 데이터 투입.
