<!-- 2026-07-15 -->
# STEP 729 — US 구조화 IPO 피드 (Nasdaq 공개 API · KR급 뎁스)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(정확한 코드 제공·다파일. Sonnet. `/clear` 후.)

**목표(P2):** US IPO 탭을 **뉴스검색 → 구조화 캘린더**로. 이번달 예정(upcoming) + 이번·지난달 최근상장(priced)을 병합해 **회사명·티커·거래소·공모가·날짜·딜규모**를 카드로. KR `IpoFeed`(38.co.kr)와 동급. JP/CN/VN/GB는 뉴스 유지, KR `OfferingsFeed` 불변.

**전제:** STEP 728 프로브로 **Nasdaq 공개 API 검증 완료**(HTTP 200·헤더로 403 회피·실데이터). 코드 HEAD = `d15dbed` 이후(다크D 정리 포함).

**실측 소스 스펙(728 결과):** `https://api.nasdaq.com/api/ipo/calendar?date=YYYY-MM`
- `data.upcoming.upcomingTable.rows[]`: `proposedTickerSymbol`·`companyName`·`proposedExchange`·`proposedSharePrice`(범위 "23.00-27.00")·`sharesOffered`·`expectedPriceDate`·`dollarValueOfSharesOffered`
- `data.priced.rows[]`: 위 + `pricedDate`·`dealStatus`(proposedSharePrice=최종가)
- `data.filed.rows[]`: 거래소·가격 없음(미확정 단계) → **이번엔 미사용**
- ⚠️ 다음달 쿼리는 0건(예정 IPO가 원래 몇 주 앞만) → **이번달+지난달**만 병합(항상 풍부).

---

## 파일 1 (신규) — `app/api/ipo/us-feed/route.ts`
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

type UsIpoItem = { ticker: string; name: string; exchange: string; price: string; date: string; dealSize: string; status: "upcoming" | "priced" };

function ymOffset(n: number): string {
  const d = new Date();
  const dt = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

async function fetchMonth(ym: string): Promise<any | null> {
  try {
    const r = await fetch(`https://api.nasdaq.com/api/ipo/calendar?date=${ym}`, {
      headers: NASDAQ_HEADERS,
      next: { revalidate: 21600 },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const [cur, prev] = await Promise.all([fetchMonth(ymOffset(0)), fetchMonth(ymOffset(-1))]);
  const items: UsIpoItem[] = [];
  const seen = new Set<string>();

  const pushUpcoming = (rows: any[] | undefined) =>
    (rows ?? []).forEach((row) => {
      const t = row?.proposedTickerSymbol;
      if (!t || seen.has("u" + t)) return;
      seen.add("u" + t);
      items.push({
        ticker: t, name: row.companyName ?? t, exchange: row.proposedExchange ?? "",
        price: row.proposedSharePrice ?? "", date: row.expectedPriceDate ?? "",
        dealSize: row.dollarValueOfSharesOffered ?? "", status: "upcoming",
      });
    });
  const pushPriced = (rows: any[] | undefined) =>
    (rows ?? []).forEach((row) => {
      const t = row?.proposedTickerSymbol;
      if (!t || seen.has("p" + t)) return;
      seen.add("p" + t);
      items.push({
        ticker: t, name: row.companyName ?? t, exchange: row.proposedExchange ?? "",
        price: row.proposedSharePrice ?? "", date: row.pricedDate ?? "",
        dealSize: row.dollarValueOfSharesOffered ?? "", status: "priced",
      });
    });

  pushUpcoming(cur?.data?.upcoming?.upcomingTable?.rows);
  pushPriced(cur?.data?.priced?.rows);
  pushPriced(prev?.data?.priced?.rows);

  const pd = (s: string) => { const d = Date.parse(s); return isNaN(d) ? 0 : d; };
  items.sort((a, b) => {
    if (a.status !== b.status) return a.status === "upcoming" ? -1 : 1;
    return a.status === "upcoming" ? pd(a.date) - pd(b.date) : pd(b.date) - pd(a.date);
  });

  return NextResponse.json(
    { items: items.slice(0, 30) },
    { headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400" } }
  );
}
```

## 파일 2 (신규) — `components/toolbox/UsIpoFeed.tsx`
```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCache, setCache } from "@/lib/clientCache";

type UsIpoItem = { ticker: string; name: string; exchange: string; price: string; date: string; dealSize: string; status: "upcoming" | "priced" };

const SRC = "https://www.nasdaq.com/market-activity/ipos";

export default function UsIpoFeed() {
  const t = useTranslations("Feed");
  const [items, setItems] = useState<UsIpoItem[]>(() => getCache<UsIpoItem[]>("usipo") ?? []);
  const [loading, setLoading] = useState(() => getCache("usipo") === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ipo/us-feed")
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache("usipo", list); setLoading(false); } })
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
        <p className="text-sm text-unjong-muted">{t("usIpo.empty")}</p>
        <a href={SRC} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-xs text-unjong-accent">{t("usIpo.direct")}</a>
      </div>
    );

  const price = (p: string) => (p ? (p.startsWith("$") ? p : `$${p}`) : "");
  const upcoming = items.filter((i) => i.status === "upcoming");
  const priced = items.filter((i) => i.status === "priced");

  const inner = (it: UsIpoItem) => (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-unjong-primary group-hover:text-unjong-accent">
          {it.name} <span className="text-unjong-muted">{it.ticker}</span>
        </p>
        <span className="shrink-0 text-[11px] font-medium text-unjong-primary">{it.date}</span>
      </div>
      <p className="mt-0.5 truncate text-[11px] text-unjong-muted">
        {[it.exchange, price(it.price), it.dealSize].filter(Boolean).join(" · ")}
      </p>
    </>
  );
  // priced=상장 완료 → 내부 종목상세(TR-AI 렌즈), upcoming=미상장 → Nasdaq 외부
  const Row = (it: UsIpoItem) =>
    it.status === "priced" ? (
      <Link key={"p" + it.ticker} href={`/stock/${it.ticker}`} className="group block border-b border-unjong-border py-2.5 last:border-0">{inner(it)}</Link>
    ) : (
      <a key={"u" + it.ticker} href={SRC} target="_blank" rel="noopener noreferrer nofollow" className="group block border-b border-unjong-border py-2.5 last:border-0">{inner(it)}</a>
    );

  return (
    <div>
      {upcoming.length > 0 && (
        <>
          <p className="mb-2 text-sm font-bold text-unjong-primary">{t("usIpo.upcoming")}</p>
          <div className="mb-4 rounded-xl border border-unjong-border bg-unjong-surface px-3">{upcoming.map(Row)}</div>
        </>
      )}
      {priced.length > 0 && (
        <>
          <p className="mb-2 text-sm font-bold text-unjong-primary">{t("usIpo.priced")}</p>
          <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">{priced.map(Row)}</div>
        </>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{t("usIpo.source")}</p>
    </div>
  );
}
```

## 파일 3 — `components/toolbox/ToolboxClient.tsx` (US IPO 배선)
1. import 추가(다른 Feed import들 근처):
```tsx
import UsIpoFeed from './UsIpoFeed';
```
2. `case 'ipo':` 블록(대략 line 120~121)에서 **US 분기만** 교체 — 기존:
```tsx
    case 'ipo': return country === 'US'
      ? <NewsFeed country="US" query="IPO stock market debut listing" title={t('feedTitle.ipo.US')} />
```
→ 변경:
```tsx
    case 'ipo': return country === 'US'
      ? <UsIpoFeed />
```
**JP/CN/VN/GB `<NewsFeed .../>` 분기와 KR `<OfferingsFeed />`(맨 끝)는 1글자도 건드리지 말 것.**

## 파일 4 — i18n: `messages/ko.json` + `messages/en.json` (Feed 네임스페이스에 `usIpo` 추가)
**두 파일 모두** `Feed` 안, 기존 `ipo` 키 근처에 추가(패리티 필수 — `messages.test.ts`가 검사):
```jsonc
// ko.json > "Feed" 안
"usIpo": {
  "upcoming": "상장 예정",
  "priced": "최근 상장",
  "source": "출처: Nasdaq IPO 캘린더 · 예정일·공모가는 변동될 수 있음",
  "empty": "표시할 US IPO가 없습니다",
  "direct": "Nasdaq에서 직접 보기"
},
// en.json > "Feed" 안
"usIpo": {
  "upcoming": "Upcoming",
  "priced": "Recently priced",
  "source": "Source: Nasdaq IPO calendar · dates and prices may change",
  "empty": "No US IPOs to show",
  "direct": "View on Nasdaq"
}
```

## ⚠️ 주의
- **KR IPO 탭(OfferingsFeed=IpoFeed+DividendFeed) 불변** · JP/CN/VN/GB IPO 뉴스 분기 불변.
- `feedTitle.ipo.US` 키는 이제 US에서 미사용이지만 **삭제하지 말 것**(다른 데서 참조 가능·무해).
- 회사명·티커는 영어(미국 종목=고유명사) — ko/en 양쪽에서 영어로 뜨는 게 정상(라벨만 로케일).
- 받은 IPO 가격/딜규모가 이상해 보여도 **내 지식으로 오염 단정 금지**(present-day·훈련지식 밖).
- 🐞 **Vercel 403 리스크**: 프로브는 로컬(US IP) 성공. Vercel 서버리스(US IP)도 같은 헤더면 대개 OK(KR `/api/ipo/feed` 38.co.kr도 Vercel서 동작). **배포 후 `/api/ipo/us-feed` 실응답 반드시 확인** — 만약 Vercel만 403이면 Cowork에 보고(대체 = GitHub Actions 크론→Supabase 캐시, VN VCI 패턴). 이번 STEP은 우선 서버리스 직접 fetch로.

## 검증
1. `npx tsc --noEmit` → 0.
2. `NEXT_DIST_DIR=.next-verify npm run build` → 성공(새 라우트·컴포넌트 컴파일). 끝나면 `.next-verify` 삭제.
3. `npx vitest run` → **전체 통과**(특히 `messages.test.ts` ko/en 패리티 — usIpo 5키 양쪽 동일).
4. dev(포트 3000): `/api/ipo/us-feed` 직접 열어 `{items:[...]}` 실데이터(회사명·티커·priced/upcoming) 확인.
5. dev 화면: **US 시장 → 정보 → IPO 탭** → "상장 예정"(Csquare/CSQR 등) + "최근 상장" 2섹션 카드. `/en`에서 = "Upcoming"/"Recently priced" 영어 라벨·회사명 영어. priced 카드 클릭 → 내부 `/stock/{ticker}`(로케일 유지). upcoming 클릭 → Nasdaq.
6. KR IPO 탭 = 기존 청약/배당 그대로(무영향). 빈/에러 상태 정직.

## 커밋
```bash
git add -A && git commit -m "feat(729·US 뎁스): US 구조화 IPO 피드 — Nasdaq 공개 API(/api/ipo/us-feed)+UsIpoFeed(예정+최근상장 2섹션)+Toolbox 배선+i18n(ko/en usIpo 패리티)·priced→내부 종목상세·KR/JP/CN/VN/GB 불변" && git push
```

## 다음
- 배포 후 Cowork이 라이브 `/en`·`/ko` US IPO 탭 실측(구조화 렌더·영어 라벨·priced 링크·Vercel 403 여부).
- (후속 P3 후보) US 배당 캘린더(Nasdaq `calendar/dividends`)로 US OfferingsFeed 확장 = KR 완전 동급. ETN 서브탭.
- `docs/LOCALE_SOURCE_PLAYBOOK.md`에 Nasdaq IPO 공개 API 소스 등록(무키·헤더 필수·필드 스펙).
