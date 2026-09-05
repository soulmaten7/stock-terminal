<!-- 2026-06-06 -->
# STEP 162 — 국내 랭킹 100개 (KRX 공식 OpenAPI 연동)

## ⚠️ 실행 전 사용자 준비 (3가지 — 이거 안 하면 키 있어도 거부됨)
1. **인증키 승인 확인** — openapi.krx.co.kr > 마이페이지 > API 인증키 발급내역 이 "승인 대기중" → **발급 완료**로 바뀌어야 함(보통 1일 내, 이메일 통보).
2. **API 이용신청(2개) — 별도 필수!** openapi.krx.co.kr > **서비스 이용 > 주식** 에서:
   - **유가증권 일별매매정보** → 'API 이용신청' (기간 12개월, 목적: 서비스/개인연구)
   - **코스닥 일별매매정보** → 'API 이용신청' (동일)
   > 인증키만 있고 이용신청을 안 하면 그 API는 막혀 있음.
3. **`.env.local` 에 키 추가** (프로젝트 루트 `~/stock-terminal/.env.local`):
   ```
   KRX_API_KEY=여기에_발급받은_인증키_붙여넣기
   ```
   > ⚠️ `.env.local` 은 git 에 **절대 커밋 금지**(이미 gitignore). 키는 비밀.

> 위 3개가 안 됐어도 이 STEP 자체는 적용 가능 — 키 없으면 자동으로 KIS 30개 fallback 으로 돌아감(사이트 정상). 키 넣는 순간 100개로 전환.

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_162_COMMAND.md 파일 내용대로 실행해줘`

## 목표
STEP 161의 `data.krx` 백엔드(서버사이드 차단됨)를 **KRX 공식 OpenAPI**로 교체. 국내 100개를 공식·안정적으로. **일별(장 마감 기준)** 데이터. 키 없거나 실패 시 KIS 30 fallback(기존 그대로).
- `app/api/krx/ranking/route.ts` **전체 교체** (MarketClient 는 이미 이 라우트를 호출 중 → 수정 불필요)
- 지연 안내 문구만 "일별 기준"으로 수정

## 전제 상태
- HEAD: `9fc2e58` (STEP 161) 이상
- 변경: `app/api/krx/ranking/route.ts`(전체 교체) + `components/market/MarketClient.tsx`(안내문구 1줄)

---

## 작업 1/2 — `app/api/krx/ranking/route.ts` (파일 전체를 아래로 교체)

```ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 국내 전종목 일별매매정보 — KRX 공식 OpenAPI (data-dbg.krx.co.kr). 일별(장 마감 기준).
// 인증키: .env.local 의 KRX_API_KEY (절대 커밋 금지). 키 없음/실패/빈값 → 빈 배열 → MarketClient 가 KIS 30 fallback.

const BASE = "http://data-dbg.krx.co.kr/svc/apis/sto";
const EP = {
  kospi: `${BASE}/stk_bydd_trd`,
  kosdaq: `${BASE}/ksq_bydd_trd`,
};

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
// ISIN(KR7…12자리)이면 6자리 단축코드로, 아니면 그대로
function toShort(code: string): string {
  const c = code.trim();
  return c.length === 12 ? c.slice(3, 9) : c;
}

async function fetchOne(url: string, basDd: string, key: string): Promise<KrxRow[]> {
  try {
    const res = await fetch(`${url}?basDd=${basDd}`, {
      method: "GET",
      headers: { AUTH_KEY: key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.OutBlock_1 ?? j.output ?? j.block1 ?? []) as KrxRow[];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const market = request.nextUrl.searchParams.get("market") || "all"; // all|kospi|kosdaq
  const sort = request.nextUrl.searchParams.get("sort") || "amount"; // amount|volume|cap|up|down
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") || "100", 10) || 100,
    200
  );

  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ stocks: [], source: "krx", error: "no_key" });

  try {
    const urls =
      market === "kospi" ? [EP.kospi] : market === "kosdaq" ? [EP.kosdaq] : [EP.kospi, EP.kosdaq];

    // 최신 영업일: 오늘부터 최대 8일 거슬러 데이터 있는 첫 날 (주말·휴장·미집계 대응)
    let rows: KrxRow[] = [];
    let usedDate = "";
    const now = new Date();
    for (let i = 0; i < 8 && rows.length === 0; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const basDd = ymd(d);
      const parts = await Promise.all(urls.map((u) => fetchOne(u, basDd, key)));
      const merged = parts.flat();
      if (merged.length > 0) {
        rows = merged;
        usedDate = basDd;
      }
    }
    if (rows.length === 0) return NextResponse.json({ stocks: [], source: "krx", error: "empty" });

    const mapped = rows.map((r) => ({
      symbol: toShort(String(r.ISU_CD || "")),
      name: String(r.ISU_NM || "").trim(),
      price: num(r.TDD_CLSPRC),
      changePercent: num(r.FLUC_RT),
      volume: num(r.ACC_TRDVOL),
      tradeAmount: num(r.ACC_TRDVAL),
      marketCap: num(r.MKTCAP),
    }));

    type M = (typeof mapped)[number];
    const sorters: Record<string, (a: M, b: M) => number> = {
      amount: (a, b) => b.tradeAmount - a.tradeAmount,
      volume: (a, b) => b.volume - a.volume,
      cap: (a, b) => b.marketCap - a.marketCap,
      up: (a, b) => b.changePercent - a.changePercent,
      down: (a, b) => a.changePercent - b.changePercent,
    };
    const stocks = mapped
      .filter((s) => s.symbol && s.price > 0)
      .sort(sorters[sort] || sorters.amount)
      .slice(0, limit)
      .map((s, i) => ({ rank: i + 1, ...s }));

    return NextResponse.json({ stocks, source: "krx", basDd: usedDate });
  } catch (e) {
    return NextResponse.json({
      stocks: [],
      source: "krx",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
```
> 키 미설정/오류/빈값 → `{stocks: []}` → MarketClient 가 자동으로 KIS 30 호출(기존 로직). 그래서 키 넣기 전에도 사이트 정상.

## 작업 2/2 — `components/market/MarketClient.tsx` (안내문구 "일별"로 수정)

**찾기:**
```tsx
            <p className="text-xs text-unjong-muted mb-2">국내 시세 KRX 기준 · 최대 약 20분 지연 (실시간 아님)</p>
```
**바꾸기:**
```tsx
            <p className="text-xs text-unjong-muted mb-2">국내 시세 KRX 공식 · 일별(장 마감) 기준 (실시간 아님)</p>
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add app/api/krx/ranking/route.ts components/market/MarketClient.tsx && git commit -m "feat(v7): 국내 랭킹 100개 — KRX 공식 OpenAPI(stk/ksq_bydd_trd) 연동, KIS fallback 유지 (STEP 162)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **(키 발급·이용신청 완료 시) 원본 KRX 응답 확인** — 터미널에서 (KEY 본인 것으로):
  ```bash
  curl -s -H "AUTH_KEY: 본인키" "http://data-dbg.krx.co.kr/svc/apis/sto/stk_bydd_trd?basDd=20260605" | head -c 600
  ```
  → `OutBlock_1` 배열에 `ISU_CD`,`ISU_NM`,`TDD_CLSPRC`,`FLUC_RT`,`ACC_TRDVOL`,`ACC_TRDVAL`,`MKTCAP` 보이면 정상. **만약 필드명이 다르면 그 JSON 그대로 캡쳐해서 알려주세요 → 매핑 바로 수정.**
- [ ] 우리 라우트 확인: `curl -s "http://localhost:3333/api/krx/ranking?market=all&sort=amount&limit=100" | grep -o '"rank"' | wc -l` → **100 근처**면 성공. `"error":"no_key"` 면 .env.local 키 확인, `dev 서버 재시작`(env 변경은 재시작 필요).
- [ ] 홈/마켓 국내 탭 100개 스크롤 + 필터 5종 정상
- ⚠️ `.env.local` 바꾸면 **dev 서버 재시작 필수**(env 는 재시작해야 반영). 화면 그대로면 `.next` stale 재시작.

## 주의·예상 이슈
- **이용신청(작업준비 2번) 누락이 제일 흔한 실패** — 키 있어도 "권한 없음" 나옴.
- 필드명: 공식 문서 기준(`ISU_CD`/`ISU_NM`/`TDD_CLSPRC`/`FLUC_RT`/`ACC_TRDVOL`/`ACC_TRDVAL`/`MKTCAP`). 혹시 다르면 위 curl JSON 보고 1줄 수정.
- `ISU_CD` 가 ISIN(12자리)으로 오면 자동으로 6자리 변환(`toShort`). 종목 클릭(=6자리) 호환.
- 신선도: **일별(장 마감 기준)** — 장중엔 직전 영업일. 실시간이 더 중요하면 KIS 30 으로 되돌리는 옵션도 가능.
- `.env.local` 절대 커밋 금지(운종 전용 Supabase 키 등과 같은 파일).

---
> STEP 162 = 국내 100 공식 OpenAPI. 전제 `9fc2e58`. 키 승인+이용신청 후 실행. 다음: 코스피/코스닥 featured+수급, 랭킹 로고·이유태그. 문서 묶어 갱신.
