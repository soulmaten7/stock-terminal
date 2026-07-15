<!-- 2026-07-15 -->
# STEP 725 — 종목상세 현재가 통화기호 (보드와 일관)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(작고 안전·`formatPrice` 재사용. Sonnet)
**목표:** 종목상세 현재가가 통화기호 없이 `285,000`·`937`로만 뜨는 것 → 보드처럼 `formatPrice`로 **6개국 통화기호 부착**(US `$937.00`·KR `285,000원`·JP `¥…`·GB `…p`·VN `…₫`·CN/HK `¥/HK$`). 보드와 일관성.
**전제:** Tier 3 완결(`5c0c348`).
**대상:** `app/[locale]/stock/[symbol]/StockLensClient.tsx` (+ `EtfLensClient.tsx` 동일 패턴 있으면).

---

## 현재 (문제)
`StockLensClient.tsx:1024`: `<p ...>{t('currentPrice')} {data.price.toLocaleString()}</p>` — 통화기호 없음(전 시장). 보드(`MarketBoard`·`UsMarketBoard`)는 이미 `formatPrice(price, country)` 사용 → 상세만 불일치.

## 작업
1. `import { formatPrice } from '@/lib/currency';`
2. 심볼→country 도출(`formatPrice` 키 = KR/US/JP/HK/CN/VN/GB). **컴포넌트에 기존 country/market 감지(isKR/isJP…)가 있으면 재사용**, 없으면 헬퍼:
   ```ts
   const countryOf = (s: string) =>
     /^\d{6}(\.(KS|KQ))?$/i.test(s) ? 'KR'
     : /\.T$/i.test(s) ? 'JP'
     : /\.HK$/i.test(s) ? 'HK'
     : /\.(SS|SZ)$/i.test(s) ? 'CN'
     : /\.VN$/i.test(s) ? 'VN'
     : /\.L$/i.test(s) ? 'GB' : 'US';
   ```
3. `:1024` 가격 렌더 → `{formatPrice(data.price, countryOf(symbol))}`.
4. `EtfLensClient.tsx`도 현재가를 raw `toLocaleString()`로 렌더하면 동일 적용. **`grep -n "price.*toLocaleString\|toLocaleString.*price" app/[locale]/stock` 로 raw 가격 렌더 전수 확인** 후 일괄.

## ⚠️ 주의
- 이건 **의도된 개선**(전 시장에 통화기호 부착·보드와 일관) — KR도 `원` 붙음(현재 없던 것 추가). i18n 리팩터의 "byte 동일"과 다른 맥락(UX 개선).
- 렌즈 근거 수치(detail의 `%` 등)는 통화 아님 — **가격(현재가)만** formatPrice. 퍼센트·배수는 건드리지 말 것.
- `formatPrice` 시그니처 `(v:number, country:string)` — null 가드는 호출부(`data?.price != null`)가 이미 함.

## 검증
1. `tsc` 0 · `NEXT_DIST_DIR=.next-verify npm run build` · vitest.
2. dev: `/stock/005930`(KR)=`285,000원`류 · `/en/stock/MU`(US)=`$937.00`류 · `/stock/7203.T`(JP)=`¥…` · `/stock/{.L}`(GB)=`…p` — **보드 현재가와 동일 포맷**. ETF도.
3. 렌즈·수익률·% 무변. `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "polish: 종목상세 현재가 formatPrice로 통화기호 부착 (보드와 일관·6개국·%수치 무영향)" && git push
```

## 다음 (쭉 진행)
- 726 빈 뉴스 명시 UX · 727 다크 폴리시 D · 728 US h1 스마트 title-case(약어 보존·신중) · OAuth 로케일 쿠키(로그인 테스트 시).
