<!-- 2026-07-14 -->
# STEP 716 — 영어 데이터 레이어 · Tier 2a (8-K 라벨 + F-Score + ETF 레버리지)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(공유 엔진(F-Score)·API 캐시 키 손댐 → **KR byte 동일** 사수. `/clear` 후 시작. ⚠️ 빌드는 임시 distDir로 dev 보호: `next build --distDir .next-verify`.)
**목표:** `/en`에서 아직 한국어인 **8-K 공시 라벨·F-Score 카드·ETF 레버리지 경고**를 영어화(전부 결정론적 이중언어 맵·LLM 무). 
**전제:** STEP 715(`a393940`). Tier 1(렌즈·h1·뱃지·grade) 완료.
**범위 밖(717로 격리):** `lib/lenses.ts` detail 키/headline(한국어가 lookup 키라 key/label 분리 필요·delicate). **브리핑·공시 AI요약(LLM)=Tier 3 보류.**

---

## 🔒 절대 규칙 — KR byte 동일
`lib/eightK.ts`·`lib/fscore.ts`는 KR 공유 엔진. 변경 후 **`/stock/{KR종목}`·ko의 공시 라벨·F-Score(우량/중립/부실·9항목 label·plain·reason)가 100% 동일**. 추가 영어는 `en`일 때만. `computeFScore` 시그니처 바꾸면 **모든 호출부** 갱신.

## 1. 8-K 공시 라벨 이중언어
- `lib/eightK.ts:23-41`: `EIGHTK` 각 항목에 **`en` 필드 추가**(기존 `label`=ko 유지 → 다른 소비자 무영향). 예 `"2.02": { label:"분기 실적 발표", en:"Quarterly earnings", severity:... }`. 9항목 전부 영어 병기(재무제표 재작성·임원 변동·기타 중대 사건 등).
- `app/api/events/route.ts`: `lang` 쿼리 파라미터 수용(`pickLocale` 재사용) → 반환 라벨을 `locale==='en' ? item.en : item.label`. **인메모리 캐시 키(`:17`)에 locale 추가**(안 하면 먼저 캐시된 언어가 양쪽에).
- `StockLensClient.tsx`: EventLayer가 `/api/events` fetch할 때 `&lang=${locale}`. 렌더 `:842`(`d.label`)·routine 그룹 `:830`/`:870`은 그대로(값이 이미 로케일 반영).
- ⚠️ `brief/route.ts:55`가 `EIGHTK` label을 쓰면 **ko(`label`) 그대로 두기**(브리핑=Tier 3·한국어).

## 2. F-Score 이중언어 (엔진)
- `lib/fscore.ts`: `computeFScore(rows, locale='ko')`로 시그니처 확장. 이중언어화:
  - criteria `label`·`plain`(`:92-100`·9항목) · `grade` `우량/중립/부실`(`:104`) · `reason`(`:56`·`:75`). ko는 **현재 값 그대로**, en 추가.
  - `GROUPS` 키(수익성/재무안정성/효율성 `:256-258`)는 **데이터 매칭 키라 건드리지 말 것**(표시는 `t()`).
- `lib/lensCompute.ts:132` `computeFScore(d.financials)` → `computeFScore(d.financials, locale)`(이미 `computeSymbolLenses`가 locale 받음).
- 렌더 `StockLensClient.tsx:249`(reason)·`:322`(label·plain)·`:323`(note) — 값이 로케일 반영되므로 렌더 코드 변경 최소.
- ⚠️ **F-Score도 `/api/lens` 경유**(computeSymbolLenses가 fscore 포함) → 715에서 `&lang` 이미 배선됨. lens 캐시 키에 locale 있으니 F-Score도 자동 분리. 확인만.

## 3. ETF 레버리지 정규식 + holdings
- `app/[locale]/stock/[symbol]/EtfLensClient.tsx:62`: `/레버리지|인버스|\dX/i` → **영어 키워드 추가** `/레버리지|인버스|leverage|inverse|\b\d+x\b/i`(715에서 영문명 되며 한국어 키워드 안 잡혀 경고 꺼지던 것 복구). `bear`는 오탐 위험(종목명에 흔함) 넣지 말 것.
- (선택) etf-holdings `category`/`family` — US 펀드는 이미 영어라 저위험. 지금은 정규식만.

## ⚠️ 함정
- `lib/*`는 순수 모듈(next import 금지) — locale은 **인자로**.
- 캐시 키에 locale 누락 = 언어 교차 오염(715 `/api/lens`는 이미 됨·`/api/events`는 이번에 추가).
- Turbopack 엔진 변경 → `next build --distDir .next-verify`로 검증(dev 보호).

## 검증 (양쪽·3중)
1. `npx tsc --noEmit` 0 · `npm test`(vitest·특히 lenses/fscore 픽스처) · `next build --distDir .next-verify`.
2. **KR 무회귀**(dev): `/stock/005930` — 공시 라벨(분기 실적 발표 등)·F-Score(우량/중립/부실·9항목)·문구 **현재와 100% 동일**.
3. **en 신규**: `/en/stock/MU` — 공시 라벨 영어(Quarterly earnings 등)·F-Score 영어(criteria·grade·reason)·레버리지 ETN(`/en/stock/{레버리지 ETN}`) 경고 다시 뜸.
4. `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "i18n(데이터 Tier2a): 8-K 라벨·F-Score·ETF 레버리지 이중언어 (KR byte 동일·/api/events 캐시 locale키·LLM 무)" && git push
```

## 다음
- **717 (Tier 2b·delicate)**: `lib/lenses.ts` detail 키/headline — 한국어 리터럴이 `L.detail['200일선대비%']` 같은 **lookup 키**라 key/label 분리(충돌 위험). evidence 렌더(`StockLensClient:979-981`·`:926`)까지.
- (Tier 3 보류=LLM): 브리핑·news-brief·공시 AI요약 = 영어 프롬프트+per-locale 캐시(`*_en` 컬럼 or 키에 lang)+DB 마이그레이션. 별도 결정.
- (선택) h1 영문명 대문자(MICRON TECHNOLOGY INC) → 스마트 title-case(약어 NVIDIA·IBM 보존) or DB 정규화. 저우선.
