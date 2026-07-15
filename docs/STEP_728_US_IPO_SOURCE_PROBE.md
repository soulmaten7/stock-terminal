<!-- 2026-07-15 -->
# STEP 728 — US IPO 구조화 피드 데이터 소스 프로브 (Nasdaq 공개 API 검증)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(탐색·프로브. 소스 도달성/구조만 확인. `/clear` 후.)

**목표(P2 · US 시장 뎁스):** 현재 US IPO 탭은 **"IPO" 키워드 뉴스검색**뿐(`ToolboxClient.tsx:120` `case 'ipo': country==='US' ? <NewsFeed query="IPO stock market debut listing"/>`). KR은 `/api/ipo/feed`(38.co.kr) → 구조화 청약일정(`IpoFeed.tsx`: 종목명·청약일·공모가·주관사). **US에도 KR급 구조화 IPO 캘린더**를 주려는 것. 그 전에 **데이터 소스 실측 검증**(규칙: 소스 막히면 대체 소스, 하드코딩 이상치 가드 금지).

**전제:** 코드 변경 **0** — 임시 프로브 스크립트만. `git commit 하지 말 것`(프로브는 탐색).

**후보 소스:** **Nasdaq 공개 API** `https://api.nasdaq.com/api/ipo/calendar?date=YYYY-MM` (무료·무키·전 US IPO). 🐞 함정 = 브라우저형 헤더 없으면 **403**(User-Agent 필수). GitHub `finance_calendars`·`Upcoming-IPO-Calendar-API`가 이 공개 API 사용.

---

## 프로브 스크립트 — `scripts/probe_us_ipo.ts` (임시·검증 후 삭제)
```ts
// US IPO 소스 프로브 — Nasdaq 공개 IPO 캘린더 API 도달성/구조 확인. 커밋 금지.
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.nasdaq.com',
  'Referer': 'https://www.nasdaq.com/',
};

async function probe(ym: string) {
  const url = `https://api.nasdaq.com/api/ipo/calendar?date=${ym}`;
  try {
    const r = await fetch(url, { headers: HEADERS });
    console.log(`\n=== ${ym} · HTTP ${r.status} ${r.statusText} ===`);
    if (!r.ok) { console.log('  본문 앞 200자:', (await r.text()).slice(0, 200)); return; }
    const j: any = await r.json();
    const d = j?.data ?? {};
    const sec = (name: string, rows: any[]) => {
      console.log(`  [${name}] ${rows?.length ?? 0}건`);
      if (rows?.[0]) console.log('    필드:', Object.keys(rows[0]).join(', '));
      (rows ?? []).slice(0, 3).forEach((row: any) =>
        console.log('    ·', JSON.stringify(row).slice(0, 220)));
    };
    sec('priced', d?.priced?.rows);
    sec('upcoming', d?.upcoming?.upcomingTable?.rows);
    sec('filed', d?.filed?.rows);
  } catch (e) { console.log(`  ❌ ${ym} 예외:`, String(e)); }
}

(async () => {
  const now = new Date();
  const ym = (n: number) => { const dt = new Date(now.getFullYear(), now.getMonth() + n, 1); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`; };
  for (const m of [ym(0), ym(1), ym(-1)]) await probe(m); // 이번달·다음달·지난달
})();
```

## 실행
```bash
npx tsx scripts/probe_us_ipo.ts
```
(tsx 없으면 `npx --yes tsx ...` 또는 `node --experimental-strip-types scripts/probe_us_ipo.ts`.)

## 판정 기준 (Cowork에 보고할 것)
1. **Nasdaq API 도달성**: HTTP 200인가? 403이면 → 헤더 조정(Referer 유무·다른 UA) 재시도, 그래도 403이면 소스 막힘.
2. **구조**: `priced`·`upcoming`·`filed` 각 몇 건? **필드명 정확히**(예 `companyName`·`proposedTickerSymbol`·`proposedExchange`·`proposedSharePrice`/`priceRange`·`sharesOffered`·`dollarValueOfSharesOffered`·`expectedPriceDate`/`pricedDate`·`dealID`).
3. **실측 데이터**: 각 섹션 앞 3건 JSON 원문(회사명·티커·거래소·가격·날짜가 진짜 들어오나).
4. **다음달/이번달에 upcoming(예정) 데이터가 실제로 있나**(구조화 피드의 핵심 = 예정 IPO 캘린더).

## 소스 막혔을 때 (403·빈 데이터 지속)
헤더 조합 다 실패 시 **대체 후보**를 Cowork에 보고(그때 재설계):
- SEC EDGAR S-1 최근 제출(`efts.sec.gov/LATEST/search-index?forms=S-1`) — 구조화 약함(제출만).
- API 키 필요 소스(Finnhub·FMP·EODHD) — 키 발급은 사용자 몫이라 최후.
- **가짜/하드코딩으로 채우지 말 것**(규칙). 막히면 보류 원장(`LOCALE_SOURCE_PLAYBOOK`) 기록.

## 보고 후
프로브 결과(도달성·필드·샘플)를 Cowork에 그대로 붙여넣기 → Cowork이 **STEP 729(구현: `/api/ipo/us-feed` + `UsIpoFeed` + Toolbox 배선 + i18n)** 작성. **프로브 스크립트는 결과 보고 후 삭제**(`rm scripts/probe_us_ipo.ts`).

## ⚠️ 주의
- 코드 변경·커밋 **없음**(프로브만). 
- 받은 IPO 가격/건수가 "말도 안 돼" 보여도 **내 지식으로 오염 단정 금지** — present-day 데이터라 훈련지식 밖. 필요시 `WebSearch`로 독립 확인.
