# STEP 85 — 데이터 품질 수정 (4개 P0 버그)

**작성일**: 2026-04-23
**실행 명령어**:
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표**: 홈 대시보드의 4개 데이터 품질 버그 수정 — 섹터 히트맵 KR 비어있음 / 급등락 하락 비어있음 / Screener 레버리지 ETF 섞임 / 뉴스 카테고리 무관.

**전제 상태**: 이전 커밋 `3b3c0e7` (FloatingChat 왼쪽 기본값). 빌드 에러 없음.

**중요**: 각 Work Block 끝나면 빌드 통과 확인 후 다음으로. 중간에 실패하면 그 시점에서 멈추고 사용자에게 보고.

---

## Work Block 1 — 섹터 히트맵 KR 폴백 로직 추가

**문제**: `/api/home/sectors?market=KR` 응답이 비어있어 대시보드에 "데이터 없음" 표시됨.

**원인 추정**:
- `stock_snapshot_v` 뷰에서 `country='KR'` + `sector IS NOT NULL` + `return_3m IS NOT NULL` 조합 행이 0건일 가능성
- 또는 sector 필드가 'Technology' 같은 영문이라 한국어 라벨이 안 붙어있을 가능성

**수정 방향**: US SPDR처럼 **KRX 섹터 ETF 폴백** 도입. Supabase 결과가 비어있으면 Yahoo Finance로 KRX ETF 당일 등락 조회.

### 수정할 파일: `app/api/home/sectors/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import yahooFinance from 'yahoo-finance2';

// US sector ETFs (SPDR)
const US_SECTOR_ETFS = [
  { symbol: 'XLK',  name: '기술' },
  { symbol: 'XLV',  name: '헬스케어' },
  { symbol: 'XLF',  name: '금융' },
  { symbol: 'XLY',  name: '소비재(임의)' },
  { symbol: 'XLP',  name: '소비재(필수)' },
  { symbol: 'XLE',  name: '에너지' },
  { symbol: 'XLI',  name: '산업재' },
  { symbol: 'XLB',  name: '소재' },
  { symbol: 'XLRE', name: '리츠' },
  { symbol: 'XLU',  name: '유틸리티' },
  { symbol: 'XLC',  name: '통신' },
];

// KRX sector ETFs (KODEX / TIGER 대표)
const KR_SECTOR_ETFS = [
  { symbol: '091160.KS', name: '반도체' },        // KODEX 반도체
  { symbol: '305720.KS', name: '2차전지' },       // KODEX 2차전지산업
  { symbol: '091170.KS', name: '은행' },          // KODEX 은행
  { symbol: '227550.KS', name: '자동차' },        // TIGER 200 자동차
  { symbol: '139220.KS', name: '건설' },          // TIGER 200 건설
  { symbol: '102780.KS', name: '철강' },          // KODEX 철강
  { symbol: '266370.KS', name: '바이오' },        // KODEX 바이오
  { symbol: '139250.KS', name: '소비재' },        // TIGER 200 생활소비재
  { symbol: '157490.KS', name: '게임' },          // TIGER 코스닥150레버리지 대체: 게임 없으면 제거
  { symbol: '228800.KS', name: '조선' },          // KODEX 조선
  { symbol: '261220.KS', name: '미디어' },        // KODEX 미디어&엔터테인먼트
];

interface SectorRow { sector: string; change: number; count: number; }

let _krCache: { data: SectorRow[]; at: number } | null = null;
let _usCache: { data: SectorRow[]; at: number } | null = null;
const TTL = 5 * 60 * 1000;

async function getKrSectorsFromDB(): Promise<SectorRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('stock_snapshot_v')
    .select('sector, return_3m')
    .eq('is_active', true)
    .eq('country', 'KR')
    .not('sector', 'is', null)
    .not('return_3m', 'is', null);

  const map = new Map<string, number[]>();
  for (const row of data ?? []) {
    const s = row.sector as string;
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(row.return_3m as number);
  }

  const result: SectorRow[] = [];
  map.forEach((vals, sector) => {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    result.push({ sector, change: Number(avg.toFixed(2)), count: vals.length });
  });
  result.sort((a, b) => b.change - a.change);
  return result;
}

async function getKrSectorsFromETF(): Promise<SectorRow[]> {
  const symbols = KR_SECTOR_ETFS.map((e) => e.symbol);
  const quotes = await yahooFinance.quote(symbols);
  const quoteArr = (Array.isArray(quotes) ? quotes : [quotes]) as Array<Record<string, unknown>>;
  return quoteArr.map((q, i) => ({
    sector: KR_SECTOR_ETFS[i]?.name ?? String(q.symbol ?? ''),
    change: Number((Number(q.regularMarketChangePercent ?? 0)).toFixed(2)),
    count: 1,
  })).sort((a, b) => b.change - a.change);
}

async function getKrSectors(): Promise<SectorRow[]> {
  if (_krCache && Date.now() - _krCache.at < TTL) return _krCache.data;

  // 1차: DB 조회
  let result = await getKrSectorsFromDB();

  // 폴백: DB 비어있으면 ETF 기반
  if (result.length === 0) {
    console.log('[sectors] KR DB empty, falling back to ETF quotes');
    try {
      result = await getKrSectorsFromETF();
    } catch (e) {
      console.error('[sectors] KR ETF fallback failed:', e);
    }
  }

  _krCache = { data: result, at: Date.now() };
  return result;
}

async function getUsSectors(): Promise<SectorRow[]> {
  if (_usCache && Date.now() - _usCache.at < TTL) return _usCache.data;

  const symbols = US_SECTOR_ETFS.map((e) => e.symbol);
  const quotes = await yahooFinance.quote(symbols);
  const quoteArr = (Array.isArray(quotes) ? quotes : [quotes]) as Array<Record<string, unknown>>;

  const data: SectorRow[] = quoteArr.map((q, i) => ({
    sector: US_SECTOR_ETFS[i]?.name ?? String(q.symbol ?? ''),
    change: Number((Number(q.regularMarketChangePercent ?? 0)).toFixed(2)),
    count: 1,
  })).sort((a, b) => b.change - a.change);

  _usCache = { data, at: Date.now() };
  return data;
}

export async function GET(req: Request) {
  const market = new URL(req.url).searchParams.get('market') ?? 'KR';
  try {
    const data = market === 'US' ? await getUsSectors() : await getKrSectors();
    return NextResponse.json({ sectors: data, market });
  } catch (e) {
    console.error('[api/home/sectors] fatal:', e);
    return NextResponse.json({ sectors: [], market, error: String(e) }, { status: 500 });
  }
}
```

### 하단 레이블도 업데이트 (ETF 폴백 시 기준 명확히)

파일: `components/widgets/SectorHeatmapWidget.tsx` — 89~91번째 줄:
```tsx
<p className="mt-2 px-3 text-[10px] text-[#AAA]">
  {market === 'KR' ? 'KRX 섹터 ETF 당일 등락' : 'SPDR 섹터 ETF 당일 등락'}
</p>
```

**변경 이유**: DB 폴백 시 "3개월 수익률"이 맞지만, 현실적으로 DB가 안 채워져 ETF 폴백으로 돌아가므로 ETF 기준 문구로 통일.

### 검증
```bash
npm run build 2>&1 | tail -20
```
빌드 성공 확인 후 다음 블록으로.

---

## Work Block 2 — 급등락 하락 로그 + 파라미터 검증

**문제**: `MoversPairWidget` 우측 "하락" 칼럼이 비어있음.

**원인 추정**:
- KIS API `/api/kis/movers?dir=down` 응답이 `{ items: [] }`
- `FID_RANK_SORT_CLS_CODE: '1'` (내림차순) 파라미터 처리 이슈 가능성

### 수정할 파일: `app/api/kis/movers/route.ts`

전체 파일 교체:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';

// 국내주식 등락률 순위 (KIS tr_id: FHPST01700000)
// ?dir=up|down (default: up)
// ?market=all|kospi|kosdaq (default: all)
// ?limit=10|30 (default: 10)
export async function GET(request: NextRequest) {
  const dirParam = request.nextUrl.searchParams.get('dir') ?? 'up';
  const isDown = dirParam === 'down';
  const market = request.nextUrl.searchParams.get('market') || 'all';
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '10', 10) || 10,
    30
  );

  // 0000=전체, 0001=코스피, 1001=코스닥
  const iscd =
    market === 'kospi' ? '0001' : market === 'kosdaq' ? '1001' : '0000';

  // KIS: '0'=상승률 순, '1'=하락률 순
  const sortCode = isDown ? '1' : '0';

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/ranking/fluctuation',
      trId: 'FHPST01700000',
      params: {
        FID_RSFL_RATE2: '',
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_COND_SCR_DIV_CODE: '20170',
        FID_INPUT_ISCD: iscd,
        FID_RANK_SORT_CLS_CODE: sortCode,
        FID_INPUT_CNT_1: '0',
        FID_PRC_CLS_CODE: '0',
        FID_INPUT_PRICE_1: '',
        FID_INPUT_PRICE_2: '',
        FID_VOL_CNT: '',
        FID_TRGT_CLS_CODE: '0',
        FID_TRGT_EXLS_CLS_CODE: '0',
        FID_DIV_CLS_CODE: '0',
        FID_RSFL_RATE1: '',
      },
    });

    const raw = data.output || [];
    // 하락 요청인데 등락률이 모두 0 이상이면 서버 응답 이상 — 로그 남김
    if (isDown && raw.length > 0) {
      const firstPct = parseFloat(raw[0]?.prdy_ctrt ?? '0');
      if (firstPct >= 0) {
        console.warn('[kis/movers] DOWN request returned non-negative first item:', firstPct, '— check sortCode');
      }
    }

    const items = raw.slice(0, limit).map((item: Record<string, string>, idx: number) => ({
      rank: idx + 1,
      symbol: item.stck_shrn_iscd || item.mksc_shrn_iscd || '',
      name: item.hts_kor_isnm || '',
      price: parseInt(item.stck_prpr || '0', 10),
      priceText: parseInt(item.stck_prpr || '0', 10).toLocaleString('ko-KR'),
      prdyVrss: parseInt(item.prdy_vrss || '0', 10),
      changePercent: parseFloat(item.prdy_ctrt || '0'),
      volume: parseInt(item.acml_vol || '0', 10),
    }));

    if (items.length === 0) {
      console.warn(`[kis/movers] EMPTY result — dir=${dirParam} sortCode=${sortCode} iscd=${iscd}`);
    }

    return NextResponse.json({ items, dir: dirParam, sortCode });
  } catch (err) {
    console.error('[api/kis/movers]', err);
    return NextResponse.json({ items: [], error: String(err) }, { status: 502 });
  }
}
```

### 런타임 디버그 방법 (사용자에게 안내)
`npm run dev` 실행 후 브라우저에서 홈 열고 터미널의 로그 확인:
- `[kis/movers] EMPTY result — dir=down ...` 가 뜨면 → KIS API 자체 이슈 (토큰 만료, 시장 폐장 시각 등)
- `[kis/movers] DOWN request returned non-negative...` 가 뜨면 → sortCode가 안 먹음 → KIS 파라미터 재조사 필요

### 검증
```bash
npm run build 2>&1 | tail -20
```

---

## Work Block 3 — Screener 레버리지/인버스 ETF 필터

**문제**: Screener에 "KODEX 레버리지", "TIGER 인버스", "2X" ETF가 일반 종목과 섞여 나옴.

**해결**: `/api/stocks/screener`에서 종목명 기반으로 레버리지/인버스/ETF 제외.

### 수정할 파일: `app/api/stocks/screener/route.ts`

66~67번 줄 사이 (`.in('market', markets)` 직후)에 다음 필터 추가:

```typescript
  // 레버리지/인버스/ETF/ETN 제외 (이름 기반 블랙리스트)
  const EXCLUDE_PATTERNS = [
    '레버리지', '인버스', '곱버스',
    'KODEX', 'TIGER', 'HANARO', 'ARIRANG',  // 대표 ETF 브랜드
    'ETN', 'ETF',
    ' X', '2X', '3X',  // 배수 ETF
    'KBSTAR', 'KINDEX', 'KOSEF',
  ];
  // Supabase에서 not('name_ko','ilike','%레버리지%').not('name_ko','ilike','%인버스%') 체인은
  // URL 길이 이슈 있을 수 있어 and/or 쿼리로 한 번에
  const notLike = EXCLUDE_PATTERNS
    .map((p) => `name_ko.not.ilike.%${p}%`)
    .join(',');
  query = query.or(notLike);
```

**주의**: 위 `.or()` 로직이 원하는 동작(모두 not-like AND)이 아닌 OR가 될 수 있음. Supabase `.or()`는 OR 조합이므로 **각 패턴을 개별 `.not.ilike()`로 체인**해야 정확함:

```typescript
  // 레버리지/인버스/ETF/ETN 제외
  const EXCLUDE_PATTERNS = [
    '레버리지', '인버스', '곱버스',
    'KODEX', 'TIGER', 'HANARO', 'ARIRANG',
    'ETN', 'ETF',
    'KBSTAR', 'KINDEX', 'KOSEF',
  ];
  for (const p of EXCLUDE_PATTERNS) {
    query = query.not('name_ko', 'ilike', `%${p}%`);
  }
```

위 버전(두 번째)으로 적용. 삽입 위치는 `.in('market', markets)` 다음 줄.

### 검증
```bash
npm run build 2>&1 | tail -20
```

빌드 후 `curl 'http://localhost:3000/api/stocks/screener?minCap=10000000000000&limit=10&orderBy=market_cap&order=desc'`로 "우량주" 응답 확인. 결과 `stocks[].name_ko`에 "KODEX"나 "레버리지"가 없어야 함.

---

## Work Block 4 — 뉴스 카테고리 필터 (주식 관련만)

**문제**: `/api/home/news`가 일반 경제 뉴스를 섞어서 반환 — 부동산, 유가, 환율 등 종목과 무관한 기사 다수.

**해결**: 제목 기반 키워드 **allowlist + denylist** 적용.

### 수정할 파일: `app/api/home/news/route.ts`

전체 파일 교체:

```typescript
import { NextResponse } from 'next/server';

const FEEDS = [
  { source: '한국경제', url: 'https://www.hankyung.com/feed/finance' },
  { source: '매일경제', url: 'https://www.mk.co.kr/rss/30000001/' },
  { source: '이데일리', url: 'https://www.edaily.co.kr/rss/rss-newsflash.asp' },
];

// 주식/기업 관련 키워드 포함된 기사만 통과
const ALLOW_KEYWORDS = [
  '종목', '주가', '주식', '코스피', '코스닥', 'KOSPI', 'KOSDAQ',
  '상장', '공시', '실적', '영업이익', '매출',
  '증권', '투자', '펀드', 'ETF',
  '반도체', '2차전지', '바이오', '자동차', '조선',
  '삼성', 'SK', 'LG', '현대', '네이버', '카카오', '셀트리온',
  'AI', '인공지능', '반등', '급등', '급락', '상한가', '하한가',
  '배당', '자사주', '분할', '합병', '인수',
  '외국인', '기관', '순매수', '순매도',
];

// 제외 키워드 (확실히 무관한 분야)
const DENY_KEYWORDS = [
  '부동산', '아파트', '분양', '집값',
  '결혼', '이혼', '사망', '연예',
  '스포츠', '야구', '축구', '농구',
  '맛집', '여행', '레시피',
];

function isRelevant(title: string): boolean {
  const t = title.toLowerCase();
  // 제외 키워드 1개라도 있으면 탈락
  if (DENY_KEYWORDS.some((k) => title.includes(k))) return false;
  // 허용 키워드 1개라도 있으면 통과
  return ALLOW_KEYWORDS.some((k) => title.includes(k) || t.includes(k.toLowerCase()));
}

interface NewsItem {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  timeAgo: string;
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

function extractLink(xml: string): string {
  const withClose = extractTag(xml, 'link');
  if (withClose) return withClose;
  const m = xml.match(/<link>([^<\s]+)/i);
  return m ? m[1].trim() : '';
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

async function fetchFeed(source: string, url: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StockTerminal/1.0; +https://stock-terminal.io)' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
    for (const block of blocks.slice(0, 30)) {  // 필터 후 줄어들 걸 예상해 더 많이 긁음
      const raw = block[1];
      const title = extractTag(raw, 'title');
      if (!title) continue;
      if (!isRelevant(title)) continue;
      const link = extractLink(raw);
      const pubDate = extractTag(raw, 'pubDate');
      items.push({ source, title, link, pubDate, timeAgo: timeAgo(pubDate) });
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET() {
  const results = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f.source, f.url)));

  const all: NewsItem[] = results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 30);

  return NextResponse.json(
    { items: all },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
  );
}
```

### 검증
```bash
npm run build 2>&1 | tail -20
```

빌드 후 `curl http://localhost:3000/api/home/news?limit=10` 응답 확인 — `items[].title`에 주식·기업 관련 기사만 나와야 함.

---

## Work Block 5 — 문서 업데이트 + Git Commit & Push

### 5-1. 날짜 업데이트 (4개 파일)

**파일 1: `CLAUDE.md`** — 첫 줄 헤더의 날짜를 `2026-04-23`으로.

**파일 2: `docs/CHANGELOG.md`** — 첫 줄 날짜를 `2026-04-23`로 하고, 최상단에 새 엔트리 추가:
```markdown
## 2026-04-23 — STEP 85: 데이터 품질 수정

- 섹터 히트맵 KR 폴백 로직 추가 (KRX 섹터 ETF 11개)
- 급등락 하락 KIS API 로그 강화 + sortCode 검증
- Screener 레버리지/인버스/ETF 이름 기반 제외 필터
- 뉴스 API 주식 관련 키워드 allow/deny 필터
```

**파일 3: `session-context.md`** — 첫 줄 날짜 업데이트 + 완료 블록 추가:
```markdown
### 2026-04-23 — STEP 85 완료
- 데이터 품질 4개 버그 수정 (sectors/movers/screener/news)
- 커밋 해시: (commit 후 확인)
```

**파일 4: `docs/NEXT_SESSION_START.md`** — 첫 줄 날짜 + 최신 상태 업데이트 (STEP 85 완료, 다음 STEP 86 예고).

### 5-2. Git commit + push

```bash
cd ~/Desktop/OTMarketing
git add -A
git commit -m "STEP 85: 데이터 품질 수정 (sectors KR 폴백 + movers 로그 + screener ETF 필터 + news 키워드 필터)"
git push
```

### 5-3. 최종 검증
```bash
npm run build 2>&1 | tail -30
```

빌드 성공 + 커밋 해시 출력 확인하면 완료.

---

## 완료 보고 형식

Claude Code가 Cowork에게 알려줄 것:

```
✅ STEP 85 완료
- Block 1: sectors KR 폴백 — ✅
- Block 2: movers 로그 — ✅
- Block 3: screener ETF 필터 — ✅
- Block 4: news 키워드 필터 — ✅
- Block 5: 문서 + push — ✅ (커밋 해시: xxxxxxx)
- 빌드 상태: 성공 / 실패
- 주의사항: (있으면)
```
