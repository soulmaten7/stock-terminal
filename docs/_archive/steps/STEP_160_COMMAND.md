<!-- 2026-06-06 -->
# STEP 160 — 홈 지수 그리드 토스식 빽빽 (10개 · 토글 제거)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_160_COMMAND.md 파일 내용대로 실행해줘`

## 목표
홈 "주요 지수"를 **토스처럼 빽빽하게**. 현재 미국 5개 큰 카드 + 미국/국내 토글(국내는 "준비 중" 빈칸) → **국내·해외·환율·원자재·코인 10개를 한 판에** 빽빽한 그리드로. **토글 제거**.
- 넣을 10개(순서 그대로): 코스피 · 코스닥 · 원/달러 · S&P 500 · 나스닥 · 다우 · 필라델피아 반도체 · VIX · 금 · 비트코인
- **수급(개인/외국인/기관) + 코스피 featured 큰 카드는 이번엔 안 함** → STEP 161 단독(큰 카드+수급 함께 = 완벽)
> 데이터·기능 안전 작업: 심볼 목록 확장 + 토글 제거뿐. 빌드 영향 최소.

## 전제 상태
- HEAD: `2855f68` (STEP 159+ 전 페이지 풀폭) — 빌드 ✓ / git clean
- 변경 파일 2개: `app/api/yahoo/indices/route.ts` (심볼 5→10) · `components/home-v6/HomeIndexBar.tsx` (토글 제거, 그리드 단일화)

---

## 작업 1/2 — `app/api/yahoo/indices/route.ts` (심볼 목록 교체)

**찾기:**
```ts
const INDEX_SYMBOLS = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "^DJI", name: "Dow" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^VIX", name: "VIX" },
];
```
**바꾸기:**
```ts
const INDEX_SYMBOLS = [
  { symbol: "^KS11", name: "코스피" },
  { symbol: "^KQ11", name: "코스닥" },
  { symbol: "USDKRW=X", name: "원/달러" },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "나스닥" },
  { symbol: "^DJI", name: "다우" },
  { symbol: "^SOX", name: "필라델피아 반도체" },
  { symbol: "^VIX", name: "VIX" },
  { symbol: "GC=F", name: "금" },
  { symbol: "BTC-USD", name: "비트코인" },
];
```
> `runtime="nodejs"` / `dynamic="force-dynamic"` 는 이미 있음(유지). 나머지 로직(quote+30일 스파크라인)은 그대로 — 심볼만 늘어남.

---

## 작업 2/2 — `components/home-v6/HomeIndexBar.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type IndexItem = { name: string; value: string; changePct: number; isUp: boolean; spark?: number[] };

// 작은 추세선(스파크라인) — 외부 라이브러리 없이 inline SVG 로 그린다
function Sparkline({ points, up }: { points?: number[]; up: boolean }) {
  if (!points || points.length < 2) return null;
  const w = 100;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-5 mt-1.5" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={up ? "#1AC267" : "#F04452"}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function HomeIndexBar() {
  const [items, setItems] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/yahoo/indices");
        const j = await r.json();
        if (!cancelled) setItems(j.items || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const t = setInterval(async () => {
      try {
        const j = await (await fetch("/api/yahoo/indices")).json();
        setItems(j.items || []);
      } catch { /* 무시 */ }
    }, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <section className="mt-5 bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="text-base font-bold text-unjong-primary">주요 지수</h2>
        <span className="text-xs text-unjong-muted">국내·해외·환율·원자재·코인</span>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {items.map((idx) => (
            <div
              key={idx.name}
              className="rounded-xl bg-unjong-background px-3 py-2.5 hover:bg-slate-100 transition-colors"
            >
              <p className="text-xs text-unjong-muted truncate">{idx.name}</p>
              <p className="text-[15px] font-bold text-unjong-primary tabular-nums mt-0.5">{idx.value}</p>
              <p className={`text-xs font-semibold ${idx.isUp ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                {idx.isUp ? "+" : ""}{idx.changePct.toFixed(2)}%
              </p>
              <Sparkline points={idx.spark} up={idx.isUp} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

> 변경점: ① `Tab` 타입·`tab` state·미국/국내 버튼·"국내 준비 중" 분기 **전부 제거** ② 단일 그리드 `lg:grid-cols-5`(10개=2줄) + 카드 패딩·스파크라인 축소로 **빽빽**. 데이터 흐름(fetch·60초 갱신)은 동일.

---

## 작업 3/3 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add app/api/yahoo/indices/route.ts components/home-v6/HomeIndexBar.tsx && git commit -m "feat(v7): 홈 지수 그리드 토스식 빽빽 — 국내·해외·환율·원자재·코인 10개 한 판 + 미국/국내 토글 제거 (STEP 160)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] **(중요) 코스피·코스닥 실제 값 확인** — 브라우저에서 `localhost:3333/api/yahoo/indices` 열어 JSON에 `코스피`·`코스닥`·`원/달러`·`금`·`비트코인` 이 **0 아닌 값으로** 들어오는지. (특히 `^KS11`·`^KQ11` 을 Yahoo 가 주는지 — 0이면 카드가 빠짐 → 알려주세요, KIS fallback 검토)
- [ ] (확인) 홈에서 **미국/국내 토글 사라지고, 10개 카드가 2줄로 빽빽**한지
- ⚠️ 화면이 그대로면 dev 서버 `.next` stale → **진짜 터미널**에서 `pkill -9 -f "next dev"; pkill -9 -f next-server; cd ~/stock-terminal && rm -rf .next && npm run dev`

## 주의·예상 이슈
- `^KS11`/`^KQ11`(코스피·코스닥) Yahoo 응답이 불안정하면 값이 0 → 필터에서 빠질 수 있음. 그러면 STEP 161 에서 KIS 로 국내 지수 보강.
- 환율/금/비트코인 숫자 포맷(소수 자리)이 어색하면 다음 스텝에서 종목별 자릿수 다듬기.
- 코스피 featured 큰 카드 + 수급(개인/외국인/기관)은 **STEP 161** 단독 — 큰 카드와 수급을 함께 넣어야 토스 코스피 카드가 완벽해짐.

---
> STEP 160 = 홈 지수 그리드 빽빽(10개·토글 제거). 전제 `2855f68` → 다음: STEP 161 코스피/코스닥 featured + 수급(KIS). 문서는 묶어서 갱신.
