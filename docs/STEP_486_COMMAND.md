<!-- 2026-07-01 -->
# STEP 486 — 일본 자산군 확충: ETF(레버리지·인버스 포함) + 리츠(J-REIT) 서브탭

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_486_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
일본 종목·상품을 **종목 / ETF / 리츠 3개 서브탭**으로 (현재 종목만). 특히 **레버리지·인버스 ETF**(1570 日経레버리지=일본 거래량 1위, 1357 더블인버스 등)와 **J-REIT**를 제대로 포함. 배지도 일본어(レバレッジ·インバース·2倍) 인식.
- 방식: `jp_symbols.json`에 etf/reit 티커 추가(type) → jpPerf가 전 종목 perf 계산 → jp-list 라우트가 `?type=`로 분리 → JpMarketBoard 서브탭.
- ⚠️ API 라우트 변경 → 클린 재시작 + 크론 재시딩 필요.

---

## 1) `data/jp_symbols.json` — ETF·REIT 추가
**찾을 것** (마지막 종목 항목 + 배열 끝):
```json
  { "sym": "8630.T", "name": "SOMPO HD", "type": "stock" }
]
```
**바꿀 것** (뒤에 ETF 24 + REIT 20 추가):
```json
  { "sym": "8630.T", "name": "SOMPO HD", "type": "stock" },
  { "sym": "1570.T", "name": "NF 日経平均レバレッジ(2倍)", "type": "etf" },
  { "sym": "1357.T", "name": "NF 日経平均ダブルインバース(-2倍)", "type": "etf" },
  { "sym": "1571.T", "name": "NF 日経平均インバース(-1倍)", "type": "etf" },
  { "sym": "1579.T", "name": "日経平均ブル2倍上場投信", "type": "etf" },
  { "sym": "1360.T", "name": "日経平均ベア2倍上場投信", "type": "etf" },
  { "sym": "1358.T", "name": "上場日経レバレッジ(2倍)", "type": "etf" },
  { "sym": "1459.T", "name": "楽天ETF 日経ダブルブル", "type": "etf" },
  { "sym": "1568.T", "name": "TOPIXブル2倍上場投信", "type": "etf" },
  { "sym": "1321.T", "name": "NF 日経225連動型", "type": "etf" },
  { "sym": "1306.T", "name": "NF TOPIX連動型", "type": "etf" },
  { "sym": "1330.T", "name": "上場225(日経225)", "type": "etf" },
  { "sym": "1329.T", "name": "iシェアーズ・コア日経225", "type": "etf" },
  { "sym": "1348.T", "name": "MAXIS TOPIX", "type": "etf" },
  { "sym": "1547.T", "name": "上場S&P500米国株", "type": "etf" },
  { "sym": "2558.T", "name": "MAXIS米国株S&P500", "type": "etf" },
  { "sym": "1655.T", "name": "iシェアーズS&P500", "type": "etf" },
  { "sym": "1545.T", "name": "NF NASDAQ100連動", "type": "etf" },
  { "sym": "2631.T", "name": "MAXISナスダック100", "type": "etf" },
  { "sym": "1546.T", "name": "NF ダウ30連動", "type": "etf" },
  { "sym": "1489.T", "name": "NF 日経高配当株50", "type": "etf" },
  { "sym": "1478.T", "name": "iシェアーズMSCIジャパン高配当", "type": "etf" },
  { "sym": "1615.T", "name": "NF 東証銀行業", "type": "etf" },
  { "sym": "1540.T", "name": "純金上場信託(金の果実)", "type": "etf" },
  { "sym": "1326.T", "name": "SPDRゴールド・シェア", "type": "etf" },
  { "sym": "8951.T", "name": "日本ビルファンド投資法人", "type": "reit" },
  { "sym": "8952.T", "name": "ジャパンリアルエステイト", "type": "reit" },
  { "sym": "3462.T", "name": "野村不動産マスターファンド", "type": "reit" },
  { "sym": "3283.T", "name": "日本プロロジスリート", "type": "reit" },
  { "sym": "8953.T", "name": "日本都市ファンド投資法人", "type": "reit" },
  { "sym": "3234.T", "name": "森ヒルズリート投資法人", "type": "reit" },
  { "sym": "8967.T", "name": "日本ロジスティクスファンド", "type": "reit" },
  { "sym": "3269.T", "name": "アドバンス・レジデンス", "type": "reit" },
  { "sym": "8984.T", "name": "大和ハウスリート投資法人", "type": "reit" },
  { "sym": "3466.T", "name": "ラサールロジポート投資法人", "type": "reit" },
  { "sym": "8960.T", "name": "ユナイテッド・アーバン", "type": "reit" },
  { "sym": "3281.T", "name": "GLP投資法人", "type": "reit" },
  { "sym": "8972.T", "name": "KDX不動産投資法人", "type": "reit" },
  { "sym": "3487.T", "name": "CREロジスティクスファンド", "type": "reit" },
  { "sym": "8963.T", "name": "インヴィンシブル投資法人", "type": "reit" },
  { "sym": "3226.T", "name": "日本アコモデーションファンド", "type": "reit" },
  { "sym": "8955.T", "name": "日本プライムリアルティ", "type": "reit" },
  { "sym": "3492.T", "name": "タカラレーベン不動産", "type": "reit" },
  { "sym": "2971.T", "name": "エスコンジャパンリート", "type": "reit" },
  { "sym": "3459.T", "name": "サムティ・レジデンシャル", "type": "reit" }
]
```

## 2) `lib/jpPerf.ts` — 전 종목(stock+etf+reit) perf 계산
**찾을 것:**
```ts
const STOCK_SYMS: string[] = (symbols as Sym[])
  .filter((s) => s.type === "stock")
  .map((s) => s.sym);
```
**바꿀 것:**
```ts
const STOCK_SYMS: string[] = (symbols as Sym[])
  .filter((s) => s.type === "stock" || s.type === "etf" || s.type === "reit")
  .map((s) => s.sym);
```

## 3) `app/api/yahoo/jp-list/route.ts` — `?type=` 분리
**3-A. 모듈 상단 심볼 필터를 전체 로드로.** 찾을 것:
```ts
const STOCK_SYMS: string[] = (symbols as Sym[])
  .filter((s) => s.type === "stock")
  .map((s) => s.sym);
```
바꿀 것:
```ts
const ALL_SYMS = symbols as Sym[];
```

**3-B. `GET` 안에서 type별 심볼 선택 + 캐시 분리.** 찾을 것:
```ts
export async function GET() {
  // 15분 인메모리 캐시
  if (cache && Date.now() - cache.at < 15 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  // 100개씩 묶어 batch quote, 동시 6청크까지. (~62 청크 × 6동시 — 야후 부담 최소화)
  const chunks = chunk(STOCK_SYMS, 100);
```
바꿀 것:
```ts
const cacheByType = new Map<string, { at: number; data: { items: Item[] } }>();

export async function GET(req: Request) {
  const type = (new URL(req.url).searchParams.get("type") || "stock").trim();
  const SYMS = ALL_SYMS.filter((s) => s.type === type).map((s) => s.sym);

  // 15분 인메모리 캐시(type별)
  const hit = cacheByType.get(type);
  if (hit && Date.now() - hit.at < 15 * 60 * 1000) {
    return NextResponse.json(hit.data);
  }

  // 100개씩 묶어 batch quote
  const chunks = chunk(SYMS, 100);
```

**3-C. 응답 캐시 저장부.** 찾을 것:
```ts
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
```
바꿀 것:
```ts
  const data = { items };
  cacheByType.set(type, { at: Date.now(), data });
  return NextResponse.json(data);
}
```

> ⚠️ 기존 `let cache: ... | null = null;` 선언 줄은 더 이상 안 쓰이면 지우거나 그대로 둬도 무방(빌드 경고 시 삭제).

## 4) `components/toolbox/JpMarketBoard.tsx` — 3개 서브탭
**4-A. SubTab 타입.** 찾을 것:
```tsx
type SubTab = 'stock';
```
바꿀 것:
```tsx
type SubTab = 'stock' | 'etf' | 'reit';
```

**4-B. SUBTABS.** 찾을 것:
```tsx
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '종목' },
];
```
바꿀 것:
```tsx
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '종목' },
  { key: 'etf', label: 'ETF' },
  { key: 'reit', label: '리츠' },
];
```

**4-C. ENDPOINTS.** 찾을 것:
```tsx
const ENDPOINTS: Record<SubTab, string> = {
  stock: '/api/yahoo/jp-list',
};
```
바꿀 것:
```tsx
const ENDPOINTS: Record<SubTab, string> = {
  stock: '/api/yahoo/jp-list',
  etf: '/api/yahoo/jp-list?type=etf',
  reit: '/api/yahoo/jp-list?type=reit',
};
```

**4-D. CACHE_KEYS.** 찾을 것:
```tsx
const CACHE_KEYS: Record<SubTab, string> = { stock: 'jp-stock-list' };
```
바꿀 것:
```tsx
const CACHE_KEYS: Record<SubTab, string> = { stock: 'jp-stock-list', etf: 'jp-etf-list', reit: 'jp-reit-list' };
```

## 5) `lib/avatar.ts` — 레버리지 배지 일본어 인식
**찾을 것:**
```ts
  const inverse = /인버스|\bINVERSE\b|\bBEAR\b/.test(n);
  let mult: string | null = null;
  if (/\b3\s*X\b|3배/.test(n)) mult = "3x";
  else if (/\b2\s*X\b|2배/.test(n)) mult = "2x";
  else if (/레버리지|\bLEVERAGE\b|\bBULL\b/.test(n)) mult = "2x";
```
**바꿀 것:**
```ts
  const inverse = /인버스|\bINVERSE\b|\bBEAR\b|インバース|ベア/.test(n);
  let mult: string | null = null;
  if (/\b3\s*X\b|3배|3倍/.test(n)) mult = "3x";
  else if (/\b2\s*X\b|2배|2倍|ダブル/.test(n)) mult = "2x";
  else if (/레버리지|\bLEVERAGE\b|\bBULL\b|レバレッジ|ブル/.test(n)) mult = "2x";
```

---

## 6) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 7) 크론 재시딩 (ETF·REIT perf까지)
```bash
curl -s -H "Authorization: Bearer $(grep -m1 CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')" http://localhost:3333/api/cron/jp-perf
```
> `computed`가 ~116(72+44)으로 늘면 성공.

## 8) 검증 (localhost:3333)
- [ ] 🇯🇵 일본 → 종목·상품에 **종목 / ETF / 리츠** 3개 서브탭.
- [ ] ETF 탭: **1570 日経レバレッジ에 2x 배지**, 1357 더블인버스에 인버스(빨강) 2x 배지. 시세·거래대금 정상.
- [ ] 리츠 탭: 日本ビルファンド 등 J-REIT 시세.

## 9) 커밋
```bash
git add data/jp_symbols.json lib/jpPerf.ts app/api/yahoo/jp-list/route.ts components/toolbox/JpMarketBoard.tsx lib/avatar.ts && git commit -m "feat(jp): 종목·상품 ETF(레버리지·인버스)+리츠(J-REIT) 서브탭 + 배지 일본어 인식 (STEP 486)" && git push
```

## ⚠️ 다음
- **미국도 동일 확충** — 리츠(REIT) 서브탭 + ETF에 레버리지·인버스(TQQQ·SOXL·SQQQ) 강조 + ETN. (US STEP 후속)
- KR은 이미 주식·ETF·ETN·리츠 완비.
