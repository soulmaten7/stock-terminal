# STEP 866B — 866 정정 + 재계산 (측정 전용 · 프로덕션 무변경)

**실행 명령어** (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

```
@docs/STEP_866B_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `f3eec0f`(STEP 866) · `docs/STEP_866_COMMAND.md` untracked · tsc 0 · vitest 151/151 · `REVDCF_ENABLED` OFF · `revdcf_results` = 2026-08-01/02/03 각 604

**왜 866B인가**: 866은 **지시대로 정확히 실행됐다.** 결함은 산출물이 아니라 **① Cowork이 정본에 근거 없는 조건을 써 넣은 것 ② 지표 분모 불일치 ③ 지표 정의 차이를 "불일치"로 오기한 것**에 있다. 아래 5건은 전부 원인이 규명된 상태이고, **SEC 재다운로드 없이 캐시로 재계산 가능**하다.

---

## 🔴 금지사항 (866과 동일)

| # | 금지 |
|---|---|
| 1 | `lib/revdcf/**` 수정 — import만 |
| 2 | `revdcf_results` 쓰기 (INSERT/UPDATE/UPSERT/DELETE) |
| 3 | `app/**` 수정 · 플래그 변경 · 화면 변경 |
| 4 | `docs/probe_survivors.json` 덮어쓰기 |
| 5 | **컷 제안 · 채택 권고 · "거래소로 자르자/말자"** — 숫자만 |
| 6 | `git push` |
| 7 | 유동성(FALR) 컷 적용 |

**🔴 5번 강조**: 866B는 *"OTC를 뺄까"* 를 정하는 STEP이 **아니다.** 뺄지 말지 판단할 **재료(각 단계별 OTC 잔존 수)** 를 만드는 STEP이다. 결론 문장을 쓰지 말 것.

---

## 1단계 — 문서 정정 (코드 0 · 먼저 한다)

### (1) 🔴 `docs/REVDCF_SPEC.md:334` — 근거 없는 조건 삭제

현재 문장에 **"거래소 상장"** 이 들어 있다:

> 우리 유니버스(미국 소재·**거래소 상장**·10-K)와 같은 자로 잰 수가 아니다.

🔴 **이 조건은 우리 규칙에 없다.** 같은 파일 `:1190` 정본:

> 제외 = 금융(SIC 6000~6999)·REIT(6798)·SPAC(6770)·외국(20-F/40-F)·매출0·파트너십

거래소 조항이 없다. **"거래소 상장"은 Cowork이 STEP 866 명령서를 쓰면서 근거 없이 추가한 것이다.** 아래로 교체:

> 🔴 **재정정(2026-08-02 866B)**: 앞선 정정문에 적힌 *"거래소 상장"* 은 **우리 규칙에 없는 조건**이었다(§`:1190` 제외 목록에 거래소 조항 없음). Cowork이 866 명령서 작성 중 근거 없이 삽입한 것으로 **철회한다.**
> 따라서 **SEC "미국 소재 거래소 상장 3,692"는 우리 모집단의 상한이 아니다.** 우리 규칙은 거래소를 묻지 않으므로 우리 모집단에는 OTC가 정당하게 포함된다.
> 🔴 **열린 질문(미결정)**: 우리는 **거래소 기준**(SEC 통계·NC)인가 **상장 여부 기준**(Damodaran)인가. **정한 적이 없다.** 866B가 각 단계별 OTC 잔존 수를 재고, 판정은 장은태가 한다.

### (2) 🔴 `data/sources/text/EXTERNAL_UNIVERSE_QUOTES.md` — 원본에 없는 서술 정정

현재 `:20`:

> 커버리지 규모 = **2,748사**. 제외 사유는 **셋뿐**: 매출 0 · OTC · 주식구조 복잡(주식수 신뢰 불가).
> 🔑 세 번째는 우리 `MULTI_CLASS_SHARES` 5사와 **같은 사유**.

**우리 저장 원본 `newconstructs_coverage_methodology.html` 본문 8,163자 전수 검색 결과**:

| OTC | over-the-counter | exclude | complex | share structure | 2,748 |
|---|---|---|---|---|---|
| **0건** | 0건 | 0건 | 0건 | 0건 | 0건 |

유일한 제외 서술 = *"Companies with no revenue in the current period are not added to coverage."* **1건.**
라이브 페이지(최종수정 2022-07-20) 재확인도 **OTC 언급 0건.**

아래로 교체:

> - 커버리지 규모 = **2,748사**(2022-03-14 기준 · 🔴 우리 저장본 본문에는 이 수치가 없다 — 라이브 페이지에서만 확인).
> - 🔴 **원본에서 확인되는 제외 사유는 하나뿐**: *"Companies with no revenue in the current period are not added to coverage."*
> - 🔴 **정정(866B)**: 앞서 적혀 있던 *"OTC"* · *"주식구조 복잡(주식수 신뢰 불가)"* 두 항목은 **우리 저장 원본에도 라이브 페이지에도 없다.** 출처 불명이므로 **철회한다.** (2026-08-02(2) *"애널리스트 손이 한정돼서"* 날조와 같은 파일 · 그때 이유만 지우고 목록은 안 고쳤다.)
> - 🔴 따라서 **`MULTI_CLASS_SHARES` 5사가 "NC와 같은 사유"라는 주장도 철회한다.** 근거가 없었다.
> - 🔴 **저장본 불완전 의심**: 본문 8,163자에 커버리지 수치조차 없다. **전체 페이지를 다시 저장해야 한다**(아래 2단계).

### (3) `docs/probe_866_ladder.json` — `droppedBy` 비배타 경고

`reit 200` · `spac 231`은 사다리에서 **추가 제외 0**이다(SIC 6000~6999의 부분집합). 검산:

```
8,017 − 1,488(noAnnualForm) − 1,288(foreign) − 1,344(sicFinancial) − 543(noRevenue) = 3,354 ✓
```

파일에 아래 키를 추가한다:

```json
"droppedByNote": "🔴 배타적이지 않다. reit(200)·spac(231)은 sicFinancial(1344)의 부분집합이라 사다리에서 추가 제외 0. 합산 금지. 배타 합산은 noAnnualForm+foreign+sicFinancial+noRevenue만."
```

---

## 2단계 — NC 원본 재저장 (규칙 ⓪)

```bash
UA="Trillion Research admin@onetrillion.app"
curl -sL -A "$UA" -o data/sources/text/newconstructs_coverage_methodology.html \
  "https://www.newconstructs.com/coverage-universe-methodology/"
```

받은 뒤 **반드시 검증**하고 결과를 콘솔에 출력한다:

- 본문(태그 제거) 길이가 기존 8,163자보다 큰가
- `2,748` · `OTC` · `complex` · `share structure` 각각 몇 건인가
- 🔴 **`OTC`가 여전히 0건이면 (2)의 철회가 확정된다.** 0건이 아니면 **원문을 그대로 인용해 발췌본에 되살린다.**

🔴 **덮어쓰기 전에 기존 파일을 `data/sources/text/_prev_newconstructs_coverage_methodology_20260731.html`로 보존**한다(원본 유실 금지).

---

## 3단계 — 재계산 (`scripts/probe_866_universe.ts` 수정)

🔴 **companyfacts 재다운로드 금지.** 866이 만든 캐시를 재사용한다. 캐시 경로가 남아 있는지 먼저 확인해 출력하고, **없을 때만** 벌크를 다시 받는다.

### (A) 🔴 거래소 태그 부착 — 사다리 각 단의 OTC 잔존 수

**우리는 거래소 정보를 이미 두 곳에 갖고 있다**(866은 둘 다 안 썼다):

| 출처 | 필드 | 규모 |
|---|---|---|
| `data/sources/sec/company_tickers_exchange_20260802.json` | `exchange` | Nasdaq 4,347 · NYSE 3,309 · **OTC 2,559** · null 190 · CBOE 27 |
| Supabase `damodaran_industry` | `exchange` | `is_us_listed=true` 6,937 중 **OTCPK 2,152(31.0%)** · NYSE 1,573 · NasdaqCM 1,300 · NasdaqGS 1,168 · NasdaqGM 550 · NYSEAM 193 · BATS 1 |

각 CIK에 **두 출처의 거래소 값을 모두** 붙이고, 사다리 **각 단마다** 다음을 센다:

```
uniqueCik / hasAnnualForm / afterForeignCut / afterSicFinancialCut / afterRevenueCut / final
  각 단에서: exchangeListed(Nasdaq·NYSE·CBOE) 몇 · OTC 몇 · null 몇
```

그리고 **3분류 × 거래소** 교차표:

```
              exchangeListed   OTC   null
computed(a)         ?           ?     ?
undecidable(b)      ?           ?     ?
insufficient(c)     ?           ?     ?
```

🔴 **이 교차표가 866B의 핵심 산출물이다.** 두 출처의 거래소 값이 **불일치하는 CIK 수도 같이 보고**한다(어느 쪽이 맞는지는 판단하지 말 것).

### (B) 🔴 시총 버킷 분모 수정

**현재 336행**:

```ts
for (const r of rows) { if (r.marketCapBucket === "unknown") continue; ... }
```

입력부족 행은 `mcap` 조회 **이전**에 early-return돼 전부 `"unknown"`이라 버킷에서 빠진다 → 버킷 합 **2,052 = (a)364 + (b)1,688**. 그래서 버킷 `yieldPct`는 `(a)÷((a)+(b))`이고 전체 `yieldPct` 10.9%는 `(a)÷N`이다. **두 지표의 분모가 다르다.**

**고칠 것**: `mcap`은 `us_market_cap`에서 심볼로 읽는 값이라 **companyfacts와 무관하다.** 루프 시작 지점에서 **모든 CIK에 대해 먼저 조회**해 버킷을 붙인 뒤 early-return 하도록 옮긴다. 시총을 못 구한 행은 `"no-mcap"` 버킷으로 따로 센다.

산출은 **두 지표를 나란히** 적는다:

```json
"mega(200B+)": { "n": ?, "computed": ?, "undecidable": ?, "insufficient": ?,
                 "yieldPctOfN": ?,          // (a) ÷ n        ← 전체 10.9%와 같은 기준
                 "yieldPctOfCalculable": ? } // (a) ÷ (a)+(b)  ← 기존 값
```

🔴 604도 같은 두 기준으로 병기한다: `177÷604 = 29.3%` · `177÷515 = 34.4%`.

### (C) 🔴 ICC — 불일치가 아니라 정의 차이다 (원인 규명 완료)

두 계산의 차이를 확인했다:

| | `probe_860_validate.ts` (기록값 0.195) | `probe_866_universe.ts` (0.267) |
|---|---|---|
| 최소 업종 크기 | **`g.length >= 5` 필터** (11업종 93사) | **필터 없음** (1사 업종 포함) |
| 업종 출처 | `r.flags.industry` (**DB 저장값**) | `indByT.get(symbol)` (**현재 damodaran 조인**) |

**둘 다 자기 정의로는 맞다.** 866이 "불일치"로 적은 것이 오기다.

**고칠 것**: `iccFor`에 `minGroupSize` 파라미터와 업종 출처 선택을 넣고 **네 값을 전부** 산출한다.

```json
"industryIcc": {
  "definition860": "minGroupSize=5, industry=flags.industry (기록값 0.195의 정의)",
  "the604_def860": ?,     // ← 0.195와 일치해야 한다. 다르면 그 사실을 적는다
  "the604_noMinGroup": 0.267,
  "fullUniverse_def860": ?,
  "fullUniverse_noMinGroup": 0.176,
  "note": "🔴 0.195 vs 0.267은 불일치가 아니라 정의 차이(최소 업종 크기 5 필터 + 업종 출처). 866의 '불일치' 표기를 정정."
}
```

🔴 **`the604_def860`이 0.195와 다르게 나오면** 그때는 진짜 불일치다. **그 사실만 적고 원인 추정은 하지 말 것.**

### (D) CIK별 행 저장 — 다음부터 분기를 셀 수 있게

866은 집계만 남겨서 *"OTC가 각 단에서 몇 개 빠졌나"* 를 되짚을 수 없었다(규칙 ③-iv 위반의 원인).

```
docs/probe_866b_rows.json
[{ cik, symbol, exchangeSec, exchangeDamodaran, sic, annualForm,
   ladderStage, bucket, subTag, gapYears, marketCapBucket, marketCap }]
```

용량이 크면 `.jsonl`로. 🔴 **DB에 넣지 말 것.**

---

## 4단계 — 산출물

- `docs/probe_866b_output.json` — (A)(B)(C) 전부
- `docs/probe_866b_rows.json` — CIK별 행
- `docs/probe_866_ladder.json` — `droppedByNote` 추가
- `docs/probe_866_output.json` — 🔴 **덮어쓰지 말고** `"supersededBy": "docs/probe_866b_output.json"` 키만 추가

---

## 5단계 — 검증 후 멈춘다

```bash
npx tsc --noEmit          # 0
npx vitest run            # 151/151
git status --short
```

**DB 무변경 확인 (필수)** — Supabase에서:

```sql
select as_of, count(*) from revdcf_results group by as_of order by as_of desc;
-- 기대: 2026-08-03 / 08-02 / 08-01 각 604. 새 as_of가 생기면 실패다.
```

**커밋** (push 금지) — 🔴 **866에서 빠진 `docs/STEP_866_COMMAND.md`도 같이 넣는다**:

```bash
git add docs/STEP_866_COMMAND.md docs/STEP_866B_COMMAND.md \
        scripts/probe_866_universe.ts \
        docs/probe_866b_output.json docs/probe_866b_rows.json \
        docs/probe_866_ladder.json docs/probe_866_output.json \
        docs/REVDCF_SPEC.md data/sources/text/EXTERNAL_UNIVERSE_QUOTES.md \
        data/sources/text/newconstructs_coverage_methodology.html \
        data/sources/text/_prev_newconstructs_coverage_methodology_20260731.html
git commit -m "STEP 866B: correct unfounded exchange condition, fix bucket denominator, resolve ICC definition gap (measurement only)

- retract 'exchange listed' from REVDCF_SPEC universe description (never in our rules; inserted without basis)
- retract NC exclusion items 'OTC' and 'complex share structure' (absent from saved original and live page)
- re-save New Constructs methodology original, keep previous copy
- tag every CIK with SEC and Damodaran exchange; count OTC survivors at each ladder rung
- fix market-cap bucket denominator (insufficient rows were dropped), report both denominators
- ICC 0.195 vs 0.267 is a definition gap (min group size 5 + industry source), not a mismatch
- persist per-CIK rows so branch weights can be counted next time
- no code changes to lib/revdcf, no writes to revdcf_results, flag unchanged"
```

## 🔴 마지막 — 다음 항목 제안 금지

**보고 형식**:

```
NC 원본 재저장: 본문 ?자 (기존 8,163) · OTC ?건 · 2,748 ?건 → (2) 철회 확정 / 번복
사다리 × 거래소: 각 단 exchangeListed ? / OTC ? / null ?
3분류 × 거래소 교차표: (9칸)
두 출처 거래소 불일치 CIK: ?개
버킷(두 분모 병기): mega ?%/?% · large ?%/?% · mid ?%/?% · small ?%/?% · micro ?%/?% · no-mcap n=?
ICC 4값: 604_def860 ? (기록 0.195와 일치/불일치) · 604_noMin 0.267 · 전수_def860 ? · 전수_noMin 0.176
tsc 0 · vitest ?/? · revdcf_results 무변경 확인
```

컷·거래소 기준에 대한 **의견을 쓰지 말 것.** 판정은 장은태가 한다.
