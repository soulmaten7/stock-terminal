<!-- 2026-06-15 -->
# STEP 257 — 펀드 프로브: `/api/fund` (data.go.kr 펀드표준코드 응답 확인)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_257_COMMAND.md 파일 내용대로 실행해줘`

## 전제 (중요)
- **`.env.local`에 `DATA_GO_KR_KEY=...` 추가돼 있어야 함** (data.go.kr 일반 인증키, 승인 완료). 커밋 금지.
  - 아직이면: `.env.local` 파일에 `DATA_GO_KR_KEY=발급받은키` 한 줄 추가 후 진행.
- 현재 HEAD: STEP 256 적용 후(`e9564f3`)
- 변경 **1파일**: `app/api/fund/route.ts` (**신규**)

## 목표 (펀드 1단계 — 응답 구조 확인)
금융위원회_펀드상품기본정보(`getStandardCodeInfo`)를 호출해 **펀드 목록**을 받아오는 프로브.
- `/api/fund?debug=1` → KRX 응답 원본(상태·포맷·필드) 노출 → Cowork가 보고 **펀드 디렉토리** 설계.
- `/api/fund` (일반) → `{funds:[...], count, totalCount}`.
- UI 변경 없음(route만). 펀드 탭은 그대로 '준비 중'.

---

## 작업 1/1 — `app/api/fund/route.ts` (신규)

```ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 금융위원회_펀드상품기본정보 (펀드표준코드) — data.go.kr
const BASE = "https://apis.data.go.kr/1160100/service/GetFundProductInfoService/getStandardCodeInfo";

type FundRow = Record<string, unknown>;

export async function GET(req: NextRequest) {
  const key = (process.env.DATA_GO_KR_KEY || "").trim();
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  if (!key) return NextResponse.json({ funds: [], error: "no_key (.env.local DATA_GO_KR_KEY 확인)" });

  const url =
    `${BASE}?serviceKey=${encodeURIComponent(key)}` +
    `&pageNo=1&numOfRows=${debug ? "5" : "100"}&resultType=json`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = null;
    }

    if (debug) {
      return NextResponse.json({
        status: res.status,
        ok: res.ok,
        parsed: json ? "json" : "not_json(xml?)",
        snippet: text.slice(0, 900),
      });
    }

    // data.go.kr 표준 구조: response.body.items.item[]
    const response = json?.response as Record<string, unknown> | undefined;
    const body = response?.body as Record<string, unknown> | undefined;
    const itemsWrap = body?.items as Record<string, unknown> | undefined;
    const raw = itemsWrap?.item;
    const funds: FundRow[] = Array.isArray(raw) ? (raw as FundRow[]) : raw ? [raw as FundRow] : [];
    const totalCount = (body?.totalCount as number | string | undefined) ?? null;

    return NextResponse.json({ funds, count: funds.length, totalCount });
  } catch (e) {
    return NextResponse.json({ funds: [], error: e instanceof Error ? e.message : String(e) });
  }
}
```

> 키는 `process.env.DATA_GO_KR_KEY`에서만 읽음(코드에 키 값 절대 하드코딩 금지). `?debug=1`이면 원본 응답 일부를 그대로 노출 → 필드명·포맷(JSON/XML)·totalCount 확인용.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/fund/route.ts && git commit -m "feat(v7): 펀드 프로브 route /api/fund (data.go.kr getStandardCodeInfo, 디렉토리 확인용) (STEP 257)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `.env.local`에 `DATA_GO_KR_KEY` 있는지 확인(없으면 추가)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 서버 재시작**(새 route + .env 반영)
- [ ] 그럼 Cowork가 MCP로 `/api/fund?debug=1` 찔러서 **응답 구조 확인** → 펀드 디렉토리 설계

## 주의·예상 이슈
- 응답이 XML로 오면(`resultType` 무시) debug snippet에 `<?xml`이 보임 → Cowork가 파라미터/파싱 조정.
- 키 오류면 snippet에 returnReasonCode(예: SERVICE_KEY_IS_NOT_REGISTERED) → Encoding/Decoding 키 교체 등 안내.
- **문서 TODO**(다음 갱신): STEP 254·255·256·257.

---
> STEP 257 = 펀드 프로브. 전제 STEP 256(`e9564f3`) + `.env.local` DATA_GO_KR_KEY.
