<!-- 2026-06-04 -->
# STEP 150 — 브리핑 간밤 지수 실데이터 복구 (per-symbol 방식)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_150_COMMAND.md 파일 내용대로 실행해줘`

## 목표
홈 "📰 시장 브리핑 → 간밤 미국 시장" 4개 지수가 전부 "—"로 비어 보이는 문제를 **실데이터로 복구**.
(브라우저 확인 결과 `/api/home/briefing` 이 overnight 4개를 모두 `hasData:false` 로 반환. 바로 위 "주요 지수"(`/api/yahoo/indices`)는 실값 정상.)

## 전제 상태 (이 커밋 위에서 작업)
- HEAD: `2d8a39f` (STEP 149)
- 빌드: ✓ / 브랜치: `main`
- 변경 파일: `app/api/home/briefing/route.ts` 1개뿐.

## 원인 (확정)
- 브리핑은 `yahooFinance.quote(배열)` 한 번에 받고 `arr.find(x => x.symbol === s.symbol)` 로 매칭 → 캐럿(`^`) 지수 심볼에서 매칭 실패 → 전부 빈값.
- 반면 잘 되는 **주요 지수 API(`/api/yahoo/indices`)** 는 `new YahooFinance()` + **심볼 하나씩** `yf.quote(symbol)` 호출(STEP 144). `forex/usdkrw` 라우트도 같은 단일 심볼 패턴으로 정상 동작.
- → 브리핑도 **같은 per-symbol 방식**으로 바꾸면 해결. (STEP 145 의 "—" 가드는 그대로 유지 — 진짜 없을 때만 "—")

## 작업 1/2 — `app/api/home/briefing/route.ts` (파일 전체 교체)

```ts
import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// 장전 브리핑 — 간밤 미증시(야후 라이브러리, 심볼별 quote) + 최근 DART 주요 일정

const yf = new YahooFinance();

function formatKSTDate(d: Date) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchUsIndices() {
  const SYMS = [
    { symbol: '^GSPC', label: 'S&P 500' },
    { symbol: '^IXIC', label: 'NASDAQ' },
    { symbol: '^DJI',  label: 'DOW' },
    { symbol: '^VIX',  label: 'VIX' },
  ];
  // 심볼별 quote — 주요 지수 API(/api/yahoo/indices)와 동일한 검증된 방식.
  // 배열+find 매칭 불안정(캐럿 심볼)을 제거. 실패해도 그 칸만 '—'(STEP 145 가드 유지).
  return Promise.all(
    SYMS.map(async (s) => {
      try {
        const q = await yf.quote(s.symbol);
        const price = Number(q?.regularMarketPrice);
        const pct = Number(q?.regularMarketChangePercent);
        const hasData = Number.isFinite(price) && price > 0 && Number.isFinite(pct);
        if (!hasData) {
          return { label: s.label, val: '—', change: '—', up: true, hasData: false };
        }
        return {
          label: s.label,
          val: price >= 1000 ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : price.toFixed(2),
          change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
          up: pct >= 0,
          hasData: true,
        };
      } catch {
        return { label: s.label, val: '—', change: '—', up: true, hasData: false };
      }
    })
  );
}

async function fetchDartSchedule() {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey || apiKey === 'your_dart_api_key') return [];
  // 최근 3일 범위 — 당일 공시 0건일 때 빈칸 방지
  const bgnDe = formatKSTDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
  try {
    const params = new URLSearchParams({
      crtfc_key: apiKey,
      bgn_de: bgnDe,
      page_no: '1',
      page_count: '30',
    });
    const res = await fetch(`https://opendart.fss.or.kr/api/list.json?${params}`, {
      next: { revalidate: 900 },
    });
    const data = await res.json();
    const KEYWORDS = ['실적', '어닝', '분기보고서', '사업보고서', '유상증자', '합병', '분할', '배당'];
    return (data.list || [])
      .filter((item: Record<string, string>) =>
        KEYWORDS.some((k) => item.report_nm?.includes(k))
      )
      .slice(0, 5)
      .map((item: Record<string, string>) => `${item.corp_name} — ${item.report_nm}`);
  } catch {
    return [];
  }
}

export async function GET() {
  const [overnight, schedule] = await Promise.all([fetchUsIndices(), fetchDartSchedule()]);
  return NextResponse.json(
    { overnight, schedule },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=120' } },
  );
}
```

> 핵심 변경: `import yahooFinance`(기본) → `import YahooFinance` + `const yf = new YahooFinance()` · `fetchUsIndices` 가 배열+find → **심볼별 `yf.quote(s.symbol)` Promise.all**. `fetchDartSchedule`·`GET` 은 동일.

## 작업 2/2 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add app/api/home/briefing/route.ts && git commit -m "fix(v6): 브리핑 간밤 지수 실데이터 복구 — 배열+find → per-symbol quote (주요 지수 API와 동일 방식) (STEP 150)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] (확인) `npm run dev` 후 `http://localhost:3333/api/home/briefing` 가 overnight 에 실값(`hasData:true`) 반환하는지

## 주의·예상 이슈
- `new YahooFinance()` + 단일 심볼 `yf.quote(s.symbol)` 는 `/api/yahoo/indices`·`/api/forex/usdkrw` 에서 이미 검증된 패턴.
- 야후가 진짜 차단/장애일 때만 "—" (STEP 145 가드 유지) — 정직성 그대로.
- TS: 단일 심볼 quote 는 객체 반환(`forex/usdkrw` 동일). 타입 불평 거의 없음.

---
> STEP 150 = 브라우저 확인(STEP 149 후)에서 발견한 실데이터 누락 수정. 전제 `2d8a39f` → 이 STEP 코드 커밋 후 Cowork 이 문서 갱신. **이후 사용자와 대화 재개 예정.**
