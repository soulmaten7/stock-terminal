<!-- 2026-06-06 -->
# STEP 161 — 국내 랭킹 100개 (KRX 연동 + KIS fallback)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_161_COMMAND.md 파일 내용대로 실행해줘`

## 목표
국내 랭킹을 토스처럼 **100개**로. KIS 오픈API는 호출당 30개가 한계 → **KRX 정보데이터시스템 비공식 JSON(MDCSTAT01501 전종목시세)** 으로 100개를 가져오고, **KRX가 비거나 실패하면 기존 KIS 30개로 자동 fallback**.
- 전종목시세 1회 호출로 **거래대금·거래량·시가총액·상승·하락 5개 필터 전부** 정렬 가능
- 미국(Yahoo)은 이미 100개 → 변경 없음
- 약 20분 지연(국내 한정) — "실시간 아님" 안내 문구도 추가
> ⚠️ 비공식 엔드포인트라 깨질 수 있음 → 그래서 KIS fallback이 안전망. 깨져도 30개는 항상 나옴.

## 전제 상태
- HEAD: `2855f68` (STEP 159+) 이상. **STEP 160(지수)과 파일이 안 겹쳐 순서 무관.**
- 변경: 신규 파일 `app/api/krx/ranking/route.ts` + `components/market/MarketClient.tsx`(국내 분기 1곳 + 안내문구 1줄)

---

## 작업 1/3 — 신규 파일 `app/api/krx/ranking/route.ts` (아래 전체 내용으로 생성)

```ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 국내 전종목 시세(거래대금·거래량·시총·등락) — KRX 정보데이터시스템 비공식 JSON (MDCSTAT01501)
// 약 20분 지연. 실패/빈값이면 빈 배열 반환 → 호출측(MarketClient)이 KIS 30개로 fallback.

const KRX_URL = "http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd";
const BLD = "dbms/MDC/STAT/standard/MDCSTAT01501";

type KrxRow = Record<string, string>;

function num(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(String(s).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function fetchKrxForDate(trdDd: string): Promise<KrxRow[]> {
  const body = new URLSearchParams({
    bld: BLD,
    mktId: "ALL",
    trdDd,
    share: "1",
    money: "1",
    csvxls_isNo: "false",
  });
  const res = await fetch(KRX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      Referer:
        "http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020101",
    },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.OutBlock_1 ?? j.output ?? j.block1 ?? []) as KrxRow[];
}

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") || "all"; // all|kospi|kosdaq
  const sort = request.nextUrl.searchParams.get("sort") || "amount"; // amount|volume|cap|up|down
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") || "100", 10) || 100,
    200
  );

  try {
    // 최신 영업일 찾기: 오늘부터 최대 8일 거슬러, 데이터 있는 첫 날 사용 (주말·휴장·미집계 대응)
    let rows: KrxRow[] = [];
    let usedDate = "";
    const now = new Date();
    for (let i = 0; i < 8; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const trdDd = ymd(d);
      rows = await fetchKrxForDate(trdDd);
      if (rows.length > 0) {
        usedDate = trdDd;
        break;
      }
    }
    if (rows.length === 0) {
      return NextResponse.json({ stocks: [], source: "krx", error: "empty" });
    }

    // 시장 필터 (KONEX 제외)
    const mktOf = (r: KrxRow) => String(r.MKT_NM || "");
    let filtered = rows.filter((r) => mktOf(r) === "KOSPI" || mktOf(r) === "KOSDAQ");
    if (market === "kospi") filtered = filtered.filter((r) => mktOf(r) === "KOSPI");
    else if (market === "kosdaq") filtered = filtered.filter((r) => mktOf(r) === "KOSDAQ");

    // 매핑 (KIS 라우트와 동일한 키로 → MarketClient 매퍼 그대로 재사용)
    const mapped = filtered.map((r) => ({
      symbol: String(r.ISU_SRT_CD || ""),
      name: String(r.ISU_ABBRV || ""),
      price: num(r.TDD_CLSPRC),
      changePercent: num(r.FLUC_RT),
      volume: num(r.ACC_TRDVOL),
      tradeAmount: num(r.ACC_TRDVAL),
      marketCap: num(r.MKTCAP),
    }));

    // 정렬
    type M = (typeof mapped)[number];
    const sorters: Record<string, (a: M, b: M) => number> = {
      amount: (a, b) => b.tradeAmount - a.tradeAmount,
      volume: (a, b) => b.volume - a.volume,
      cap: (a, b) => b.marketCap - a.marketCap,
      up: (a, b) => b.changePercent - a.changePercent,
      down: (a, b) => a.changePercent - b.changePercent,
    };
    const sorted = mapped.sort(sorters[sort] || sorters.amount).slice(0, limit);
    const stocks = sorted.map((s, i) => ({ rank: i + 1, ...s }));

    return NextResponse.json({ stocks, source: "krx", trdDd: usedDate });
  } catch (e) {
    return NextResponse.json({
      stocks: [],
      source: "krx",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
```
> `runtime="nodejs"` 필수(서버사이드 http POST). CORS 무관(브라우저 아님). 실패하면 항상 `{stocks: []}` → fallback 동작.

---

## 작업 2/3 — `components/market/MarketClient.tsx` (국내 분기: KRX 우선 + KIS fallback)

**찾기:**
```tsx
        if (country === "kr") {
          const url =
            filter === "amount" || filter === "volume"
              ? `/api/kis/volume-rank?market=${market}&sort=${filter}&limit=100`
              : filter === "cap"
              ? `/api/kis/market-cap?market=${market}&limit=100`
              : `/api/kis/movers?dir=${filter}&market=${market}&limit=100`;
          const j = await (await fetch(url)).json();
          list = (j.stocks ?? j.items ?? []).map((s: Record<string, unknown>, i: number) => ({
            rank: typeof s.rank === "number" ? s.rank : i + 1,
            symbol: String(s.symbol ?? ""),
            name: String(s.name ?? ""),
            priceText: Number(s.price ?? 0).toLocaleString(),
            changePercent: Number(s.changePercent ?? 0),
            volume: Number(s.volume ?? 0),
            tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
          }));
        } else {
```
**바꾸기:**
```tsx
        if (country === "kr") {
          // 1순위: KRX 100개(약 20분 지연). 비거나 실패하면 2순위: KIS 30개 fallback.
          const krxUrl = `/api/krx/ranking?market=${market}&sort=${filter}&limit=100`;
          const kisUrl =
            filter === "amount" || filter === "volume"
              ? `/api/kis/volume-rank?market=${market}&sort=${filter}&limit=100`
              : filter === "cap"
              ? `/api/kis/market-cap?market=${market}&limit=100`
              : `/api/kis/movers?dir=${filter}&market=${market}&limit=100`;
          let raw: Record<string, unknown>[] = [];
          try {
            const j = await (await fetch(krxUrl)).json();
            raw = (j.stocks ?? []) as Record<string, unknown>[];
          } catch {
            raw = [];
          }
          if (raw.length === 0) {
            const j = await (await fetch(kisUrl)).json();
            raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
          }
          list = raw.map((s, i: number) => ({
            rank: typeof s.rank === "number" ? s.rank : i + 1,
            symbol: String(s.symbol ?? ""),
            name: String(s.name ?? ""),
            priceText: Number(s.price ?? 0).toLocaleString(),
            changePercent: Number(s.changePercent ?? 0),
            volume: Number(s.volume ?? 0),
            tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
          }));
        } else {
```
> 매퍼 동일(KRX·KIS 응답 키가 같음). 미국 분기(`else`)는 그대로.

## 작업 3/3 — `components/market/MarketClient.tsx` (국내 지연 안내 1줄)

**찾기:**
```tsx
          {/* 랭킹 테이블 */}
```
**바꾸기:**
```tsx
          {country === "kr" && (
            <p className="text-xs text-unjong-muted mb-2">국내 시세 KRX 기준 · 최대 약 20분 지연 (실시간 아님)</p>
          )}
          {/* 랭킹 테이블 */}
```

---

## 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/krx/ranking/route.ts components/market/MarketClient.tsx && git commit -m "feat(v7): 국내 랭킹 100개 — KRX 정보데이터시스템(MDCSTAT01501) 연동 + KIS 30 fallback (STEP 161)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부
- [ ] **(핵심) KRX 실제 동작 확인** — dev 실행 중 터미널에서:
  ```bash
  curl -s "http://localhost:3333/api/krx/ranking?market=all&sort=amount&limit=100" | head -c 400
  ```
  → `"source":"krx"` + `stocks` 배열에 **종목 다수(수십~100개)** + `trdDd` 날짜가 보이면 성공. (개수: `curl ... | grep -o '"rank"' | wc -l`)
- [ ] 홈/마켓 **국내 탭에서 100개까지 스크롤**되는지, 필터(거래대금·거래량·시총·상승·하락) 전환 잘 되는지
- [ ] (fallback 확인·선택) route.ts 의 `KRX_URL` 을 잠깐 오타로 바꿔 저장 → 국내가 **30개(KIS)** 로 나오면 fallback OK → 원복
- ⚠️ 화면 그대로면 dev `.next` stale → 진짜 터미널에서 `pkill -9 -f "next dev"; pkill -9 -f next-server; cd ~/stock-terminal && rm -rf .next && npm run dev`

## 주의·예상 이슈
- KRX 비공식 → 깨지면 자동 KIS 30 fallback(빈 배열 시). 사이트는 절대 안 죽음.
- 장 초반·휴장이면 직전 영업일 데이터(루프가 자동 처리).
- `curl` 에서 `"stocks":[]` + `error` 면 KRX가 막은 것 → User-Agent/Referer 유지 확인, 그래도 안 되면 알려주세요(헤더 보강 or 공식 API 전환 검토).
- 코스피 featured 큰 카드 + 수급(개인/외국인/기관)은 **STEP 162** 로.

---
> STEP 161 = 국내 랭킹 100(KRX+KIS fallback). 전제 `2855f68`(STEP 160과 무관). 다음: STEP 162 코스피/코스닥 featured+수급, 랭킹 로고·이유태그. 문서 묶어 갱신.
