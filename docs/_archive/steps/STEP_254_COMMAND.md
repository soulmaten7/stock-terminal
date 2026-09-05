<!-- 2026-06-15 -->
# STEP 254 — ETN 프로브 디버그 (KRX 실제 응답 확인)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_254_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (진단)
ETN 구독은 **승인 완료**(마이페이지 확인)인데 `/api/krx/etn`는 아직 `empty_or_not_subscribed`.
원인을 확정하려고 `/api/krx/etn?debug=1`에서 **KRX 원본 응답**(HTTP 상태·JSON 키·행 수·본문 일부)을 노출.
- 일반 호출(`/api/krx/etn`)은 **동작 그대로** — `?debug=1`일 때만 진단 JSON.
- 이걸로 판정: 401/403(권한 반영 지연·미구독) / 404(엔드포인트 틀림) / 200 empty(날짜·구독창) / 200 다른 블록키(파싱).

## 전제 상태
- 현재 HEAD: STEP 253 적용 후(`60fbd48`)
- 변경 **1파일**: `app/api/krx/etn/route.ts` (**전체 교체**)

---

## 작업 1/1 — `app/api/krx/etn/route.ts` (전체 교체)

```ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ETN 일별매매정보 — KRX 공식 OpenAPI. ?debug=1 이면 원본 응답 진단.
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

async function fetchRaw(basDd: string, key: string) {
  try {
    const res = await fetch(`${EP}?basDd=${basDd}`, {
      method: "GET",
      headers: { AUTH_KEY: key, Accept: "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = null;
    }
    const block = json
      ? ((json.OutBlock_1 as KrxRow[] | undefined) ?? (json.output as KrxRow[] | undefined) ?? null)
      : null;
    return { status: res.status, ok: res.ok, json, block, text };
  } catch (e) {
    return {
      status: 0,
      ok: false,
      json: null as Record<string, unknown> | null,
      block: null as KrxRow[] | null,
      text: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function GET(req: NextRequest) {
  const key = (process.env.KRX_API_KEY || "").trim();
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  if (!key) return NextResponse.json({ etns: [], source: "krx", error: "no_key" });

  const now = new Date();
  const diag: Array<Record<string, unknown>> = [];
  let rows: KrxRow[] = [];
  let usedDate = "";

  for (let i = 0; i < 8 && rows.length === 0; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const basDd = ymd(d);
    const r = await fetchRaw(basDd, key);
    const cnt = Array.isArray(r.block) ? r.block.length : 0;
    if (debug) {
      diag.push({
        basDd,
        status: r.status,
        ok: r.ok,
        jsonKeys: r.json ? Object.keys(r.json) : null,
        rowCount: cnt,
        snippet: r.json ? null : r.text.slice(0, 300),
      });
    }
    if (cnt > 0) {
      rows = r.block as KrxRow[];
      usedDate = basDd;
    }
  }

  if (debug) {
    return NextResponse.json({ diag, usedDate, rowCount: rows.length, firstRow: rows[0] ?? null });
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
}
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/krx/etn/route.ts && git commit -m "chore(v7): ETN 프로브 ?debug=1 진단 모드 (KRX 원본 응답 노출) (STEP 254)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 서버 재시작**
- [ ] 그럼 Cowork가 MCP로 `/api/krx/etn?debug=1` 찔러서 **KRX 실제 응답 판정**(상태코드·키·행수)

## 주의·예상 이슈
- 일반 동작 변경 0(`?debug=1`일 때만 진단). 데이터 확인되면 다음 STEP에서 ETN 탭 연결.
- **문서 TODO**(다음 갱신): STEP 254.

---
> STEP 254 = ETN 프로브 디버그. 전제 STEP 253(`60fbd48`).
