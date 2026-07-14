<!-- 2026-07-14 -->
# STEP 715 — 영어 로케일 데이터 레이어 i18n · Tier 1 (렌즈 lang 배선 + h1 + 뱃지 + grade)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(**KR 공유 렌즈 엔진** 손댐 → KR byte 동일 절대 사수. `/clear` 후 시작.)
**목표:** `/en`에서 한국어로 뜨던 **렌즈명·판정·스펙트럼·전망·grade 배지·종목명 h1·TR-AI 렌즈 뱃지**를 영어화. **가장 큰 시각적 승리를 최소 변경으로.** 브리핑·공시요약(LLM)·8-K·F-Score는 Tier 2/3(다음 STEP).
**전제:** i18n·캐시버그 완료(`d122cac`·문서 `80adf13`). 데이터레이어 i18n 감사 결과 Tier 1.

---

## 🔒 절대 규칙 — KR byte 동일
렌즈 엔진(`lib/lenses.ts`·`lensCopy.ts`)은 KR 보드·KR 종목상세가 **매일 쓰는** 공유 코드. 이번 변경 후 **`/stock/{KR종목}`·ko 보드의 렌즈명·판정·grade·스펙트럼이 지금과 100% 동일**해야 함. locale 기본값=`ko`이고, 추가하는 영어는 `en`일 때만. **grade 한국어 값은 현재 리터럴과 오타·괄호까지 정확히 일치.**

## 핵심 통찰 (감사)
렌즈 카피는 **이미 이중언어**(`lib/lensCopy.ts` `LENS_COPY`·`LENS_READINGS`·`SPECTRUM_LABELS` ko/en)이고 `/api/lens`는 `?lang=en`을 **이미 지원**(캐시 키에 locale 포함). 클라가 `lang`을 안 보내서 ko로 오는 것뿐. → **fetch에 `&lang` 한 줄**이면 이름·판정·스펙트럼·전망·요약·about이 한꺼번에 영어. 유일한 하드코딩=`grade`(영어 없음)라 그것만 이중언어 맵 추가.

## 작업

### 1. 렌즈 fetch에 `&lang=${locale}` (클라 2곳)
- `components/toolbox/LensPreview.tsx`: `import { useLocale } from 'next-intl'` + `const locale = useLocale()`. `:38` `/api/lens?symbol=...` → `...&lang=${locale}`. **(brief `:61`·etf-holdings `:49` fetch는 이번 X — Tier 2/3.)**
- `app/[locale]/stock/[symbol]/StockLensClient.tsx`: `useLocale()` 추가 + `:900` `/api/lens` fetch에 `&lang=${locale}`. **(brief `:751`·news-brief `:719`·events는 이번 X.)**

### 2. grade 이중언어 맵 (유일한 하드코딩)
- `lib/lensCopy.ts`: `LENS_GRADE: Record<Locale, Record<'verified'|'verifiedDefensive'|'reference'|'weakSignal', string>>` 추가.
  - `ko`: `{ verified:'검증', verifiedDefensive:'검증(방어)', reference:'참고용', weakSignal:'약한 신호' }` ← **현재 값과 정확히 동일**.
  - `en`: `{ verified:'Verified', verifiedDefensive:'Verified (defensive)', reference:'Reference', weakSignal:'Weak signal' }` ← **`messages/en.json`의 신뢰도 등급 범례(StockLens 네임스페이스) 문구와 일치**시킬 것(범례가 "Verified/Weak signal/Reference"면 그대로).
- `lib/lenses.ts`: 하드코딩 `grade` 리터럴 6곳을 `LENS_GRADE[locale][키]`로:
  - momentum `:56`·`:70` `"검증"`→`verified` · technical `:93`·`:109` `"참고용"`→`reference` · valuation `:137`·`:147` `"약한 신호"`→`weakSignal` · lowVol `:168`·`:176` `"검증(방어)"`→`verifiedDefensive` · quality `:200`·`:210` `"검증"`→`verified` · assetGrowth `:234`·`:246` `"약한 신호"`→`weakSignal`.
  - 각 lens `compute(d, locale)`가 이미 locale 받음 → 그대로 사용. `gradeTier`(색)는 **불변**.

### 3. 종목명 h1 → 영어면 info.en (서버)
- `app/[locale]/stock/[symbol]/page.tsx`: `isEn`(`:100`) 이미 있음. crumbName(`:107`) 로직 그대로 미러:
  - `:135` `initialName={info?.name || undefined}` → `initialName={(isEn && info?.en && info.en !== info.name ? info.en : info?.name) || undefined}`
  - `:133` ETF도 동일(`EtfLensClient`).

### 4. TR-AI 렌즈 뱃지 lang
- `app/[locale]/stock/[symbol]/StockLensClient.tsx:1001` `<AiLensBadge pill />` → `<AiLensBadge pill lang={locale} />`. (미리보기는 이미 `t()`라 영어. 이걸로 상세도 "TR-AI Lens"로 일치.)

### 5. 하드코딩 ko 2곳
- `StockLensClient.tsx:270`·`:282` `LENS_COPY.ko.fscore.what` → `LENS_COPY[locale].fscore.what` (locale 변수 사용).

## ⚠️ 함정
- `lib/lensCopy.ts`·`lenses.ts`는 프레임워크 무관 순수 모듈(next import 금지) — `useLocale` 넣지 말 것. locale은 **인자로** 흐름(이미 그렇게 설계됨).
- Turbopack: 서버 컴포넌트·엔진 변경 → 클린 재시작.
- `LENS_COPY.en.fscore.what` 존재 확인(`lensCopy.ts:83`) — 없으면 추가.

## 검증 (양쪽·3중)
1. `npm run build`+tsc 0+vitest.
2. **KR 무회귀**(dev): `/stock/005930`·ko 보드 우측 렌즈 미리보기 — 렌즈명(모멘텀·저변동성…)·판정·grade(검증·참고용·약한 신호…)·스펙트럼 **현재와 100% 동일**.
3. **en 신규**: `/en/stock/MU`·`/en`(US 보드) 우측 미리보기 — 렌즈명(Momentum·Low Volatility…)·판정(영어)·grade(Verified·Reference·Weak signal…)·스펙트럼 영어 · h1 **"Micron Technology"**(마이크론 아님) · 뱃지 **"TR-AI Lens"**. (브리핑·공시는 아직 한국어 = Tier 2/3·정상.)
4. `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "i18n(데이터 Tier1): 렌즈 fetch lang 배선 + grade 이중언어 + h1 영문명 + AiLensBadge lang (KR byte 동일·/en 렌즈 영어화)" && git push
```

## 다음 (Tier 2 = STEP 716·결정론)
- 8-K 라벨 이중언어(`lib/eightK.ts:23-41`)+`/api/events` `lang`+캐시키 · `lib/lenses.ts` detail 키/headline 키·라벨 분리 · F-Score locale(`lib/fscore.ts`) · `EtfLensClient` 레버리지 정규식(영어 매칭)+etf-holdings lang.
- (Tier 3 보류=LLM: 브리핑·news-brief·공시 AI요약 = 영어 프롬프트+per-locale 캐시+DB 마이그레이션. 별도 결정.)
