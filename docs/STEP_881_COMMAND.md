# STEP 881 — 차이 9행 5행: driver 6 자본비용 · 원전 대조 → ③판정까지

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_881_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `c260ee3`(STEP 880 · `main`·`revdcf-preview` 동일) · tsc 0 · test **155/155** · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3(**아직 level 기반** — marginal 전환은 다음 정규 크론부터) · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.

🔴 **이 STEP은 ③판정까지 간다. "대기"로 끝내지 말 것**(플레이북 #79). 재료가 부족해 판정할 수 없다면 **무엇이 부족한지와 그것을 얻는 방법**을 적고, 그것도 안 되면 **왜 원리적으로 불가능한지**를 적는다.

---

## §0 — Cowork 독립 확인 (880 사후)

880 §2의 유니버스 보존을 Cowork이 코드로 직접 재확인했다 — `route.ts:24~26`의 유니버스 질의는

```ts
sb.from("revdcf_results").select("cik, symbol").eq("as_of", prevAsOf)
```

로 **`verdict`·`skip_reason` 어떤 필터도 걸지 않는다.** → `NO_MARGINAL_CAPEX` 50사도 유니버스에 남는다. **880의 조치가 실제로 성립한다.** 🔴 이 확인 사실을 `docs/STATE.md`에 한 줄로 남길 것.

## §1 — ① 원전 재개봉 (🔴 셀로 본다 · 플레이북 #76)

`data/sources/expectations-investing/T7.xlsx` **전 시트**. 877이 `Inputs`·`WACC`만 봤다.

**확정할 것 — 전부 셀 좌표와 함께**

1. `Inputs` 전 셀: rf `C4=0.0065` · YTM `C5=0.04546` · ERP `C7=0.051` · **Beta `C8=1`** · 세율 `C10=0.165` — **그 외 셀이 더 있는가.**
2. `WACC` 시트의 **가중치**를 어떻게 잡는가 — 부채·자기자본 비중이 **시장가**인가 장부가인가. 셀 수식으로 확인.
3. 🔴 **베타 1이 "도미노 값"인가 "방법론"인가** — `Tutorial 8` 서술이 베타를 **어떻게 구하라**고 하는가(회귀? 업종? 그냥 1?). 🔴 **서술과 셀이 다르면 셀이 이긴다. 불일치를 기록한다.**
4. 🔴 **부채비용에 회사별 YTM을 쓰라는 것이 방법론인가** — 서술에서 확인. 신용등급·합성등급을 언급하는가.
5. `T9`·`T10`에 WACC 관련 시트가 있는가(877이 안 봤다).

## §2 — ② DB 실측 (🔴 읽기만)

### 2-1. 우리 WACC 분포

`revdcf_results` 최신 `as_of`, 515 모집단(878·879와 동일. 다르면 이유를 적는다):

- `wacc` 분포: min·p05·p25·중앙·p75·p95·max · N
- 구성요소 분해: `beta_unlevered` · `de_ratio` · 재레버리지 베타 · 자기자본비용 · 세후부채비용 · 부채가중치 각각의 분포
- 🔴 **원전 도미노 WACC `0.05354`가 우리 분포의 어디인가**(백분위). **877이 미측정으로 남긴 것.**

### 2-2. 🔴 방법 차이와 시점 차이를 분리한다 (이 STEP의 핵심)

기록된 사실: **도미노 우리 7.19%(2026 rf 3.95%) vs 원전 5.357%(2020 rf 0.65%)** → GAP **8→23년**.
🔴 **이 차이의 거의 전부가 WACC인데, 그것이 "방법이 달라서"인지 "시점이 달라서"인지 분리된 적이 없다.** 분리하지 않으면 판정이 왜곡된다.

**분해 실험 — 도미노 하나로, 한 번에 하나씩만 바꾼다:**

| 단계 | rf | ERP | 베타 | 부채비용 | 세율 | WACC | GAP |
|---|---|---|---|---|---|---|---|
| 0 원전 그대로 | 0.0065 | 0.051 | **1** | YTM 0.04546 | 0.165 | 0.05354(기대) | 8(기대) |
| 1 rf·ERP만 현재로 | 현재 | 현재 | 1 | YTM | 0.165 | ? | ? |
| 2 + 베타를 우리 방식으로 | 현재 | 현재 | 업종재레버리지 | YTM | 0.165 | ? | ? |
| 3 + 부채비용을 우리 방식으로 | 현재 | 현재 | 업종 | 합성스프레드 | 0.165 | ? | ? |
| 4 = 완전 우리 방식 | 현재 | 현재 | 업종 | 합성스프레드 | 0.2563 | 7.19(기대) | 23(기대) |

🔴 **각 단계가 GAP을 몇 년 움직이는지** 낸다. **시점(1단계)이 대부분이면 driver 6은 "방법 차이"가 아니라 "값 차이"다** — 877이 driver 3에서 제기한 것과 같은 분류 문제다. 🔴 **분류 이동은 이 STEP에서 하지 말고 판정 각주에 적는다.**

### 2-3. 🔴 우리 방식 안에서 검증할 두 가지

877·MAP이 짚지 않은 자리다. **코드를 열고 확인한 뒤 실측한다.**

1. **`creditSpreadFor`가 `std_dev_equity`(주가 표준편차)로 스프레드 밴드를 고른다**(`compute.ts:41`). 🔴 다모다란의 합성등급은 통상 **이자보상배율**을 기준으로 한다 — 주가 표준편차 표는 **다른 용도**일 수 있다. ③에서 원문 확인 후, 우리 유니버스에서 **이자보상배율을 조달할 수 있는지 커버리지**를 실측한다.
2. **`assembleWacc`가 `unleveredBetaCashAdj`를 재레버리지한다**(`compute.ts:31`). 🔴 다모다란의 **현금조정 무차입 베타**는 이미 현금 효과를 걷어낸 값이다 — 그것을 그대로 재레버리지하는 절차가 그의 권고와 같은지 ③에서 확인한다. **다르면 이중 처리다.**

🔴 **둘 다 "확인 결과 문제 없음"이면 그렇게 적는다.** 없는 문제를 만들지 말 것.

## §3 — ③ 검색 (🔴 결론 전에 · 직인용)

`pages.stern.nyu.edu/~adamodar/` 원문에서 확정할 것:

1. **합성등급(synthetic rating)의 기준 변수** — 이자보상배율인가, 주가 표준편차인가, 둘 다인가(어떤 경우에 어느 쪽인가).
2. **현금조정 무차입 베타의 재레버리지 절차** — 재레버리지 후 현금을 되돌리라고 하는가.
3. **회사별 실제 YTM vs 합성 스프레드** — 그가 무엇을 권고하는가. 상장 채권이 없는 회사에 대한 처방.
4. rf·ERP를 **연 단위 다모다란 값**으로 쓰는 것과 **일간 FRED**의 차이를 그가 언급하는가(registry `open`의 미결 항목).

🔴 **못 찾으면 "못 찾음"으로 적는다.** 추정으로 메우지 말 것.

## §4 — 🔴 ③판정

②·③이 끝나면 **판정한다.** 형식은 driver 1·4·5와 동일:

> **③판정**: (현행 유지 / 원전 채택 / 제3안) — **하나만.**
> **근거**: 번호 매겨 나열. 각 근거는 **실측 또는 직인용**에 걸려 있어야 한다.
> **🔴 대가**: 이 판정이 잃는 것. 숨기지 않는다.
> **🔴 불리한 사실**: 판정에 반하는 관찰. 반드시 적는다.
> **🔴 재검토 조건**: 무엇이 확보되면 다시 여는가.

🔴 **선택지 목록으로 끝내지 말 것.** 🔴 **판정 근거가 §2-2의 분해 결과와 모순되면 판정을 바꾸지 말고 모순을 적고 멈춘다.**

## §5 — 문서 · 검증 · 커밋

- `docs/LENS_COMPLETION_STANDARD.md` 진행표 **5행(driver 6)** — 실측·검색 칸을 채우고 ③판정 기록. 877이 넣은 "미판정 기록"은 **취소선 보존**하고 확정으로 교체.
- `lib/revdcf/registry.ts` `costOfCapital` — 878이 나눈 두 축 중 **원전 대조 판정 축**을 확정으로. `open` 항목(rf 일간 변형)은 ③ 결과대로 갱신.
- `docs/PRIMARY_SOURCE_MAP.md` §4 — `Inputs C8 Beta=1` 등 셀 좌표 반영. *"registry 미결"* 서술 정정.
- `docs/REVDCF_SPEC.md` §11에 T7 전 시트 판독 · §10 미결 갱신(#51 도미노 WACC 대조 **해소**)
- `docs/STATE.md` §0 확인 한 줄 · 🔴 1~2p 상한(미측정 목록은 지우지 말 것)
- `docs/CHANGELOG.md`
- 프로브는 `scripts/probe_881_wacc.ts` + `docs/probe_881_wacc.json` — 🔴 **스크립트를 같은 커밋에**(플레이북 #78)

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- data/     # 🔴 출력 없어야 함
git status --porcelain            # 🔴 커밋 후 ?? 0건
```

```bash
git add -A docs/ lib/ scripts/
git status --porcelain
git commit -m "STEP 881: compare the cost of capital against the source and decide the row

- open every sheet of the WACC workbook and record what the cells hold, including whether the
  beta of one is a value for this company or the method the text teaches
- separate how much of the Domino gap difference comes from the method and how much from the
  risk-free rate simply being a different year, which had never been measured
- check two things inside our own assembly: which variable the synthetic spread table is keyed
  on, and whether re-levering a cash-adjusted unlevered beta double-treats cash
- verdict recorded with its grounds, its cost, the observation that argues against it, and the
  condition that reopens it"
git push && git push origin main:revdcf-preview
```

## §6 — 보고 후 멈춘다

```
§0 유니버스 질의 무필터 재확인 기록
§1 T7 전 시트 셀 판독(가중치 시장가/장부가 · 베타 1의 성격 · YTM 방법론 여부 · T9/T10)
§2 2-1 우리 WACC 분포 + 원전 0.05354의 백분위
   2-2 🔴 분해 실험 5단계 — 각 단계의 WACC·GAP 이동(시점 vs 방법 분리)
   2-3 합성스프레드 기준 변수 · 현금조정 베타 재레버리지 — 문제 유무
§3 다모다란 직인용 4건(못 찾은 건 "못 찾음")
§4 🔴 ③판정 + 근거·대가·불리한 사실·재검토 조건
§5 진행표 5행·registry·MAP·SPEC·STATE
무변경: data/ diff 없음 · REVDCF_ENABLED OFF · 크론 수동 실행 안 함 · revdcf_results 604×3
tsc 0 · test ?/? · push ? · git status ?? 0건
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **다음 행을 제안하지 말 것.**
