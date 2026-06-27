<!-- 2026-06-26 -->
# STEP 414 — US 뉴스 피드 (Yahoo ^GSPC RSS)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_414_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
툴박스 **뉴스 탭**을 US에 개방한다. KR은 네이버 검색 API를 쓰고, US는 **키 없이(keyless) 검증된 소스**인 **Yahoo `^GSPC`(S&P 500) RSS**를 사용한다.
- RSS URL: `https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC&region=US&lang=en-US`
- 검증 완료: HTTP 200, `<item>` 20개, 실시간 미국 증시 헤드라인(예: "Dow Jones Futures Fall, Techs Tumble"), 각 `<item>`에 `<title>`(CDATA)/`<link>`/`<pubDate>` 존재.
- US RSS는 **이미지가 없다** → `image: null`로 매핑하고, `NewsFeed`의 이미지 블록은 이미 조건부(og 폴백)라 깨지지 않게 그대로 둔다.
- KR 뉴스는 **byte 단위 동일** 유지. US만 추가.

## 전제
- 최신 main (HEAD `79fe75a` = STEP 413). 배포 X(배치) — 이 STEP은 **로컬 빌드 + 로컬 커밋만**(push·vercel 없음).
- 변경 파일 3개: `app/api/news/feed/route.ts`, `components/toolbox/NewsFeed.tsx`, `components/toolbox/ToolboxClient.tsx`.
- 확인된 현재 상태(읽기 완료):
  - `app/api/news/feed/route.ts` — 응답 shape는 `{ items: NewsItem[] }`, `NewsItem = { title; link; source; pubDate; image: string|null }`(L7). 캐시는 `const cache = new Map<string, { at; data }>()`(L10), `q`별 키, TTL 15분(L60~63). 헬퍼 `stripHtml`·`hostOf`(L12~20) 재사용.
  - `app/api/ipo/feed/route.ts` — 이미 `cheerio.load`로 마크업 파싱(이 STEP에서는 cheerio 대신 정규식으로 RSS `<item>` 블록 파싱; 같은 "외부 마크업 파싱" 스타일·UA 헤더·`AbortSignal.timeout`·graceful 폴백을 미러).
  - `app/api/yahoo/indices/route.ts` — Yahoo 호출 시 브라우저 UA 패턴 참고.
  - `components/toolbox/NewsFeed.tsx` — props `{ query?, title? }`(L20), `cacheKey = 'news:' + (query ?? '')`(L21), fetch `/api/news/feed' + (query ? '?q=' + ... : '')`(L27), 이미지 블록 `{featured.image ? <img.../> : null}`(L52~55) → **이미 조건부**.
  - `components/toolbox/ToolboxClient.tsx`(post-STEP-413) — `FEED_COUNTRY_SUPPORT`(L33~36)에 `news: ['KR']`, `feedFor(tab, country)`(L39~50) `news` 케이스는 `<NewsFeed />`.

---

## 1단계 — `app/api/news/feed/route.ts` (US 분기 추가)

> 핵심: `market`(또는 `country`) 쿼리가 `'US'`면 Yahoo `^GSPC` RSS를 정규식으로 파싱해 **KR과 동일한 item shape**로 반환. KR 분기(네이버)는 손대지 않는다.

### (A) `GET` 진입부 — US 분기 추가 (네이버 키 체크 **앞**에 삽입)
찾기:
```ts
export async function GET(req: Request) {
  const id = (process.env.NAVER_CLIENT_ID || "").trim();
  const secret = (process.env.NAVER_CLIENT_SECRET || "").trim();
  if (!id || !secret) return NextResponse.json({ items: [], error: "no_key" });

  const q = (new URL(req.url).searchParams.get("q") || "증시").trim();
```
바꾸기:
```ts
const US_RSS = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC&region=US&lang=en-US";

function unCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return (m ? m[1] : s)
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'")
    .trim();
}

// US: Yahoo ^GSPC RSS(키리스). <item>의 title(CDATA)/link/pubDate를 정규식으로 추출 → KR과 동일 shape.
async function usNews(): Promise<NewsItem[]> {
  const res = await fetch(US_RSS, {
    headers: { "User-Agent": "Mozilla/5.0" }, // RSS는 UA 필요(없으면 차단/빈응답)
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("yahoo_" + res.status);
  const xml = await res.text();

  const items: NewsItem[] = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/g) ?? [];
  for (const b of blocks) {
    const title = unCdata((b.match(/<title>([\s\S]*?)<\/title>/) ?? ["", ""])[1]);
    const link = ((b.match(/<link>([\s\S]*?)<\/link>/) ?? ["", ""])[1]).trim();
    const pubDate = ((b.match(/<pubDate>([\s\S]*?)<\/pubDate>/) ?? ["", ""])[1]).trim();
    if (!title || !link) continue;
    items.push({ title, link, source: hostOf(link), pubDate, image: null });
  }
  // 최신순 정렬 후 상위 20
  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return items.slice(0, 20);
}

export async function GET(req: Request) {
  const market = (new URL(req.url).searchParams.get("market") || new URL(req.url).searchParams.get("country") || "").trim().toUpperCase();

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

  // ── KR 분기(네이버 검색 API) — 기존 그대로 ──
  const id = (process.env.NAVER_CLIENT_ID || "").trim();
  const secret = (process.env.NAVER_CLIENT_SECRET || "").trim();
  if (!id || !secret) return NextResponse.json({ items: [], error: "no_key" });

  const q = (new URL(req.url).searchParams.get("q") || "증시").trim();
```
> 비고: `NewsItem`·`cache`·`hostOf`는 파일 상단(L7·L10·L18)에 이미 선언됨 → US 헬퍼에서 그대로 재사용. KR 분기(L60 이하)는 **단 한 글자도 바뀌지 않음**. US 캐시는 `"US"` 키, 10분 TTL(네이버 `q`별 키와 충돌 없음).

---

## 2단계 — `components/toolbox/NewsFeed.tsx` (`country` prop 추가)

### (A) props에 `country` 추가 + fetch 분기
찾기:
```ts
export default function NewsFeed({ query, title }: { query?: string; title?: string }) {
  const cacheKey = 'news:' + (query ?? '');
  const [items, setItems] = useState<NewsItem[]>(() => getCache<NewsItem[]>(cacheKey) ?? []);
  const [loading, setLoading] = useState(() => getCache(cacheKey) === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/news/feed' + (query ? '?q=' + encodeURIComponent(query) : ''))
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache(cacheKey, list); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query]);
```
바꾸기:
```ts
export default function NewsFeed({ query, title, country = 'KR' }: { query?: string; title?: string; country?: 'KR' | 'US' }) {
  // US는 Yahoo ^GSPC RSS(키리스, query 무시). KR은 네이버 검색(query 사용).
  const isUs = country === 'US';
  const url = isUs ? '/api/news/feed?market=US' : '/api/news/feed' + (query ? '?q=' + encodeURIComponent(query) : '');
  const cacheKey = isUs ? 'news:us' : 'news:' + (query ?? '');
  const [items, setItems] = useState<NewsItem[]>(() => getCache<NewsItem[]>(cacheKey) ?? []);
  const [loading, setLoading] = useState(() => getCache(cacheKey) === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache(cacheKey, list); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);
```
> 비고: 이미지 블록(L52~55 `{featured.image ? ... : null}`)·렌더링은 그대로 둔다 → US item은 `image: null`이라 자동으로 텍스트만 렌더. KR 호출은 `country` 기본값 `'KR'` + `isUs=false`라 URL·cacheKey·deps가 **기존과 동일** → byte-identical 동작.

### (B) 출처 안내문 — US일 때 Yahoo로
찾기:
```ts
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">출처: 네이버 뉴스 검색. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.</p>
```
바꾸기:
```ts
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{isUs ? '출처: Yahoo Finance (S&P 500). 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.' : '출처: 네이버 뉴스 검색. 제목·출처·링크만 제공하며 원문은 각 매체로 연결됩니다.'}</p>
```

---

## 3단계 — `components/toolbox/ToolboxClient.tsx` (news를 US에 개방)

### (A) `FEED_COUNTRY_SUPPORT` — news에 US 추가
찾기:
```ts
const FEED_COUNTRY_SUPPORT: Record<string, ('KR' | 'US')[]> = {
  news: ['KR'], disclosure: ['KR'], macro: ['KR', 'US'],
  analysis: ['KR'], research: ['KR'], etf: ['KR'], ipo: ['KR'],
};
```
바꾸기:
```ts
const FEED_COUNTRY_SUPPORT: Record<string, ('KR' | 'US')[]> = {
  news: ['KR', 'US'], disclosure: ['KR'], macro: ['KR', 'US'],
  analysis: ['KR'], research: ['KR'], etf: ['KR'], ipo: ['KR'],
};
```

### (B) `feedFor` news 케이스 — country 전달
찾기:
```ts
    case 'news': return <NewsFeed />;
```
바꾸기:
```ts
    case 'news': return <NewsFeed country={country} />;
```
> 비고: `feedFor(tab, country)` 시그니처는 STEP 413에서 이미 `country`를 받음 → news 케이스에서 그대로 전달만. KR일 땐 `country='KR'` → NewsFeed 기본 동작과 동일. research/analysis/etf는 이번 STEP에서 KR 전용 유지(스킵/보류 참조).

---

## 4단계 — 빌드 + 로컬 커밋 (푸시·배포 X)
```bash
pkill -f "next dev" 2>/dev/null; npm run build
git add app/api/news/feed/route.ts components/toolbox/NewsFeed.tsx components/toolbox/ToolboxClient.tsx
git commit -m "feat(STEP 414): US 뉴스 피드 — Yahoo ^GSPC RSS(키리스 실시간 증시 헤드라인)"
```

## 확인
- 빌드 통과(타입).
- **US 토글 → 뉴스 탭** 노출 → 우측 피드에 **미국 증시 헤드라인** 목록(제목·출처 호스트·"N분 전" + 링크·날짜) 표시. 이미지 없이도 카드/리스트가 깨지지 않음(텍스트만 렌더).
- 출처 안내문이 US에서 "출처: Yahoo Finance (S&P 500)..."로 바뀜.
- **KR 영향 없음**: KR 토글에서 뉴스(네이버)·실적·리포트·ETF 등 모든 피드가 기존과 100% 동일(URL·cacheKey·deps·이미지 og 폴백 그대로).
- 회귀 체크: US에서 공시·리포트·실적·ETF·공모주 탭은 **여전히 미노출**(KR 전용 유지).

## 스킵/보류
- **리포트·실적·ETF의 US 피드** = 후속/보류. 이들은 KR 네이버 검색 쿼리(`실적 영업이익 잠정` 등) 기반이라 US 동등 소스가 아직 없음 → `FEED_COUNTRY_SUPPORT`에 그대로 `['KR']` 유지.
- **공모주(IPO) US** = 후속/보류(US IPO 데이터소스 미정).
- **공시(disclosure) US** = **STEP 415**에서 **SEC EDGAR**로 별도 개방 예정.
- US 뉴스는 `^GSPC`(S&P 500) 단일 심볼 헤드라인 → 광범위 증시 뉴스. 향후 다심볼/섹션 확장은 별도 STEP.

## 가정/리스크
- Yahoo RSS가 **UA 없이는 차단**될 수 있어 `User-Agent: Mozilla/5.0` 헤더 필수(검증 시 확인). 8초 타임아웃 + 에러 시 `{ items: [] }` graceful 폴백.
- RSS 마크업이 바뀌면 정규식이 빈 배열을 낼 수 있음 → 그 경우 KR과 동일하게 "뉴스를 불러오지 못했습니다." 표시(앱은 깨지지 않음). 10분 캐시라 일시 장애 시 재시도 폭주 없음.
- `<link>`가 CDATA가 아닌 평문 URL이라는 검증 결과에 의존(평문 추출). 만약 일부 item이 상대경로/리다이렉트면 그대로 외부 링크로 연결(KR과 동일하게 원문 매체로 이동).
