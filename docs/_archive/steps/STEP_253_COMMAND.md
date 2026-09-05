<!-- 2026-06-15 -->
# STEP 253 — ETN 프로브: `/api/krx/etn` (KRX 구독 여부 직접 확인용)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_253_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (ETN 1단계 — 직접 확인)
ETN은 yahoo에 없지만 **KRX `etn_bydd_trd`(ETN 일별매매정보)** 엔드포인트가 있음. 단 KRX에서 그 상품 **이용신청**이 돼 있어야 데이터가 옴.
- 이 route를 만들어 두면 → Cowork(나)이 **MCP로 `/api/krx/etn`를 찔러서** 데이터가 오는지 확인.
  - 데이터 옴 → **구독돼 있음** → 다음 STEP에서 ETN 탭 연결.
  - 빈 값/에러 → **미구독** → 사용자가 KRX에서 'ETN 일별매매정보' 이용신청.
- UI 변경 없음(route만). ETN 탭은 그대로 '준비 중'.

## 전제 상태
- 현재 HEAD: STEP 252 적용 후
- 변경 **1파일**: `app/api/krx/etn/route.ts` (**신규**)
- 키: `.env.local` `KRX_API_KEY`(이미 있음). 커밋 금지.

---

## 작업 1/1 — `app/api/krx/etn/route.ts` (신규)

```ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ETN 일별매매정보 — KRX 공식 OpenAPI. 'ETN 일별매매정보' 이용신청 안 됐으면 빈 배열.
const EP = "http://data-dbg.krx.co.kr/svc/apis/sto/etn_bydd_trd";

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
function toShort(code: string): string {
  const c = code.trim();
  return c.length === 12 ? c.slice(3, 9) : c;
}

async function fetchOne(basDd: string, key: string): Promise<KrxRow[]> {
  try {
    const res = await fetch(`${EP}?basDd=${basDd}`, {
      method: "GET",
      headers: { AUTH_KEY: key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const j = await res.json();
    return (j.OutBlock_1 ?? j.output ?? []) as KrxRow[];
  } catch {
    return [];
  }
}

export async function GET() {
  const key = (process.env.KRX_API_KEY || "").trim();
  if (!key) return NextResponse.json({ etns: [], source: "krx", error: "no_key" });

  try {
    let rows: KrxRow[] = [];
    let usedDate = "";
    const now = new Date();
    for (let i = 0; i < 8 && rows.length === 0; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const basDd = ymd(d);
      const part = await fetchOne(basDd, key);
      if (part.length > 0) {
        rows = part;
        usedDate = basDd;
      }
    }
    if (rows.length === 0) {
      return NextResponse.json({ etns: [], source: "krx", error: "empty_or_not_subscribed" });
    }
    const etns = rows
      .map((r) => ({
        symbol: toShort(String(r.ISU_CD || "")),
        name: String(r.ISU_NM || "").trim(),
        price: num(r.TDD_CLSPRC),
        changePercent: num(r.FLUC_RT),
        volume: num(r.ACC_TRDVOL),
        tradeAmount: num(r.ACC_TRDVAL),
        marketCap: num(r.MKTCAP),
      }))
      .filter((s) => s.symbol && s.price > 0)
      .sort((a, b) => b.tradeAmount - a.tradeAmount);

    return NextResponse.json({ etns, source: "krx", basDd: usedDate, count: etns.length });
  } catch (e) {
    return NextResponse.json({ etns: [], source: "krx", error: e instanceof Error ? e.message : String(e) });
  }
}
```

> `/api/krx/ranking`과 동일 패턴, 엔드포인트만 `etn_bydd_trd`. 최신 영업일 8일 역추적. 구독 안 됐으면 `{etns:[], error:"empty_or_not_subscribed"}`.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/krx/etn/route.ts && git commit -m "feat(v7): ETN 프로브 route /api/krx/etn (KRX etn_bydd_trd, 구독 확인용) (STEP 253)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 서버 재시작**(새 route 로드)
- [ ] 그럼 Cowork가 MCP로 `/api/krx/etn` 찔러서 **데이터 오는지 직접 확인** → 구독 여부 판정

## 주의·예상 이슈
- UI 변경 0(route만). 데이터 오면 다음 STEP에서 ETN 탭 연결(1일 데이터부터).
- 엔드포인트명이 다르면(혹시) 빈 값 → 그래도 '구독/엔드포인트 문제'로 판정됨.
- **문서 TODO**(다음 갱신): STEP 248~253.

---
> STEP 253 = ETN 프로브 route. 전제 STEP 252. (돌린 뒤 Cowork가 MCP로 구독 확인)
