<!-- 2026-06-21 -->
# STEP 336 — [개선·진단] 뉴스 이미지 안정화(+debug) & 탭 새로고침 유지

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_336_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
1. **뉴스 이미지 안정화** — 네이버 뉴스 페이지 우선 스크래핑 + 셀렉터 확장 + `?debug=1` 진단 모드.
2. **hotlink 차단 우회** — 대표 이미지 `<img>`에 `referrerPolicy="no-referrer"`.
3. **탭 새로고침 유지** — 어떤 탭/국가에 있든 새로고침해도 그 자리 유지(localStorage).

> 변경 3파일: `app/api/news/feed/route.ts`(전체 교체) · `components/toolbox/NewsFeed.tsx`(1곳) · `components/toolbox/ToolboxClient.tsx`(2곳).

---

## 📄 1) `app/api/news/feed/route.ts` — 아래 내용으로 **전체 교체**

```ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NewsItem = { title: string; link: string; source: string; pubDate: string; image: string | null };
type Parsed = NewsItem & { naver: string };

let cache: { at: number; data: unknown } | null = null;

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
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const cand =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[property="og:image:url"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[name="twitter:image:src"]').attr("content") ||
      $('meta[itemprop="image"]').attr("content") ||
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

  const debug = new URL(req.url).searchParams.get("debug") === "1";

  if (!debug && cache && Date.now() - cache.at < 15 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  try {
    const url = "https://openapi.naver.com/v1/search/news.json?query=" + encodeURIComponent("증시") + "&display=20&sort=date";
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

    // 상위 6개 og:image 병렬 수집. 네이버 뉴스 페이지가 있으면 그걸 먼저(차단 적음), 그다음 원문.
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

    // 진단 모드: 상위 6개의 스크래핑 결과를 그대로 반환
    if (debug) {
      return NextResponse.json({
        top: parsed.slice(0, TOP).map((it) => ({ source: it.source, image: it.image, link: it.link, naver: it.naver })),
      });
    }

    // 대표 = 이미지 있는 첫 기사(없으면 맨 앞). 그 기사를 맨 앞으로.
    let fi = parsed.findIndex((it) => it.image);
    if (fi < 0) fi = 0;
    const ordered = [parsed[fi], ...parsed.filter((_, i) => i !== fi)];

    const items: NewsItem[] = ordered.map((it) => ({
      title: it.title, link: it.link, source: it.source, pubDate: it.pubDate, image: it.image,
    }));

    const data = { items };
    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
```

---

## 📄 2) `components/toolbox/NewsFeed.tsx` — 대표 `<img>`에 referrerPolicy 추가 (1곳)

**찾기:**
```tsx
          <img src={featured.image} alt="" className="h-36 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
```
**바꾸기:**
```tsx
          <img src={featured.image} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-36 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
```

---

## 📄 3) `components/toolbox/ToolboxClient.tsx` — 탭/국가 새로고침 유지 (2곳)

### 3-1 useEffect import
**찾기:**
```tsx
import { useState } from 'react';
```
**바꾸기:**
```tsx
import { useState, useEffect } from 'react';
```

### 3-2 상태 선언 바로 아래에 localStorage 동기화 추가
**찾기:**
```tsx
  const [country, setCountry] = useState('KR');
  const [categories, setCategories] = useState(initialCategories);
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0]);
```
**바꾸기:**
```tsx
  const [country, setCountry] = useState('KR');
  const [categories, setCategories] = useState(initialCategories);
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0]);

  // 새로고침해도 마지막 탭/국가 유지
  useEffect(() => {
    const t = localStorage.getItem('unjong_tab');
    if (t && TAB_ORDER.includes(t)) setActiveTab(t);
    const c = localStorage.getItem('unjong_country');
    if (c === 'KR' || c === 'US') setCountry(c);
  }, []);
  useEffect(() => { localStorage.setItem('unjong_tab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('unjong_country', country); }, [country]);
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

### ⚠️ 반드시 dev 서버 완전 재시작 (라우트+캐시 갱신 — 이거 안 하면 그대로임)
```bash
lsof -ti:3333 | xargs kill -9 2>/dev/null; cd ~/stock-terminal && npm run dev
```

### 확인
1. **탭 유지**: 뉴스 탭 → 브라우저 새로고침(Cmd+R) → **뉴스 탭 그대로**. 다른 탭도 마찬가지.
2. **이미지**: 뉴스 탭 우측 대표 카드에 이미지.
3. **이미지 진단**(이미지 여전히 없으면): 브라우저에서 `http://localhost:3333/api/news/feed?debug=1` 열어서 나온 JSON을 나(코웍)에게 그대로 붙여줘.
   - `image`에 URL이 있으면 → 스크래핑은 됨(화면 표시 문제) → 내가 표시 방식 손봄.
   - `image`가 전부 `null`이면 → 매체가 막는 것 → 내가 다른 수집 방법으로 전환.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/news/feed/route.ts components/toolbox/NewsFeed.tsx components/toolbox/ToolboxClient.tsx && git commit -m "fix(news): og:image 네이버우선+referrerPolicy, debug 진단모드 / feat: 탭 새로고침 유지 (STEP 336)" && git push
```

---

> **한 줄 요약**: 뉴스 이미지 안정화 + `?debug=1` 진단 추가 + 탭 새로고침 유지(localStorage). 이미지 또 없으면 debug JSON 붙여주면 원인 확정.
