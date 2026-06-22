<!-- 2026-06-21 -->
# STEP 335 — [개선] 뉴스 대표 기사 이미지 안정화 (og:image 재시도 + 대표 선택)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_335_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
대표(첫) 기사 이미지가 자주 안 뜨는 문제 해결:
1. **브라우저 헤더 위장** + 셀렉터 확장(og:image / twitter:image / image_src) + 상대경로 절대화.
2. 원문 매체가 막으면 **네이버 뉴스 링크로 재시도**.
3. **상위 6개 중 이미지가 있는 첫 기사를 대표로** 올림 (맨 앞이 못 잡아도 시각 카드 보장).

> 변경 1파일: `app/api/news/feed/route.ts` **전체 교체**. 컴포넌트(NewsFeed)는 그대로 — 대표(items[0])만 이미지 표시.

---

## 📄 `app/api/news/feed/route.ts` — 아래 내용으로 **전체 교체**

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

export async function GET() {
  const id = (process.env.NAVER_CLIENT_ID || "").trim();
  const secret = (process.env.NAVER_CLIENT_SECRET || "").trim();
  if (!id || !secret) return NextResponse.json({ items: [], error: "no_key" });

  if (cache && Date.now() - cache.at < 15 * 60 * 1000) {
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

    // 상위 6개 og:image 병렬 수집 (원문 실패 시 네이버 링크로 재시도)
    const TOP = Math.min(6, parsed.length);
    await Promise.all(
      parsed.slice(0, TOP).map(async (it) => {
        let img = await ogImage(it.link);
        if (!img && it.naver && it.naver !== it.link) img = await ogImage(it.naver);
        it.image = img;
      })
    );

    // 대표 = 이미지 있는 첫 기사 (없으면 맨 앞). 그 기사를 맨 앞으로 올림.
    let fi = parsed.findIndex((it) => it.image);
    if (fi < 0) fi = 0;
    const ordered = [parsed[fi], ...parsed.filter((_, i) => i !== fi)];

    const items: NewsItem[] = ordered.map((it) => ({
      title: it.title,
      link: it.link,
      source: it.source,
      pubDate: it.pubDate,
      image: it.image,
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

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러.

개발 서버 (**반드시 dev 서버 재시작** — 라우트+캐시 갱신):
1. **뉴스 탭** → 우측 최신 뉴스 **대표 카드에 이미지** 표시.
2. 첫 요청은 이미지 6개 수집하느라 ~5초, 이후 15분 캐시되어 빠름.
3. 콘솔: `fetch('/api/news/feed').then(r=>r.json()).then(j=>console.log(j.items[0].image))` → 이미지 URL(또는 일부 매체는 null이면 다음 기사가 대표로 올라옴).

> 모든 매체가 막는 극단적 경우만 텍스트 대표로 떨어져(정상 폴백).

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/news/feed/route.ts && git commit -m "fix(news): 대표 기사 og:image 안정화(헤더 위장+네이버 폴백) + 이미지 있는 기사 대표 선택 (STEP 335)" && git push
```

---

> **한 줄 요약**: 대표 뉴스 이미지가 안 뜨던 문제 → 헤더 위장·네이버 폴백·상위 6개 중 이미지 있는 기사를 대표로 올려 시각 카드 보장.
