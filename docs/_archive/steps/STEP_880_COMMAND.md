# STEP 880 — 🔴 driver 5 ③판정 확정: 원전식(marginal) 채택 · 주 판정 전환 · 3중 재검증

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_880_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `dc8045f`(STEP 879 · `main`·`revdcf-preview` 동일) · tsc 0 · test 153/153 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지 · 🔴 **크론 수동 실행 금지**(§3 참조).

---

## §0 — 🔴 ③판정 (장은태 확정 · 2026-08-03)

> **driver 5 고정자본 = 원전식(`marginal`)을 주 판정으로 채택한다. `level`을 주 판정에서 내린다.**

**근거 셋**

1. **원전 앵커를 통과한 유일한 형태다.** T5 `I20` 6년 창(기준 2014 + 합산 2015~2019)으로 우리 공식을 돌리면 **11.617% ≈ 원전 11.6%**(875·879 재현).
2. **`level`은 원전과 연결할 지점 자체가 없다.** 879 ①이 `T3~T10` **전 파일**을 스캔해 PP&E 잔액 **계산 셀 0건**을 확인했다(서술 문장 3건뿐). `PP&E ÷ 매출`은 **자본집약도**이지 재투자율이 아니다. 🚫 창작 금지에 걸린다.
3. **`level`의 안정성은 편향을 대가로 산 것이다.** 감가상각된 장부가라 성숙기업일수록 작게 나오고, 작으면 FCF가 커져 **"이 주가는 설명된다"** 쪽으로 기운다(875).

**대안 부재가 실측으로 닫혔다** — A(capex-only) · B(sales-to-capital) · C(하한 가드 k=p05/p10/p25) · D(다모다란 원문 대체) **여섯 번 시도해 전부 실패**했다. 특히 **다모다란 자신의 처방(D)조차 비대칭비를 5.13→5.86으로 악화**시켰다(879).
🔑 **불안정성은 우리 구현의 결함이 아니라 증분형을 515사 횡단면에 자동 적용할 때의 성질이다.** 원전은 분석가가 고른 한 회사에 손으로 돌렸다.

**🔴 대가 — 숨기지 않는다**

- 커버리지 **515/515 → 465/515(90.3%)**. 계산불가 **50사**(Δ매출=0 등).
- 극단값 `|값|>1` **71 → 133** · 음수 **0 → 101**.
- **판정이 65사에서 바뀐다** — 유출 57 / 유입 8. GAP p50 11 → 10.
- 🔴 **이 행은 driver 1·4와 달리 결론이 "현행 유지"가 아니다. 모델이 실제로 바뀐다.**

**🔴 재검토 조건**: 인수(acquisitions)가 있거나 음수 재투자율이 있는 **원전급 완전 사례**를 확보하면 A안의 앵커 검증이 가능해진다(§10 #54). 그때 다시 연다.

---

## §1 — 주 판정 전환 (코드)

🔴 **스키마 변경 없음.** 컬럼은 그대로 두고 **어느 값이 판정에 들어가는지만** 바꾼다.

### 1-1. `app/api/cron/revdcf/route.ts`

```ts
const drv = { ...dr.drivers, taxRate: usTax };
```
→ **주 판정에 marginal을 넣는다.** marginal이 `null`이면 **계산하지 않는다.**

🔴 **`level`로 대체(fallback)하지 말 것.** 조용한 채움은 금지다(862 원칙 — "조용한 0 없음·explicit 제외").

```ts
// 🔴 STEP 880: driver 5 ③판정 — 주 판정 = 원전식(marginal). level은 근거 부재로 내림(879).
if (dr.drivers.fixedCapitalRateMarginal == null)
  return { ...base, skip_reason: "NO_MARGINAL_CAPEX", flags: { ...dr.flags, damodaranAsOf: damoAsOf } };
const drv = { ...dr.drivers, taxRate: usTax, fixedCapitalRate: dr.drivers.fixedCapitalRateMarginal };
```

- `fixed_capital_rate`(판정에 쓰인 값) → 이제 marginal이 들어간다.
- `fixed_capital_rate_level` · `fixed_capital_rate_marginal` **둘 다 계속 저장**한다(재현·재검토용).
- 🔴 `verdict_marginal` · `gap_years_marginal`은 이제 **주 판정과 같은 값**이 된다. **중복이지만 거짓은 아니다** — 컬럼을 지우거나 다른 값으로 채우지 말 것(컬럼명이 거짓이 된다). **중복이 되었다는 사실을 SPEC에 적는다.**
- 🔴 **`level` 기반 판정은 더 이상 저장하지 않는다.** 근거 없는 지표의 판정을 계속 쌓을 이유가 없다. 값(`fixed_capital_rate_level`)은 남으므로 재현은 가능하다.

### 1-2. `lib/revdcf/drivers.ts:70~72` 주석 정정

`fixedCapitalRate: number; // = level (기본·엔진 호환)` → **level이 기본이라는 서술이 이제 거짓이다.** 주석을 실제와 맞춘다.
🔴 `drivers.ts:191`의 반환 형태 자체는 **바꾸지 않는다**(타입 파장). 어느 값을 판정에 쓸지는 `route.ts`가 정한다 — **그 사실을 `:191`에 주석으로 남긴다.**

## §2 — 🔴 유니버스 보존 게이트 (제일 위험한 자리)

`app/api/cron/revdcf/route.ts:23` — **유니버스 = 직전 `as_of`의 CIK 집합**이다. 자기참조다.

🔴 **계산불가 50사의 행을 쓰지 않으면, 다음 날 크론이 그 50사를 유니버스에서 영구 탈락시킨다. 되돌릴 경로가 없다.**

- ✅ 현행 코드는 skip도 `{ ...base, skip_reason }`로 **행을 쓴다.** §1-1의 추가도 **같은 형태**여야 한다.
- 🔴 **검증**: 프로브로 "marginal null인 50사가 `skip_reason` 행으로 남는가"를 확인한다. `return null`·`continue`·조기 이탈이 하나라도 있으면 **중단하고 보고**할 것.

## §3 — 3중 재검증 (🔴 계산이 바뀌므로 세 패스 처음부터)

`LENS_COMPLETION_STANDARD.md` 규칙: *"불일치를 하나라도 고치면 세 패스를 처음부터 다시."* **이번은 순수 문구 정정이 아니라 실제 계산 변경이다.**

- **패스1 원전 대조** — T5 `I20` 재확인. 도미노 6년 창으로 우리 공식 = **11.617%** 재현되는지 다시 돌린다(879 프로브 재사용 가능).
- **패스2 손계산·테스트** — `engine.test.ts` 도미노 재현 **유지되는지**(T8 `C10=0.15`를 직접 넣는 테스트라 영향 없어야 한다 — 영향 있으면 보고). 🔴 **신규 테스트 2건 추가**: ⓐ `fixedCapitalRateMarginal == null`이면 `skip_reason: "NO_MARGINAL_CAPEX"` 행이 나온다 ⓑ 주 판정 경로에 **level이 들어가지 않는다**(회귀 방지 — 854의 게이팅 누락이 테스트 부재로 살아남은 선례).
- **패스3 화면 정합** — 🔴 `messages/ko.json`·`en.json`·`/revdcf` 방법론 페이지·`components/`에서 **고정자본을 "PP&E÷매출"·"자본집약도"·"수준형"으로 설명하는 문구를 전수 grep**해 정정한다. 계산불가 50사 표기는 **"산출 불가"**로(862 분기 선례 — 사유 단정 금지). 🔴 `REVDCF_ENABLED` OFF라 화면 확인은 로컬에서만.

🔴 **크론 수동 실행 금지.** `revdcf_results` 재계산은 **다음 정규 실행에 맡긴다.** 검증은 **로컬 프로브**로 한다(879 `scripts/probe_879_driver5_d.ts` 패턴 재사용, 새 스크립트는 `scripts/probe_880_switch.ts`). 🔴 **프로브 스크립트를 같은 커밋에 넣을 것**(플레이북 #78).

## §4 — 원장 정합

- `lib/revdcf/registry.ts` `incrementalFixedCapitalRate` — *"기본값=level(안정)"* → **✅ 880 확정: 주 판정 = 원전식 marginal**. 취소선 보존.
- `docs/REVDCF_SPEC.md` §12 A분류 표 `driver 5` 행 — 878이 붙인 *"875 강등·③판정 대기"*를 **확정으로 교체**. §10에 **`verdict_marginal` 컬럼 중복** 기록.
- `docs/LENS_COMPLETION_STANDARD.md` 진행표 **4행 ③판정 칸 = ✅ 원전식 채택(2026-08-03 장은태)** + 각주에 §0 근거·대가·재검토 조건.
- `docs/PRIMARY_SOURCE_MAP.md` §3 — *"level이 우리 추가물"* → 확정 반영.

### 🔴 플레이북 #79 — 이 행이 남긴 교훈

> 🔑 **"대기"는 상태가 아니다.** `CLAUDE.md`는 *"하나를 하나씩 완벽하게"*라고 적는다. driver 5는 875~879 **다섯 STEP**을 "대기"로 끌었고, 그 사이 같은 재료를 여러 번 다시 쟀다.
> **③판정이 장은태 몫이라는 것은 "누가 승인하느냐"이지 "행을 열어두라"가 아니다.** Cowork은 **결정 가능한 한 장**(단일 권고 + 근거 + 대가 + 재검토 조건)을 올려야 하고, 선택지 목록을 올리는 것은 넘긴 게 아니라 **안 끝낸 것**이다.
> 🔴 **덧붙임**: 결론이 "현행 유지"가 아닌 행은 닫는 데 비용이 든다. 그 부담이 판정 지연으로 나타나지 않는지 스스로 점검할 것.

### 🔴 Cowork 자체 정정 (같은 커밋에 기록)

Cowork이 866~879 여러 STEP의 "못 한 것"에 *"`CLAUDE.md:66`이 아직 `[3중 점검]` 블록을 의무화해 다음 세션이 위반으로 읽을 수 있다"*고 **반복해 적었다. 사실이 아니다.**
`CLAUDE.md`는 이미 이렇게 개정돼 있다(2026-08-02 장은태):

> 🔴 *"점검 자체는 그대로 한다. 다만 `[3중 점검]` 블록 출력은 생략 가능."*
> 🔴 *"블록이 없다는 이유로 '규칙 위반'이라 판단하지 말 것."*

→ **오래된 기억으로 원본을 확인하지 않고 반복 보고한 것이다.** 플레이북 **#76**(*"셀을 봐라"*)·**#77**(*"줄번호 말고 내용으로 grep"*)과 같은 유형이다. `docs/STATE.md`에 이 항목이 남아 있으면 **삭제**한다.

## §5 — 검증 · 커밋

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- data/          # 🔴 출력 없어야 함
git status --porcelain                 # 🔴 커밋 후 ?? 0건 (플레이북 #78)
```

```bash
git add -A docs/ lib/ app/ components/ messages/ scripts/
git status --porcelain
git commit -m "STEP 880: adopt the source form for fixed capital and take the level metric off the verdict

- the level metric has no connection point to the source at all: a full scan of every sheet
  found no cell computing PP&E over sales, because that is capital intensity and not a rate of
  reinvestment, and its stability is bought with a bias toward explaining the price
- the incremental form is the only one that reproduces the source anchor, so it becomes the
  verdict input; six alternatives were measured and none survived, including the one the
  literature itself prescribes, which made the asymmetry worse
- companies without the inputs are excluded explicitly rather than filled from the old metric,
  and their rows are still written so the self-referential universe does not drop them
- coverage falls to 90.3 percent and 65 verdicts change; this is recorded, not softened
- playbook 79: pending is not a state, and a row whose answer is not keep-current costs
  something to close
- also corrects a claim this assistant repeated across several steps from memory without
  reopening the file"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 ③판정 = 원전식(marginal) 채택 — 진행표 4행 ✅ 기록
§1 route.ts 주 판정 전환 · level 대체 없음 확인 · drivers.ts 주석 정정
§2 🔴 유니버스 보존 — 계산불가 50사가 skip_reason 행으로 남는가(프로브 결과)
§3 패스1 도미노 11.617% 재현 · 패스2 신규 테스트 2건 · 패스3 화면 문구 전수 grep 결과
§4 registry·SPEC·진행표·MAP 정합 · 플레이북 #79 · Cowork 자체 정정(CLAUDE.md:66)
무변경: data/ diff 없음 · REVDCF_ENABLED OFF · 크론 수동 실행 안 함
tsc 0 · test ?/? · push ? · git status ?? 0건
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **다음 행(driver 6)을 제안하지 말 것.**
