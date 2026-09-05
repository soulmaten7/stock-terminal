# STEP 883 — 🔴 인플레 판정의 빠진 대안(i=rf) 실측 · 차이 9행 7·8·9행 성격 판단

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_883_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `270ed59`(STEP 882 · `main`·`revdcf-preview` 동일) · tsc 0 · test 155/155 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` **OFF 유지** · `revdcf_results`·`us_market_cap` **쓰기 금지** · **크론 수동 실행 금지** · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.

---

## §0 — 먼저: 882의 게이트가 작동했다 (기록)

플레이북 #80(grep→목록→표시→보고→커밋)을 넣자마자 **Cowork이 못 찾은 2건을 더 찾아냈다** — `REVDCF_SPEC.md:1047`·`:1483`. 5건으로 알고 시작해 **7건**으로 끝났다.
🔴 **게이트가 없었으면 이번에도 5건만 고치고 2건이 남았을 것이다.** 이 사실을 플레이북 #80 항목에 **효과 기록**으로 한 줄 붙인다.

## §1 — 🔴 인플레 판정: 근거 하나가 실측에 안 걸려 있다

882 ④판정의 근거 중 **"대안들 자동화 부적합"**은 851의 3안(i=인플레 / i=0 / i=T8 0.016)을 가리킨다.
🔴 **그런데 882 ③검색이 찾아낸 다모다란의 문자 그대로 권고는 `i = rf`이고, 그 안은 3안에 없었다.** 882 자신도 "못 한 것"에 이렇게 적었다:

> *"i=rf 안(다모다란의 문자 그대로 권고)의 실제 GAP 영향은 재지 않음 — 저WACC 종목에서 터미널 발산 위험 포함 재측정이 남음(§10 #56)."*

🔑 **재지 않은 대안을 "부적합"이라는 근거에 포함시킬 수 없다.** 이건 875에서 driver 4의 근거 3을 철회했던 것과 **정확히 같은 구조**다(안 잰 것을 근거로 씀).
🔴 **`i = rf`는 자동화가 어렵지도 않다** — `damodaran_global_inputs.riskfree_rate`가 이미 배선돼 있다. "자동화 부적합"이 성립하지 않는다.

### ① 실측 — `i = rf` 안

515 모집단(882와 동일. 다르면 이유를 적는다). 🔴 **읽기만.**

**터미널 = `NOPAT(1+i)/(WACC−i)`이므로 `WACC ≤ i`면 식이 성립하지 않는다.** 881이 잰 WACC 분포는 **min 4.28% ~ max 11.04%(중앙 7.76%)**이고 현재 `rf = 3.95%`다.

| 재는 것 | 비고 |
|---|---|
| `WACC − rf ≤ 0`인 종목 수 | 🔴 **터미널 미성립** — 몇 사인가 |
| `WACC − rf` 가 0에 가까운 종목 분포(p01·p05·p10) | 발산 구간의 크기 |
| GAP 분포(p25/중앙/p75) · `years` 개수 | i=2.5% 대비 |
| 판정 버킷 이동 | 882가 쓴 형식 그대로(`over_cap`·`below_one`·`years`) |
| 🔴 도미노 앵커 | 원전 값(i=1.6%, rf=0.65%)에서는 **i>rf**라 이 안 자체가 원전과 반대. 재현이 아니라 **대조**로 기록 |

🔴 **터미널이 발산하거나 음수가 되는 종목을 "큰 수"로 채우지 말 것.** 산출 불가로 **명시 분리**한다(862 원칙).

### ② 🔴 판정 처리 — 셋 중 하나

실측 결과에 따라 **하나를 고른다.**

- **A. 판정 유지 + 근거 교체** — `i=rf`가 실제로 못 쓰는 것으로 나오면, *"자동화 부적합"*을 **철회**하고 *"터미널 미성립 N사 / 발산 구간 M사"*라는 **실측 근거로 교체**한다. 🔴 취소선 보존.
- **B. 판정 유지 + 근거 삭제** — `i=rf`가 쓸 만한데도 다른 근거들이 판정을 지탱하면, *"자동화 부적합"* 근거만 **삭제**하고 근거가 하나 줄었다고 적는다(875 driver 4 선례).
- **C. 판정 변경** — `i=rf`가 명백히 낫다면 판정을 바꾼다. 🔴 이 경우 **바꾸지 말고 보고하고 멈춘다**(계산 변경이므로 3중 검증 전체 재수행이 필요하고, 장은태 확인이 먼저다).

🔴 **A/B/C 중 무엇을 골랐는지와 그 이유를 반드시 명시할 것.**

## §2 — 차이 9행 **7·8·9행**: 되돌릴 수 있는 성격인가 (870 미결)

870이 이렇게 적고 판단을 미뤘고, 그 뒤 한 번도 돌아오지 않았다:

> 🔴 *"6~9행은 '되돌릴 수 있는 성격인지'부터 판단해야 한다(모집단·데이터출처는 되돌리면 플랫폼이 성립하지 않을 수 있다). 🔴 이번 STEP에서 판단하지 않았다."*

6행(인플레)은 882가 닫았다. **7·8·9행이 남았다.**

| 행 | 원전 | 우리 |
|---|---|---|
| 7 모집단 | 단일 종목 | 거래소 상장 N=2,857 |
| 8 데이터 출처 | 수기 입력 | SEC API + 다모다란 |
| 9 검증 사례 | 도미노 1건 | 도미노 재현 + 분포 3관찰 |

### 🔴 판단 틀 — 추론이 아니라 열거로

각 행에 대해 **"원전으로 되돌리면 구체적으로 무엇이 불가능해지는가"를 열거**한다. 🔴 *"플랫폼이 성립 안 한다"* 같은 뭉뚱그린 말 금지 — **코드·기능 단위로 적는다.**

- 7행 예시 형식: *"단일 종목이면 `lens_cuts` 컷 유도 불가 · `revdcf_results` 분포 관찰 불가 · 7렌즈 결합 불가 · …"* — 🔴 **실제로 코드·DB를 열어 확인하고 적을 것.** 짐작으로 적지 말 것.
- 8행: SEC API·다모다란을 수기 입력으로 되돌리면 몇 사×몇 항목을 사람이 입력해야 하는가. 🔴 **숫자로 적는다**(604사 × 입력 항목 수 등).
- 9행: 🔴 **이 행은 방향이 반대일 수 있다** — 원전은 1건, 우리는 그보다 **많다.** "되돌린다"가 무슨 뜻인지부터 정의하고, 정의가 성립하지 않으면 **"되돌림 대상이 아니다"라고 적는다.**

### 🔴 결과 처리

- **되돌릴 수 없는 행**이면 → 그 행은 **③판정 대상이 아니라 "제품 전제"**다. 🔴 **그렇게 재분류하자고 제안하지 말 것** — 사실만 적고 **장은태 판정으로 남긴다**(882의 대조표 구조 결함과 같은 자리에 묶어 적는다).
- **되돌릴 수 있는 행**이면 → 그 행은 다른 행들처럼 ①②③ 절차를 밟아야 한다. 🔴 **이번 STEP에서 착수하지 말고** 무엇을 재야 하는지만 적는다.

## §3 — 문서 · 검증 · 커밋

- `docs/LENS_COMPLETION_STANDARD.md` — 진행표 **6행 근거 정정**(§1 A/B/C 결과) · **7·8·9행**에 성격 판단 각주 · 882가 만든 "대조표 구조 결함" 기록에 7·8·9 결과 합류
- `docs/LENS_DEV_PLAYBOOK.md` — #80에 **효과 기록** 한 줄(§0) · 🔴 **#81 신설**: *"안 잰 대안을 '부적합'이라는 근거에 넣지 않는다. 근거는 실측 또는 직인용에 걸려 있어야 하며, 안 잰 것은 '안 쟀다'로 적는다."* (875 driver 4 · 882 인플레 — **두 번째**)
- `docs/REVDCF_SPEC.md` §10 — **#56 해소 또는 갱신** · 새 미측정 등재
- `lib/revdcf/registry.ts` `inflation` — 근거 정정 반영(§1 결과)
- `docs/STATE.md` 🔴 1~2p(미측정 목록 보존) · `docs/CHANGELOG.md`
- 프로브 `scripts/probe_883_i_eq_rf.ts` + `docs/probe_883_i_eq_rf.json` — 🔴 **스크립트 같은 커밋에**(#78)

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- data/ app/ components/ messages/   # 🔴 출력 없어야 함
git status --porcelain                                     # 🔴 ?? 0건
```

```bash
git add -A docs/ lib/ scripts/
git status --porcelain
git commit -m "STEP 883: measure the alternative the inflation verdict never measured, and judge whether the last three rows can be reversed at all

- the verdict rested partly on alternatives being unsuitable to automate, but the one the
  literature actually prescribes was never among them and is already wired, so it is measured
  and the ground is repaired to match what the measurement shows
- playbook 81: a ground may not rest on an alternative that was never measured; this is the
  second time the same shape of ground had to be repaired
- the last three rows were deferred long ago on the question of whether reversing them is even
  possible; that question is answered by enumerating what specifically stops working, in code
  and data terms rather than in the abstract
- reclassification is recorded, not performed"
git push && git push origin main:revdcf-preview
```

## §4 — 보고 후 멈춘다

```
§0 플레이북 #80 효과 기록(5건→7건)
§1 ① i=rf 실측: WACC−rf≤0 종목 수 · 발산 구간 분포 · GAP · 판정버킷 이동 · 도미노 대조
   ② 🔴 A/B/C 중 무엇을 골랐는가 + 이유 · 진행표 6행 근거 정정 내용
§2 7·8·9행 성격 판단 — 각 행마다 "되돌리면 불가능해지는 것" 열거(코드·DB 확인 기반)
   🔴 9행의 "되돌림" 정의가 성립하는가
   🔴 재분류 제안 안 함 — 장은태 대기 항목으로 기록
§3 플레이북 #80 효과·#81 신설 · SPEC §10 #56 처리 · registry
무변경: data/app/components/messages diff 없음 · REVDCF_ENABLED OFF · 크론 미실행 · revdcf_results 604×3
tsc 0 · test ?/? · push ? · git status ?? 0건
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **판정을 바꾸는 경우(C)는 바꾸지 말고 보고하고 멈출 것. 다음 행 착수 제안 금지.**
