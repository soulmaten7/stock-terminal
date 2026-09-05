<!-- 2026-06-21 -->
# STEP 338 — [신규] 거시경제 탭 우측 피드: 한국(ECOS)+미국(FRED) 지표

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_338_COMMAND.md 파일 내용대로 실행해줘
```

- **선행**: **STEP 337을 먼저 적용**해야 함(같은 ToolboxClient 블록을 확장). `ECOS_API_KEY`·`FRED_API_KEY`는 이미 `.env.local`에 있음(확인 완료).

---

## 🎯 목표
거시경제(macro) 탭을 **좌:큐레이션 링크 / 우:지표 패널**로. 우측 = 한국은행 ECOS 100대 지표(기준금리·국고채·환율·CPI·코스피) + 미국 FRED(기준금리·10년물·실업률·CPI) 헤드라인.

> 신규 2파일(API·컴포넌트) + `ToolboxClient.tsx` 2곳. ECOS 지표명 매칭 검증용 `?debug=1` 포함.

---

## 📄 파일 1 (신규) — `app/api/macro/summary/route.ts`

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Indicator = {
  country: "KR" | "US";
  label: string;
  value: string;
  unit: string;
  date: string | null;
  change: number | null;
};

let cache: { at: number; data: unknown } | null = null;

const ECOS_KEYSTAT = "https://ecos.bok.or.kr/api/KeyStatisticList";
// ECOS 100대 지표에서 뽑을 헤드라인(이름 부분일치)
const KR_KEYWORDS = ["기준금리", "국고채(3년)", "원/달러", "소비자물가지수", "코스피"];

const FRED = "https://api.stlouisfed.org/fred/series/observations";
const US_SERIES: { id: string; label: string; unit: string }[] = [
  { id: "FEDFUNDS", label: "미국 기준금리", unit: "%" },
  { id: "DGS10", label: "미국 10년물 국채", unit: "%" },
  { id: "UNRATE", label: "미국 실업률", unit: "%" },
  { id: "CPIAUCSL", label: "미국 CPI", unit: "지수" },
];

function numfmt(s: string): string {
  const n = Number(String(s).replace(/,/g, ""));
  if (!Number.isFinite(n)) return String(s ?? "");
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

async function krIndicators(key: string): Promise<{ indicators?: Indicator[]; rawNames?: string[] }> {
  const u = `${ECOS_KEYSTAT}/${key}/json/kr/1/100`;
  const r = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(6000) });
  const j = await r.json();
  const rows = (j?.KeyStatisticList?.row ?? []) as Record<string, string>[];
  const rawNames = rows.map((x) => (x.KEYSTAT_NAME || "").trim());
  const out: Indicator[] = [];
  for (const kw of KR_KEYWORDS) {
    const row = rows.find((x) => (x.KEYSTAT_NAME || "").includes(kw));
    if (row) {
      out.push({
        country: "KR",
        label: (row.KEYSTAT_NAME || "").trim(),
        value: numfmt(row.DATA_VALUE || ""),
        unit: (row.UNIT_NAME || "").trim(),
        date: (row.CYCLE || row.TIME || "").trim() || null,
        change: null,
      });
    }
  }
  return { indicators: out, rawNames };
}

async function usIndicators(key: string): Promise<Indicator[]> {
  const out: Indicator[] = [];
  await Promise.all(
    US_SERIES.map(async (s) => {
      try {
        const p = new URLSearchParams({
          series_id: s.id, api_key: key, file_type: "json", sort_order: "desc", limit: "2",
        });
        const r = await fetch(`${FRED}?${p}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
        const j = await r.json();
        const obs = (j.observations || []).filter((o: { value: string }) => o.value !== ".");
        const latest = obs[0], prev = obs[1];
        if (latest) {
          out.push({
            country: "US",
            label: s.label,
            value: numfmt(latest.value),
            unit: s.unit,
            date: latest.date || null,
            change: prev ? +(Number(latest.value) - Number(prev.value)).toFixed(2) : null,
          });
        }
      } catch { /* skip */ }
    })
  );
  return out.sort(
    (a, b) => US_SERIES.findIndex((s) => s.label === a.label) - US_SERIES.findIndex((s) => s.label === b.label)
  );
}

export async function GET(req: Request) {
  const ecosKey = (process.env.ECOS_API_KEY || "").trim();
  const fredKey = (process.env.FRED_API_KEY || "").trim();
  const debug = new URL(req.url).searchParams.get("debug") === "1";

  if (!debug && cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  const [kr, us] = await Promise.all([
    ecosKey ? krIndicators(ecosKey).catch(() => ({ indicators: [], rawNames: [] })) : Promise.resolve({ indicators: [], rawNames: [] }),
    fredKey ? usIndicators(fredKey).catch(() => []) : Promise.resolve([]),
  ]);

  if (debug) {
    return NextResponse.json({ krRaw: kr.rawNames ?? [], krPicked: kr.indicators ?? [], us });
  }

  const data = { kr: kr.indicators ?? [], us };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
```

---

## 📄 파일 2 (신규) — `components/toolbox/MacroFeed.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';

type Indicator = { country: 'KR' | 'US'; label: string; value: string; unit: string; date: string | null; change: number | null };

function Row({ it }: { it: Indicator }) {
  const up = it.change != null && it.change > 0;
  const down = it.change != null && it.change < 0;
  return (
    <div className="flex items-center justify-between border-b border-unjong-border py-2 last:border-0">
      <span className="min-w-0 flex-1 truncate pr-2 text-[13px] text-unjong-primary">{it.label}</span>
      <span className="shrink-0 text-right">
        <span className="text-sm font-semibold text-unjong-primary">{it.value}</span>
        {it.unit ? <span className="ml-0.5 text-[11px] text-unjong-muted">{it.unit}</span> : null}
        {it.change != null ? (
          <span className={`ml-1 text-[11px] ${up ? 'text-red-500' : down ? 'text-blue-500' : 'text-unjong-muted'}`}>
            {up ? '▲' : down ? '▼' : ''}{Math.abs(it.change)}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export default function MacroFeed() {
  const [kr, setKr] = useState<Indicator[]>([]);
  const [us, setUs] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/macro/summary')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setKr(j.kr ?? []); setUs(j.us ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">지표 불러오는 중…</p>;
  if (kr.length === 0 && us.length === 0) return <p className="py-10 text-center text-sm text-unjong-muted">지표를 불러오지 못했습니다.</p>;

  return (
    <div>
      {kr.length > 0 ? (
        <>
          <p className="mb-1 text-sm font-bold text-unjong-primary">🇰🇷 한국 지표</p>
          <div className="mb-4">{kr.map((it, i) => <Row key={`kr${i}`} it={it} />)}</div>
        </>
      ) : null}
      {us.length > 0 ? (
        <>
          <p className="mb-1 text-sm font-bold text-unjong-primary">🇺🇸 미국 지표</p>
          <div>{us.map((it, i) => <Row key={`us${i}`} it={it} />)}</div>
        </>
      ) : null}
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">출처: 한국은행 ECOS · 미국 FRED. 발표 주기에 따라 갱신됩니다.</p>
    </div>
  );
}
```

---

## 📄 파일 3 (수정 2곳) — `components/toolbox/ToolboxClient.tsx`

### 1 — import 추가
**찾기:**
```tsx
import DartFeed from './DartFeed';
```
**바꾸기:**
```tsx
import DartFeed from './DartFeed';
import MacroFeed from './MacroFeed';
```

### 2 — 피드 탭에 'macro' 추가 (디스패처)
**찾기:**
```tsx
        ) : (activeTab === 'news' || activeTab === 'disclosure') && country === 'KR' ? (
```
**바꾸기:**
```tsx
        ) : (activeTab === 'news' || activeTab === 'disclosure' || activeTab === 'macro') && country === 'KR' ? (
```

**찾기:**
```tsx
            <aside className="hidden w-96 shrink-0 lg:block">
              {activeTab === 'news' ? <NewsFeed /> : <DartFeed />}
            </aside>
```
**바꾸기:**
```tsx
            <aside className="hidden w-96 shrink-0 lg:block">
              {activeTab === 'news' ? <NewsFeed /> : activeTab === 'disclosure' ? <DartFeed /> : <MacroFeed />}
            </aside>
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

### ⚠️ dev 서버 완전 재시작
```bash
lsof -ti:3333 | xargs kill -9 2>/dev/null; cd ~/stock-terminal && npm run dev
```

### 확인
1. **거시경제 탭** → 우측에 🇰🇷 한국 지표 + 🇺🇸 미국 지표.
2. **ECOS 지표명 검증**(한국 지표가 비거나 이상하면): 브라우저에서 `http://localhost:3333/api/macro/summary?debug=1` 열어 나온 JSON(특히 `krRaw` 배열 = ECOS가 주는 실제 지표명 목록)을 나(코웍)에게 붙여줘 → 내가 `KR_KEYWORDS` 정확히 맞춤.
3. 미국 지표(FRED)는 바로 나와야 정상.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/macro/summary/route.ts components/toolbox/MacroFeed.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(macro): 거시경제 탭 우측 한국(ECOS)+미국(FRED) 지표 피드 (STEP 338)" && git push
```

---

> **한 줄 요약**: 거시경제 탭에 한국은행 ECOS + 미국 FRED 헤드라인 지표 우측 피드. 피드 파일럿 3탄(공식 경제지표). ECOS 이름 매칭은 debug로 검증.
