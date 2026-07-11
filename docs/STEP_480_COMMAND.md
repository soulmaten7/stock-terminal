<!-- 2026-07-01 -->
# STEP 480 — 일본 종목·상품 (JpMarketBoard: 데이터+크론+컴포넌트) · US 미러

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_480_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
일본 탭 "종목·상품"을 라이브로. **US 보드 구조를 그대로 미러**(yahoo-finance2 `.T` 티커 + 리스트 라우트 + perf 크론 스냅샷). 무거운 파일은 **`cp`로 US 파일 복제 후 소수 편집** → 안전.
- 데이터: `jp_symbols.json`(닛케이 주요 ~70) → yahoo `quote`(현재가·1일·1년·거래대금) + `jp_stock_perf` 크론 조인(1주~6개월).
- ⚠️ **`jp_stock_perf` 테이블은 이미 생성됨**(Cowork MCP). 라우트 신설 → 클린 재시작 필요.

---

## 1) 신규 `data/jp_symbols.json` (전체 생성)
```json
[
  { "sym": "7203.T", "name": "トヨタ自動車", "type": "stock" },
  { "sym": "6758.T", "name": "ソニーグループ", "type": "stock" },
  { "sym": "9984.T", "name": "ソフトバンクグループ", "type": "stock" },
  { "sym": "8306.T", "name": "三菱UFJフィナンシャル", "type": "stock" },
  { "sym": "6861.T", "name": "キーエンス", "type": "stock" },
  { "sym": "9983.T", "name": "ファーストリテイリング", "type": "stock" },
  { "sym": "6098.T", "name": "リクルートHD", "type": "stock" },
  { "sym": "8058.T", "name": "三菱商事", "type": "stock" },
  { "sym": "6501.T", "name": "日立製作所", "type": "stock" },
  { "sym": "8035.T", "name": "東京エレクトロン", "type": "stock" },
  { "sym": "6857.T", "name": "アドバンテスト", "type": "stock" },
  { "sym": "4063.T", "name": "信越化学工業", "type": "stock" },
  { "sym": "9432.T", "name": "日本電信電話(NTT)", "type": "stock" },
  { "sym": "9433.T", "name": "KDDI", "type": "stock" },
  { "sym": "7974.T", "name": "任天堂", "type": "stock" },
  { "sym": "6902.T", "name": "デンソー", "type": "stock" },
  { "sym": "7267.T", "name": "ホンダ", "type": "stock" },
  { "sym": "8316.T", "name": "三井住友FG", "type": "stock" },
  { "sym": "8411.T", "name": "みずほFG", "type": "stock" },
  { "sym": "6367.T", "name": "ダイキン工業", "type": "stock" },
  { "sym": "4519.T", "name": "中外製薬", "type": "stock" },
  { "sym": "6594.T", "name": "ニデック", "type": "stock" },
  { "sym": "6702.T", "name": "富士通", "type": "stock" },
  { "sym": "6503.T", "name": "三菱電機", "type": "stock" },
  { "sym": "7741.T", "name": "HOYA", "type": "stock" },
  { "sym": "4568.T", "name": "第一三共", "type": "stock" },
  { "sym": "8001.T", "name": "伊藤忠商事", "type": "stock" },
  { "sym": "8031.T", "name": "三井物産", "type": "stock" },
  { "sym": "2914.T", "name": "日本たばこ産業(JT)", "type": "stock" },
  { "sym": "4502.T", "name": "武田薬品工業", "type": "stock" },
  { "sym": "6981.T", "name": "村田製作所", "type": "stock" },
  { "sym": "7751.T", "name": "キヤノン", "type": "stock" },
  { "sym": "6301.T", "name": "コマツ", "type": "stock" },
  { "sym": "8766.T", "name": "東京海上HD", "type": "stock" },
  { "sym": "9020.T", "name": "JR東日本", "type": "stock" },
  { "sym": "4661.T", "name": "オリエンタルランド", "type": "stock" },
  { "sym": "6273.T", "name": "SMC", "type": "stock" },
  { "sym": "6954.T", "name": "ファナック", "type": "stock" },
  { "sym": "4543.T", "name": "テルモ", "type": "stock" },
  { "sym": "7011.T", "name": "三菱重工業", "type": "stock" },
  { "sym": "8053.T", "name": "住友商事", "type": "stock" },
  { "sym": "8002.T", "name": "丸紅", "type": "stock" },
  { "sym": "9022.T", "name": "JR東海", "type": "stock" },
  { "sym": "4901.T", "name": "富士フイルムHD", "type": "stock" },
  { "sym": "6752.T", "name": "パナソニックHD", "type": "stock" },
  { "sym": "7269.T", "name": "スズキ", "type": "stock" },
  { "sym": "7201.T", "name": "日産自動車", "type": "stock" },
  { "sym": "8267.T", "name": "イオン", "type": "stock" },
  { "sym": "3382.T", "name": "セブン&アイHD", "type": "stock" },
  { "sym": "9613.T", "name": "NTTデータグループ", "type": "stock" },
  { "sym": "6146.T", "name": "ディスコ", "type": "stock" },
  { "sym": "6920.T", "name": "レーザーテック", "type": "stock" },
  { "sym": "8591.T", "name": "オリックス", "type": "stock" },
  { "sym": "8725.T", "name": "MS&ADインシュアランス", "type": "stock" },
  { "sym": "4452.T", "name": "花王", "type": "stock" },
  { "sym": "2802.T", "name": "味の素", "type": "stock" },
  { "sym": "4523.T", "name": "エーザイ", "type": "stock" },
  { "sym": "6971.T", "name": "京セラ", "type": "stock" },
  { "sym": "6762.T", "name": "TDK", "type": "stock" },
  { "sym": "5108.T", "name": "ブリヂストン", "type": "stock" },
  { "sym": "7270.T", "name": "SUBARU", "type": "stock" },
  { "sym": "7259.T", "name": "アイシン", "type": "stock" },
  { "sym": "6326.T", "name": "クボタ", "type": "stock" },
  { "sym": "4578.T", "name": "大塚HD", "type": "stock" },
  { "sym": "9101.T", "name": "日本郵船", "type": "stock" },
  { "sym": "5401.T", "name": "日本製鉄", "type": "stock" },
  { "sym": "8801.T", "name": "三井不動産", "type": "stock" },
  { "sym": "8802.T", "name": "三菱地所", "type": "stock" },
  { "sym": "9434.T", "name": "ソフトバンク", "type": "stock" },
  { "sym": "4689.T", "name": "LINEヤフー", "type": "stock" },
  { "sym": "6178.T", "name": "日本郵政", "type": "stock" },
  { "sym": "7182.T", "name": "ゆうちょ銀行", "type": "stock" },
  { "sym": "8630.T", "name": "SOMPO HD", "type": "stock" }
]
```

## 2) `lib/jpPerf.ts` — US 복제 후 편집
```bash
cp lib/usPerf.ts lib/jpPerf.ts
```
`lib/jpPerf.ts`에서 **3곳**만 수정:
- `import symbols from "../data/us_symbols.json";` → `import symbols from "../data/jp_symbols.json";`
- `export async function computeUsPerf(` → `export async function computeJpPerf(`
- `sb.from("us_stock_perf")` → `sb.from("jp_stock_perf")`
> yahoo `chart`는 `.T` 티커 그대로 동작. 나머지(룩백·ret·mapLimit) 그대로.

## 3) `app/api/cron/jp-perf/route.ts` — US 크론 복제 후 편집
```bash
cp app/api/cron/us-perf/route.ts app/api/cron/jp-perf/route.ts
```
`app/api/cron/jp-perf/route.ts`에서 **2곳** 수정:
- `import { computeUsPerf } from "@/lib/usPerf";` → `import { computeJpPerf } from "@/lib/jpPerf";`
- `const r = await computeUsPerf();` → `const r = await computeJpPerf();`

## 4) `app/api/yahoo/jp-list/route.ts` — US 리스트 복제 후 편집
```bash
cp app/api/yahoo/us-list/route.ts app/api/yahoo/jp-list/route.ts
```
`app/api/yahoo/jp-list/route.ts`에서 **2곳** 수정:
- `import symbols from "@/data/us_symbols.json";` → `import symbols from "@/data/jp_symbols.json";`
- `sb.from("us_stock_perf")` → `sb.from("jp_stock_perf")`
> yahoo `quote`는 `.T` 티커 그대로 동작(가격=엔). 나머지 그대로.

## 5) `components/toolbox/JpMarketBoard.tsx` — US 보드 복제 후 편집
```bash
cp components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx
```
`JpMarketBoard.tsx`에서 수정:
- 컴포넌트명: `export default function UsMarketBoard(` → `export default function JpMarketBoard(`
- `type SubTab = 'stock' | 'etf';` → `type SubTab = 'stock';`
- SUBTABS 배열:
  ```tsx
  const SUBTABS: { key: SubTab; label: string }[] = [
    { key: 'stock', label: '주식' },
    { key: 'etf', label: 'ETF' },
  ];
  ```
  →
  ```tsx
  const SUBTABS: { key: SubTab; label: string }[] = [
    { key: 'stock', label: '종목' },
  ];
  ```
- ENDPOINTS:
  ```tsx
  const ENDPOINTS: Record<SubTab, string> = {
    stock: '/api/yahoo/us-list',
    etf: '/api/yahoo/us-etf-performance',
  };
  ```
  →
  ```tsx
  const ENDPOINTS: Record<SubTab, string> = {
    stock: '/api/yahoo/jp-list',
  };
  ```
- CACHE_KEYS:
  ```tsx
  const CACHE_KEYS: Record<SubTab, string> = { stock: 'us-stock-list', etf: 'us-etf' };
  ```
  →
  ```tsx
  const CACHE_KEYS: Record<SubTab, string> = { stock: 'jp-stock-list' };
  ```
- **모든 `formatPrice(…, 'US')` → `formatPrice(…, 'JP')`** (현재가 표시 전부).
- 관심종목 body: `market: 'US', country: 'US'` → `market: 'JP', country: 'JP'`.
> 이러면 US에 이미 적용된 모바일 카드형·시트·정렬 헤더(STEP 476)가 그대로 따라옴.

## 6) `lib/currency.ts` — 엔(¥) 추가
**찾을 것:**
```ts
  US: { sym: '$', pos: 'pre', frac: 2, locale: 'en-US' },
};
```
**바꿀 것:**
```ts
  US: { sym: '$', pos: 'pre', frac: 2, locale: 'en-US' },
  JP: { sym: '¥', pos: 'pre', frac: 0, locale: 'ja-JP' },
};
```

## 7) `components/toolbox/ToolboxClient.tsx` — 일본 보드 배선
**7-A.** `UsMarketBoard` import 줄 아래에 추가:
```tsx
import JpMarketBoard from './JpMarketBoard';
```
**7-B. 종목 렌더의 일본 플레이스홀더를 실제 보드로.** 찾을 것:
```tsx
          ) : country === 'US' ? (
            <UsMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <Placeholder emoji="🇯🇵" title="일본 종목 — 준비 중" desc="종목·시세는 다음 업데이트에 추가돼요." />
          )
```
바꿀 것:
```tsx
          ) : country === 'US' ? (
            <UsMarketBoard isLoggedIn={isLoggedIn} />
          ) : (
            <JpMarketBoard isLoggedIn={isLoggedIn} />
          )
```

## 8) `vercel.json` — jp-perf 크론 추가
**찾을 것:**
```json
    { "path": "/api/cron/kr-perf", "schedule": "0 10 * * *" }
  ]
```
**바꿀 것:** (일본 장 마감 후, 미국보다 앞. 08:00 UTC = 17:00 JST)
```json
    { "path": "/api/cron/kr-perf", "schedule": "0 10 * * *" },
    { "path": "/api/cron/jp-perf", "schedule": "0 8 * * *" }
  ]
```

---

## 9) 빌드 + 클린 재시작
```bash
npm run build
```
성공 시:
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 10) jp_stock_perf 최초 1회 채우기 (1주~6개월 수익률용)
```bash
curl -s -H "Authorization: Bearer $(grep -m1 CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')" http://localhost:3333/api/cron/jp-perf
```
> `{"ok":true,"computed":70...}` 나오면 성공(야후 호출로 1~2분). 안 채워도 현재가·1일·1년·거래대금은 즉시 뜸(1주~6개월만 "—").

## 11) 검증 (localhost:3333)
- [ ] 🇯🇵 일본 → 종목·상품: 도요타·소니·키엔스 등 **일본 종목 리스트 + 현재가(¥) + 1일% + 거래대금 정렬**.
- [ ] 기간 드롭다운(1일~1년), 정렬, 검색, 관심⭐, 모바일 카드형/시트 정상.
- [ ] 크론 채운 뒤 1주~6개월 수익률도 표시.

## 12) 커밋 (배포는 사용자 판단)
```bash
git add data/jp_symbols.json lib/jpPerf.ts app/api/cron/jp-perf/route.ts app/api/yahoo/jp-list/route.ts components/toolbox/JpMarketBoard.tsx lib/currency.ts components/toolbox/ToolboxClient.tsx vercel.json && git commit -m "feat(jp): 일본 종목·상품(JpMarketBoard) — yahoo .T + jp_stock_perf 크론 + 엔 통화 (US 미러) (STEP 480)"
```
> **배포 후 prod에서도 크론 1회**: `curl -H "Authorization: Bearer <CRON_SECRET>" https://onetrillion.app/api/cron/jp-perf` (또는 Vercel Cron 수동 Run). 이후 매일 자동(08 UTC).

## ⚠️ 노트
- jp_symbols는 닛케이 주요 ~70(확장 가능). 야후가 없는 티커는 자동 스킵(안 깨짐).
- ETF·리츠 서브탭은 이번 범위 밖(일본은 종목만). 다음 = 일본 모아보기 피드(뉴스 Google News ja·공시 EDINET·거시 BOJ).
