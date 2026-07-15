<!-- 2026-07-15 -->
# STEP 731 — US 배당 캘린더 구현 → US OfferingsFeed (IPO + 배당, KR 완전 동급)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(정확한 코드 제공·다파일. Sonnet. `/clear` 후.)

**목표:** US 'ipo' 탭을 KR처럼 **IPO + 배당 토글**로. 729의 `UsIpoFeed`에 `UsDividendFeed`를 형제로 붙여 `UsOfferingsFeed`(토글) 만들고 배선 교체. → US OfferingsFeed = KR OfferingsFeed 완전 동급.

**전제:** 729(`9d977f0`) + 730 프로브 검증 완료. **STEP 730 실측 확정**:
- 엔드포인트 `https://api.nasdaq.com/api/calendar/dividends?date=YYYY-MM-DD` (**일 단위**·월 단위는 빈응답).
- 구조 `data.calendar.rows[]` · 필드 `companyName`·`symbol`·`dividend_Ex_Date`·`payment_Date`·`record_Date`·`dividend_Rate`·`indicated_Annual_Dividend`·`announcement_Date`.
- 하루 5~30건(배당락일이 특정일 몰림) → **앞 14일 병합**으로 풍부화. 커버드콜 ETN(USOI 등) 배당률 큰 건 **정상**(가드 금지).

---

## 파일 1 (신규) — `app/api/dividends/us-feed/route.ts`
```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 21600; // 6h

const NASDAQ_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.nasdaq.com",
  Referer: "https://www.nasdaq.com/",
};

type UsDivItem = { symbol: string; name: string; exDate: string; payDate: string; amount: string };

function isoDay(n: number): string {
  return new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
}

async function fetchDay(day: string): Promise<any[]> {
  try {
    const r = await fetch(`https://api.nasdaq.com/api/calendar/dividends?date=${day}`, {
      headers: NASDAQ_HEADERS,
      next: { revalidate: 21600 },
    });
    if (!r.ok) return [];
    const j: any = await r.json();
    return j?.data?.calendar?.rows ?? [];
  } catch {
    return [];
  }
}

// 동시성 제한(Nasdaq 버스트 403 회피 — 14일을 4개씩)
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

export async function GET() {
  const days = Array.from({ length: 14 }, (_, i) => isoDay(i)); // 오늘~13일 뒤(배당락일 캘린더)
  const perDay = await mapLimit(days, 4, fetchDay);
  const items: UsDivItem[] = [];
  const seen = new Set<string>();
  perDay.flat().forEach((row: any) => {
    const sym = row?.symbol;
    if (!sym) return;
    const ex = row?.dividend_Ex_Date ?? "";
    const key = sym + ex;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      symbol: sym,
      name: row.companyName ?? sym,
      exDate: ex,
      payDate: row.payment_Date ?? "",
      amount: String(row.dividend_Rate ?? ""),
    });
  });
  const pd = (s: string) => { const d = Date.parse(s); return isNaN(d) ? Infinity : d; };
  items.sort((a, b) => pd(a.exDate) - pd(b.exDate)); // 배당락일 임박순
  return NextResponse.json(
    { items: items.slice(0, 40) },
    { headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400" } }
  );
}
```

## 파일 2 (신규) — `components/toolbox/UsDividendFeed.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCache, setCache } from "@/lib/clientCache";

type UsDivItem = { symbol: string; name: string; exDate: string; payDate: string; amount: string };

const SRC = "https://www.nasdaq.com/market-activity/dividends";

export default function UsDividendFeed() {
  const t = useTranslations("Feed");
  const [items, setItems] = useState<UsDivItem[]>(() => getCache<UsDivItem[]>("usdiv") ?? []);
  const [loading, setLoading] = useState(() => getCache("usdiv") === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dividends/us-feed")
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache("usdiv", list); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading)
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-unjong-background" />)}
      </div>
    );
  if (items.length === 0)
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-unjong-muted">{t("usDiv.empty")}</p>
        <a href={SRC} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-xs text-unjong-accent">{t("usDiv.direct")}</a>
      </div>
    );

  const amt = (a: string) => (a ? (a.startsWith("$") ? a : `$${a}`) : "");
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">{t("usDiv.title")}</p>
      <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">
        {items.map((it) => (
          <Link key={it.symbol + it.exDate} href={`/stock/${it.symbol}`} className="group block border-b border-unjong-border py-2.5 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-unjong-primary group-hover:text-unjong-accent">
                {it.name} <span className="text-unjong-muted">{it.symbol}</span>
              </p>
              <span className="shrink-0 text-[11px] font-medium text-unjong-primary">{t("usDiv.ex", { d: it.exDate })}</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-unjong-muted">
              {[amt(it.amount) && t("usDiv.amount", { v: amt(it.amount) }), it.payDate && t("usDiv.pay", { d: it.payDate })].filter(Boolean).join(" · ")}
            </p>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{t("usDiv.source")}</p>
    </div>
  );
}
```

## 파일 3 (신규) — `components/toolbox/UsOfferingsFeed.tsx` (KR OfferingsFeed 미러)
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import UsIpoFeed from "./UsIpoFeed";
import UsDividendFeed from "./UsDividendFeed";

export default function UsOfferingsFeed() {
  const t = useTranslations("Feed");
  const [view, setView] = useState<"ipo" | "div">("ipo");
  return (
    <div>
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          onClick={() => setView("ipo")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${view === "ipo" ? "bg-unjong-strong text-white" : "text-unjong-muted hover:bg-unjong-background"}`}
        >
          {t("offerings.ipo")}
        </button>
        <button
          type="button"
          onClick={() => setView("div")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${view === "div" ? "bg-unjong-strong text-white" : "text-unjong-muted hover:bg-unjong-background"}`}
        >
          {t("offerings.dividend")}
        </button>
      </div>
      {view === "ipo" ? <UsIpoFeed /> : <UsDividendFeed />}
    </div>
  );
}
```

## 파일 4 — `components/toolbox/ToolboxClient.tsx` (배선 교체)
1. import 교체/추가: `import UsIpoFeed from './UsIpoFeed';` → **`import UsOfferingsFeed from './UsOfferingsFeed';`** (UsIpoFeed는 UsOfferingsFeed 내부에서만 쓰이므로 ToolboxClient의 직접 import 제거).
2. `case 'ipo':` US 분기(729에서 `<UsIpoFeed />`) → **`<UsOfferingsFeed />`**:
```tsx
    case 'ipo': return country === 'US'
      ? <UsOfferingsFeed />
```
**JP/CN/VN/GB 뉴스·KR `<OfferingsFeed />`(맨 끝)는 불변.**

## 파일 5 — i18n: `messages/ko.json` + `messages/en.json` (Feed에 `usDiv` 추가·`offerings`는 이미 존재)
`Feed` 안, `usIpo` 근처에 추가(**패리티 필수**):
```jsonc
// ko.json > "Feed"
"usDiv": {
  "title": "배당락 예정",
  "ex": "배당락 {d}",
  "amount": "주당 {v}",
  "pay": "지급 {d}",
  "source": "출처: Nasdaq 배당 캘린더 · 앞 14일 배당락 예정",
  "empty": "표시할 배당 예정이 없습니다",
  "direct": "Nasdaq에서 직접 보기"
},
// en.json > "Feed"
"usDiv": {
  "title": "Upcoming ex-dividend",
  "ex": "Ex {d}",
  "amount": "{v}/share",
  "pay": "Pay {d}",
  "source": "Source: Nasdaq dividend calendar · ex-dates in the next 14 days",
  "empty": "No upcoming dividends to show",
  "direct": "View on Nasdaq"
}
```
> `offerings.ipo`/`offerings.dividend`(토글 라벨)은 KR OfferingsFeed가 쓰던 것 그대로 재사용(이미 양쪽 존재).

## ⚠️ 주의
- KR `OfferingsFeed`·`IpoFeed`·`DividendFeed` **불변**(US는 별도 컴포넌트). JP/CN/VN/GB IPO 뉴스 분기 불변.
- 배당금·배당률이 커 보여도(커버드콜 ETN) **오염 단정·가드 금지**(present-day·정상 분배금).
- 회사명은 영어(고유명사) — ko/en 양쪽 영어가 정상(라벨만 로케일).
- 배당 종목은 상장·거래 중이므로 카드→내부 `/stock/{ticker}`(TR-AI 렌즈) 연결.
- 🐞 Vercel 403: 730 프로브는 로컬 성공·729 us-feed는 Vercel 200 확인됨(같은 API 패밀리). 14일 병렬은 **동시성 4**로 제한(버스트 403 회피). 배포 후 `/api/dividends/us-feed` 실응답 확인.

## 검증
1. `npx tsc --noEmit` → 0.
2. `NEXT_DIST_DIR=.next-verify npm run build` → 성공. 끝나면 삭제.
3. `npx vitest run` → 전체 통과(`messages.test.ts` ko/en 패리티 — usDiv 7키 양쪽 동일).
4. dev: `/api/dividends/us-feed` 실데이터(회사명·배당락일·배당금) 확인.
5. dev 화면: **US 시장 → 정보 → IPO 탭** → 상단 **IPO / 배당 토글** → IPO=729 그대로, **배당=배당락 예정 카드**(회사명·배당락일·주당 배당·지급일·배당락 임박순). `/en`=영어 라벨(Upcoming ex-dividend/Ex/…/share/Pay). 카드 클릭→내부 종목상세.
6. KR IPO 탭(청약/배당) 무영향. 빈/에러 정직.

## 커밋
```bash
git add -A && git commit -m "feat(731·US 뎁스): US 배당 캘린더 → US OfferingsFeed(IPO+배당 토글·KR 동급) — /api/dividends/us-feed(Nasdaq 일단위 14일 병합)+UsDividendFeed+UsOfferingsFeed+배선+i18n(usDiv 패리티)·배당종목→내부 종목상세·KR/JP/CN/VN/GB 불변" && git push
```

## 다음
- 배포 후 Cowork 라이브 실측(US IPO/배당 토글·배당 카드·영어 라벨·Vercel 403 여부).
- **STEP 732 = US ETN 보드 서브탭**(별도·병렬 가능). `LOCALE_SOURCE_PLAYBOOK §6b`에 Nasdaq 배당 API 추가.
