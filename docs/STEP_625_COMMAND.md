<!-- 2026-07-06 -->
# STEP 625 — VnMarketBoard (베트남 종목보드 + 수익률 크론)

> **목표**: market 탭 "준비 중" Placeholder → **실제 베트남 종목보드**. 야후 `.VN` 시세(현재가·1일)+`vn_stock_perf` 크론 조인(1주~6개월). JP/CN 보드 클론(AI 렌즈 컬럼·모바일 카드·바텀시트 그대로 승계).
> **VN은 전부 야후 `.VN`** — CN처럼 Eastmoney 우회 불필요 → `jpPerf`(순수 야후)가 정확한 클론 베이스.
> **Cowork이 이미 함**: `data/vn_symbols.json`(654종목·베트남어명) · `vn_names`(654·R3용) · `vn_stock_perf`·`vn_names` 테이블(MCP) · 마이그 035·036 파일.
> **전제**: STEP 623(`38e38bb`) 이후.
> 🔴 실행: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

## 편집/생성 (6파일 — 기존 파일 클론)

### 1) `lib/vnPerf.ts` (신규) — `lib/jpPerf.ts` 클론
- `jpPerf.ts`를 그대로 복사 → 아래만 변경:
  - `import symbols from "../data/cn_symbols.json"` 류 → **`import symbols from "../data/vn_symbols.json"`** (형식 `{sym,name,market}` 동일).
  - export 함수명 `computeJpPerf` → **`computeVnPerf`**.
  - 종가 소스: **전 종목 야후 `.VN` chart**(jpPerf가 이미 야후 chart 방식이면 그대로, 심볼만 vn_symbols). Eastmoney 분기 있으면 제거.
  - upsert 대상 테이블 `jp_stock_perf` → **`vn_stock_perf`** (컬럼 `symbol,r1w,r1m,r3m,r6m,updated_at` 동일).

### 2) `app/api/cron/vn-perf/route.ts` (신규) — `app/api/cron/cn-perf/route.ts` 클론
```ts
import { NextResponse } from "next/server";
import { computeVnPerf } from "@/lib/vnPerf";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await computeVnPerf();
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

### 3) `vercel.json` — vn-perf 크론 추가
```
찾기:
    { "path": "/api/cron/cn-perf", "schedule": "0 8 * * *" },
바꾸기:
    { "path": "/api/cron/cn-perf", "schedule": "0 8 * * *" },
    { "path": "/api/cron/vn-perf", "schedule": "0 8 * * *" },
```

### 4) `app/api/yahoo/vn-list/route.ts` (신규) — `app/api/yahoo/cn-list/route.ts` 클론
- `cn-list/route.ts` 복사 → 변경:
  - `import symbols from "@/data/cn_symbols.json"` → **`@/data/vn_symbols.json`**.
  - 조인 테이블 `cn_stock_perf` → **`vn_stock_perf`**.
  - **시세 소스 단순화**: cn-list는 HK=야후 / A주=별도였을 수 있음 → VN은 **전 종목 야후 `.VN` quote**(단일 경로). market 분기(hk/ss/sz) 로직 제거하고 모두 야후 quote로.
  - name = `vn_symbols.json`의 베트남어명(NAME_MAP 그대로).

### 5) `components/toolbox/VnMarketBoard.tsx` (신규) — `components/toolbox/JpMarketBoard.tsx` 클론
- `JpMarketBoard.tsx` 복사 → 변경(**AI 렌즈 컬럼·모바일 카드·바텀시트·시트 URL 동기화는 그대로 승계**):
  - fetch URL: `/api/yahoo/jp-list` → **`/api/yahoo/vn-list`**.
  - 통화: `formatPrice(…, 'JP')` → **`'VN'`** (₫·접미·소수0 — lib/currency.ts에 이미 추가됨).
  - 즐겨찾기/렌즈 이동의 `market`·`country` = `'JP'` → **`'VN'`**.
  - 서브탭: JP 단일이면 그대로 단일 리스트(전 종목). (HOSE/HNX 서브탭은 후속 — MVP는 단일.)
  - 종목명 표시: 베트남어명 앞 `CTCP ` 접두 제거하면 깔끔 → 표시 직전 `name.replace(/^CTCP\s+/i,'')` 정도만(선택).

### 6) `components/toolbox/ToolboxClient.tsx` — VN Placeholder를 보드로 교체
```
찾기:
          ) : country === 'CN' ? (
            <CnMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇻🇳" title="베트남 종목·상품 — 준비 중" desc="곧 제공됩니다" />
          )
바꾸기:
          ) : country === 'CN' ? (
            <CnMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <VnMarketBoard isLoggedIn={isLoggedIn} />
          )
```
+ 상단 import에 `import VnMarketBoard from './VnMarketBoard';` 추가(CnMarketBoard import 옆).

## 빌드 + perf 1회 채우기 + 눈검수
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```
- perf 스냅샷 즉시 채우기(크론 기다리지 말고 1회 실행):
```bash
cd ~/stock-terminal && (npm run dev >/tmp/vn_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
curl -s -H "authorization: Bearer $CRON_SECRET" "http://localhost:3333/api/cron/vn-perf" | head -c 200; echo
# 확인: {"ok":true,"computed":6xx,...}
```
- [ ] 클린 재시작(`pkill -f "next dev"; rm -rf .next && npm run dev`) 후 베트남 탭 → market: 종목표에 **베트남어명 + ₫가격 + 1일% + 1주~6개월 수익률 + AI 렌즈 컬럼**. 모바일 카드형·바텀시트 정상.
- [ ] VIC·VNM·VCB·HPG·FPT 뜨고 가격이 VND(예: 220,300₫).

## 커밋
```bash
cd ~/stock-terminal && git add lib/vnPerf.ts app/api/cron/vn-perf/route.ts app/api/yahoo/vn-list/route.ts components/toolbox/VnMarketBoard.tsx components/toolbox/ToolboxClient.tsx vercel.json data/vn_symbols.json supabase/migrations/035_vn_names.sql supabase/migrations/036_vn_stock_perf.sql docs/STEP_625_COMMAND.md && git commit -m "feat(vn): VnMarketBoard 종목보드 — 야후 .VN 시세 + vn_stock_perf 크론 + market 탭 배선 (654종목·베트남어명)" && git push
```

## ✅ 완료 시: 베트남 = 링크+피드+**종목보드** 라이브. 다음 = **R3 베트남 뉴스**(news-brief 라우트 VN 분기 + getVnName·vi 로케일) → 3중 검수 → 베트남 완성.
