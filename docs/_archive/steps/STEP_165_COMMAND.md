<!-- 2026-06-06 -->
# STEP 165 — 코스피·코스닥 수급 (개인/외국인/기관 순매수)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_165_COMMAND.md 파일 내용대로 실행해줘`

## 목표
홈 주요지수의 **코스피·코스닥 카드**에 토스처럼 **수급(개인/외국인/기관 순매수, 억원)** 표시. (나머지 8개 카드는 그대로)
- 검증된 KIS API 사용: `inquire-investor-daily-by-market` (tr_id `FHPTJ04040000`) — 코스피·코스닥 둘 다 작동 확인됨(실측 완료)
- 필드: `prsn_ntby_tr_pbmn`(개인) · `frgn_ntby_tr_pbmn`(외국인) · `orgn_ntby_tr_pbmn`(기관계), 단위 **만원** → **억원**으로 변환 표시. `output[0]`=최신 영업일.
> 일별(장 마감) 기준 — 장중엔 직전 영업일. 카드에 날짜(MM/DD) 같이 표기해 정직하게.

## 전제 상태
- HEAD: `4f2b16a`(STEP 164) 이상
- 변경: 신규 `app/api/kis/market-investor/route.ts` + `components/home-v6/HomeIndexBar.tsx`(전체 교체)
- 참고: 기존 `app/api/home/investor-flow/route.ts` 는 잘못된 파라미터로 0 반환 중(미사용 추정) — 이번 건과 무관, 정리는 별도.

---

## 작업 1/2 — 신규 파일 `app/api/kis/market-investor/route.ts`

```ts
import { NextResponse } from "next/server";
import { fetchKisApi } from "@/lib/kis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 국내 시장별 투자자매매동향(일별) — KIS FHPTJ04040000. 코스피·코스닥 개인/외국인/기관 순매수.
// 검증된 엔드포인트(실측). 일별(장 마감 기준), output[0]=최신 영업일.

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
// 만원 → 억(반올림)
function eok(v: unknown): number {
  const n = Number(String(v ?? "").replace(/,/g, "")) || 0;
  return Math.round(n / 10000);
}

async function marketFlow(iscd: string, iscd1: string) {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 10);
  const data = await fetchKisApi({
    endpoint: "/uapi/domestic-stock/v1/quotations/inquire-investor-daily-by-market",
    trId: "FHPTJ04040000",
    params: {
      FID_COND_MRKT_DIV_CODE: "U",
      FID_INPUT_ISCD: iscd,
      FID_INPUT_ISCD_1: iscd1,
      FID_INPUT_ISCD_2: iscd,
      FID_INPUT_DATE_1: ymd(from),
      FID_INPUT_DATE_2: ymd(today),
    },
    cacheTtlMs: 300_000, // 일별 데이터 → 5분 캐시
  });
  const row = (data.output ?? [])[0];
  if (!row) return null;
  return {
    date: String(row.stck_bsop_date ?? ""),
    indiv: eok(row.prsn_ntby_tr_pbmn),
    foreign: eok(row.frgn_ntby_tr_pbmn),
    inst: eok(row.orgn_ntby_tr_pbmn),
  };
}

export async function GET() {
  try {
    const [kospi, kosdaq] = await Promise.all([
      marketFlow("0001", "KSP").catch(() => null),
      marketFlow("1001", "KSQ").catch(() => null),
    ]);
    return NextResponse.json({ 코스피: kospi, 코스닥: kosdaq });
  } catch (e) {
    return NextResponse.json({
      코스피: null,
      코스닥: null,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
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

type Flow = { date?: string; indiv: number; foreign: number; inst: number };

function moodTag(pct: number): string | null {
  if (pct >= 5) return "급등";
  if (pct >= 2) return "급상승";
  if (pct <= -5) return "급락";
  if (pct <= -2) return "조정";
  return null;
}

function flowColor(v: number): string {
  return v > 0 ? "text-[#1AC267]" : v < 0 ? "text-[#F04452]" : "text-unjong-muted";
}
function flowText(v: number): string {
  return `${v > 0 ? "+" : ""}${v.toLocaleString()}`;
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
  const [flows, setFlows] = useState<Record<string, Flow | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadIndices = async () => {
      const j = await (await fetch("/api/yahoo/indices")).json();
      if (!cancelled) setItems(j.items || []);
    };
    const loadFlows = async () => {
      try {
        const j = await (await fetch("/api/kis/market-investor")).json();
        if (!cancelled) setFlows({ 코스피: j["코스피"] ?? null, 코스닥: j["코스닥"] ?? null });
      } catch { /* 무시 */ }
    };
    (async () => {
      try {
        await Promise.all([loadIndices(), loadFlows()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const t = setInterval(() => {
      loadIndices();
      loadFlows();
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
            const flow = flows[idx.name];
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
                {flow && (
                  <div className="mt-1.5 pt-1.5 border-t border-unjong-border/60">
                    <p className="text-[10px] text-unjong-muted mb-0.5">
                      순매수(억){flow.date ? ` · ${flow.date.slice(4, 6)}/${flow.date.slice(6, 8)}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] tabular-nums">
                      <span className="text-unjong-muted">개인 <b className={flowColor(flow.indiv)}>{flowText(flow.indiv)}</b></span>
                      <span className="text-unjong-muted">외인 <b className={flowColor(flow.foreign)}>{flowText(flow.foreign)}</b></span>
                      <span className="text-unjong-muted">기관 <b className={flowColor(flow.inst)}>{flowText(flow.inst)}</b></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

> 코스피·코스닥 카드에만 하단에 `순매수(억) · MM/DD` + 개인/외인/기관(초록=순매수, 빨강=순매도). 나머지 카드는 `flow` 없어서 그대로. 지수는 Yahoo, 수급은 KIS — 따로 fetch 후 이름으로 매칭.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/api/kis/market-investor/route.ts components/home-v6/HomeIndexBar.tsx && git commit -m "feat(v7): 코스피·코스닥 수급(개인/외국인/기관 순매수) — KIS FHPTJ04040000 연동, 지수 카드에 표시 (STEP 165)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **API 확인**: `curl -s "http://localhost:3333/api/kis/market-investor"` → `코스피`·`코스닥` 각각 `indiv/foreign/inst` 값(억) + `date` 보이는지 (예: 코스피 indiv 422, foreign -276, inst -138 근처)
- [ ] 홈에서 **코스피·코스닥 카드 하단에 개인/외인/기관 순매수** 표시되는지 (다른 8개 카드엔 안 나옴)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작
- ⚠️ env(KIS 키)는 이미 설정돼 있음 — 혹시 `error` 나오면 dev 서버 재시작(토큰 캐시)

## 주의·예상 이슈
- 일별(장 마감) 기준 → 장중엔 직전 영업일 날짜(MM/DD로 카드에 표기됨). 정직 표기 OK.
- 단위: KIS 만원 → 억 반올림. 코스닥은 값이 작아 ±몇억 수준(정상).
- KIS rate limit: 5분 캐시 + 기존 큐로 처리. 부하 적음.
- 기존 `app/api/home/investor-flow/route.ts`(0 반환, 깨짐) 미사용이면 다음에 삭제 — 이번엔 안 건드림.

---
> STEP 165 = 코스피·코스닥 수급(지수 영역 완성). 전제 `4f2b16a`. 다음: 랭킹 토스화 · 종목상세 3단 · 맥락 태그(뉴스). 문서 묶어 갱신.
