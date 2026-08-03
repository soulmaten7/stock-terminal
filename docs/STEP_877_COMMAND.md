# STEP 877 — driver 3 근거 재정정 · driver 4 근거 강화 · driver 6 베타 기록 (문서 전용 · 코드 0줄)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_877_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `79cb2b5`(STEP 876 · `main`·`revdcf-preview` 동일) · tsc 0 · test 153/153 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

---

## 0. 성격 — 문서 전용

🔴 `lib/**`·`app/**`·`components/**`·`messages/**`·`scripts/**`·`data/` **diff 0**. 새 측정 없음. **이미 실측된 사실을 정본에 반영**한다.
🔴 **어느 행의 ③판정도 뒤집지 말 것.** 근거만 고친다.
🔴 **다음 행 착수 제안 금지.**

---

## §1 — 🔴 driver 3: 근거 재정정 (오늘 두 번째)

**Cowork이 `T7.xlsx`의 `Inputs`·`WACC` 시트를 직접 개봉한 결과(2026-08-02):**

```
T7 Inputs
  Risk free rate       C4  = 0.0065
  YTM of debt          C5  = 0.04546
  Equity risk premium  C7  = 0.051
  Beta of stock        C8  = 1
  🔴 Corporate tax rate C10 = 0.165
T7 WACC
  세후 부채비용 = C5 × (1 − Inputs!C10) = 0.037959
  자기자본비용  = C4 + C7×C8 = 0.0575
  WACC          = 0.05354
```

🔴 **`C10 = 0.165`다.** 이는 `T8 Inputs!C15 Cash tax rate = 0.165`와 **같은 값**이고, T6가 계산한 도미노 현금세율(최근 2년 **0.164 / 0.167**)과도 같다.
→ **원전은 WACC에도 현금세율을 쓴다.** 도미노 한계세율이 16.5%일 수 없다(미 법인세 21% + 주세).

🔴 **T7 튜토리얼 본문 B26은 *"We enter the **marginal tax rate** in cell C10"*이라 적는다. 본문과 셀 값이 다르다.**

### 고칠 것 — `docs/LENS_COMPLETION_STANDARD.md` 진행표 2행(driver 3) 각주

873이 적은 근거 중 아래를 **철회**한다:

> ~~*"원전은 세율을 둘 쓴다 — NOPAT은 현금세율(T6), WACC 세후 부채비용은 한계세율(T7 B26). 우리는 하나를 양쪽에 쓴다."*~~

**아래로 교체**:

> 🔴 **재정정(877 · 오늘 두 번째)**. `T7 Inputs!C10 = **0.165**` — **원전은 WACC에도 현금세율을 쓴다.** 본문 B26의 *"marginal tax rate"*는 **셀 값과 다르다.**
> **정정된 대조**:
>
> | | 원전 | 우리 |
> |---|---|---|
> | NOPAT 세율 | 현금세율 **16.5%** | 한계세율 25.63% |
> | WACC 세후 부채비용 | 현금세율 **16.5%** | 한계세율 25.63% |
> | 구조 | 하나를 양쪽에 | 하나를 양쪽에 |
>
> 🔑 **구조는 같고 값만 다르다.** → driver 3은 성격상 **"차이 9행"이 아니라 "동일 식·값만 차이"** 행에 가깝다. 🔴 **재분류는 장은태 판정 — 이 STEP에서 옮기지 말 것.**
> 🔴 **미측정**: 세율 16.5%→25.63%의 순효과. NOPAT 감소(GAP↑)와 WACC 하락(GAP↓)이 **반대 방향**이라 계산 없이는 모른다.
>
> **③판정(현행 유지)은 그대로다** — 다모다란의 *"in perpetuity … marginal tax rate"* 근거가 지탱한다. 🔴 다만 **원전은 그 권고를 따르지 않는다**는 사실을 함께 적는다.

🔴 **`docs/REVDCF_SPEC.md` §622·§966·§1311**의 *"현금세율 금지 — 이자 세금방패 이중계산"* 서술도 함께 정정한다. T6 현금세율은 **unlevered**(방패를 뺀 값)이고, 원전은 WACC에도 같은 값을 쓴다 — **이중계산이 발생할 구조가 아니다.**

## §2 — driver 4: 근거 3번을 **더 강한 것**으로 교체

876이 도미노 실물(**DPZ · CIK 1286681**)을 우리 유니버스에서 찾아 XBRL과 직접 대조했다. T4 2019년 4항목:

| 원전 항목 | 값 | 오늘날 XBRL |
|---|---|---|
| Accounts payable | 111,101,000 | ✅ 일치 |
| Other accrued liabilities | 66,267,000 | ✅ 일치 |
| **Accrued expenses** | 131,148,000 | 🔴 **어떤 태그와도 불일치** |
| **Advertising fund liabilities** | 101,921,000 | 🔴 **표준 태그 없음** |

그리고 `AccruedLiabilitiesCurrent`는 **DPZ가 2012년 이후 미사용**이다.

### 고칠 것 — 진행표 3행 각주의 `3′`을 아래로 교체

> **3″. 🔴 A안은 커버리지가 낮은 것이 아니라 원리적으로 불가능하다(876 실측).**
> 확장 태그 6종(`EmployeeRelatedLiabilitiesCurrent` 349 · `OtherAccruedLiabilitiesCurrent` 240 · `AccruedLiabilitiesCurrent` 231 · `OtherLiabilitiesCurrent` 226 · `AccountsPayableAndAccruedLiabilitiesCurrent` 52 · `OtherSundryLiabilitiesCurrent` 40)으로 커버리지를 12.6%→**29.5%(152/515)**까지 올렸으나, **원전 자신의 사례(도미노)조차 재현되지 않는다** — 4항목 중 2개가 오늘날 XBRL에 **대응 태그가 없다.**
> 🔑 **원전은 사람이 10-K 대차대조표를 눈으로 읽고 항목을 골랐고, 우리는 태그로 자동 수집한다. 그 사이에 매핑이 존재하지 않는다.**
> 🔴 **따라서 잔여 70.5%는 "더 줄일 수 있는 갭"이 아니다.** 876 보고가 그렇게 적었으나 도미노 앵커 실패가 그것을 부정한다.
> (참고: 확장 A안 적용 시 152 표본에서 `years` 42 · GAP 중앙 11→**14** · 유출1/유입2)

🔴 **③판정(✅ 현행 유지)은 그대로.**

## §3 — driver 6: 베타 기록 (신규)

T7 `Inputs!C8 Beta of stock = **1**`. **원전은 도미노 베타에 그냥 1을 넣었다.**
우리는 다모다란 **업종 무차입 베타**를 D/E로 재레버리지한다(`assembleWacc`).

진행표 5행(driver 6) 각주에 **기록만** 한다. 🔴 **판정하지 말 것**(registry에서도 미결):

> 🔴 **원전 대조(877 · 미판정)**
> | | 원전 T7 | 우리 |
> |---|---|---|
> | 부채비용 | 회사별 **실제 YTM** (0.04546) | 다모다란 **업종 신용스프레드** |
> | 베타 | **1** (도미노에 그대로) | 업종 무차입 베타 재레버리지 |
> | 세율 | **현금세율 0.165** | 한계세율 0.2563 |
> | 무위험·ERP | 0.0065 / 0.051 | 다모다란 DB |
> | 자본구조 | 시장가 부채/자기자본 | 동일 |
> 🔴 **원전 도미노 WACC = 0.05354.** 우리 515사 WACC 분포와 대조된 적 없다 — **미측정.**

## §4 — 플레이북 #76 (신규)

- **문제**: 원전 대조에서 **같은 유형의 오류가 오늘 네 번** 났다. 전부 **서술을 읽고 셀 값을 안 본 것**이다.

| # | 서술 | 셀 값 |
|---|---|---|
| 1 | T6 *"현금세율은 방패를 반영"*으로 읽음 | T6는 **unlevered** — 방패를 뺀다 |
| 2 | T7 B26 *"marginal tax rate"* | `Inputs!C10 = **0.165**`(현금세율) |
| 3 | T5 *"계산 11.6%"* | 책 10.0% · **T8 `C10=0.15`** |
| 4 | T4 스프레드시트 0.5% | 책 **3.2%**(B32 각주) |

- **원인**: 원전이 **서술·책·워크북 세 층**을 갖고 있고 **층마다 값이 다르다.** 서술은 가르치기 위한 것이라 단순화·반올림이 들어간다.
- **해결**: 🔑 **원전 대조는 셀 값으로 한다. 서술은 셀을 찾는 안내로만 쓴다.** 서술과 셀이 다르면 **셀이 이긴다** — 단 그 불일치 자체를 기록한다.
- **조건**: 스프레드시트·코드가 딸린 모든 원전 대조.

## §5 — 문서 · 검증 · 커밋

- `docs/PRIMARY_SOURCE_MAP.md` §1(driver 3)에 **T7 `C10=0.165`** 반영 — 기존 *"원전은 세율을 둘 쓴다"* 절을 정정. 🔴 **삭제가 아니라 정정 표시**로(이력 보존).
- `docs/REVDCF_SPEC.md` §11에 T7 입력값 5종 · §10 미결 **신규 2건**: ① *"세율 16.5%↔25.63%의 순효과 미측정(상반 방향)"* ② *"원전 도미노 WACC 0.05354 vs 우리 515사 WACC 분포 미대조"*
- `docs/STATE.md` 근거 정정 반영. 🔴 1~2p 상한

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ scripts/ data/   # 🔴 출력 없어야 함
```

```bash
git add docs/LENS_COMPLETION_STANDARD.md docs/REVDCF_SPEC.md docs/PRIMARY_SOURCE_MAP.md \
        docs/LENS_DEV_PLAYBOOK.md docs/STATE.md docs/CHANGELOG.md docs/STEP_877_COMMAND.md
git commit -m "STEP 877: correct the tax ground again, strengthen the working capital ground, log the beta gap

- T7 Inputs C10 is 0.165, the same cash tax rate the model uses for NOPAT, so the source
  applies one rate on both sides; the tutorial text calling it marginal does not match its own
  cell, and our earlier claim that the source splits the rate is withdrawn
- that also removes the double-counting rationale recorded against cash tax rates: the source
  rate is unlevered and reused in WACC, so no double count can arise
- working capital: replace the withdrawn coverage ground with a stronger measured one; the
  source cannot be reproduced even on its own Domino case because two of the four items it
  used have no counterpart in current XBRL, so the residual gap is not closable
- record the beta gap: the source enters 1 for Domino while we relever an industry beta
- playbook 76: read the cells, not the prose; where they disagree the cell wins and the
  disagreement gets recorded
- documents only; verdicts unchanged, no code, flag unchanged"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§1 driver3 근거 재정정 · SPEC 622/966/1311 이중계산 서술 정정 · ③ 유지 확인
§2 driver4 근거 3″ 교체(A안 원리적 불가) · ③ 유지 확인
§3 driver6 베타·YTM·세율 대조 기록(미판정)
§4 플레이북 #76
§5 MAP §1 정정 · SPEC §11·§10 신규 2건 · STATE
무변경: lib/app/components/messages/scripts/data diff 없음 · revdcf_results 604×3
tsc 0 · test ?/? · push ?
🔴 못 한 것 · 미측정
```

🔴 **어느 판정도 뒤집지 말 것. 다음 행을 제안하지 말 것.**
