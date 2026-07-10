<!-- 2026-07-10 -->
# STEP 686 — 📦 ETF 구성 상세 페이지 (US·Yahoo, MVP-A) — 빌드·커밋만

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 직접 작성·`tsc`=0·Yahoo 프로브로 감지/데이터 검증 완료.** 이 STEP은 **빌드 + 눈 검증 + 커밋/푸시**만.
**바뀐 것 (설계: `docs/ETF_LENS_PLAN.md`):** ETF/펀드는 기업재무 렌즈 대신 **구성 상세**를 보여준다.
- `lib/instrumentType.ts` (신규) — `getInstrumentType(symbol)`: Yahoo `quoteType`로 fund(ETF·뮤추얼)/equity 감지(인스턴스 캐시). 프로브: SPY·QQQ·069500.KS=ETF, AAPL=EQUITY.
- `app/api/etf-holdings/route.ts` (신규) — Yahoo `topHoldings`+`fundProfile`→ 상위보유(10)·섹터·보수율·운용사·카테고리(6h 캐시). US 채워짐, KR ETF는 holdings=[](→"준비 중").
- `app/stock/[symbol]/EtfLensClient.tsx` (신규) — 구성 상세 뷰(운용사·유형·보수율 + 상위보유 비중바 + 섹터 비중 + 출처 링크). "사실만·예측 아님".
- `app/stock/[symbol]/page.tsx` — `getInstrumentType`으로 **fund면 `EtfLensClient`, 아니면 `StockLensClient`** 분기.

---

## 1. 빌드 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "확인 URL 아래"
```

## 2. 눈으로 확인 (라우팅 분기)
- **`http://localhost:3333/stock/SPY`** → **ETF 구성 페이지**: 운용사(State Street)·보수율(~0.09%)·**상위 보유종목**(NVDA·AAPL·MSFT… 비중 바)·**섹터 비중**·"구성 출처: Yahoo Finance" 링크.
- **`/stock/QQQ`** → 동일(Invesco).
- **`/stock/AAPL`** → **기존 종목 렌즈**(기업재무) 그대로(회귀 없음).
- **`/stock/069500.KS`**(KODEX200) → 구성 페이지 뜨되 "**구성종목 데이터 준비 중**"(KR=KRX 예정·정상).
- 미국 탭 종목보드에서 **ETF 필터 → ETF 클릭 → 미리보기 "TR-AI 렌즈·근거 보기" → 구성 페이지**로 이동.
- console.log 없음. tsc 0.

## 3. CHANGELOG (아래 그대로 추가)
`docs/CHANGELOG.md` 4행 헤더 끝에 `+ ETF 구성 상세(US)` 추가. 685 불릿 아래:
```
- **686**: 📦 **ETF/펀드 구성 상세 페이지**(MVP-A·US). `/stock/{ETF}`가 기업재무 렌즈 대신 **구성 뷰**(상위 보유종목·섹터·보수율·운용사)로 분기 — `lib/instrumentType.ts`(Yahoo quoteType 감지)·`api/etf-holdings`(Yahoo topHoldings)·`EtfLensClient`. US 라이브(SPY·QQQ), KR은 "준비 중"(KRX=MVP-B). 구성=상품 정보(거래처 무관)·수익화(증권사)는 별도. 설계 `docs/ETF_LENS_PLAN.md`.
```

## 4. 커밋 → 푸시
```bash
git add lib/instrumentType.ts "app/api/etf-holdings/route.ts" "app/stock/[symbol]/EtfLensClient.tsx" "app/stock/[symbol]/page.tsx" docs/ETF_LENS_PLAN.md docs/CHANGELOG.md docs/STEP_686_ETF_COMPOSITION_US_COMMAND.md
git commit -m "feat(etf): ETF 구성 상세 페이지(US·Yahoo topHoldings) — /stock/{ETF} 구성 뷰 분기(MVP-A)"
git push
```

## Cowork에게 보고
- /stock/SPY 구성 페이지 뜨는지 + /stock/AAPL 기존 렌즈 회귀 없는지 + KR ETF "준비 중" 확인.
