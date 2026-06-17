<!-- 2026-06-15 -->
# STEP 258 — 펀드 route 업그레이드 (검색·유형 필터·필드 매핑)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_258_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (펀드 2단계 — 디렉토리용 데이터 레이어)
`/api/fund`가 펀드 **검색(펀드명)·유형 필터·페이지**를 지원하고, 응답을 깔끔한 shape로 매핑.
- 18만 개 전부 못 뿌리니 **검색·필터 중심**. `q`(펀드명)·`type`(유형)·`page`를 data.go.kr `fndNm`·`fndTp`·`pageNo`로 전달.
- `?debug=1` 유지 → Cowork가 `?debug=1&q=삼성`으로 **검색이 실제로 먹는지** 확인.
- UI 변경 없음(route만). 펀드 탭은 그대로 '준비 중' (다음 STEP에서 연결).

## 전제 상태
- 현재 HEAD: STEP 257 적용 후(`fd4b842`) + `.env.local` `DATA_GO_KR_KEY`(활성화 확인됨)
- 변경 **1파일**: `app/api/fund/route.ts` (**전체 교체**)

---

## 작업 1/1 — `app/api/fund/route.ts` (전체 교체)

```ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 금융위원회_펀드상품기본정보 (펀드표준코드) — data.go.kr
const BASE = "https://apis.data.go.kr/1160100/service/GetFundProductInfoService/getStandardCodeInfo";

type KrwRow = Record<string, unknown>;

export async function GET(req: NextRequest) {
  const key = (process.env.DATA_GO_KR_KEY || "").trim();
  const sp = req.nextUrl.searchParams;
  const debug = sp.get("debug") === "1";
  if (!key) return NextResponse.json({ funds: [], error: "no_key (.env.local DATA_GO_KR_KEY 확인)" });

  const q = (sp.get("q") || "").trim(); // 펀드명 검색
  const type = (sp.get("type") || "").trim(); // 펀드유형 (주식형 등)
  const page = sp.get("page") || "1";
  const rows = sp.get("rows") || "50";

  const params = new URLSearchParams();
  params.set("serviceKey", key);
  params.set("pageNo", page);
  params.set("numOfRows", debug ? "5" : rows);
  params.set("resultType", "json");
  if (q) params.set("fndNm", q);
  if (type) params.set("fndTp", type);

  try {
    const res = await fetch(`${BASE}?${params.toString()}`, { cache: "no-store" });
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
        snippet: text.slice(0, 1200),
      });
    }

    const response = json?.response as Record<string, unknown> | undefined;
    const body = response?.body as Record<string, unknown> | undefined;
    const itemsWrap = body?.items as Record<string, unknown> | undefined;
    const raw = itemsWrap?.item;
    const arr: KrwRow[] = Array.isArray(raw) ? (raw as KrwRow[]) : raw ? [raw as KrwRow] : [];

    const funds = arr.map((it) => ({
      code: String(it.srtnCd ?? "").trim(),
      stdCode: String(it.asoStdCd ?? "").trim(),
      name: String(it.fndNm ?? "").trim(),
      type: String(it.fndTp ?? "").trim(),
      setupDate: String(it.setpDt ?? "").trim(),
    }));

    const totalCount = Number(body?.totalCount ?? 0);
    return NextResponse.json({ funds, count: funds.length, totalCount, page: Number(page) });
  } catch (e) {
    return NextResponse.json({ funds: [], error: e instanceof Error ? e.message : String(e) });
  }
}
```

> `q`→`fndNm`, `type`→`fndTp`, `page`→`pageNo` 전달. 응답을 `{code,stdCode,name,type,setupDate}`로 매핑. `serviceKey`는 `URLSearchParams`가 한 번만 인코딩(16진수 키라 무변화). `?debug=1`이면 원본 일부 노출.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add app/api/fund/route.ts && git commit -m "feat(v7): 펀드 route 검색·유형 필터·필드 매핑 (q→fndNm, type→fndTp) (STEP 258)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 서버 재시작**
- [ ] 그럼 Cowork가 MCP로 `/api/fund?debug=1&q=삼성` 찔러서 **검색(fndNm) 먹는지 확인** → 먹으면 다음 STEP에서 펀드 디렉토리 UI 연결

## 주의·예상 이슈
- `fndNm`/`fndTp` 필터가 안 먹으면(totalCount 그대로) Cowork가 파라미터명 조정.
- **문서 TODO**(다음 갱신): STEP 254~258.

---
> STEP 258 = 펀드 route 검색·필터. 전제 STEP 257(`fd4b842`).
