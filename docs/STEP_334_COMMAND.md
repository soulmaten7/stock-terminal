<!-- 2026-06-20 -->
# STEP 334 — [신규] 뉴스 파일럿: 최신 뉴스 피드(네이버 API) + 뉴스 탭 우측 패널

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_334_COMMAND.md 파일 내용대로 실행해줘
```

- **선행 필수**: `.env.local`에 `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` 넣고 dev 서버 재시작. (없으면 피드가 `no_key`로 비어 나옴)

---

## 🎯 목표
뉴스 탭을 **좌:큐레이션 링크 / 우:최신 뉴스 피드**로. 우측 = 네이버 뉴스 API로 최신 20개 합쳐서, **상단 대표 기사 1건은 이미지(og:image) 첨부**.

> 신규 2파일(API·컴포넌트) + `ToolboxClient.tsx` 2곳. 피드 안 되는 카테고리는 그대로(우측칸 없음).

---

## 📄 파일 1 (신규) — `app/api/news/feed/route.ts`

```ts
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NewsItem = { title: string; link: string; source: string; pubDate: string; image?: string | null };

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

async function ogImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const og = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content");
    return og || null;
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
    const items: NewsItem[] = ((j.items ?? []) as Record<string, string>[])
      .map((it) => {
        const link = it.originallink || it.link || "";
        return { title: stripHtml(it.title || ""), link, source: hostOf(link), pubDate: it.pubDate || "" };
      })
      .filter((x) => x.title && x.link);

    // 대표(첫) 기사만 og:image 첨부
    if (items[0]) items[0].image = await ogImage(items[0].link);

    const data = { items };
    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
```

---

## 📄 파일 2 (신규) — `components/toolbox/NewsFeed.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

type NewsItem = { title: string; link: string; source: string; pubDate: string; image?: string | null };

function timeAgo(pub: string): string {
  const t = new Date(pub).getTime();
  if (!t) return '';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/news/feed')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.items ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">최신 뉴스 불러오는 중…</p>;
  if (items.length === 0) return <p className="py-10 text-center text-sm text-unjong-muted">뉴스를 불러오지 못했습니다.</p>;

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">최신 뉴스</p>

      {/* 대표 기사 */}
      <a href={featured.link} target="_blank" rel="noopener noreferrer nofollow" className="group mb-3 block overflow-hidden rounded-xl border border-unjong-border">
        {featured.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={featured.image} alt="" className="h-36 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : null}
        <div className="p-3">
          <p className="line-clamp-2 text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{featured.title}</p>
          <p className="mt-1 text-xs text-unjong-muted">{featured.source} · {timeAgo(featured.pubDate)}</p>
        </div>
      </a>

      {/* 나머지 */}
      <ul>
        {rest.map((n, i) => (
          <li key={i}>
            <a href={n.link} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 border-b border-unjong-border py-2 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-unjong-primary group-hover:text-unjong-accent">{n.title}</p>
                <p className="mt-0.5 text-xs text-unjong-muted">{n.source} · {timeAgo(n.pubDate)}</p>
              </div>
              <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">출처: 네이버 뉴스 검색. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.</p>
    </div>
  );
}
```

---

## 📄 파일 3 (수정 2곳) — `components/toolbox/ToolboxClient.tsx`

### 1 — import 추가
**찾기:**
```tsx
import MarketBoard from './MarketBoard';
```
**바꾸기:**
```tsx
import MarketBoard from './MarketBoard';
import NewsFeed from './NewsFeed';
```

### 2 — 링크 카테고리: 좌(링크) / 우(뉴스만 피드)
**찾기:**
```tsx
        ) : (
          <section className="min-w-0">
            <div>
              {catLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  isLoggedIn={isLoggedIn}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </section>
        )}
```
**바꾸기:**
```tsx
        ) : (
          <div className="flex gap-4">
            <div className="min-w-0 flex-1">
              {catLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  isLoggedIn={isLoggedIn}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
            {activeTab === 'news' && country === 'KR' ? (
              <aside className="hidden w-96 shrink-0 lg:block">
                <NewsFeed />
              </aside>
            ) : null}
          </div>
        )}
```

---

## ✅ 검증
```bash
npm run build
```
- 빌드 무에러.

개발 서버 (`.env.local`에 네이버 키 + 재시작 후):
1. **뉴스 탭** → 좌측 큐레이션 링크, **우측에 최신 뉴스 패널**(상단 대표 기사 이미지 + 최신 20개).
2. 콘솔 검증: `fetch('/api/news/feed').then(r=>r.json()).then(j=>console.log(j.items?.length, j.error))` → 20, undefined.
3. 다른 링크 카테고리(차트·리포트 등)는 우측칸 없이 그대로.

> 키가 없으면 `no_key`로 "뉴스를 불러오지 못했습니다"가 떠 — `.env.local` 확인 + 재시작.
> 대표 기사 이미지가 안 뜨는 매체도 있어(봇 차단) — 그땐 텍스트 카드로 표시(정상).

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/news/feed/route.ts components/toolbox/NewsFeed.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(news): 뉴스 탭 우측 최신 뉴스 피드(네이버 API) + 대표 기사 og:image (STEP 334)" && git push
```

---

> **한 줄 요약**: 뉴스 탭에 좌=큐레이션 링크 / 우=네이버 API 최신 뉴스 20개(대표 1건 이미지). 피드 파일럿 1탄.
