<!-- 2026-06-06 -->
# STEP 164 — 지수 카드 토스화 (전일대비 숫자 + 느낌 태그)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_164_COMMAND.md 파일 내용대로 실행해줘`

## 목표
홈 주요지수 카드를 토스처럼. 지금은 값 + % 만 → **전일대비 절대 변화량(예: -478.82)** 추가 + **느낌 태그(급등/급상승/조정/급락)** 배지.
- 변화량: Yahoo `regularMarketChange` 사용 (API에 이미 옴)
- 느낌 태그: **변동률 기준 규칙**(±2% 조정/급상승, ±5% 급락/급등) — 정직하게 계산값만
> ⚠️ 토스의 맥락 태그(금리 인상 가능성·원화 약세·반도체 실적 부진 등)는 **실제 뉴스/AI 분석이 필요** → 별도 STEP. 근거 없는 문구를 지어내면 운종 정체성(속지 않게)에 어긋나므로 이번엔 안 함.

## 전제 상태
- HEAD: `c90fc66`(STEP 163) 이상. STEP 160 적용된 상태(지수 10개).
- 변경: `app/api/yahoo/indices/route.ts`(변화량 2곳) + `components/home-v6/HomeIndexBar.tsx`(전체 교체)

---

## 작업 1/2 — `app/api/yahoo/indices/route.ts` (변화량 필드 추가, 2곳)

### ① 변화량 계산 추가
**찾기:**
```ts
        const price = Number(q.regularMarketPrice ?? 0);
        const changePct = Number(q.regularMarketChangePercent ?? 0);
```
**바꾸기:**
```ts
        const price = Number(q.regularMarketPrice ?? 0);
        const changePct = Number(q.regularMarketChangePercent ?? 0);
        const change = Number(q.regularMarketChange ?? 0);
```

### ② 응답에 changeText 추가
**찾기:**
```ts
        return {
          name: meta.name,
          value: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
          changePct,
          isUp: changePct >= 0,
          spark,
        };
```
**바꾸기:**
```ts
        return {
          name: meta.name,
          value: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
          changeText: change.toLocaleString("en-US", { maximumFractionDigits: 2, signDisplay: "always" }),
          changePct,
          isUp: changePct >= 0,
          spark,
        };
```

---

## 작업 2/2 — `components/home-v6/HomeIndexBar.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type IndexItem = {
  name: string;
  value: string;
  changeText?: string;
  changePct: number;
  isUp: boolean;
  spark?: number[];
};

// 느낌 태그 — 변동률 기준(토스식 급상승/조정/급락). 맥락 태그(금리·뉴스)는 추후 별도.
function moodTag(pct: number): string | null {
  if (pct >= 5) return "급등";
  if (pct >= 2) return "급상승";
  if (pct <= -5) return "급락";
  if (pct <= -2) return "조정";
  return null;
}

// 작은 추세선(스파크라인) — 외부 라이브러리 없이 inline SVG
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
          {items.map((idx) => {
            const tag = moodTag(idx.changePct);
            return (
              <div
                key={idx.name}
                className="rounded-xl bg-unjong-background px-3 py-2.5 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-unjong-muted truncate">{idx.name}</p>
                  {tag && (
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        idx.isUp ? "bg-[#1AC267]/10 text-[#1AC267]" : "bg-[#F04452]/10 text-[#F04452]"
                      }`}
                    >
                      {tag}
                    </span>
                  )}
                </div>
                <p className="text-[15px] font-bold text-unjong-primary tabular-nums mt-0.5">{idx.value}</p>
                <p
                  className={`text-xs font-semibold tabular-nums ${
                    idx.isUp ? "text-[#1AC267]" : "text-[#F04452]"
                  }`}
                >
                  {idx.changeText ? `${idx.changeText} ` : ""}({idx.isUp ? "+" : ""}{idx.changePct.toFixed(2)}%)
                </p>
                <Sparkline points={idx.spark} up={idx.isUp} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

> 변화: 카드에 ① 이름 옆 느낌 태그 배지(급등/급상승/조정/급락, 색은 상승=초록·하락=빨강) ② 변화율 앞에 **전일대비 절대값**(예: `-478.82 (-5.54%)`). 나머지(그리드·스파크라인·60초 갱신) 동일.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/indices/route.ts components/home-v6/HomeIndexBar.tsx && git commit -m "feat(v7): 지수 카드 토스화 — 전일대비 절대 변화량 + 느낌 태그(급상승/조정/급락) (STEP 164)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈 주요지수 카드에 **`-478.82 (-5.54%)` 형태(절대값+%)** 표시되는지
- [ ] 큰 변동 카드에 **태그 배지**(예: 코스피 `급락`, VIX `급등`, S&P `조정`) 뜨는지
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널에서 `pkill -9 -f "next dev"; pkill -9 -f next-server; cd ~/stock-terminal && rm -rf .next && npm run dev`

## 주의·예상 이슈
- 느낌 태그는 **변동률 계산 기반**(급등≥+5, 급상승≥+2, 조정≤-2, 급락≤-5). 임계값 바꾸고 싶으면 `moodTag` 숫자만 수정.
- 토스의 **맥락 태그**(금리 인상 가능성·원화 약세·반도체 실적 부진 등)는 실제 뉴스/AI 필요 → 별도 STEP(랭킹 '왜 움직였나' 태그와 같은 묶음).
- `bg-[#1AC267]/10` 투명도가 안 먹으면 `bg-[#E7F9F0]`(초록)·`bg-[#FDE9EB]`(빨강) 같은 고정색으로 대체.

---
> STEP 164 = 지수 카드 토스화(전일대비+태그). 전제 `c90fc66`. 다음: 코스피/코스닥 수급(KIS, tr_id 확인 후) · 랭킹 토스화 · 종목상세 3단. 문서 묶어 갱신.
