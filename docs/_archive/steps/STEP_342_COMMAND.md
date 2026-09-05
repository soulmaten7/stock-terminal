<!-- 2026-06-21 -->
# STEP 342 — [신규] 공모주(IPO) 청약일정 피드 + 공모주/배당 토글

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_342_COMMAND.md 파일 내용대로 실행해줘
```

- **선행**: STEP 341 적용 완료(DividendFeed 존재).

---

## 🎯 목표
공모주·배당(ipo) 탭 우측을 **공모주 / 배당 토글**로:
- **공모주**: 38커뮤니케이션 청약일정 스크래핑(종목·청약일·공모가·주간사). 견고 파싱 + 1시간 캐시 + 실패 시 "38 직접보기" 폴백(틀린 데이터 방지).
- **배당**: 기존 DividendFeed(고배당 TOP).

> 신규 3파일(API·IpoFeed·OfferingsFeed) + `ToolboxClient.tsx` 2곳.

---

## 📄 파일 1 (신규) — `app/api/ipo/feed/route.ts`

```ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IpoItem = { name: string; sub: string; price: string; band: string; rate: string; underwriter: string; link: string };

let cache: { at: number; data: unknown } | null = null;

function absUrl(href: string): string {
  try { return new URL(href, "http://www.38.co.kr/html/fund/index.htm").href; }
  catch { return "http://www.38.co.kr/html/fund/index.htm?o=k"; }
}

export async function GET() {
  if (cache && Date.now() - cache.at < 60 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }
  try {
    const res = await fetch("http://www.38.co.kr/html/fund/index.htm?o=k", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ items: [], error: "fetch_" + res.status });

    const buf = await res.arrayBuffer();
    const html = new TextDecoder("euc-kr").decode(buf); // 38은 EUC-KR
    const $ = cheerio.load(html);

    const items: IpoItem[] = [];
    $("tr").each((_, tr) => {
      const $tr = $(tr);
      const a = $tr.find('a[href*="o=v"]').first(); // 종목 상세 링크가 있는 행만
      const name = a.text().replace(/\s+/g, " ").trim();
      if (!a.length || !name) return;

      const cells = $tr.find("td").map((_, td) => $(td).text().replace(/\s+/g, " ").trim()).get();
      const dateIdx = cells.findIndex((c) => /\d{4}\.\d{2}\.\d{2}/.test(c)); // 청약일(YYYY.MM.DD~) 셀
      if (dateIdx < 0) return;

      const sub = cells[dateIdx] || "";
      const priceRaw = cells[dateIdx + 1] || "";
      const band = cells[dateIdx + 2] || "";
      const rate = cells.slice(dateIdx + 1).find((c) => /\d[\d.]*\s*:\s*1/.test(c)) || "";
      const underwriter = cells.slice(dateIdx + 1).find((c) => c.includes("증권")) || "";

      items.push({
        name,
        sub,
        price: priceRaw && priceRaw !== "-" ? priceRaw : "",
        band,
        rate,
        underwriter,
        link: absUrl(a.attr("href") || ""),
      });
    });

    // 종목 중복 제거 + 상위 15(표가 청약일 내림차순=미래 먼저)
    const seen = new Set<string>();
    const list = items
      .filter((x) => {
        if (seen.has(x.name)) return false;
        seen.add(x.name);
        return true;
      })
      .slice(0, 15);

    const data = { items: list };
    if (list.length > 0) cache = { at: Date.now(), data }; // 파싱 성공 시만 캐시
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
```

---

## 📄 파일 2 (신규) — `components/toolbox/IpoFeed.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';

type IpoItem = { name: string; sub: string; price: string; band: string; rate: string; underwriter: string; link: string };

const SRC = 'http://www.38.co.kr/html/fund/index.htm?o=k';

export default function IpoFeed() {
  const [items, setItems] = useState<IpoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ipo/feed')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.items ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">청약일정 불러오는 중…</p>;
  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-unjong-muted">청약일정을 불러오지 못했습니다.</p>
        <a href={SRC} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-xs text-unjong-accent">38커뮤니케이션에서 직접 보기 →</a>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">공모주 청약일정</p>
      <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">
        {items.map((it, i) => (
          <a key={`${it.name}${i}`} href={it.link} target="_blank" rel="noopener noreferrer nofollow" className="group block border-b border-unjong-border py-2.5 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-unjong-primary group-hover:text-unjong-accent">{it.name}</p>
              <span className="shrink-0 text-[11px] font-medium text-unjong-primary">{it.sub}</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-unjong-muted">
              {it.price ? `확정 ${it.price}원` : it.band ? `희망 ${it.band}` : ''}
              {it.underwriter ? ` · ${it.underwriter}` : ''}
            </p>
          </a>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">출처: 38커뮤니케이션. 청약일정은 증권신고서 수리과정에서 변경될 수 있습니다.</p>
    </div>
  );
}
```

---

## 📄 파일 3 (신규) — `components/toolbox/OfferingsFeed.tsx`

```tsx
'use client';

import { useState } from 'react';
import IpoFeed from './IpoFeed';
import DividendFeed from './DividendFeed';

export default function OfferingsFeed() {
  const [view, setView] = useState<'ipo' | 'div'>('ipo');
  return (
    <div>
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          onClick={() => setView('ipo')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            view === 'ipo' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
          }`}
        >
          공모주
        </button>
        <button
          type="button"
          onClick={() => setView('div')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            view === 'div' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
          }`}
        >
          배당
        </button>
      </div>
      {view === 'ipo' ? <IpoFeed /> : <DividendFeed />}
    </div>
  );
}
```

---

## 📄 파일 4 (수정 2곳) — `components/toolbox/ToolboxClient.tsx`

### 1 — import 교체 (DividendFeed → OfferingsFeed)
**찾기:**
```tsx
import DividendFeed from './DividendFeed';
```
**바꾸기:**
```tsx
import OfferingsFeed from './OfferingsFeed';
```

### 2 — feedFor의 ipo 분기 교체
**찾기:**
```tsx
    case 'ipo': return <DividendFeed />;
```
**바꾸기:**
```tsx
    case 'ipo': return <OfferingsFeed />;
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

### ⚠️ dev 서버 완전 재시작 (신규 라우트)
```bash
lsof -ti:3333 | xargs kill -9 2>/dev/null; cd ~/stock-terminal && npm run dev
```

### 확인
1. **공모주·배당 탭** → 우측 상단 **공모주 / 배당 토글**.
2. **공모주** → 청약일정 목록(종목·청약일·공모가·주간사), 클릭 시 38 상세.
3. **배당** → 기존 고배당 TOP.
4. 콘솔: `fetch('/api/ipo/feed').then(r=>r.json()).then(j=>console.log(j.items?.length, j.items?.[0]))` → 15, 첫 종목 객체.

> 파싱 실패해도 "38 직접보기" 링크로 폴백 — 틀린 데이터는 절대 안 보임.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/ipo/feed/route.ts components/toolbox/IpoFeed.tsx components/toolbox/OfferingsFeed.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(ipo): 공모주 청약일정 피드(38 스크래핑) + 공모주/배당 토글 (STEP 342)" && git push
```

---

> **한 줄 요약**: 공모주·배당 탭에 38커뮤니케이션 청약일정 스크래핑 피드 + 공모주/배당 토글. 견고 파싱·캐시·폴백으로 신뢰 유지. 실행 후 MCP 검증 예정.
