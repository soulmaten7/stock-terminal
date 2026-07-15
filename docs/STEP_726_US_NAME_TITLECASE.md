<!-- 2026-07-15 -->
# STEP 726 — US 종목명 올대문자 → 스마트 title-case

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(약어·camelcase 함정 많아 판단·샘플 검증 필요. `/clear` 후.)
**목표:** US 영문명 `MICRON TECHNOLOGY INC`(SEC 올대문자) → `Micron Technology Inc` 로 깔끔하게. **약어(IBM·AT&T·3M)·camelcase(JPMorgan·eBay)는 망가뜨리지 않기.**
**전제:** STEP 725(`3cef637`). h1/title/breadcrumb 다 `resolveStockName` 경유(US=`cleanUsName`).
**대상:** `lib/stockName.ts`(`cleanUsName` → title-case 추가) + US 종목명 표시하는 보드(있으면 동일 헬퍼).

---

## 접근 — **올대문자일 때만** 처리 (mixed-case는 이미 정상이라 손 안 댐)
`lib/stockName.ts`에 `titleCaseUsName(n)` 추가, `cleanUsName` 끝에서 호출:
```ts
const KEEP = new Set(['IBM','AMD','HP','3M','AT&T','KKR','UPS','AIG','MGM','CVS','PNC','BNY','USA','ETF','ETN','REIT','PLC','LLC','LP','NV','SA','AG','SE','AB','ADR','HD','GE','GM']); // 약어·법인형 그대로
const CAMEL: Record<string,string> = { JPMORGAN:'JPMorgan', EBAY:'eBay', ISHARES:'iShares', PAYPAL:'PayPal', PROSHARES:'ProShares', POWERSHARES:'PowerShares', LPL:'LPL', MSCI:'MSCI', SPDR:'SPDR' };
const SUFFIX: Record<string,string> = { INC:'Inc', CORP:'Corp', CO:'Co', LTD:'Ltd', COMPANY:'Company', HOLDINGS:'Holdings', GROUP:'Group', TECHNOLOGIES:'Technologies', TECHNOLOGY:'Technology', INTERNATIONAL:'International', INDUSTRIES:'Industries', SYSTEMS:'Systems', ENTERPRISES:'Enterprises', PHARMACEUTICALS:'Pharmaceuticals', FINANCIAL:'Financial', MOTORS:'Motors', ENERGY:'Energy', TRUST:'Trust', INCORPORATED:'Incorporated', N.V.:'N.V.', S.A.:'S.A.' };

function titleCaseUsName(n: string): string {
  if (/[a-z]/.test(n)) return n;              // 이미 mixed-case면 그대로
  return n.split(/\s+/).map((w) => {
    const u = w.toUpperCase();
    if (KEEP.has(u)) return u;                // 약어 그대로
    if (CAMEL[u]) return CAMEL[u];            // camelcase 브랜드
    if (SUFFIX[u]) return SUFFIX[u];          // 법인 접미
    if (/^\d/.test(w)) return w;              // 3M·1ST 등 숫자 시작 그대로
    // 하이픈·앰퍼샌드 포함 토큰도 각 조각 title-case
    return w.replace(/[A-Za-z]+/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  }).join(' ');
}
```
→ `cleanUsName` 반환 직전에 `return titleCaseUsName(c || n);`

## ⚠️ 주의
- **올대문자 아닌 이름은 절대 안 건드림**(`/[a-z]/` 가드) — 이미 제대로 표기된 것(예 mixed-case 소스) 보존.
- `KEEP`/`CAMEL`은 **필수 최소** — 빠진 약어는 그냥 title-case돼도 대개 무난(NVIDIA→Nvidia OK). 명백히 이상한 것만 추가.
- **보드 US 이름**도 올대문자면 동일 헬퍼로. **단 보드 이름 소스가 크론 데이터(`us_stock_perf.name`)면 데이터 파이프라인 변경은 이번 X** — 표시(클라) 레이어에서 `titleCaseUsName`을 export해 재사용하는 선에서만(간단하면). 복잡하면 detail만 하고 보드는 후속 메모.
- 한글명 오버라이드(`FK`) 종목(서학개미)은 `name`=한글이라 무관, `en`(영문명)만 title-case.

## 검증 (샘플 폭넓게)
1. `tsc` 0 · `NEXT_DIST_DIR=.next-verify npm run build` · vitest.
2. **샘플 스크립트로 폭넓게 확인**(임시·`data/us_symbols.json`에서): 대표 티커 `resolveStockName` 또는 `titleCaseUsName` 직접 — **AAPL·MSFT·NVDA·MU·IBM·MMM(3M)·JPM(JPMorgan)·T(AT&T)·KO·INTC·HPQ·BRK.B·GOOGL·AMZN·TSLA·V·MA·UNH·XOM** 등 20개 출력. **약어·camelcase 안 망가졌나 눈으로**(IBM→IBM·JPMorgan→JPMorgan·3M→3M·Nvidia OK). 이상한 것 있으면 KEEP/CAMEL 추가 후 재확인. (검증 후 임시 스크립트 삭제.)
3. dev: `/en/stock/MU` h1 = **Micron Technology Inc**(올대문자 아님)·`/en/stock/AAPL` = Apple Inc 등. 한글 로케일 h1(한글명 있는 종목)은 무영향.
4. `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "polish: US 종목명 올대문자→스마트 title-case (약어·camelcase 보존·올대문자만 처리·mixed-case 무영향)" && git push
```

## 다음 (쭉)
- 727 다크 폴리시 D(accent 틴트·shadow-soft→border) · OAuth 로케일 쿠키(로그인 테스트 시). (빈 뉴스 UX = 저가치·보류.)
