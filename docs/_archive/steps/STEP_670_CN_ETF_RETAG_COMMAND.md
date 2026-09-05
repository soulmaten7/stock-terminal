<!-- 2026-07-09 -->
# STEP 670 — 🇨🇳 CN ETF 오태깅 수정 (type 필드 + 종목별 통화)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 669 이후.
**목표(검수 #3):** A주 ETF 363개(상해 5xx 218 + 심천 159대 145)가 `market: 'ss'/'sz'`로 태그돼 **상해A/심천A 주식탭을 오염**시키고 ETF 탭엔 안 나옴. → `type`(stock/etf) 도입해 **주식탭에서 ETF 제외 + ETF 탭에 A주 ETF도 종목별 통화(CNY)로 표시.**
**대상:** `data/cn_symbols.json` · `app/api/yahoo/cn-list/route.ts` · `components/toolbox/CnMarketBoard.tsx`.

> 검수 실측: 상해A ETF 218/218 전부 ETF명("CHINAAMC SSE 50 ETF" 등)·심천A 159대 145. `market=='etf'` 412 = 전부 .HK ETF(HKD). A주 ETF는 이미 cn_stock_perf에 가격 있음(ss/sz 서빙됐으니) → **크론 변경 불필요.**

---

## 1. `data/cn_symbols.json` — `type` 필드 추가 (임시 스크립트)
```js
// scripts/cn_add_type.mjs — node scripts/cn_add_type.mjs
import fs from "node:fs";
const path = "data/cn_symbols.json";
const arr = JSON.parse(fs.readFileSync(path, "utf8"));
let etf = 0;
for (const s of arr) {
  const code = String(s.sym).split(".")[0];
  const isEtf =
    s.market === "etf" ||                              // 기존 HK ETF
    (s.market === "ss" && code[0] === "5") ||          // 상하이 펀드/ETF = 5xx (주식은 6xx)
    (s.market === "sz" && code.slice(0, 2) === "15");  // 심천 ETF = 15xxxx (주식은 000~003·300·301)
  s.type = isEtf ? "etf" : "stock";
  if (isEtf) etf++;
}
fs.writeFileSync(path, JSON.stringify(arr, null, 0));
console.log("etf", etf, "/ total", arr.length);
```
```bash
node scripts/cn_add_type.mjs
# 검증: 주식 서브탭별 stock 수 · etf 총계
python3 -c "
import json;from collections import Counter
d=json.load(open('data/cn_symbols.json'))
print('type분포', Counter(s['type'] for s in d))
for m in ['ss','sz','hk']:
    st=[s for s in d if s['market']==m and s['type']=='stock']
    print(m,'stock', len(st))
print('etf 총', sum(1 for s in d if s['type']=='etf'))
"
```
> 기대: 상해A stock ≈ 1,636→**1,418**(ETF 218 빠짐)·심천A stock ≈ 1,866→**~1,721**·etf 총 ≈ 412+363 ≈ **775**. (숫자는 대략 — 실측 확인.)

## 2. `app/api/yahoo/cn-list/route.ts` — 필터 + 종목별 cur
`type`을 Sym에 반영하고, 필터를 type 기준으로:
```ts
type Sym = { sym: string; name: string; market: string; type?: string };
// ...
const market = (new URL(req.url).searchParams.get("market") || "hk").trim();
const SYMS = new Set(
  ALL_SYMS.filter((s) =>
    market === "etf" ? s.type === "etf"                       // ETF 탭 = 전 시장 ETF
                     : s.market === market && s.type !== "etf" // 주식 탭 = 그 시장 주식만
  ).map((s) => s.sym)
);
```
- 반환 Item에 **`cur` 추가** (종목별 통화): `cur: (S.market === "ss" || S.market === "sz") ? "CN" : "HK"` — symbol→market 맵에서 조회. (ETF 탭은 HK/CN 혼재하므로 종목별 필수.)
  - `const MKT = new Map(ALL_SYMS.map(s=>[s.sym, s.market]));` 후 각 행에 `cur` 세팅.
- Item 타입에 `cur: string` 추가.

## 3. `components/toolbox/CnMarketBoard.tsx` — 가격 통화 per-item
- `Row` 타입에 `cur?: string` 추가.
- 가격 포맷을 **`formatPrice(price, row.cur || CUR[tab])`** 로(주식탭은 CUR[tab]로 충분하나, ETF탭 혼재 통화 위해 row.cur 우선).
- 표·미리보기·모바일 시트에서 가격 표시하는 `formatPrice(...CUR[tab])` 호출부를 `row.cur || CUR[tab]`로 교체.
> `CUR` 상수(hk/ss/sz/etf)는 유지(폴백). 핵심은 ETF 탭에서 각 행이 자기 통화로.

---

## 4. 검증 (3번 생각) → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 로컬(dev):
  - `curl ".../cn-list?market=ss" | python3 -c "import sys,json;d=json.load(sys.stdin)['items'];import re;print('ss 종목',len(d),'| ETF명 섞임',sum(1 for x in d if re.search(r'ETF|基金|指数',x['name'],re.I)))"` → **ETF명 0**이어야 함(정화 확인).
  - 심천A(sz)도 동일.
  - `curl ".../cn-list?market=etf"` → **A주 ETF(SSE 50 ETF 등) 포함** + 각 항목 `cur`(CN/HK) 정상.
  - 화면: 상해A/심천A 표에 ETF 안 보임 · ETF 탭에 HK+A주 ETF 혼재, **A주 ETF는 CNY(₩ 아님)로** 표시.
- console.log 금지.
```bash
rm -f scripts/cn_add_type.mjs   # 임시(또는 보존 판단)
git add data/cn_symbols.json app/api/yahoo/cn-list/route.ts components/toolbox/CnMarketBoard.tsx
git commit -m "fix(cn): ETF 오태깅 수정 — type 필드로 주식탭 ETF 제외 + ETF탭에 A주 ETF 종목별 통화(CNY) 표시"
git push
```

## Cowork에게 보고
1. 상해A/심천A ETF명 0(정화) + stock 수.
2. ETF 탭에 A주 ETF 포함 + CNY 통화 정상.
→ 남은 검수 결정(완전성): **#1 VN HNX 추가 여부 · #2 CN A주 소형주 ~1,600 확장 여부** (은태님 판단) → 그 후 Round 2(Chrome 라이브)·Round 3(교차 레퍼런스).
