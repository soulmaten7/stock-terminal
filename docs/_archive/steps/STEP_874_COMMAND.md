# STEP 874 — 차이 3·4행(driver 4 운전자본 · driver 5 고정자본) 원전식 실측 (측정 전용 · 코드 0줄)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_874_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `6649778`(STEP 873 · `main`·`revdcf-preview` 동일) · tsc 0 · test 153/153 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,886
🔴 `docs/PRIMARY_SOURCE_MAP.md`가 **untracked**로 있다 — 이번 커밋에 포함한다.

---

## §0. 🔴 왜 두 행을 같이 하나 — 원본 개봉 결과 (Cowork · 2026-08-02)

**원전 T4·T5는 같은 구조다.** 둘 다 **증분식 + 5년 누적**이다.

```
T4 『Working Capital Analysis』
  Cash                   = 매출 × 0.02          ← C5 = Inputs!C5*0.02  (실제 현금잔고 아님)
  Current operating assets      = 필요현금 + A/R + 재고 + 기타유동자산
  Current operating liabilities = 무이자 유동부채만              ← C44 = C39+C41+C42+C43 (C40 단기차입금 제외)
  Net working capital    = 자산 − 부채
  🔴 5년 누적            = (I23−D23) ÷ (I26−D26)               ← I31

T5 『Cash Flow Method』
  Net Fixed Capital Investments = capex + 인수 + D&A            ← D&A 음수라 실제로는 차감
  🔴 5년 누적            = −(E13+…+I13) ÷ (E16+…+I16)          ← I20
```

`Tutorial 4` B23이 **무이자만 차감을 명시**한다: *"Other **non-interest bearing** current liabilities."*
→ registry가 *"단기차입금 미차감 → **태그부족 우회 가설**"*이라 적었는데 **가설이 아니라 원전에 명시된 설계다.**

### 우리 구현 (`lib/revdcf/drivers.ts`)

```
:186  workingCapitalRate       = mean( (유동자산 − 영업현금 − 유동부채) ÷ 매출 )   ← 🔴 수준형. 원전과 분자·분모가 다른 공식
:167  fixedCapitalRateLevel    = mean( PP&E ÷ 매출 )                              ← 🔴 원전에 없는 개념
:184  fixedCapitalRateMarginal = cumNet ÷ cumΔRev                                 ← ✅ 원전 T5식
:191  fixedCapitalRate: fixedCapitalRateLevel                                     ← 🔴 엔진이 쓰는 건 level
```

🔴 **driver 4는 원전 공식이 아예 없고, driver 5는 원전식을 계산해놓고 부판정으로만 쓴다.** 둘 다 ①(원전 절차)조차 안 지키고 있다.
🔴 우리 운전자본식은 **유동부채 전액**을 뺀다 — 원전은 무이자만 뺀다.

### driver 5는 이미 답이 나와 있다 (Cowork DB 실측 · `as_of 2026-08-03` · 515사)

| | level(현행) | marginal(원전 T5) |
|---|---|---|
| 중앙 투자율 | 0.193 | **0.272** |
| 음수 / \|값\|>1 | 0 / 71 | **101 / 133** |
| 계산 불가(Δ매출=0) | 0 | **50**(9.7%) |
| `years` 산출 | **177** | **128**(−27.7%) |
| GAP p25/p50/p75 | 6 / 11 / 17 | 5 / **10** / 14.25 |
| 판정 이동 | — | **149/515 (28.9%)** · years 유출 57 vs 유입 8 (**7배 비대칭**) |

🔴 **이 비대칭을 "원전식이 불안정하다"로만 읽지 말 것.** `level`은 **감가상각된 PP&E 장부가**라 성숙 기업일수록 투자율이 작게 나오고, 투자율이 작으면 FCF가 커져 **`years`가 나오기 쉬워진다.** 즉 현행은 *"이 주가는 설명된다"*고 말하기 쉬운 쪽으로 **편향돼 있을 수 있다.** 그리고 `level`은 **원전에 없는 개념**이다.

---

## 🔴 금지사항

| # | 금지 |
|---|---|
| 1 | 🔴 `lib/**`·`app/**`·`components/**`·`messages/**` 수정 — **`drivers.ts`를 고치지 말 것** |
| 2 | `revdcf_results`·`us_market_cap` 쓰기 · 플래그·화면 변경 |
| 3 | 🔴 **채택 여부를 쓰지 말 것** — ③판정은 장은태 |
| 4 | 🔴 **driver 6·다음 행 착수 제안 금지** |
| 5 | 🔴 원전에 없는 새 산식을 **발명하지 말 것** — §2의 A·B 두 안만 잰다 |

---

## §1 — 원본 재확인 (⓪-3 · 이 명령서도 그대로 믿지 말 것)

1. `data/sources/expectations-investing/T4.xlsx` — `Working Capital Analysis` 시트 **셀 수식**(C5·C9·C15·C17·I31)과 `Tutorial 4` B18~B23(7개 구성요소)·B32 각주. §0 인용이 맞는지 확인.
2. `T5.xlsx` — `Cash Flow Method` D9·D13·E18·I20 · `Tutorial 5` **B50·B52**.
   🔴 **B52 원문**: *"we assume that Domino's will invest slightly under this amount at **10.0%** … (see page 92)"* — **계산값 11.6%를 저자가 10.0%로 바꿔 넣었다.**
   그런데 `T8 Inputs!C10 = 0.15`다. **T8 스프레드시트와 책이 다르다.** 이 사실을 보고에 적을 것. 🔴 **어느 쪽이 정본인지 판단하지 말 것**(책 page 92 미보유).
3. `lib/revdcf/drivers.ts` 167·184·186·191행 — §0 인용 확인.
4. 🔴 **도미노 앵커**: T4·T5의 도미노 입력으로 우리 계산을 돌리면 원전 계산값(**운전자본 5년누적 0.50% · 고정자본 5년누적 11.6%**)이 재현되는지. **재현 안 되면 그 자체가 발견이다.**

---

## §2 — driver 4 원전식 실측

**신규 파일**: `scripts/probe_874_wc.ts` (측정 전용)
**대상**: `as_of` 최신의 `skip_reason is null` **515사**. companyfacts는 **866 캐시 재사용**(재다운로드 금지).

### 두 안을 **따로** 잰다

**A안 — 원전 세부 태그 그대로**
```
필요현금 = 매출 × 0.02
운영유동자산 = 필요현금 + AccountsReceivableNetCurrent + InventoryNet + OtherAssetsCurrent
운영유동부채 = AccountsPayableCurrent + 무이자 미지급성 항목(AccruedLiabilitiesCurrent 등)
```
🔴 registry가 *"재고·미지급 세부 태그가 희소해 604 중 **26%**"*라 기록했다. **515 전수로 다시 재라.** 태그별 결측률을 따로 낼 것.

**B안 — 집계 태그 조합(근사)**
```
운영유동자산 = AssetsCurrent − 현금·단기투자 + 매출×0.02
운영유동부채 = LiabilitiesCurrent − 이자부 유동부채(단기차입금·유동성장기부채)
```
🔴 **847이 A안만 보고 기각했을 가능성이 있다**(driver 3에서 원전 A안[장부세율]을 안 본 것과 같은 패턴). B안이 원전 정의에 얼마나 가까운지·커버리지가 얼마인지를 재라.
🔴 **B안은 근사다.** 원전과 다른 점(무이자 판별을 태그로 못 하는 부분)을 **명시**할 것.

### 두 안 각각 산출

```
NWC(y)        = 운영유동자산 − 운영유동부채
5년 누적 비율 = (NWC[lastY] − NWC[firstY]) ÷ (매출[lastY] − 매출[firstY])
```

🔴 **연도별 비율도 같이 낼 것**(도미노가 −26.7%~+18.2%로 요동쳤다). 5년 누적만 보면 그 불안정성이 안 보인다.

## §3 — 결과 변화 (driver 5와 같은 틀)

기존 엔진을 **import만** 해서 `workingCapitalRate`만 교체해 다시 태운다(`maxYears: 25` · `processOne()` 조립 그대로).

**보고 항목** — A안·B안 각각, 현행(수준형) 대비:

| 항목 | 현행 | A안 | B안 |
|---|---|---|---|
| 커버리지(계산 가능) | 515 | ? | ? |
| 중앙 비율 · p05/p95 | ? | ? | ? |
| 음수 / \|값\|>1 / 계산불가 | ? | ? | ? |
| `years` 산출 | 177 | ? | ? |
| GAP p25/p50/p75 | 6/11/17 | ? | ? |
| 판정 이동 수 · **유출/유입 비대칭** | — | ? | ? |

🔴 **driver 5(marginal)와 동시에 적용했을 때**도 한 번 낼 것 — 둘은 같은 T4/T5 구조라 **따로 바꾸면 비대칭이 남는다**(지금이 그 상태다).

산출: `docs/probe_874_output.json` · CIK별 행 `docs/probe_874_rows.json`

## §4 — 문서

- **진행표 3·4행**(driver 4·5)의 ①②칸을 §2·§3 수치로 채운다. 🔴 **③판정은 `대기` 유지.**
- `docs/REVDCF_SPEC.md`:
  - §11 실측 원장에 §2·§3 수치 + **driver 5 DB 실측표**(§0) 추가
  - 🔴 §10 미결 **신규**: *"원전은 튜토리얼 계산값을 그대로 쓰지 않는다 — T5 B52가 계산 11.6% → 책 10.0%로 바꿔 넣었음을 명시. 그 조정 규칙은 원전에 없다. 우리는 계산값을 그대로 쓴다"*
  - 🔴 §10 미결 **신규**: *"T8 스프레드시트(`Inputs!C10=0.15`)와 책(10.0%)이 다르다 — 어느 쪽이 정본인지 미확정(책 미보유)"*
  - 🔴 registry의 *"단기차입금 미차감 → 태그부족 우회 가설"* → **"원전에 명시된 설계(T4 B23 non-interest bearing)"**로 정정
- `docs/PRIMARY_SOURCE_MAP.md`를 **git에 추가**(내용 수정 금지 — Cowork 판독본이다)

## §5 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- lib/ app/ components/ messages/ data/   # 🔴 출력 없어야 함
```

```sql
select as_of, count(*) from revdcf_results group by as_of order by as_of desc;  -- 604 ×3
select count(*) from us_market_cap;                                             -- 5,886
```

```bash
git add scripts/probe_874_wc.ts docs/probe_874_*.json docs/PRIMARY_SOURCE_MAP.md \
        docs/LENS_COMPLETION_STANDARD.md docs/REVDCF_SPEC.md \
        docs/STATE.md docs/CHANGELOG.md docs/STEP_874_COMMAND.md
git commit -m "STEP 874: measure working capital and fixed capital against the primary source formulas

- T4 and T5 both use an incremental, five-year-cumulative rate; we use level ratios for both
  and only carry the T5 form as a secondary verdict
- our working capital formula subtracts all current liabilities where the source subtracts
  only non-interest-bearing ones, and uses 2 percent of sales as required cash
- measure the source formula two ways: the detailed tags it names, and an aggregate
  approximation, because 847 rejected it on the detailed tags alone
- report coverage, sign flips, blowups and verdict migration for each, and for both drivers
  applied together
- record that the source does not use its own computed figures: T5 states 11.6 percent
  computed against 10.0 percent assumed in the book, and the T8 workbook says 15 percent
- verdicts stay pending; no engine change, flag unchanged"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§1 원본: T4/T5 수식 확인 ? · B52 원문 ? · T8 C10=0.15 vs 책 10.0% ? · 도미노 앵커 재현 ?(0.50% / 11.6%)
§2 driver4 커버리지: A안 ?/515 (태그별 결측) · B안 ?/515
§3 결과(현행 vs A vs B, 그리고 driver5 동시적용):
   중앙비율 · 음수/극단/계산불가 · years 177→? · GAP 11→? · 이동 ? · 유출/유입 비대칭 ?
§4 진행표 3·4행 ①② 채움(③ 대기 유지) · §10 미결 2건 · registry "가설"→"명시된 설계" 정정
   · PRIMARY_SOURCE_MAP.md git 추가
무변경: revdcf_results 604×3 · us_market_cap 5,886 · lib/app/components/messages diff 없음
tsc 0 · test ?/? · push ?
🔴 못 한 것 · 미측정
```

🔴 **채택 여부·다음 행에 대해 한 줄도 쓰지 말 것.**
