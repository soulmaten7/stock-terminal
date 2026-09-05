<!-- 2026-06-04 -->
# STEP 144 — 홈 지수 카드 스파크라인 (HomeIndexBar 미니 추세선)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_144_COMMAND.md 파일 내용대로 실행해줘`

## 목표
홈 상단 "주요 지수" 카드(미국 5개 지수)에 **최근 약 1개월 추세선(스파크라인)** 을 추가한다.
지수가 숫자뿐이라 밋밋했던 카드를 한눈에 흐름이 보이게 만든다. (PLAYBOOK P0 — 홈 데이터 품질)

## 전제 상태 (이 커밋 위에서 작업)
- HEAD: `fac9e71` (docs: 미커밋 문서 8개 아카이브)
- 빌드: ✓ / 브랜치: `main`
- 변경 파일은 아래 2개뿐. 다른 파일 건드리지 말 것.

## 설계 요약 (왜 이렇게 하나)
- **헤드라인 숫자는 그대로** — value·changePct·isUp 은 검증된 기존 `yf.quote()` 유지. 숫자 회귀 위험 0.
- **스파크라인 데이터만 추가** — `yf.chart()` 로 최근 30일 일봉 종가 배열(`spark`)을 추가. 실패하면 `spark: []` → 카드는 기존과 동일하게 표시(graceful).
- **차트는 inline SVG** — 외부 라이브러리(lightweight-charts 등) 도입 안 함. `<path>` polyline 한 줄. 의존성·hydration 이슈 없음.
- 색상: 상승 `#1AC267` / 하락 `#F04452` (운종 디자인 시스템 그대로).
- 데이터 범위 30일 일봉 = 장 마감(overnight)과 무관하게 항상 채워짐 (STEP 143 의 overnight 빈값 함정 회피).

---

## 작업 1/2 — API 수정: `app/api/yahoo/indices/route.ts`

아래 내용으로 **파일 전체를 교체**한다.

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

const INDEX_SYMBOLS = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "^DJI", name: "Dow" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^VIX", name: "VIX" },
];

export async function GET() {
  try {
    // 심볼별로 현재값(quote) + 스파크라인용 최근 30일 일봉(chart)을 병렬로 가져온다
    const items = await Promise.all(
      INDEX_SYMBOLS.map(async (meta) => {
        const q = await yf.quote(meta.symbol);
        const price = Number(q.regularMarketPrice ?? 0);
        const changePct = Number(q.regularMarketChangePercent ?? 0);

        // 스파크라인: 최근 약 30일 일봉 종가 배열 (실패해도 카드는 그대로 표시)
        let spark: number[] = [];
        try {
          const ch = await yf.chart(meta.symbol, {
            period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            interval: "1d",
          });
          spark = ch.quotes
            .map((c) => c.close)
            .filter((n): n is number => typeof n === "number");
        } catch {
          spark = [];
        }

        return {
          name: meta.name,
          value: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
          changePct,
          isUp: changePct >= 0,
          spark,
        };
      })
    );

    return NextResponse.json({ items: items.filter((x) => x.value !== "0") });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

> 참고: 기존엔 `yf.quote(symbols)` 한 번에 5개를 받아 `INDEX_SYMBOLS[i]` 순서로 매칭했는데, Yahoo 가 순서를 보장하지 않아 잠재 버그였다. 심볼별 호출로 바꾸면서 이 매칭 버그도 함께 해소된다.

---

## 작업 2/2 — 컴포넌트 수정: `components/home-v6/HomeIndexBar.tsx`

아래 내용으로 **파일 전체를 교체**한다. (변경점: `IndexItem` 에 `spark?` 추가 · `Sparkline` 컴포넌트 신규 · 카드 안에 `<Sparkline />` 한 줄 추가. 나머지는 기존과 동일)

```tsx
"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type IndexItem = { name: string; value: string; changePct: number; isUp: boolean; spark?: number[] };
type Tab = "미국" | "국내";

// 작은 추세선(스파크라인) — 외부 라이브러리 없이 inline SVG 로 그린다
function Sparkline({ points, up }: { points?: number[]; up: boolean }) {
  if (!points || points.length < 2) return null;
  const w = 100;
  const h = 26;
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
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-6 mt-1.5"
      aria-hidden="true"
    >
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
  const [tab, setTab] = useState<Tab>("미국");
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
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-bold text-unjong-primary mr-2">주요 지수</h2>
        {(["미국", "국내"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
              tab === t ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "국내" ? (
        <p className="text-sm text-unjong-muted py-2">국내 지수(코스피·코스닥) — 준비 중</p>
      ) : loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.map((idx) => (
            <div key={idx.name} className="rounded-xl bg-unjong-background px-3 py-2.5">
              <p className="text-xs text-unjong-muted truncate">{idx.name}</p>
              <p className="text-base font-bold text-unjong-primary tabular-nums mt-0.5">{idx.value}</p>
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

---

## 작업 3/3 — 빌드 검증 + 커밋·푸시

빌드가 성공해야만 커밋한다. (절대 규칙: 빌드 깨진 코드 push 금지)

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add app/api/yahoo/indices/route.ts components/home-v6/HomeIndexBar.tsx && git commit -m "feat(v6): 홈 지수 카드 스파크라인 추가 — HomeIndexBar inline SVG 추세선 + indices API chart() 30일 시계열 (STEP 144)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] (가능하면) `npm run dev` → http://localhost:3333 홈 상단 "주요 지수" 카드에 추세선 보이는지

## 주의·예상 이슈
- yahoo-finance2 가 첫 `chart()` 호출 시 라이브러리 자체 안내 로그를 콘솔에 찍을 수 있음 — **우리 코드의 console.log 가 아니므로 무방**. 커밋 막지 말 것.
- 로컬에서 Yahoo 가 차단돼 `spark` 가 빈 배열이면 추세선만 안 보이고 숫자·카드는 정상. Vercel 배포 환경에서 실데이터 확인 권장.
- TS 가 `chart()` 오버로드로 타입 불평 시(거의 없음): 옵션에 `return: "array"` 한 줄 추가하면 해소.

---
> STEP 144 = PLAYBOOK §11 P0 "지수 카드 스파크라인". 전제 `fac9e71` → 이 STEP 코드 커밋 후 Cowork 이 4개 문서 + PLAYBOOK 갱신.
