<!-- 2026-07-14 -->
# STEP 717 — 영어 데이터 레이어 · Tier 2b (lenses.ts detail 키/headline 분리)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(⚠️ **한국어 리터럴이 lookup 키**라 key/label 분리·전 조회부 동기화·charac 테스트 갱신 필요 — 이번 시리즈 최고 delicate. `/clear` 후.)
**목표:** `/en` 렌즈 카드 **근거 행(evidence)의 한국어 키**(12-1모멘텀%·200일선대비%·연변동성% 등)와 **headline 한국어 prefix**(200일선·연변동성·자산성장)를 영어화. **KR 표시 byte 동일.**
**전제:** STEP 716(`36dbed9`). Tier 2a(8-K·F-Score·ETF) 완료.
**범위 밖:** 렌즈 `note`(긴 백테스트 설명·한국어)=**718(콘텐츠 번역)**. 이번은 구조(키/headline)만.

---

## 🔬 현재 구조 (읽어서 확정)
- `lib/lenses.ts` 각 렌즈 `detail: { "한국어키%": 숫자 }` — **키가 곧 표시 라벨**.
- 소비 딱 3곳(grep 전수):
  - `StockLensClient.tsx:126` `tech?.detail?.['RSI(14)']` · `:928` `L.detail['RSI(14)']`·`L.detail['200일선대비%']`(기술 RsiZone) = **특정 조회 2키**.
  - `StockLensClient.tsx:981` `Object.entries(L.detail).map(([k,v]) => k: v)` = **전체 표시**(여기가 한국어 노출).
- headline: 기술 `` `200일선 ${x}%` ``(`:125`)·저변동 `` `연변동성 ${x}%` ``(`:188`)·자산성장 `` `자산성장 ${x}%` ``(`:256`)만 한국어 단어. 모멘텀 `12-1`·밸류 `PER`·퀄리티 `GP/A`는 언어중립.

## ✅ 접근 — stable 키 + 이중언어 라벨맵 (object 유지)
`detail` 형태(`Record<string,number|null>`)·값·**삽입 순서 유지**. **키만 언어중립으로** 바꾸고 표시는 라벨맵으로.

### 1. `lib/lenses.ts` — detail 키를 stable로 (아래 표 정확히)
| 렌즈 | 현재 키 | → stable 키 | ko 라벨(=현재와 동일) | en 라벨 |
|---|---|---|---|---|
| momentum | `12-1모멘텀%` | `mom12_1` | `12-1모멘텀%` | `12-1 Momentum %` |
| momentum | `1개월%` | `ret1m` | `1개월%` | `1M %` |
| momentum | `3개월%` | `ret3m` | `3개월%` | `3M %` |
| momentum | `6개월%` | `ret6m` | `6개월%` | `6M %` |
| momentum | `12개월%` | `ret12m` | `12개월%` | `12M %` |
| technical | `RSI(14)` | `rsi14` | `RSI(14)` | `RSI(14)` |
| technical | `200일선대비%` | `ma200vs` | `200일선대비%` | `vs MA200 %` |
| technical | `52주위치%` | `pos52w` | `52주위치%` | `52W position %` |
| valuation | `PER` | `per` | `PER` | `PER` |
| valuation | `PBR` | `pbr` | `PBR` | `PBR` |
| lowvol | `연변동성%` | `vol` | `연변동성%` | `Ann. volatility %` |
| quality | `GP/A%` | `gpa` | `GP/A%` | `GP/A %` |
| assetgrowth | `자산성장%` | `ag` | `자산성장%` | `Asset growth %` |

### 2. `lib/lensCopy.ts` — 이중언어 맵 2개 추가
- `DETAIL_LABELS: Record<Locale, Record<stable키, string>>` — 위 표의 ko/en(**ko는 현재 키와 오타·괄호·% 정확히 동일**).
- headline prefix `HEADLINE_PREFIX: Record<Locale, {technical, lowvol, assetgrowth: string}>` — `ko: { technical:'200일선', lowvol:'연변동성', assetgrowth:'자산성장' }`(현재와 동일) · `en: { technical:'vs MA200', lowvol:'Ann. vol', assetgrowth:'Asset growth' }`.

### 3. `lib/lenses.ts` — headline locale화 (3곳만)
- 기술 `:125` `` `200일선 ${x}%` `` → `` `${HEADLINE_PREFIX[locale].technical} ${x}%` ``
- 저변동 `:188` `연변동성` → `${HEADLINE_PREFIX[locale].lowvol}`
- 자산성장 `:256` `자산성장` → `${HEADLINE_PREFIX[locale].assetgrowth}`
- (모멘텀·밸류·퀄리티 headline = 언어중립·불변.)

### 4. `StockLensClient.tsx` — 조회 3곳 + 표시
- `:126` `['RSI(14)']` → `['rsi14']`
- `:928` `['RSI(14)']` → `['rsi14']` · `['200일선대비%']` → `['ma200vs']`
- `:981` 렌더: `{DETAIL_LABELS[locale][k] ?? k}: {v}` (import `DETAIL_LABELS`·`locale` 이미 있음). fallback `?? k`로 혹시 누락돼도 안 깨짐.

### 5. charac 테스트 갱신
- `lib/lenses.charac.test.ts`(716에서 통과한 그것)가 detail 키를 assert하면 **새 stable 키로 갱신**. + **KR 무회귀 증명 추가**: `DETAIL_LABELS.ko`가 표의 한국어 라벨과 정확히 일치하는지 assert(표시가 안 바뀜을 코드로 고정).

## ⚠️ 함정
- **조회부 누락 시 gauge 조용히 깨짐**(RsiZone에 null 들어가 사라짐) → grep `\.detail\[` 재확인 필수(현재 확인된 3곳 외 없음).
- `lib/*` 순수 모듈 — locale 인자로. `lenses.ts`는 이미 `compute(d, locale)`.
- 삽입 순서 = 표시 순서(비정수 문자열 키라 보존됨).
- Turbopack: `NEXT_DIST_DIR=.next-verify npm run build`로 dev 보호(716 방식).

## 검증 (양쪽·3중)
1. `tsc --noEmit` 0 · `npm test`(charac 포함) · `NEXT_DIST_DIR=.next-verify npm run build`.
2. **KR 무회귀**(dev): `/stock/005930` 렌즈 카드 펼쳐 — 근거 행 라벨(12-1모멘텀%·200일선대비%·연변동성% 등)·headline(200일선·연변동성·자산성장) **현재와 100% 동일** + RsiZone(기술) 정상 표시(조회 안 깨짐).
3. **en 신규**: `/en/stock/MU` 렌즈 카드 펼쳐 — 근거 라벨 영어(12-1 Momentum %·vs MA200 %·Ann. volatility % 등)·headline 영어. RsiZone 정상.
4. **잔여 한국어 스캔**: `/en/stock/MU` 카드 전개 상태에서 **아직 한국어인 것 목록화**(특히 `note` "자세히"=718 예정·`short`/`long` 라벨 leak 있으면 보고). `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "i18n(데이터 Tier2b): lenses.ts detail 키 stable화 + DETAIL_LABELS/headline 이중언어 (KR 표시 byte 동일·조회부 동기화·charac 갱신)" && git push
```

## 다음
- **718 (Tier 2c)**: 렌즈 `note` 6개(긴 백테스트 설명) 영어화 → `LENS_COPY[locale].<lens>.note` 또는 이중언어 notes 맵(순수 콘텐츠 번역·구조 안전). 4번 스캔에서 나온 잔여 한국어(short/long 등) 있으면 함께.
- (Tier 3 보류=LLM): 브리핑·news-brief·공시 AI요약.
