<!-- 2026-07-08 (3rd) -->
# STEP 663D — 🕐 브리핑·뉴스요약 캐시 `as_of`를 "시장 로컬 날짜"로 (TTL 정렬)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `a7fccef` 이후(STEP 663 계열). 663B/663C와 **독립** — 순서 무관.
**목표:** R2 브리핑(`/api/brief`)·R3 뉴스요약(`/api/news-brief`)의 하루 캐시 키 `as_of`를 **서버 UTC 날짜 → 그 종목 시장의 로컬 타임존 날짜**로 바꾼다. 각 국가 탭 브리핑이 **자기 시장 날짜에 맞춰 하루 1회 롤오버**되도록.
**왜:** 지금 `new Date().toISOString().slice(0,10)`(UTC)라 KST와 9시간 어긋남 → 한국 새벽 시간대에 엉뚱한 날짜 캐시 가능. 시장별로도 안 맞음. 심볼 접미사로 시장을 알 수 있으니 로컬 날짜로 정렬.

> **범위**: `as_of` 계산만 교체(캐시 저장·재사용 구조는 그대로 = 이미 DB 공유·하루 1회 생성). 정밀한 "마감+크론 이후 재생성"은 이번 범위 아님(로컬 날짜 정렬로 90% 해결·과설계 금지).

---

## 1. `lib/marketDate.ts` 신설

```ts
// 심볼 접미사 → 시장 타임존 → 그 시장의 오늘 날짜(YYYY-MM-DD).
// 캐시 as_of를 시장 로컬 날짜로 맞춰, 각 탭 브리핑이 자기 시장 하루 주기로 롤오버되게.
export function marketTz(symbol: string): string {
  const s = (symbol || '').toUpperCase();
  if (/\.(KS|KQ)$/.test(s) || /^\d{6}$/.test(s)) return 'Asia/Seoul';      // KR
  if (/\.T$/.test(s)) return 'Asia/Tokyo';                                  // JP
  if (/\.(SS|SZ)$/.test(s)) return 'Asia/Shanghai';                         // CN A주
  if (/\.HK$/.test(s)) return 'Asia/Hong_Kong';                             // HK
  if (/\.L$/.test(s)) return 'Europe/London';                              // GB
  if (/\.VN$/.test(s)) return 'Asia/Ho_Chi_Minh';                          // VN
  return 'America/New_York';                                               // US(접미사 없음) 기본
}

// 그 시장 타임존 기준 '오늘' YYYY-MM-DD. en-CA 로케일 = ISO 형식(YYYY-MM-DD).
export function marketDate(symbol: string, at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: marketTz(symbol),
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(at);
}
```

## 2. `/api/brief/route.ts` 교체
26행:
```ts
const today = new Date().toISOString().slice(0, 10);
```
→
```ts
const today = marketDate(symbol);
```
상단 import 추가:
```ts
import { marketDate } from '@/lib/marketDate';
```
> `symbol`은 이미 22행에서 파싱됨(대문자). `stock_briefings` upsert의 `as_of: today`도 자동으로 로컬 날짜가 됨(onConflict 'symbol,as_of' 그대로).

## 3. `/api/news-brief/route.ts` 교체
36행 근처:
```ts
const today = new Date().toISOString().slice(0, 10);
```
→
```ts
const today = marketDate(symbol);
```
import 추가:
```ts
import { marketDate } from '@/lib/marketDate';
```
> `symbol`은 상단에서 `.toUpperCase()`로 파싱됨. `news_briefs` (symbol, as_of) 캐시도 로컬 날짜로 정렬됨.

---

## 4. 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 로컬 확인:
  - `curl "http://localhost:3333/api/brief?symbol=005930.KS"` → 정상(첫 호출 생성·재호출 `cached:true`).
  - `curl "http://localhost:3333/api/brief?symbol=AAPL"` → 정상(US=뉴욕 날짜).
  - Supabase `stock_briefings`·`news_briefs`의 `as_of`가 **KR 종목=한국 날짜 / US 종목=뉴욕 날짜**로 저장되는지(특히 UTC 자정~KST 오전 사이 시간대에 서버 있으면 KR이 하루 앞서는지) 확인.
- 회귀: 브리핑·뉴스요약 정상 렌더(종목 페이지·미리보기 패널).
- console.log 금지.
```bash
git add lib/marketDate.ts app/api/brief/route.ts app/api/news-brief/route.ts
git commit -m "fix(cache): 브리핑·뉴스요약 as_of를 시장 로컬 타임존 날짜로(marketDate) — UTC/KST 어긋남 해소·탭별 하루 롤오버 정렬"
git push
```

## Cowork에게 보고
- `as_of`가 시장별 로컬 날짜로 저장되는지(KR/US 예시) + 회귀 정상.
- (선택) 나중에 "마감+크론 이후 재생성" 정밀 버전 필요하면 그때 논의.
→ 다음 = STEP 663B(보드 미러 + 잔상용 CTA를 Next Link로) → 664(광고 유료-only).
