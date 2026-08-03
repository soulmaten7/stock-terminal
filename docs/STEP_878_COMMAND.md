# STEP 878 — 877 미완 정정 마무리 · 원장 3자 동기화 · driver 5 제3안 재료

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_878_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `c5d2601`(STEP 877 · `main`·`revdcf-preview` 동일) · tsc 0 · test 153/153 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` OFF 유지 · `revdcf_results`·`us_market_cap` **쓰기 금지**(읽기만) · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.

---

## 0. 성격

§1·§2 = **정정·동기화**(이미 확인된 사실 반영). §3 = **재료 수집**(실측).
🔴 **어느 행의 ③판정도 내리지도 뒤집지도 말 것.** §3은 세 안을 **재기만** 한다.
🔴 **다음 행 착수 제안 금지.**

---

## §1 — 🔴 877이 못 끝낸 정정 (Cowork 실측 확인)

877 보고가 이렇게 적었다:

> *"STEP이 인용한 §622·§966·§1311 중 §1311은 현재 `REVDCF_SPEC.md`에서 그 위치에 이중계산 관련 서술을 찾지 못했습니다."*

🔴 **찾지 못한 것이 아니라 줄번호가 밀린 것이다.** Cowork이 직접 grep했다 — 현재 `docs/REVDCF_SPEC.md` **1344행**(§12 **A분류(우리가 정한 규칙)** 표)에 그대로 살아 있다:

```
| 세율 | **한계세율**(실효세율 아님) · **현금세율 금지**(이자 세금방패 이중계산) |
```

→ **877은 622·991 두 곳만 고쳤고, 세 번째 자리가 남았다.** 877이 정정한 서술과 이 줄이 **지금 서로 모순**이다.

### 고칠 것 1 — `docs/REVDCF_SPEC.md` §12 A분류 표 `세율` 행

> | 세율 | **한계세율**(실효세율 아님) · ~~현금세율 금지(이자 세금방패 이중계산)~~ 🔴 **정정(878)**: 이중계산은 근거가 아니다(T6 현금세율은 **unlevered**, 원전도 `T7 Inputs!C10=0.165`로 WACC에 같은 현금세율 사용). 실제 근거 = **"영구 구간엔 한계세율"**(다모다란) · 원전은 그 권고를 따르지 않는다 |

🔴 **취소선 보존**(이력). 삭제하지 말 것.

### 고칠 것 2 — 같은 표 `driver 5` 행

현재:
```
| driver 5 | **수준형** 자본집약도(PP&E÷매출) × Δ매출 |
```
이 줄에는 **875의 강등이 반영돼 있지 않다.** A분류 표는 "우리가 정한 규칙"인데, 이 규칙은 875에서 **근거 부재로 강등**됐다. 아래를 덧붙인다:

> 🔴 **875 강등**: 이 규칙은 **원전에도 다모다란 권고에도 없다**(PP&E÷매출 = 자본집약도이지 재투자율 아님). **③판정 대기 중** — 진행표 4행 각주 참조. 코드는 여전히 이 값을 주 판정으로 쓴다(`drivers.ts:191`).

🔴 **§12 A분류 표 전체를 훑어 875·876·877에서 뒤집힌 다른 줄이 더 있는지 확인하고, 있으면 같은 방식으로 정정한다.** 없으면 "없음"이라고 보고.

## §2 — 🔴 원장 3자 불일치 동기화

Cowork이 `lib/revdcf/registry.ts` `INPUTS`와 `docs/LENS_COMPLETION_STANDARD.md` 진행표를 대조했다. **네 행이 서로 다른 상태를 적고 있다:**

| 행 | `registry.ts` | 진행표 |
|---|---|---|
| driver 5 고정자본 | *"✅ 852 이중 산정 … **기본값=level(안정)**"* | 🔴 **대기(근거부재·875)** |
| 인플레 | *"✅ 851 확정"* | 🔴 **대기** |
| driver 6 자본비용 | *"✅ 849: 구성요소 조립으로 배선"* | 🔴 **대기(미판정)** |
| driver 4 운전자본 | *"단기차입금 미차감 → 태그부족 우회 **가설**"* | ✅ 승인(2026-08-03) |

🔑 **원인 진단**: `INPUTS`의 상태는 `divergence` **자유서술 안의 이모지**로만 표현된다(`status` 필드는 `OUR_ADDITIONS`에만 있다). 그래서 **"배선했다(구현)"**와 **"원전 대조 판정을 내렸다"**가 같은 ✅ 하나로 적혀 구분되지 않는다.

🔴 **`registry.ts`는 런타임 소비자가 없다** — Cowork이 `app`·`lib`·`components`·`scripts`·테스트 전체를 grep한 결과 **import 0건**. 순수 문서다. 따라서 이 편집은 `lib/` 아래지만 **동작 변경 0**이다. 🔴 **그래도 `npx tsc --noEmit && npm run test`로 확인할 것.**

### 고칠 것 — `divergence` 문자열 안에서 두 축을 분리해 적는다

- **`incrementalFixedCapitalRate`**: `"✅ 852 이중 산정 … 기본값=level(안정)"` → **852의 확정 표기를 유지하되 뒤에 강등을 명시**:
  > 🔴 **875 강등**: level은 원전·다모다란 어디에도 근거가 없다(자본집약도 ≠ 재투자율). marginal은 T5 `I20`과 정확 일치(도미노 11.617% 재현)이나 계산불가 50·극단 133. **③판정 대기 — 어느 쪽도 채택 근거 미확보.** 코드 주 판정은 여전히 level(`drivers.ts:191`).
- **`incrementalWorkingCapitalRate`**: *"단기차입금 미차감 → 태그부족 우회 **가설**"* → **가설이 아니다.** `T4 Tutorial 4` B23이 *"Other **non-interest bearing** current liabilities"*라 **명시**한다 — **원전의 설계**다. 문구 정정(취소선 보존).
- **`costOfCapital`**: 앞머리를 **두 축으로 분리** — `✅ 849 구현(배선 완료)` / `🔴 원전 대조 판정 미결(877에 베타·YTM·세율 기록만)`.
- **`inflation`**: 🔴 **먼저 확인만 하라.** 851 기록(`docs/` 또는 CHANGELOG)을 열어 **851이 확정한 것이 무엇인지** 본다 — ⓐ *"i에 어떤 값을 쓸지"*(A분류 규칙 선택)인지 ⓑ *"원전 1.6% vs 우리 2.5%"* 대조 판정인지. **ⓐ라면 진행표의 🔴 대기가 맞고 registry의 ✅는 다른 축의 ✅다** → 그렇게 두 축으로 나눠 적는다. **ⓑ라면 진행표를 채운다.** 🔴 **판정을 새로 내리지 말 것 — 851이 무엇을 했는지만 읽고 옮긴다.** 판단이 안 서면 **"확인 불가"로 보고하고 양쪽 다 그대로 둔다.**

🔴 **`INPUTS`에 `verdict`/`decidedIn` 필드를 새로 추가하지 말 것** — 원장 스키마 변경은 판정이 아니라 설계이고 **장은태 몫**이다. 이번엔 **문자열 안에서만** 분리한다. 🔴 필드 추가가 필요하다는 의견이 있으면 **보고에 적기만** 하라.

## §3 — driver 5: 제3안 재료 (🔴 판정 금지)

875가 명시적으로 남긴 숙제다:

> *"driver 5는 '현행 유지'도 '원전 채택'도 근거가 부족한 상태다. 제3의 방식(다모다란 sales-to-capital·capex 기반 재투자율 등)을 재는 것이 남았다."*

**3중 규칙 순서대로. ①→②→③. 순서 바꾸지 말 것.**

### ① 원전 재개봉 — 🔴 셀로 본다(플레이북 #76)

`data/sources/expectations-investing/T5.xlsx` **전 시트**를 다시 연다. 확인할 것:

1. 원전이 **Δ매출 ≈ 0 · 음수 증분투자율 · 극단값**을 어떤 식으로든 다루는 셀·수식이 있는가? (IF·MAX·MIN·하한·예외처리) — **없으면 "없다"고 적는다.**
2. `T5` 계산 **11.6%** → 책 **10.0%** → `T8 Inputs!C10` **15%** 세 층 차이의 근거가 시트 어딘가에 셀로 적혀 있는가?
3. 원전이 `PP&E 잔액`을 **어디에서든** 쓰는가? (875는 T4·T5·T8에 없다고 했다 — **T3·T6·T7·T9·T10까지 포함해** 재확인)

🔴 **서술(Tutorial 시트 텍스트)과 셀이 다르면 셀이 이긴다. 불일치 자체를 기록한다.**

### ② 우리 DB 실측 — 3안

`revdcf_results` 최신 `as_of` 604 / 비교 모집단은 874·875와 **같은 515**를 쓴다(달라지면 이유를 적는다). 🔴 **읽기만. 쓰기 금지.**

| 안 | 정의 | 비고 |
|---|---|---|
| **3안-A** capex-only | `(capex − D&A) ÷ Δ매출` 5년 누적 | 원전식에서 **인수(acquisitions)만 뺀** 것 |
| **3안-B** sales-to-capital | 다모다란식 — `Δ매출 ÷ 투자자본 증분`의 역수 | 🔴 ③에서 **원문 정의를 먼저 확인**한 뒤 그 정의대로 |
| **3안-C** Δ매출 하한 marginal | 원전식에 `\|Δ매출\| < 매출 × k` 이면 **산출 제외** | 🔴 **k를 임의로 정하지 말 것.** Δ매출/매출 분포에서 유도하고 그 유도 과정을 적는다(CLAUDE.md 상수 금지) |

각 안마다 **전부** 낸다:

- 커버리지(계산가능 N / 515)
- **음수 개수** · `\|값\|>1` 개수 (현행 level 0/71 · 원전 marginal 101/133과 같은 줄에 놓고 비교)
- 중앙값 · p25/p75
- `years` 개수 · GAP p50·p25/p75
- **판정 이동**(유출/유입) — 🔴 874가 겪은 정의 문제를 반복하지 말 것: *"비교가능만"*과 *"계산불가도 이탈로 셈"* **둘 다 병기**
- 🔴 **도미노 앵커** — `T5`의 원본 6년 창(기준 2014 + 합산 2015~2019)으로 각 안을 돌려 **재현되는지**. marginal은 11.617%로 원전 11.6%와 일치했다(`docs/probe_875_anchor.json`). **재현 불가면 "불가"라고 적는다** — level처럼 앵커할 지점 자체가 없는 안이 있을 수 있다.

프로브 결과는 `docs/probe_878_driver5.json`으로 저장(875 선례).

### ③ 검색 — 🔴 결론 전에

- 다모다란 원문에서 **증분 재투자율의 음수·불안정 처리**를 어떻게 하라는지 **직인용**. (`pages.stern.nyu.edu/~adamodar/` — reinvestment rate / sales-to-capital ratio 페이지)
- **sales-to-capital ratio의 정확한 정의**(분자·분모)를 원문에서 확정한 뒤 ②의 3안-B에 반영. 🔴 **정의를 추측해서 계산하지 말 것** — 검색이 먼저다.
- 학술: 증분 자본지출률의 **횡단면 안정성**을 다룬 문헌이 있는가. 없으면 "없음".

🔴 **③이 ②의 3안-B 정의를 정한다.** 검색이 먼저 끝나야 3안-B를 잴 수 있다. 순서가 뒤집히면 그 사실을 보고에 적어라.

### 🔴 §3의 출력 = 재료뿐

진행표 4행 각주에 **"878 제3안 실측"** 블록을 추가한다. 🔴 **③판정 칸은 `🔴 대기` 그대로 둔다.** 🔴 **세 안 중 무엇을 채택하자고 제안하지 말 것.** 어느 안이 어떤 축에서 낫고 어떤 축에서 나쁜지 **사실만** 적는다. **전부 나쁘면 "전부 나쁘다"고 적는다.**

## §4 — 문서 · 검증 · 커밋

- `docs/REVDCF_SPEC.md` §12 A분류 표 정정(§1) · §10 미결에 878이 새로 못 잰 것 추가
- `lib/revdcf/registry.ts` 문자열 정정(§2)
- `docs/LENS_COMPLETION_STANDARD.md` 진행표 4행 각주에 878 실측 추가 · 불일치 동기화 반영
- `docs/LENS_DEV_PLAYBOOK.md` **#77**: 🔑 *"줄번호로 인용한 위치는 문서가 자라면 밀린다. 못 찾았을 때 '없다'로 결론내지 말고 **내용으로 grep**해 확인한다."* (877이 §1311을 부재로 결론냈으나 1344행에 있었다)
- `docs/STATE.md` 🔴 1~2p 상한
- `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- app/ components/ messages/ data/    # 🔴 출력 없어야 함
git diff --stat HEAD -- lib/                                # 🔴 registry.ts 만이어야 함
```

```bash
git add -A docs/ lib/revdcf/registry.ts
git commit -m "STEP 878: finish the tax correction, sync the ledgers, measure a third fixed-capital option

- the double-counting rationale survived at a third site the previous step reported as absent;
  the line number had shifted, the text was still there, and it now contradicts what 877 wrote
- the A-class rule table still described the level capital-intensity rule without the demotion
  recorded against it, so the table claimed a rule the verdict no longer supports
- the registry and the progress table disagreed on four rows because the registry encodes
  wiring and source-comparison verdicts as one mark; those are now written as two axes
- the working capital note called the non-interest-bearing exclusion a workaround hypothesis;
  the source states it outright, so it is a design decision
- fixed capital: measure three further options with coverage, sign, extremity, verdict movement
  and a Domino anchor for each; no verdict, no recommendation
- playbook 77: a citation by line number rots as the document grows; grep the text, not the line"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 SPEC 1344행 정정 · driver5 A분류 줄 강등 반영 · A분류 표 잔여 점검 결과
§2 registry 4행 두 축 분리 · 인플레는 851 확인 결과대로(판정 없음) · import 0 확인
§3 ① 원전 T5 재개봉(예외처리 유무 · PP&E 잔액 전 시트 재확인)
   ② 3안 실측 표(커버리지·음수·극단·GAP·판정이동 양정의·도미노 앵커)
   ③ 다모다란 직인용 · sales-to-capital 정의 확정 여부
   🔴 ③판정 칸 = 대기 그대로
§4 플레이북 #77 · 문서
무변경: app/components/messages/data diff 없음 · lib은 registry.ts만 · revdcf_results 604×3 무변경
tsc 0 · test ?/? · push ?
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **어느 판정도 내리거나 뒤집지 말 것. 다음 행을 제안하지 말 것.**
