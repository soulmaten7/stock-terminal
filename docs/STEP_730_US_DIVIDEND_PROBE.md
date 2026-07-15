<!-- 2026-07-15 -->
# STEP 730 — US 배당 캘린더 데이터 소스 프로브 (Nasdaq calendar/dividends 검증)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(탐색·프로브. 코드 변경 0·커밋 금지. `/clear` 후.)

**목표:** US 'ipo' 탭을 KR처럼 **IPO + 배당 토글**(`OfferingsFeed` 동급)로 만들려 함. US IPO(729)는 완료 → 이제 **US 배당 캘린더** 소스 검증. IPO 캘린더(`/api/ipo/calendar?date=YYYY-MM`·월 단위)와 달리 **배당은 일(day) 단위**일 가능성이 높아 파라미터·구조를 실측 확인해야 함.

**전제:** 729(`9d977f0`) 이후. Nasdaq 공개 API는 728에서 검증됨(무키·브라우저 헤더로 403 회피).

**후보 소스:** `https://api.nasdaq.com/api/calendar/dividends?date=YYYY-MM-DD` (무료·무키·같은 Nasdaq 인프라).

---

## 프로브 스크립트 — `scripts/probe_us_div.ts` (임시·검증 후 삭제)
```ts
// US 배당 소스 프로브 — Nasdaq 배당 캘린더 도달성/구조/파라미터 단위 확인. 커밋 금지.
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.nasdaq.com",
  Referer: "https://www.nasdaq.com/",
};

async function probe(label: string, url: string) {
  try {
    const r = await fetch(url, { headers: HEADERS });
    console.log(`\n=== ${label} · HTTP ${r.status} ===\n  ${url}`);
    if (!r.ok) { console.log("  본문:", (await r.text()).slice(0, 160)); return; }
    const j: any = await r.json();
    const d = j?.data ?? {};
    // 구조 탐색: data.calendar.rows? data.rows? headers?
    console.log("  data 키:", Object.keys(d).join(", "));
    const rows = d?.calendar?.rows ?? d?.rows ?? d?.calendar ?? null;
    if (Array.isArray(rows)) {
      console.log(`  rows: ${rows.length}건`);
      if (rows[0]) console.log("  필드:", Object.keys(rows[0]).join(", "));
      rows.slice(0, 4).forEach((row: any) => console.log("    ·", JSON.stringify(row).slice(0, 240)));
    } else {
      console.log("  rows 배열 못 찾음. data 원문 앞 400자:", JSON.stringify(d).slice(0, 400));
    }
  } catch (e) { console.log(`  ❌ ${label} 예외:`, String(e)); }
}

(async () => {
  const iso = (n: number) => { const dt = new Date(Date.now() + n * 864e5); return dt.toISOString().slice(0, 10); };
  const ym = () => new Date().toISOString().slice(0, 7);
  // 1) 일 단위 가정: 오늘·내일·모레·일주일 뒤
  for (const n of [0, 1, 2, 7]) await probe(`day ${iso(n)}`, `https://api.nasdaq.com/api/calendar/dividends?date=${iso(n)}`);
  // 2) 월 단위도 혹시 → 비교
  await probe(`month ${ym()}`, `https://api.nasdaq.com/api/calendar/dividends?date=${ym()}`);
})();
```

## 실행
```bash
npx tsx scripts/probe_us_div.ts
```

## 판정 기준 (Cowork에 보고할 것)
1. **도달성**: HTTP 200? (403이면 헤더 조정 재시도.)
2. **파라미터 단위**: `?date=YYYY-MM-DD`(일)가 맞나, 아니면 `YYYY-MM`(월)? **한 호출이 며칠치를 주나**(구조화 캘린더 구성에 중요 — 일 단위면 앞 N일 루프).
3. **구조**: rows 경로(`data.calendar.rows` vs `data.rows`)·건수.
4. **필드명 정확히**: 예상 `companyName`·`symbol`·`dividend_Ex_Date`·`payment_Date`·`record_Date`·`dividend_Rate`·`indicated_Annual_Dividend`·`announcement_Date` — **실제 키 확인**.
5. **실측 4건 JSON 원문**(회사명·티커·배당락일·배당금이 진짜 들어오나).

## 소스 막혔을 때 (403·빈 데이터 지속)
헤더 조합 다 실패 시 Cowork 보고 → 대체(가짜 채우기 금지·`LOCALE_SOURCE_PLAYBOOK` 실패 원장).

## 보고 후
결과 붙여넣기 → Cowork이 **STEP 731**(구현: `/api/dividends/us-feed` + `UsDividendFeed` + `UsOfferingsFeed`[IPO+배당 토글·KR OfferingsFeed 미러] + Toolbox 재배선 + i18n) 작성. **프로브 스크립트는 보고 후 삭제**(`rm scripts/probe_us_div.ts`).

## ⚠️ 주의
- 코드 변경·커밋 **없음**(프로브만).
- 받은 배당금/건수가 이상해 보여도 **내 지식으로 오염 단정 금지**(present-day·훈련지식 밖).
