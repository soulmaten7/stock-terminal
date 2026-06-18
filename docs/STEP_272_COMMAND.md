<!-- 2026-06-18 -->
# STEP 272 — 국내 영숫자 단축코드(0193T0 등) 차트·정보 깨짐 전면 수정

## 🔧 실행 (Sonnet — 정확한 편집 명세 제공, 기계적 치환)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_272_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: `b00d322` (마지막 코드 = STEP 271 `8670ba2` 위 문서커밋). 빌드 ✓.
- **결과 커밋 예정**: STEP 272.

---

## 🎯 목표 (왜 고치나)

KRX가 **단일종목 레버리지/인버스 등 신상품**에 영문이 섞인 단축코드를 발급한다(예: `0193T0` KODEX SK하이닉스단일종목레버리지, `0167A0`, `0195S0`, `0197X0`). 그런데 코드 전반이 "국내 종목 = 숫자 6자리"라는 가정으로 `/^\d{6}$/` 정규식을 써서 판정한다. 그래서 이 ETF들이 **미국 종목으로 오인**된다.

**증상**:
- 홈 ETF 미리보기 차트 = "차트 데이터 없음" (Yahoo에 `.KS` 안 붙이고 조회 → 0건).
- 종목 상세 `/stock/0193T0` = 국내(if)도 미국(else if)도 아니라 **양쪽 다 건너뜀** → 정보패널·차트 통째 빈 화면.
- 공시 = 미국으로 오인 → DART 대신 SEC 조회.
- 증권사 거래링크 · 호가 · 체결 · 투자자 동향 = 전부 숨김.

**실측 (실제 KIS/Yahoo API 호출로 확인)**:
- KIS는 `0193T0`에 가격(36,900 +12.98%)·일봉(16개)·호가·투자자(16행) **전부 정상 반환** — 데이터는 멀쩡히 있다.
- Yahoo도 `0193T0.KS`면 16개 정상.
- 순수숫자 `069500`은 모두 정상 → 회귀 없게 유지할 것.

→ 데이터가 없는 게 아니라, **앱이 잘못된 곳에서 찾고 있을 뿐.** 흩어진 판정 정규식을 공용 함수로 교체해 영숫자 단축코드도 국내로 인식시킨다.

---

## 🧩 작업 1 — 새 파일 생성: `lib/code.ts`

```ts
/**
 * KRX 국내 단축코드 판별.
 * - 숫자 6자리(예: 005930, 069500)
 * - 영문 섞인 신형 단축코드(예: 0193T0, 0167A0, 0195S0) — 단일종목 레버리지/인버스 등 신상품
 * 미국 티커(AAPL 등 알파벳 시작 · ^지수)와의 구분 규칙: "6자 영숫자이며 첫 글자가 숫자".
 */
export function isKrxCode(code: string | null | undefined): boolean {
  return !!code && /^\d[0-9A-Za-z]{5}$/.test(code);
}
```

---

## 🧩 작업 2 — 흩어진 `/^\d{6}$/` 24곳을 `isKrxCode(...)`로 교체 (19개 파일)

각 파일 **상단 import 구역에** 아래 한 줄 추가:
```ts
import { isKrxCode } from "@/lib/code";
```

치환 규칙(기계적):
- `/^\d{6}$/.test(X)`  →  `isKrxCode(X)`
- `!/^\d{6}$/.test(X)` →  `!isKrxCode(X)`

### 교체 대상 표

| # | 파일 | 라인 | 비고 |
|---|------|------|------|
| 1 | `components/home-v6/HomeStockDetail.tsx` | 111 | 미리보기 차트 — KIS 우선 분기 |
| 2 | `app/api/yahoo/chart/route.ts` | 22 | `.KS/.KQ` 접미사 부여 분기 |
| 3 | `app/api/kis/chart/route.ts` | 17 | `!/^\d{6}$/` → `!isKrxCode(symbol)` (영숫자 코드 허용) |
| 4 | `components/stock/StockInfoPanel.tsx` | 36, 43, 100 | ⚠️ **65행은 절대 건드리지 말 것** (`/^[A-Z.\-]+$/` = 미국 분기, 그대로 유지) |
| 5 | `components/stock/StockOrderbookCard.tsx` | 12, 26 | |
| 6 | `components/stock/StockExecutionCard.tsx` | 11, 25 | |
| 7 | `components/stock/StockDisclosuresTab.tsx` | 27 | 국내 → DART 라우팅 |
| 8 | `components/stock/StockInsightsTab.tsx` | 20 | KIS 투자자·섹터 |
| 9 | `components/stock/BrokerLinks.tsx` | 18 | 증권사 거래링크 노출 |
| 10 | `components/ui/StockLogo.tsx` | 29 | ETF 로고 브랜딩 |
| 11 | `components/stock/StockPageClient.tsx` | 26 | |
| 12 | `components/sidepanel/StockDetailPanel.tsx` | 146 | 아래 ▼ 특수 처리 |
| 13 | `app/api/news/stock/route.ts` | 61 | |
| 14 | `app/api/stocks/disclosures/route.ts` | 137 | `!/^\d{6}$/.test(symbol)` → `!isKrxCode(symbol)` |
| 15 | `components/chart/ChartPageClient.tsx` | 34 | KRX→KIS 라우팅 |
| 16 | `components/ticks/TicksPageClient.tsx` | 28 | |
| 17 | `components/orderbook/OrderBookPageClient.tsx` | 95 | |
| 18 | `app/api/chat/send/route.ts` | 23 | 채팅 종목코드 링크화 |
| 19 | `components/sidebar/WatchlistPanel.tsx` | 76 | |
| 20 | `components/watchlist/WatchlistPageClient.tsx` | 101 | 아래 ▼ 메시지도 변경 |

### ▼ 특수 처리 2곳

**(12) `components/sidepanel/StockDetailPanel.tsx:146`** — 로컬 헬퍼 본문만 교체(호출부 5곳은 그대로):
```ts
// 변경 전
const isKrCode = (s: string) => /^\d{6}$/.test(s);
// 변경 후 (+ 상단 import { isKrxCode } from "@/lib/code";)
const isKrCode = (s: string) => isKrxCode(s);
```

**(20) `components/watchlist/WatchlistPageClient.tsx:101`** — 정규식 + 에러 메시지 둘 다:
```ts
// 변경 전
if (!/^\d{6}$/.test(sym)) { setAddError('6자리 숫자 종목코드를 입력하세요'); return; }
// 변경 후
if (!isKrxCode(sym)) { setAddError('종목코드 6자리를 입력하세요 (예: 005930, 0193T0)'); return; }
```

> ⚠️ 주의: 위 표의 라인 번호는 현재 HEAD 기준. import 한 줄을 추가하면 이후 라인이 1씩 밀리니, **라인 번호가 아니라 정규식 패턴으로 찾아서** 교체할 것.

---

## ✅ 작업 3 — 검증

```bash
npm run build
```
- 빌드 무에러 + 타입에러 없을 것.

개발 서버로 눈 확인(`npm run dev`, 포트 3333):
1. 홈 → ETF 탭 → **'KODEX SK하이닉스단일종목레버리지'(0193T0)** 행 클릭 → 우측 미리보기에 **일봉 차트 표시**(차트 데이터 없음 사라짐).
2. `/stock/0193T0` 직접 접속 → **정보패널(현재가 36,900 · +12.98%)·일봉 차트·호가 카드 표시**, 공시 탭 출처가 **"DART"**로 표기.
3. 회귀 체크: **'KODEX 200'(069500)** 등 순수숫자 종목 미리보기·상세 정상 유지.

---

## 📦 작업 4 — 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "fix: 국내 영숫자 단축코드(0193T0 등) 전면 인식 — isKrxCode 공용함수로 /^\\d{6}\$/ 24곳 교체 (STEP 272)" && git push
```

---

> **한 줄 요약**: "국내=숫자6자리" 가정이 신형 영숫자 단축코드(0193T0 등)를 미국으로 오인 → 차트·정보 빈칸. `lib/code.ts`의 `isKrxCode` 하나로 24곳 통일해 근본 해결.
