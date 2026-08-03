# STEP 879 — 프로브 재현성 복구 · driver 5 D안(원문 권고) 실측 · k 민감도

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

```
@docs/STEP_879_COMMAND.md 파일 내용대로 실행해줘
```

**전제 상태**: HEAD `42746da`(STEP 878 · `main`·`revdcf-preview` 동일) · tsc 0 · test 153/153 · `REVDCF_ENABLED` **OFF** · `revdcf_results` 604×3 · `us_market_cap` 5,887

🔴 **불변 금지선**: `REVDCF_ENABLED` OFF 유지 · `revdcf_results`·`us_market_cap` **쓰기 금지**(읽기만) · `data/us_symbols.json` 수정 금지 · `docs/PROD_ACCESS_*.md` 편집 금지.

🔴 **driver 5 ③판정 칸은 이 STEP에서도 `대기`다.** 장은태가 그렇게 정했다. **채택 제안 금지 · 다음 행 착수 제안 금지.**

---

## §1 — 🔴 재현성 복구 (878의 결함 · 명령어 쪽 잘못)

878 보고:

> *"`scripts/probe_878_driver5.ts`는 STEP의 `git add` 명령이 `docs/`·`lib/revdcf/registry.ts`만 지정해 커밋되지 않음(untracked로 남음) — 산출 JSON은 커밋됨."*

Cowork이 확인했다 — `git status --porcelain`에 **`?? scripts/probe_878_driver5.ts`** 하나 남아 있다.

🔴 **이건 878을 실행한 쪽 잘못이 아니라 878 명령어의 결함이다.** §3이 *"프로브 결과는 `docs/probe_878_driver5.json`으로 저장"*이라고만 적고 **스크립트를 어디 두고 커밋할지는 안 적었다.** `git add`가 경로를 **열거**하는 방식이라 새로 생긴 파일이 조용히 빠졌다.

→ **결과: 숫자(JSON)는 저장소에 있는데 그 숫자를 만든 코드가 없다. 지금 상태로는 878의 실측을 아무도 재현할 수 없다.**

### 할 것

1. `scripts/probe_878_driver5.ts`를 **그대로** 커밋한다(내용 수정 금지 — 878이 낸 숫자를 만든 코드 그대로여야 한다).
2. 🔴 **재실행해서 `docs/probe_878_driver5.json`이 바이트 단위로 재현되는지 확인한다.** 다르면 **다르다고 보고**하고 무엇이 달랐는지 적는다(DB `as_of`가 바뀌었을 수 있다 — 그 경우 스크립트가 `as_of`를 고정하지 않았다는 뜻이므로 그 사실을 적는다). 🔴 **JSON을 덮어써서 맞추지 말 것.**
3. `docs/LENS_DEV_PLAYBOOK.md` **#78**:
   > 🔑 *"산출물을 커밋하면 그것을 만든 스크립트도 같은 커밋에 넣는다. 숫자만 남고 코드가 없으면 재현 불가다."*
   > **재발 방지 게이트**: 커밋 직전 `git status --porcelain`을 찍고 **`??`(untracked)가 0인지** 확인한다. 의도적으로 제외하는 파일이 있으면 **이유를 보고에 적는다.** `git add`가 경로를 열거하는 STEP은 새 파일을 놓친다.

🔴 **이 게이트를 §4 커밋 절차에 실제로 넣는다.**

## §2 — 🔴 driver 5 D안: 원문이 권고한 처리 (878이 못 잰 것)

878 ③이 다모다란 원문을 찾아 이렇게 보고했다:

> *"음수 재투자율은 **'제외'가 아니라 '최근 수년 평균으로 대체'**(growth.htm)"*

🔴 **878의 C안은 '제외'(가드)였다. 원문은 '대체'다. 즉 ③이 ②의 설계를 부정했는데 ②를 다시 돌리지 않았다.**
`LENS_COMPLETION_STANDARD.md` 3중 규칙: *"불일치를 하나라도 고치면 세 패스를 처음부터 다시."* → **여기 해당한다.**

### ① 원문 재확인 — 🔴 계산 전에

`pages.stern.nyu.edu/~adamodar/New_Home_Page/valquestions/growth.htm` 및 관련 페이지에서 **직인용**으로 확정할 것:

1. **평균의 대상**: 회사 **자신의** 최근 몇 년 평균인가, **업종** 평균인가? (둘 다 언급되면 각각 어떤 경우에 쓰라는지)
2. **N(몇 년)**: 원문이 숫자를 제시하는가? 🔴 **제시하지 않으면 우리가 정하는 것이다 — 임의 상수 금지. 분포에서 유도하고 유도 과정을 적는다.**
3. **적용 대상**: 음수만인가, `|값|>1` 같은 극단값도 포함인가?
4. **대체 후에도 음수/이상이면** 어떻게 하라는가?

🔴 **원문이 애매하면 애매하다고 적는다. 추정으로 메우지 말 것.** 우리 해석이 들어간 부분은 **"원문 아님·우리 해석"**으로 표시한다.

### ② 실측 — D안

원전식(marginal · 5년 누적)을 기본으로 하고, ①에서 확정한 규칙대로 음수/이상 종목을 **대체**한다. 878과 **같은 515 모집단**(달라지면 이유를 적는다). 🔴 **읽기만. 쓰기 금지.**

878 표와 **같은 항목**을 낸다(비교 가능해야 한다):

- 커버리지(계산가능 N / 515)
- 음수 개수 · `|값|>1` 개수
- 중앙값 · p25/p75
- `years` 개수 · GAP p50·p25/p75
- 판정 이동 유출/유입 — 🔴 **비교가능만 / 계산불가포함 두 정의 병기**
- 🔴 도미노 앵커 — 재현되는가, 아니면 **도미노는 음수가 아니라 대체가 발동하지 않아 marginal과 구분 불가**인가. 후자면 그렇게 적는다(A안이 그랬듯).

### ③ 🔴 C안 k 민감도 — 878이 빠뜨린 것

878은 `k = p05 = 0.0789`로 C안을 재서 **판정 이동이 marginal과 완전히 동일(41/57)** 하게 나왔다. 즉 **가드가 아무것도 바꾸지 않았다.**
🔴 **그런데 이것이 "가드는 원리적으로 무력하다"인지 "k를 너무 낮게 잡았다"인지 878 보고로는 알 수 없다.** k를 왜 p05로 골랐는지도 적혀 있지 않다.

→ **k = p05 · p10 · p25** 세 값에서 각각 다시 재고, 위 항목을 나란히 놓는다. 🔴 **어느 k를 쓰자고 제안하지 말 것.** k가 커질수록 무엇이 좋아지고 무엇이 나빠지는지 **사실만.**

## §3 — 6안 대조표 완성 (🔴 판정 금지)

진행표 4행 각주에 **여섯 안을 한 표에** 놓는다: `level`(현행) · `marginal`(원전) · `A` capex-only · `B` sales-to-capital · `C` 하한 가드(k 3종) · `D` 원문 대체.

축은 **세 개**로 고정한다:

| 축 | 뜻 |
|---|---|
| **원전 앵커** | 도미노로 재현되는가 / 구분 불가인가 / 앵커 자체가 불가능한가 |
| **커버리지** | 계산가능 N / 515 |
| **안정성** | 음수 수 · `\|값\|>1` 수 · 판정 이동(양 정의) |

🔴 **각 칸에 "미검증"과 "불가"를 구분해 적는다.** 878에서 이미 나온 것:
- `A` — 도미노 **인수=0**이라 marginal과 구분되지 않음 = **미검증**(불가 아님)
- `B` — Book Equity 데이터 부재 = **앵커 자체 불가**
- `C` — 도미노 비율 0.614 ≫ k라 가드 **미작동** = 미검증
- `level` — 원전 어디에도 PP&E 잔액 **계산 셀 0건**(878 ①, T3~T10 전수) = 연결 지점 없음

🔴 **전부 나쁘면 "전부 나쁘다"고 적는다.** 🔴 **③판정 칸 = `대기` 그대로.** 🔴 **어느 안도 추천하지 말 것.**

## §4 — 문서 · 검증 · 커밋

- `docs/LENS_COMPLETION_STANDARD.md` 진행표 4행 각주 = 6안 대조표
- `docs/LENS_DEV_PLAYBOOK.md` #78(§1)
- `docs/REVDCF_SPEC.md` §10 — #53(3안-D 미측정)을 **해소 또는 갱신**, 남는 미측정은 새로 적기
- `docs/STATE.md` 🔴 **현재 194줄이다. 1~2p 상한을 다시 확인하고 넘으면 줄인다** — 🔴 줄일 때 **미측정·못 한 것 목록은 지우지 말 것**(그게 상한의 목적이 아니다). 지운 것이 있으면 무엇을 어디로 옮겼는지 적는다.
- `docs/CHANGELOG.md`

```bash
npx tsc --noEmit && npm run test
git diff --stat HEAD -- app/ components/ messages/ lib/ data/    # 🔴 출력 없어야 함
git status --porcelain                                            # 🔴 커밋 후 ?? 0건이어야 함
```

```bash
git add -A docs/ scripts/
git status --porcelain    # 🔴 add 후 재확인 — 남은 게 있으면 이유를 보고에 적는다
git commit -m "STEP 879: commit the probe that produced the numbers, measure the option the source actually recommends

- the previous step committed its output JSON but not the script that produced it, because the
  commit listed paths by name and a new file fell outside the list; the numbers were in the
  repository with no way to reproduce them
- Damodaran replaces negative reinvestment rates with a recent average rather than excluding
  them, which is not what the guard option measured, so the measurement is redone the way the
  source states it
- the guard option moved no verdicts at all, and the earlier run cannot distinguish a guard that
  is structurally powerless from a threshold set too low, so it is remeasured at three
  thresholds
- all six options are tabulated on the same three axes, separating unverified from impossible
- no verdict; the row stays open by decision"
git push && git push origin main:revdcf-preview
```

## §5 — 보고 후 멈춘다

```
§1 probe 스크립트 커밋 · 재실행 재현 여부(바이트 일치/불일치+원인) · 플레이북 #78 게이트
§2 ① 원문 직인용(평균 대상·N·적용범위·잔여처리) · 우리 해석 표시
   ② D안 실측표(878과 동일 항목)
   ③ C안 k=p05/p10/p25 민감도
§3 6안 대조표(원전 앵커·커버리지·안정성) · 미검증/불가 구분
§4 STATE 상한 처리(옮긴 것 명시) · SPEC §10 갱신
무변경: app/components/messages/lib/data diff 없음 · revdcf_results 604×3 · us_market_cap 5,887
tsc 0 · test ?/? · push ? · 🔴 git status ?? 0건
🔴 못 한 것 · 미측정 · 순서를 못 지킨 것
```

🔴 **driver 5 ③판정은 내리지 않는다(장은태 결정). 다음 행을 제안하지 말 것.**
