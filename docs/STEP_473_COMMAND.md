<!-- 2026-07-01 -->
# STEP 473 — US 탭 피드 파리티 (뉴스 대표이미지 + 모아보기 4탭 신설)

## ▶ 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 Claude Code에 붙여넣기:
```
@docs/STEP_473_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
US(미국) 탭을 KR 탭과 동등한 피드 수준으로:
1. **US 최신뉴스 대표기사 이미지** — 현재 US(Yahoo)는 이미지 없음(`image:null` 고정). KR처럼 상위 3건 `og:image` 스크래핑 → 대표기사 썸네일 표시. **기존 `ogImage()` 헬퍼 재사용.**
2. **모아보기(우측 라이브 피드) 4탭 신설** — 기업·재무·리포트·ETF·공모주는 현재 US에서 링크만 나옴. US용 **Google News RSS 토픽 피드**(키리스)로 탭별 차별화:
   - 기업·재무 = 실적/기업 뉴스 · 리포트 = 애널리스트 등급/목표가 · ETF = ETF/펀드 · 공모주 = IPO.
3. 모든 외부 fetch는 실패해도 **빈 피드로 graceful fallback**(링크 컬럼은 그대로 → 절대 안 깨짐).

## 📌 전제 상태
- 코드 HEAD `b741ead`(STEP 472). 워킹트리에 문서 커밋만 위에 있음(코드 미변경).
- 변경 파일 3개: `app/api/news/feed/route.ts` · `components/toolbox/NewsFeed.tsx` · `components/toolbox/ToolboxClient.tsx`.
- ⚠️ **`route.ts`(API 라우트) 변경 → Turbopack 자동갱신 안 됨 → 반드시 클린 재시작**(맨 아래).

---

## 1) `app/api/news/feed/route.ts`

### 1-A. `usNews()` 함수 **바로 아래**(현재 84번째 줄 `}` 다음)에 `googleNewsUS` 함수 추가

```ts

// US 토픽 피드: Google News RSS(키리스, 영문 토픽 검색). <item>의 title/link/pubDate/<source> 추출.
async function googleNewsUS(query: string): Promise<NewsItem[]> {
  const url =
    "https://news.google.com/rss/search?q=" +
    encodeURIComponent(query) +
    "&hl=en-US&gl=US&ceid=US:en";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("gnews_" + res.status);
  const xml = await res.text();

  const items: NewsItem[] = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/g) ?? [];
  for (const b of blocks) {
    let title = unCdata((b.match(/<title>([\s\S]*?)<\/title>/) ?? ["", ""])[1]);
    const link = ((b.match(/<link>([\s\S]*?)<\/link>/) ?? ["", ""])[1]).trim();
    const pubDate = ((b.match(/<pubDate>([\s\S]*?)<\/pubDate>/) ?? ["", ""])[1]).trim();
    const sm = b.match(/<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/);
    const srcName = sm ? unCdata(sm[2]) : "";
    const srcUrl = sm ? sm[1] : "";
    // Google News 제목 끝의 " - 언론사" 접미어 제거
    if (srcName && title.endsWith(" - " + srcName)) {
      title = title.slice(0, -(" - " + srcName).length).trim();
    }
    const source = hostOf(srcUrl) || srcName;
    if (!title || !link) continue;
    items.push({ title, link, source, pubDate, image: null });
  }
  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return items.slice(0, 20);
}
```

### 1-B. `GET`의 US 분기(현재 89~103번째 줄) 통째로 교체

**찾을 것 (현재 코드):**
```ts
  // ── US 분기(Yahoo ^GSPC RSS, 키리스) ──
  if (market === "US") {
    const hit = cache.get("US");
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) {
      return NextResponse.json(hit.data);
    }
    try {
      const items = await usNews();
      const data = { items };
      cache.set("US", { at: Date.now(), data });
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ items: [], error: String(e) });
    }
  }
```

**바꿀 것 (새 코드):**
```ts
  // ── US 분기 ──
  if (market === "US") {
    const q = (new URL(req.url).searchParams.get("q") || "").trim();

    // US 토픽 피드(기업·재무·리포트·ETF·공모주) — Google News RSS(키리스)
    if (q) {
      const key = "US:" + q;
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < 15 * 60 * 1000) return NextResponse.json(hit.data);
      try {
        const items = await googleNewsUS(q);
        const data = { items };
        cache.set(key, { at: Date.now(), data });
        return NextResponse.json(data);
      } catch (e) {
        return NextResponse.json({ items: [], error: String(e) });
      }
    }

    // US 메인 뉴스 — Yahoo ^GSPC RSS(키리스) + 대표기사 og:image(상위 3건)
    const hit = cache.get("US");
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);
    try {
      const parsed = await usNews();
      const TOP = Math.min(3, parsed.length);
      await Promise.all(
        parsed.slice(0, TOP).map(async (it) => {
          const img = await ogImage(it.link);
          if (img) it.image = img;
        })
      );
      let fi = parsed.findIndex((it) => it.image);
      if (fi < 0) fi = 0;
      const items = [parsed[fi], ...parsed.filter((_, i) => i !== fi)];
      const data = { items };
      cache.set("US", { at: Date.now(), data });
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ items: [], error: String(e) });
    }
  }
```

---

## 2) `components/toolbox/NewsFeed.tsx`

### 2-A. url + cacheKey (현재 23~24번째 줄)

**찾을 것:**
```ts
  const url = isUs ? '/api/news/feed?market=US' : '/api/news/feed' + (query ? '?q=' + encodeURIComponent(query) : '');
  const cacheKey = isUs ? 'news:us' : 'news:' + (query ?? '');
```
**바꿀 것:**
```ts
  const url = isUs
    ? '/api/news/feed?market=US' + (query ? '&q=' + encodeURIComponent(query) : '')
    : '/api/news/feed' + (query ? '?q=' + encodeURIComponent(query) : '');
  const cacheKey = isUs ? 'news:us:' + (query ?? '') : 'news:' + (query ?? '');
```

### 2-B. 출처 푸터 (현재 80번째 줄, `출처: Yahoo Finance...` 한 줄)

**찾을 것:**
```tsx
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{isUs ? '출처: Yahoo Finance (S&P 500). 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.' : '출처: 네이버 뉴스 검색. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.'}</p>
```
**바꿀 것:**
```tsx
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{isUs ? (query ? '출처: Google News. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.' : '출처: Yahoo Finance (S&P 500). 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.') : '출처: 네이버 뉴스 검색. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.'}</p>
```

---

## 3) `components/toolbox/ToolboxClient.tsx`

### 3-A. `FEED_COUNTRY_SUPPORT` (현재 42~45번째 줄) — 4탭에 'US' 추가

**찾을 것:**
```ts
const FEED_COUNTRY_SUPPORT: Record<string, ('KR' | 'US')[]> = {
  news: ['KR', 'US'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR'], research: ['KR'], etf: ['KR'], ipo: ['KR'],
};
```
**바꿀 것:**
```ts
const FEED_COUNTRY_SUPPORT: Record<string, ('KR' | 'US')[]> = {
  news: ['KR', 'US'], disclosure: ['KR', 'US'], macro: ['KR', 'US'],
  analysis: ['KR', 'US'], research: ['KR', 'US'], etf: ['KR', 'US'], ipo: ['KR', 'US'],
};
```

### 3-B. `feedFor`의 4개 case (현재 53~56번째 줄) — 국가별 분기

**찾을 것:**
```tsx
    case 'analysis': return <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
    case 'research': return <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
    case 'etf': return <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
    case 'ipo': return <OfferingsFeed />;
```
**바꿀 것:**
```tsx
    case 'analysis': return country === 'US'
      ? <NewsFeed country="US" query="US stock company earnings results" title="미국 실적·기업 뉴스" />
      : <NewsFeed query="실적 영업이익 잠정" title="실적·재무 뉴스" />;
    case 'research': return country === 'US'
      ? <NewsFeed country="US" query="stock analyst rating price target upgrade downgrade" title="미국 애널리스트·리포트 뉴스" />
      : <NewsFeed query="증권사 리포트 목표주가" title="리포트·목표주가 뉴스" />;
    case 'etf': return country === 'US'
      ? <NewsFeed country="US" query="ETF fund inflows stock market" title="미국 ETF·펀드 뉴스" />
      : <NewsFeed query="ETF 상장 순자산총액" title="ETF·펀드 뉴스" />;
    case 'ipo': return country === 'US'
      ? <NewsFeed country="US" query="IPO stock market debut listing" title="미국 IPO·공모 뉴스" />
      : <OfferingsFeed />;
```

---

## 4) 빌드 검증 + 클린 재시작 (⚠️ 필수)
```bash
npm run build
```
빌드 성공하면 dev 클린 재시작(라우트 변경 반영):
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 5) 라이브 검증 (localhost:3333)
브라우저에서 `http://localhost:3333` → 🇺🇸 미국 토글 후:
- [ ] **뉴스** 탭: 대표기사에 이미지 뜨는지(썸네일). 안 뜨면 image 스크래핑 실패지만 안 깨짐(텍스트만).
- [ ] **기업·재무 / 리포트 / ETF·펀드 / 공모주·배당** 탭: 우측(모바일은 [모아보기] 서브탭)에 각각 다른 US 뉴스 피드 뜨는지.
- [ ] 각 탭 좌측 링크 컬럼은 그대로.

## 6) 커밋 (배포는 사용자 판단)
```bash
git add app/api/news/feed/route.ts components/toolbox/NewsFeed.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat: US 탭 피드 파리티 — 뉴스 대표이미지(og:image) + 모아보기 4탭 신설(Google News 토픽·기업재무/리포트/ETF/공모주) (STEP 473)"
```
> **배포(onetrillion.app 반영)는 코드 변경이라 push 필요.** 로컬 검증 OK면 `git push`(Vercel 자동 배포). Cowork에게 "배포해"라고 하면 문서 갱신까지 정리해 드립니다.

## ⚠️ 리스크 노트
- Google News RSS는 **Vercel 서버 IP에서 간혹 동의 페이지 반환** 가능성 있음 → 그 경우 해당 탭은 빈 피드(링크는 정상). 로컬 OK인데 prod에서 US 모아보기가 비면 이 케이스이니 Cowork에게 알려주세요(대체 소스로 전환).
- Yahoo 기사 `og:image` 스크래핑도 서버에서 차단되면 이미지만 생략(안 깨짐).
