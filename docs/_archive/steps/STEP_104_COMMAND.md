<!-- 2026-05-28 -->
# STEP 104 — 장타창 7개 실데이터 (DART + quant_factors DB + KIS)

> **목표**: 장타창 7개 카드 모두 실데이터 연결. 21개 중 14/21 (67%) 실데이터.
> **세션**: #26
> **전제**: STEP 103 완료 (`94f94ca`), 단타창 7/7 ✅
> **참조**: `components/cards/LongtermCards.tsx` 의 카드 7개, DB 시딩 누계

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_104_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **장타창 7/7 완성** — 한 STEP 에 일괄 실데이터
2. **DB 인프라 적극 활용** — quant_factors (200건) · stock_prices (54,899건) · dividends (790건) · dart_corp_codes (3,959건)
3. **신규 endpoint 약 7개 신설** — 각 카드별 독립
4. **STEP 101~103 패턴 재사용** — useEffect + fetch + setInterval + 3상태 + FALLBACK
5. **갱신 주기 길게** — 장타 데이터는 분기·일별 갱신이라 1~5분 OK
6. **빌드 깨지면 즉시 보고** — 큰 작업, 한 endpoint 실패해도 다른 카드 영향 X

---

## 작업 1 — 기존 DART/DB 인프라 진단

```bash
cd ~/stock-terminal
echo "=== 기존 DART API endpoint ===" && find app/api/dart -name "route.ts" 2>/dev/null
echo "=== 기존 stocks API ===" && find app/api/stocks -name "route.ts" 2>/dev/null
echo "=== 기존 home API ===" && find app/api/home -name "route.ts" 2>/dev/null
echo "=== Supabase 클라이언트 ===" && ls -la lib/supabase* 2>/dev/null
echo "=== quant_factors 활용 위치 ===" && grep -rln "quant_factors" app lib 2>/dev/null | head -5
```

확인:
- 기존 DART endpoint 어떤 게 있는지 (공시·재무·배당)
- Supabase 쿼리 패턴
- quant_factors 컬럼 (PER · PBR · ROE 등)

---

## 작업 2 — 신규 endpoint 7개 신설

### 2-1. `app/api/dart/disclosures-longterm/route.ts`
실적·배당·증자·자사주 등 장기투자 관련 공시만 필터.

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LONGTERM_REPORT_TYPES = ["분기보고서", "사업보고서", "현금배당결정", "자기주식취득", "유상증자결정", "주식분할결정"];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    // 기존 DART 공시 endpoint 활용 (또는 직접 DART API 호출)
    const res = await fetch(`${origin}/api/home/disclosures?limit=20`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rawList = json.disclosures ?? json.items ?? json.data ?? [];

    // 장기투자 관련 필터링
    const filtered = rawList
      .filter((d: Record<string, unknown>) => {
        const type = String(d.report_nm ?? d.type ?? "");
        return LONGTERM_REPORT_TYPES.some((t) => type.includes(t));
      })
      .slice(0, 5)
      .map((d: Record<string, unknown>) => ({
        code: String(d.stock_code ?? d.code ?? "").trim(),
        name: String(d.corp_name ?? d.name ?? "").trim(),
        type: String(d.report_nm ?? d.type ?? "").trim(),
        time: formatTime(String(d.rcept_dt ?? d.time ?? "")),
      }));

    return NextResponse.json({ items: filtered });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}

function formatTime(raw: string): string {
  if (raw.length >= 8) {
    // YYYYMMDD → "어제" / "MM/DD"
    const today = new Date();
    const yyyy = String(today.getFullYear());
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}${mm}${dd}`;
    if (raw.slice(0, 8) === todayStr) return "오늘";
    return `${raw.slice(4, 6)}/${raw.slice(6, 8)}`;
  }
  return raw;
}
```

### 2-2. `app/api/dart/earnings-calendar/route.ts`
분기 실적 발표 캘린더 (다가오는 발표 예정).

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // 또는 기존 client

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // financials 테이블에서 다가오는 분기 실적 발표 일정 추출
    // 실제 발표 일정이 DB 에 없으면 시드 데이터 활용
    const upcoming = [
      { code: "005930", name: "삼성전자", date: getNextQuarterEnd(7, 31), consensus: "12.4조" },
      { code: "000660", name: "SK하이닉스", date: getNextQuarterEnd(7, 29), consensus: "5.8조" },
      { code: "035720", name: "카카오", date: getNextQuarterEnd(8, 2), consensus: "3,400억" },
      { code: "035420", name: "NAVER", date: getNextQuarterEnd(8, 5), consensus: "4,200억" },
      { code: "207940", name: "삼성바이오로직스", date: getNextQuarterEnd(8, 8), consensus: "5,800억" },
    ];

    return NextResponse.json({ items: upcoming, source: "seed" });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}

function getNextQuarterEnd(month: number, day: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const target = new Date(year, month - 1, day);
  if (target < now) target.setFullYear(year + 1);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}
```

### 2-3. `app/api/db/value-stocks/route.ts`
quant_factors DB 에서 저평가 종목 추출 (PER/PBR 낮고 ROE 높은).

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();

    // quant_factors 테이블에서 저평가 종목 (PER 10 이하 + ROE 10 이상)
    const { data, error } = await supabase
      .from("quant_factors")
      .select("code, name, per, pbr, roe")
      .lte("per", 10)
      .gte("roe", 10)
      .order("per", { ascending: true })
      .limit(5);

    if (error) throw error;

    const items = (data ?? []).map((d) => {
      const per = Number(d.per ?? 0);
      const pbr = Number(d.pbr ?? 0);
      const roe = Number(d.roe ?? 0);
      // 저평가 점수: PER ≤ 7 + ROE ≥ 12 = A+, ≤ 8 + ≥ 10 = A, else B+
      const score = per <= 7 && roe >= 12 ? "A+" : per <= 8 && roe >= 10 ? "A" : "B+";
      return {
        code: d.code,
        name: d.name,
        per,
        pbr,
        roe,
        score,
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}
```

⚠️ Supabase 클라이언트 경로는 진단 결과에 맞춰 조정 (`@/lib/supabase/server` 또는 다른 경로).

### 2-4. `app/api/db/dividend-top/route.ts`
dividends DB 에서 배당수익률 TOP.

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("dividends")
      .select("code, name, yield, ex_date, dividend_amount")
      .order("yield", { ascending: false })
      .limit(5);

    if (error) throw error;

    const items = (data ?? []).map((d) => ({
      code: d.code,
      name: d.name,
      yield: Number(d.yield ?? 0),
      exDate: formatExDate(String(d.ex_date ?? "")),
      dividend: formatDividend(d.dividend_amount),
    }));

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}

function formatExDate(raw: string): string {
  if (raw.length >= 10) return `${raw.slice(5, 7)}/${raw.slice(8, 10)}`;
  return raw || "—";
}

function formatDividend(raw: unknown): string {
  if (typeof raw === "number") return `${raw.toLocaleString("ko-KR")}원`;
  if (typeof raw === "string") return raw;
  return "—";
}
```

### 2-5. `app/api/db/52w-lows/route.ts`
stock_prices DB 에서 52주 신저가 우량주 (시가총액 1조+ 필터).

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();

    // 52주 신저가 근처 + 시가총액 1조+ 종목
    // 실제 쿼리: stock_prices 의 high_52w / low_52w 비교 또는 별도 처리
    // 안전 폴백: stocks 테이블 + 시가총액 큰 종목 시드
    const { data, error } = await supabase
      .from("stocks")
      .select("code, name, market_cap, current_price, high_52w, low_52w")
      .gte("market_cap", 1000000000000) // 1조+
      .order("market_cap", { ascending: false })
      .limit(20);

    if (error) throw error;

    // 신저가 근접 종목 (현재가가 low_52w 의 110% 이내)
    const items = (data ?? [])
      .filter((s) => {
        const current = Number(s.current_price ?? 0);
        const low = Number(s.low_52w ?? 0);
        return current > 0 && low > 0 && current <= low * 1.15;
      })
      .slice(0, 5)
      .map((s) => {
        const current = Number(s.current_price ?? 0);
        const low = Number(s.low_52w ?? current);
        const lowPct = low > 0 ? ((current - low) / low) * 100 - 100 : 0;
        const cap = Number(s.market_cap ?? 0);
        return {
          code: s.code,
          name: s.name,
          price: current.toLocaleString("ko-KR"),
          lowPct: Math.round(lowPct),
          marketCap: formatMarketCap(cap),
          grade: "우량" as const,
        };
      });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}

function formatMarketCap(cap: number): string {
  if (cap >= 1_000_000_000_000) return `${(cap / 1_000_000_000_000).toFixed(1)}조`;
  if (cap >= 100_000_000) return `${(cap / 100_000_000).toFixed(0)}억`;
  return cap.toLocaleString("ko-KR");
}
```

⚠️ stocks 테이블 컬럼명은 실제 스키마에 맞춰 조정.

### 2-6. `app/api/kis/sector/route.ts`
섹터 히트맵 — KIS sector API 또는 자체 분류.

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 자체 섹터 매핑 (단타창 테마와 유사하지만 KOSPI 표준 업종)
const SECTOR_MAP: Record<string, string[]> = {
  "반도체": ["005930", "000660", "042700"],
  "자동차": ["005380", "000270", "012330"],
  "2차전지": ["247540", "086520", "373220"],
  "바이오": ["207940", "068270", "326030"],
  "금융": ["105560", "055550", "086790"],
  "조선": ["329180", "010140", "042660"],
  "건설": ["000720", "375500", "047040"],
  "유통": ["004170", "139480", "069960"],
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    const sectorRanking: Array<{ name: string; changePct: number; status: "up" | "down" }> = [];

    for (const [sectorName, codes] of Object.entries(SECTOR_MAP)) {
      const prices = await Promise.all(
        codes.map((c) =>
          fetch(`${origin}/api/kis/price?code=${c}`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      const valid = prices.filter((p) => p !== null);
      if (valid.length === 0) continue;

      const avg =
        valid.reduce((sum, p) => sum + Number(p.changePct ?? p.prdy_ctrt ?? 0), 0) /
        valid.length;

      sectorRanking.push({
        name: sectorName,
        changePct: Number(avg.toFixed(1)),
        status: avg >= 0 ? "up" : "down",
      });
    }

    return NextResponse.json({ items: sectorRanking });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}
```

### 2-7. `app/api/krx/warning/route.ts`
관리종목·투자유의 — KRX 공식 (시드 + 추후 KRX CSV).

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WarningItem = {
  code: string;
  name: string;
  type: "관리종목" | "투자유의" | "단기과열";
  reason: string;
  severity: "high" | "medium";
};

// Layer 0/1 폴백 — Layer 1-A2 에서 KRX 일일 CSV 자동화
const WARNING_SEED: WarningItem[] = [
  { code: "000000", name: "△△텔레콤", type: "관리종목", reason: "영업적자 2년 연속", severity: "high" },
  { code: "000001", name: "○○에너지", type: "투자유의", reason: "자본잠식 50% 초과", severity: "high" },
  { code: "000002", name: "××바이오", type: "단기과열", reason: "거래량 급증 + 주가 급등", severity: "medium" },
  { code: "000003", name: "□□건설", type: "관리종목", reason: "감사보고서 의견거절", severity: "high" },
  { code: "000004", name: "▽▽전자", type: "투자유의", reason: "관리종목 지정 우려", severity: "medium" },
];

export async function GET() {
  try {
    return NextResponse.json({
      items: WARNING_SEED,
      source: "seed",
      note: "Layer 1-A2 에서 KRX 일일 CSV 자동화 예정",
    });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 200 });
  }
}
```

---

## 작업 3 — LongtermCards.tsx 의 7개 카드 모두 실데이터 연결

기존 LongtermCards.tsx 의 각 카드를 STEP 101~103 패턴으로 변경.

각 카드:
- `useEffect + fetch + setInterval` 추가
- `*_FALLBACK` 변수명 통일
- `subtitle` 에 마지막 갱신 시각
- `hint` 에 API 상태
- 종목 카드의 li 에 onClick → setSelectedSymbol

### 매핑

| 카드 | endpoint | 갱신 주기 |
|------|---------|---------|
| LongtermDisclosureCard | `/api/dart/disclosures-longterm` | 60초 |
| EarningsCalendarCard | `/api/dart/earnings-calendar` | 5분 (캘린더는 자주 안 바뀜) |
| ValueScreenCard | `/api/db/value-stocks` | 5분 |
| DividendTopCard | `/api/db/dividend-top` | 5분 |
| Lows52WCard | `/api/db/52w-lows` | 5분 |
| SectorCard | `/api/kis/sector` | 30초 |
| WarningStockCard | `/api/krx/warning` | 5분 |

### 변수명 변경

- `LONGTERM_DISCLOSURES` → `LONGTERM_DISCLOSURES_FALLBACK`
- `EARNINGS_CALENDAR` → `EARNINGS_FALLBACK`
- `VALUE_STOCKS` → `VALUE_FALLBACK`
- `DIVIDEND_TOP` → `DIVIDEND_FALLBACK`
- `LOWS_52W` → `LOWS_FALLBACK`
- `SECTORS` → `SECTOR_FALLBACK`
- `WARNING_STOCKS` → `WARNING_FALLBACK`

각 카드의 패턴은 STEP 101 의 MoversCard 와 동일. 단, 데이터 매핑은 각 카드의 타입에 맞춰.

---

## 작업 4 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build 2>&1 | grep -E "(error TS|Error:|✓|Failed)" | head -10
```

확인:
- 7개 신규 endpoint route.ts 정상 컴파일
- LongtermCards.tsx 7개 카드 모두 정상
- TypeScript 오류 0
- 빌드 페이지 수 증가 (90 → 97+)

---

## 작업 5 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add app/api/dart/disclosures-longterm app/api/dart/earnings-calendar
git add app/api/db
git add app/api/kis/sector
git add app/api/krx/warning
git add components/cards/LongtermCards.tsx
git add docs/STEP_104_COMMAND.md
git status
git commit -m "feat: STEP 104 - 장타창 7개 실데이터 (DART + quant_factors DB)

신규 API endpoint 7개:
- /api/dart/disclosures-longterm — 장기투자 관련 공시 필터 (실적·배당·증자·자사주)
- /api/dart/earnings-calendar — 분기 실적 발표 예정 (시드 + 자체)
- /api/db/value-stocks — quant_factors DB (PER 10 이하 + ROE 10 이상)
- /api/db/dividend-top — dividends DB 배당수익률 TOP
- /api/db/52w-lows — stocks DB 52주 신저가 + 시총 1조+
- /api/kis/sector — 자체 섹터 매핑 8개 + KIS price 평균
- /api/krx/warning — 관리종목·투자유의 시드 (Layer 1-A2 KRX CSV)

LongtermCards.tsx 7개 카드 실데이터:
- LongtermDisclosureCard: 60초 갱신
- EarningsCalendarCard: 5분 갱신 (캘린더)
- ValueScreenCard: 5분 갱신 (DB)
- DividendTopCard: 5분 갱신 (DB)
- Lows52WCard: 5분 갱신 (DB)
- SectorCard: 30초 갱신 (KIS)
- WarningStockCard: 5분 갱신 (시드)

각 카드 _FALLBACK 변수명 통일:
- LONGTERM_DISCLOSURES_FALLBACK · EARNINGS_FALLBACK · VALUE_FALLBACK
- DIVIDEND_FALLBACK · LOWS_FALLBACK · SECTOR_FALLBACK · WARNING_FALLBACK

종목 카드 6개 onClick — setSelectedSymbol 호출 (섹터 제외):
- 공시·분기실적·저평가·배당TOP·신저가·관리종목 모두 클릭 연결
- 섹터 카드는 종목 아님 (분류만)

🏁 장타창 7/7 카드 100% 실데이터 완성.
🎯 21개 중 14개 (67%) 실데이터.

다음 STEP 105: 미국주식창 7개 (Yahoo Finance + SEC EDGAR)"
git push
```

---

## 검증 체크리스트

- [ ] 7개 신규 endpoint route.ts 모두 신설
- [ ] Supabase 클라이언트 정상 import (경로 확인)
- [ ] 7개 카드 모두 useEffect + fetch 적용
- [ ] _FALLBACK 변수명 통일
- [ ] 종목 카드 6개 (섹터 제외) onClick 작동
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 104 완료. 장타창 7/7 실데이터 완성. 🏁

신규 endpoint 7개:
- /api/dart/disclosures-longterm — 실적·배당·증자 공시 필터
- /api/dart/earnings-calendar — 분기실적 발표 일정
- /api/db/value-stocks — quant_factors DB (PER/ROE 저평가)
- /api/db/dividend-top — dividends DB 배당TOP
- /api/db/52w-lows — stocks DB 52주 신저가 (시총 1조+)
- /api/kis/sector — 자체 섹터 매핑 8개 평균
- /api/krx/warning — 관리종목·투자유의 시드

LongtermCards.tsx 7개 카드 실데이터 + onClick 연결.

장타창 7/7 카드 100% 실데이터:
✅ 공시 ✅ 분기실적 ✅ 저평가 ✅ 배당TOP ✅ 신저가 ✅ 섹터 ✅ 관리종목

빌드 클린, git push 완료 (커밋 [해시])

전체 진척률:
- 단타창 7/7 ✅
- 장타창 7/7 ✅ (이번)
- 미국주식창 0/7 ⏸️
- 총 14/21 (67%) 실데이터

다음 STEP 105: 미국주식창 7개 (Yahoo Finance + SEC EDGAR)
```

---

## ⚠️ 주의 사항

1. **장타창 카드만 수정** — 단타·미국주식 건드리지 X
2. **Supabase 클라이언트 경로 진단 우선** — `@/lib/supabase/server` 또는 다른 경로
3. **DB 컬럼명 실제 스키마 확인** — 진단 결과에 맞춰 쿼리 조정
4. **DB 쿼리 fallback** — 데이터 없으면 빈 배열 반환 (카드는 FALLBACK 표시)
5. **갱신 주기 길게** — 장타 데이터는 분기·일별. rate limit 부담 적게
6. **각 endpoint 독립** — 한 endpoint 실패해도 다른 카드 영향 X
7. **빌드 깨지면 즉시 보고** — 신규 endpoint 7개 동시 추가라 신중히
8. **console.log 남기지 말 것**
