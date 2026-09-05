<!-- 2026-06-06 -->
# STEP 193 — [C] 지금 뜨는 카테고리 2열 (국내 KIS업종 ｜ 해외 미국섹터ETF)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_193_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (토스 7번 캡쳐 분석 → 적용)
'지금 뜨는 카테고리'를 토스처럼 **2열(국내 ｜ 해외)** 카드 리스트로.
- 행: 순위 + 이모지 아이콘 + 카테고리명 + 등락%(빨강/파랑)
- **국내**: 기존 KIS 업종(전기전자·화학…) — 집계행(종합·대형주 등) 제외
- **해외**: 신규 — **미국 11개 섹터 ETF(SPDR)** 실데이터(기술·금융·에너지…). 토스 테마(돼지고기 등)는 토스 자체 분류라, 우리는 표준 섹터로 진짜 데이터.
- **"N개 중 M개 상승"은 우리 데이터에 없어 생략**(가짜 X). 정렬은 등락률 내림차순.

## 전제 상태
- HEAD: STEP 192 적용된 상태
- 변경: `app/api/yahoo/sector-etf/route.ts`(신규) + `components/home-v6/SectorRanking.tsx`(전면 교체)

---

## 작업 1/2 — 신규 API `app/api/yahoo/sector-etf/route.ts` (파일 생성)

```ts
import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 미국 11개 SPDR 섹터 ETF — '해외 업종' 실데이터
const SECTORS = [
  { sym: "XLK", name: "기술" },
  { sym: "XLF", name: "금융" },
  { sym: "XLE", name: "에너지" },
  { sym: "XLV", name: "헬스케어" },
  { sym: "XLY", name: "임의소비재" },
  { sym: "XLP", name: "필수소비재" },
  { sym: "XLI", name: "산업재" },
  { sym: "XLB", name: "소재" },
  { sym: "XLU", name: "유틸리티" },
  { sym: "XLRE", name: "부동산" },
  { sym: "XLC", name: "커뮤니케이션" },
];

export async function GET() {
  try {
    const quotes = await yf.quote(SECTORS.map((s) => s.sym));
    const arr = Array.isArray(quotes) ? quotes : [quotes];
    const bySym = new Map(arr.map((q) => [String((q as Record<string, unknown>).symbol ?? ""), q]));
    const sectors = SECTORS.map((s) => {
      const q = bySym.get(s.sym) as Record<string, unknown> | undefined;
      return {
        code: s.sym,
        name: s.name,
        index: Number(q?.regularMarketPrice ?? 0),
        changePercent: Number(q?.regularMarketChangePercent ?? 0),
      };
    })
      .filter((s) => s.index > 0)
      .sort((a, b) => b.changePercent - a.changePercent);
    return NextResponse.json({ sectors });
  } catch (e) {
    return NextResponse.json({ sectors: [], error: e instanceof Error ? e.message : String(e) });
  }
}
```

---

## 작업 2/2 — `components/home-v6/SectorRanking.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type Sector = { code: string; name: string; index: number; changePercent: number };

// 업종/섹터명 → 이모지 (키워드 매칭)
function sectorEmoji(name: string): string {
  const n = name;
  if (/에너지|석유|정유/.test(n)) return "🛢️";
  if (/은행|금융|증권|보험/.test(n)) return "🏦";
  if (/화학/.test(n)) return "🧪";
  if (/의약|제약|바이오|헬스/.test(n)) return "💊";
  if (/전기전자|반도체|기술|IT/.test(n)) return "🔌";
  if (/철강|금속|소재/.test(n)) return "🏭";
  if (/기계|산업/.test(n)) return "⚙️";
  if (/운수장비|자동차|운송/.test(n)) return "🚗";
  if (/건설/.test(n)) return "🏗️";
  if (/통신|커뮤니/.test(n)) return "📡";
  if (/유통|소비/.test(n)) return "🛒";
  if (/음식료|식품/.test(n)) return "🍱";
  if (/섬유|의복/.test(n)) return "👕";
  if (/전기가스|유틸/.test(n)) return "💡";
  if (/창고|운수/.test(n)) return "🚚";
  if (/부동산/.test(n)) return "🏢";
  if (/서비스/.test(n)) return "🛎️";
  if (/의료정밀|정밀/.test(n)) return "🔬";
  if (/종이|목재/.test(n)) return "🪵";
  return "📊";
}

function Column({ title, asof, sectors, loading }: { title: string; asof: string; sectors: Sector[]; loading: boolean }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2 px-1">
        <h3 className="text-sm font-bold text-unjong-primary">{title}</h3>
        <span className="text-xs text-unjong-muted">{asof}</span>
      </div>
      {loading ? (
        <LoadingState className="py-8" />
      ) : sectors.length === 0 ? (
        <p className="rounded-xl bg-unjong-background px-4 py-6 text-center text-xs text-unjong-muted">데이터 준비 중</p>
      ) : (
        <ul className="space-y-0.5">
          {sectors.slice(0, 9).map((s, i) => {
            const up = s.changePercent >= 0;
            return (
              <li key={s.code} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-unjong-background">
                <span className="w-4 text-center text-sm font-bold tabular-nums text-unjong-muted">{i + 1}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-unjong-background text-lg">{sectorEmoji(s.name)}</span>
                <span className="flex-1 truncate font-medium text-unjong-primary">{s.name}</span>
                <span className={`text-sm font-semibold tabular-nums ${up ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                  {up ? "+" : ""}{s.changePercent.toFixed(2)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function SectorRanking() {
  const [kr, setKr] = useState<Sector[]>([]);
  const [us, setUs] = useState<Sector[]>([]);
  const [loadingKr, setLoadingKr] = useState(true);
  const [loadingUs, setLoadingUs] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await (await fetch("/api/kis/sector-rank")).json();
        if (!cancelled) setKr(j.sectors ?? []);
      } finally {
        if (!cancelled) setLoadingKr(false);
      }
    })();
    (async () => {
      try {
        const j = await (await fetch("/api/yahoo/sector-etf")).json();
        if (!cancelled) setUs(j.sectors ?? []);
      } finally {
        if (!cancelled) setLoadingUs(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 국내: 집계행(종합·대형주 등) 제외 — 실제 업종만
  const krFiltered = kr.filter((s) => !/종합|대형주|중형주|소형주|제조업/.test(s.name));
  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

  return (
    <section className="rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        <Column title="국내" asof={`${today} 기준`} sectors={krFiltered} loading={loadingKr} />
        <Column title="해외" asof="미국 섹터 ETF" sectors={us} loading={loadingUs} />
      </div>
      <p className="mt-3 px-1 text-[11px] text-unjong-muted">국내=KRX 업종 · 해외=미국 SPDR 섹터 ETF 기준 (토스 테마분류와 다름)</p>
    </section>
  );
}
```

> 국내=KIS 업종(집계행 제외), 해외=미국 섹터 ETF 실데이터. 각 9개, 등락률 순. 이모지 아이콘 + 순위 + 이름 + 등락%. "N개 중 M개"는 데이터 없어 생략.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/api/yahoo/sector-etf/route.ts components/home-v6/SectorRanking.tsx && git commit -m "feat(v7): [C] 지금 뜨는 카테고리 2열(국내 KIS업종 ｜ 해외 미국섹터ETF) 토스 카드+이모지 (STEP 193)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] '지금 뜨는 카테고리' 탭이 **2열(국내 ｜ 해외)** 카드로, 각 행에 순위·이모지·이름·등락%(빨강/파랑)
- [ ] 국내=업종(전기전자·화학…, 종합/대형주 같은 집계행 빠짐), 해외=미국 섹터(기술·금융·에너지…)
- [ ] 해외 ETF 값 뜨는지: `curl -s localhost:3333/api/yahoo/sector-etf | grep -o '"name"' | wc -l` → 0 아님
- [ ] 하단에 "국내=KRX 업종 · 해외=미국 SPDR 섹터 ETF" 안내 문구
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 이모지는 키워드 매칭(없으면 📊). 어색한 매칭 있으면 sectorEmoji 한 줄 보정.
- 해외 섹터ETF는 yahoo-finance2(runtime nodejs). 장 마감/주말엔 전일 종가 기준.
- "N개 중 M개"·토스 테마(돼지고기 등)는 토스 자체 데이터라 제외(정직).
- 다음 STEP 194: [D] 국내 투자자 동향 3열(외국인/기관/개인) — 개인 데이터 한계 점검 포함.

---
> STEP 193 = [C] 카테고리 2열. 전제 STEP 192. 다음: [D] 투자자동향 3열. 문서 묶어 갱신.
