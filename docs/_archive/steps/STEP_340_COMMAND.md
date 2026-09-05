<!-- 2026-06-21 -->
# STEP 340 — [신규] 뉴스 키워드 피드 일반화 → 기업·재무 / 리포트 / ETF·펀드 탭

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_340_COMMAND.md 파일 내용대로 실행해줘
```

- **선행**: STEP 337·338 적용 완료 상태(같은 ToolboxClient 블록 확장).

---

## 🎯 목표
NewsFeed를 **검색어(query) 받게 일반화**해서, 전용 데이터가 없는 탭에 주제별 최신 뉴스 피드를 붙임:
- 기업·재무(analysis): "실적·재무 뉴스"
- 리포트(research): "리포트·목표주가 뉴스"
- ETF·펀드(etf): "ETF·펀드 뉴스"

> 변경 3파일: `app/api/news/feed/route.ts`(쿼리별 캐시·`?q=`) · `components/toolbox/NewsFeed.tsx`(query·title prop) · `components/toolbox/ToolboxClient.tsx`(feedFor 매핑).

---

## 📄 1) `app/api/news/feed/route.ts` — **전체 교체** (쿼리별 캐시 + `?q=`)

```ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NewsItem = { title: string; link: string; source: string; pubDate: string; image: string | null };
type Parsed = NewsItem & { naver: string };

const cache = new Map<string, { at: number; data: unknown }>();

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'")
    .trim();
}
function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}
function absUrl(src: string, base: string): string {
  try { return new URL(src, base).href; } catch { return src; }
}

async function ogImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const cand =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[name="twitter:image:src"]').attr("content") ||
      $('link[rel="image_src"]').attr("href");
    if (!cand) return null;
    return absUrl(cand.trim(), url);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const id = (process.env.NAVER_CLIENT_ID || "").trim();
  const secret = (process.env.NAVER_CLIENT_SECRET || "").trim();
  if (!id || !secret) return NextResponse.json({ items: [], error: "no_key" });

  const q = (new URL(req.url).searchParams.get("q") || "증시").trim();

  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < 15 * 60 * 1000) {
    return NextResponse.json(hit.data);
  }

  try {
    const url = "https://openapi.naver.com/v1/search/news.json?query=" + encodeURIComponent(q) + "&display=20&sort=date";
    const res = await fetch(url, {
      headers: { "X-Naver-Client-Id": id, "X-Naver-Client-Secret": secret },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ items: [], error: "naver_" + res.status });
    const j = await res.json();

    const parsed: Parsed[] = ((j.items ?? []) as Record<string, string>[])
      .map((it) => {
        const orig = it.originallink || it.link || "";
        return {
          title: stripHtml(it.title || ""),
          link: orig,
          naver: it.link || "",
          source: hostOf(orig),
          pubDate: it.pubDate || "",
          image: null as string | null,
        };
      })
      .filter((x) => x.title && x.link);

    const TOP = Math.min(6, parsed.length);
    await Promise.all(
      parsed.slice(0, TOP).map(async (it) => {
        const tries: string[] = [];
        if (it.naver && /n\.news\.naver\.com/.test(it.naver)) tries.push(it.naver);
        if (it.link) tries.push(it.link);
        if (it.naver && !tries.includes(it.naver)) tries.push(it.naver);
        for (const u of tries) {
          const img = await ogImage(u);
          if (img) { it.image = img; break; }
        }
      })
    );

    let fi = parsed.findIndex((it) => it.image);
    if (fi < 0) fi = 0;
    const ordered = [parsed[fi], ...parsed.filter((_, i) => i !== fi)];

    const items: NewsItem[] = ordered.map((it) => ({
      title: it.title, link: it.link, source: it.source, pubDate: it.pubDate, image: it.image,
    }));

    const data = { items };
    cache.set(q, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
```

---

## 📄 2) `components/toolbox/NewsFeed.tsx` — query·title prop (3곳)

### 2-1 시그니처
**찾기:**
```tsx
export default function NewsFeed() {
```
**바꾸기:**
```tsx
export default function NewsFeed({ query, title }: { query?: string; title?: string }) {
```

### 2-2 fetch에 쿼리 반영 + deps
**찾기:**
```tsx
    fetch('/api/news/feed')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.items ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
```
**바꾸기:**
```tsx
    fetch('/api/news/feed' + (query ? '?q=' + encodeURIComponent(query) : ''))
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.items ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query]);
```

### 2-3 헤더 타이틀
**찾기:**
```tsx
      <p className="mb-2 text-sm font-bold text-unjong-primary">최신 뉴스</p>
```
**바꾸기:**
```tsx
      <p className="mb-2 text-sm font-bold text-unjong-primary">{title || '최신 뉴스'}</p>
```

---

## 📄 3) `components/toolbox/ToolboxClient.tsx` — feedFor 매핑 (3곳)

### 3-1 FEED_TABS + feedFor 추가
**찾기:**
```tsx
const SPECIAL_LABELS: Record<string, string> = { market: '종목·상품', youtube: '유튜브', room: '리딩방·검증' };
```
**바꾸기:**
```tsx
const SPECIAL_LABELS: Record<string, string> = { market: '종목·상품', youtube: '유튜브', room: '리딩방·검증' };

// 우측 피드가 붙는 탭(한국 전용) + 탭별 피드 컴포넌트
const FEED_TABS = ['news', 'disclosure', 'macro', 'analysis', 'research', 'etf'];
function feedFor(tab: string) {
  switch (tab) {
    case 'news': return <NewsFeed />;
    case 'disclosure': return <DartFeed />;
    case 'macro': return <MacroFeed />;
    case 'analysis': return <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
    case 'research': return <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
    case 'etf': return <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
    default: return null;
  }
}
```

### 3-2 조건 교체
**찾기:**
```tsx
        ) : (activeTab === 'news' || activeTab === 'disclosure' || activeTab === 'macro') && country === 'KR' ? (
```
**바꾸기:**
```tsx
        ) : FEED_TABS.includes(activeTab) && country === 'KR' ? (
```

### 3-3 aside 내용 교체
**찾기:**
```tsx
            <aside className="hidden w-96 shrink-0 lg:block">
              {activeTab === 'news' ? <NewsFeed /> : activeTab === 'disclosure' ? <DartFeed /> : <MacroFeed />}
            </aside>
```
**바꾸기:**
```tsx
            <aside className="hidden w-96 shrink-0 lg:block">
              {feedFor(activeTab)}
            </aside>
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

### ⚠️ dev 서버 완전 재시작 (라우트 캐시 구조 변경)
```bash
lsof -ti:3333 | xargs kill -9 2>/dev/null; cd ~/stock-terminal && npm run dev
```

### 확인
1. **기업·재무** → 우측 "실적·재무 뉴스".
2. **리포트** → 우측 "리포트·목표주가 뉴스".
3. **ETF·펀드** → 우측 "ETF·펀드 뉴스".
4. 뉴스 탭(기본 증시)·공시·거시 그대로 정상.
5. 콘솔: `fetch('/api/news/feed?q=ETF').then(r=>r.json()).then(j=>console.log(j.items?.length))` → 20.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/news/feed/route.ts components/toolbox/NewsFeed.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(feed): 뉴스 키워드 피드 일반화 → 기업재무·리포트·ETF 탭 (STEP 340)" && git push
```

---

> **한 줄 요약**: NewsFeed를 검색어 받게 일반화 → 기업·재무/리포트/ETF 탭에 주제별 최신 뉴스. 공모주·배당(실데이터)은 다음 STEP.
