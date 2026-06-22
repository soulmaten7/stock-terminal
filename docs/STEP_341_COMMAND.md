<!-- 2026-06-21 -->
# STEP 341 — [신규] 공모주·배당 탭 우측 피드: 고배당 TOP (실데이터 DB)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_341_COMMAND.md 파일 내용대로 실행해줘
```

- **선행**: STEP 340 적용 완료(FEED_TABS·feedFor 존재).

---

## 🎯 목표
공모주·배당(ipo) 탭 우측에 **고배당 TOP 20**(Supabase `dividends` 실데이터 — 회사명·종목코드·주당배당·배당수익률). 중복 종목 제거.

> 신규 2파일(API·컴포넌트) + `ToolboxClient.tsx` 3곳.
> ⚠️ 순수 IPO(공모주 청약 일정)는 전용 무료 소스가 약해 이번엔 **배당만** — IPO는 추후 `DATA_GO_KR`(공공데이터포털) 검토.

---

## 📄 파일 1 (신규) — `app/api/dividend/feed/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("dividends")
      .select("dividend_per_share, dividend_yield, ex_dividend_date, fiscal_year, stocks ( symbol, name_ko )")
      .not("dividend_yield", "is", null)
      .gt("dividend_yield", 0)
      .order("dividend_yield", { ascending: false })
      .limit(60);

    if (error) throw error;

    type StocksRow = { symbol: string | null; name_ko: string | null };
    type Row = {
      dividend_per_share: number | null;
      dividend_yield: number | null;
      ex_dividend_date: string | null;
      fiscal_year: number | null;
      stocks: StocksRow | StocksRow[] | null;
    };
    const getStock = (s: Row["stocks"]): StocksRow | null => (Array.isArray(s) ? s[0] ?? null : s);

    const seen = new Set<string>();
    const items = (data as unknown as Row[])
      .map((d) => {
        const stock = getStock(d.stocks);
        return {
          sym: (stock?.symbol ?? "").trim(),
          name: stock?.name_ko ?? "—",
          y: Number(d.dividend_yield ?? 0),
          ex: d.ex_dividend_date,
          dps: d.dividend_per_share,
        };
      })
      .filter((x) => {
        if (!x.sym || seen.has(x.sym)) return false; // 종목 중복 제거
        seen.add(x.sym);
        return true;
      })
      .slice(0, 20)
      .map((x) => ({
        code: x.sym,
        name: x.name,
        yield: x.y,
        exDate: x.ex ? `${x.ex.slice(5, 7)}/${x.ex.slice(8, 10)}` : "—",
        dividend: x.dps != null ? `${Number(x.dps).toLocaleString("ko-KR")}원` : "—",
      }));

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
```

---

## 📄 파일 2 (신규) — `components/toolbox/DividendFeed.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';

type DivItem = { code: string; name: string; yield: number; exDate: string; dividend: string };

export default function DividendFeed() {
  const [items, setItems] = useState<DivItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dividend/feed')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.items ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">배당 정보 불러오는 중…</p>;
  if (items.length === 0) return <p className="py-10 text-center text-sm text-unjong-muted">배당 정보를 불러오지 못했습니다.</p>;

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">고배당 TOP</p>
      <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">
        {items.map((it, i) => (
          <div key={`${it.code}${i}`} className="flex items-center justify-between border-b border-unjong-border py-2.5 last:border-0">
            <div className="min-w-0 flex-1 pr-2">
              <p className="truncate text-[13px] font-semibold text-unjong-primary">{it.name}</p>
              <p className="text-[11px] text-unjong-muted">{it.code} · 주당 {it.dividend}{it.exDate !== '—' ? ` · 배당락 ${it.exDate}` : ''}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-red-500">{it.yield.toFixed(2)}%</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">배당수익률 기준 상위. 과거 배당 기록이며 미래 배당을 보장하지 않습니다.</p>
    </div>
  );
}
```

---

## 📄 파일 3 (수정 3곳) — `components/toolbox/ToolboxClient.tsx`

### 1 — import 추가
**찾기:**
```tsx
import MacroFeed from './MacroFeed';
```
**바꾸기:**
```tsx
import MacroFeed from './MacroFeed';
import DividendFeed from './DividendFeed';
```

### 2 — FEED_TABS에 'ipo' 추가
**찾기:**
```tsx
const FEED_TABS = ['news', 'disclosure', 'macro', 'analysis', 'research', 'etf'];
```
**바꾸기:**
```tsx
const FEED_TABS = ['news', 'disclosure', 'macro', 'analysis', 'research', 'etf', 'ipo'];
```

### 3 — feedFor에 ipo 분기 추가
**찾기:**
```tsx
    case 'etf': return <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
    default: return null;
```
**바꾸기:**
```tsx
    case 'etf': return <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
    case 'ipo': return <DividendFeed />;
    default: return null;
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(신규 라우트라 **재시작** 권장):
```bash
lsof -ti:3333 | xargs kill -9 2>/dev/null; cd ~/stock-terminal && npm run dev
```
1. **공모주·배당 탭** → 우측 "고배당 TOP" 박스(회사명·종목코드·주당배당·배당수익률·배당락).
2. 콘솔: `fetch('/api/dividend/feed').then(r=>r.json()).then(j=>console.log(j.items?.length))` → 20(또는 데이터 수).

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/dividend/feed/route.ts components/toolbox/DividendFeed.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(dividend): 공모주·배당 탭 우측 고배당 TOP 피드(실데이터 DB) (STEP 341)" && git push
```

---

> **한 줄 요약**: 공모주·배당 탭에 Supabase 실데이터로 고배당 TOP 20 피드(중복제거). IPO 청약일정은 추후 공공데이터포털 검토.
